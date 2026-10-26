# 02. SƠ ĐỒ CƠ SỞ DỮ LIỆU CDM

## 2.1. Tổng quan

Hệ thống dùng MongoDB Native Driver với cơ sở dữ liệu `quanlymuonsach`. Theo code hiện tại, có **10 collection**: **6 collection nghiệp vụ** (`docgia`, `nhanvien`, `nhaxuatban`, `sach`, `theloai`, `theodoimuonsach`) và **4 collection hỗ trợ** (`yeucaunhanvien`, `nhatkykiemtoan`, `thongbao`, `jwt_revocations`).

Trong các bảng mô tả dưới đây, `_id` là khóa chính nội bộ MongoDB. Các mã nghiệp vụ duy nhất như `MaDocGia`, `MaSach`, `MaNXB`, `MaTheLoai`, `MSNV` là khóa định danh thay thế/khóa duy nhất, không phải khóa chính MongoDB. Cột Khóa ngoại ghi các tham chiếu logic do backend quản lý; MongoDB không tự cưỡng chế foreign key như hệ quản trị quan hệ. Trường thời gian nghiệp vụ như `NgayMuon` hiện được lưu dạng chuỗi ngày `YYYY-MM-DD`; trường thời điểm tạo/cập nhật thường dùng BSON Date.

## 2.2. Danh sách collection

| STT | Tên bảng (Collection) | Phân loại | Diễn giải |
|---:|---|---|---|
| 1 | `docgia` | Nghiệp vụ | Hồ sơ, tài khoản, trạng thái thẻ và số lần vi phạm của độc giả. |
| 2 | `nhanvien` | Nghiệp vụ | Hồ sơ và tài khoản nhân viên thư viện (`STAFF`) và quản trị viên (`ADMIN`). |
| 3 | `nhaxuatban` | Nghiệp vụ | Danh mục nhà xuất bản được sách tham chiếu bằng `MaNXB`. |
| 4 | `sach` | Nghiệp vụ | Danh mục đầu sách, thông tin xuất bản, thể loại và tồn kho. |
| 5 | `theloai` | Nghiệp vụ | Danh mục thể loại được sách tham chiếu bằng `MaTheLoai`. |
| 6 | `theodoimuonsach` | Nghiệp vụ | Phiếu mượn và vòng đời đăng ký, duyệt, nhận, trả, gia hạn hoặc báo mất sách. |
| 7 | `yeucaunhanvien` | Hỗ trợ quy trình | Hồ sơ đăng ký làm nhân viên trước khi Admin duyệt và tạo tài khoản. |
| 8 | `nhatkykiemtoan` | Hỗ trợ vận hành | Nhật ký append-only về sự kiện nghiệp vụ và thao tác quản trị. |
| 9 | `thongbao` | Hỗ trợ vận hành | Thông báo nghiệp vụ gửi đến độc giả/nhân viên và trạng thái đã đọc. |
| 10 | `jwt_revocations` | Hỗ trợ bảo mật | Hash của JWT bị thu hồi, dùng để vô hiệu hóa phiên đăng nhập. |

## 2.3. Mô tả các lớp dữ liệu nghiệp vụ

### 2.3.1. Độc giả (`docgia`)

