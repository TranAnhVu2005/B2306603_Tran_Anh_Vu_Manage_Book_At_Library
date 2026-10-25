# 05. THIẾT KẾ GIAO DIỆN & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX SPECIFICATION)

Dự án áp dụng phong cách **Neo-brutalism** theo mô tả thiết kế người dùng cung cấp. Đây là quy chuẩn UI hiện hành, thay thế định hướng Vanguard/Editorial cũ khi có xung đột. Font `Be Vietnam Pro` và nguyên tắc bảo toàn ảnh nền vẫn giữ nguyên.

> Header/Footer và các trang xác thực được phép cập nhật hình thức, trạng thái, điều hướng, responsive và typography để thống nhất với Neo-brutalism. Giữ nguyên toàn bộ nội dung text đã được người dùng biên tập và giữ các ảnh nền.

Frontend sử dụng đúng tên trường CDM từ API (`VaiTro`, `ChucVu`, `TENNXB`, `GiaTriBoiThuong`, ...). Các phiếu mượn chỉ chứa `MaDocGia` và `MaSach`; màn hình cần tên hoặc thông tin tham chiếu phải tra cứu collection độc giả/sách ở phía frontend, không kỳ vọng API trả object lồng ghép.

## 0. Phân tách ứng dụng và domain

Frontend là hai ứng dụng Vue/Vite độc lập, dùng chung Backend API nhưng có domain/origin riêng:

| App | Vai trò và màn hình | Local dev |
|:---|:---|:---:|
| `frontend_user/` | Độc giả (`USER`): trang chủ, tra cứu/chi tiết sách, đăng ký mượn, hồ sơ cá nhân và lịch sử | `http://localhost:3001` |
| `frontend_manage/` | Thủ thư (`STAFF`) và Admin (`ADMIN`): tra cứu sách, quản lý kho/NXB, mượn-trả, quản trị tài khoản | `http://localhost:3002` |

Backend chạy tại `http://localhost:3000`; mỗi app proxy `/api` về backend. Production domain được cấu hình riêng theo môi trường, không hardcode; API CORS allowlist chỉ nhận các origin của hai app. Các trang sau đăng nhập điều hướng tới domain đúng vai trò. Vì localStorage không dùng chung giữa các origin, người dùng phải đăng nhập riêng trên từng app; không giả định frontend có thể đọc token ở origin còn lại. Backend vẫn là nơi duy nhất thực thi vai trò và quyền sở hữu.

Ứng dụng cũ đã được đổi tên thành `frontend_user/`. Ứng dụng này giữ luồng độc giả; `frontend_manage/` có bản tra cứu danh mục và chi tiết sách riêng dùng cùng API, styles và hành vi tìm kiếm của cổng độc giả. Mỗi app có cấu hình Vite, package và build độc lập. Menu `Tra cứu sách` của cổng quản lý đi tới `/catalog` trên cùng origin nên giữ nguyên phiên nhân viên; liên kết `Cổng độc giả` chỉ dành cho các thao tác cá nhân độc giả. Mỗi cổng xác thực phiên độc lập. Request đọc sách/NXB công khai không gửi JWT; lỗi 401 của request không mang Authorization không được xóa phiên cục bộ.

