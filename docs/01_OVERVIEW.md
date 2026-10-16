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
- **Bảo mật và an toàn dữ liệu**: Mật khẩu độc giả và nhân viên được mã hóa an toàn bằng thuật toán Bcrypt.
- **Khả năng mở rộng**: Tích hợp module thanh toán trực tuyến tiền bồi hoàn sách mất qua MoMo và đăng nhập nhanh bằng tài khoản Google OAuth 2.0.
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
- **Đặc quyền phân quyền & nhân sự**:
  - Quản lý toàn bộ danh sách tài khoản người dùng và nhân viên trong hệ thống.
  - **Thăng cấp** Độc giả thông thường (`USER`) lên làm Thủ thư (`MANAGER`) hoặc **Hạ cấp** Thủ thư về lại Độc giả.
  - Quản lý trạng thái thẻ: khóa/mở khóa khẩn cấp độc lập với chế tài Danh sách đen; mở khóa khẩn cấp không xóa số lần vi phạm.
  - Có thể xét gỡ khỏi Danh sách đen bằng thao tác riêng; lịch sử vi phạm vẫn được bảo toàn.
  - Quyền xóa vĩnh viễn các tài khoản vi phạm nghiêm trọng khỏi CSDL.

---

## 3. Kiến Trúc Kỹ Thuật (MEVN Stack)

- **Backend**: Node.js v22+, Express.js (v5), MongoDB Native Driver v6+, BcryptJS, Dotenv.
- **Frontend**: Vue 3, Vite, Vue Router 4, Axios, Bootstrap 4.6.2, FontAwesome 6 Free.
- **Thẩm mỹ UI**: Phong cách thiết kế học thuật cổ điển **Athenaeum Editorial** (Newsreader, Work Sans, JetBrains Mono, Soft Structuralism, Micro-motions).
