# 06. KỊCH BẢN KIỂM THỬ HỆ THỐNG (TESTING & QA SPECIFICATION)

Tài liệu này dùng để AI Agent và Lập trình viên đối chiếu, chạy bộ kiểm thử tự động và ghi nhận kết quả nghiệm thu toàn diện theo yêu cầu Báo cáo CT449.

---

## 1. Dữ Liệu Kiểm Thử Khởi Tạo (Test Fixtures / Seed Data)

### 1.1. Tài khoản kiểm thử mẫu
* **Super Admin**: `MSNV: "NV-0001"`, `MatKhau: "admin123"`, `ChucVu: "ADMIN"` (Mã hóa Bcrypt)
* **Thủ thư**: `MSNV: "NV-0002"`, `MatKhau: "staff123"`, `ChucVu: "THUTHU"` (Mã hóa Bcrypt)
* **Độc giả bình thường**: `MaDocGia: "DG-000001"`, `DienThoai: "0912345678"`, `MatKhau: "123456"`, `TrangThaiThe: "HoatDong"`, `SoLanViPham: 0`, `Role: "USER"`
* **Độc giả Blacklist**: `MaDocGia: "DG-000002"`, `DienThoai: "0987654321"`, `MatKhau: "123456"`, `TrangThaiThe: "Blacklist"`, `SoLanViPham: 3`, `Role: "USER"`

### 1.2. Sách kiểm thử mẫu
* **Sách còn tồn kho**: `MaSach: "SACH-000001"`, `TenSach: "Lập trình Web Hiện Đại với Vue.js 3 & Node.js"`, `SoQuyen: 5`, `DonGia: 85000`
* **Sách sắp hết kho**: `MaSach: "SACH-000002"`, `TenSach: "Cấu Trúc Dữ Liệu & Giải Thuật Ứng Dụng Nâng Cao"`, `SoQuyen: 1`, `DonGia: 120000`
* **Sách đã hết kho**: `MaSach: "SACH-000003"`, `TenSach: "Trí Tuệ Nhân Tạo & Học Sâu Nâng Cao"`, `SoQuyen: 0`, `DonGia: 200000`

---

## 2. Bảng Kịch Bản Kiểm Thử Backend API (Backend Test Matrix)

Chạy kiểm thử thực tế bằng lệnh: `node test_api.js` trong thư mục `backend/`.