### Bộ lọc và nhập thể loại sách
- Trang tra cứu sách ở cả hai cổng có bộ lọc thể loại lấy từ `GET /api/theloai` và mức giá (dưới 50.000; 50.000–dưới 100.000; 100.000–dưới 250.000; từ 250.000 đồng), phối hợp với từ khóa, NXB và tồn kho; nút xóa bộ lọc đặt lại toàn bộ điều kiện.
- Danh mục sách trên cả hai cổng phân trang ở giao diện, mỗi trang tối đa 10 đầu sách sau khi áp dụng tìm kiếm và bộ lọc. Bộ đếm thể hiện khoảng kết quả hiện tại/tổng kết quả lọc; đổi từ khóa, bộ lọc hoặc tải lại dữ liệu đưa về trang đầu. Điều hướng trang dùng nút Trước/Sau và các số trang, có trạng thái hiện tại/disabled rõ ràng.
- Ô tìm kiếm nằm thành một hàng rộng phía trên khu vực catalog. Bộ lọc NXB, thể loại, khoảng giá và tình trạng kho nằm trong sidebar bên trái trên desktop; số bộ lọc đang bật được thể hiện cạnh nút.
- Dưới 768px, sidebar được thu gọn sau nút “Bộ lọc”; người dùng có thể mở/đóng panel mà không làm giảm chiều rộng ô tìm kiếm hay danh sách sách.
- Sidebar có khoảng đệm thoáng, nhãn/tiêu đề phân cấp rõ; nhãn nhỏ dùng nền vàng thương hiệu và chữ mực, select dùng nền giấy ấm, nút đặt lại trung tính. Tím chỉ làm màu trạng thái hover/focus để không lấn át palette vàng–mực; select vừa phải, focus bàn phím dễ nhận biết.
- Bảng quản lý kho nhóm NXB/thể loại thành một cột và năm xuất bản/đơn giá thành một cột; giới hạn chiều rộng bảng để các nút Sửa/Xóa không bị đẩy khỏi khung ở desktop. Cột hành động được giữ ở mép phải khi cuộn ngang trong wrapper ở màn hình hẹp.
- Form thêm/sửa sách yêu cầu chọn một thể loại chính; hiển thị tên thể loại từ mã tham chiếu, không nhập văn bản tự do.
- Sidebar và catalog xếp đúng thứ tự, các điều khiển không gây tràn ngang toàn trang.
- NXB, thể loại và khoảng giá dùng chung kiểu popover có chiều cao giới hạn (tối đa 280px) và cuộn bên trong; menu nổi trên nội dung, không bị khung sidebar cắt. Nút chọn phải dùng `box-sizing: border-box`, co đúng theo bề rộng cột và không lấn sang danh sách sách.

**Nhận diện hai cổng:** `frontend_user` là nguồn chuẩn cho cấu trúc Header/Footer và trang tra cứu. Hai cổng cùng dùng palette Neo-brutalist, hình thức viền/bóng, logo và nhịp khoảng cách; vẫn phân biệt chức năng bằng menu theo quyền. `frontend_manage` tra cứu nội bộ tại `/catalog`, có menu thủ thư/Admin và không hiển thị thao tác đăng ký mượn.

**Header hai cổng:** Giữ ảnh nền `/bookshelf.jpg` có thể nhận biết rõ; phủ ảnh bằng tông mực trung tính để chữ sáng dễ đọc, tránh overlay tím bão hòa làm ảnh ngả magenta. Thanh điều hướng dùng nền giấy ngà `#FFFDF2`, chữ mực, trạng thái đang chọn màu vàng `#FDC800`, và viền/bóng mực cứng. Ở desktop, logo nằm bên trái, điều hướng cân giữa và hành động phiên/tài khoản bên phải; ở mobile, giữ logo bên trái và gom hành động cùng nút menu bên phải. Cấu trúc, màu sắc và chiều cao hai header phải đồng nhất, chỉ khác đường dẫn/nội dung theo quyền.

Ở cổng quản lý desktop 1200–1400px, phân bổ cột điều hướng và cụm tài khoản theo chiều rộng thực tế; menu Admin không được nằm dưới chuông thông báo. Giữ khoảng cách thao tác giữa chuông và menu tài khoản; khi cần ở chiều rộng này có thể ẩn nhãn vai trò phụ trong nút tài khoản để tránh chồng lấn.
Ở cổng quản lý desktop, cần có khoảng cách nhìn thấy rõ giữa cụm điều hướng (bao gồm menu Quản trị người dùng) và chuông thông báo ở cụm tài khoản; không để các control chạm viền/chồng lấn khi chiều rộng trình duyệt ở khoảng 1200–1400px. Trên mobile, chuông và tài khoản vẫn là các control riêng có khoảng cách thao tác.

