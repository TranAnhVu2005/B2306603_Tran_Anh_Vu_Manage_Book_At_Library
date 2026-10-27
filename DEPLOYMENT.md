# Local và production deployment

## Sơ đồ môi trường

| Thành phần | Chạy local | Chạy trên Internet |
| --- | --- | --- |
| Cổng độc giả | Vite `localhost:3001` | Vercel project có Root Directory `frontend_user` |
| Cổng STAFF/ADMIN | Vite `localhost:3002` | Vercel project có Root Directory `frontend_manage` |
| Backend API | Express `localhost:3000` | Web Service trên Render |
| MongoDB | `127.0.0.1:27017`, database `quanlymuonsach` | MongoDB Atlas, database `quanlymuonsach` |

Hai cổng frontend độc lập gọi chung API. Frontend không kết nối trực tiếp MongoDB. `MONGODB_URI` chỉ được đọc bởi backend; tuyệt đối không đặt URI Atlas hay credential MongoDB vào biến `VITE_*`.

## Local development

1. Cài và khởi động MongoDB Community Server trên máy.
2. Tạo `backend/.env` từ `backend/.env.example`; dùng:

   ```dotenv
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://127.0.0.1:27017/quanlymuonsach
   MONGODB_DB_NAME=quanlymuonsach
   CORS_ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3002
   ```

   Điền các secret local cần thiết như `JWT_SECRET` và Google Client ID. `backend/.env` đã nằm trong `.gitignore`.
3. Tạo `frontend_user/.env.local` từ `.env.example`: để `VITE_API_URL=http://localhost:3000`, `VITE_MANAGE_APP_URL=http://localhost:3002`; điền `VITE_GOOGLE_CLIENT_ID` nếu cần đăng nhập Google.
4. Tạo `frontend_manage/.env.local` từ `.env.example`: để `VITE_API_URL=http://localhost:3000` và `VITE_USER_APP_URL=http://localhost:3001`.
5. Chạy backend trong `backend/` bằng `npm run dev`; chạy từng frontend bằng `npm run dev` trong thư mục tương ứng.

Backend mặc định chỉ rơi về MongoDB local khi `NODE_ENV` không phải `production`. Có thể ghi rõ `MONGODB_URI` trong `.env`; giá trị local hiện tại cũng trỏ tới MongoDB local. Backend chọn database `quanlymuonsach` qua `MONGODB_DB_NAME`, không phụ thuộc database mặc định trong URI.

## Render: backend và MongoDB Atlas

1. Tạo Web Service từ repository với Root Directory `backend`, Build Command `npm install`, Start Command `npm start`, Health Check Path `/api/health`.
2. Trong Render Environment đặt:

   | Biến | Giá trị |
   | --- | --- |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Connection string `mongodb+srv://...` lấy từ Atlas; chỉ đặt trong Render, không commit |
   | `MONGODB_DB_NAME` | `quanlymuonsach` |
   | `JWT_SECRET` | Secret ngẫu nhiên đủ mạnh, riêng cho production |
   | `JWT_EXPIRES_IN` | `7d` hoặc chính sách phiên đã chọn |
   | `CORS_ALLOWED_ORIGINS` | Hai origin Vercel đầy đủ, phân cách bằng dấu phẩy, không có path hoặc dấu `/` cuối |
   | `GOOGLE_CLIENT_ID` | Google OAuth Client ID dùng cho đăng nhập độc giả |

   Render tự cấp `PORT`; không cần cố định cổng production. Server bind `0.0.0.0` và đọc `PORT`. Không copy `backend/.env` lên production nếu trong đó có URI MongoDB local.
3. Trong Atlas tạo database user riêng cho ứng dụng và đưa địa chỉ egress của Render vào Network Access. Chỉ mở `0.0.0.0/0` khi chấp nhận rủi ro và không có phương án giới hạn IP/network phù hợp; không dùng quyền database admin cho ứng dụng.
4. Sau deploy, mở `https://<render-service>/api/health`. Kết quả phải là JSON `status: OK`. Log backend chỉ in tên database, không in URI/credential.

