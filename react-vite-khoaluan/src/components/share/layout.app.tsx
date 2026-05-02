// src/components/share/layout.app.tsx (ĐÃ SỬA)

import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  setRefreshTokenAction,
  fetchAccount,
  logoutThunk,
} from "@/redux/slice/accountSlide";
import { message } from "antd";
import { useEffect } from "react";
// 1. KHÔNG CẦN useNavigate ở đây nữa
// import { useNavigate } from "react-router-dom";

interface IProps {
  children: React.ReactNode;
}

const LayoutApp = (props: IProps) => {
  const isRefreshToken = useAppSelector(
    (state) => state.account.isRefreshToken
  );
  const errorRefreshToken = useAppSelector(
    (state) => state.account.errorRefreshToken
  );
  const isLoading = useAppSelector((state) => state.account.isLoading);

  // const navigate = useNavigate(); // 2. BỎ DÒNG NÀY
  const dispatch = useAppDispatch();

  // useEffect gọi fetchAccount (Giữ nguyên)
  useEffect(() => {
    if (isLoading) {
      dispatch(fetchAccount());
    }
  }, [dispatch, isLoading]);

  // ===== BẮT ĐẦU VÙNG SỬA ĐỔI =====
  // handle refresh token error
  useEffect(() => {
    if (isRefreshToken === true) {
      // 1. Hiển thị lỗi
      message.error(errorRefreshToken);

      // 2. Kích hoạt thunk logout (để xóa cookie + localStorage)
      dispatch(logoutThunk());

      // 3. Reset cờ hiệu
      dispatch(setRefreshTokenAction({ status: false, message: "" }));

      // 4. KHÔNG GỌI navigate("/login") NỮA
      // navigate("/login"); // <-- XÓA BỎ DÒNG NÀY
    }
    // Bỏ navigate ra khỏi dependencies
  }, [isRefreshToken, errorRefreshToken, dispatch]);
  // ===== KẾT THÚC VÙNG SỬA ĐỔI =====

  return <>{props.children}</>;
};

export default LayoutApp;
