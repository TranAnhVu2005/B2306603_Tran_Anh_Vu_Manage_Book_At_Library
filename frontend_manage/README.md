# Frontend Thủ thư và Quản trị viên

Ứng dụng Vue 3/Vite dành cho vai trò `MANAGER` và `ADMIN`. Luồng đăng nhập/đăng ký độc giả nằm trong `../frontend_user/`.

## Chạy phát triển

```sh
npm ci
npm run dev
```

Vite chạy tại `http://localhost:3002`; `/api` và `/uploads` proxy tới Backend (`http://localhost:3000`). Tạo `.env.local` từ `.env.example` để cấu hình `VITE_API_URL` và `VITE_USER_APP_URL`.

## Build độc lập

```sh
npm run build
npm run preview
```

Production phải cấu hình origin API HTTPS và domain cổng độc giả theo môi trường. Backend cần đưa origin frontend này vào `CORS_ALLOWED_ORIGINS`. RBAC luôn được kiểm tra ở backend; route guard chỉ hỗ trợ điều hướng.
