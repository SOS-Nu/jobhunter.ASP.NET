// src/redux/slice/chatSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  activeChatUserId: number | null;
  // Chúng ta cũng sẽ quản lý tin nhắn ở đây
  messages: any[];
}

const initialState: ChatState = {
  activeChatUserId: null,
  messages: [],
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    // Action để đặt ID của người dùng đang chat
    setActiveChatUserId: (state, action: PayloadAction<number | null>) => {
      state.activeChatUserId = action.payload;
    },
    // Action để thêm tin nhắn mới vào danh sách
    addMessage: (state, action: PayloadAction<any>) => {
      state.messages.push(action.payload);
    },
    // Action để đặt toàn bộ danh sách tin nhắn (khi mở cuộc trò chuyện)
    setMessages: (state, action: PayloadAction<any[]>) => {
      state.messages = action.payload;
    },
  },
});

export const { setActiveChatUserId, addMessage, setMessages } =
  chatSlice.actions;

export default chatSlice.reducer;
