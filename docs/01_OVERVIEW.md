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
- **Kiểm soát kho tồn theo thời gian thực**: Trừ kho tức thì khi duyệt mượn sách, cộng hoàn kho khi độc giả hoàn trả đúng hạn.
- **Quy trình lưu thông khép kín & Kỷ luật tự động**: Hạn mượn chuẩn 14 ngày, kiểm soát hạn mức mượn tối đa 3 cuốn; tự động theo dõi số lần vi phạm (`SoLanViPham`) khi trả trễ hoặc báo mất sách; đưa thẻ vào `DanhSachDen` khi vi phạm đạt 3 lần.
- **Bảo mật và an toàn dữ liệu**: Bảo vệ mật khẩu bằng Bcrypt; kiểm soát quyền theo chức năng ở backend; xác thực và quản lý phiên; kiểm tra dữ liệu chống NoSQL injection; giảm thiểu XSS, CSRF/XSRF, XXE và SSRF phù hợp với kiến trúc MongoDB/JSON hiện tại. Các biện pháp này là yêu cầu cần triển khai và xác minh, không được xem là hoàn tất chỉ từ mô tả tài liệu.
- **Tích hợp**: Đăng nhập Google OAuth 2.0 đã có trong mã nguồn. Thanh toán MoMo là yêu cầu tài liệu/định hướng còn chờ triển khai; hiện chưa có payment route/service trong backend.
- **Phân quyền 3 cấp bậc rõ ràng**: **Độc giả (USER)**, **Nhân viên thủ thư (MANAGER)**, và **Quản trị viên hệ thống (ADMIN)**.

---

## 2. Phân Quyền & Các Tác Nhân Hệ Thống (RBAC)

### 2.1. Độc giả (Reader / USER)
- **Tài khoản**: Đăng ký thẻ thư viện trực tuyến hoặc đăng nhập bằng tài khoản Google. Mật khẩu được mã hóa an toàn.
- **Quyền hạn**:
  - Tìm kiếm, lọc và xem thông tin chi tiết từng đầu sách, nhà xuất bản.
  - Đăng ký mượn sách trực tuyến (giới hạn tối đa **3 quyển** đang lưu thông).
  - Xem lịch sử mượn trả cá nhân và trạng thái các đơn đăng ký (`ChoDuyet`, `DangMuon`, `DaTra`, `MatSach`, `TuChoi`).
  - Xem trạng thái thẻ thư viện và thanh toán tiền phạt / bồi thường bồi hoàn.

### 2.2. Nhân viên Quản lý / Thủ thư (Staff / MANAGER)
- **Tài khoản**: Được cấp tài khoản nhân viên thư viện (`MSNV`, `ChucVu`).
- **Quyền hạn**:
  - Quản lý kho sách (Thêm, Sửa, Xóa sách; kiểm kê số lượng tồn kho `SoQuyen`).
  - Quản lý danh mục Nhà xuất bản (Thêm, Sửa, Xóa NXB).
  - Quản lý quy trình Mượn - Trả:
    - **Duyệt phiếu mượn**: Chuyển `ChoDuyet` -> `DangMuon`, trừ kho 1 cuốn, gán hạn trả 14 ngày, ghi nhận `MSNV`.
    - **Xác nhận trả sách**: Chuyển sang `DaTra`, hoàn lại kho 1 cuốn, tự động phát hiện trễ hạn.
    - **Xử lý mất sách**: Chuyển sang `MatSach`, tự động tính tiền bồi thường `GiaTriBoiThuong = Sach.DonGia`, không hoàn kho, tăng số lần vi phạm độc giả.

