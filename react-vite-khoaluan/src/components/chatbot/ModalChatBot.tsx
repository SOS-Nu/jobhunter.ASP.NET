// src/components/chatbot/ModalChatBot.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdSend, IoMdClose } from "react-icons/io";
import { RiRobot2Line } from "react-icons/ri";
import { CiUser, CiLink } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { message } from "antd"; // Bạn đã dùng Antd
import { Spinner, InputGroup, Form, Button } from "react-bootstrap"; // Dùng React-Bootstrap
import { askGemini, askGeminiWithPDF } from "./gemini";

// Import file SCSS mới
import "./ModalChatBot.scss";
import { useCurrentApp } from "../context/app.context";
interface IChatMessage {
  username: string;
  message: string | undefined; // <- Cho phép undefined
  time: string;
}

// Lấy HOC withErrorBoundary từ project của bạn (nếu có)
// import withErrorBoundary from '../../hoc/withErrorBoundary';

interface IProps {
  setShowChatbot: (show: boolean) => void;
}

const ModalChatBot = ({ setShowChatbot = () => {} }: IProps) => {
  const { theme } = useCurrentApp();

  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState<IChatMessage[]>([
    // <- Khai báo kiểu ở đây
    {
      username: "Chatbot",
      message: "Chào bạn 👋 Tôi có thể giúp gì cho bạn hôm nay?",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null); // Dùng ref cho recognition

  const chatHistoryRef = useRef<HTMLDivElement>(null); // Ref cho khung chat

  // Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Khởi tạo SpeechRecognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "vi-VN";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        // Dùng setTimeout để đảm bảo state `isListening` cập nhật
        setTimeout(() => handleAsk(transcript), 50);
      };

      recognition.onerror = (event) => {
        console.error("Lỗi nhận dạng giọng nói:", event.error);
        if (
          event.error === "not-allowed" ||
          event.error === "service-not-allowed"
        ) {
          message.error("Bạn cần cấp quyền sử dụng microphone.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (error) {
        console.error("Lỗi khi bắt đầu ghi âm:", error);
        setIsListening(false);
      }
    }
  };

  const handleAsk = async (inputOption?: string) => {
    const currentInput = inputOption ?? input;
    if (!currentInput.trim() && file === null) {
      if (!inputOption) {
        // Chỉ cảnh báo khi không phải là click gợi ý
        message.warning("Vui lòng nhập câu hỏi cho Chatbot.");
      }
      return;
    }

    const userMessage = {
      username: "User",
      message: currentInput,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatHistory((prevHistory) => [
      ...prevHistory,
      userMessage,
      {
        username: "Chatbot",
        message: "Loading...",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setInput("");
    const currentFile = file; // Lưu lại file
    setFile(null); // Reset input file

    try {
      let answer;
      if (currentFile) {
        answer = await askGeminiWithPDF(currentFile, currentInput);
      } else {
        answer = await askGemini(currentInput);
      }

      const geminiMessage = {
        username: "Chatbot",
        message: answer,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setChatHistory((prevHistory) => {
        const updatedHistory = [...prevHistory];
        updatedHistory[updatedHistory.length - 1] = geminiMessage;
        return updatedHistory;
      });
    } catch (error) {
      console.error("Error fetching the response:", error);
      const errorMessage = {
        username: "Chatbot",
        message: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.",
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setChatHistory((prevHistory) => {
        const updatedHistory = [...prevHistory];
        updatedHistory[updatedHistory.length - 1] = errorMessage;
        return updatedHistory;
      });
    }
  };

  return (
    // AnimatePresence đã được đặt ở LayoutClient
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.3 }}
      className="chatbot-modal"
    >
      <div className="chatbot-header">
        <h2>
          <RiRobot2Line size={20} />
          <span className="tilte-chatbot"> ChatBot AI</span>
        </h2>
        <button
          className="chatbot-close-btn"
          onClick={() => setShowChatbot(false)}
        >
          <IoMdClose />
        </button>
      </div>

      <div className="chat-history" ref={chatHistoryRef}>
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`chat-message ${
              chat.username === "User" ? "message-user" : "message-bot"
            }`}
          >
            <div className="message-bubble">
              <div className="message-meta">
                {chat.username === "User" ? (
                  <CiUser size={16} />
                ) : (
                  <RiRobot2Line size={18} />
                )}
                <span className="message-username">{chat.username}</span>
                <span className="message-time">{chat.time}</span>
              </div>
              <div className="message-content">
                {chat.message === "Loading..." ? (
                  <div className="text-center">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : (
                  <>
                    <div
                      dangerouslySetInnerHTML={{
                        __html: chat.message as string,
                      }}
                    />
                    {/* Chỉ hiển thị gợi ý ở tin nhắn chào mừng */}
                    {index === 0 && (
                      <div className="suggestion-list">
                        <span
                          onClick={() => handleAsk("tôi muốn tìm việc làm")}
                          className="suggestion-item"
                        >
                          1. Tìm công việc
                        </span>
                        <span
                          onClick={() =>
                            handleAsk("tôi muốn hỏi về lĩnh vực nào đó")
                          }
                          className="suggestion-item"
                        >
                          2. Hỏi đáp lĩnh vực
                        </span>
                        <span
                          onClick={() => navigate("/cv-ai")} // Dùng route của bạn
                          className="suggestion-item"
                        >
                          3. Review CV by AI
                        </span>
                        <span
                          onClick={() =>
                            handleAsk(
                              "hiện đang có những công ty tuyển dụng nào?"
                            )
                          }
                          className="suggestion-item"
                        >
                          4. Danh sách công ty
                        </span>
                        <span
                          onClick={() =>
                            handleAsk("giúp tôi tạo 1 cover letter được không?")
                          }
                          className="suggestion-item"
                        >
                          5. Tạo thư xin việc
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="chatbot-input-area">
        {file && (
          <p className="file-info" title={file.name}>
            📎 {file.name}
          </p>
        )}
        <InputGroup>
          <Form.Control
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (input.trim() || file)) {
                handleAsk();
              }
            }}
            placeholder="Nhập câu hỏi của bạn..."
          />

          {/* Nút upload file */}
          <Button variant="light" className="btn-upload" as="label">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
              className="hidden"
            />
            <CiLink size={18} />
          </Button>

          {/* Nút voice */}
          {recognitionRef.current && (
            <Button
              variant="danger"
              className={`btn-voice ${isListening ? "listening" : ""}`}
              onClick={startListening}
              disabled={isListening}
            >
              {isListening ? (
                <FaMicrophoneSlash size={18} />
              ) : (
                <FaMicrophone size={18} />
              )}
            </Button>
          )}

          {/* Nút gửi */}
          <Button
            variant="primary"
            onClick={() => handleAsk()}
            disabled={!input.trim() && !file}
          >
            <IoMdSend size={16} />
          </Button>
        </InputGroup>
      </div>
    </motion.div>
  );
};

export default ModalChatBot; // Bỏ HOC nếu bạn không dùng
// export default withErrorBoundary(ModalChatBot); // Giữ lại nếu bạn có HOC này
