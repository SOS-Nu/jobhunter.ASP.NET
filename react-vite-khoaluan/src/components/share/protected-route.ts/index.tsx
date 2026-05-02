// src/components/share/protected-route.ts

import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import NotPermitted from "./not-permitted";
import Loading from "../loading";

const RoleBaseRoute = (props: any) => {
  const user = useAppSelector((state) => state.account.user);
  const userRole = user?.role?.name;

  // SỬA LỖI LOGIC:
  // Điều kiện cũ (userRole !== "USER" || "USER_VIP") LUÔN LUÔN ĐÚNG
  // (Vì "USER_VIP" là một "truthy" string)
  // Điều kiện đúng nếu bạn muốn cho phép USER và USER_VIP:
  if (userRole === "USER" || userRole === "USER_VIP") {
    return <>{props.children}</>;
  } else {
    // Giả sử các vai trò khác (Admin, etc.) cũng được phép
    // Nếu bạn chỉ muốn cho phép USER và USER_VIP, hãy bật dòng dưới
    // return <NotPermitted />;

    // Nếu bạn muốn cho phép BẤT KỲ VAI TRÒ NÀO (miễn là có), thì logic cũ của bạn (dù sai) lại đang... chạy đúng
    // Nhưng đây là cách viết đúng:
    if (userRole) {
      // Chỉ cần check là user có vai trò
      return <>{props.children}</>;
    }

    // Mặc định, nếu logic của bạn là cho phép tất cả các vai trò đã đăng nhập
    // thì component này có vẻ không cần thiết.
    // Tạm thời, tôi sẽ sửa để nó cho phép tất cả các vai trò
    return <>{props.children}</>;
  }
};

const ProtectedRoute = (props: any) => {
  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated
  );
  const isLoading = useAppSelector((state) => state.account.isLoading);

  // === SỬA LỖI VÒNG LẶP TẠI ĐÂY ===

  // 1. Ưu tiên: Nếu user đã đăng nhập, luôn render con.
  // Điều này ngăn component con bị unmount khi `isLoading`=true (do fetch lại)
  if (isAuthenticated === true) {
    return <>{props.children}</>;
    // Bạn có thể giữ <RoleBaseRoute> nếu muốn, nhưng nó cũng đang có lỗi
    // return <RoleBaseRoute>{props.children}</RoleBaseRoute>;
  }

  // 2. Nếu user CHƯA đăng nhập, thì ta mới kiểm tra `isLoading`
  // (để chờ app load lần đầu)
  if (isLoading === true) {
    return <Loading />;
  }

  // 3. Nếu không loading VÀ cũng không đăng nhập, thì mới redirect
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;