**Thẻ KPI nghiệp vụ:** Các thẻ tóm tắt số liệu ngắn cần ưu tiên độ quét nhanh và tiết kiệm chiều cao. Đặt nhãn/mô tả thành cụm bên trái, số liệu nổi bật bên phải; giảm padding theo breakpoint, giữ màu trạng thái, vùng bấm/focus dễ nhận biết và cho nhãn dài tự xuống dòng an toàn.

---

## 1. Quy Chuẩn Thiết Kế Áp Dụng (Design System)

Quy chuẩn thực thi: [NEOBRUTALISM.md](../NEOBRUTALISM.md)

### 1.1. Màu sắc, chữ và nhịp điệu
- **Bảng màu:** vàng `#FDC800` cho CTA/nhấn mạnh, violet `#432DD7` cho điều hướng/secondary, mực `#111111`, nền giấy ngà `#FFFDF2`. Trạng thái thành công/cảnh báo/lỗi vẫn cần màu và nhãn chữ/icon dễ phân biệt.
- **Typography:** `Be Vietnam Pro` xuyên suốt, giữ monospace cho mã; tiêu đề đậm 800–900; cỡ tham chiếu 13/15/17/21/27/35px, co giãn theo viewport và không cắt chữ tiếng Việt.
- **Spacing:** đơn vị cơ sở 4px (4/8/12/16/24/32px), sử dụng khoảng trống có chủ đích, không làm bảng nghiệp vụ khó quét.
- **Bề mặt:** phẳng, màu đặc, không glassmorphism/gradient trang trí. Card/nhóm tương tác dùng viền mực 2–3px, góc vừa phải và bóng cứng lệch 3–6px, không blur.

### 1.2. Component, tương tác và ảnh nền
- **Nút:** viền mực dày, primary vàng, secondary violet; hover dịch chuyển nhẹ, active nén bóng, disabled vẫn đọc được. Không ép dạng pill toàn cục.
- **Form:** nhãn luôn nhìn thấy, input nền sáng/viền rõ; focus-visible violet dày, lỗi gắn với trường và `aria-describedby`.
- **Card / bảng / dialog / toast / navigation:** dùng chung token neo-brutalist; bảng có wrapper cuộn ngang riêng; dialog/toast có trạng thái dễ nhận biết.
- **Ảnh nền phải được giữ:** không xóa, thay bằng màu trơn, ẩn, crop quá mức hoặc đổi URL ảnh header (`/bookshelf.jpg`), đăng nhập/đăng ký (`background_login.jpg`) và hero tra cứu (`background_homeview.jpg`). Có thể chỉnh lớp phủ, blend mode, sáng/bão hòa và vị trí; ảnh vẫn phải nhận ra được và chữ đạt tương phản.
- **Motion / accessibility:** chuyển động ngắn có `cubic-bezier`; hỗ trợ `prefers-reduced-motion`, bàn phím, `focus-visible`, semantic HTML, ARIA và WCAG 2.2 AA. Không truyền trạng thái chỉ bằng màu.
- Tránh selector toàn cục làm biến dạng layout, input ẩn, checkbox/radio, scroll wrapper, nút disabled/loading; ưu tiên token và class component.

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
     * Dùng lưới responsive dễ quét, có thể nhấn nhịp bất đối xứng khi không ảnh hưởng khả năng so sánh sách.
     * Thẻ sách dùng nền phẳng, viền mực và bóng cứng; ảnh bìa tỉ lệ 3:4.
     * Thông tin chi tiết: Mã sách, tên sách đậm, tác giả, NXB, năm XB.
     * Khối thông số: Số lượng còn lại trong kho, đơn giá đền bù nếu mất.
     * Nút CTA vàng có viền đậm `Đăng ký mượn` (còn sách) hoặc badge `Tạm hết sách`.
