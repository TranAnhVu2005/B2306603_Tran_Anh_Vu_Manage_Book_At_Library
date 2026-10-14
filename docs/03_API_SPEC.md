# 03. ĐẶC TẢ RESTFUL API (API SPECIFICATION)

* **Base URL**: `http://localhost:3000/api`
* **Format**: JSON (`Content-Type: application/json`)
* **Kiến trúc**: Phân lớp chuẩn mực (Routes -> Controllers -> Services -> MongoDB Native Driver).

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
    "data": {
      "_id": "670...",
      "username": "DG-000001",
      "fullName": "Trần Minh Triết",
      "role": "USER",
      "phone": "0912345678",
      "trangThaiThe": "HoatDong",
      "soLanViPham": 0
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
* **Response (200 OK)**: Trả về thông tin phiên làm việc của độc giả.

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

* `GET /api/docgia`: [Manager/Admin] Danh sách độc giả (Hỗ trợ lọc: `?trangThai=Blacklist`, `?role=MANAGER`, `?search=...`).
* `GET /api/docgia/:id`: Xem hồ sơ độc giả theo `_id`, `MaDocGia` hoặc `DienThoai`.
* `POST /api/docgia`: Tạo hồ sơ độc giả mới.
* `PUT /api/docgia/:id`: Cập nhật thông tin cá nhân.
* `PUT /api/docgia/:id/role`: [Super Admin] Thăng cấp / hạ cấp vai trò (`role: "MANAGER"` hoặc `"USER"`).
* `PUT /api/docgia/:id/unblock`: [Super Admin] Mở khóa độc giả khỏi Blacklist (Reset `SoLanViPham = 0`, `TrangThaiThe = "HoatDong"`).
* `DELETE /api/docgia/:id`: [Super Admin] Xóa độc giả vĩnh viễn (Chặn xóa nếu còn phiếu mượn chưa hoàn tất).

---

## 5. Quản Lý Mượn - Trả & Xử Lý Sự Cố (`/api/theodoimuonsach`)

### 📌 `GET /api/theodoimuonsach`
* **Mô tả**: Lấy danh sách phiếu mượn (Lookup liên kết chi tiết `sachInfo`, `docGiaInfo`, `nhanVienInfo`).
* **Query Params**: `?maDocGia=DG-000001&trangThai=DangMuon`

### 📌 `POST /api/theodoimuonsach` (Độc giả đăng ký mượn)
* **Request Body**: `{ "MaDocGia": "DG-000001", "MaSach": "SACH-000001", "GhiChu": "..." }`
* **Xử lý**:
  - Chặn nếu thẻ độc giả bị `Blacklist` hoặc `Khoa` (HTTP 403).
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
  - Nếu `NgayTra > NgayHenTra`: Tự động tăng `SoLanViPham` của độc giả. Nếu đạt 3 lần, tự động chuyển sang `Blacklist`.

### 📌 `PUT /api/theodoimuonsach/:id/bao-mat` (Xử lý mất sách)
* **Request Body**: `{ "ghiChu": "Làm mất sách vật lý" }`
* **Xử lý**:
  - Chuyển `TrangThai: "MatSach"`.
  - Gán tiền bồi thường: `GiaTriBoiThuong = Sach.DonGia`.
  - **Không cộng hoàn trả kho** `SoQuyen`.
  - Tăng `SoLanViPham` của độc giả lên 1. Nếu đạt 3 lần, khóa thẻ đưa vào `Blacklist`.

---

## 6. Phân Hệ Thanh Toán Trực Tuyến MoMo (`/api/payment`)

### 📌 `POST /api/payment/momo/create` (Khởi tạo phiên thanh toán bồi thường)
* **Request Body**: `{ "borrowId": "670...", "amount": 85000, "orderInfo": "Bồi hoàn mất sách" }`
* **Response (200 OK)**: Trả về `payUrl` để độc giả thanh toán qua ví MoMo.

### 📌 `POST /api/payment/momo/ipn` (Webhook IPN MoMo Callback)
* **Mô tả**: Máy chủ MoMo thông báo trạng thái thanh toán, hệ thống tự động xác thực chữ ký HMAC-SHA256 và cập nhật trạng thái đã thanh toán cho phiếu mượn.

### 📌 `GET /api/payment/momo/status/:orderId`
* **Mô tả**: Truy vấn tình trạng giao dịch thanh toán MoMo theo mã đơn hàng.
