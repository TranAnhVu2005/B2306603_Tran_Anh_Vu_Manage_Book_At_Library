# 05. THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX SPECIFICATION)

Dự án áp dụng **Skill thiết kế Vanguard UI/UX Architect (Awwwards-Tier)** được định nghĩa tại `.agents/skills/high-end-visual-design/SKILL.md`. Agent bắt buộc đọc và tuân thủ 100% skill đó trước khi viết bất kỳ dòng code frontend nào.

> **Lưu ý quan trọng:** Header (`AppHeader.vue`), Footer (`AppFooter.vue`), trang đăng nhập (`LoginView.vue`) và đăng ký (`RegisterView.vue`) đã được người dùng tùy chỉnh riêng và **KHÔNG được phép thay đổi thiết kế**. Agent chỉ áp dụng skill thiết kế mới cho tất cả các màn hình/component còn lại chưa hoàn thiện.

Frontend sử dụng đúng tên trường CDM từ API (`VaiTro`, `ChucVu`, `TENNXB`, `GiaTriBoiThuong`, ...). Các phiếu mượn chỉ chứa `MaDocGia` và `MaSach`; màn hình cần tên hoặc thông tin tham chiếu phải tra cứu collection độc giả/sách ở phía frontend, không kỳ vọng API trả object lồng ghép.

---

## 1. Quy Chuẩn Thiết Kế Áp Dụng (Design System)

Tham chiếu đầy đủ tại: `.agents/skills/high-end-visual-design/SKILL.md`

### 1.1. Tóm tắt Hệ Thống Màu & Kiểu chữ (Áp dụng cho phần còn lại của dự án)
- **Vibe & Texture Archetype**: Agent tự chọn 1 trong 3 archetype (Ethereal Glass / Editorial Luxury / Soft Structuralism) phù hợp với ngữ cảnh từng màn hình, đảm bảo tính nhất quán xuyên suốt ứng dụng.
- **Fonts được phép**: `Geist`, `Clash Display`, `PP Editorial New`, `Plus Jakarta Sans` (tuyệt đối không dùng Inter, Roboto, Arial, Open Sans, Helvetica).
- **Icons**: Chỉ dùng ultra-light, precise-line icons (Phosphor Light, Remix Line). Nghiêm cấm FontAwesome thick-stroke.
- **Spacing**: Section padding tối thiểu `py-24`, cho phép design thở nặng.
- **Borders & Shadows**: Không dùng `1px solid gray` thông thường, không dùng `rgba(0,0,0,0.3)` drop-shadow. Dùng hairline ring hoặc ambient glow.

### 1.2. Kỹ Thuật Component Bắt Buộc
- **Double-Bezel (Doppelrand)**: Mọi card, container lớn phải dùng kiến trúc Outer Shell + Inner Core lồng nhau.
- **Button-in-Button**: Nút CTA có icon mũi tên phải dùng kiến trúc pill với icon được bọc trong vòng tròn riêng.
- **Motion**: Tất cả transition dùng custom `cubic-bezier`, không dùng `linear` hay `ease-in-out`.
- **Scroll Entry Animation**: Mọi element vào viewport phải có `translate-y + blur + opacity` fade-up animation (dùng `IntersectionObserver`).

---

## 2. Bản Đồ Màn Hình & Tuyến Đường (Vue Router)

### 2.1. Phân Hệ Người Dùng / Độc Giả (Client Portal)
1. **Trang chủ & Tra cứu mục lục sách (`/` hoặc `/books`)**:
   * **Thanh thông báo trên cùng**: Thống kê số lượng đầu sách và giờ phục vụ thư viện.
   * **Khung tìm kiếm thông minh**: Ô nhập tìm kiếm (tên sách, tác giả), bộ lọc danh mục NXB, checkbox *"Chỉ sách còn trong kho"*, hiển thị định mức mượn: **Tối đa 03 cuốn**.
   * **Lưới danh mục sách (Catalog Grid)**:
     * Áp dụng **Asymmetrical Bento Layout** hoặc **Z-Axis Cascade** tùy context.
     * Thẻ sách dùng Double-Bezel card với tỉ lệ ảnh bìa 3:4.
     * Thông tin chi tiết: Mã sách, tên sách (Serif/Grotesk Bold), tác giả (In nghiêng), NXB, năm XB.
     * Khối thông số: Số lượng còn lại trong kho, đơn giá đền bù nếu mất.
     * Nút CTA: Pill Button `Đăng ký mượn` (còn sách) hoặc badge `Tạm hết sách`.
2. **Chi tiết sách (`/books/:id`)**:
   * Layout Editorial Split: Tóm tắt nội dung + thông số xuất bản chi tiết + nút mở Modal xác nhận mượn.