2. **Chi tiết sách (`/books/:id`)**:
   * Hai cổng dùng cùng cấu trúc chi tiết sách: breadcrumb quay lại danh mục; khung nội dung giấy ngà viền mực 2px và bóng cứng; ảnh bìa giữ tỷ lệ 3:4, mã sách và trạng thái kho ở cột ảnh; cột nội dung có tên sách, tác giả, thông số và tóm tắt.
   * Tiêu đề và nội dung dùng Be Vietnam Pro, không dùng font serif riêng cho trang; phân cấp chữ rõ, không phóng tiêu đề hoặc badge quá mức. Khối thông số nền sáng phẳng, không dùng mảng vàng lớn hay bóng mềm.
   * Thông số hiển thị gồm thể loại, nhà xuất bản, năm xuất bản và đơn giá bảo lưu; mã NXB là thông tin phụ. Nhãn thể loại phải tra từ danh mục `theloai` qua `MaTheLoai`, fallback “Chưa phân loại” khi thiếu dữ liệu.
   * Cổng độc giả có CTA đăng ký mượn khi còn sách, trạng thái vô hiệu khi hết sách và ghi chú nhận trong 3 ngày kể từ khi duyệt; hạn mượn 14 ngày chỉ bắt đầu khi thủ thư xác nhận bàn giao tại quầy. Borrow Modal nêu rõ hai mốc thời gian.
   * Ở 320–420px, thông số chuyển một cột; dưới 768px ảnh bìa thu gọn và nội dung xếp dọc. Tiêu đề/mã dài được phép ngắt dòng, nút không tràn ngang. Không xóa hoặc thay ảnh bìa/ảnh nền hiện có.
3. **Modal Xác Nhận Mượn Sách (Borrow Dialog)**:
   * Dùng nền giấy ngà, vùng thông tin sách violet, điểm nhấn vàng, mực đậm; loại bỏ gradient trang trí, glass/blur, bóng mềm và nền xanh rêu của kiểu cũ.
   * Các bề mặt, thẻ thông tin, input và nút dùng viền mực 2–3px, góc vừa phải và bóng cứng 2–5px; focus-visible violet và trạng thái disabled/loading dễ nhận biết.
   * Ảnh bìa sách phải được giữ nguyên; modal desktop chia cột sách/thông tin, mobile xếp dọc và cuộn trong modal, không làm tràn ngang ở 320px.
   * Hiển thị tựa sách, hạn nhận trong 3 ngày sau khi duyệt và thời hạn mượn 14 ngày tính từ lúc bàn giao tại quầy.
   * Thông báo: Đơn ở trạng thái `ChoDuyet`; sau khi duyệt thành `ChoNhan`, sách được giữ đến hết `HanNhan`. Sau xác nhận bàn giao mới chuyển `DangMuon` và chạy hạn trả.
