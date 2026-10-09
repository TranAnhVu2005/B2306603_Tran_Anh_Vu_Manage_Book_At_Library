# 03. ĐẶC TẢ RESTFUL API (API SPECIFICATION)

* **Base URL**: `http://localhost:3000/api`
* **Format**: JSON (`Content-Type: application/json`)

---

## 1. Xác Thực & Phân Quyền (Auth & RBAC)

### 📌 `POST /api/auth/login` (Đăng nhập chung hoặc riêng)
* **Request**: `{ "identifier": "DG001" hoặc "NV01", "password": "..." }`
* **Response**: Thông tin người dùng kèm `Role` (`USER`, `MANAGER`, `ADMIN`).

### 📌 `PUT /api/users/:id/role` (Admin nâng cấp / hạ cấp người dùng)
* **Quyền thực hiện**: Chỉ `ADMIN`.
* **Request Body**: `{ "role": "MANAGER" }` hoặc `{ "role": "USER" }`
* **Response (200 OK)**: Cập nhật quyền thành công.

### 📌 `PUT /api/users/:id/unblock` (Admin mở khóa Blacklist)
* **Quyền thực hiện**: Chỉ `ADMIN`.
* **Request Body**: `{ "resetViPham": true }`
* **Response (200 OK)**: Đặt lại `SoLanViPham = 0`, `TrangThaiThe = "HoatDong"`.

---

## 2. Quản Lý Sách (`/api/sach`)

* `GET /api/sach`: Lấy danh sách sách (tìm kiếm theo tên, NXB, tác giả, trạng thái còn/hết).
* `GET /api/sach/:id`: Chi tiết 1 cuốn sách.
* `POST /api/sach`: [Manager/Admin] Thêm sách mới (`MaSach`, `TenSach`, `DonGia`, `SoQuyen`...).
* `PUT /api/sach/:id`: [Manager/Admin] Sửa thông tin sách / cập nhật số lượng nhập kho.
* `DELETE /api/sach/:id`: [Manager/Admin] Xóa sách (Chặn xóa nếu đang có người mượn).

---

## 3. Quản Lý Nhà Xuất Bản (`/api/nhaxuatban`)

* `GET /api/nhaxuatban`: Danh sách NXB.
* `POST /api/nhaxuatban`: [Manager/Admin] Thêm NXB mới.
* `PUT /api/nhaxuatban/:id`: [Manager/Admin] Cập nhật NXB.
* `DELETE /api/nhaxuatban/:id`: [Manager/Admin] Xóa NXB (Chặn xóa nếu còn sách).

---

## 4. Quản Lý Độc Giả (`/api/docgia`)

* `GET /api/docgia`: [Manager/Admin] Danh sách độc giả, lọc danh sách Blacklist (`?trangThai=Blacklist`).
* `GET /api/docgia/:id`: Xem hồ sơ độc giả + số lần vi phạm + lịch sử mượn.
* `POST /api/docgia`: Đăng ký tài khoản độc giả mới.
* `PUT /api/docgia/:id`: Cập nhật thông tin độc giả.

---

## 5. Quản Lý Mượn - Trả & Xử Lý Sự Cố (`/api/theodoimuonsach`)

### 📌 `POST /api/theodoimuonsach/dang-ky` (Độc giả đăng ký mượn)
* **Request Body**: `{ "MaDocGia": "DG001", "MaSach": "S001" }`
* **Quy tắc**:
  - Kiểm tra độc giả có bị Blacklist không.
  - Kiểm tra độc giả đã mượn đủ 3 quyển chưa.
  - Tạo phiếu với `TrangThai: "ChoDuyet"`.

### 📌 `PUT /api/theodoimuonsach/:id/duyet` (Thủ thư duyệt mượn)
* **Quyền thực hiện**: `MANAGER` hoặc `ADMIN`.
* **Xử lý**:
  - Kiểm tra tồn kho sách `SoQuyen > 0`.
  - Giảm tồn kho: `SoQuyen = SoQuyen - 1`.
  - Cập nhật: `TrangThai: "DangMuon"`, `NgayMuon: new Date()`, `NgayHenTra = NgayMuon + 14 ngày`.

### 📌 `PUT /api/theodoimuonsach/:id/tra-sach` (Xác nhận trả sách)
* **Quyền thực hiện**: `MANAGER` hoặc `ADMIN`.
* **Xử lý**:
  - Cập nhật: `TrangThai: "DaTra"`, `NgayTra: new Date()`.
  - Tăng tồn kho: `SoQuyen = SoQuyen + 1`.
  - Nếu `NgayTra > NgayHenTra`: Tự động tăng `SoLanViPham` của độc giả. Nếu đạt 3 lần, tự động chuyển thẻ sang `Blacklist`.

### 📌 `PUT /api/theodoimuonsach/:id/bao-mat` (Xử lý mất sách)
* **Quyền thực hiện**: `MANAGER` hoặc `ADMIN`.
* **Xử lý**:
  - Chuyển `TrangThai: "MatSach"`.
  - Tự động lấy `DonGia` của sách gán vào `TienPhat`.
  - **Không cộng hoàn trả kho** `SoQuyen`.
  - Tăng `SoLanViPham` của độc giả lên 1. Nếu đạt 3 lần, chuyển sang `Blacklist`.
