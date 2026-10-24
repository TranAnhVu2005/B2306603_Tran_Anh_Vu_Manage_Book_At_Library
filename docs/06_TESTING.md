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
| TC-BOOK-SOFT-DELETE-01 | Xóa mềm sách và khôi phục | MANAGER xóa sách không có phiếu mở; Admin xem `includeDeleted=true` và khôi phục; MANAGER thử xem bản đã xóa | Document vẫn tồn tại với `deleted=true`; GET công khai/chi tiết và đăng ký mượn không tìm thấy; Admin khôi phục được; MANAGER không được xem dữ liệu đã xóa | 🟡 Chưa chạy |
| TC-AUDIT-01 | Collection/schema và phân quyền nhật ký | Tạo sách; Admin và nhân viên gọi `GET /api/nhatkykiemtoan?MaSach=...` | Collection `nhatkykiemtoan`, trường tiếng Việt (`HanhDong`, `LoaiDoiTuong`, `ThoiGian`); Admin đọc được, nhân viên bị từ chối | ✅ PASSED |
| **TC-BORROW-01**| Độc giả gửi phiếu yêu cầu mượn | Độc giả kiểm thử tạm thời, `TEST_SACH_99` | HTTP 201, trạng thái `ChoDuyet`, response chỉ có trường CDM của phiếu | ✅ PASSED |
| **TC-BORROW-02**| Mượn sách khi đã hết kho | Độc giả kiểm thử tạm thời, `SACH-000003` (`SoQuyen: 0`) | HTTP 400: Báo hết sách trong kho | ✅ PASSED |
| **TC-BORROW-03**| Mượn sách vượt hạn mức 3 cuốn | Độc giả đã có 3 cuốn chưa trả | HTTP 400: Chặn vượt hạn mức | ✅ PASSED |
| **TC-BORROW-04**| Độc giả trong danh sách đen mượn sách | Tạo độc giả kiểm thử với `TrangThaiThe: DanhSachDen` | HTTP 403: Bị từ chối mượn | ✅ PASSED |
| **TC-BORROW-05**| Thủ thư/Admin duyệt đơn mượn | Thử thiếu JWT, JWT độc giả, rồi JWT thủ thư/Admin | Thiếu JWT: HTTP 401; độc giả: HTTP 403; thủ thư/Admin: HTTP 200, `DangMuon`, kho giảm 10 -> 9, gán `MSNV` theo JWT | ✅ PASSED |
| **TC-RETURN-01**| Xác nhận trả sách đúng hạn | `id` đơn mượn, nhấn Trả sách | HTTP 200, `DaTra`, kho hoàn lại 9 -> 10 | ✅ PASSED |
| **TC-RETURN-02**| Trả sách trễ hạn | Đơn mượn có `NgayTra > NgayHenTra` | HTTP 200, `SoLanViPham` tăng +1 | ✅ PASSED |
| **TC-RETURN-03**| Tự động đưa vào danh sách đen sau 3 lần trễ | Vi phạm lần thứ 3 | `TrangThaiThe` tự động đổi sang `DanhSachDen` | ✅ PASSED |
| **TC-LOSS-01**  | Báo mất sách | `id` đơn mượn, nhấn Báo mất | Trạng thái `MatSach`, kho giữ nguyên, phạt `GiaTriBoiThuong = DonGia` | ✅ PASSED |
| **TC-PAY-01**   | Khởi tạo thanh toán MoMo (đặc tả tương lai) | `borrowId` của đơn báo mất sách | Khi triển khai: HTTP 200, tạo `payUrl` MoMo | ⚪ Chưa triển khai; chưa thuộc bộ test API hiện hành |
| **TC-ADMIN-01** | Admin nâng cấp quyền người dùng | Độc giả kiểm thử, gán `VaiTro = MANAGER` | HTTP 200, độc giả có `VaiTro = MANAGER`, không có trường ngoài CDM | ✅ PASSED |
| **TC-ADMIN-02** | Admin xét gỡ khỏi danh sách đen | Độc giả kiểm thử `DanhSachDen`; thử mở khóa khẩn cấp rồi xét gỡ riêng | Mở khóa khẩn cấp bị từ chối; xét gỡ chuyển sang `HoatDong` nhưng giữ `SoLanViPham = 3` | ✅ PASSED |
| **TC-ADMIN-03** | Admin khóa/mở khóa khẩn cấp | Thẻ hoạt động có 2 vi phạm; khóa/mở khóa rồi thử ở ngưỡng 3 lần | Thao tác giữ nguyên vi phạm; mở khóa ở ngưỡng 3 chuyển trạng thái về `DanhSachDen` | ✅ PASSED |
| TC-ADMIN-04 | Admin xem danh sách nhân viên | ADMIN gọi `GET /api/nhanvien`; MANAGER/USER thử gọi cùng endpoint | ADMIN nhận danh sách `nhanvien` không có `MatKhau`; MANAGER/USER bị từ chối; không trộn hồ sơ nhân viên với `docgia.VaiTro` | 🟡 Chưa chạy riêng |
| TC-AUDIT-02 | Kiểm toán vòng đời mượn-trả | Độc giả đăng ký; nhân viên duyệt, từ chối, xác nhận trả/báo mất; Admin đọc log | Mỗi sự kiện ghi actor đúng, mã/tên độc giả+sách, nhân viên thao tác, trạng thái và thời gian; USER/MANAGER không đọc được log | 🟡 Chưa chạy |

