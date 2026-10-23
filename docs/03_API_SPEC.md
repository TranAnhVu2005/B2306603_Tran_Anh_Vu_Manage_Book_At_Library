# 03. ĐẶC TẢ RESTFUL API (API SPECIFICATION)

* **Base URL**: `http://localhost:3000/api`
* **Format**: JSON (`Content-Type: application/json`)
* **Kiến trúc**: Phân lớp chuẩn mực (Routes -> Controllers -> Services -> MongoDB Native Driver).

## Origin và kết nối hai frontend

- Backend API phát triển tại `http://localhost:3000/api`.
- `frontend_user/` chạy mặc định tại `http://localhost:3001`; `frontend_manage/` chạy mặc định tại `http://localhost:3002`. Mỗi Vite server proxy `/api` về backend `3000`.
- Production dùng hai domain/origin riêng được lấy từ cấu hình môi trường; không hardcode host vào service. CORS backend allowlist chỉ các origin đã cấu hình. Nếu cần credentials, chỉ bật cho origin cụ thể và triển khai chính sách CSRF tương ứng.
- JWT Bearer/localStorage là độc lập trên mỗi origin. Điều hướng giữa cổng User và Manage phải mở app/domain tương ứng; không thiết kế API dựa trên việc một app đọc storage của app kia.
- Domain không phải ranh giới phân quyền: mọi endpoint đặc quyền vẫn phải xác thực JWT và áp dụng RBAC/kiểm tra quyền sở hữu ở server.

## Yêu cầu bảo mật áp dụng cho mọi endpoint

- **RBAC theo chức năng**: Mỗi endpoint ghi rõ quyền `public`, `USER`, `MANAGER` hoặc `ADMIN`; backend xác thực JWT và kiểm tra vai trò/quyền sở hữu ngay tại route/controller. Không xem Vue Router guard là biện pháp phân quyền. Endpoint thao tác dữ liệu phải dùng whitelist trường và kiểm tra trạng thái hiện tại trước khi cập nhật.
- **Xác thực input và NoSQL injection**: Chỉ nhận JSON với schema, kiểu và giới hạn kích thước rõ ràng; không gán trực tiếp `req.body` vào MongoDB query/update, không nhận toán tử MongoDB do client gửi, không tạo query bằng nối chuỗi. Dùng MongoDB Native Driver có cấu trúc. SQL injection không áp dụng trực tiếp vì dự án không dùng SQL; cần giữ quy tắc tương đương nếu bổ sung SQL sau này.
- **XSS**: Trả dữ liệu theo JSON, không phản chiếu HTML không tin cậy; dữ liệu UI phải được render/encode theo ngữ cảnh, HTML rich text (nếu có) phải sanitize allowlist. Cấu hình CSP và security headers ở backend.
- **CSRF/XSRF**: Với JWT truyền trong `Authorization` header và không dùng cookie xác thực, trình duyệt không tự gắn token nên CSRF cổ điển được giảm thiểu; bảo vệ XSS vẫn bắt buộc. Nếu dùng cookie, bật `HttpOnly`, `Secure`, `SameSite`, CSRF token cho request thay đổi trạng thái và kiểm tra `Origin`/`Referer`.
- **Broken authentication/session**: Bcrypt; phản hồi lỗi đăng nhập chung; rate limit đăng nhập/đăng ký/Google auth (bộ đếm hiện giữ trong bộ nhớ tiến trình); JWT dùng secret từ env, thuật toán allowlist, hạn dùng và xác minh claim. Hiện có thu hồi token khi logout; thu hồi khi đổi mật khẩu/khóa tài khoản và khoá phiên phân tán nhiều instance vẫn cần hoàn thiện. Không log thông tin xác thực; HTTPS bắt buộc ở triển khai.
- **XXE**: API hiện không có nhu cầu nhận XML. Từ chối XML nếu không được hỗ trợ; nếu bổ sung parser XML phải tắt DTD, external entities, XInclude và truy cập file/network bên ngoài, giới hạn kích thước/độ sâu.
- **SSRF**: Backend hiện không có tính năng fetch URL do client cung cấp; ảnh sách/avatar được upload vào storage cục bộ, Google auth xác minh token qua thư viện cấu hình sẵn. Nếu bổ sung outbound request (bao gồm MoMo tương lai), phải allowlist host/protocol, kiểm tra IP sau DNS resolution, chặn loopback/private/link-local/metadata, giới hạn redirect/timeout/response size.
- **CORS, headers, lỗi và vận hành**: CORS allowlist theo môi trường, body size limit, HTTPS, security headers/CSP, lỗi production không lộ stack/secret, secrets trong biến môi trường; audit các thao tác nhạy cảm mà không ghi token/mật khẩu.
- **Upload**: MIME/đuôi file không đủ để xác minh; kiểm tra chữ ký file và allowlist định dạng, random filename, giới hạn dung lượng, không thực thi file upload và không chấp nhận SVG/HTML chưa sanitize.

