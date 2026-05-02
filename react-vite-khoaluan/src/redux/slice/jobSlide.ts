import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  callFetchJob,
  callFetchJobsByCompany,
  // Giả sử bạn đã có 2 hàm gọi API mới này
  callFindJobsWithAI,
} from "@/config/api";
import { IJob, IUser, IJobWithScore } from "@/types/backend"; // Thêm IJobWithScore nếu cần

interface IState {
  isFetching: boolean;
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
    // Thêm các trường từ backend nếu có, ví dụ:
    hasMore?: boolean;
  };
  result?: IJob[];
  isAiSearch?: boolean;
  aiResult?: IJobWithScore[];
}

// ===================================================================
// THUNK TÌM KIẾM THƯỜNG (KHÔNG THAY ĐỔI)
// ===================================================================
export const fetchJob = createAsyncThunk(
  "job/fetchJob",
  async ({ query, user }: { query: string; user: IUser | null }) => {
    if (user?.company?.id) {
      const response = await callFetchJobsByCompany(user.company.id, query);
      return response.data; // Trả về data để reducer xử lý
    } else {
      const response = await callFetchJob(query);
      return response.data; // Trả về data để reducer xử lý
    }
  }
);

// ===================================================================
// CÁC THUNK MỚI CHO TÌM KIẾM AI 2 BƯỚC
// ===================================================================

// Thunk Tìm kiếm AI (Single Step)
export const fetchJobsAI = createAsyncThunk(
  "job/fetchJobsAI",
  async ({ formData, query }: { formData: FormData; query: string }) => {
    const response = await callFindJobsWithAI(formData, query);
    return response.data;
  }
);

const initialState: IState = {
  isFetching: false,
  meta: { page: 1, pageSize: 10, pages: 0, total: 0 },
  result: [],
  aiResult: [],
};

export const jobSlide = createSlice({
  name: "job",
  initialState,
  reducers: {
    clearJobs: (state) => {
      state.isFetching = false;
      state.result = [];
      state.meta = { page: 1, pageSize: 10, pages: 0, total: 0 };
      state.isAiSearch = false;
    },
  },
  extraReducers: (builder) => {
    // ===================================================================
    // LOGIC REDUCER CHO TÌM KIẾM THƯỜNG (KHÔNG THAY ĐỔI)
    // ===================================================================
    builder
      .addCase(fetchJob.pending, (state) => {
        state.isFetching = true;
        state.isAiSearch = false;
      })
      .addCase(fetchJob.rejected, (state) => {
        state.isFetching = false;
      })
      .addCase(fetchJob.fulfilled, (state, action) => {
        state.isFetching = false;
        if (action.payload) {
          // action.payload giờ là data từ response
          state.meta = action.payload.meta;
          state.result = action.payload.result;
        }
      });

    // ===================================================================
    // LOGIC REDUCER MỚI CHỈ DÀNH CHO TÌM KIẾM AI
    // ===================================================================
    builder
      .addCase(fetchJobsAI.pending, (state) => {
        state.isFetching = true;
        state.isAiSearch = true;
      })
      .addCase(fetchJobsAI.rejected, (state) => {
        state.isFetching = false;
      })
      .addCase(fetchJobsAI.fulfilled, (state, action) => {
        state.isFetching = false;
        if (action.payload) {
          state.meta = action.payload.meta;
          state.aiResult = action.payload.result || [];
          state.result = [];
        }
      });
  },
});

export const { clearJobs } = jobSlide.actions;
export default jobSlide.reducer;
