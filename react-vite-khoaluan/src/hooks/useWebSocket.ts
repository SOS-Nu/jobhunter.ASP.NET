// src/hooks/useWebSocket.ts

import { useEffect, useRef, useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addMessage } from "@/redux/slice/chatSlice";
import { useUsersConnected } from "./useUsersConnected";
import { UserInfo } from "@/types/backend";
import { toast } from "react-toastify";
import * as signalR from "@microsoft/signalr";
import { formatDate } from "@/utils/formatDate";

export const useWebSocket = () => {
  const signalRConnectionRef = useRef<signalR.HubConnection | null>(null);
  const stompWrapperRef = useRef<any>(null);
  const hasDisconnectedRef = useRef(false);

  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.account.user);
  const activeChatUserId = useAppSelector(
    (state) => state.chat.activeChatUserId
  );

  const { res: resUsersConnected } = useUsersConnected();
  const [connectedUsers, setConnectedUsers] = useState<UserInfo[]>([]);

  useEffect(() => {
    if (resUsersConnected?.data) {
      setConnectedUsers(resUsersConnected.data);
    }
  }, [resUsersConnected]);

  const activeChatUserIdRef = useRef(activeChatUserId);
  const connectedUsersRef = useRef(connectedUsers);

  useEffect(() => {
    activeChatUserIdRef.current = activeChatUserId;
    connectedUsersRef.current = connectedUsers;
  }, [activeChatUserId, connectedUsers]);

  const onUserStatusChange = useCallback((updatedUser: any) => {
    setConnectedUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.email === updatedUser.email ? { ...u, status: updatedUser.status } : u
      )
    );
  }, []);

  const handleDisconnect = useCallback(() => {
    if (
      signalRConnectionRef.current?.state === signalR.HubConnectionState.Connected &&
      user?.email &&
      !hasDisconnectedRef.current
    ) {
      hasDisconnectedRef.current = true;
      signalRConnectionRef.current.invoke("DisconnectUser", {
        id: user.id,
        email: user.email,
        status: "OFFLINE",
      });
      signalRConnectionRef.current.stop();
      signalRConnectionRef.current = null;
    }
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;

    if (signalRConnectionRef.current) {
      return;
    }

    const token = window.localStorage.getItem("access_token") || "";

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_BACKEND_URL}/ws`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    signalRConnectionRef.current = connection;
    hasDisconnectedRef.current = false;

    // Fake stomp client for compatibility with ChatPage.tsx
    stompWrapperRef.current = {
      send: (destination: string, headers: any, body: string) => {
        const payload = JSON.parse(body);
        if (destination === "/app/chat") {
            connection.invoke("SendMessage", payload);
        } else if (destination === "/app/user.disconnectUser") {
            connection.invoke("DisconnectUser", payload);
        } else if (destination === "/app/user.addUser") {
            connection.invoke("AddUser", payload);
        }
      }
    };

    connection.on("UserConnected", (u) => {
        u.status = "ONLINE";
        onUserStatusChange(u);
    });

    connection.on("UserDisconnected", (u) => {
        u.status = "OFFLINE";
        onUserStatusChange(u);
    });

    connection.on("ReceiveMessage", (notification) => {
      const { senderId, content, timeStamp } = notification;

      setConnectedUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === senderId
            ? {
                ...u,
                lastMessage: {
                  content: content,
                  senderId: senderId,
                  timestamp: timeStamp,
                },
              }
            : u
        )
      );

      const sender = connectedUsersRef.current.find((u) => u.id === senderId);

      if (senderId !== activeChatUserIdRef.current) {
        const senderName =
          sender?.company?.name || sender?.name || "Một người dùng";
        toast.info(`Bạn có tin nhắn mới từ ${senderName}`);
      }

      if (user && senderId === activeChatUserIdRef.current) {
        const newMessage = {
          type: "receiver",
          content: content,
          time: formatDate(new Date(timeStamp)),
        };
        dispatch(addMessage(newMessage));
      }
    });

    connection.start().then(() => {
        connection.invoke("AddUser", {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            company: user.company,
            status: "ONLINE"
        });
    }).catch(err => console.error("SignalR Connection Error: ", err));

    return () => {
      handleDisconnect();
    };
  }, [user, dispatch, onUserStatusChange, handleDisconnect]);

  useEffect(() => {
    window.addEventListener("beforeunload", handleDisconnect);
    return () => {
      window.removeEventListener("beforeunload", handleDisconnect);
    };
  }, [handleDisconnect]);

  return { stompClient: stompWrapperRef.current };
};
