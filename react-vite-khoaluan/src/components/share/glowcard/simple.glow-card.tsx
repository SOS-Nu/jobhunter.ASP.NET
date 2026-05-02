//simple.glow-card.tsx (Đã tối ưu)

import React from "react"; // Thêm import React

interface IProps {
  children: React.ReactNode;
  identifier: string;
  className?: string;
}

// Bọc component bằng React.memo
const SimpleGlowCard = ({ children, identifier, className }: IProps) => {
  return (
    <div
      className={`simple-glow-container simple-glow-container-${identifier}`}
    >
      <article
        className={`simple-glow-card simple-glow-card-${identifier} ${
          className || ""
        }`}
      >
        {children}
      </article>
    </div>
  );
};

// Xuất ra phiên bản đã được memoized
export default React.memo(SimpleGlowCard);