4. **Trang hồ sơ cá nhân (`/profile`)**:
   * Sau khi đăng nhập, header desktop, menu tài khoản và menu mobile đều có mục **Hồ sơ cá nhân** trỏ tới `/profile`; nhãn điều hướng không chỉ nói về sách đang mượn.
   * Trang có tiêu đề rõ ràng **Hồ sơ cá nhân**; phần thông tin thẻ và chỉnh sửa hồ sơ được phân biệt trực quan với phần sách đang mượn/lịch sử.
   * Thông tin thẻ: Mã độc giả, Họ tên, Trạng thái thẻ (Hoạt động / Tạm khóa / Danh sách đen).
   * Cho phép độc giả chỉnh sửa họ tên, ngày sinh, giới tính, địa chỉ và số điện thoại đăng nhập của chính mình; không cho sửa vai trò, trạng thái thẻ hoặc số lần vi phạm.
   * Sau khi cập nhật thành công, hồ sơ và dữ liệu user lưu phiên phải đồng bộ; báo lỗi API ngay trong toast nếu cập nhật thất bại.
   * Bảng hoạt động mượn hiển thị trạng thái đang mượn, chờ duyệt, chờ nhận và lịch sử, gồm `DaHuy`/`QuaHanNhan`; hiển thị riêng ngày đăng ký, hạn nhận, ngày bàn giao và hạn trả theo trạng thái.
   * Trong tab chờ xử lý, độc giả có thể hủy phiếu `ChoDuyet`/`ChoNhan` trước khi nhận. Dialog nêu rõ phiếu đã duyệt sẽ trả sách giữ về kho; thành công chuyển phiếu sang lịch sử `DaHuy`.
   * Trong tab đang mượn, độc giả có thể mở dialog **Gia hạn 7 ngày** nếu phiếu chưa đến hạn và chưa từng gia hạn; dialog hiển thị hạn cũ/mới, giải thích giới hạn một lần và trạng thái tải khi xác nhận. Sau khi thành công, bảng cập nhật hạn trả và ẩn nút gia hạn.
   * Dialog hủy dùng nền giấy, viền mực và bóng cứng theo Neo-brutalism; tên sách là vùng thông tin riêng, giải thích ngắn gọn và nút xác nhận màu vàng. Chỉ dùng đỏ/cam làm dấu hiệu cảnh báo nhỏ, tránh biến hành động hủy thành nút đỏ quá nặng. Header, nội dung và footer có khoảng cách nhất quán; trên mobile hai nút xếp dọc, rộng vừa khung và không tràn.
   * Bảng gọn, nhãn trạng thái rõ và cuộn trong wrapper nếu viewport hẹp.
   * Với nhân viên và quản trị viên, trang `/profile` hiển thị hồ sơ nhân viên, cho phép tự sửa `HoTenNV`, `SoDienThoai`, `DiaChi`; không cho sửa `MSNV` hoặc `ChucVu`. Không hiển thị CTA “Tìm thêm sách” trên hồ sơ cổng quản lý; chức năng tra cứu đã nằm trong điều hướng chính. Cổng quản lý yêu cầu nhân viên đăng nhập bằng số điện thoại đã đăng ký; MSNV chỉ hiển thị làm mã hồ sơ.

---

### 2.2. Phân Hệ Quản Lý / Thủ Thư (Manager Portal - `/manager`)
* **Layout tổng thể**: Dùng cùng Header/Footer của cổng độc giả; vùng nội dung đặt trong cùng `.container` và dùng các component/bảng của design system. Sidebar catalog chỉ tham gia layout desktop, không fixed; thu gọn thành nút mở/đóng trên màn hình nhỏ để giữ chiều rộng nội dung.
1. **Quản lý Mượn - Trả & Phê Duyệt (`/manager/borrows`)**:
   * Hàng tab và lọc: ô tìm kiếm co giãn để dùng phần không gian còn lại cạnh các tab; bộ lọc quá hạn vẫn nằm cạnh ô tìm kiếm khi phù hợp. Ở màn hình hẹp, các cụm được phép xuống hàng và ô tìm kiếm chiếm bề rộng khả dụng.
   * **Tab 1: Chờ xử lý**: `ChoDuyet` có nút **[Duyệt và giữ sách]** / **[Từ chối]**; `ChoNhan` có nút **[Xác nhận giao sách]**. Duyệt giữ kho và đặt hạn nhận 3 ngày; bàn giao mới ghi ngày mượn và hạn trả 14 ngày.
   * Bảng mượn-trả phải nằm gọn trong panel; khi tổng chiều rộng cột lớn hơn viewport, chỉ wrapper của bảng cuộn ngang. Cột **Hành động** có đủ chỗ cho nút dài; các nút xếp theo chiều dọc, căn giữa, tự xuống dòng và chừa khoảng cách cho viền/bóng cứng trong ô. Không để nút chạm hoặc che viền bảng, không làm tràn trang.
   * Phiếu `ChoNhan` quá hạn tự chuyển `QuaHanNhan`, trả sách về kho và hiển thị trong lịch sử.
   * **Tab 2: Đang mượn**: Bảng theo dõi tính từ ngày bàn giao, hiển thị số ngày còn lại và hạn trả.
   * **Nút hành động nhanh**:
     * **[Xác nhận trả sách]**: Trạng thái → `DaTra`, cộng lại tồn kho. Trả trễ → tăng vi phạm độc giả.
     * **[Báo mất sách]**: Trạng thái → `MatSach`, hiển thị đơn giá đền bù, không hoàn kho, tăng vi phạm +1.
