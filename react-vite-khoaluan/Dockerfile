# STAGE 1: Build ứng dụng React
FROM node:20-alpine AS build
WORKDIR /app

# 1. Khai báo ARG để nhận biến từ docker-compose (Bước quan trọng nhất)
ARG VITE_BACKEND_URL
ARG VITE_BACKEND_CHAT
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_GEMINI_API_KEY

# 2. Gán ARG vào ENV để quá trình npm run build có thể đọc được
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_BACKEND_CHAT=$VITE_BACKEND_CHAT
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_GEMINI_API_KEY=$VITE_GOOGLE_GEMINI_API_KEY

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ source code
COPY . .

# Chạy lệnh build (lúc này Vite sẽ thấy các biến ENV ở trên)
RUN NODE_OPTIONS="--max-old-space-size=3000" npm run build-uat

# STAGE 2: Serve bằng Nginx
FROM nginx:1.23-alpine

# Copy kết quả build
COPY --from=build /app/dist /usr/share/nginx/html

# Copy config nginx
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]