Các yêu cầu trên là mục tiêu triển khai, không mô tả rằng hệ thống đã đáp ứng. Mọi thay đổi cần cập nhật API/testing docs và kiểm thử cả trường hợp được phép lẫn bị từ chối.

## Quy Ước Dữ Liệu Response

- Dữ liệu của 5 collection chỉ trả các trường được định nghĩa trong sơ đồ CDM của báo cáo; không thêm alias, tên trường tự đặt hoặc metadata ngoài sơ đồ.
- Không trả trường `MatKhau` trong response vì đây là dữ liệu xác thực nhạy cảm.
- Các lớp bao giao thức như `message`, `data`, `token` và response do MoMo quy định không phải trường collection, nên giữ nguyên.
- Response phiếu mượn chỉ gồm trường của collection `theodoimuonsach`, không nhúng thông tin sách, độc giả hoặc nhân viên.

---

## 1. Phân Hệ Xác Thực & Tài Khoản (`/api/auth`)

### 📌 `POST /api/auth/login` (Đăng nhập hệ thống)
* **Mô tả**: Hỗ trợ đăng nhập cho cả Độc giả (bằng Số điện thoại hoặc Mã độc giả) và Cán bộ / Quản trị viên (bằng MSNV).
* **Request Body**:
  ```json
  {
    "identifier": "0912345678", // Hoặc "NV-0001", "DG-000001"
    "password": "hashed_password_or_plain"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "message": "Đăng nhập thành công với vai trò Độc giả.",
    "token": "<JWT>",
    "data": {
      "_id": "670...",
      "MaDocGia": "DG-000001",
      "HoLot": "Trần Minh",
      "Ten": "Triết",
      "NgaySinh": "2003-09-15",
      "Phai": 1,
      "DiaChi": "Ninh Kiều, Cần Thơ",
      "DienThoai": "0912345678",
      "VaiTro": "USER",
      "TrangThaiThe": "HoatDong",
      "SoLanViPham": 0
    }
  }
  ```

### 📌 `POST /api/auth/register` (Đăng ký tài khoản độc giả trực tuyến)
* **Request Body**:
  ```json
  {
    "HoLot": "Trần Minh",
    "Ten": "Triết",
    "NgaySinh": "2003-09-15",
    "Phai": "Nam", // Hoặc 1 (Nam), 0 (Nữ)
    "DiaChi": "Ninh Kiều, Cần Thơ",
    "DienThoai": "0912345678",
    "MatKhau": "123456"
  }
  ```
* **Response (201 Created)**: Tạo thẻ thành công, mã tự sinh dạng `DG-000001`, mật khẩu được băm Bcrypt.

### 📌 `POST /api/auth/google` (Đăng nhập / Đăng ký nhanh qua tài khoản Google)
* **Mô tả**: Tiếp nhận Google ID Token từ Client, xác thực thông qua `GoogleAuthService`, tự động liên kết hoặc tạo tài khoản mới.
* **Request Body**: `{ "idToken": "google_jwt_token_here" }`
* **Response (200 OK)**: Trả về `{ "message": "...", "token": "...", "data": { ... } }`. `data` chỉ gồm các trường độc giả trong sơ đồ CDM, không bao gồm `MatKhau`.

### 📌 `GET /api/auth/me` (Thông tin người dùng hiện tại)
* **Response (200 OK)**: `{ "data": { ... } }`; dữ liệu `data` chỉ gồm các trường của collection tương ứng trong sơ đồ CDM. Hồ sơ nhân viên chỉ có `ChucVu`, không thêm trường `VaiTro`.