### Bổ sung ma trận kiểm thử bảo mật (chưa chạy — yêu cầu cho đợt triển khai bảo mật)

| Mã TC | Kiểm thử | Kết quả mong đợi |
|:---:|:---|:---|
| SEC-RBAC-01 | Gọi từng endpoint đặc quyền khi thiếu JWT, dùng JWT USER/MANAGER không đủ quyền, hoặc sửa ID tài nguyên sang người khác | HTTP 401/403; dữ liệu không đổi; quyền được kiểm tra ở backend |
| SEC-IN-01 | Gửi `$ne`, `$gt`, object/array thay cho scalar trong body/query/path | HTTP 400; không mở rộng truy vấn, không truy cập/sửa ngoài phạm vi |
| SEC-IN-02 | Gửi trường đặc quyền không thuộc whitelist trong POST/PUT/PATCH | Từ chối hoặc bỏ qua theo quy ước API; không thay đổi role, trạng thái, mã, tiền hay chủ sở hữu |
| SEC-XSS-01 | Lưu và đọc chuỗi HTML/script/event handler trong tên, mô tả, ghi chú | API/UI không thực thi script; nội dung được render an toàn; CSP có hiệu lực |
| SEC-CSRF-01 | Gửi request thay đổi dữ liệu từ origin không được phép khi cấu hình cookie auth (nếu có) | Bị từ chối do CSRF token/origin/SameSite; CORS không mở rộng tùy ý |
| SEC-AUTH-01 | Brute-force đăng nhập; token sai chữ ký, hết hạn, sai thuật toán/claim; token sau logout/đổi mật khẩu/khóa tài khoản | Rate limit; HTTP 401; token bị thu hồi theo chính sách; không lộ tài khoản/mật khẩu |
| SEC-XXE-01 | Gửi XML có DOCTYPE, external entity hoặc XInclude | XML bị từ chối hoặc parser an toàn; không đọc file nội bộ/gọi mạng |
| SEC-SSRF-01 | Thử URL loopback, private, link-local, cloud metadata, redirect tới IP cấm và DNS rebinding | Không phát sinh request tới đích cấm; outbound host chỉ nằm trong allowlist |
| SEC-UPLOAD-01 | Upload MIME giả, file không phải ảnh, SVG/HTML, file quá lớn và filename/path traversal | Bị từ chối; file không được thực thi/ghi đè đường dẫn; phản hồi không lộ đường dẫn nội bộ |
| SEC-OPS-01 | Kiểm tra CORS, security headers/CSP, body quá lớn và lỗi 500 trong production mode | CORS allowlist; headers theo chính sách; HTTP 413 khi vượt giới hạn; không lộ stack/secret |