### 2.3. Quản trị viên Tối cao (Super Admin / ADMIN)
- Kế thừa toàn bộ quyền hạn nghiệp vụ của Thủ thư.
- Có thể tra cứu sách/NXB công khai như mọi vai trò; nghiệp vụ thủ thư luôn hiện trong menu Admin.
- **Đặc quyền phân quyền & nhân sự**:
  - Quản lý toàn bộ danh sách tài khoản người dùng và nhân viên trong hệ thống.
  - **Thăng cấp** Độc giả thông thường (`USER`) lên làm Thủ thư (`MANAGER`) hoặc **Hạ cấp** Thủ thư về lại Độc giả.
  - Quản lý trạng thái thẻ: khóa/mở khóa khẩn cấp độc lập với chế tài Danh sách đen; mở khóa khẩn cấp không xóa số lần vi phạm.
  - Có thể xét gỡ khỏi Danh sách đen bằng thao tác riêng; lịch sử vi phạm vẫn được bảo toàn.
  - Quyền xóa vĩnh viễn các tài khoản vi phạm nghiêm trọng khỏi CSDL.

---

## 3. Kiến Trúc Kỹ Thuật (MEVN Stack)

- **Backend**: Node.js v22+, Express.js (v5), MongoDB Native Driver v6+, BcryptJS, Dotenv.
- **Frontend**: Hai ứng dụng Vue 3/Vite riêng, cùng gọi Backend API:
  - `frontend_user/`: cổng Độc giả (`USER`), là thư mục đổi tên từ frontend cũ; chỉ chứa luồng và giao diện dành cho độc giả.
  - `frontend_manage/`: cổng Thủ thư (`MANAGER`) và Quản trị viên (`ADMIN`), gồm tra cứu danh mục/chi tiết sách, màn hình nghiệp vụ và quản trị.
- MANAGER có toàn bộ chức năng nghiệp vụ thủ thư; ADMIN có toàn bộ chức năng MANAGER cộng các chức năng quản trị. Tra cứu sách được triển khai trực tiếp trên cả hai cổng; nghiệp vụ mượn cá nhân chỉ ở cổng độc giả, quản lý kho ở cổng quản lý.
- Hồ sơ nhân viên và hồ sơ độc giả hiện đăng nhập độc lập, lưu phiên riêng theo domain. Các chức năng cá nhân của độc giả (mượn, lịch sử, hồ sơ thẻ) cần đăng nhập phiên USER; chưa hỗ trợ liên kết nhân viên với hồ sơ độc giả.
  - Môi trường phát triển: Backend API `http://localhost:3000`, `frontend_user` tại `http://localhost:3001`, `frontend_manage` tại `http://localhost:3002`; mỗi app proxy `/api` đến Backend.
  - Mỗi ứng dụng có cấu hình/build/deploy riêng và một domain/origin riêng trong production. Tên domain thực tế lấy từ cấu hình triển khai; backend chỉ cho phép hai origin được khai báo trong CORS allowlist.
  - Hai app không chia sẻ localStorage/cookie/session qua domain. Người dùng xác thực riêng trên từng origin; mọi endpoint vẫn xác minh JWT, vai trò và quyền sở hữu ở backend.
- **Thẩm mỹ UI**: Phong cách thiết kế học thuật cổ điển **Athenaeum Editorial**, dùng `Be Vietnam Pro` làm font sans-serif chính toàn website; monospace có thể giữ cho mã/định danh. Đổi font không yêu cầu thay bố cục Header, Footer, LoginView hoặc RegisterView.

### 3.1. Phân định phạm vi hai frontend

| Ứng dụng | Vai trò | Phạm vi chính | Cổng phát triển |
|:---|:---|:---|:---:|
| `frontend_user/` | `USER` | Trang chủ/tra cứu, chi tiết sách, đăng ký mượn, hồ sơ độc giả, lịch sử mượn | `3001` |
| `frontend_manage/` | `MANAGER`, `ADMIN` | Tra cứu sách, kho sách, NXB, duyệt mượn-trả, quản lý tài khoản và quyền Admin | `3002` |

Backend API dùng chung ở cổng `3000`. Các trang đăng nhập/điều hướng phải dẫn tới đúng domain ứng dụng theo vai trò; không dùng route guard làm cơ chế bảo mật. Việc tách domain không thay thế RBAC backend.
