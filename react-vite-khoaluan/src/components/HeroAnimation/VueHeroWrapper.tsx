// src/components/HeroAnimation/VueHeroWrapper.tsx
import i18next from "i18next";
import I18NextVue from "i18next-vue";
import React, { useEffect, useRef, useState } from "react";
import { createApp, type App } from "vue";
import HeroSection from "./HeroSection.vue";

// Import CSS (Giữ nguyên)
import "./HeroDiagram.vue?inline&lang=scss";
import "./HeroSection.vue?inline&lang=scss";
import "./common/SvgNode.vue?inline&lang=scss";
import "./svg-elements/SvgBlueIndicator.vue?inline&lang=scss";
import "./svg-elements/SvgInputs.vue?inline&lang=scss";
import "./svg-elements/SvgOutputs.vue?inline&lang=scss";
import "./svg-elements/SvgPinkIndicator.vue?inline&lang=scss";

export const VueHeroWrapper: React.FC = () => {
  const vueAppRef = useRef<HTMLDivElement | null>(null);
  const vueInstanceRef = useRef<App | null>(null);

  // 1. State để kiểm soát việc trì hoãn
  const [isReady, setIsReady] = useState(false);

  // 2. Effect đếm ngược 1 giây
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true); // Sau 1s mới cho phép mount
    }, 400); // 1000ms = 1 giây

    return () => clearTimeout(timer); // Cleanup nếu user chuyển trang trước 1s
  }, []);

  // 3. Effect khởi tạo Vue (chỉ chạy khi isReady = true)
  useEffect(() => {
    // Nếu chưa sẵn sàng hoặc không tìm thấy thẻ div -> Dừng
    if (!isReady || !vueAppRef.current || vueInstanceRef.current) return;

    // --- BẮT ĐẦU KHỞI TẠO VUE ---
    // (Logic này chỉ chạy khi trình duyệt đã rảnh tay)
    const app = createApp(HeroSection);
    app.use(I18NextVue, { i18next });
    app.mount(vueAppRef.current);
    vueInstanceRef.current = app;

    return () => {
      if (vueInstanceRef.current) {
        vueInstanceRef.current.unmount();
        vueInstanceRef.current = null;
      }
    };
  }, [isReady]); // Phụ thuộc vào biến isReady

  return (
    // 4. Thêm style transition để hiện dần ra cho mượt
    <div
      ref={vueAppRef}
      style={{
        opacity: isReady ? 1 : 0,
        transition: "opacity 0.8s ease-in-out",
      }}
    />
  );
};
