import { setRefreshTokenAction } from "@/redux/slice/accountSlide";
import { store } from "@/redux/store";
import { IBackendRes } from "@/types/backend";
import { notification } from "antd";
import { Mutex } from "async-mutex";
import axiosClient from "axios";
import i18next from "i18next";
interface AccessTokenResponse {
  access_token: string;
}

const instance = axiosClient.create({
  baseURL: import.meta.env.VITE_BACKEND_URL as string,
  withCredentials: true,
});

const mutex = new Mutex();
const NO_RETRY_HEADER = "x-no-retry";

// === TẠO HÀM LOGOUT HELPER ===
// Tách logic logout ra một hàm riêng để dễ quản lý và tránh lặp code
const handleLogout = (
  message: string = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
) => {
  window.localStorage.removeItem("access_token");
  // Dispatch redux action để reset state, xóa thông tin tài khoản và chuyển hướng
  store.dispatch(setRefreshTokenAction({ status: true, message }));
};

// === HÀM REFRESH TOKEN (GIỮ NGUYÊN) ===
// Hàm này sẽ ném lỗi (throw error) nếu instance.get thất bại (ví dụ 400, 401)
const handleRefreshToken = async (): Promise<string | null> => {
  return await mutex.runExclusive(async () => {
    const res = await instance.get<IBackendRes<AccessTokenResponse>>(
      "/api/v1/auth/refresh",
    ); // `res` ở đây là `res.data` từ interceptor response thành công

    if (res && res.data && res.data.access_token) {
      return res.data.access_token;
    } else {
      // Trường hợp 200 OK nhưng không có token
      throw new Error(res.message ?? "Refresh token failed or expired");
    }
  });
};

// === REQUEST INTERCEPTOR (GIỮ NGUYÊN) ===
instance.interceptors.request.use(function (config) {
  const publicPaths = [
    "/api/v1/auth/login",
    "/api/v1/auth/refresh",
    "/api/v1/auth/register",
    "/api/v1/auth/send-otp",
    "/api/v1/auth/google",
    "/api/v1/auth/verify-otp-change-password",
    "/api/v1/auth/register/send-otp",
    "/api/v1/auth/register",
  ];

  const isPublicPath = publicPaths.some((path) => config.url?.startsWith(path));
  const accessToken = window.localStorage.getItem("access_token");

  if (accessToken && !isPublicPath) {
    config.headers.Authorization = "Bearer " + accessToken;
  }

  const language = i18next.language;
  if (language) {
    config.headers["Accept-Language"] = language;
  }

  if (!config.headers.Accept && config.headers["Content-Type"]) {
    config.headers.Accept = "application/json";
    config.headers["Content-Type"] = "application/json; charset=utf-8";
  }
  return config;
});

// =================================================================
// === THAY THẾ TOÀN BỘ LOGIC RESPONSE INTERCEPTOR ===
// =================================================================
instance.interceptors.response.use(
  (res) => res.data, // Logic thành công, trả về res.data
  async (error) => {
    // Chỉ xử lý khi có config và response
    if (!error.config || !error.response) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    const { status, data } = error.response;
    const url = originalRequest.url; // Logic 401 (Token hết hạn, thử refresh)

    if (+status === 401 && !originalRequest.headers[NO_RETRY_HEADER]) {
      // Đánh dấu đã retry để tránh lặp vô hạn
      originalRequest.headers[NO_RETRY_HEADER] = "true"; // Lỗi 401 từ /refresh hoặc /login -> Lỗi "cứng", logout ngay

      if (
        url.includes("/api/v1/auth/refresh") ||
        url.includes("/api/v1/auth/login")
      ) {
        const message = data?.message ?? "Phiên đăng nhập đã hết hạn.";
        handleLogout(message); // <<< VỊ TRÍ LOGOUT 1
        return Promise.reject(error.response?.data ?? error);
      } // Lỗi 401 từ các API khác (fetchAccount, ...) -> Thử refresh

      try {
        const newAccessToken = await handleRefreshToken();

        if (newAccessToken) {
          window.localStorage.setItem("access_token", newAccessToken);
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          delete originalRequest.headers[NO_RETRY_HEADER];
          return instance(originalRequest);
        } else {
          handleLogout("Không thể làm mới token."); // <<< VỊ TRÍ LOGOUT 2 (Hiếm gặp)
          return Promise.reject(new Error("Không thể lấy token mới."));
        }
      } catch (refreshError: any) {
        // === ĐÂY LÀ NƠI XỬ LÝ LỖI TỪ `handleRefreshToken` ===
        const refreshStatus = refreshError?.response?.status;
        const refreshData = refreshError?.response?.data;
        const message =
          refreshData?.message ??
          refreshData?.error ??
          "Phiên đăng nhập hết hạn.";

        // Logic 429 (Too Many Requests) -> Đợi 3s và thử lại
        if (+refreshStatus === 429) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
          delete originalRequest.headers[NO_RETRY_HEADER];
          return instance(originalRequest); // Retry request GỐC
        }

        // Logic 400 (ví dụ: Không có cookie) -> Đợi 1s và thử lại
        if (+refreshStatus === 400) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          delete originalRequest.headers[NO_RETRY_HEADER];
          return instance(originalRequest); // Retry request GỐC
        }

        // Tất cả các lỗi KHÁC từ /refresh (401, 500,...) -> Đăng xuất
        handleLogout(message); // <<< VỊ TRÍ LOGOUT 3 (Quan trọng nhất)
        return Promise.reject(refreshError.response?.data ?? refreshError);
      }
    } // Logic 400 (Lỗi 400 từ /refresh gọi TRỰC TIẾP)

    if (+status === 400 && url === "/api/v1/auth/refresh") {
      // === ĐÃ XÓA LOGOUT ===
      // Chỉ reject lỗi để component gọi nó tự xử lý.
      // KHÔNG logout tại đây.
    } // Logic 403 (Không có quyền)

    if (+status === 403) {
      // KHÔNG logout, chỉ thông báo
      notification.error({
        message: data?.message ?? "Không có quyền",
        description:
          data?.error ?? "Bạn không có quyền thực hiện hành động này.",
      });
    } // Trả về lỗi cho các trường hợp khác (500, 404,...)

    // KHÔNG logout, chỉ reject lỗi
    return Promise.reject(error.response?.data ?? error);
  },
);
// =================================================================
// === KẾT THÚC PHẦN THAY ĐỔI ===
// =================================================================

export default instance;
