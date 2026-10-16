# 06. KỊCH BẢN KIỂM THỬ HỆ THỐNG (TESTING & QA SPECIFICATION)

Tài liệu này dùng để AI Agent và Lập trình viên đối chiếu, chạy bộ kiểm thử tự động và ghi nhận kết quả nghiệm thu toàn diện theo yêu cầu Báo cáo CT449.

---

## 1. Dữ Liệu Kiểm Thử Khởi Tạo (Test Fixtures / Seed Data)

### 1.1. Tài khoản kiểm thử mẫu
* **Nhân viên kiểm thử**: Được tạo tạm trong `test_api.js` với chức vụ `THUTHU` và mật khẩu kiểm thử.
* **Độc giả kiểm thử**: Được tạo tạm trong `test_api.js`; dùng lại cho kiểm tra đăng nhập, Danh sách đen và phân quyền, sau đó được xóa.

### 1.2. Sách kiểm thử mẫu
* **Sách còn tồn kho**: `MaSach: "SACH-000001"`, `TenSach: "Lập trình Web Hiện Đại với Vue.js 3 & Node.js"`, `SoQuyen: 5`, `DonGia: 85000`
* **Sách sắp hết kho**: `MaSach: "SACH-000002"`, `TenSach: "Cấu Trúc Dữ Liệu & Giải Thuật Ứng Dụng Nâng Cao"`, `SoQuyen: 1`, `DonGia: 120000`
* **Sách đã hết kho**: `MaSach: "SACH-000003"`, `TenSach: "Trí Tuệ Nhân Tạo & Học Sâu Nâng Cao"`, `SoQuyen: 0`, `DonGia: 200000`

---

## 2. Bảng Kịch Bản Kiểm Thử Backend API (Backend Test Matrix)

Chạy kiểm thử thực tế bằng lệnh: `node test_api.js` trong thư mục `backend/`.

