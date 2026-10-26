# 06. KỊCH BẢN KIỂM THỬ HỆ THỐNG (TESTING & QA SPECIFICATION)

Tài liệu này dùng để AI Agent và Lập trình viên đối chiếu, chạy bộ kiểm thử tự động và ghi nhận kết quả nghiệm thu toàn diện theo yêu cầu Báo cáo CT449.

---

## 1. Dữ Liệu Kiểm Thử Khởi Tạo (Test Fixtures / Seed Data)

### 1.1. Tài khoản kiểm thử mẫu
* **Nhân viên kiểm thử**: Được tạo tạm trong `test_api.js` với chức vụ `STAFF` và mật khẩu kiểm thử.
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
| **TC-AUTH-01** | Đăng nhập nhân viên và migration vai trò | Số điện thoại/mật khẩu hợp lệ; fixture legacy `ChucVu: THUTHU` | HTTP 200; `ChucVu` và JWT `role` là `STAFF`; migration đổi dữ liệu cũ sang `STAFF` | ✅ PASSED |
| **TC-AUTH-02** | Đăng nhập sai mật khẩu | Nhân viên kiểm thử, mật khẩu sai | HTTP 401: Báo sai mật khẩu | ✅ PASSED |
| **TC-AUTH-03** | Độc giả đăng nhập bằng SĐT | Độc giả kiểm thử, đúng mật khẩu | HTTP 200, trả hồ sơ tiếng Việt | ✅ PASSED |
| **TC-AUTH-04** | Từ chối Google ID Token không hợp lệ | Gọi `POST /api/auth/google` bằng token giả, thiếu token và trường ngoài allowlist | Token giả nhận HTTP 401, thiếu token nhận HTTP 400, trường ngoài allowlist bị từ chối; không cấp JWT | ✅ PASSED |
| **TC-AUTH-05** | Chỉ nhận số điện thoại làm thông tin đăng nhập | Kiểm tra mã `DG-...`, alias `identifier` và số điện thoại hợp lệ | HTTP 401 với mã hồ sơ; HTTP 400 với alias; số điện thoại đăng nhập được | ✅ PASSED |
| **TC-AUTH-06** | Đăng nhập Google thành công và liên kết hồ sơ độc giả | Dùng Google ID Token thật; kiểm tra người đọc mới, hồ sơ đã liên kết, email trùng duy nhất, email/Google ID xung đột và tài khoản xóa mềm | Chỉ cấp phiên `USER`; liên kết đúng hồ sơ hoặc tạo mới không có số điện thoại giả; trường hợp xung đột/xóa mềm bị từ chối | 🟡 Kiểm thử tích hợp thủ công bằng tài khoản Google đã cấu hình |
| **TC-ACCOUNT-SOFT-DELETE-01** | Xóa mềm/khôi phục độc giả và nhân viên | ADMIN xóa và khôi phục hồ sơ; thử đăng nhập và dùng JWT cũ | Document còn trong MongoDB với metadata xóa; danh sách mặc định ẩn, chỉ ADMIN xem `includeDeleted=true`; login/JWT cũ bị chặn; khôi phục giữ lịch sử và yêu cầu đăng nhập mới | ✅ PASSED |
| **TC-STATUS-01** | Chuẩn hóa trạng thái danh sách đen | Tạo độc giả với giá trị trạng thái cũ `Blacklist` | HTTP 400; chỉ chấp nhận `HoatDong`, `Khoa`, `DanhSachDen` | ✅ PASSED |
| **TC-PROFILE-01** | Độc giả cập nhật hồ sơ của mình | PUT hồ sơ có JWT của chủ tài khoản; thử thiếu token và token nhân viên | HTTP 200 khi đúng chủ; HTTP 401/403 khi thiếu quyền; chỉ trường cá nhân thay đổi, không lộ/sửa mật khẩu, vai trò, vi phạm hoặc trạng thái | ✅ PASSED |
| **TC-PROFILE-02** | Nhân viên/Admin tự cập nhật hồ sơ | PUT hồ sơ nhân viên có JWT; thử thiếu token và cập nhật hồ sơ người khác | HTTP 200 cho đúng chủ; HTTP 401/403 khi thiếu quyền; chỉ `HoTenNV`, `SoDienThoai`, `DiaChi` thay đổi, không lộ/sửa `MSNV`, `ChucVu` hoặc mật khẩu | ✅ PASSED |
| **TC-BOOK-01** | Thêm sách mới hợp lệ | Đầy đủ thông tin, `SoQuyen: 10 >= 0` | HTTP 201, sách lưu vào DB | ✅ PASSED |
| **TC-BOOK-02** | Thêm sách trùng `MaSach` | `MaSach: "TEST_SACH_99"` đã tồn tại | HTTP 400: Báo trùng mã sách | ✅ PASSED |
| TC-BOOK-SOFT-DELETE-01 | Xóa mềm sách và khôi phục | STAFF xóa sách không có phiếu mở; Admin xem `includeDeleted=true` và khôi phục; STAFF thử xem bản đã xóa | Document vẫn tồn tại với `deleted=true`; GET công khai/chi tiết và đăng ký mượn không tìm thấy; Admin khôi phục được; STAFF không được xem dữ liệu đã xóa | 🟡 Chưa chạy |
| TC-AUDIT-01 | Collection/schema và phân quyền nhật ký | Tạo sách; Admin và nhân viên gọi `GET /api/nhatkykiemtoan?MaSach=...` | Collection `nhatkykiemtoan`, trường tiếng Việt (`HanhDong`, `LoaiDoiTuong`, `ThoiGian`); Admin đọc được, nhân viên bị từ chối | ✅ PASSED |
| **TC-BORROW-01**| Độc giả gửi phiếu yêu cầu mượn | Độc giả kiểm thử tạm thời, `TEST_SACH_99` | HTTP 201, trạng thái `ChoDuyet`, response chỉ có trường CDM của phiếu | ✅ PASSED |
| **TC-CANCEL-01** | Độc giả hủy phiếu chờ duyệt | Hai cuốn đang mượn + một phiếu `ChoDuyet`; độc giả khác thử hủy; chủ phiếu hủy rồi đăng ký sách khác | Chỉ chủ phiếu hủy được; `ChoDuyet` chuyển `DaHuy` mà không đổi kho, giải phóng hạn mức; không hủy phiếu đã xử lý; audit có actor và trạng thái trước/sau | ✅ PASSED |
| **TC-CANCEL-02** | Độc giả hủy phiếu đã duyệt nhưng chưa nhận | Chủ phiếu hủy phiếu `ChoNhan` | Chuyển `DaHuy`, hoàn đúng một cuốn đã giữ về `SoQuyen`; không hủy sau bàn giao | ✅ PASSED |
| **TC-BORROW-02**| Mượn sách khi đã hết kho | Độc giả kiểm thử tạm thời, `SACH-000003` (`SoQuyen: 0`) | HTTP 400: Báo hết sách trong kho | ✅ PASSED |
| **TC-BORROW-03**| Mượn sách vượt hạn mức 3 cuốn | Độc giả đã có 3 cuốn chưa trả | HTTP 400: Chặn vượt hạn mức | ✅ PASSED |
| **TC-BORROW-04**| Độc giả trong danh sách đen mượn sách | Tạo độc giả kiểm thử với `TrangThaiThe: DanhSachDen` | HTTP 403: Bị từ chối mượn | ✅ PASSED |
| **TC-BORROW-05**| Duyệt và bàn giao phiếu mượn | Thiếu JWT, JWT độc giả, STAFF/ADMIN duyệt rồi xác nhận giao tại quầy | Thiếu JWT: 401; độc giả: 403; duyệt chuyển `ChoNhan`, trừ kho một cuốn, `HanNhan = NgayDuyet + 3`, `NgayMuon`/`NgayHenTra` còn null; bàn giao chuyển `DangMuon`, ghi `NgayMuon`, `NgayHenTra = NgayMuon + 14`, gán MSNV theo JWT và gửi thông báo | ✅ PASSED |
| **TC-BORROW-06** | Hủy và duyệt đồng thời | Độc giả hủy phiếu đúng lúc thủ thư duyệt | Một chuyển trạng thái thắng; phiếu đã hủy không được duyệt; nếu thao tác duyệt đã trừ kho thì kho được hoàn lại | 🟡 Chờ regression API |
| **TC-BORROW-07** | Phiếu chờ nhận quá hạn | Tạo fixture `ChoNhan` có `HanNhan` trước hôm nay rồi gọi API đọc danh sách | Tự chuyển `QuaHanNhan`, hoàn một cuốn về kho đúng một lần, audit `PHIEU_QUA_HAN_NHAN` và thông báo độc giả | ✅ PASSED |
| **TC-BORROW-08** | Độc giả gia hạn mượn | Chủ phiếu `DangMuon` trước hạn; thử anonymous, STAFF, độc giả khác, body giả mạo, quá hạn và hai request đồng thời | Chỉ chủ phiếu được gia hạn; hạn mới bằng hạn cũ + 7 ngày; lưu `SoLanGiaHan=1`/`NgayGiaHan`; chỉ một request đồng thời thành công; gia hạn lặp hoặc khi đến hạn trả HTTP 409; ghi audit và gửi thông báo | ✅ PASSED |
| **TC-RETURN-01**| Xác nhận trả sách đúng hạn | `id` đơn mượn, nhấn Trả sách | HTTP 200, `DaTra`, kho hoàn lại 9 -> 10 | ✅ PASSED |
| **TC-RETURN-02**| Trả sách trễ hạn | Đơn mượn có `NgayTra > NgayHenTra` | HTTP 200, `SoLanViPham` tăng +1 | ✅ PASSED |
| **TC-RETURN-03**| Tự động đưa vào danh sách đen sau 3 lần trễ | Vi phạm lần thứ 3 | `TrangThaiThe` tự động đổi sang `DanhSachDen` | ✅ PASSED |
| **TC-LOSS-01**  | Báo mất sách | `id` đơn mượn, nhấn Báo mất | Trạng thái `MatSach`, kho giữ nguyên, phạt `GiaTriBoiThuong = DonGia` | ✅ PASSED |
| **TC-PAY-01**   | Khởi tạo thanh toán MoMo (đặc tả tương lai) | `borrowId` của đơn báo mất sách | Khi triển khai: HTTP 200, tạo `payUrl` MoMo | ⚪ Chưa triển khai; chưa thuộc bộ test API hiện hành |
| **TC-STAFF-APPLICATION-01** | Đăng ký nhân viên, chặn đăng nhập chờ duyệt, Admin duyệt | Hồ sơ hợp lệ, Admin token | Hồ sơ chờ không nhận JWT; Admin duyệt tạo `STAFF`; đăng nhập thành công sau duyệt; độc giả không bị thay đổi; audit có sự kiện đăng ký/duyệt | ✅ PASSED |
| **TC-STAFF-APPLICATION-02** | Admin từ chối hồ sơ và ứng viên gửi lại | Hồ sơ chờ và lý do từ chối | Hồ sơ thành `TuChoi`, lý do chỉ trả cho ứng viên xác thực; không có JWT; gửi lại tạo trạng thái chờ và audit append-only | ✅ PASSED |
| **TC-STAFF-APPLICATION-03** | Gỡ endpoint thăng cấp cũ | Admin gọi `PUT /api/docgia/:id/role` | HTTP 404; không còn chức năng/hàm nâng cấp độc giả | ✅ PASSED |
| **SEC-STAFF-APPLICATION-01** | Chặn truy cập hồ sơ đăng ký | Gọi danh sách khi thiếu token hoặc token STAFF | HTTP 401/403; không lộ hồ sơ | ✅ PASSED |
| **TC-ADMIN-02** | Admin xét gỡ khỏi danh sách đen | Độc giả kiểm thử `DanhSachDen`; thử mở khóa khẩn cấp rồi xét gỡ riêng; kiểm tra audit; dùng chính JWT độc giả đã đăng nhập để gửi yêu cầu mượn | Mở khóa khẩn cấp bị từ chối; xét gỡ chuyển sang `HoatDong`, đặt `SoLanViPham = 0`, audit lưu trước/sau; phiên cũ không cần đăng nhập lại và mượn được | ✅ PASSED |
| **TC-ADMIN-03** | Admin khóa/mở khóa khẩn cấp | Thẻ hoạt động có 2 vi phạm; khóa/mở khóa rồi thử ở ngưỡng 3 lần | Thao tác giữ nguyên vi phạm; mở khóa ở ngưỡng 3 chuyển trạng thái về `DanhSachDen` | ✅ PASSED |
| **TC-STAFF-LOCK-01** | Admin khóa/mở khóa thủ thư và chống tự khóa qua API | Admin/STAFF gọi lock; Admin thử khóa chính mình bằng ObjectId/MSNV; dùng JWT cũ trong/sau khóa; đăng nhập bằng đúng và sai mật khẩu khi tài khoản khóa | Chỉ Admin khóa thủ thư; self-lock và khóa Admin bị 403; `TrangThaiThe` cập nhật; JWT cũ bị 401; mật khẩu đúng nhận 403 với hướng dẫn tài khoản đang khóa, mật khẩu sai vẫn nhận lỗi chung 401; token mới chỉ dùng được sau mở khóa; có audit log và thông báo | ✅ PASSED |
| TC-ADMIN-04 | Admin xem danh sách nhân viên | ADMIN gọi `GET /api/nhanvien`; STAFF/USER thử gọi cùng endpoint | ADMIN nhận danh sách `nhanvien` không có `MatKhau`; STAFF/USER bị từ chối; không trộn hồ sơ nhân viên với `docgia.VaiTro` | 🟡 Chưa chạy riêng |
| TC-AUDIT-02 | Kiểm toán vòng đời mượn-trả | Độc giả đăng ký; nhân viên duyệt, từ chối, xác nhận trả/báo mất; Admin đọc log | Mỗi sự kiện ghi actor đúng, mã/tên độc giả+sách, nhân viên thao tác, trạng thái và thời gian; USER/STAFF không đọc được log | 🟡 Chưa chạy |

