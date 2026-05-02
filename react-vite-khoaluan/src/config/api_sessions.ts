import { IBackendRes } from "@/types/backend";
import instance from "./axios-customize";

// Bạn nên định nghĩa type này trong file types/backend.ts
export interface ISession {
  id: number;
  ipAddress: string;
  userAgent: string;
  lastUsedAt: string;
  createdAt: string;
  current: boolean;
}

/**
 * Lấy danh sách tất cả các phiên đăng nhập
 */
export const callGetSessions = () => {
  return instance.get<IBackendRes<ISession[]>>(`/api/v1/auth/sessions`);
};

/**
 * Xóa một hoặc nhiều phiên đăng nhập bằng ID
 * @param ids - Mảng các ID của session cần xóa
 */
export const callDeleteSessions = (ids: number[]) => {
  return instance.delete<IBackendRes<void>>(`/api/v1/auth/sessions`, {
    data: { ids },
  });
};
