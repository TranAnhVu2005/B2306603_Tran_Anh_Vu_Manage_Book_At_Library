const MongoDB = require("./app/utils/mongodb.util");
const config = require("./app/config");

async function seedData() {
    try {
        console.log("Đang kết nối MongoDB để khởi tạo dữ liệu mẫu...");
        const client = await MongoDB.connect(config.db.uri);
        const db = client.db();

        // Xóa sạch dữ liệu cũ để reset chuẩn
        await db.collection("nhaxuatban").deleteMany({});
        await db.collection("sach").deleteMany({});
        await db.collection("docgia").deleteMany({});
        await db.collection("nhanvien").deleteMany({});
        await db.collection("theodoimuonsach").deleteMany({});

        console.log("-> Đã dọn dẹp các collection cũ.");

        // 1. Seed Nhà xuất bản (mã chuẩn hóa: NXB-0001, NXB-0002,...)
        const nxbList = [
            { MaNXB: "NXB-0001", TenNXB: "NXB Giáo Dục", DiaChi: "81 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội" },
            { MaNXB: "NXB-0002", TenNXB: "NXB Trẻ", DiaChi: "161B Lý Chính Thắng, Quận 3, TP.HCM" },
            { MaNXB: "NXB-0003", TenNXB: "NXB Khoa Học Kỹ Thuật", DiaChi: "70 Trần Hưng Đạo, Hà Nội" },
            { MaNXB: "NXB-0004", TenNXB: "NXB Tri Thức", DiaChi: "53 Nguyễn Du, Hai Bà Trưng, Hà Nội" },
            { MaNXB: "NXB-0005", TenNXB: "NXB Lao Động", DiaChi: "175 Giảng Võ, Đống Đa, Hà Nội" },
        ];
        await db.collection("nhaxuatban").insertMany(nxbList);
        console.log(`-> Đã thêm ${nxbList.length} Nhà xuất bản.`);

        // 2. Seed Kho Sách (mã chuẩn hóa: SACH-000001, SACH-000002,...)
        const bookList = [
            {
                MaSach: "SACH-000001",
                TenSach: "Lập trình Web với Vue.js 3 và Node.js",
                DonGia: 85000,
                SoQuyen: 5,
                NamXuatBan: 2024,
                MaNXB: "NXB-0001",
                NguonGoc: "Việt Nam",
                TacGia: "Nguyễn Văn An",
                HinhAnh: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80",
                MoTa: "Giáo trình toàn diện về kiến trúc Full-Stack Web hiện đại, xây dựng RESTful API và Single Page Application."
            },
            {
                MaSach: "SACH-000002",
                TenSach: "Cấu Trúc Dữ Liệu & Giải Thuật Ứng Dụng",
                DonGia: 120000,
                SoQuyen: 1,
                NamXuatBan: 2023,
                MaNXB: "NXB-0003",
                NguonGoc: "Việt Nam",
                TacGia: "Trần Minh Quân",
                HinhAnh: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
                MoTa: "Phân tích độ phức tạp thuật toán, giải thuật đồ thị, cây nhị phân và ứng dụng trong tối ưu hóa hệ thống."
            },
            {
                MaSach: "SACH-000003",
                TenSach: "Trí Tuệ Nhân Tạo & Học Sâu Nâng Cao",
                DonGia: 200000,
                SoQuyen: 0,
                NamXuatBan: 2024,
                MaNXB: "NXB-0003",
                NguonGoc: "Mỹ (Dịch thuật)",
                TacGia: "Ian Goodfellow & Yoshua Bengio",
                HinhAnh: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
                MoTa: "Giới thiệu mạng nơ-ron tích chập (CNN), mạng hồi quy (RNN) và các mô hình sinh thế hệ mới."
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
                MoTa: "Khảo cứu lịch sử triết học, tư tưởng chính trị và nghệ thuật phương Đông và phương Tây qua 40 thế kỷ."
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
                MoTa: "Nguyên lý xây dựng hệ thống dữ liệu chịu tải cao, đồng bộ phân tán, xử lý giao dịch ACID và phân vùng dữ liệu."
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
                MoTa: "Chiến lược chuyển đổi số doanh nghiệp, mô hình kinh tế nền tảng và quản trị nguồn vốn thông minh."
            }
        ];
        await db.collection("sach").insertMany(bookList);
        console.log(`-> Đã thêm ${bookList.length} Đầu sách.`);

        // 3. Seed Nhân viên & Admin (mã chuẩn hóa: NV-0001, NV-0002,...)
        // Lưu ý: Tài khoản Admin dùng mã ADMIN (ngoài quy ước auto-gen) để cố định cho môi trường demo
        const staffList = [
            {
                MSNV: "NV-0001",
                HoTenNV: "Nguyễn Quản Trị Viên",
                Password: "admin123",
                ChucVu: "ADMIN",
                DiaChi: "Khu II ĐH Cần Thơ, Đường 3/2, Cần Thơ",
                SoDienThoai: "0901234567"
            },
            {
                MSNV: "NV-0002",
                HoTenNV: "Lê Thị Thu Thư",
                Password: "staff123",
                ChucVu: "THUTHU",
                DiaChi: "Ninh Kiều, Cần Thơ",
                SoDienThoai: "0907654321"
            }
        ];
        await db.collection("nhanvien").insertMany(staffList);
        console.log(`-> Đã thêm ${staffList.length} Nhân viên.`);

        // 4. Seed Độc giả (mã chuẩn hóa: DG-000001, DG-000002,...)
        const readerList = [
            {
                MaDocGia: "DG-000001",
                HoLot: "Trần Minh",
                Ten: "Triết",
                NgaySinh: "2003-09-15",
                Phai: "Nam",
                DiaChi: "Xuân Khánh, Ninh Kiều, Cần Thơ",
                DienThoai: "0912345678",
                Password: "123456",
                Role: "USER",
                SoLanViPham: 0,
                TrangThaiThe: "HoatDong"
            },
            {
                MaDocGia: "DG-000002",
                HoLot: "Phạm Vi",
                Ten: "Phạm",
                NgaySinh: "2002-04-10",
                Phai: "Nam",
                DiaChi: "An Khánh, Ninh Kiều, Cần Thơ",
                DienThoai: "0987654321",
                Password: "123456",
                Role: "USER",
                SoLanViPham: 3,
                TrangThaiThe: "Blacklist"
            },
            {
                MaDocGia: "DG-000003",
                HoLot: "Nguyễn Hải",
                Ten: "Yến",
                NgaySinh: "2004-11-20",
                Phai: "Nữ",
                DiaChi: "Cái Răng, Cần Thơ",
                DienThoai: "0939112233",
                Password: "123456",
                Role: "USER",
                SoLanViPham: 1,
                TrangThaiThe: "HoatDong"
            }
        ];
        await db.collection("docgia").insertMany(readerList);
        console.log(`-> Đã thêm ${readerList.length} Độc giả.`);

        // 5. Seed Phiếu mượn mẫu
        const todayStr = new Date().toISOString().split("T")[0];
        const borrowList = [
            {
                MaDocGia: "DG-000001",
                MaSach: "SACH-000004",
                NgayMuon: todayStr,
                NgayHenTra: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
                NgayTra: null,
                TrangThai: "DangMuon",
                TienPhat: 0,
                GhiChu: "Sách bìa cứng, còn mới",
                CreatedAt: new Date(Date.now() - 2 * 86400000)
            },
            {
                MaDocGia: "DG-000003",
                MaSach: "SACH-000001",
                NgayMuon: todayStr,
                NgayHenTra: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
                NgayTra: null,
                TrangThai: "ChoDuyet",
                TienPhat: 0,
                GhiChu: "Độc giả đăng ký trực tuyến",
                CreatedAt: new Date()
            },
            {
                MaDocGia: "DG-000001",
                MaSach: "SACH-000005",
                NgayMuon: "2026-09-10",
                NgayHenTra: "2026-09-24",
                NgayTra: "2026-09-22",
                TrangThai: "DaTra",
                TienPhat: 0,
                GhiChu: "Đã hoàn trả đúng hạn",
                CreatedAt: new Date(Date.now() - 30 * 86400000)
            }
        ];
        await db.collection("theodoimuonsach").insertMany(borrowList);
        console.log(`-> Đã thêm ${borrowList.length} Phiếu mượn mẫu.`);

        console.log("Khởi tạo dữ liệu thành công 100%!");
        console.log("\nTài khoản đăng nhập Demo:");
        console.log("  [Admin]    MSNV: NV-0001   | Pass: admin123");
        console.log("  [Thủ thư]  MSNV: NV-0002   | Pass: staff123");
        console.log("  [Độc giả]  SDT:  0912345678 | Pass: 123456 (DG-000001 - Bình thường)");
        console.log("  [Độc giả]  SDT:  0987654321 | Pass: 123456 (DG-000002 - Blacklist)");
        process.exit(0);
    } catch (error) {
        console.error("Lỗi khi seed dữ liệu:", error);
        process.exit(1);
    }
}

seedData();
