const MongoDB = require("./app/utils/mongodb.util");
const config = require("./app/config");
const PasswordUtil = require("./app/utils/password.util");

/**
 * =========================================================================================
 * SCRIPT KHỞI TẠO DỮ LIỆU MẪU CSDL CHUẨN BÁO CÁO CT449 (SEED DATA)
 * =========================================================================================
 * Khởi tạo 5 collections cốt lõi:
 * 1. nhaxuatban: MaNXB, TENNXB, DiaChi
 * 2. sach: MaSach, TenSach, DonGia, SoQuyen, NamXuatBan, MaNXB, TacGia, HinhAnh, MoTa
 * 3. docgia: MaDocGia, HoLot, Ten, NgaySinh, Phai (Integer: 1:Nam, 0:Nữ), DiaChi, DienThoai, MatKhau (Bcrypt), VaiTro, SoLanViPham, TrangThaiThe
 * 4. nhanvien: MSNV, HoTenNV, MatKhau (Bcrypt), ChucVu, SoDienThoai, DiaChi
 * 5. theodoimuonsach: MaDocGia, MaSach, NgayMuon, MSNV, NgayHenTra, NgayTra, TrangThai, GiaTriBoiThuong, GhiChu
 * =========================================================================================
 */
async function seedData() {
    try {
        console.log("---------------------------------------------------------------");
        console.log("Đang kết nối MongoDB để khởi tạo cơ sở dữ liệu mẫu...");
        const client = await MongoDB.connect(config.db.uri);
        const db = client.db();

        // 1. Dọn dẹp sạch dữ liệu cũ
        await db.collection("nhaxuatban").deleteMany({});
        await db.collection("sach").deleteMany({});
        await db.collection("docgia").deleteMany({});
        await db.collection("nhanvien").deleteMany({});
        await db.collection("theodoimuonsach").deleteMany({});

        console.log("-> Đã dọn dẹp sạch các collection cũ.");

        // 2. Seed Nhà Xuất Bản
        const nxbList = [
            {
                MaNXB: "NXB-0001",
                TENNXB: "NXB Giáo Dục Việt Nam",
                DiaChi: "81 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaNXB: "NXB-0002",
                TENNXB: "NXB Trẻ",
                DiaChi: "161B Lý Chính Thắng, Phường Võ Thị Sáu, Quận 3, TP.HCM",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaNXB: "NXB-0003",
                TENNXB: "NXB Khoa Học Kỹ Thuật",
                DiaChi: "70 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaNXB: "NXB-0004",
                TENNXB: "NXB Tri Thức",
                DiaChi: "53 Nguyễn Du, Hai Bà Trưng, Hà Nội",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaNXB: "NXB-0005",
                TENNXB: "NXB Lao Động",
                DiaChi: "175 Giảng Võ, Đống Đa, Hà Nội",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
        ];
        await db.collection("nhaxuatban").insertMany(nxbList);
        console.log(`-> Đã thêm ${nxbList.length} Nhà xuất bản.`);

        // 3. Seed Kho Sách
        const bookList = [
            {
                MaSach: "SACH-000001",
                TenSach: "Lập trình Web Hiện Đại với Vue.js 3 & Node.js",
                DonGia: 85000,
                SoQuyen: 5,
                NamXuatBan: 2024,
                MaNXB: "NXB-0001",
                NguonGoc: "Việt Nam",
                TacGia: "Nguyễn Văn An",
                HinhAnh: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80",
                MoTa: "Giáo trình toàn diện về kiến trúc Full-Stack MEVN hiện đại, xây dựng RESTful API và Single Page Application có hiệu năng cao.",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaSach: "SACH-000002",
                TenSach: "Cấu Trúc Dữ Liệu & Giải Thuật Ứng Dụng Nâng Cao",
                DonGia: 120000,
                SoQuyen: 1,
                NamXuatBan: 2023,
                MaNXB: "NXB-0003",
                NguonGoc: "Việt Nam",
                TacGia: "Trần Minh Quân",
                HinhAnh: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
                MoTa: "Phân tích độ phức tạp thuật toán, giải thuật đồ thị, cây nhị phân cân bằng và ứng dụng trong tối ưu hóa cơ sở dữ liệu.",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaSach: "SACH-000003",
                TenSach: "Trí Tuệ Nhân Tạo & Học Sâu Nâng Cao",
                DonGia: 200000,
                SoQuyen: 0, // Đang hết kho để kiểm thử chức năng chặn mượn
                NamXuatBan: 2024,
                MaNXB: "NXB-0003",
                NguonGoc: "Mỹ (Dịch thuật)",
                TacGia: "Ian Goodfellow & Yoshua Bengio",
                HinhAnh: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
                MoTa: "Giới thiệu mạng nơ-ron tích chập (CNN), mạng hồi quy (RNN) và các mô hình sinh thế hệ mới ứng dụng xử lý ngôn ngữ tự nhiên.",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaSach: "SACH-000004",
                TenSach: "Lịch Sử Văn Minh Thế Giới",
                DonGia: 250000,
                SoQuyen: 8,
                NamXuatBan: 2021,
                MaNXB: "NXB-0004",
                NguonGoc: "Mỹ (Dịch thuật)",
                TacGia: "Will Durant & Ariel Durant",
                HinhAnh: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&auto=format&fit=crop&q=80",
                MoTa: "Khảo cứu lịch sử triết học, tư tưởng chính trị và nghệ thuật phương Đông và phương Tây qua 40 thế kỷ văn minh nhân loại.",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaSach: "SACH-000005",
                TenSach: "Thiết Kế Hệ Thống Phân Tán Thực Chiến",
                DonGia: 175000,
                SoQuyen: 6,
                NamXuatBan: 2023,
                MaNXB: "NXB-0003",
                NguonGoc: "Anh (Dịch thuật)",
                TacGia: "Martin Kleppmann",
                HinhAnh: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
                MoTa: "Nguyên lý xây dựng hệ thống dữ liệu chịu tải cao, đồng bộ phân tán, xử lý giao dịch ACID và phân vùng dữ liệu mở rộng ngang.",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaSach: "SACH-000006",
                TenSach: "Tư Duy Kinh Tế Trong Kỷ Nguyên Số",
                DonGia: 145000,
                SoQuyen: 4,
                NamXuatBan: 2022,
                MaNXB: "NXB-0005",
                NguonGoc: "Việt Nam",
                TacGia: "Viện Nghiên Cứu Chiến Lược",
                HinhAnh: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80",
                MoTa: "Chiến lược chuyển đổi số doanh nghiệp, mô hình kinh tế nền tảng và quản trị nguồn vốn thông minh thời đại 4.0.",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            }
        ];
        await db.collection("sach").insertMany(bookList);
        console.log(`-> Đã thêm ${bookList.length} Đầu sách.`);

        // 4. Seed Nhân Viên & Quản Trị Viên (Mật khẩu mã hóa Bcrypt)
        const hashedAdminPass = await PasswordUtil.hash("admin123");
        const hashedStaffPass = await PasswordUtil.hash("staff123");

        const staffList = [
            {
                MSNV: "NV-0001",
                HoTenNV: "Nguyễn Quản Trị Viên",
                MatKhau: hashedAdminPass,
                Password: hashedAdminPass,
                ChucVu: "ADMIN",
                DiaChi: "Khu II ĐH Cần Thơ, Đường 3/2, Q. Ninh Kiều, Cần Thơ",
                SoDienThoai: "0901234567",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MSNV: "NV-0002",
                HoTenNV: "Lê Thị Thu Thư",
                MatKhau: hashedStaffPass,
                Password: hashedStaffPass,
                ChucVu: "STAFF",
                DiaChi: "Phường An Khánh, Q. Ninh Kiều, Cần Thơ",
                SoDienThoai: "0907654321",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            }
        ];
        await db.collection("nhanvien").insertMany(staffList);
        console.log(`-> Đã thêm ${staffList.length} Nhân viên (Mật khẩu đã mã hóa Bcrypt an toàn).`);

        // 5. Seed Độc Giả (Mật khẩu mã hóa Bcrypt, Phai là Integer)
        const hashedUserPass = await PasswordUtil.hash("123456");

        const readerList = [
            {
                MaDocGia: "DG-000001",
                HoLot: "Trần Minh",
                Ten: "Triết",
                NgaySinh: "2003-09-15",
                Phai: 1, // 1: Nam
                DiaChi: "Xuân Khánh, Ninh Kiều, Cần Thơ",
                DienThoai: "0912345678",
                MatKhau: hashedUserPass,
                Password: hashedUserPass,
                VaiTro: "USER",
                SoLanViPham: 0,
                TrangThaiThe: "HoatDong",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaDocGia: "DG-000002",
                HoLot: "Phạm Vi",
                Ten: "Phạm",
                NgaySinh: "2002-04-10",
                Phai: 1, // 1: Nam
                DiaChi: "An Khánh, Ninh Kiều, Cần Thơ",
                DienThoai: "0987654321",
                MatKhau: hashedUserPass,
                Password: hashedUserPass,
                VaiTro: "USER",
                SoLanViPham: 3,
                TrangThaiThe: "DanhSachDen", // Đã vi phạm 3 lần -> Danh sách đen
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaDocGia: "DG-000003",
                HoLot: "Nguyễn Hải",
                Ten: "Yến",
                NgaySinh: "2004-11-20",
                Phai: 0, // 0: Nữ
                DiaChi: "Hưng Phú, Cái Răng, Cần Thơ",
                DienThoai: "0939112233",
                MatKhau: hashedUserPass,
                Password: hashedUserPass,
                VaiTro: "USER",
                SoLanViPham: 1,
                TrangThaiThe: "HoatDong",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            }
        ];
        await db.collection("docgia").insertMany(readerList);
        console.log(`-> Đã thêm ${readerList.length} Độc giả (Phai: Integer, Mật khẩu Bcrypt).`);

        // 6. Seed Giao Dịch Theo Dõi Mượn Sách
        const todayStr = new Date().toISOString().split("T")[0];
        const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];

        const borrowList = [
            {
                MaDocGia: "DG-000001",
                MaSach: "SACH-000004",
                NgayMuon: todayStr,
                MSNV: "NV-0002",
                NgayHenTra: dueDate,
                NgayTra: null,
                TrangThai: "DangMuon",
                GiaTriBoiThuong: 0,
                GhiChu: "Sách bìa cứng, độc giả nhận tại quầy",
                CreatedAt: new Date(Date.now() - 2 * 86400000),
                UpdatedAt: new Date()
            },
            {
                MaDocGia: "DG-000003",
                MaSach: "SACH-000001",
                NgayMuon: todayStr,
                MSNV: null, // Chưa duyệt
                NgayHenTra: dueDate,
                NgayTra: null,
                TrangThai: "ChoDuyet",
                GiaTriBoiThuong: 0,
                GhiChu: "Độc giả đăng ký trực tuyến qua website",
                CreatedAt: new Date(),
                UpdatedAt: new Date()
            },
            {
                MaDocGia: "DG-000001",
                MaSach: "SACH-000005",
                NgayMuon: "2026-09-10",
                MSNV: "NV-0002",
                NgayHenTra: "2026-09-24",
                NgayTra: "2026-09-22",
                TrangThai: "DaTra",
                GiaTriBoiThuong: 0,
                GhiChu: "Đã hoàn trả đúng hạn, sách nguyên vẹn",
                CreatedAt: new Date(Date.now() - 30 * 86400000),
                UpdatedAt: new Date()
            }
        ];
        await db.collection("theodoimuonsach").insertMany(borrowList);
        console.log(`-> Đã thêm ${borrowList.length} Phiếu mượn mẫu (kèm MSNV, GiaTriBoiThuong).`);

        console.log("---------------------------------------------------------------");
        console.log("✅ KHỞI TẠO CƠ SỞ DỮ LIỆU THÀNH CÔNG 100%!");
        console.log("\nThông tin tài khoản kiểm thử hệ thống:");
        console.log("  👑 [Super Admin]  MSNV: NV-0001   | Pass: admin123");
        console.log("  📚 [Thủ thư]      MSNV: NV-0002   | Pass: staff123");
        console.log("  📖 [Độc giả BT]   SĐT:  0912345678 | Pass: 123456 (DG-000001 - Hoạt động)");
        console.log("  🚫 [Độc giả Phạt] SĐT:  0987654321 | Pass: 123456 (DG-000002 - Danh sách đen, vi phạm 3 lần)");
        console.log("---------------------------------------------------------------");
        process.exit(0);
    } catch (error) {
        console.error("Lỗi khi khởi tạo dữ liệu mẫu:", error);
        process.exit(1);
    }
}

seedData();