2. **Quản lý Kho Sách (`/manager/books`)**:
   * Bảng danh sách sách: Thêm mới, sửa thông tin, cập nhật số lượng nhập kho, ảnh bìa, xóa sách.
   * Form thêm/sửa sách dùng nền phẳng, viền và focus state nhất quán.
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
   * Hiển thị trạng thái tài khoản thủ thư (`HoatDong`/`Khoa`), cho Admin khóa/mở khóa thủ thư kèm lý do; bộ lọc tài khoản/thẻ bị khóa đếm cả hai loại hồ sơ.
   * Lý do khóa/mở khóa nhập trong dialog giao diện theo Neo-brutalism, có thông tin nhân viên, mô tả tác động, giới hạn 500 ký tự, trạng thái đang xử lý, xác nhận/hủy, hỗ trợ Escape và focus bàn phím; không dùng hộp thoại trình duyệt mặc định.
   * Không hiển thị thao tác khóa Admin; backend vẫn phải từ chối Admin tự khóa và không cho khóa Admin khác.
   * **Khóa thẻ** chỉ dành cho thẻ `HoatDong`; **Mở khóa** chỉ dành cho thẻ `Khoa` và giữ nguyên `SoLanViPham`. Nếu đã đạt 3 vi phạm, mở khóa khẩn cấp vẫn để thẻ ở `DanhSachDen`.
   * Thẻ `DanhSachDen` có thao tác **Xét gỡ khỏi danh sách đen** riêng; khi được duyệt, trạng thái trở về `HoatDong` và `SoLanViPham` được đặt lại về 0 cho chu kỳ mới. Nhật ký kiểm toán vẫn giữ lịch sử vi phạm và quyết định xét gỡ.
   * Admin có trang riêng để xem hồ sơ ứng tuyển nhân viên, duyệt hoặc từ chối kèm lý do; không chuyển đổi hồ sơ độc giả thành nhân viên.
2. **Nhật ký kiểm toán (`/admin/audit-logs`)**:
   * Chỉ ADMIN được xem lịch sử sách và phiếu mượn; lọc theo hành động, mã sách, độc giả, nhân viên, loại đối tượng và khoảng thời gian.
   * Hiển thị thời điểm, hành động, tên/mã sách, tên/mã độc giả, nhân viên chịu trách nhiệm và chi tiết trạng thái/thay đổi; hỗ trợ tải thêm theo trang.
   * Không hiển thị mã hành động kỹ thuật dạng chữ hoa có gạch dưới; dùng nhãn tiếng Việt có dấu và mô tả ngắn dễ hiểu. Chi tiết dùng nhãn tiếng Việt, dịch trạng thái nghiệp vụ sang cách viết có dấu, chia thành từng dòng thoáng; nội dung dài được ngắt dòng và không dính liền nhau.
   * Nhật ký chỉ đọc; giao diện không có thao tác sửa/xóa log.
3. **Quản lý tài khoản (`/admin/users`)**:
   * Hiển thị độc giả và nhân viên đã được tạo trong cùng một danh sách; bộ lọc thẻ chỉ áp dụng cho độc giả.
   * Không có thao tác thăng cấp/hạ cấp độc giả. Quản trị viên xử lý hồ sơ ứng tuyển tại `/admin/staff-applications`; duyệt tạo tài khoản thủ thư, từ chối yêu cầu lý do và ghi nhật ký.
   * Mã, tên, số điện thoại và vai trò/chức vụ hiển thị theo đúng loại hồ sơ; các cột thẻ/vi phạm không áp dụng cho nhân viên, không hiển thị mật khẩu.
