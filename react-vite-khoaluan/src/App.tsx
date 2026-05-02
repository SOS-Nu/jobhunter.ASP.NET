// App.tsx (ĐÃ XÓA useEffect)

import { RouterProvider } from "react-router-dom";
import { useAppSelector } from "@/redux/hooks";
import { router } from "./router";

// Import CSS chính
import "react-toastify/dist/ReactToastify.css";
import "./styles/app.module.scss";
import Loading from "./components/share/loading";

export default function App() {
  // Bạn vẫn có thể giữ isLoading ở đây để hiển thị Loading toàn trang
  // const isLoading = useAppSelector((state) => state.account.isLoading);

  // Logic fetchAccount đã được chuyển qua LayoutApp.tsx
  // nên useEffect ở đây được XÓA BỎ.

  // Nếu bạn muốn giữ loading ban đầu, logic này CẦN SỬA LẠI
  // vì fetchAccount chỉ chạy BÊN TRONG LayoutApp

  // === CÁCH TỐT HƠN ===
  // Hãy để LayoutApp xử lý Loading, và App.tsx chỉ render RouterProvider

  // if (isLoading) {
  //   return <Loading />;
  // }
  // Xóa logic if (isLoading) ở đây nếu LayoutApp đã xử lý nó

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}
