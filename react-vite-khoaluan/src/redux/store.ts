import chatReducer from "@/redux/slice/chatSlice";
import paymentReducer from "@/redux/slice/paymentSlice";
import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import accountReducer from "./slice/accountSlide";
import companyReducer from "./slice/companySlide";
import jobReducer from "./slice/jobSlide";
import permissionReducer from "./slice/permissionSlide";
import resumeReducer from "./slice/resumeSlide";
import roleReducer from "./slice/roleSlide";
import skillReducer from "./slice/skillSlide";
import userReducer from "./slice/userSlide";

export const store = configureStore({
  reducer: {
    account: accountReducer,
    company: companyReducer,
    user: userReducer,
    job: jobReducer,
    resume: resumeReducer,
    permission: permissionReducer,
    role: roleReducer,
    skill: skillReducer,
    chat: chatReducer,
    payment: paymentReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
