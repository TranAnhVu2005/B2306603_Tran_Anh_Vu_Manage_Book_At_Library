# 05. THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX SPECIFICATION)

Dự án áp dụng **Skill thiết kế Vanguard UI/UX Architect (Awwwards-Tier)** được định nghĩa tại `.agents/skills/high-end-visual-design/SKILL.md`. Agent bắt buộc đọc và tuân thủ 100% skill đó trước khi viết bất kỳ dòng code frontend nào.

> Header, Footer, trang đăng nhập và đăng ký đang có thiết kế hiện hữu. Có thể sửa trạng thái đăng nhập, nội dung, điều hướng, khả năng responsive và typography khi cần để khớp quyền/phiên; giữ nguyên nhận diện và bố cục cốt lõi trừ khi yêu cầu mới chỉ rõ khác.

Frontend sử dụng đúng tên trường CDM từ API (`VaiTro`, `ChucVu`, `TENNXB`, `GiaTriBoiThuong`, ...). Các phiếu mượn chỉ chứa `MaDocGia` và `MaSach`; màn hình cần tên hoặc thông tin tham chiếu phải tra cứu collection độc giả/sách ở phía frontend, không kỳ vọng API trả object lồng ghép.

## 0. Phân tách ứng dụng và domain

Frontend là hai ứng dụng Vue/Vite độc lập, dùng chung Backend API nhưng có domain/origin riêng:

| App | Vai trò và màn hình | Local dev |
|:---|:---|:---:|
| `frontend_user/` | Độc giả (`USER`): trang chủ, tra cứu/chi tiết sách, đăng ký mượn, hồ sơ cá nhân và lịch sử | `http://localhost:3001` |
| `frontend_manage/` | Thủ thư (`MANAGER`) và Admin (`ADMIN`): tra cứu sách, quản lý kho/NXB, mượn-trả, quản trị tài khoản | `http://localhost:3002` |

Backend chạy tại `http://localhost:3000`; mỗi app proxy `/api` về backend. Production domain được cấu hình riêng theo môi trường, không hardcode; API CORS allowlist chỉ nhận các origin của hai app. Các trang sau đăng nhập điều hướng tới domain đúng vai trò. Vì localStorage không dùng chung giữa các origin, người dùng phải đăng nhập riêng trên từng app; không giả định frontend có thể đọc token ở origin còn lại. Backend vẫn là nơi duy nhất thực thi vai trò và quyền sở hữu.

Ứng dụng cũ đã được đổi tên thành `frontend_user/`. Ứng dụng này giữ luồng độc giả; `frontend_manage/` có bản tra cứu danh mục và chi tiết sách riêng dùng cùng API, styles và hành vi tìm kiếm của cổng độc giả. Mỗi app có cấu hình Vite, package và build độc lập. Menu `Tra cứu sách` của cổng quản lý đi tới `/catalog` trên cùng origin nên giữ nguyên phiên nhân viên; liên kết `Cổng độc giả` chỉ dành cho các thao tác cá nhân độc giả. Mỗi cổng xác thực phiên độc lập. Request đọc sách/NXB công khai không gửi JWT; lỗi 401 của request không mang Authorization không được xóa phiên cục bộ.

**Nhận diện hai cổng:** `frontend_user` là nguồn chuẩn cho thiết kế Header/Footer và trang tra cứu. `frontend_manage` phải dùng cùng banner sách, màu xanh rêu, logo, nhịp khoảng cách, hình dáng menu tài khoản/footer và giao diện tra cứu danh mục/chi tiết sách. Khác biệt nằm ở chức năng theo quyền: tra cứu nội bộ tại `/catalog`, thêm menu thủ thư/Admin; không hiển thị thao tác đăng ký mượn trong ứng dụng quản lý.

---

## 1. Quy Chuẩn Thiết Kế Áp Dụng (Design System)

Tham chiếu đầy đủ tại: `.agents/skills/high-end-visual-design/SKILL.md`

