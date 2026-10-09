# 05. THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX SPECIFICATION)

Dự án áp dụng phong cách thiết kế **Athenaeum Editorial (Thư viện Hàn lâm Cổ điển & Tinh tế)** được kế thừa từ thiết kế mẫu của Stitch, nhưng đã được **thanh lọc toàn bộ các từ ngữ thừa, thuật ngữ lạ** để bám sát 100% nghiệp vụ thực tế của đề tài CT449 - Đại học Cần Thơ.

---

## 1. Phong Cách Thiết Kế Chủ Đạo (Athenaeum Editorial Design System)

* **Ý tưởng cốt lõi**: Không sử dụng màu sắc lòe loẹt hay bóng đổ nặng nề của template AI thông thường. Thay vào đó là cảm giác của một **phòng đọc thư viện tri thức**: màu giấy ngà dịu mắt, mực in truyền thống, đường nét thanh mảnh (hairline rules) và font chữ có chân (Serif) kết hợp không chân (Sans) chuẩn mực.

### 1.1. Bảng màu chuẩn (Palette Architecture)
* **Màu Nền & Bề Mặt (Surface)**:
  * Nền chính (`paper`): `#FAF9F5` (Màu giấy ngà dịu mắt khi đọc lâu).
  * Khối nội dung / Thẻ (`surface-card`): `#FFFFFF` (Trắng sáng tinh tế).
  * Vùng phụ / Bộ lọc (`paper-subtle`): `#F4F2EB` (Màu giấy ép cổ điển).
  * Đường viền kẻ chỉ (`paper-border`): `#E6E2D8` (Viền mờ 1px sắc nét).
* **Màu Mực Văn Bản (Typography Colors)**:
  * Tiêu đề / Nội dung chính (`ink-primary`): `#1C1917` (Màu mực in thẫm, êm mắt hơn đen tuyền).
  * Phụ đề / Tác giả (`ink-secondary`): `#4A463F` (Mực xám trung tính).
  * Chú thích / Nhãn phụ (`ink-muted`): `#787368`.
* **Màu Nhận Diện & Điểm Nhấn (Brand & Status)**:
  * Màu chủ đạo (`primary - Forest Ink`): `#143529` (Xanh lục bảo cổ điển của đèn đọc sách thư viện).
  * Nút phụ / Điểm nhấn (`accent - Archive Terracotta`): `#8C3D28` (Nâu đất nung / Màu sáp niêm phong).
  * Trạng thái **Còn sách**: `#23694C` (Xanh lá trầm).
  * Trạng thái **Tạm hết sách**: `#8F2822` (Đỏ gạch trầm).
  * Trạng thái **Sắp hết sách** (<= 2 cuốn): `#9A5B18` (Hổ phách).

### 1.2. Typography (Hệ thống Phông chữ)
* **Tiêu đề lớn / Tên sách (`font-serif`)**: `Newsreader` hoặc `Georgia`, `Merriweather` (Độ tương phản cao, mang đậm hơi thở học thuật).
* **Nội dung / Nút bấm / Nhãn (`font-sans`)**: `Work Sans` hoặc `Plus Jakarta Sans` (Rõ ràng, không chân, dễ đọc trên mọi thiết bị).
* **Mã số (`font-mono`)**: Font số đơn cách dùng cho `MaSach`, `MaDocGia`, `DonGia` (VD: `S001`, `85.000 ₫`).

---

## 2. Bản Đồ Màn Hình & Tuyến Đường (Vue Router)

### 2.1. Phân Hệ Người Dùng / Độc Giả (Client Portal)
1. **Trang chủ & Tra cứu mục lục sách (`/` hoặc `/books`)**:
   * **Thanh thông báo trên cùng**: Thống kê số lượng đầu sách và giờ phục vụ thư viện.
   * **Header Thư Viện**: Logo biểu tượng trang trọng, thanh menu (Trang chủ, Tra cứu sách, Lịch sử mượn, Nội quy).
   * **Khung tìm kiếm thông minh**: Ô nhập tìm kiếm (tên sách, tác giả), bộ lọc danh mục NXB, checkbox *"Chỉ sách còn trong kho"*, hiển thị định mức mượn: **Tối đa 03 cuốn**.
   * **Lưới danh mục sách (Catalog Grid)**:
     * Thẻ sách dạng hộp chữ nhật viền hairline 1px.
     * Ảnh bìa sách tỉ lệ 3:4.
     * Thông tin chi tiết: Mã sách, tên sách (Serif in đậm), tác giả (In nghiêng), NXB, năm XB.
     * Khối thông số: Số lượng còn lại trong kho, đơn giá đền bù nếu mất.
     * Nút bấm: Nút xanh `Đăng ký mượn` (nếu còn sách) hoặc nhãn đỏ `Tạm hết sách`.