4. **Xóa mềm sách (`/manager/books`)**:
   * Nút xóa chuyển sách sang `deleted=true`; sách biến mất khỏi tra cứu/mượn mới nhưng giữ nguyên dữ liệu và lịch sử.
   * Chỉ ADMIN có thể mở danh sách đã xóa mềm và khôi phục sách.

---

## 3. Các Thành Phần Giao Diện Tái Sử Dụng (Vue Components)

Header cổng quản lý phải phản ánh phiên đang đăng nhập: khi xác thực thành công hiển thị tên và nhãn vai trò (`Thủ thư` hoặc `Quản trị viên`), điều hướng nghiệp vụ phù hợp và nút `Đăng xuất`; chỉ hiển thị `Đăng nhập nhân viên` khi chưa có phiên nhân viên. Sau đăng nhập không có redirect được yêu cầu, ADMIN mặc định vào `/admin/users`, STAFF vào `/manager/borrows`. Nếu đăng nhập từ route nghiệp vụ có redirect hợp lệ thì giữ nguyên đích đó. Truy cập `/login` khi đã đăng nhập cũng chuyển ADMIN tới `/admin/users` và STAFF tới `/manager/borrows`. Khi tải lại trang, đồng bộ người dùng với API để tránh trạng thái header cũ. Cung cấp liên kết `Cổng độc giả` dùng URL từ env.

Các component cần xây dựng/cập nhật theo neo-brutalism:

1. **`BookCard.vue`**: Thẻ sách dùng nền đặc, viền 2–3px và bóng cứng; giữ ảnh bìa 3:4, badge và nội dung không bị cắt.
2. **`BorrowModal.vue`**: Hộp thoại overlay tương phản cao, viền đen/bóng cứng, phím `Escape` và body scroll lock.
3. **`ToastNotification.vue`**: Toast góc dưới phải với thông báo thành công xanh lá đậm và lỗi đỏ đậm, chữ trắng tương phản cao; nền sáng, viền mực/bóng cứng, góc vừa phải. Nội dung dài tự xuống dòng, nút đóng có focus rõ, hỗ trợ `prefers-reduced-motion`; dùng cùng màu và cấu trúc ở cả hai cổng.
4. **Navigation quản lý**: Nền phẳng, mục active vàng/violet có viền và phản hồi hover rõ.
5. **Bảng dữ liệu (Tables)**: Header tương phản, đường kẻ rõ, bảo toàn khả năng đọc; cuộn trong wrapper trên mobile.
6. **Form inputs**: Nhãn thường trực, viền đậm, focus-visible violet; kiểm tra checkbox/radio và input file riêng để không biến dạng.

---

## 4. Yêu cầu bảo mật giao diện

- Nội dung từ API/người dùng phải được Vue render như text; không dùng `v-html` với dữ liệu không tin cậy. Nếu có nội dung HTML, chỉ render sau khi sanitize theo allowlist.
- Không đưa token, mật khẩu, bí mật OAuth hay thông tin thanh toán vào URL, HTML, console hoặc thông báo lỗi. Dữ liệu UI trong localStorage không phải nguồn tin cậy để quyết định quyền.
- Router guards dùng cho điều hướng và trải nghiệm; endpoint backend luôn là nơi thực thi xác thực, vai trò và quyền sở hữu.
- Frontend hiện gửi JWT qua `Authorization: Bearer`. Nếu đổi sang cookie, thiết kế đồng thời CSRF token, `SameSite`, `HttpOnly`, `Secure` và kiểm tra origin; không dựa vào CORS để thay thế CSRF protection.
- Bảo đảm CSP/security headers tương thích với nguồn Google Identity Services/font được cho phép; tránh `unsafe-inline` nếu không có nhu cầu được xem xét.

## 5. Bản đồ route theo frontend

