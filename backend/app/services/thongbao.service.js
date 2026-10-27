const { ObjectId } = require("mongodb");

const notificationFields = {
    _id: 1,
    LoaiNguoiNhan: 1,
    MaNguoiNhan: 1,
    LoaiThongBao: 1,
    TieuDe: 1,
    NoiDung: 1,
    MaThamChieu: 1,
    DaDoc: 1,
    ThoiGian: 1,
};

class ThongBaoService {
    constructor(client) {
        this.ThongBao = client.db().collection("thongbao");
    }

    async create({ recipientCode, recipientType, type, title, message, reference }) {
        const code = String(recipientCode || "").trim();
        if (!code || !["docgia", "nhanvien"].includes(recipientType)) return null;

        const notification = {
            MaNguoiNhan: code,
            LoaiNguoiNhan: recipientType,
            LoaiThongBao: String(type).slice(0, 40),
            TieuDe: String(title).trim().slice(0, 120),
            NoiDung: String(message).trim().slice(0, 1000),
            DaDoc: false,
            ThoiGian: new Date(),
        };
        if (reference) notification.MaThamChieu = String(reference).slice(0, 80);

        const result = await this.ThongBao.insertOne(notification);
        return { ...notification, _id: result.insertedId };
    }

    async createSafely(payload) {
        try {
            return await this.create(payload);
        } catch (error) {
            // Notification persistence must not turn an already completed business action into an API error.
            console.error("Không thể lưu thông báo người dùng.", error);
            return null;
        }
    }

    async findForRecipient(recipientCode, recipientType, requestedLimit = 10) {
        const code = String(recipientCode || "").trim();
        if (!code || !["docgia", "nhanvien"].includes(recipientType)) return { data: [], unreadCount: 0 };
        const numericLimit = Number(requestedLimit);
        const limit = Number.isInteger(numericLimit) ? Math.min(Math.max(numericLimit, 1), 50) : 10;
        const filter = { MaNguoiNhan: code, LoaiNguoiNhan: recipientType };
        const [data, unreadCount] = await Promise.all([
            this.ThongBao.find(filter, { projection: notificationFields }).sort({ ThoiGian: -1, _id: -1 }).limit(limit).toArray(),
            this.ThongBao.countDocuments({ ...filter, DaDoc: false }),
        ]);
        return { data, unreadCount };
    }

    async markRead(id, recipientCode, recipientType) {
        const code = String(recipientCode || "").trim();
        if (!ObjectId.isValid(id) || !code || !["docgia", "nhanvien"].includes(recipientType)) return false;
        const result = await this.ThongBao.updateOne(
            { _id: new ObjectId(id), MaNguoiNhan: code, LoaiNguoiNhan: recipientType },
            { $set: { DaDoc: true } }
        );
        return result.matchedCount > 0;
    }

    async markAllRead(recipientCode, recipientType) {
        const code = String(recipientCode || "").trim();
        if (!code || !["docgia", "nhanvien"].includes(recipientType)) return 0;
        const result = await this.ThongBao.updateMany(
            { MaNguoiNhan: code, LoaiNguoiNhan: recipientType, DaDoc: false },
            { $set: { DaDoc: true } }
        );
        return result.modifiedCount;
    }
}

module.exports = ThongBaoService;
