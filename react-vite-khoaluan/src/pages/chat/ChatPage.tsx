import { useCallback, useEffect, useState, useRef } from "react";
import { useLocation, useOutletContext, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setActiveChatUserId,
  setMessages,
  addMessage,
} from "@/redux/slice/chatSlice";
import { getAllMessages } from "@/config/api";
import { useUsersConnected } from "@/hooks/useUsersConnected";
import { toast } from "react-toastify";
import defaultAvatar from "@/assets/avatar.svg";
import "@/styles/stylespotfolio/chat/detail.scss";
import { UserInfo } from "@/types/backend";
import { ArrowLeft } from "react-bootstrap-icons";

const ChatPage = () => {
  const { stompClient } = useOutletContext<{ stompClient: any }>();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const user = useAppSelector((state) => state.account.user);
  const messages = useAppSelector((state) => state.chat.messages);

  const [userSelected, setUserSelected] = useState<UserInfo | null>(null);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [connectedUsers, setConnectedUsers] = useState<UserInfo[]>([]);
  // State mới để quản lý giao diện mobile
  const [isChatVisible, setIsChatVisible] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { res: resUsersConnected } = useUsersConnected();
  const { state } = useLocation() as {
    state?: { receiver?: UserInfo; receiverId?: number };
  };

  // Khi danh sách online/connected đổi, hoặc khi state thay đổi → chọn theo id
  useEffect(() => {
    const wantedId = state?.receiverId ?? state?.receiver?.id;
    if (!wantedId) return;

    const match = connectedUsers.find((u) => u.id === wantedId);
    if (match) {
      setUserSelected(match); // Ưu tiên object trong list (đảm bảo highlight đồng nhất)
    } else if (state?.receiver) {
      setUserSelected(state.receiver); // Fallback nếu người đó chưa có trong list (offline/chưa load)
    }
  }, [connectedUsers, state]);

  // Cập nhật danh sách người dùng online
  useEffect(() => {
    if (resUsersConnected?.data) {
      setConnectedUsers(resUsersConnected.data);
    }
  }, [resUsersConnected]);

  // Khi có user được chọn (từ state hoặc click), hiển thị màn hình chat trên mobile
  useEffect(() => {
    if (userSelected) {
      setIsChatVisible(true);
    }
  }, [userSelected]);

  // Cập nhật active chat user trong Redux store
  useEffect(() => {
    document.title = "Tin nhắn";
    dispatch(setActiveChatUserId(userSelected?.id ?? null));

    return () => {
      dispatch(setActiveChatUserId(null));
    };
  }, [userSelected, dispatch]);

  const formatDate = (timestamp: any) => {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Ngày không hợp lệ";
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfYesterday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );
    const startOfMessageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const timeString = `${hours}:${minutes}`;

    if (startOfMessageDate.getTime() === startOfToday.getTime())
      return timeString;
    if (startOfMessageDate.getTime() === startOfYesterday.getTime())
      return `Hôm qua lúc ${timeString}`;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${timeString} ${day}/${month}/${year}`;
  };

  // Lấy tin nhắn cũ khi chọn một người dùng
  const fetchAllMessages = useCallback(async () => {
    if (!user?.id || !userSelected?.id) return;
    try {
      const res = await getAllMessages(+user.id, +userSelected.id);
      if (+res?.statusCode === 200) {
        const formattedMessages = (res.data ?? []).map((data: any) => ({
          type: data?.sender?.id === user.id ? "sender" : "receiver",
          content: data?.content,
          time: formatDate(data?.timeStamp),
        }));
        dispatch(setMessages(formattedMessages));
      } else {
        toast.error("Lỗi khi tải tin nhắn!");
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }, [user?.id, userSelected?.id, dispatch]);

  useEffect(() => {
    if (userSelected?.id) {
      fetchAllMessages();
    } else {
      dispatch(setMessages([]));
    }
  }, [userSelected?.id, fetchAllMessages, dispatch]);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() && stompClient && userSelected && user) {
      const chatMessage = {
        sender: { id: user.id, name: user.name },
        receiver: { id: userSelected.id },
        content: inputMessage.trim(),
        timeStamp: new Date().toISOString(),
      };
      stompClient.send("/app/chat", {}, JSON.stringify(chatMessage));

      const newMessage = {
        type: "sender",
        content: inputMessage.trim(),
        time: formatDate(new Date()),
      };
      dispatch(addMessage(newMessage));
      setInputMessage("");
    }
  };

  // Hàm xử lý khi click nút "back" trên mobile
  const handleBackToUserList = () => {
    setIsChatVisible(false);
    setUserSelected(null);
    // Tùy chọn: Xóa user đã chọn để quay về màn hình placeholder
    // setUserSelected(null);
  };

  if (!user?.id) return null;

  // Thêm class `show-chat-main` khi `isChatVisible` là true
  const containerClassName = `chat-container ${isChatVisible ? "show-chat-main" : ""}`;

  return (
    <div className={containerClassName}>
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <input
            type="search"
            placeholder="Tìm kiếm người dùng..."
            className="form-control"
          />
        </div>
        <div className="user-list">
          {[...connectedUsers]
            .sort((a, b) => {
              const aTime = a.lastMessage?.timestamp;
              const bTime = b.lastMessage?.timestamp;
              if (!bTime) return -1;
              if (!aTime) return 1;
              return new Date(bTime).getTime() - new Date(aTime).getTime();
            })
            .filter((u) => u.id !== user.id)
            .map((u: UserInfo) => (
              <div
                key={u.id}
                className={`user-item ${
                  userSelected?.id === u.id ? "active" : ""
                }`}
                onClick={() => setUserSelected(u)}
              >
                <div className="position-relative">
                  <img
                    src={
                      u.company?.logoUrl
                        ? `${
                            import.meta.env.VITE_BACKEND_URL
                          }/storage/company/${u.company.logoUrl}`
                        : u.avatar
                          ? `${
                              import.meta.env.VITE_BACKEND_URL
                            }/storage/avatar/${u.avatar}`
                          : defaultAvatar
                    }
                    alt={u.company?.name || u.name}
                    className="user-avatar"
                  />
                  <span
                    className={`status-indicator ${
                      u.status === "ONLINE" ? "online" : "offline"
                    }`}
                  ></span>
                </div>
                <div className="user-info">
                  <h6 className="user-name">{u.company?.name || u.name}</h6>
                  <div className="last-message-preview">
                    <span className="last-message-content">
                      {u.lastMessage ? (
                        <>
                          {u.lastMessage.senderId === user.id && (
                            <strong>Bạn: </strong>
                          )}
                          {u.lastMessage.content}
                        </>
                      ) : u.status === "ONLINE" ? (
                        "Online"
                      ) : (
                        "Offline"
                      )}
                    </span>
                    {u.lastMessage?.timestamp && (
                      <small className="last-message-time">
                        {formatDate(u.lastMessage.timestamp)}
                      </small>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </aside>

      <main className="chat-main">
        {userSelected?.id ? (
          <>
            <header className="chat-header">
              {/* --- NÚT BACK SẼ ĐƯỢC HIỂN THỊ TRÊN MOBILE QUA CSS --- */}
              <button className="back-button" onClick={handleBackToUserList}>
                {/* THAY THẾ DÒNG NÀY */}
                <ArrowLeft />
              </button>
              <img
                src={
                  userSelected.company?.logoUrl
                    ? `${import.meta.env.VITE_BACKEND_URL}/storage/company/${
                        userSelected.company.logoUrl
                      }`
                    : userSelected.avatar
                      ? `${import.meta.env.VITE_BACKEND_URL}/storage/avatar/${
                          userSelected.avatar
                        }`
                      : defaultAvatar
                }
                alt={userSelected.company?.name || userSelected.name}
                className="user-avatar"
              />
              <div className="user-info">
                <a
                  href={
                    userSelected.company?.id
                      ? `/company/${userSelected.company.name.toLowerCase().replace(/\s+/g, "-")}?id=${userSelected.company.id}`
                      : `/user/online-resumes/${userSelected.id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="user-name-link"
                >
                  <h5 className="user-name mb-0">
                    {userSelected.company?.name || userSelected.name}
                  </h5>
                </a>
                <span
                  className={
                    userSelected.status === "ONLINE"
                      ? "text-success small"
                      : "text-secondary small"
                  }
                >
                  <i className="bi bi-circle-fill me-1"></i>
                  {userSelected.status === "ONLINE" ? "Online" : "Offline"}
                </span>
              </div>
            </header>
            <div className="message-area">
              {messages.map((message: any, index: any) => {
                const isSender = message.type === "sender";
                return (
                  <div
                    key={index}
                    className={`message-wrapper ${
                      isSender ? "sender" : "receiver"
                    }`}
                  >
                    {!isSender && (
                      <img
                        src={
                          userSelected.company?.logoUrl
                            ? `${
                                import.meta.env.VITE_BACKEND_URL
                              }/storage/company/${
                                userSelected.company?.logoUrl
                              }`
                            : userSelected.avatar
                              ? `${
                                  import.meta.env.VITE_BACKEND_URL
                                }/storage/avatar/${userSelected.avatar}`
                              : defaultAvatar
                        }
                        alt="avatar"
                        className="message-avatar"
                      />
                    )}
                    <div className="message-content">
                      <div className="message-bubble">
                        <p className="mb-0">{message.content}</p>
                      </div>
                      <small className="message-time">{message.time}</small>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <footer className="chat-footer">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Nhập tin nhắn..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleSendMessage}
                >
                  <i className="bi bi-send-fill"></i> Gửi
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="no-chat-selected">
            <h4>Chọn một người dùng để bắt đầu trò chuyện</h4>
            <p>Cuộc trò chuyện của bạn sẽ xuất hiện ở đây.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
