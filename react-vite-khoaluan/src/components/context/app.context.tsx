import { createContext, useContext, useEffect, useState } from "react";
// 1. Import các thành phần cần thiết từ antd
import { ConfigProvider, theme as antdTheme } from "antd";

interface IAppContext {
  theme: ThemeContextType;
  setTheme: (v: ThemeContextType) => void;
}

type ThemeContextType = "light" | "dark";

const AppContext = createContext<IAppContext | null>(null);

export const AppContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, setThemeState] = useState<ThemeContextType>(() => {
    // Logic khởi tạo theme của bạn đã ĐÚNG, giữ nguyên "dark"
    const initialTheme =
      (localStorage.getItem("theme") as ThemeContextType) || "dark";
    return initialTheme;
  });

  // Hàm setTheme giờ chỉ cần cập nhật state và localStorage
  const setTheme = (newTheme: ThemeContextType) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // ----- BẮT ĐẦU THAY ĐỔI -----
  // Sửa lại useEffect để đồng bộ state 'theme' với thuộc tính data-bs-theme
  useEffect(() => {
    // Effect này sẽ chạy lần đầu khi tải trang (với theme "dark")
    // và chạy mỗi khi 'theme' state thay đổi
    document.documentElement.setAttribute("data-bs-theme", theme);
  }, [theme]); // Thêm 'theme' làm dependency
  // ----- KẾT THÚC THAY ĐỔI -----

  // 2. Định nghĩa cấu hình theme cho Ant Design (giữ nguyên)
  const themeConfig = {
    algorithm:
      theme === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {/* 3. Bọc children bằng ConfigProvider (giữ nguyên) */}
      <ConfigProvider theme={themeConfig}>{children}</ConfigProvider>
    </AppContext.Provider>
  );
};

export const useCurrentApp = () => {
  const currentAppContext = useContext(AppContext);

  if (!currentAppContext) {
    throw new Error(
      "useCurrentApp has to be used within <AppContext.Provider>"
    );
  }

  return currentAppContext;
};