- `frontend_user/`: `/`, `/books`, `/books/:id`, `/profile`, `/login`, `/register`, trang 404 dành cho độc giả. Không đăng ký các route `/manager/*` hoặc `/admin/*`.
- `frontend_manage/`: đường dẫn gốc `/` ưu tiên chuyển tới `/login` để nhân viên gặp luồng đăng nhập đầu tiên. `/catalog` và `/catalog/books/:id` vẫn là route tra cứu công khai khi người dùng chủ động mở; chúng không yêu cầu đăng nhập và không có thao tác mượn. `/login` và `/staff-register` dành cho nhân viên. Trang đăng ký chỉ gửi hồ sơ, chưa tạo phiên; đăng ký phải được đặt đường dẫn dễ thấy tại header/menu mobile và trang login. Sau khi đăng nhập, chỉ chuyển tới đường dẫn nội bộ hợp lệ được yêu cầu; route nghiệp vụ gồm `/manager/borrows`, `/manager/books`, `/manager/publishers`, `/admin/users`, `/admin/staff-applications`, `/admin/audit-logs`, `/profile` nhân viên và trang 404 quản trị. STAFF và ADMIN cùng có route nghiệp vụ thủ thư; route Admin chỉ ADMIN.
- Hồ sơ nhân viên (`nhanvien`) và độc giả (`docgia`) là hai danh tính độc lập. STAFF/ADMIN có thể tra cứu sách công khai qua cổng độc giả, nhưng các thao tác cá nhân độc giả yêu cầu phiên đăng nhập USER riêng cho đến khi có tính năng liên kết hồ sơ.
- Cổng quản lý có thể liên kết về domain độc giả và ngược lại bằng URL gốc lấy từ env/config cho các luồng cần đổi ứng dụng. Tra cứu sách của nhân viên phải dùng route nội bộ `/catalog` để giữ origin/phiên nhân viên.
- Guard phía client chỉ điều hướng và ẩn UI; API phải tiếp tục áp dụng JWT/RBAC/kiểm tra quyền sở hữu ở backend.

## 6. Bộ lọc và nhập thể loại sách
- Catalog ở cả hai cổng có bộ lọc thể loại lấy từ `GET /api/theloai` và khoảng giá, phối hợp với từ khóa, NXB và tồn kho; thao tác xóa bộ lọc đặt lại mọi điều kiện.
- Ô tìm kiếm rộng đặt phía trên; sidebar bộ lọc nằm bên trái trên desktop và thu gọn sau nút điều khiển trên màn hình dưới 768px.
- Màn quản lý kho nhóm NXB/thể loại và năm xuất bản/đơn giá để giảm bề rộng bảng; cột hành động luôn nằm tại mép phải của wrapper cuộn. Form thêm/sửa sách yêu cầu chọn một thể loại chính; hiển thị tên từ mã tham chiếu, không nhập văn bản tự do.
- Select và hàng lọc phải xuống dòng có kiểm soát ở màn nhỏ, không gây tràn ngang toàn trang.
# Hộp thư thông báo

- Cả hai cổng hiển thị nút chuông nhỏ trong header khi có phiên đăng nhập; huy hiệu đỏ thể hiện số chưa đọc (giới hạn hiển thị `99+`). Khách chưa đăng nhập không thấy nút.
- Mở chuông sẽ hiển thị panel có tiêu đề, nội dung, thời gian và phân biệt chưa đọc; hỗ trợ đánh dấu từng tin hoặc tất cả đã đọc. Nội dung dài được cuộn trong panel, không làm tràn toàn trang.
- Dùng nền giấy, mực đậm, nhấn violet cho trạng thái chưa đọc, viền/bóng theo Neo-brutalism. Trên màn hình 320px panel nằm trong viewport.
- Hộp thư lưu trên server và được đồng bộ khi mở, focus lại tab và mỗi 30 giây.
- Khi nhận thông báo khóa/mở khóa hoặc gỡ Danh sách đen, cổng độc giả đồng bộ hồ sơ hiện tại qua `/api/auth/me`; trước khi mở Borrow Modal cũng tải trạng thái mới nhất để không chặn nhầm theo localStorage cũ. Backend vẫn là nơi quyết định cuối cùng khi tạo phiếu.