Do backend dùng MongoDB Native Driver và không có parser XML, các ca SQLi/XXE phải được ghi nhận đúng phạm vi: kiểm tra NoSQL injection hiện tại; xác nhận XML không được chấp nhận. Nếu bổ sung SQL/XML sau này, mở rộng kiểm thử tương ứng.

Các kiểm thử tạo tài khoản nhân viên, quản trị viên và độc giả tạm thời trong lúc chạy, sau đó dọn dữ liệu kiểm thử. Assertions kiểm tra response hồ sơ, sách, nhà xuất bản và phiếu mượn không chứa trường ngoài CDM; `MatKhau` không được trả về.

### Kết quả lần chạy gần nhất

- `frontend_user` và `frontend_manage`: `npm run build` thành công. `frontend_manage` khởi động dev server tại `http://localhost:3002` sau khi cài dependencies.
- `backend`: lần chạy gần nhất ngày 2026-10-23 đạt 20 ca, 0 ca lỗi; `TC-AUDIT-01` xác nhận collection/schema mới và quyền Admin. MoMo vẫn là đặc tả tương lai, không có UI/API trong bản hiện hành. Các kiểm thử cần MongoDB local.
- Một lần chạy lại ngay sau đó tạm thời gặp HTTP 429 ở đăng nhập và lỗi dây chuyền; lần chạy kế tiếp đã đạt lại 20/20.
- Các ca `SEC-*` và kiểm thử trình duyệt `UI-12`–`UI-17` chưa được chạy; bảng ma trận là kế hoạch xác minh, không phải kết quả nghiệm thu.

---

## 3. Bảng Kịch Bản Kiểm Thử Frontend (Frontend UI/UX Test Matrix)

| Mã UI | Luồng Thao Tác (User Flow) | Hành Vi Giao Diện Mong Đợi | Trạng Thái |
|:---:|:---|:---|:---:|
| **UI-01** | Xem danh mục sách trang chủ | Hiển thị đúng lưới thẻ sách Athenaeum, ảnh bìa, badge Còn/Hết sách | ✅ PASSED |
| **UI-02** | Tìm kiếm theo tên / Lọc theo NXB / tình trạng kho | Tìm chính xác hoặc không dấu theo tên sách/tác giả/mã phải hiện thẻ sách; kết hợp bộ lọc NXB và còn kho, đếm trên toàn danh mục, xóa bộ lọc khôi phục đầy đủ danh sách; thẻ mới sau lọc không bị ẩn bởi reveal | ✅ PASSED |
| **UI-03** | Đăng ký mượn và kiểm tra Neo-brutalist `BorrowModal` | Dialog xác nhận dùng violet/vàng/giấy ngà, viền và bóng cứng; giữ ảnh bìa, ghi chú, điều khoản, loading/đóng/gửi; không tràn ở 320/375/768/1024/1440px | 🟡 Cần kiểm tra trình duyệt sau đổi style |
| **UI-04** | Sách hết số lượng (`SoQuyen == 0`) | Nút mượn bị vô hiệu hóa (disabled), hiển thị badge "Tạm hết sách" | ✅ PASSED |
| **UI-05** | Quản lý duyệt mượn trên bảng | Nhấn nút "Duyệt" -> Trạng thái đổi sang "Đang mượn" ngay trên bảng | ✅ PASSED |
| **UI-06** | Quản lý xác nhận trả / báo mất | Nhấn nút "Trả" -> Số lượng tồn kho trên bảng cập nhật tức thì | ✅ PASSED |
| **UI-07** | Độc giả tìm và xem hồ sơ cá nhân `/profile` | Sau đăng nhập, mục Hồ sơ cá nhân hiện rõ trên header/menu tài khoản/menu mobile; trang có tiêu đề Hồ sơ cá nhân, thẻ độc giả và lịch sử mượn được chia khu vực rõ ràng | 🟡 Build verified; cần rà lại trên trình duyệt |
| **UI-08** | Admin quản lý trạng thái thẻ | Bộ lọc Danh sách đen và `Khoa` tách biệt; khóa/mở khẩn cấp không reset vi phạm; xét gỡ khỏi danh sách đen là thao tác riêng | 🟡 Build verified; chưa chạy trình duyệt |
| UI-29 | Admin xem và lọc tài khoản độc giả/nhân viên | `/admin/users` dùng một danh sách; `Tất cả` đếm cả hai nguồn; `Quản lý / Thủ thư` trả độc giả `VaiTro=MANAGER` và nhân viên `ChucVu=THUTHU`; filter thẻ chỉ áp dụng độc giả; dòng nhân viên không có thao tác thẻ/role | 🟡 Cần rà giao diện trình duyệt; API nhân viên Admin-only |
| UI-30 | Màu sắc và khả năng đọc của thông báo toast | Kiểm tra toast thành công/lỗi ở cả hai cổng, nội dung dài và viewport 320/375/768/1024/1440px; kiểm tra tương phản chữ/nền, nút đóng bằng bàn phím và giảm chuyển động | Thành công xanh đậm, lỗi đỏ đậm, chữ trắng dễ đọc; không tràn ngang; focus rõ; animation tắt khi `prefers-reduced-motion`; hai cổng đồng nhất | 🟡 Build verified; cần rà trực quan |
| **UI-09** | Độc giả chỉnh sửa hồ sơ `/profile` | Từ mục Hồ sơ cá nhân mở form, sửa thông tin cho phép; lưu thành công cập nhật thẻ hồ sơ và phiên; lỗi API được thông báo | 🟡 Build verified; chưa chạy trình duyệt |
| **UI-10** | Nhân viên/Admin chỉnh sửa hồ sơ `/profile` | Hiển thị hồ sơ nhân viên; tự cập nhật họ tên, số điện thoại, địa chỉ và đồng bộ phiên; không cho sửa chức vụ/mã nhân viên | 🟡 Build verified; chưa chạy trình duyệt |
| **UI-11** | Kiểm tra bố cục responsive toàn hệ thống | Ở chiều rộng 320–768px không tràn ngang trang; bảng cuộn trong wrapper riêng; form, bộ lọc, modal và nút hành động không chồng lấn | 🟡 Build verified; cần kiểm thử trình duyệt trên đủ breakpoint |