### Bổ sung ma trận kiểm thử bảo mật (chưa chạy — yêu cầu cho đợt triển khai bảo mật)

| Mã TC | Kiểm thử | Kết quả mong đợi |
|:---:|:---|:---|
| SEC-RBAC-01 | Gọi từng endpoint đặc quyền khi thiếu JWT, dùng JWT USER/STAFF không đủ quyền, hoặc sửa ID tài nguyên sang người khác | HTTP 401/403; dữ liệu không đổi; quyền được kiểm tra ở backend |
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

Các kiểm thử tạo tài khoản nhân viên, quản trị viên, độc giả và fixture tạm thời. Khi kết thúc, harness dọn hồ sơ/thông báo/phiếu kiểm thử bằng cách xóa vật lý đúng fixture, xóa vật lý sách fixture (API nghiệp vụ chỉ soft delete), và xóa các audit log chỉ gắn với mã sách hoặc tác nhân fixture. Không xóa nhật ký của hoạt động nghiệp vụ thật. Sau mỗi lượt chạy, xác nhận các fixture không còn trong database. Assertions kiểm tra response hồ sơ, sách, nhà xuất bản và phiếu mượn không chứa trường ngoài CDM; `MatKhau` không được trả về.

### Kết quả lần chạy gần nhất

- `frontend_user` và `frontend_manage`: build thành công ngày 2026-10-25; build lại sau thay đổi luồng mượn đều thành công.
- `backend`: lần chạy mới nhất ngày 2026-10-25 đạt **29/29**. Bao gồm đăng ký → duyệt giữ sách → bàn giao mới tính hạn 14 ngày, quá hạn nhận tự hoàn kho, hủy phiếu `ChoNhan`, gia hạn đúng 7 ngày (quyền sở hữu, chặn quá hạn/body giả mạo, hai request đồng thời chỉ có một thành công), cùng kiểm tra báo mất sau khi đã bàn giao. Harness dọn fixture sau lượt chạy thành công.
- `backend`: đợt kiểm thử trước đạt 26/26; gồm JWT dùng role `STAFF`, migration `THUTHU` sang `STAFF`, chuẩn hóa `VaiTro` độc giả cũ về `USER` và kiểm tra xử lý khóa tài khoản.
- MoMo vẫn là đặc tả tương lai, chưa có UI/API trong bản hiện hành. Bộ API test cần MongoDB local.
- Các ca `SEC-*` và kiểm thử trình duyệt `UI-12`–`UI-17` chưa được chạy; bảng ma trận là kế hoạch xác minh, không phải kết quả nghiệm thu.

