// src/components/share/scroll.to.top.tsx

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Component này không render ra bất cứ thứ gì, nó chỉ chứa logic.
const ScrollToTop = () => {
  // Lấy ra `pathname` từ location hiện tại.
  const { pathname } = useLocation();

  // Sử dụng useEffect để thực thi một hành động mỗi khi `pathname` thay đổi.
  useEffect(() => {
    // Cuộn cửa sổ trình duyệt về vị trí (0, 0) một cách tức thì.
    window.scrollTo(0, 0);
  }, [pathname]); // Dependency array chỉ có `pathname`

  return null; // Không render ra giao diện
};

export default ScrollToTop;