### Kiểm thử kiến trúc hai frontend/domain (cần chạy sau khi tách ứng dụng)

| Mã UI | Luồng kiểm thử | Kết quả mong đợi |
|:---:|:---|:---|
| UI-12 | Khởi động `frontend_user/` và `frontend_manage/` đồng thời | User bind `localhost:3001`, Manage bind `localhost:3002`, không xung đột cổng; cả hai proxy API tới `localhost:3000` |
| UI-13 | Mở `frontend_user/` và kiểm tra menu/router | Chỉ có giao diện/route độc giả; không hiển thị màn hình/quyền quản lý hoặc Admin |
| UI-14 | Mở `frontend_manage/` bằng tài khoản USER/MANAGER/ADMIN | USER bị từ chối; MANAGER có toàn bộ chức năng thủ thư; ADMIN có toàn bộ chức năng thủ thư và chức năng Admin; API cũng trả 401/403 tương ứng |
| UI-15 | Điều hướng qua lại giữa hai ứng dụng | Dùng domain gốc theo cấu hình; không giả định localStorage dùng chung; cổng quản lý có liên kết cổng độc giả; app đích yêu cầu đăng nhập nếu không có phiên riêng |
| UI-16 | Gọi API từ hai origin local và hai origin production đã cấu hình | CORS cho phép origin đã allowlist và chặn origin không khai báo; RBAC backend giữ nguyên dù đổi origin |
| UI-17 | Build/deploy từng frontend độc lập | Mỗi app build từ thư mục/package riêng và nhận API URL/domain từ env phù hợp; không cần build chung một artifact |
| UI-18 | Kiểm tra header sau đăng nhập nhân viên và tải lại `/manager/borrows` | Header hiển thị tên + nhãn Thủ thư/Quản trị viên, menu đúng quyền, nút Đăng xuất; không còn CTA “Đăng nhập nhân viên” khi phiên hợp lệ; nếu `/me` thất bại thì không làm sai lệch quyền backend |
| UI-19 | Dùng ADMIN mở từng route nghiệp vụ và route Admin | ADMIN truy cập được `/manager/*` và `/admin/users`; MANAGER không vào `/admin/users`; menu phản ánh cùng ma trận |
| UI-20 | Tra cứu danh mục và chi tiết sách từ cổng quản lý | `/catalog` và `/catalog/books/:id` chạy cùng origin `frontend_manage`; tìm theo tên/tác giả/mã không dấu, lọc NXB/tồn kho, xem chi tiết, refresh; không có nút đăng ký mượn |
| UI-21 | Điều hướng `Cổng độc giả` từ cổng quản lý | Link dùng `VITE_USER_APP_URL`; thao tác hồ sơ/mượn yêu cầu phiên độc giả riêng vì localStorage không chia sẻ; trang nhân viên ở tab hiện tại giữ phiên |
| UI-22 | So sánh Header/Footer hai cổng | Banner, logo, màu, kiểu menu tài khoản, footer và nhịp bố cục đồng nhất với thiết kế cổng độc giả; chỉ khác link/nhãn theo quyền |
| UI-23 | Kiểm tra responsive hai cổng tại 320, 375, 768, 1024, 1440px | Không tràn ngang toàn trang; header dùng menu mobile, footer xếp cột; form/nút xuống dòng; bảng chỉ cuộn trong wrapper; dialog vừa viewport |
| UI-24 | Admin lọc nhật ký và tải thêm | `/admin/audit-logs` lọc theo hành động, mã sách/độc giả/nhân viên, loại đối tượng, ngày; tải các trang tiếp theo | Dữ liệu đúng bộ lọc, actor và chi tiết dễ đọc; bảng cuộn riêng trên mobile; không có nút sửa/xóa | 🟡 Chưa chạy |
| UI-25 | Quản lý sách xóa mềm | MANAGER xóa sách; Admin xem danh sách đã xóa và phục hồi | Sách giữ lại trong DB, bị ẩn khỏi tra cứu/mượn; Admin xem marker/thời điểm xóa và khôi phục; hành động xuất hiện trong audit log | 🟡 Chưa chạy |
| UI-26 | Neo-brutalist UI và ảnh nền | Mở trang chủ/catalog, đăng nhập/đăng ký, hồ sơ, quản lý và Admin tại 320/375/768/1024/1440px | Vàng/violet, viền đen, bóng cứng và trạng thái tương tác nhất quán; không tràn trang; bảng cuộn trong wrapper; checkbox/upload/modal không biến dạng; ảnh header/login/register/catalog vẫn còn, overlay hợp palette và chữ đủ tương phản | 🟡 Đã xử lý lỗi theo ảnh; build và spot-check cây giao diện; chưa xác nhận đủ breakpoint/routes |
| UI-27 | Kiểm tra phối màu và bố cục Header hai cổng | So sánh header user/manage ở desktop và mobile; mở menu, kiểm tra focus/active, tài khoản và CTA | Ảnh kệ sách còn nhận biết, không bị nhuộm magenta; banner tối vừa đủ cho chữ sáng; thanh điều hướng nền giấy ngà, mục active vàng; logo/trung tâm menu/tài khoản cân hàng trên desktop và không tràn ở 320–375px | 🟡 Chờ rà trình duyệt theo đủ breakpoint |
| UI-28 | Kiểm tra thẻ KPI mượn–trả | Mở `/manager/borrows` tại desktop và mobile; quét nhãn, số liệu, mô tả; bấm từng thẻ và dùng bàn phím | Thẻ có chiều cao gọn theo nội dung, số liệu dễ thấy; nhãn dài không tràn; màu trạng thái và thao tác lọc còn đúng; lưới co về hai cột/đơn cột phù hợp viewport | 🟡 Build verified; chờ rà trình duyệt |
# QA thông báo người dùng

