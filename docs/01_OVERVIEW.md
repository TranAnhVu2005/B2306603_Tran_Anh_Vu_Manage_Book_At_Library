# 01. TỔNG QUAN ĐỀ TÀI & PHẠM VI NGHIÊN CỨU

**Đề tài**: Xây dựng Hệ Thống Quản Lý Mượn Sách Thư Viện (Library Management System)  
**Học phần**: CT449 - Phát Triển Ứng Dụng Web  
**Đơn vị**: Khoa Công nghệ Thông tin & Truyền thông - Đại học Cần Thơ  

---

## 1. Đặt Vấn Đề & Mục Tiêu

Hệ thống được thiết kế theo tiêu chuẩn thực tế của một thư viện hiện đại:
- Đảm bảo tính toàn vẹn dữ liệu và kiểm soát kho sách chính xác.
- Quy trình mượn - trả sách chặt chẽ với cơ chế duyệt đơn, giới hạn mượn và chế tài vi phạm (Blacklist).
- Phân quyền 3 cấp độ rõ ràng: **Độc giả (User)**, **Thủ thư/Quản lý (Staff/Manager)**, và **Quản trị viên hệ thống (Super Admin)**.

---

## 2. Phân Quyền & Các Tác Nhân Hệ Thống (RBAC)

### 2.1. Độc giả (Reader / User)
- **Tài khoản**: Đăng ký thẻ thư viện trực tuyến (`MaDocGia`, `Password`).
- **Quyền hạn**:
  - Tìm kiếm, lọc và xem thông tin chi tiết từng đầu sách.
  - Đăng ký mượn sách trực tuyến (tối đa **3 quyển** đang mượn cùng lúc).
  - Xem lịch sử mượn trả cá nhân và trạng thái các đơn đăng ký (Chờ duyệt, Đang mượn, Đã trả, Báo mất).
  - Xem trạng thái thẻ thư viện (Bình thường / Bị khóa / Danh sách đen).

### 2.2. Nhân viên Quản lý / Thủ thư (Staff / Librarian)
- **Tài khoản**: Được cấp tài khoản nhân viên (`MSNV`, `ChucVu`).
- **Quyền hạn**:
  - Quản lý danh mục Sách (Thêm, Sửa, Xóa sách; kiểm kê số lượng tồn kho `SoQuyen`).
  - Quản lý danh mục Nhà xuất bản (Thêm, Sửa, Xóa NXB).
  - Quản lý quy trình Mượn - Trả:
    - **Duyệt phiếu mượn** (Chuyển từ `ChoDuyet` -> `DangMuon`, trừ kho).
    - **Xác nhận trả sách** (Chuyển sang `DaTra`, cộng trả lại kho).
    - **Xử lý sự cố mất sách**: Đánh dấu `MatSach`, ghi nhận đền bù hoặc phạt vi phạm, không cộng trả lại kho.
    - **Quản lý Danh sách đen (Blacklist)**: Kiểm tra độc giả vi phạm quá hạn nhiều lần hoặc làm mất sách để khóa quyền mượn.

### 2.3. Quản trị viên Tối cao (Super Admin)
- Có toàn bộ quyền hạn của Thủ thư.
- **Quyền đặc quyền**:
  - Quản lý toàn bộ danh sách tài khoản (Người dùng & Nhân viên).
  - Phân quyền: **Nâng cấp** người dùng thông thường lên làm Quản lý (Thủ thư) hoặc **Hạ cấp** quản lý về người dùng thông thường.
  - Mở khóa hoặc xóa vĩnh viễn tài khoản trong Danh sách đen.

---

## 3. Kiến Trúc Kỹ Thuật (MEVN Stack)

- **Backend**: Node.js, Express.js (v5), MongoDB Native Driver.
- **Frontend**: Vue 3, Vite, Vue Router 4, Axios, Bootstrap 4 + FontAwesome.
- **Thẩm mỹ UI**: Tuân thủ triệt để [SKILL.md](file:///d:/All/Information%20Technology%20%20-%20CTU/CurrentSemester/CT449%20-%20Web%20Application%20Development/Lab/baocao/manage_book_at_library/docs/SKILL.md) (Double-Bezel architecture, Soft Structuralism, Micro-motions).