3. **Modal Xác Nhận Mượn Sách (Borrow Dialog)**:
   * Nền `backdrop-blur` (fixed overlay), Double-Bezel card.
   * Hiển thị tựa sách, thời hạn mượn mặc định (14 ngày), địa điểm nhận sách vật lý tại quầy.
   * Thông báo: Đơn ở trạng thái `ChoDuyet` chờ thủ thư kiểm tra.
4. **Trang cá nhân & Thẻ độc giả (`/profile`)**:
   * Thông tin thẻ: Mã độc giả, Họ tên, Trạng thái thẻ (🟢 Hoạt động / 🔴 Bị khóa Blacklist).
   * Bảng danh sách sách đang mượn: Tên sách, ngày mượn, hạn trả, trạng thái (`DangMuon`, `ChoDuyet`, `DaTra`).
   * Áp dụng Scroll Entry Animation cho từng dòng bảng.

---

### 2.2. Phân Hệ Quản Lý / Thủ Thư (Manager Portal - `/manager`)
* **Layout tổng thể**: Sidebar bên trái cố định + content area bên phải. Sidebar dùng Double-Bezel panel.
1. **Quản lý Mượn - Trả & Phê Duyệt (`/manager/borrows`)**:
   * **Tab 1: Chờ duyệt**: Danh sách yêu cầu mượn từ độc giả. Nút **[Duyệt mượn]** (trừ kho tự động) / **[Từ chối]**.
   * **Tab 2: Đang mượn**: Bảng theo dõi, hiển thị số ngày còn lại, badge màu theo mức độ khẩn cấp.
   * **Nút hành động nhanh**:
     * **[Xác nhận trả sách]**: Trạng thái → `DaTra`, cộng lại tồn kho. Trả trễ → tăng vi phạm độc giả.
     * **[Báo mất sách]**: Trạng thái → `MatSach`, hiển thị đơn giá đền bù, không hoàn kho, tăng vi phạm +1.
2. **Quản lý Kho Sách (`/manager/books`)**:
   * Bảng danh sách sách: Thêm mới, sửa thông tin, cập nhật số lượng nhập kho, ảnh bìa, xóa sách.
   * Áp dụng Double-Bezel cho form thêm/sửa sách (dạng Modal hoặc Drawer).
3. **Quản lý Nhà Xuất Bản (`/manager/publishers`)**:
   * Thêm, sửa, xóa các đơn vị NXB liên kết.
4. **Danh sách đen Thư viện (`/manager/blacklist`)**:
   * Danh sách độc giả có ≥ 3 lần vi phạm bị tước quyền mượn sách.

---

### 2.3. Phân Hệ Quản Trị Tối Cao (Super Admin Portal - `/admin`)
1. **Quản lý Người Dùng & Phân Quyền (`/admin/users`)**:
   * Danh sách tất cả tài khoản độc giả và nhân viên.
   * Nút **Nâng cấp (Promote)**: Thăng cấp Độc giả → Quản lý/Thủ thư.
   * Nút **Hạ cấp (Demote)**: Thu hồi quyền quản lý về lại Độc giả.
   * Nút **Mở khóa Blacklist (Unblock)**: Reset vi phạm về 0, mở lại quyền mượn sách.

---

## 3. Các Thành Phần Giao Diện Tái Sử Dụng (Vue Components)

> ⚠️ Các component dưới đây ĐÃ được thiết kế sẵn và **KHÔNG thay đổi**: `AppHeader.vue`, `AppFooter.vue`, `LoginView.vue`, `RegisterView.vue`.

Các component cần xây dựng/cập nhật theo skill mới:

1. **`BookCard.vue`**: Thẻ sách dùng Double-Bezel card. Ảnh bìa tỉ lệ 3:4, badge trạng thái còn/hết/sắp hết sách. Scroll Entry Animation khi card vào viewport. Nút CTA dùng kiến trúc Button-in-Button.
2. **`BorrowModal.vue`**: Hộp thoại fixed overlay với `backdrop-blur`, Double-Bezel content card, phím tắt `Escape` để đóng, `body scroll lock` khi mở.
3. **`ToastNotification.vue`**: Toast góc dưới phải màn hình với slide-in animation (transform + opacity).
4. **`ManagerSidebar.vue`** (nếu chưa có): Sidebar quản lý dùng Double-Bezel panel, nav items có hover animation với custom cubic-bezier.
5. **Bảng dữ liệu (Tables)**: Dùng thiết kế thoáng, hairline borders (`border-white/10` hoặc `border-black/5`), row hover animation nhẹ.
6. **Form inputs**: Kiểu floating label hoặc pill input với ring hairline, focus state dùng glow thay vì outline mặc định.
