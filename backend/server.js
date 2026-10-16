const app = require("./app");
const config = require("./app/config");
const MongoDB = require("./app/utils/mongodb.util");

async function startServer() {
    try {
        console.log("Đang khởi tạo kết nối cơ sở dữ liệu MongoDB...");
        await MongoDB.connect(config.db.uri);
        console.log(`-> Kết nối CSDL thành công tại: ${config.db.uri}`);

        const migration = await MongoDB.client.db()
            .collection("docgia")
            .updateMany(
                { TrangThaiThe: "Blacklist" },
                { $set: { TrangThaiThe: "DanhSachDen" } }
            );
        if (migration.modifiedCount > 0) {
            console.log(`-> Đã chuẩn hóa ${migration.modifiedCount} trạng thái thẻ cũ thành DanhSachDen.`);
        }

        const PORT = config.app.port;
        const server = app.listen(PORT, () => {
            console.log(`====================================================`);
            console.log(`🚀 Máy chủ Backend đang lắng nghe tại: http://localhost:${PORT}`);
            console.log(`📚 Hệ thống Quản Lý Mượn Sách Thư Viện (CT449 - ĐH Cần Thơ)`);
            console.log(`====================================================`);
        });

        // Xử lý dừng máy chủ an toàn (Graceful Shutdown)
        const handleShutdown = async (signal) => {
            console.log(`\nNhận tín hiệu ${signal}. Đang đóng các kết nối an toàn...`);
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