Lưu thông tin cá nhân, thông tin đăng nhập và tình trạng thẻ thư viện của độc giả.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ do MongoDB tạo cho document. |
| `MaDocGia` | String | Không; duy nhất | Không | Mã nghiệp vụ độc giả, ví dụ `DG-000001`; được phiếu mượn dùng để tham chiếu. |
| `HoLot` | String | Không | Không | Họ và tên đệm của độc giả. |
| `Ten` | String | Không | Không | Tên độc giả. |
| `NgaySinh` | String | Không | Không | Ngày sinh theo định dạng ngày ứng dụng sử dụng, thông thường `YYYY-MM-DD`. |
| `Phai` | Number | Không | Không | Giới tính: `1` Nam, `0` Nữ, `2` Khác. |
| `DiaChi` | String | Không | Không | Địa chỉ độc giả. |
| `DienThoai` | String | Không; duy nhất theo quy tắc tài khoản | Không | Số điện thoại đăng nhập/liên hệ. Tài khoản Google có thể dùng giá trị hệ thống thay thế. |
| `MatKhau` | String | Không | Không | Mật khẩu được băm bằng Bcrypt; không trả về API. Có thể vắng mặt với tài khoản đăng nhập Google. |
| `VaiTro` | String | Không | Không | Vai trò của hồ sơ độc giả; giá trị chuẩn là `USER`. |
| `SoLanViPham` | Number | Không | Không | Bộ đếm vi phạm hiện tại; được đặt lại khi Admin gỡ khỏi danh sách đen. |
| `TrangThaiThe` | String | Không | Không | Trạng thái `HoatDong`, `Khoa` hoặc `DanhSachDen`. |
| `AnhDaiDien` | String | Không | Không | Đường dẫn ảnh đại diện, nếu có. |
| `Email` | String | Không | Không | Email tài khoản Google, nếu có. |
| `GoogleId` | String | Không | Không | Định danh Google, nếu tài khoản được tạo/liên kết qua Google. |
| `CreatedAt` | Date | Không | Không | Thời điểm tạo hồ sơ, nếu được ghi nhận. |
| `UpdatedAt` | Date | Không | Không | Thời điểm cập nhật hồ sơ, nếu được ghi nhận. |

### 2.3.2. Nhân viên (`nhanvien`)

Lưu tài khoản nhân viên thư viện và quản trị viên.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ do MongoDB tạo. |
| `MSNV` | String | Không; duy nhất | Không | Mã nghiệp vụ nhân viên, ví dụ `NV-0001`; dùng trong hồ sơ và tham chiếu phiếu mượn. |
| `HoTenNV` | String | Không | Không | Họ tên nhân viên. |
| `MatKhau` | String | Không | Không | Mật khẩu đăng nhập đã băm bằng Bcrypt; không trả về API. |
| `ChucVu` | String | Không | Không | Chức vụ `STAFF` hoặc `ADMIN`. |
| `SoDienThoai` | String | Không; duy nhất | Không | Số điện thoại đăng nhập của nhân viên. |
| `DiaChi` | String | Không | Không | Địa chỉ liên hệ. |
| `AnhDaiDien` | String | Không | Không | Đường dẫn ảnh đại diện, nếu có. |
| `TrangThaiThe` | String | Không | Không | Trạng thái tài khoản nhân viên: `HoatDong` hoặc `Khoa`. Đây không phải trạng thái thẻ độc giả. |
| `PhienBanToken` | Number | Không | Không | Phiên bản phiên xác thực; được dùng để làm mất hiệu lực JWT cũ. |
| `MaYeuCauDangKy` | String | Không | Tham chiếu logic `yeucaunhanvien._id` (dạng chuỗi), nếu có | Mã hồ sơ đăng ký đã sinh tài khoản; hỗ trợ liên kết và xử lý duyệt idempotent. |
| `CreatedAt` | Date | Không | Không | Thời điểm tạo hồ sơ, nếu được ghi nhận. |
| `UpdatedAt` | Date | Không | Không | Thời điểm cập nhật hồ sơ, nếu được ghi nhận. |

### 2.3.3. Nhà xuất bản (`nhaxuatban`)

Lưu danh mục nhà xuất bản liên kết với các đầu sách.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ do MongoDB tạo. |
| `MaNXB` | String | Không; duy nhất | Không | Mã nghiệp vụ nhà xuất bản, ví dụ `NXB-0001`. |
| `TENNXB` | String | Không | Không | Tên nhà xuất bản. |
| `DiaChi` | String | Không | Không | Địa chỉ trụ sở nhà xuất bản. |
| `CreatedAt` | Date | Không | Không | Thời điểm tạo dữ liệu, nếu được ghi nhận. |
| `UpdatedAt` | Date | Không | Không | Thời điểm cập nhật dữ liệu, nếu được ghi nhận. |

### 2.3.4. Sách (`sach`)

