# 01. TỔNG QUAN ĐỀ TÀI & PHẠM VI NGHIÊN CỨU

**Đề tài**: Xây dựng Website Quản Lý Mượn Sách Ở Thư Viện (Library Management System)  
**Học phần**: CT449 - Phát Triển Ứng Dụng Web  
**Sinh viên thực hiện**: Trần Anh Vũ (MSSV: B2306603)  
**Giảng viên hướng dẫn**: Ths. Nguyễn Minh Trung  
**Đơn vị**: Khoa Công nghệ Thông tin & Truyền thông - Đại học Cần Thơ  

---

## 1. Đặt Vấn Đề & Mục Tiêu

Hệ thống được thiết kế theo tiêu chuẩn thực tế của một thư viện hiện đại:
- **Số hóa toàn diện**: Thay thế sổ sách thủ công bằng nền tảng ứng dụng web tập trung với ngăn xếp công nghệ MEVN Stack (MongoDB, Express.js 5, Vue.js 3, Node.js).
- **Kiểm soát kho tồn theo thời gian thực**: Khi duyệt, giữ một cuốn trong 3 ngày chờ độc giả nhận; nếu hết hạn nhận, hoàn kho. Thời hạn mượn 14 ngày chỉ bắt đầu từ lúc thủ thư xác nhận bàn giao thực tế.
- **Quy trình lưu thông khép kín & Kỷ luật tự động**: Hạn mượn chuẩn 14 ngày, kiểm soát hạn mức mượn tối đa 3 cuốn; tự động theo dõi số lần vi phạm (`SoLanViPham`) khi trả trễ hoặc báo mất sách; đưa thẻ vào `DanhSachDen` khi vi phạm đạt 3 lần.
- **Bảo mật và an toàn dữ liệu**: Bảo vệ mật khẩu bằng Bcrypt; kiểm soát quyền theo chức năng ở backend; xác thực và quản lý phiên; kiểm tra dữ liệu chống NoSQL injection; giảm thiểu XSS, CSRF/XSRF, XXE và SSRF phù hợp với kiến trúc MongoDB/JSON hiện tại. Các biện pháp này là yêu cầu cần triển khai và xác minh, không được xem là hoàn tất chỉ từ mô tả tài liệu.
- **Truy cứu hoạt động**: Lưu log append-only cho thao tác sách và vòng đời mượn-trả; Admin được lọc theo sách, độc giả, nhân viên và thời gian. Xóa sách dùng soft delete để giữ lịch sử và dữ liệu gốc.
- **Đăng nhập**: Độc giả có thể dùng số điện thoại/mật khẩu hoặc tài khoản Google; STAFF và ADMIN dùng số điện thoại/mật khẩu. Mã nghiệp vụ chỉ dùng nhận diện hồ sơ và nghiệp vụ. Backend xác minh Google ID Token và chỉ cấp phiên `USER`; MoMo vẫn là định hướng chưa triển khai.
- **Phân quyền 3 cấp bậc rõ ràng**: **Độc giả (USER)**, **Nhân viên thủ thư (STAFF)**, và **Quản trị viên hệ thống (ADMIN)**.

### Môi trường triển khai

Hai frontend Vue/Vite được build và triển khai độc lập trên Vercel, cùng gọi backend Express trên Render. Backend local và Render đều nhận `MONGODB_URI` từ môi trường, chỉ chấp nhận Atlas cluster của dự án và chọn database `quanlymuonsach`. Không đưa thông tin kết nối MongoDB hoặc secret backend vào bundle frontend. Cấu hình và checklist deploy chi tiết nằm tại [DEPLOYMENT.md](../DEPLOYMENT.md).

---

## 2. Phân Quyền & Các Tác Nhân Hệ Thống (RBAC)

### 2.1. Độc giả (Reader / USER)
- **Tài khoản**: Đăng ký thẻ thư viện trực tuyến và đăng nhập bằng số điện thoại cùng mật khẩu. Mật khẩu được mã hóa an toàn.
- **Quyền hạn**:
  - Tìm kiếm, lọc và xem thông tin chi tiết từng đầu sách, nhà xuất bản.
  - Đăng ký mượn sách trực tuyến (giới hạn tối đa **3 quyển** đang lưu thông).
  - Xem lịch sử mượn trả cá nhân; hủy yêu cầu `ChoDuyet` hoặc `ChoNhan` trước khi nhận sách. Trạng thái phiếu gồm `ChoDuyet`, `ChoNhan`, `DangMuon`, `DaTra`, `MatSach`, `TuChoi`, `DaHuy`, `QuaHanNhan`.
  - Trước hạn trả, độc giả có thể gia hạn một lần thêm 7 ngày cho mỗi phiếu đang mượn.
  - Xem trạng thái thẻ thư viện và thanh toán tiền phạt / bồi thường bồi hoàn.

