const app = require("./app");
const config = require("./app/config");
const MongoDB = require("./app/utils/mongodb.util");
const TheLoaiService = require("./app/services/theloai.service");
const { migrateLegacyRoles } = require("./app/utils/role-migration.util");
const TheoDoiMuonSachService = require("./app/services/theodoimuonsach.service");

async function startServer() {
    try {
        console.log("Đang khởi tạo kết nối cơ sở dữ liệu MongoDB...");
        await MongoDB.connect(config.db.uri);
        console.log(`-> Kết nối CSDL thành công tại: ${config.db.uri}`);
        const roleMigration = await migrateLegacyRoles(MongoDB.client.db());
        if (roleMigration.staff || roleMigration.readers) {
            console.log(`-> Chuẩn hóa vai trò: ${roleMigration.staff} nhân viên và ${roleMigration.readers} độc giả.`);
        }
        await MongoDB.client.db().collection("jwt_revocations").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        const genres = new TheLoaiService(MongoDB.client);
        await genres.ensureDefaults();
        await MongoDB.client.db().collection("theloai").createIndex({ MaTheLoai: 1 }, { unique: true });
        const auditLogs = MongoDB.client.db().collection("nhatkykiemtoan");
        await Promise.all([
            auditLogs.createIndex({ ThoiGian: -1, _id: -1 }),
            auditLogs.createIndex({ MaSach: 1, ThoiGian: -1 }),
            auditLogs.createIndex({ MaDocGia: 1, ThoiGian: -1 }),
            auditLogs.createIndex({ MSNV: 1, ThoiGian: -1 }),
        ]);
        const notifications = MongoDB.client.db().collection("thongbao");
        await Promise.all([
            notifications.createIndex({ LoaiNguoiNhan: 1, NguoiNhanId: 1, ThoiGian: -1 }),
            notifications.createIndex({ LoaiNguoiNhan: 1, NguoiNhanId: 1, DaDoc: 1 }),
        ]);

        const borrowService = new TheoDoiMuonSachService(MongoDB.client);
        await borrowService.migrateLegacyPendingRecords();
        await borrowService.expirePickupReservations();
        const pickupExpiryTimer = setInterval(() => {
            borrowService.expirePickupReservations().catch((error) => console.error("Lỗi xử lý phiếu quá hạn nhận:", error));
        }, 60 * 1000);

        const PORT = config.app.port;
        const server = app.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(`Máy chủ Backend đang lắng nghe tại: http://localhost:${PORT}`);
            console.log(`Hệ thống Quản Lý Mượn Sách Thư Viện (CT449 - ĐH Cần Thơ)`);
            console.log(`====================================================`);
        });

        // Xử lý dừng máy chủ an toàn (Graceful Shutdown)
        const handleShutdown = async (signal) => {
            console.log(`\nNhận tín hiệu ${signal}. Đang đóng các kết nối an toàn...`);
            clearInterval(pickupExpiryTimer);
            server.close(async () => {
                if (MongoDB.client) {
                    await MongoDB.client.close();
                    console.log("-> Đã đóng kết nối MongoDB.");
                }
                process.exit(0);
            });
        };

        process.on("SIGINT", () => handleShutdown("SIGINT"));
        process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    } catch (error) {
        console.error("Không thể kết nối đến cơ sở dữ liệu MongoDB!", error);
        process.exit(1);
    }
}

startServer();