Lưu thông tin đầu sách, dữ liệu xuất bản, thể loại và tồn kho. Trường xóa mềm là metadata vận hành, không phải thuộc tính CDM cốt lõi.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ do MongoDB tạo. |
| `MaSach` | String | Không; duy nhất | Không | Mã đầu sách, ví dụ `SACH-000001`. |
| `TenSach` | String | Không | Không | Tên sách. |
| `DonGia` | Number | Không | Không | Đơn giá sách; dùng tính giá trị bồi thường khi báo mất. |
| `SoQuyen` | Number | Không | Không | Số lượng sách hiện có trong kho. |
| `NamXuatBan` | Number hoặc String | Không | Không | Năm xuất bản; dữ liệu chưa xác định có thể lưu “Không rõ”. |
| `MaNXB` | String | Không | Tham chiếu `nhaxuatban.MaNXB` | Mã nhà xuất bản của sách. |
| `MaTheLoai` | String | Không | Tham chiếu `theloai.MaTheLoai` | Mã thể loại chính của sách. |
| `TacGia` | String | Không | Không | Tác giả hoặc cơ quan biên soạn. |
| `HinhAnh` | String | Không | Không | Đường dẫn ảnh bìa. |
| `MoTa` | String | Không | Không | Tóm tắt nội dung sách. |
| `NguonGoc` | String | Không | Không | Thông tin nguồn gốc, nếu có. |
| `CreatedAt` | Date | Không | Không | Thời điểm tạo sách, nếu được ghi nhận. |
| `UpdatedAt` | Date | Không | Không | Thời điểm cập nhật sách, nếu được ghi nhận. |
| `deleted` | Boolean | Không | Không | Cờ xóa mềm; bản ghi thiếu trường này được xem là đang hoạt động. |
| `DeletedAt` | Date | Không | Không | Thời điểm xóa mềm, nếu đã xóa. |
| `DeletedBy` | String | Không | Không | Mã người thực hiện xóa mềm, nếu đã xóa. |

### 2.3.5. Thể loại (`theloai`)

Lưu danh mục thể loại dùng chung để phân loại và lọc sách.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ do MongoDB tạo. |
| `MaTheLoai` | String | Không; unique index | Không | Mã thể loại, ví dụ `TL-0001`; backend tạo unique index cho trường này. |
| `TenTheLoai` | String | Không | Không | Tên thể loại hiển thị. |
| `MoTa` | String | Không | Không | Mô tả thể loại. |
| `CreatedAt` | Date | Không | Không | Thời điểm tạo; các thể loại mặc định được seed idempotent. |

### 2.3.6. Theo dõi mượn sách (`theodoimuonsach`)

Lưu phiếu mượn và các mốc trong vòng đời xử lý phiếu. Các trường ngày nghiệp vụ hiện được lưu dưới dạng chuỗi ngày `YYYY-MM-DD`.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ của phiếu. |
| `MaDocGia` | String | Không | Tham chiếu `docgia.MaDocGia` | Độc giả sở hữu phiếu mượn. |
| `MaSach` | String | Không | Tham chiếu `sach.MaSach` | Đầu sách trong phiếu. |
| `NgayDangKy` | String (`YYYY-MM-DD`) | Không | Không | Ngày độc giả gửi yêu cầu mượn. |
| `NgayDuyet` | String (`YYYY-MM-DD`) hoặc null | Không | Không | Ngày nhân viên duyệt và giữ sách. |
| `HanNhan` | String (`YYYY-MM-DD`) hoặc null | Không | Không | Ngày cuối độc giả được nhận sách sau khi duyệt. |
| `NgayMuon` | String (`YYYY-MM-DD`) hoặc null | Không | Không | Ngày bàn giao sách thực tế tại quầy. |
| `MSNV` | String hoặc null | Không | Tham chiếu logic `nhanvien.MSNV` | Nhân viên xử lý/duyệt/bàn giao phiếu, nếu có. |
| `NgayHenTra` | String (`YYYY-MM-DD`) hoặc null | Không | Không | Hạn trả tính từ ngày bàn giao; có thể được gia hạn. |
| `SoLanGiaHan` | Number | Không | Không | Số lần gia hạn; giá trị khởi tạo `0`, tối đa `1` theo nghiệp vụ hiện tại. |
| `NgayGiaHan` | String (`YYYY-MM-DD`) hoặc null | Không | Không | Ngày gia hạn, nếu phiếu đã được gia hạn. |
| `NgayTra` | String (`YYYY-MM-DD`) hoặc null | Không | Không | Ngày trả thực tế hoặc ngày ghi nhận mất sách. |
| `TrangThai` | String | Không | Không | `ChoDuyet`, `ChoNhan`, `DangMuon`, `DaTra`, `MatSach`, `TuChoi`, `DaHuy` hoặc `QuaHanNhan`. |
| `GiaTriBoiThuong` | Number | Không | Không | Tiền bồi thường ghi nhận khi mất sách; mặc định `0`. |
| `GhiChu` | String | Không | Không | Ghi chú tình trạng sách hoặc lý do xử lý/từ chối. |
| `CreatedAt` | Date | Không | Không | Thời điểm tạo phiếu, nếu được ghi nhận. |
| `UpdatedAt` | Date | Không | Không | Thời điểm cập nhật phiếu, nếu được ghi nhận. |