| Mã | Kịch bản | Kết quả mong đợi |
|---|---|---|
| API-NOTI-01 | Gọi GET thông báo không JWT | 401 |
| API-NOTI-02 | Độc giả lấy hộp thư | Chỉ có thông báo của JWT hiện tại, có unreadCount |
| API-NOTI-03 | Nhân viên thử đọc/đánh dấu thông báo độc giả | Không lộ tin; cập nhật trả 404 |
| API-NOTI-04 | Chủ hộp thư đánh dấu một tin và tất cả tin đã đọc | 200; unreadCount giảm về 0 |
| API-NOTI-05 | Admin khóa/mở khóa độc giả, thủ thư duyệt/từ chối mượn | Hộp thư độc giả nhận sự kiện tương ứng |
| API-NOTI-06 | Admin tạo tài khoản nhân viên | Nhân viên mới nhận thông báo tài khoản đã tạo |
| API-NOTI-07 | Admin khóa/mở khóa độc giả | Độc giả nhận đúng hai thông báo trạng thái |
| API-AUTH-STAFF-01 | Nhân viên đăng nhập bằng số điện thoại | Số điện thoại hợp lệ đăng nhập được; MSNV và mật khẩu sai bị từ chối; tạo nhân viên thiếu/trùng số điện thoại bị từ chối |
| UI-NOTI-01 | Header khi đã đăng nhập ở hai cổng | Chuông, badge, panel và thao tác đọc hiển thị đúng; guest không thấy chuông |
| UI-NOTI-02 | Panel tại viewport 320/375/768/1024/1440px | Không tràn ngang trang; nội dung dài cuộn bên trong panel |
| UI-AUTH-STAFF-01 | Mở màn đăng nhập cổng quản lý | Nhãn yêu cầu số điện thoại; input tel; đăng nhập bằng số đã đăng ký |
## Thể loại sách
| Mã | Kịch bản | Kết quả mong đợi |
|---|---|---|
| API-GENRE-01 | Lấy danh mục; tạo sách thiếu thể loại hoặc dùng mã không tồn tại | GET 200; hai yêu cầu tạo bị từ chối 400 |
| API-GENRE-02 | Tạo sách có thể loại và lọc `maTheLoai` | Response có `MaTheLoai`; bộ lọc chỉ trả sách đúng mã |
| UI-GENRE-01 | Catalog hai cổng kết hợp lọc thể loại với từ khóa/NXB/tồn kho | Kết quả đúng; xóa lọc đặt lại “Tất cả thể loại” |
| UI-GENRE-02 | Form tạo/sửa sách và lọc kho ở 320/375/768/1024/1440px | Chọn thể loại bắt buộc, bố cục không tràn ngang |
| UI-CATALOG-PRICE-01 | Kết hợp lọc thể loại và bốn khoảng giá ở cả hai catalog | Sách trong đúng ngưỡng giá xuất hiện; các ngưỡng không chồng lấn; xóa lọc trả toàn bộ bộ lọc về mặc định |
| UI-CATALOG-LAYOUT-01 | Trang catalog ở 320/375/768/1024/1440px | Search rộng phía trên; sidebar trái ở desktop; mobile mở/đóng bằng nút “Bộ lọc”; không tràn ngang, kết quả vẫn đọc được |
| UI-CATALOG-FILTER-STYLE-01 | Sidebar lọc ở hai cổng | Khoảng đệm cân đối; nhãn và tiêu đề dễ phân biệt; nút đặt lại không cạnh tranh màu; select không quá cao/nặng; focus bàn phím rõ; không tràn ngang ở 320/375/768px |
| UI-CATALOG-FILTER-COLOR-01 | Màu sidebar ở hai cổng | Nền giấy ấm, chữ mực, nhấn vàng `#FDC800`; tím chỉ dùng cho hover/focus; checkbox/nhãn đồng bộ design token và đạt tương phản |
| UI-CATALOG-FILTER-POPOVER-01 | Mở NXB, thể loại và khoảng giá ở hai cổng | Cả ba dùng cùng kiểu popover; tối đa 280px, cuộn trong danh sách, nổi khỏi khung sidebar không bị cắt; chọn bằng chuột/bàn phím; Escape/nhấp ngoài đóng menu |