2. **Chi tiết sách (`/books/:id`)**:
   * Tóm tắt nội dung sách, các thông số xuất bản chi tiết, nút mở Modal xác nhận mượn.
3. **Modal Xác Nhận Mượn Sách (Borrow Dialog)**:
   * Hiển thị tựa sách, thời hạn mượn mặc định (14 ngày), địa điểm nhận sách vật lý tại quầy.
   * Thông báo lưu ý: Đơn sẽ ở trạng thái `ChoDuyet` chờ thủ thư kiểm tra và giao sách.
4. **Trang cá nhân & Thẻ độc giả (`/profile`)**:
   * Thông tin thẻ: Mã độc giả, Họ tên, Trạng thái thẻ (🟢 Hoạt động / 🔴 Bị khóa Blacklist).
   * Bảng danh sách sách đang mượn: Tên sách, ngày mượn, hạn trả, trạng thái (`DangMuon`, `ChoDuyet`, `DaTra`).

---

## 2.2. Phân Hệ Quản Lý / Thủ Thư (Manager Portal - `/manager`)
* **Tone màu**: Sử dụng layout trang quản trị chuyên nghiệp với thanh sidebar bên trái.
1. **Quản lý Mượn - Trả & Phê Duyệt (`/manager/borrows`)**:
   * **Tab 1: Chờ duyệt**: Danh sách các yêu cầu mượn trực tuyến từ độc giả. Thủ thư nhấn **[Duyệt mượn]** (hệ thống tự động trừ kho) hoặc **[Từ chối]**.
   * **Tab 2: Đang mượn**: Bảng theo dõi các độc giả đang giữ sách, tính số ngày còn lại đến hạn trả.
   * **Các nút hành động nhanh**:
     * **[Xác nhận trả sách]**: Chuyển trạng thái sang `DaTra`, tự động cộng lại tồn kho. Nếu trả trễ hạn, tự động tăng số lần vi phạm của độc giả.
     * **[Báo mất sách]**: Chuyển trạng thái sang `MatSach`, hiển thị đơn giá yêu cầu đền bù, không cộng hoàn kho, tăng vi phạm độc giả lên 1.
2. **Quản lý Kho Sách (`/manager/books`)**:
   * Bảng danh sách sách: Thêm mới sách, sửa thông tin, cập nhật số lượng nhập kho, ảnh bìa, xóa sách.
3. **Quản lý Nhà Xuất Bản (`/manager/publishers`)**:
   * Thêm, sửa, xóa các đơn vị NXB liên kết.
4. **Danh sách đen Thư viện (`/manager/blacklist`)**:
   * Danh sách các độc giả có từ 3 lần vi phạm (trả trễ hạn hoặc làm mất sách) bị tước quyền mượn sách.

---

## 2.3. Phân Hệ Quản Trị Tối Cao (Super Admin Portal - `/admin`)
1. **Quản lý Người Dùng & Phân Quyền (`/admin/users`)**:
   * Danh sách tất cả tài khoản độc giả và nhân viên trong hệ thống.
   * Nút **Nâng cấp (Promote)**: Thăng cấp Độc giả lên làm Quản lý/Thủ thư.
   * Nút **Hạ cấp (Demote)**: Thu hồi quyền quản lý về lại Độc giả bình thường.
   * Nút **Mở khóa Blacklist (Unblock)**: Reset số lần vi phạm về 0 và mở lại quyền mượn sách sau khi độc giả đã hoàn thành đền bù.

---

## 3. Các Thành Phần Giao Diện Tái Sử Dụng (Vue Components)

1. **`AppHeader.vue`**: Thanh điều hướng trên cùng, hiển thị logo Athenaeum, danh mục, và thông tin đăng nhập.
2. **`BookCard.vue`**: Thẻ sách kế thừa từ thiết kế của Stitch:
   - Bo góc nhẹ `rounded` (4px).
   - Viền `border border-paper-border`.
   - Bố cục thông tin rõ ràng, badge trạng thái còn/hết sách.
3. **`BorrowModal.vue`**: Hộp thoại popup xác nhận mượn sách với nền làm mờ nhẹ (`backdrop-blur-[2px]`).
4. **`ToastNotification.vue`**: Thông báo phản hồi góc dưới bên phải màn hình khi hoàn thành tác vụ (thêm sách, duyệt đơn, trả sách thành công).
