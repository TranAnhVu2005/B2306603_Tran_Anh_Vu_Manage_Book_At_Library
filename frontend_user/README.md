# Frontend Độc giả

Ứng dụng Vue 3/Vite phục vụ vai trò `USER`. Các màn hình thủ thư và Admin thuộc `../frontend_manage/`.

## Chạy phát triển

```sh
npm ci
npm run dev
```

Vite chạy tại `http://localhost:3001`; `/api` và `/uploads` được proxy tới Backend (`http://localhost:3000`). Tạo `.env.local` từ `.env.example` và đặt `VITE_GOOGLE_CLIENT_ID` trùng với `GOOGLE_CLIENT_ID` của backend để hiện nút đăng nhập Google. STAFF/ADMIN vẫn đăng nhập tại cổng quản lý bằng số điện thoại; Google chỉ dùng cho độc giả.

## Build độc lập

```sh
npm run build
npm run preview
```

Production phải cấu hình origin API HTTPS, `VITE_MANAGE_APP_URL` và `VITE_GOOGLE_CLIENT_ID` phù hợp môi trường triển khai. Backend cần đưa origin frontend vào `CORS_ALLOWED_ORIGINS` và cấu hình cùng Google OAuth Client ID trong `GOOGLE_CLIENT_ID`.
