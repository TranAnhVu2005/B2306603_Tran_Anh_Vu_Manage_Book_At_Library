# 03. ĐẶC TẢ RESTFUL API (API SPECIFICATION)

* **Base URL**: `http://localhost:3000/api`
* **Format**: JSON (`Content-Type: application/json`)
* **Kiến trúc**: Phân lớp chuẩn mực (Routes -> Controllers -> Services -> MongoDB Native Driver).

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
* **Request Body**: `{ "msnv": "NV-0002" }` (Tùy chọn)
* **Xử lý**:
  - Kiểm tra kho `SoQuyen > 0`, trừ kho: `SoQuyen = SoQuyen - 1`.
  - Cập nhật: `TrangThai: "DangMuon"`, `MSNV: "NV-0002"`, `NgayHenTra = NgayMuon + 14 ngày`.

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

## 6. Phân Hệ Thanh Toán Trực Tuyến MoMo (`/api/payment`)

### 📌 `POST /api/payment/momo/create` (Khởi tạo phiên thanh toán bồi thường)
* **Request Body**: `{ "borrowId": "670...", "amount": 85000, "orderInfo": "Bồi hoàn mất sách" }`
* **Response (200 OK)**: Trả về `data.payUrl` để độc giả thanh toán qua ví MoMo. Các tên trường trong dữ liệu tích hợp MoMo giữ theo giao thức của cổng thanh toán.

### 📌 `POST /api/payment/momo/ipn` (Webhook IPN MoMo Callback)
* **Mô tả**: Máy chủ MoMo thông báo trạng thái thanh toán, hệ thống tự động xác thực chữ ký HMAC-SHA256 và cập nhật trạng thái đã thanh toán cho phiếu mượn.

### 📌 `GET /api/payment/momo/status/:orderId`
* **Mô tả**: Truy vấn tình trạng giao dịch thanh toán MoMo theo mã đơn hàng.