### 1.1. Tóm tắt Hệ Thống Màu & Kiểu chữ (Áp dụng toàn website)
- **Vibe & Texture Archetype**: Agent tự chọn 1 trong 3 archetype (Ethereal Glass / Editorial Luxury / Soft Structuralism) phù hợp với ngữ cảnh từng màn hình, đảm bảo tính nhất quán xuyên suốt ứng dụng.
- **Font chính thức**: `Be Vietnam Pro` là sans-serif chính và font mặc định trên toàn website, bao gồm Header, Footer, LoginView và RegisterView. Thay thế các font sans-serif đang dùng; giữ monospace cho mã/định danh nếu cần và có fallback sans-serif hệ thống.
- **Nạp font**: Dùng một nguồn khai báo thống nhất, chỉ tải các weight cần thiết và fallback tốt nếu font ngoài không tải được. Tránh khai báo lặp ở `index.html` và stylesheet.
- **Ưu tiên yêu cầu**: Quy định Be Vietnam Pro này thay thế danh sách font cũ trong tài liệu/skill khi có xung đột. Với Header, Footer, LoginView, RegisterView chỉ đổi font/typography; giữ nguyên bố cục và thiết kế tùy chỉnh.
- **Icons**: Giữ đúng bộ icon đang có trong thiết kế cổng độc giả để hai Header/Footer đồng nhất; nếu bổ sung icon mới thì ưu tiên nét mảnh, kích thước và độ tương phản phải khớp. Không đổi riêng cổng quản lý sang bộ icon khác.
- **Spacing**: Section padding tối thiểu `py-24`, cho phép design thở nặng.
- **Borders & Shadows**: Không dùng `1px solid gray` thông thường, không dùng `rgba(0,0,0,0.3)` drop-shadow. Dùng hairline ring hoặc ambient glow.

### 1.2. Kỹ Thuật Component Bắt Buộc
- **Double-Bezel (Doppelrand)**: Mọi card, container lớn phải dùng kiến trúc Outer Shell + Inner Core lồng nhau.
- **Button-in-Button**: Nút CTA có icon mũi tên phải dùng kiến trúc pill với icon được bọc trong vòng tròn riêng.
- **Motion**: Tất cả transition dùng custom `cubic-bezier`, không dùng `linear` hay `ease-in-out`.
- **Scroll Entry Animation**: Mọi element vào viewport phải có `translate-y + blur + opacity` fade-up animation (dùng `IntersectionObserver`).

### 1.3. Bố Cục Responsive Trong Vùng Nội Dung
- `App.vue` dùng một `.container` Bootstrap cho vùng nội dung chính; các trang con không lồng thêm `.container`/`.container-fluid` để tránh co hẹp và lặp gutter.
- Nội dung trang sử dụng toàn bộ chiều rộng vùng chính; các bố cục nhiều cột tự xếp thành một cột ở breakpoint phù hợp.
- Bảng quản trị có nhiều cột được đặt trong vùng `overflow-x: auto` và có chiều rộng tối thiểu phù hợp; chỉ bảng cuộn ngang, không làm tràn toàn bộ trang.
- Header và Footer tiếp tục dùng chiều rộng layout riêng, độc lập với vùng nội dung chính.
- Khoảng cách vùng nội dung dùng nhịp co giãn theo viewport; trang chủ không tự ép chiều cao bằng `100vh` bên trong layout đã có Header/Footer.
- Card quản trị và modal dùng vỏ + lõi riêng; bảng nhiều cột chỉ cuộn ngang trong wrapper của bảng. Các form, bộ lọc và nút hành động phải co giãn hoặc xuống dòng trên màn hình hẹp.
- Tôn trọng `prefers-reduced-motion`; nội dung không được làm tràn ngang ở chiều rộng tối thiểu 320px.
- QA responsive tối thiểu tại 320px, 375px, 768px, 1024px và 1440px: header mở/đóng menu được, footer không tràn, form/nút xếp hàng dễ thao tác; bảng cuộn riêng trong vùng bảng và dialog vừa viewport.

---

## 2. Bản Đồ Màn Hình & Tuyến Đường (Vue Router)

