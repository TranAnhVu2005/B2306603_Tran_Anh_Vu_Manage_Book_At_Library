# Frontend Thủ thư và Quản trị viên

Ứng dụng Vue 3/Vite dành cho vai trò `STAFF` và `ADMIN`. Luồng đăng nhập/đăng ký độc giả nằm trong `../frontend_user/`.

## Chạy phát triển

```sh
npm ci
npm run dev
```

Vite chạy tại `http://localhost:3002`; `/api` và `/uploads` proxy tới Backend (`http://localhost:3000`). Tạo `.env.local` từ `.env.example` để cấu hình `VITE_API_URL` và `VITE_USER_APP_URL`.

Trong `.env.local`, dùng `VITE_API_URL=http://localhost:3000` và `VITE_USER_APP_URL=http://localhost:3001` để làm việc với các dịch vụ local.

## Build độc lập

```sh
npm run build
npm run preview
```

Khi deploy Vercel, đặt `VITE_API_URL` bằng origin HTTPS của backend Render và `VITE_USER_APP_URL` bằng domain Vercel của cổng độc giả. Đây là biến build-time; sau khi đổi phải deploy lại. Backend Render cần cho phép chính xác domain frontend trong `CORS_ALLOWED_ORIGINS`. RBAC luôn được kiểm tra ở backend; route guard chỉ hỗ trợ điều hướng. Xem checklist ở `../DEPLOYMENT.md`.