| Mã TC | Chức Năng Kiểm Thử | Dữ Liệu Đầu Vào (Input) | Kết Quả Mong Đợi (Expected) | Trạng Thái |
|:---:|:---|:---|:---|:---:|
| **TC-AUTH-01** | Đăng nhập Super Admin thành công | `MSNV: "NV-0001"`, đúng mật khẩu | HTTP 200, Role `ADMIN` | ✅ PASSED |
| **TC-AUTH-02** | Đăng nhập sai mật khẩu | `MSNV: "NV-0001"`, mật khẩu sai | HTTP 401: Báo sai mật khẩu | ✅ PASSED |
| **TC-AUTH-03** | Độc giả đăng nhập bằng SĐT | `SĐT: "0912345678"`, pass `123456` | HTTP 200, trả về hồ sơ độc giả | ✅ PASSED |
| **TC-AUTH-04** | Đăng nhập qua tài khoản Google | `idToken: "sample_mock_google_id_token"` | HTTP 200, liên kết/tạo tài khoản Google | ✅ PASSED |
| **TC-BOOK-01** | Thêm sách mới hợp lệ | Đầy đủ thông tin, `SoQuyen: 10 >= 0` | HTTP 201, sách lưu vào DB | ✅ PASSED |
| **TC-BOOK-02** | Thêm sách trùng `MaSach` | `MaSach: "TEST_SACH_99"` đã tồn tại | HTTP 400: Báo trùng mã sách | ✅ PASSED |
| **TC-BORROW-01**| Độc giả gửi phiếu yêu cầu mượn | `DG-000001`, `TEST_SACH_99` | HTTP 201, trạng thái `ChoDuyet` | ✅ PASSED |
| **TC-BORROW-02**| Mượn sách khi đã hết kho | `DG-000001`, `SACH-000003` (`SoQuyen: 0`) | HTTP 400: Báo hết sách trong kho | ✅ PASSED |
| **TC-BORROW-03**| Mượn sách vượt hạn mức 3 cuốn | Độc giả đã có 3 cuốn chưa trả | HTTP 400: Chặn vượt hạn mức | ✅ PASSED |
| **TC-BORROW-04**| Độc giả Blacklist mượn sách | `DG-000002` (`TrangThaiThe: Blacklist`) | HTTP 403: Bị từ chối mượn | ✅ PASSED |
| **TC-BORROW-05**| Thủ thư duyệt đơn mượn | `id` đơn mượn, nhấn Duyệt | HTTP 200, `DangMuon`, kho giảm 10 -> 9, gán `MSNV` | ✅ PASSED |
| **TC-RETURN-01**| Xác nhận trả sách đúng hạn | `id` đơn mượn, nhấn Trả sách | HTTP 200, `DaTra`, kho hoàn lại 9 -> 10 | ✅ PASSED |
| **TC-RETURN-02**| Trả sách trễ hạn | Đơn mượn có `NgayTra > NgayHenTra` | HTTP 200, `SoLanViPham` tăng +1 | ✅ PASSED |
| **TC-RETURN-03**| Tự động Blacklist sau 3 lần trễ | Vi phạm lần thứ 3 | `TrangThaiThe` tự động đổi sang `Blacklist` | ✅ PASSED |
| **TC-LOSS-01**  | Báo mất sách | `id` đơn mượn, nhấn Báo mất | Trạng thái `MatSach`, kho giữ nguyên, phạt `GiaTriBoiThuong = DonGia` | ✅ PASSED |
| **TC-PAY-01**   | Khởi tạo thanh toán MoMo | `borrowId` của đơn báo mất sách | HTTP 200, tạo `payUrl` MoMo | ✅ PASSED |
| **TC-ADMIN-01** | Admin nâng cấp quyền người dùng | `DG-000001`, gán `Role = MANAGER` | HTTP 200, độc giả có quyền Thủ thư | ✅ PASSED |
| **TC-ADMIN-02** | Admin mở khóa Blacklist | `DG-000002`, nhấn Mở khóa | HTTP 200, `SoLanViPham = 0`, thẻ `HoatDong` | ✅ PASSED |

---

## 3. Bảng Kịch Bản Kiểm Thử Frontend (Frontend UI/UX Test Matrix)

| Mã UI | Luồng Thao Tác (User Flow) | Hành Vi Giao Diện Mong Đợi | Trạng Thái |
|:---:|:---|:---|:---:|
| **UI-01** | Xem danh mục sách trang chủ | Hiển thị đúng lưới thẻ sách Athenaeum, ảnh bìa, badge Còn/Hết sách | ✅ PASSED |
| **UI-02** | Tìm kiếm theo tên / Lọc theo NXB | Danh sách sách tự động lọc mượt mà theo từ khóa nhập vào | ✅ PASSED |
| **UI-03** | Bấm nút "Đăng ký mượn" | Hiển thị `BorrowModal` xác nhận; hiển thị Toast báo thành công | ✅ PASSED |
| **UI-04** | Sách hết số lượng (`SoQuyen == 0`) | Nút mượn bị vô hiệu hóa (disabled), hiển thị badge "Tạm hết sách" | ✅ PASSED |
| **UI-05** | Quản lý duyệt mượn trên bảng | Nhấn nút "Duyệt" -> Trạng thái đổi sang "Đang mượn" ngay trên bảng | ✅ PASSED |
| **UI-06** | Quản lý xác nhận trả / báo mất | Nhấn nút "Trả" -> Số lượng tồn kho trên bảng cập nhật tức thì | ✅ PASSED |
| **UI-07** | Độc giả xem trang cá nhân `/profile` | Hiển thị thẻ độc giả, số lỗi vi phạm (0/3), danh sách sách đang mượn và hạn trả | ✅ PASSED |