### 2.2. Nhân viên Quản lý / Thủ thư (Staff / STAFF)
- **Tài khoản**: Ứng viên gửi hồ sơ tại cổng nhân viên; Admin duyệt mới được tạo hồ sơ `nhanvien` và đăng nhập bằng số điện thoại (`SoDienThoai`). `MSNV` là mã hồ sơ, không dùng đăng nhập.
- **Quyền hạn**:
  - Quản lý kho sách (Thêm, Sửa, Xóa sách; kiểm kê số lượng tồn kho `SoQuyen`).
  - Quản lý danh mục Nhà xuất bản (Thêm, Sửa, Xóa NXB).
  - Quản lý quy trình Mượn - Trả:
    - **Duyệt phiếu mượn**: Chuyển `ChoDuyet` -> `ChoNhan`, giữ kho một cuốn và cho độc giả 3 ngày để đến nhận.
    - **Bàn giao sách**: Thủ thư xác nhận nhận sách tại quầy; chuyển `ChoNhan` -> `DangMuon`, ghi ngày mượn và hạn trả sau 14 ngày kể từ bàn giao.
    - **Xác nhận trả sách**: Chuyển sang `DaTra`, hoàn lại kho 1 cuốn, tự động phát hiện trễ hạn.
    - **Xử lý mất sách**: Chuyển sang `MatSach`, tự động tính tiền bồi thường `GiaTriBoiThuong = Sach.DonGia`, không hoàn kho, tăng số lần vi phạm độc giả.

### 2.3. Quản trị viên Tối cao (Super Admin / ADMIN)
- Kế thừa toàn bộ quyền hạn nghiệp vụ của Thủ thư.
- Có thể tra cứu sách/NXB công khai như mọi vai trò; nghiệp vụ thủ thư luôn hiện trong menu Admin.
- **Đặc quyền phân quyền & nhân sự**:
  - Quản lý toàn bộ danh sách tài khoản người dùng và nhân viên trong hệ thống.
  - Xét duyệt hồ sơ ứng tuyển nhân viên; chỉ hồ sơ được Admin duyệt mới tạo tài khoản thủ thư. Hồ sơ nhân viên tách biệt khỏi tài khoản độc giả và không ảnh hưởng các phiếu mượn hiện có.
  - Quản lý trạng thái thẻ: khóa/mở khóa khẩn cấp độc lập với chế tài Danh sách đen; mở khóa khẩn cấp không xóa số lần vi phạm.
  - Có thể xét gỡ khỏi Danh sách đen bằng thao tác riêng; lịch sử vi phạm vẫn được bảo toàn.
  - Quyền xóa mềm và khôi phục hồ sơ độc giả/nhân viên; hồ sơ nghiệp vụ được giữ lại để bảo toàn lịch sử.
  - Tra cứu nhật ký kiểm toán append-only theo sách, độc giả, nhân viên, loại sự kiện và thời gian; xem/khôi phục sách đã xóa mềm.

---

## 3. Kiến Trúc Kỹ Thuật (MEVN Stack)

- **Backend**: Node.js v22+, Express.js (v5), MongoDB Native Driver v6+, BcryptJS, Dotenv.
- **Frontend**: Hai ứng dụng Vue 3/Vite riêng, cùng gọi Backend API:
  - `frontend_user/`: cổng Độc giả (`USER`), là thư mục đổi tên từ frontend cũ; chỉ chứa luồng và giao diện dành cho độc giả.
  - `frontend_manage/`: cổng Thủ thư (`STAFF`) và Quản trị viên (`ADMIN`), gồm tra cứu danh mục/chi tiết sách, màn hình nghiệp vụ và quản trị.
- STAFF có toàn bộ chức năng nghiệp vụ thủ thư; ADMIN có toàn bộ chức năng STAFF cộng các chức năng quản trị. Tra cứu sách được triển khai trực tiếp trên cả hai cổng; nghiệp vụ mượn cá nhân chỉ ở cổng độc giả, quản lý kho ở cổng quản lý.
- Hồ sơ nhân viên và hồ sơ độc giả hiện đăng nhập độc lập, lưu phiên riêng theo domain. Các chức năng cá nhân của độc giả (mượn, lịch sử, hồ sơ thẻ) cần đăng nhập phiên USER; header và menu tài khoản cổng độc giả có mục **Hồ sơ cá nhân** dẫn tới `/profile`. Chưa hỗ trợ liên kết nhân viên với hồ sơ độc giả.
  - Môi trường phát triển: Backend API `http://localhost:3000`, `frontend_user` tại `http://localhost:3001`, `frontend_manage` tại `http://localhost:3002`; mỗi app proxy `/api` đến Backend.
  - Mỗi ứng dụng có cấu hình/build/deploy riêng và một domain/origin riêng trong production. Tên domain thực tế lấy từ cấu hình triển khai; backend chỉ cho phép hai origin được khai báo trong CORS allowlist.
  - Hai app không chia sẻ localStorage/cookie/session qua domain. Người dùng xác thực riêng trên từng origin; mọi endpoint vẫn xác minh JWT, vai trò và quyền sở hữu ở backend.
- **Thẩm mỹ UI**: Phong cách thiết kế học thuật cổ điển **Athenaeum Editorial**, dùng `Be Vietnam Pro` làm font sans-serif chính toàn website; monospace có thể giữ cho mã/định danh. Đổi font không yêu cầu thay bố cục Header, Footer, LoginView hoặc RegisterView.

### 3.1. Phân định phạm vi hai frontend

| Ứng dụng | Vai trò | Phạm vi chính | Cổng phát triển |
|:---|:---|:---|:---:|
| `frontend_user/` | `USER` | Trang chủ/tra cứu, chi tiết sách, đăng ký mượn, hồ sơ độc giả, lịch sử mượn | `3001` |
| `frontend_manage/` | `STAFF`, `ADMIN` | Tra cứu sách, kho sách, NXB, duyệt mượn-trả, quản lý tài khoản và quyền Admin | `3002` |

Backend API dùng chung ở cổng `3000`. Các trang đăng nhập/điều hướng phải dẫn tới đúng domain ứng dụng theo vai trò; không dùng route guard làm cơ chế bảo mật. Việc tách domain không thay thế RBAC backend.
