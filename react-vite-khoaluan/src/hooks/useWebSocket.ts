// src/hooks/useWebSocket.ts

import { useEffect, useRef, useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { addMessage } from "@/redux/slice/chatSlice";
import { useUsersConnected } from "./useUsersConnected"; // Giả sử bạn có hook này
import { UserInfo } from "@/types/backend"; // Giả sử bạn có type này
import { toast } from "react-toastify";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { formatDate } from "@/utils/formatDate"; // Import từ file mới

export const useWebSocket = () => {
  const stompClientRef = useRef<any>(null);
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

  const onUserStatusChange = useCallback((payload: { body: string }) => {
    const updatedUser = JSON.parse(payload.body);
    setConnectedUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.email === updatedUser.email ? { ...u, status: updatedUser.status } : u
      )
    );
  }, []);

  const handleDisconnect = useCallback(() => {
    if (
      stompClientRef.current?.connected &&
      user?.email &&
      !hasDisconnectedRef.current
    ) {
      hasDisconnectedRef.current = true;
      stompClientRef.current.send(
        "/app/user.disconnectUser",
        {},
        JSON.stringify({
          id: user.id,
          email: user.email,
          status: "OFFLINE",
        })
      );
      stompClientRef.current.disconnect(() => {
        // console.log("Disconnected from WebSocket.");
      });
      stompClientRef.current = null;
    }
  }, [user]);

  // Main WebSocket Connection Effect
  useEffect(() => {
    if (!user?.email) return;

    const onMessageReceived = (payload: { body: string }) => {
      const notification = JSON.parse(payload.body);
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
          time: formatDate(new Date(timeStamp)), // Dùng hàm đã import
        };
        dispatch(addMessage(newMessage));
      }
    };

    if (stompClientRef.current) {
      return;
    }

    hasDisconnectedRef.current = false;
    const socket = new SockJS(`${import.meta.env.VITE_BACKEND_URL}/ws`);
    const client = Stomp.over(socket);
    stompClientRef.current = client;

    client.debug = () => {};

    client.connect({}, () => {
      client.subscribe(`/user/${user.email}/queue/messages`, onMessageReceived);
      client.subscribe("/topic/public", onUserStatusChange);
      client.send(
        "/app/user.addUser",
        {},
        JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          company: user.company,
          status: "ONLINE",
        })
      );

      const heartbeatInterval = setInterval(() => {
        if (stompClientRef.current?.connected) {
          stompClientRef.current.send(
            "/app/heartbeat.ping",
            {},
            JSON.stringify({ email: user.email })
          );
        }
      }, 3000);
    });

    return () => {
      handleDisconnect();
    };
  }, [user, dispatch, onUserStatusChange, handleDisconnect]);

  // Effect xử lý sự kiện đóng tab/trình duyệt
  useEffect(() => {
    window.addEventListener("beforeunload", handleDisconnect);
    return () => {
      window.removeEventListener("beforeunload", handleDisconnect);
    };
  }, [handleDisconnect]);

  // Trả về client để component có thể dùng cho Context
  return { stompClient: stompClientRef.current };
};