## 2.4. Mô tả các collection hỗ trợ vận hành

### 2.4.1. Hồ sơ đăng ký nhân viên (`yeucaunhanvien`)

Lưu hồ sơ ứng tuyển trước khi tài khoản được tạo trong `nhanvien`.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ của hồ sơ. |
| `HoTenNV` | String | Không | Không | Họ tên người đăng ký. |
| `SoDienThoai` | String | Không | Không | Số điện thoại đăng ký. |
| `DiaChi` | String | Không | Không | Địa chỉ người đăng ký. |
| `MatKhau` | String | Không | Không | Mật khẩu đã băm; không trả về API và được gỡ sau khi duyệt. |
| `TrangThai` | String | Không | Không | `ChoDuyet`, `DangDuyet`, `DaDuyet` hoặc `TuChoi`. |
| `ThoiGianGui` | Date | Không | Không | Thời điểm gửi hồ sơ. |
| `ThoiGianXuLy` | Date hoặc null | Không | Không | Thời điểm xử lý hồ sơ. |
| `NguoiDuyet` | String hoặc null | Không | Tham chiếu logic đến mã nhân viên xử lý | Mã Admin/người xử lý hồ sơ, nếu có. |
| `MSNV` | String hoặc null | Không | Tham chiếu logic `nhanvien.MSNV` | Mã tài khoản nhân viên sinh ra khi hồ sơ được duyệt. |
| `LyDoTuChoi` | String hoặc null | Không | Không | Lý do từ chối hồ sơ. |

### 2.4.2. Nhật ký kiểm toán (`nhatkykiemtoan`)

Lưu nối tiếp các sự kiện; tập trường thực tế có thể thay đổi theo loại sự kiện.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ của bản ghi log. |
| `HanhDong` | String | Không | Không | Mã hành động như `SACH_TAO`, `PHIEU_GIA_HAN`, khóa/mở khóa tài khoản. |
| `LoaiDoiTuong` | String | Không | Không | Loại đối tượng như sách, phiếu mượn, nhân viên hoặc độc giả. |
| `MaDoiTuong` | String | Không | Không | Mã định danh đối tượng liên quan. |
| `MaSach` | String | Không | Tham chiếu logic `sach.MaSach` | Mã sách liên quan, nếu có. |
| `TenSach` | String | Không | Không | Snapshot tên sách để giữ lịch sử hiển thị. |
| `MaDocGia` | String | Không | Tham chiếu logic `docgia.MaDocGia` | Mã độc giả liên quan, nếu có. |
| `TenDocGia` | String | Không | Không | Snapshot tên độc giả. |
| `MSNV` | String | Không | Tham chiếu logic `nhanvien.MSNV` | Mã nhân viên liên quan hoặc chịu trách nhiệm. |
| `TenNhanVien` | String | Không | Không | Snapshot tên nhân viên. |
| `LoaiTacNhan` | String | Không | Không | Loại tác nhân: `docgia`, `nhanvien` hoặc `hethong`. |
| `MaTacNhan` | String | Không | Tham chiếu logic đến mã hồ sơ tác nhân | Mã của người/hệ thống thực hiện. |
| `TenTacNhan` | String | Không | Không | Tên snapshot của tác nhân. |
| `ChiTiet` | Object | Không | Không | Chi tiết trạng thái hoặc dữ liệu thay đổi, nếu có. |
| `ThoiGian` | Date | Không | Không | Thời điểm sự kiện. |

