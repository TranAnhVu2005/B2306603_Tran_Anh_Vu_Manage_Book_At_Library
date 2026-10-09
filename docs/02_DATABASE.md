# 02. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

* **Database**: MongoDB
* **Database Name**: `quanlymuonsach`
* **Quy chuẩn**: Giữ nguyên 100% các trường theo lược đồ tối thiểu CT449 và bổ sung các trường nghiệp vụ thực tế (Role, Trạng thái đơn mượn, Vi phạm, Blacklist).

---

## 1. Danh Sách Collections

* `nhaxuatban`: Danh mục nhà xuất bản sách
* `sach`: Kho sách và chi tiết từng đầu sách
* `docgia`: Hồ sơ độc giả (kèm theo dõi vi phạm & trạng thái khóa thẻ)
* `theodoimuonsach`: Giao dịch mượn/trả (kèm trạng thái duyệt đơn, ngày hẹn trả, sự cố mất sách)
* `nhanvien`: Tài khoản nhân viên/quản trị viên (có phân quyền Admin / Thủ thư)

---

## 2. Chi Tiết Cấu Trúc Schema

### 2.1. Collection: `nhaxuatban`
```json
{
  "_id": "ObjectId",
  "MaNXB": "NXB01",           // [Bắt buộc, Duy nhất]
  "TenNXB": "NXB Trẻ",        // [Bắt buộc]
  "DiaChi": "161B Lý Chính Thắng, Q3, TP.HCM"
}
```

---

### 2.2. Collection: `sach`
```json
{
  "_id": "ObjectId",
  "MaSach": "S001",                   // [Bắt buộc, Duy nhất]
  "TenSach": "Lập trình Web với Vue", // [Bắt buộc]
  "DonGia": 85000,                    // [Bắt buộc, Số >= 0] Đơn giá bồi thường nếu làm mất
  "SoQuyen": 10,                      // [Bắt buộc, Số >= 0] Số lượng sách còn trong kho
  "NamXuatBan": 2024,                 // Năm xuất bản
  "MaNXB": "NXB01",                   // [Tham chiếu MaNXB]
  "TacGia": "Nguyễn Văn A",           // Tác giả / Nguồn gốc
  "HinhAnh": "/images/books/s001.jpg",// Ảnh bìa sách
  "MoTa": "Sách hướng dẫn..."
}
```

---

### 2.3. Collection: `docgia`
Lưu trữ thông tin người dùng và lịch sử vi phạm để đưa vào danh sách đen.

```json
{
  "_id": "ObjectId",
  "MaDocGia": "DG001",                // [Bắt buộc, Duy nhất]
  "HoLot": "Trần Nguyễn",
  "Ten": "An",
  "NgaySinh": "2003-05-15",
  "Phai": "Nam",
  "DiaChi": "Ninh Kiều, Cần Thơ",
  "DienThoai": "0912345678",          // [Bắt buộc, Duy nhất]
  "Password": "hashed_password",
  "Role": "USER",                     // [USER | MANAGER | ADMIN] Phân quyền
  "SoLanViPham": 0,                   // Đếm số lần quá hạn hoặc vi phạm quy định
  "TrangThaiThe": "HoatDong"          // ["HoatDong" | "Khoa" | "Blacklist"]
}
```

* **Quy tắc Blacklist**: Nếu `SoLanViPham >= 3`, hệ thống tự động hoặc quản lý cập nhật `TrangThaiThe = "Blacklist"` và từ chối mọi yêu cầu mượn sách.

---

### 2.4. Collection: `theodoimuonsach`
Theo dõi quy trình từ lúc độc giả gửi yêu cầu mượn đến khi trả hoặc báo mất.

```json
{
  "_id": "ObjectId",
  "MaDocGia": "DG001",                // [Tham chiếu MaDocGia]
  "MaSach": "S001",                   // [Tham chiếu MaSach]
  "NgayMuon": "2026-10-09",           // Ngày bắt đầu mượn (hoặc ngày nộp đơn)
  "NgayHenTra": "2026-10-23",         // Hạn trả dự kiến (mặc định 14 ngày)
  "NgayTra": null,                    // Ngày trả thực tế (null nếu chưa trả)
  "TrangThai": "ChoDuyet",            // ["ChoDuyet" | "DangMuon" | "DaTra" | "MatSach" | "TuChoi"]
  "TienPhat": 0,                      // Tiền phạt quá hạn hoặc tiền đền bù mất sách
  "GhiChu": "Sách bị mất trang hoặc tình trạng mượn"
}
```

---

### 2.5. Collection: `nhanvien`
Lưu tài khoản nhân viên thư viện và Admin tối cao.

```json
{
  "_id": "ObjectId",
  "MSNV": "NV01",                     // [Bắt buộc, Duy nhất]
  "HoTenNV": "Lê Văn Quản",
  "Password": "hashed_password",
  "ChucVu": "ADMIN",                  // ["THUTHU" | "ADMIN"]
  "DiaChi": "Ninh Kiều, Cần Thơ",
  "SoDienThoai": "0987654321"
}
```