### 2.1. Phân Hệ Người Dùng / Độc Giả (Client Portal)
1. **Trang chủ & Tra cứu mục lục sách (`/` hoặc `/books`)**:
   * **Thanh thông báo trên cùng**: Thống kê số lượng đầu sách và giờ phục vụ thư viện.
   * **Khung tìm kiếm thông minh**: Ô nhập tìm kiếm (tên sách, tác giả), bộ lọc danh mục NXB, checkbox *"Chỉ sách còn trong kho"*, hiển thị định mức mượn: **Tối đa 03 cuốn**.
   * Từ khóa, nhà xuất bản và tình trạng kho được kết hợp trên cùng danh mục đã tải; thay đổi bộ lọc không làm mất các bản ghi ngoài điều kiện đang chọn. Tìm kiếm không phân biệt chữ hoa/thường và dấu tiếng Việt.
   * Khi danh sách đổi theo tìm kiếm/bộ lọc, các thẻ sách mới vẫn phải được quan sát và hiện đầy đủ sau hiệu ứng reveal; không để số kết quả thay đổi mà thẻ tương ứng bị ẩn.
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
4. **Trang hồ sơ cá nhân (`/profile`)**:
   * Thông tin thẻ: Mã độc giả, Họ tên, Trạng thái thẻ (Hoạt động / Tạm khóa / Danh sách đen).
   * Cho phép độc giả chỉnh sửa họ tên, ngày sinh, giới tính, địa chỉ và số điện thoại đăng nhập của chính mình; không cho sửa vai trò, trạng thái thẻ hoặc số lần vi phạm.
   * Sau khi cập nhật thành công, hồ sơ và dữ liệu user lưu phiên phải đồng bộ; báo lỗi API ngay trong toast nếu cập nhật thất bại.
   * Bảng danh sách sách đang mượn: Tên sách, ngày mượn, hạn trả, trạng thái (`DangMuon`, `ChoDuyet`, `DaTra`).
   * Áp dụng Scroll Entry Animation cho từng dòng bảng.
   * Với nhân viên và quản trị viên, trang `/profile` hiển thị hồ sơ nhân viên, cho phép tự sửa `HoTenNV`, `SoDienThoai`, `DiaChi`; không cho sửa `MSNV` hoặc `ChucVu`.

---

### 2.2. Phân Hệ Quản Lý / Thủ Thư (Manager Portal - `/manager`)
* **Layout tổng thể**: Dùng cùng Header/Footer của cổng độc giả; vùng nội dung đặt trong cùng `.container` và dùng các component/bảng của design system. Không thêm sidebar cố định gây co hẹp nội dung trên tablet/mobile.
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
4. **Bộ lọc danh sách đen tại Quản trị người dùng (`/admin/users?filter=danhsachden`)**:
   * Danh sách độc giả có ≥ 3 lần vi phạm bị tước quyền mượn sách.

---

### 2.3. Phân Hệ Quản Trị Tối Cao (Super Admin Portal - `/admin`)
Admin sử dụng toàn bộ điều hướng và nghiệp vụ thủ thư, cộng thêm các màn hình quản trị chỉ dành cho ADMIN. Không ẩn các liên kết `/manager/*` khi đăng nhập bằng tài khoản ADMIN.
1. **Quản lý Người Dùng & Phân Quyền (`/admin/users`)**:
   * Danh sách tất cả tài khoản độc giả và nhân viên.
   * Bộ lọc trạng thái riêng cho `DanhSachDen` và thẻ bị khóa (`Khoa`); hiển thị trạng thái thẻ thực tế, không gộp hai trạng thái.
   * **Khóa thẻ** chỉ dành cho thẻ `HoatDong`; **Mở khóa** chỉ dành cho thẻ `Khoa` và giữ nguyên `SoLanViPham`. Nếu đã đạt 3 vi phạm, mở khóa khẩn cấp vẫn để thẻ ở `DanhSachDen`.
   * Thẻ `DanhSachDen` có thao tác **Xét gỡ khỏi danh sách đen** riêng; khi được duyệt, trạng thái trở về `HoatDong` nhưng lịch sử vi phạm không bị xóa.
   * Nút **Nâng cấp (Promote)**: Thăng cấp Độc giả → Quản lý/Thủ thư.
   * Nút **Hạ cấp (Demote)**: Thu hồi quyền quản lý về lại Độc giả.

---

## 3. Các Thành Phần Giao Diện Tái Sử Dụng (Vue Components)

