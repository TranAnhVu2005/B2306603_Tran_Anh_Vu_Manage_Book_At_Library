# Frontend Độc giả

Ứng dụng Vue 3/Vite phục vụ vai trò `USER`. Các màn hình thủ thư và Admin thuộc `../frontend_manage/`.

## Chạy phát triển

```sh
npm ci
npm run dev
```

Vite chạy tại `http://localhost:3001`; `/api` và `/uploads` được proxy tới Backend (`http://localhost:3000`). Tạo `.env.local` từ `.env.example` và đặt `VITE_GOOGLE_CLIENT_ID` trùng với `GOOGLE_CLIENT_ID` của backend để hiện nút đăng nhập Google. STAFF/ADMIN vẫn đăng nhập tại cổng quản lý bằng số điện thoại; Google chỉ dùng cho độc giả.

Trong `.env.local`, giữ `VITE_API_URL=http://localhost:3000` để frontend local gọi backend local. Không dùng URL Render trong môi trường phát triển.

## Build độc lập

```sh
npm run build
npm run preview
```

Khi deploy Vercel, đặt `VITE_API_URL` bằng origin HTTPS của backend Render, `VITE_MANAGE_APP_URL` bằng domain Vercel của cổng quản lý và `VITE_GOOGLE_CLIENT_ID` bằng Google Client ID. Đây là biến build-time; sau khi đổi phải deploy lại. Backend Render cần cho phép chính xác domain frontend trong `CORS_ALLOWED_ORIGINS`, đồng thời dùng cùng `GOOGLE_CLIENT_ID`. Xem checklist ở `../DEPLOYMENT.md`.