---

## 3. Bảng Kịch Bản Kiểm Thử Frontend (Frontend UI/UX Test Matrix)

| Mã UI | Luồng Thao Tác (User Flow) | Hành Vi Giao Diện Mong Đợi | Trạng Thái |
|:---:|:---|:---|:---:|
| **UI-01** | Xem danh mục sách trang chủ | Hiển thị đúng lưới thẻ sách Athenaeum, ảnh bìa, badge Còn/Hết sách | ✅ PASSED |
| **UI-02** | Tìm kiếm theo tên / Lọc theo NXB / tình trạng kho | Tìm chính xác hoặc không dấu theo tên sách/tác giả/mã phải hiện thẻ sách; kết hợp bộ lọc NXB và còn kho, đếm trên toàn danh mục, xóa bộ lọc khôi phục đầy đủ danh sách; thẻ mới sau lọc không bị ẩn bởi reveal | ✅ PASSED |
| **UI-03** | Đăng ký mượn và kiểm tra Neo-brutalist `BorrowModal` | Dialog xác nhận dùng violet/vàng/giấy ngà, viền và bóng cứng; giữ ảnh bìa, ghi chú, điều khoản, loading/đóng/gửi; không tràn ở 320/375/768/1024/1440px | 🟡 Cần kiểm tra trình duyệt sau đổi style |
| **UI-04** | Sách hết số lượng (`SoQuyen == 0`) | Nút mượn bị vô hiệu hóa (disabled), hiển thị badge "Tạm hết sách" | ✅ PASSED |
| **UI-05** | Quản lý duyệt và bàn giao mượn trên bảng | Nút **Duyệt & giữ sách** chuyển phiếu sang **Chờ nhận sách**, hiển thị hạn nhận 3 ngày; chỉ nút **Xác nhận giao sách** sau khi bàn giao tại quầy mới chuyển **Đang mượn**, bắt đầu hạn 14 ngày | 🟡 Cần kiểm tra trình duyệt |
| **UI-18** | Độc giả theo dõi hạn nhận/hạn trả và hủy trước bàn giao | Hồ sơ hiển thị ngày đăng ký, hạn nhận hoặc hạn trả theo trạng thái; hủy `ChoNhan` trả sách giữ về kho; quá hạn nhận chuyển lịch sử | 🟡 Cần kiểm tra trình duyệt |
| **UI-19** | Độc giả gia hạn sách đang mượn | Trong tab Đang mượn, chọn gia hạn trước hạn, xác nhận dialog, thử trường hợp đã gia hạn/đến hạn | Dialog cho thấy hạn mới thêm 7 ngày; sau thành công cập nhật hạn và ghi nhận 1/1; ẩn thao tác; mobile không tràn ngang | 🟡 Cần kiểm tra trình duyệt |
| **UI-06** | Quản lý xác nhận trả / báo mất | Nhấn nút "Trả" -> Số lượng tồn kho trên bảng cập nhật tức thì | ✅ PASSED |
| **UI-07** | Độc giả tìm và xem hồ sơ cá nhân `/profile` | Sau đăng nhập, mục Hồ sơ cá nhân hiện rõ trên header/menu tài khoản/menu mobile; trang có tiêu đề Hồ sơ cá nhân, thẻ độc giả và lịch sử mượn được chia khu vực rõ ràng | 🟡 Build verified; cần rà lại trên trình duyệt |
| **UI-08** | Admin quản lý trạng thái thẻ | Bộ lọc Danh sách đen và `Khoa` tách biệt; khóa/mở khẩn cấp không reset vi phạm; xét gỡ khỏi danh sách đen là thao tác riêng | 🟡 Build verified; chưa chạy trình duyệt |
| UI-29 | Admin xem danh sách tài khoản và duyệt ứng tuyển | `/admin/users` liệt kê độc giả/nhân viên, không hiển thị thao tác thăng cấp; `/admin/staff-applications` chỉ Admin xem, duyệt hoặc từ chối hồ sơ | 🟡 Cần rà giao diện trình duyệt; API cưỡng chế Admin-only |
| UI-30 | Màu sắc và khả năng đọc của thông báo toast | Kiểm tra toast thành công/lỗi ở cả hai cổng, nội dung dài và viewport 320/375/768/1024/1440px; kiểm tra tương phản chữ/nền, nút đóng bằng bàn phím và giảm chuyển động | Thành công xanh đậm, lỗi đỏ đậm, chữ trắng dễ đọc; không tràn ngang; focus rõ; animation tắt khi `prefers-reduced-motion`; hai cổng đồng nhất | 🟡 Build verified; cần rà trực quan |
| **UI-09** | Độc giả chỉnh sửa hồ sơ `/profile` | Từ mục Hồ sơ cá nhân mở form, sửa thông tin cho phép; lưu thành công cập nhật thẻ hồ sơ và phiên; lỗi API được thông báo | 🟡 Build verified; chưa chạy trình duyệt |
| **UI-10** | Nhân viên/Admin chỉnh sửa hồ sơ `/profile` | Hiển thị hồ sơ nhân viên; tự cập nhật họ tên, số điện thoại, địa chỉ và đồng bộ phiên; không cho sửa chức vụ/mã nhân viên; kiểm tra header trang không có CTA “Tìm thêm sách” | Hồ sơ gọn, không có CTA không liên quan; 🟡 Build verified; chưa chạy trình duyệt |
| **UI-11** | Kiểm tra bố cục responsive toàn hệ thống | Ở chiều rộng 320–768px không tràn ngang trang; bảng cuộn trong wrapper riêng; form, bộ lọc, modal và nút hành động không chồng lấn | 🟡 Build verified; cần kiểm thử trình duyệt trên đủ breakpoint |
| **UI-BORROW-CANCEL-01** | Hủy phiếu mượn trong tab Chờ duyệt | Mở hồ sơ độc giả, chọn Chờ duyệt, hủy một phiếu ở 320/375/768/1024/1440px | Chỉ có thao tác ở phiếu đang chờ; dialog giấy–mực có hierarchy gọn, tựa sách dễ nhận biết, giải thích rõ, CTA vàng và ghi chú tồn kho; mobile không tràn và nút xếp dọc; thành công chuyển phiếu vào Lịch sử với nhãn Đã hủy; toast lỗi khi thủ thư đã xử lý trước | 🟡 Chờ rà trực quan trên trình duyệt |
| **UI-MANAGE-BOOKS-01** | Bảng kho: nhóm thông tin và thao tác sửa/xóa | Rà trang `/manager/books` ở 320/375/768/1024/1440px; kiểm tra cột NXB/thể loại, năm XB/đơn giá, thao tác hàng | Desktop hiển thị đủ cột thao tác trong khung; màn hẹp chỉ cuộn wrapper bảng và cột thao tác bám mép phải; không tràn trang | 🟡 Chờ rà trực quan trên trình duyệt |
| **UI-MANAGE-PUBLISHER-EDIT-01** | Chỉnh sửa nhà xuất bản | Mở sửa NXB có sẵn mã/tên/địa chỉ, cập nhật tên và địa chỉ; lưu lại | Request chỉ gửi `TENNXB`, `DiaChi`; API trả thành công, dữ liệu mới hiển thị trong bảng, `MaNXB` không thay đổi |
| **UI-STAFF-BORROW-SEARCH-01** | Kích thước ô tìm kiếm trên `/manager/borrows` | Rà hàng tab và tìm kiếm tại 320/375/768/1024/1440px; thử cả tab Đang mượn có lọc quá hạn | Desktop ô tìm kiếm giãn vào khoảng trống còn lại; lọc quá hạn không làm ô co bất thường; mobile xếp gọn và không tràn ngang |