Header cổng quản lý phải phản ánh phiên đang đăng nhập: khi xác thực thành công hiển thị tên và nhãn vai trò (`Thủ thư` hoặc `Quản trị viên`), điều hướng nghiệp vụ phù hợp và nút `Đăng xuất`; chỉ hiển thị `Đăng nhập nhân viên` khi chưa có phiên nhân viên. Khi tải lại trang, đồng bộ người dùng với API để tránh trạng thái header cũ. Cung cấp liên kết `Cổng độc giả` dùng URL từ env.

Các component cần xây dựng/cập nhật theo skill mới:

1. **`BookCard.vue`**: Thẻ sách dùng Double-Bezel card. Ảnh bìa tỉ lệ 3:4, badge trạng thái còn/hết/sắp hết sách. Scroll Entry Animation khi card vào viewport. Nút CTA dùng kiến trúc Button-in-Button.
2. **`BorrowModal.vue`**: Hộp thoại fixed overlay với `backdrop-blur`, Double-Bezel content card, phím tắt `Escape` để đóng, `body scroll lock` khi mở.
3. **`ToastNotification.vue`**: Toast góc dưới phải màn hình với slide-in animation (transform + opacity).
4. **`ManagerSidebar.vue`** (nếu chưa có): Sidebar quản lý dùng Double-Bezel panel, nav items có hover animation với custom cubic-bezier.
5. **Bảng dữ liệu (Tables)**: Dùng thiết kế thoáng, hairline borders (`border-white/10` hoặc `border-black/5`), row hover animation nhẹ.
6. **Form inputs**: Kiểu floating label hoặc pill input với ring hairline, focus state dùng glow thay vì outline mặc định.

---

## 4. Yêu cầu bảo mật giao diện

- Nội dung từ API/người dùng phải được Vue render như text; không dùng `v-html` với dữ liệu không tin cậy. Nếu có nội dung HTML, chỉ render sau khi sanitize theo allowlist.
- Không đưa token, mật khẩu, bí mật OAuth hay thông tin thanh toán vào URL, HTML, console hoặc thông báo lỗi. Dữ liệu UI trong localStorage không phải nguồn tin cậy để quyết định quyền.
- Router guards dùng cho điều hướng và trải nghiệm; endpoint backend luôn là nơi thực thi xác thực, vai trò và quyền sở hữu.
- Frontend hiện gửi JWT qua `Authorization: Bearer`. Nếu đổi sang cookie, thiết kế đồng thời CSRF token, `SameSite`, `HttpOnly`, `Secure` và kiểm tra origin; không dựa vào CORS để thay thế CSRF protection.
- Bảo đảm CSP/security headers tương thích với nguồn Google Identity Services/font được cho phép; tránh `unsafe-inline` nếu không có nhu cầu được xem xét.

## 5. Bản đồ route theo frontend

- `frontend_user/`: `/`, `/books`, `/books/:id`, `/profile`, `/login`, `/register`, trang 404 dành cho độc giả. Không đăng ký các route `/manager/*` hoặc `/admin/*`.
- `frontend_manage/`: `/catalog` và `/catalog/books/:id` để tra cứu danh mục/chi tiết (không đăng ký mượn), `/login` dành cho nhân viên, `/manager/borrows`, `/manager/books`, `/manager/publishers`, `/admin/users`, `/profile` nhân viên và trang 404 quản trị. MANAGER và ADMIN cùng có route nghiệp vụ thủ thư; ADMIN có thêm route quản trị.
- Hồ sơ nhân viên (`nhanvien`) và độc giả (`docgia`) là hai danh tính độc lập. MANAGER/ADMIN có thể tra cứu sách công khai qua cổng độc giả, nhưng các thao tác cá nhân độc giả yêu cầu phiên đăng nhập USER riêng cho đến khi có tính năng liên kết hồ sơ.
- Cổng quản lý có thể liên kết về domain độc giả và ngược lại bằng URL gốc lấy từ env/config cho các luồng cần đổi ứng dụng. Tra cứu sách của nhân viên phải dùng route nội bộ `/catalog` để giữ origin/phiên nhân viên.
- Guard phía client chỉ điều hướng và ẩn UI; API phải tiếp tục áp dụng JWT/RBAC/kiểm tra quyền sở hữu ở backend.
