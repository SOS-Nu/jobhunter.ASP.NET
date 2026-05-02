import { callFetchPayment } from "@/config/api";
import { IPaymentHistory } from "@/types/backend";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

interface IState {
  isFetching: boolean;
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: IPaymentHistory[];
}

export const fetchPayment = createAsyncThunk(
  "payment/fetchPayment",
  async ({ query }: { query: string }) => {
    const response = await callFetchPayment(query);
    return response;
  }
);

const initialState: IState = {
  isFetching: true,
  meta: {
    page: 1,
    pageSize: 10,
    pages: 0,
    total: 0,
  },
  result: [],
};

export const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPayment.pending, (state) => {
      state.isFetching = true;
    });
    builder.addCase(fetchPayment.rejected, (state) => {
      state.isFetching = false;
    });
    builder.addCase(fetchPayment.fulfilled, (state, action) => {
      if (action.payload && action.payload.data) {
        state.isFetching = false;
        state.meta = action.payload.data.meta;
        state.result = action.payload.data.result;
      }
    });
  },
});

export default paymentSlice.reducer;