| Mã TC | Chức Năng Kiểm Thử | Dữ Liệu Đầu Vào (Input) | Kết Quả Mong Đợi (Expected) | Trạng Thái |
|:---:|:---|:---|:---|:---:|
| **TC-AUTH-01** | Đăng nhập nhân viên thành công | Nhân viên kiểm thử, đúng mật khẩu | HTTP 200, trường dữ liệu theo lược đồ `nhanvien` | ✅ PASSED |
| **TC-AUTH-02** | Đăng nhập sai mật khẩu | Nhân viên kiểm thử, mật khẩu sai | HTTP 401: Báo sai mật khẩu | ✅ PASSED |
| **TC-AUTH-03** | Độc giả đăng nhập bằng SĐT | Độc giả kiểm thử, đúng mật khẩu | HTTP 200, trả hồ sơ tiếng Việt | ✅ PASSED |
| **TC-AUTH-04** | Từ chối Google ID Token không hợp lệ | `idToken: "sample_mock_google_id_token"` | HTTP 401, không tạo/đăng nhập tài khoản | ✅ PASSED |
| **TC-STATUS-01** | Chuẩn hóa trạng thái danh sách đen | Tạo độc giả với giá trị trạng thái cũ `Blacklist` | HTTP 400; chỉ chấp nhận `HoatDong`, `Khoa`, `DanhSachDen` | ✅ PASSED |
| **TC-PROFILE-01** | Độc giả cập nhật hồ sơ của mình | PUT hồ sơ có JWT của chủ tài khoản; thử thiếu token và token nhân viên | HTTP 200 khi đúng chủ; HTTP 401/403 khi thiếu quyền; chỉ trường cá nhân thay đổi, không lộ/sửa mật khẩu, vai trò, vi phạm hoặc trạng thái | ✅ PASSED |
| **TC-PROFILE-02** | Nhân viên/Admin tự cập nhật hồ sơ | PUT hồ sơ nhân viên có JWT; thử thiếu token và cập nhật hồ sơ người khác | HTTP 200 cho đúng chủ; HTTP 401/403 khi thiếu quyền; chỉ `HoTenNV`, `SoDienThoai`, `DiaChi` thay đổi, không lộ/sửa `MSNV`, `ChucVu` hoặc mật khẩu | ✅ PASSED |
| **TC-BOOK-01** | Thêm sách mới hợp lệ | Đầy đủ thông tin, `SoQuyen: 10 >= 0` | HTTP 201, sách lưu vào DB | ✅ PASSED |
| **TC-BOOK-02** | Thêm sách trùng `MaSach` | `MaSach: "TEST_SACH_99"` đã tồn tại | HTTP 400: Báo trùng mã sách | ✅ PASSED |
| **TC-BORROW-01**| Độc giả gửi phiếu yêu cầu mượn | Độc giả kiểm thử tạm thời, `TEST_SACH_99` | HTTP 201, trạng thái `ChoDuyet`, response chỉ có trường CDM của phiếu | ✅ PASSED |
| **TC-BORROW-02**| Mượn sách khi đã hết kho | Độc giả kiểm thử tạm thời, `SACH-000003` (`SoQuyen: 0`) | HTTP 400: Báo hết sách trong kho | ✅ PASSED |
| **TC-BORROW-03**| Mượn sách vượt hạn mức 3 cuốn | Độc giả đã có 3 cuốn chưa trả | HTTP 400: Chặn vượt hạn mức | ✅ PASSED |
| **TC-BORROW-04**| Độc giả trong danh sách đen mượn sách | Tạo độc giả kiểm thử với `TrangThaiThe: DanhSachDen` | HTTP 403: Bị từ chối mượn | ✅ PASSED |
| **TC-BORROW-05**| Thủ thư duyệt đơn mượn | `id` đơn mượn, nhấn Duyệt | HTTP 200, `DangMuon`, kho giảm 10 -> 9, gán `MSNV` | ✅ PASSED |
| **TC-RETURN-01**| Xác nhận trả sách đúng hạn | `id` đơn mượn, nhấn Trả sách | HTTP 200, `DaTra`, kho hoàn lại 9 -> 10 | ✅ PASSED |
| **TC-RETURN-02**| Trả sách trễ hạn | Đơn mượn có `NgayTra > NgayHenTra` | HTTP 200, `SoLanViPham` tăng +1 | ✅ PASSED |
| **TC-RETURN-03**| Tự động đưa vào danh sách đen sau 3 lần trễ | Vi phạm lần thứ 3 | `TrangThaiThe` tự động đổi sang `DanhSachDen` | ✅ PASSED |
| **TC-LOSS-01**  | Báo mất sách | `id` đơn mượn, nhấn Báo mất | Trạng thái `MatSach`, kho giữ nguyên, phạt `GiaTriBoiThuong = DonGia` | ✅ PASSED |
| **TC-PAY-01**   | Khởi tạo thanh toán MoMo | `borrowId` của đơn báo mất sách | HTTP 200, tạo `payUrl` MoMo | ✅ PASSED |
| **TC-ADMIN-01** | Admin nâng cấp quyền người dùng | Độc giả kiểm thử, gán `VaiTro = MANAGER` | HTTP 200, độc giả có `VaiTro = MANAGER`, không có trường ngoài CDM | ✅ PASSED |
| **TC-ADMIN-02** | Admin xét gỡ khỏi danh sách đen | Độc giả kiểm thử `DanhSachDen`; thử mở khóa khẩn cấp rồi xét gỡ riêng | Mở khóa khẩn cấp bị từ chối; xét gỡ chuyển sang `HoatDong` nhưng giữ `SoLanViPham = 3` | ✅ PASSED |
| **TC-ADMIN-03** | Admin khóa/mở khóa khẩn cấp | Thẻ hoạt động có 2 vi phạm; khóa/mở khóa rồi thử ở ngưỡng 3 lần | Thao tác giữ nguyên vi phạm; mở khóa ở ngưỡng 3 chuyển trạng thái về `DanhSachDen` | ✅ PASSED |

Các kiểm thử tạo tài khoản nhân viên, quản trị viên và độc giả tạm thời trong lúc chạy, sau đó dọn dữ liệu kiểm thử. Assertions kiểm tra response hồ sơ, sách, nhà xuất bản và phiếu mượn không chứa trường ngoài CDM; `MatKhau` không được trả về.

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
| **UI-08** | Admin quản lý trạng thái thẻ | Bộ lọc Danh sách đen và `Khoa` tách biệt; khóa/mở khẩn cấp không reset vi phạm; xét gỡ khỏi danh sách đen là thao tác riêng | 🟡 Build verified; chưa chạy trình duyệt |
| **UI-09** | Độc giả chỉnh sửa hồ sơ `/profile` | Mở form, sửa thông tin cá nhân, lưu thành công cập nhật thẻ hồ sơ và phiên; lỗi từ API được thông báo | 🟡 Build verified; chưa chạy trình duyệt |
| **UI-10** | Nhân viên/Admin chỉnh sửa hồ sơ `/profile` | Hiển thị hồ sơ nhân viên; tự cập nhật họ tên, số điện thoại, địa chỉ và đồng bộ phiên; không cho sửa chức vụ/mã nhân viên | 🟡 Build verified; chưa chạy trình duyệt |
