# 06. KỊCH BẢN KIỂM THỬ HỆ THỐNG (TESTING & QA SPECIFICATION)

Tài liệu này dùng để AI Agent và Lập trình viên đối chiếu, chạy test thực tế và ghi nhận kết quả nghiệm thu trước khi bàn giao từng tính năng.

---

## 1. Dữ Liệu Kiểm Thử Khởi Tạo (Test Fixtures / Seed Data)

### 1.1. Tài khoản mẫu
* **Admin**: `MSNV: "ADMIN01"`, `Password: "admin123"`, `ChucVu: "ADMIN"`
* **Thủ thư**: `MSNV: "NV01"`, `Password: "staff123"`, `ChucVu: "THUTHU"`
* **Độc giả bình thường**: `MaDocGia: "DG01"`, `DienThoai: "0912345678"`, `TrangThaiThe: "HoatDong"`, `SoLanViPham: 0`, `Role: "USER"`
* **Độc giả Blacklist**: `MaDocGia: "DG02"`, `DienThoai: "0987654321"`, `TrangThaiThe: "Blacklist"`, `SoLanViPham: 3`, `Role: "USER"`

### 1.2. Sách mẫu
* **Sách còn tồn kho**: `MaSach: "S01"`, `TenSach: "Lập trình Web với Vue"`, `SoQuyen: 5`, `DonGia: 85000`, `MaNXB: "NXB01"`
* **Sách sắp hết kho**: `MaSach: "S02"`, `TenSach: "Cấu trúc dữ liệu và giải thuật"`, `SoQuyen: 1`, `DonGia: 120000`, `MaNXB: "NXB01"`
* **Sách đã hết kho**: `MaSach: "S03"`, `TenSach: "Trí tuệ nhân tạo nâng cao"`, `SoQuyen: 0`, `DonGia: 200000`, `MaNXB: "NXB01"`

---

## 2. Bảng Kịch Bản Kiểm Thử Backend API (Backend Test Matrix)

| Mã TC | Chức năng kiểm thử | Dữ liệu đầu vào (Input) | Kết quả mong đợi (Expected) | Trạng thái |
|:---:|:---|:---|:---|:---:|
| **TC-AUTH-01** | Đăng nhập Admin thành công | `MSNV: "ADMIN01"`, đúng mật khẩu | HTTP 200, trả về Role `ADMIN` | ✅ PASSED |
| **TC-AUTH-02** | Đăng nhập sai mật khẩu | `MSNV: "ADMIN01"`, pass sai | HTTP 401: Báo sai mật khẩu | ✅ PASSED |
| **TC-BOOK-01** | Thêm sách mới hợp lệ | Đầy đủ mã, tên, `SoQuyen >= 0` | HTTP 201, sách lưu vào DB | ✅ PASSED |
| **TC-BOOK-02** | Thêm sách trùng `MaSach` | `MaSach: "S01"` đã tồn tại | HTTP 400: Báo trùng mã sách | ✅ PASSED |
| **TC-BORROW-01**| Độc giả gửi yêu cầu mượn | `DG01`, `S01` (kho còn 5) | HTTP 201, trạng thái `ChoDuyet` (kho vẫn giữ 5) | ✅ PASSED |
| **TC-BORROW-02**| Mượn sách khi đã hết kho | `DG01`, `S03` (`SoQuyen: 0`) | HTTP 400: "Sách hiện đã hết trong kho" | ✅ PASSED |
| **TC-BORROW-03**| Mượn vượt quá hạn mức 3 cuốn | `DG01` đã có 3 đơn chưa trả | HTTP 400: "Đã đạt giới hạn tối đa 3 cuốn" | ✅ PASSED |
| **TC-BORROW-04**| Độc giả Blacklist mượn sách | `DG02` (`TrangThaiThe: Blacklist`) | HTTP 403: "Thẻ đang bị khóa, từ chối mượn" | ✅ PASSED |
| **TC-BORROW-05**| Thủ thư duyệt đơn mượn | `id` đơn mượn, nhấn Duyệt | HTTP 200, trạng thái `DangMuon`, kho `S01` giảm từ 5 -> 4 | ✅ PASSED |
| **TC-RETURN-01**| Xác nhận trả sách đúng hạn | `id` đơn mượn, nhấn Trả sách | HTTP 200, trạng thái `DaTra`, kho `S01` tăng lại 4 -> 5 | ✅ PASSED |
| **TC-RETURN-02**| Trả sách trễ hạn | `id` đơn có `NgayTra > NgayHenTra` | HTTP 200, độc giả `SoLanViPham` tăng +1 | ✅ PASSED |
| **TC-RETURN-03**| Tự động Blacklist sau 3 lần trễ | `DG01` trễ hạn lần thứ 3 | `TrangThaiThe` tự động đổi sang `Blacklist` | ✅ PASSED |
| **TC-LOSS-01**  | Báo mất sách | `id` đơn mượn, nhấn Báo mất | Trạng thái `MatSach`, kho **không cộng lại**, phạt `TienPhat = DonGia` | ✅ PASSED |
| **TC-ADMIN-01** | Admin nâng cấp quyền người dùng | `DG01`, gán `Role = MANAGER` | HTTP 200, `DG01` có quyền vào trang Quản lý | ✅ PASSED |
| **TC-ADMIN-02** | Admin mở khóa Blacklist | `DG02`, nhấn Mở khóa | HTTP 200, `SoLanViPham = 0`, thẻ `HoatDong` | ✅ PASSED |

---

## 3. Bảng Kịch Bản Kiểm Thử Frontend (Frontend UI/UX Test Matrix)

| Mã UI | Luồng thao tác (User Flow) | Hành vi giao diện mong đợi | Trạng thái |
|:---:|:---|:---|:---:|
| **UI-01** | Xem danh mục sách trang chủ | Hiển thị đúng lưới thẻ sách Athenaeum, ảnh bìa, badge Còn/Hết sách | ✅ PASSED |
| **UI-02** | Tìm kiếm theo tên / Lọc theo NXB | Danh sách sách tự động lọc mượt mà theo từ khóa nhập vào | ✅ PASSED |
| **UI-03** | Bấm nút "Đăng ký mượn" | Hiển thị `BorrowModal` xác nhận; hiển thị Toast báo thành công | ✅ PASSED |
| **UI-04** | Sách hết số lượng (`SoQuyen == 0`) | Nút mượn bị vô hiệu hóa (disabled), hiển thị badge "Tạm hết sách" | ✅ PASSED |
| **UI-05** | Quản lý duyệt mượn trên bảng | Nhấn nút "Duyệt" -> Trạng thái đổi sang "Đang mượn" ngay trên bảng | ✅ PASSED |
| **UI-06** | Quản lý xác nhận trả / báo mất | Nhấn nút "Trả" -> Số lượng tồn kho trên bảng cập nhật tức thì | ✅ PASSED |
| **UI-07** | Độc giả xem trang cá nhân `/profile` | Hiển thị thẻ độc giả, danh sách sách đang mượn và hạn trả còn lại | ✅ PASSED |