### Cập nhật hồ sơ nhân viên (`PUT /api/nhanvien/:id`)
* **Quyền truy cập**: Nhân viên hoặc quản trị viên đã đăng nhập; chỉ được cập nhật hồ sơ có `_id` hoặc `MSNV` khớp với danh tính trong JWT.
* **Trường được phép sửa**: `HoTenNV`, `SoDienThoai`, `DiaChi`. Không cho phép sửa `MSNV`, `ChucVu` hoặc `MatKhau`.
* **Response**: `{ "message": "...", "data": { ... } }`; `data` chỉ gồm các trường nhân viên trong CDM và không chứa `MatKhau`.

---

## 2. Quản Lý Sách (`/api/sach`)

* `GET /api/sach`: Lấy danh sách sách (Hỗ trợ query: `?search=...&maNxb=...&availableOnly=true`).
* `GET /api/sach/:id`: Chi tiết 1 cuốn sách theo ObjectId hoặc `MaSach`.
* `POST /api/sach`: [Manager/Admin] Thêm sách mới (`TenSach`, `DonGia`, `SoQuyen`, `NamXuatBan`, `MaNXB`, `TacGia`, `HinhAnh`, `MoTa`). Tự động sinh `MaSach: SACH-000001`.
* `PUT /api/sach/:id`: [Manager/Admin] Cập nhật thông tin sách / điều chỉnh số lượng tồn kho.
* `DELETE /api/sach/:id`: [Manager/Admin] Xóa sách (Chặn xóa nếu sách đang có phiếu mượn `DangMuon` hoặc `ChoDuyet`).

---

## 3. Quản Lý Nhà Xuất Bản (`/api/nhaxuatban`)

* `GET /api/nhaxuatban`: Danh sách NXB trong hệ thống.
* `GET /api/nhaxuatban/:id`: Chi tiết NXB theo ObjectId hoặc `MaNXB`.
* `POST /api/nhaxuatban`: [Manager/Admin] Thêm NXB mới (`TENNXB`, `DiaChi`). Tự động sinh `MaNXB: NXB-0001`.
* `PUT /api/nhaxuatban/:id`: [Manager/Admin] Cập nhật thông tin NXB.
* `DELETE /api/nhaxuatban/:id`: [Manager/Admin] Xóa NXB (Chặn xóa nếu còn sách trong kho tham chiếu).

---

## 4. Quản Lý Độc Giả (`/api/docgia`)

* `GET /api/docgia`: [Manager/Admin] Danh sách độc giả (Hỗ trợ lọc: `?trangThai=DanhSachDen`, `?role=MANAGER`, `?search=...`).
* `GET /api/docgia/:id`: Xem hồ sơ độc giả theo `_id`, `MaDocGia` hoặc `DienThoai`.
* `POST /api/docgia`: Tạo hồ sơ độc giả mới.
* `PUT /api/docgia/:id`: [Độc giả đã đăng nhập] Cập nhật hồ sơ của chính mình; xác thực JWT và chỉ cho phép sửa `HoLot`, `Ten`, `NgaySinh`, `Phai`, `DiaChi`, `DienThoai`. Không cho phép sửa mã độc giả, mật khẩu, vai trò, trạng thái thẻ hoặc số lần vi phạm. Số điện thoại phải đúng định dạng và chưa được tài khoản khác sử dụng.
* `PUT /api/docgia/:id/role`: [Super Admin] Thăng cấp / hạ cấp vai trò (`role: "MANAGER"` hoặc `"USER"`).
* `PUT /api/docgia/:id/lock`: [Super Admin] Khóa khẩn cấp thẻ đang hoạt động (`HoatDong` → `Khoa`), không thay đổi `SoLanViPham`.
* `PUT /api/docgia/:id/unblock`: [Super Admin] Chỉ mở khóa thẻ trạng thái `Khoa`; giữ nguyên `SoLanViPham`. Nếu đã đạt 3 lần vi phạm, trạng thái sau mở khóa là `DanhSachDen`.
* `PUT /api/docgia/:id/reinstate`: [Super Admin] Xét gỡ khỏi Danh sách đen bằng thao tác riêng (`DanhSachDen` → `HoatDong`); giữ nguyên lịch sử `SoLanViPham`. Không dùng thay cho mở khóa khẩn cấp.
* `DELETE /api/docgia/:id`: [Super Admin] Xóa độc giả vĩnh viễn (Chặn xóa nếu còn phiếu mượn chưa hoàn tất).

---

## 5. Quản Lý Mượn - Trả & Xử Lý Sự Cố (`/api/theodoimuonsach`)

