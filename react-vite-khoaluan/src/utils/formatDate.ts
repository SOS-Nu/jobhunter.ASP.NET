// src/utils/formatDate.ts

export const formatDate = (timestamp: any) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Ngày không hợp lệ";
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
  const startOfMessageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const timeString = `${hours}:${minutes}`;
  if (startOfMessageDate.getTime() === startOfToday.getTime())
    return timeString;
  if (startOfMessageDate.getTime() === startOfYesterday.getTime())
    return `Hôm qua lúc ${timeString}`;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${timeString} ${day}/${month}/${year}`;
};
