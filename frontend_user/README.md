# Frontend Độc giả

Ứng dụng Vue 3/Vite phục vụ vai trò `USER`. Các màn hình thủ thư và Admin thuộc `../frontend_manage/`.

## Chạy phát triển

```sh
npm ci
npm run dev
```

Vite chạy tại `http://localhost:3001`; `/api` và `/uploads` được proxy tới Backend (`http://localhost:3000`). Tạo `.env.local` từ `.env.example` để đổi `VITE_API_URL` hoặc cấu hình `VITE_MANAGE_APP_URL` cho domain/cổng quản lý.

## Build độc lập

```sh
npm run build
npm run preview
```

Production phải cấu hình origin API HTTPS và `VITE_MANAGE_APP_URL` phù hợp môi trường triển khai. Backend cần đưa origin frontend vào `CORS_ALLOWED_ORIGINS`.