### 2.4.3. Thông báo (`thongbao`)

Lưu thông báo nghiệp vụ theo từng độc giả hoặc nhân viên nhận.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ thông báo. |
| `NguoiNhanId` | ObjectId | Không | Tham chiếu `_id` của `docgia` hoặc `nhanvien` | Định danh document người nhận. |
| `LoaiNguoiNhan` | String | Không | Phân biệt collection được tham chiếu | `docgia` hoặc `nhanvien`. |
| `LoaiThongBao` | String | Không | Không | Mã loại thông báo. |
| `TieuDe` | String | Không | Không | Tiêu đề thông báo. |
| `NoiDung` | String | Không | Không | Nội dung thông báo. |
| `MaThamChieu` | String | Không | Tham chiếu logic, tùy loại thông báo | Mã phiếu/sách/đối tượng liên quan, nếu có. |
| `DaDoc` | Boolean | Không | Không | Trạng thái đã đọc; mặc định `false`. |
| `ThoiGian` | Date | Không | Không | Thời điểm tạo thông báo. |

### 2.4.4. Thu hồi JWT (`jwt_revocations`)

Lưu dấu vết token bị thu hồi, không lưu JWT gốc.

| Thuộc tính | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả |
|---|---|---|---|---|
| `_id` | ObjectId | Có | Không | Định danh nội bộ do MongoDB tạo. |
| `tokenHash` | String | Không; dùng làm khóa tra cứu | Không | Hash SHA-256 của JWT đã thu hồi. |
| `expiresAt` | Date | Không | Không | Hạn token; TTL index tự dọn document sau thời điểm này. |

## 2.5. Quan hệ tham chiếu giữa các lớp

| Collection chứa tham chiếu | Thuộc tính tham chiếu | Collection được tham chiếu | Thuộc tính đích | Ý nghĩa |
|---|---|---|---|---|
| `theodoimuonsach` | `MaDocGia` | `docgia` | `MaDocGia` | Mỗi phiếu thuộc một độc giả; một độc giả có thể có nhiều phiếu. |
| `theodoimuonsach` | `MaSach` | `sach` | `MaSach` | Mỗi phiếu gắn với một đầu sách; một đầu sách có thể nằm trong nhiều phiếu theo thời gian. |
| `theodoimuonsach` | `MSNV` | `nhanvien` | `MSNV` | Nhân viên xử lý phiếu, nếu đã được ghi nhận. |
| `sach` | `MaNXB` | `nhaxuatban` | `MaNXB` | Nhà xuất bản của sách. |
| `sach` | `MaTheLoai` | `theloai` | `MaTheLoai` | Thể loại chính của sách. |
| `nhanvien` | `MaYeuCauDangKy` | `yeucaunhanvien` | `_id` (chuỗi) | Hồ sơ đăng ký đã sinh tài khoản nhân viên, nếu có. |
| `yeucaunhanvien` | `MSNV` | `nhanvien` | `MSNV` | Tài khoản nhân viên được tạo khi hồ sơ được duyệt. |
| `thongbao` | `NguoiNhanId` + `LoaiNguoiNhan` | `docgia` hoặc `nhanvien` | `_id` | Xác định hồ sơ nhận thông báo. |

Các quan hệ trên là tham chiếu logic do backend kiểm tra. `_id` vẫn là khóa chính của từng document; mã nghiệp vụ là mã duy nhất và được dùng để liên kết các collection nghiệp vụ.
