// src/components/chatbot/formatJobsToHTML.ts
export function formatJobsToHTML(jobs: any[]) {
  if (!Array.isArray(jobs)) return "";
  const hoverBackgroundColor = `var(--glow-card-hover-background, rgba(255, 255, 255, 0.05))`;
  const jobItemsHTML = jobs
    .map((job, index) => {
      const href = `/job/detail/${job?.id}`;
      const formattedSalary = job?.salary
        ? job.salary.toLocaleString("en-US") + " VND"
        : "Thỏa thuận";

      return `
<div style="
    font-size:12px;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 8px;
    transition: background-color 0.3s ease;
    border: 1px solid var(--border-hero-right); 
" 
onmouseover="this.style.backgroundColor='${hoverBackgroundColor}'" 
onmouseout="this.style.backgroundColor='transparent'"
>
    <a href="${href}" target="_blank" style="font-weight:bold; text-decoration:none; color: var(--brand-social);">
        ${index + 1}. ${job?.name}
    </a>
    <p style="margin: 4px 0 0 0; color: var(--text-gray);">🪙 ${formattedSalary}</p>
    <p style="margin: 4px 0 0 0; color: var(--text-gray);">🎓 ${job?.level}</p>
    <p style="margin: 4px 0 0 0; color: var(--text-gray);">📍 ${job?.location}</p>
</div>`;
    })
    .join("");

  return `
<div>
    ${jobItemsHTML}
    <p style="font-style: italic; margin-top: 12px;font-size:13px; color: var(--text-gray);">👉 Bấm vào tên job để xem chi tiết</p>
</div>`;
}