## Vercel: hai frontend độc lập

Tạo hai Vercel project cùng nối repository:

| Project | Root Directory | Build Command | Output Directory |
| --- | --- | --- | --- |
| Cổng độc giả | `frontend_user` | `npm run build` | `dist` |
| Cổng quản lý | `frontend_manage` | `npm run build` | `dist` |

Đặt các biến sau trong **Project Settings → Environment Variables** của từng Vercel project. Chọn Production; chỉ chọn Preview nếu Render CORS cũng cho phép origin preview cụ thể.

| Biến | Cổng độc giả | Cổng quản lý |
| --- | --- | --- |
| `VITE_API_URL` | Origin HTTPS Render, ví dụ `https://<render-service>.onrender.com` | Cùng origin HTTPS Render |
| `VITE_MANAGE_APP_URL` | Domain HTTPS production của project quản lý | — |
| `VITE_USER_APP_URL` | — | Domain HTTPS production của project độc giả |
| `VITE_GOOGLE_CLIENT_ID` | Google Client ID | — |

`VITE_API_URL` phải là origin backend, không thêm `/api`, path, query hoặc credential. Vite kiểm tra điều này khi build production để tránh bản deploy gọi nhầm API. Các biến `VITE_*` được đóng gói vào JavaScript phía trình duyệt, vì vậy chỉ đặt giá trị công khai; tuyệt đối không đặt `MONGODB_URI`, `JWT_SECRET`, Google Client Secret hoặc credential khác.

Sau khi Vercel cấp domain ổn định, cập nhật `CORS_ALLOWED_ORIGINS` trên Render bằng đúng hai origin đó, ví dụ `https://<user-domain>,https://<manage-domain>`, rồi redeploy backend. Nếu dùng domain tùy chỉnh, thêm origin chính thức đó thay cho domain mặc định. Không cho phép origin tùy ý hoặc dùng wildcard CORS.

Trong Google Cloud Console, thêm domain cổng độc giả vào Authorized JavaScript origins cho OAuth Client ID. Cấu hình cùng Client ID tại Vercel (`VITE_GOOGLE_CLIENT_ID`) và Render (`GOOGLE_CLIENT_ID`), sau đó redeploy cả frontend độc giả và backend.

## Kiểm tra sau deploy

- Mở `/api/health` trên Render và xác nhận service kết nối MongoDB Atlas qua log thành công; log không chứa URI.
- Mở catalog trên hai domain Vercel; xác nhận request `/api/...` đi tới Render, ảnh bìa và avatar `/uploads/...` tải được.
- Thử đăng nhập Google ở cổng độc giả, đăng nhập STAFF/ADMIN ở cổng quản lý và kiểm tra CORS trong DevTools.
- Kiểm tra tải trực tiếp một route con sau khi refresh; Vercel rewrite trả SPA `index.html`.
- Chỉ chạy seed hoặc migration có ghi dữ liệu khi đã xác nhận rõ biến `MONGODB_URI` đang trỏ đúng môi trường; không chạy test fixture lên Atlas production.

## Nếu deploy không chạy

- Vercel báo thiếu `VITE_API_URL`: thêm biến vào đúng project và đúng environment, sau đó tạo deployment mới.
- Browser báo CORS: so sánh chính xác Origin trên request với `CORS_ALLOWED_ORIGINS` của Render (scheme, hostname, port; không có path).
- Render không kết nối được Atlas: kiểm tra database user, URI/encoding mật khẩu, database name, trạng thái cluster và Atlas Network Access.
- API gọi nhầm database: xác nhận Render có `MONGODB_DB_NAME=quanlymuonsach`; `MONGODB_URI` production phải là URI Atlas, không phải URI local.
