// src/components/chatbot/formatCompanyToHTML.ts
export function formatCompanyToHTML(companies: any[]) {
  if (!Array.isArray(companies)) return "";

  const hoverBackgroundColor = `var(--glow-card-hover-background, rgba(255, 255, 255, 0.05))`;

  const companyItemsHTML = companies
    .map((company, index) => {
      // Sử dụng route từ App.tsx của bạn: /company/:id
      const href = `/company/${company?.id}`;

      return `
<div style="
    font-size:12px;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 8px;
    transition: background-color 0.3s ease;
    /* THÊM BORDER ĐỂ ĐỒNG BỘ */
    border: 1px solid var(--border-hero-right); 
" 
onmouseover="this.style.backgroundColor='${hoverBackgroundColor}'" 
onmouseout="this.style.backgroundColor='transparent'"
>
    <a href="${href}" target="_blank" style="font-weight:bold; text-decoration:none; color: var(--brand-social);">
        ${index + 1}. ${company?.name}
    </a>
    <p style="margin: 4px 0 0 0; color: var(--text-gray);">📍 ${company?.address}</p>
</div>`;
    })
    .join("");

  return `
<div>
    ${companyItemsHTML}
    <p style="font-style: italic; margin-top: 12px;font-size:13px; color: var(--text-gray);">👉 Bấm vào tên công ty để xem chi tiết</p>
</div>`;
}