### 📌 `GET /api/theodoimuonsach`
* **Mô tả**: Lấy danh sách phiếu mượn với các trường được định nghĩa trong collection `theodoimuonsach`; không trả object lồng ghép từ các collection khác.
* **Query Params**: `?maDocGia=DG-000001&trangThai=DangMuon`

### 📌 `POST /api/theodoimuonsach` (Độc giả đăng ký mượn)
* **Request Body**: `{ "MaDocGia": "DG-000001", "MaSach": "SACH-000001", "GhiChu": "..." }`
* **Xử lý**:
  - Chặn nếu thẻ độc giả ở trạng thái `DanhSachDen` hoặc `Khoa` (HTTP 403).
  - Chặn nếu độc giả đã mượn đủ 3 cuốn đang lưu thông (HTTP 400).
  - Chặn nếu sách đã hết trong kho `SoQuyen <= 0` (HTTP 400).
  - Tạo phiếu với `TrangThai: "ChoDuyet"`.

### 📌 `PUT /api/theodoimuonsach/:id/duyet` (Thủ thư phê duyệt mượn)
* **Quyền truy cập**: Bắt buộc JWT của nhân viên (`MANAGER`) hoặc quản trị viên (`ADMIN`). `MSNV` được lấy từ token, không nhận danh tính nhân viên từ request body.
* **Xử lý**:
  - Kiểm tra kho `SoQuyen > 0`, trừ kho: `SoQuyen = SoQuyen - 1`.
  - Cập nhật: `TrangThai: "DangMuon"`, gán `MSNV` từ tài khoản đang đăng nhập, `NgayHenTra = NgayMuon + 14 ngày`.

### 📌 `PUT /api/theodoimuonsach/:id/tu-choi` (Từ chối yêu cầu)
* **Request Body**: `{ "lyDo": "Không đủ điều kiện" }`
* **Xử lý**: Cập nhật `TrangThai: "TuChoi"`, `GhiChu: lyDo`.

### 📌 `PUT /api/theodoimuonsach/:id/tra-sach` (Xác nhận hoàn trả sách)
* **Xử lý**:
  - Tăng kho: `SoQuyen = SoQuyen + 1`.
  - Cập nhật: `TrangThai: "DaTra"`, `NgayTra = hiện tại`.
  - Nếu `NgayTra > NgayHenTra`: Tự động tăng `SoLanViPham` của độc giả. Nếu đạt 3 lần, tự động chuyển sang `DanhSachDen`.

### 📌 `PUT /api/theodoimuonsach/:id/bao-mat` (Xử lý mất sách)
* **Request Body**: `{ "ghiChu": "Làm mất sách vật lý" }`
* **Xử lý**:
  - Chuyển `TrangThai: "MatSach"`.
  - Gán tiền bồi thường: `GiaTriBoiThuong = Sach.DonGia`.
  - **Không cộng hoàn trả kho** `SoQuyen`.
  - Tăng `SoLanViPham` của độc giả lên 1. Nếu đạt 3 lần, đưa thẻ vào `DanhSachDen`.

---

## 6. Thanh toán trực tuyến MoMo (đặc tả tương lai, chưa triển khai)

Các route dưới đây là yêu cầu nghiệp vụ dự kiến; hiện backend không mount `/api/payment` và chưa có service/controller MoMo. Không gọi đây là API hoạt động cho tới khi triển khai.

### 📌 `POST /api/payment/momo/create` (Khởi tạo phiên thanh toán bồi thường)
* **Request Body**: `{ "borrowId": "670...", "amount": 85000, "orderInfo": "Bồi hoàn mất sách" }`
* **Response (200 OK)**: Trả về `data.payUrl` để độc giả thanh toán qua ví MoMo. Các tên trường trong dữ liệu tích hợp MoMo giữ theo giao thức của cổng thanh toán.

### 📌 `POST /api/payment/momo/ipn` (Webhook IPN MoMo Callback)
* **Mô tả**: Máy chủ MoMo thông báo trạng thái thanh toán, hệ thống tự động xác thực chữ ký HMAC-SHA256 và cập nhật trạng thái đã thanh toán cho phiếu mượn.

### 📌 `GET /api/payment/momo/status/:orderId`
* **Mô tả**: Truy vấn tình trạng giao dịch thanh toán MoMo theo mã đơn hàng.