### Kiểm thử kiến trúc hai frontend/domain (cần chạy sau khi tách ứng dụng)

| Mã UI | Luồng kiểm thử | Kết quả mong đợi |
|:---:|:---|:---|
| UI-12 | Khởi động `frontend_user/` và `frontend_manage/` đồng thời | User bind `localhost:3001`, Manage bind `localhost:3002`, không xung đột cổng; cả hai proxy API tới `localhost:3000` |
| UI-13 | Mở `frontend_user/` và kiểm tra menu/router | Chỉ có giao diện/route độc giả; không hiển thị màn hình/quyền quản lý hoặc Admin |
| UI-14 | Mở `frontend_manage/` bằng tài khoản USER/STAFF/ADMIN | USER bị từ chối; STAFF có toàn bộ chức năng thủ thư; ADMIN có toàn bộ chức năng thủ thư và chức năng Admin; API cũng trả 401/403 tương ứng |
| UI-15 | Điều hướng qua lại giữa hai ứng dụng | Dùng domain gốc theo cấu hình; không giả định localStorage dùng chung; cổng quản lý có liên kết cổng độc giả; app đích yêu cầu đăng nhập nếu không có phiên riêng |
| UI-16 | Gọi API từ hai origin local và hai origin production đã cấu hình | CORS cho phép origin đã allowlist và chặn origin không khai báo; RBAC backend giữ nguyên dù đổi origin |
| UI-17 | Build/deploy từng frontend độc lập | Mỗi app build từ thư mục/package riêng và nhận API URL/domain từ env phù hợp; không cần build chung một artifact |
| UI-18 | Kiểm tra header sau đăng nhập nhân viên và tải lại `/manager/borrows` | Header hiển thị tên + nhãn Thủ thư/Quản trị viên, menu đúng quyền, nút Đăng xuất; không còn CTA “Đăng nhập nhân viên” khi phiên hợp lệ; nếu `/me` thất bại thì không làm sai lệch quyền backend |
| UI-19 | Dùng ADMIN mở từng route nghiệp vụ và route Admin | ADMIN truy cập được `/manager/*` và `/admin/users`; STAFF không vào `/admin/users`; menu phản ánh cùng ma trận |
| UI-20 | Tra cứu danh mục và chi tiết sách từ cổng quản lý | `/catalog` và `/catalog/books/:id` chạy cùng origin `frontend_manage`; tìm theo tên/tác giả/mã không dấu, lọc NXB/tồn kho, xem chi tiết, refresh; không có nút đăng ký mượn |
| UI-29 | Chi tiết sách hai cổng | Mở `/books/:id` ở `frontend_user` và `/catalog/books/:id` ở `frontend_manage`; kiểm tra ảnh bìa, mã, thể loại, NXB, năm, đơn giá, tóm tắt và trạng thái tồn kho | Bố cục dùng nền giấy, viền mực/bóng cứng, Be Vietnam Pro và cùng thứ bậc thông tin; thể loại khớp `MaTheLoai`; ảnh bìa được giữ; chỉ cổng độc giả có CTA/ Borrow Modal, cổng quản lý chỉ có thông tin tồn kho |
| UI-30 | Responsive trang chi tiết sách | Rà hai route chi tiết ở 320/375/768/1024/1440px, thử tên sách/mô tả dài và trạng thái hết sách | Không tràn ngang; mobile xếp ảnh và nội dung dọc, thông số về một cột ở màn hẹp; CTA vừa chiều rộng; ảnh bìa giữ tỷ lệ; badge/status đọc được |
| UI-21 | Điều hướng `Cổng độc giả` từ cổng quản lý | Link dùng `VITE_USER_APP_URL`; thao tác hồ sơ/mượn yêu cầu phiên độc giả riêng vì localStorage không chia sẻ; trang nhân viên ở tab hiện tại giữ phiên |
| UI-22 | So sánh Header/Footer hai cổng | Banner, logo, màu, kiểu menu tài khoản, footer và nhịp bố cục đồng nhất với thiết kế cổng độc giả; chỉ khác link/nhãn theo quyền |
| UI-23 | Kiểm tra responsive hai cổng tại 320, 375, 768, 1024, 1440px | Không tràn ngang toàn trang; header dùng menu mobile, footer xếp cột; form/nút xuống dòng; bảng chỉ cuộn trong wrapper; dialog vừa viewport |
| UI-24 | Admin lọc nhật ký và tải thêm | `/admin/audit-logs` lọc theo hành động, mã sách/độc giả/nhân viên, loại đối tượng, ngày; tải các trang tiếp theo | Dữ liệu đúng bộ lọc, actor và chi tiết dễ đọc; bảng cuộn riêng trên mobile; không có nút sửa/xóa | 🟡 Chưa chạy |
| UI-36 | Cách trình bày sự kiện và chi tiết nhật ký | Mở `/admin/audit-logs`, đối chiếu thao tác đăng ký/duyệt/từ chối/khóa/mở khóa nhân viên và các trạng thái trong cột chi tiết; rà ở desktop/mobile | Sự kiện là nhãn tiếng Việt có dấu kèm mô tả ngắn; các tên trường/trạng thái kỹ thuật được dịch; chi tiết chia dòng, có khoảng cách, chữ không bị dính và nội dung dài tự ngắt trong wrapper bảng | 🟡 Chờ rà trực quan |
| UI-25 | Quản lý sách xóa mềm | STAFF xóa sách; Admin xem danh sách đã xóa và phục hồi | Sách giữ lại trong DB, bị ẩn khỏi tra cứu/mượn; Admin xem marker/thời điểm xóa và khôi phục; hành động xuất hiện trong audit log | 🟡 Chưa chạy |
| UI-26 | Neo-brutalist UI và ảnh nền | Mở trang chủ/catalog, đăng nhập/đăng ký, hồ sơ, quản lý và Admin tại 320/375/768/1024/1440px | Vàng/violet, viền đen, bóng cứng và trạng thái tương tác nhất quán; không tràn trang; bảng cuộn trong wrapper; checkbox/upload/modal không biến dạng; ảnh header/login/register/catalog vẫn còn, overlay hợp palette và chữ đủ tương phản | 🟡 Đã xử lý lỗi theo ảnh; build và spot-check cây giao diện; chưa xác nhận đủ breakpoint/routes |
| UI-27 | Kiểm tra phối màu và bố cục Header hai cổng | So sánh header user/manage ở desktop và mobile; mở menu, kiểm tra focus/active, tài khoản và CTA | Ảnh kệ sách còn nhận biết, không bị nhuộm magenta; banner tối vừa đủ cho chữ sáng; thanh điều hướng nền giấy ngà, mục active vàng; logo/trung tâm menu/tài khoản cân hàng trên desktop và không tràn ở 320–375px | 🟡 Chờ rà trình duyệt theo đủ breakpoint |
| UI-32 | Khoảng cách giữa menu Admin và chuông thông báo | Đăng nhập Admin, rà header cổng quản lý tại 1200/1280/1366/1440px và mobile; tương tác từng nút | Menu Quản trị người dùng và chuông không chạm/chồng nhau; chuông tách biệt khỏi nhóm nav nhưng vẫn gần cụm tài khoản; mobile giữ khoảng cách thao tác và không tràn ngang |
| UI-28 | Kiểm tra thẻ KPI mượn–trả | Mở `/manager/borrows` tại desktop và mobile; quét nhãn, số liệu, mô tả; bấm từng thẻ và dùng bàn phím | Thẻ có chiều cao gọn theo nội dung, số liệu dễ thấy; nhãn dài không tràn; màu trạng thái và thao tác lọc còn đúng; lưới co về hai cột/đơn cột phù hợp viewport | 🟡 Build verified; chờ rà trình duyệt |
| UI-31 | Trang mặc định cổng nhân viên | Mở origin gốc của `frontend_manage` và mở trực tiếp `/catalog` | `/` chuyển tới `/login`; `/catalog` vẫn truy cập công khai khi được mở trực tiếp; route nghiệp vụ sau đăng nhập vẫn giữ redirect an toàn |
| UI-33 | Điều hướng đích sau đăng nhập theo vai trò | Đăng nhập ADMIN/STAFF không có redirect; kiểm tra thêm `/login` khi mỗi vai trò đã có phiên và redirect hợp lệ từ route nghiệp vụ | ADMIN mặc định vào `/admin/users`; STAFF mặc định vào `/manager/borrows`; phiên hiện hữu ở `/login` cũng được phân tuyến tương ứng; redirect nội bộ hợp lệ vẫn được giữ và redirect ngoài app bị loại |
| UI-34 | Admin quản lý khóa tài khoản thủ thư | Mở danh sách tài khoản, lọc tài khoản/thẻ bị khóa, khóa/mở thủ thư; xem hàng Admin | Trạng thái thủ thư rõ ràng, yêu cầu lý do, cập nhật sau thao tác; không hiện nút khóa Admin; toast thành công/lỗi; bộ lọc đếm độc giả và nhân viên bị khóa |
| UI-35 | Dialog lý do khóa/mở khóa thủ thư | Mở dialog từ cả hai thao tác; thử lý do rỗng, giới hạn ký tự, Hủy, Escape, Tab/Shift+Tab, xác nhận và trạng thái đang gửi; rà 320/375/768/1024/1440px | Không xuất hiện prompt/confirm mặc định; lý do bắt buộc và tối đa 500 ký tự; dialog giữ focus, khóa cuộn nền, vừa viewport, thao tác rõ theo màu Neo-brutalism và gọi API đúng lý do | 🟡 Chờ rà trực quan |
| UI-37 | Đồng bộ trạng thái thẻ sau khi Admin xét gỡ khỏi danh sách đen | Giữ phiên độc giả đang hoạt động; Admin gỡ thẻ; nhận thông báo hoặc bấm mượn ngay từ catalog/chi tiết sách | Phiên hiện tại đồng bộ trạng thái qua `/me`; không hiện cảnh báo Danh sách đen cũ; Borrow Modal mở khi backend xác nhận thẻ hoạt động; trạng thái vẫn bị khóa thì hiển thị cảnh báo tương ứng | 🟡 Chờ rà trực quan |
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
| UI-AUTH-STAFF-02 | Khách mở `/catalog` và `/catalog/books/:id` tại cổng quản lý | Danh mục/chi tiết tải công khai cùng origin, không bị chuyển tới login; API đọc không cần JWT và không xuất hiện thao tác mượn |
| UI-AUTH-STAFF-03 | Mở `/login`, `/staff-register` trên desktop/mobile và đăng nhập từ URL nghiệp vụ | Header có lối đăng ký nhân viên dễ tìm ở desktop và menu mobile; form login vẫn có link đăng ký; redirect chỉ nhận đường dẫn nội bộ hợp lệ, giữ đúng trang nghiệp vụ/catalog sau đăng nhập; người đã có phiên staff vào login được chuyển tới khu vực nghiệp vụ |
## Thể loại sách
| Mã | Kịch bản | Kết quả mong đợi |
|---|---|---|
| API-GENRE-01 | Lấy danh mục; tạo sách thiếu thể loại hoặc dùng mã không tồn tại | GET 200; hai yêu cầu tạo bị từ chối 400 |
| API-GENRE-02 | Tạo sách có thể loại và lọc `maTheLoai` | Response có `MaTheLoai`; bộ lọc chỉ trả sách đúng mã |
| UI-GENRE-01 | Catalog hai cổng kết hợp lọc thể loại với từ khóa/NXB/tồn kho | Kết quả đúng; xóa lọc đặt lại “Tất cả thể loại” |
| UI-GENRE-02 | Form tạo/sửa sách và lọc kho ở 320/375/768/1024/1440px | Chọn thể loại bắt buộc, bố cục không tràn ngang |
| UI-CATALOG-PRICE-01 | Kết hợp lọc thể loại và bốn khoảng giá ở cả hai catalog | Sách trong đúng ngưỡng giá xuất hiện; các ngưỡng không chồng lấn; xóa lọc trả toàn bộ bộ lọc về mặc định |
| UI-CATALOG-PAGINATION-01 | Mở catalog hai cổng khi có hơn 10 kết quả; thử Trước/Sau, số trang, tìm kiếm, bộ lọc và tải lại | Mỗi trang hiển thị tối đa 10 đầu sách; kết quả được phân trang sau lọc; bộ đếm khoảng hiển thị chính xác; đổi điều kiện/tải lại trở về trang 1; nút biên bị vô hiệu hóa; không có phân trang khi chỉ có một trang |
| UI-CATALOG-LAYOUT-01 | Trang catalog ở 320/375/768/1024/1440px | Search rộng phía trên; sidebar trái ở desktop; mobile mở/đóng bằng nút “Bộ lọc”; không tràn ngang, kết quả vẫn đọc được |
| UI-CATALOG-FILTER-STYLE-01 | Sidebar lọc ở hai cổng | Khoảng đệm cân đối; nhãn và tiêu đề dễ phân biệt; nút đặt lại không cạnh tranh màu; select không quá cao/nặng; focus bàn phím rõ; không tràn ngang ở 320/375/768px |
| UI-CATALOG-FILTER-COLOR-01 | Màu sidebar ở hai cổng | Nền giấy ấm, chữ mực, nhấn vàng `#FDC800`; tím chỉ dùng cho hover/focus; checkbox/nhãn đồng bộ design token và đạt tương phản |
| UI-CATALOG-FILTER-POPOVER-01 | Mở NXB, thể loại và khoảng giá ở hai cổng | Cả ba dùng cùng kiểu popover; tối đa 280px, cuộn trong danh sách, nổi khỏi khung sidebar không bị cắt; chọn bằng chuột/bàn phím; Escape/nhấp ngoài đóng menu |
| UI-CATALOG-FILTER-WIDTH-01 | Sidebar catalog ở 320/375/768/1024/1440px | Ba nút lọc nằm gọn trong cột; padding/viền không cộng vượt `width: 100%`; reset không chồng lấn; không phủ lên vùng kết quả khi menu đóng |
