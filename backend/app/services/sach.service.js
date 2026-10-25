const { ObjectId } = require("mongodb");
const AuditLogService = require("./audit-log.service");

const publicFields = {
    _id: 1,
    MaSach: 1,
    TenSach: 1,
    DonGia: 1,
    SoQuyen: 1,
    NamXuatBan: 1,
    MaNXB: 1,
    MaTheLoai: 1,
    TacGia: 1,
    HinhAnh: 1,
    MoTa: 1,
};

/**
 * =========================================================================================
 * SERVICE QUẢN LÝ KHO SÁCH (SACH SERVICE)
 * =========================================================================================
 * Căn cứ thiết kế Cơ sở dữ liệu Báo cáo CT449 (Mục 2.4, Trang 24-25):
 * - Collection: 'sach'
 * - Cấu trúc trường:
 *   + _id: ObjectId
 *   + MaSach: String (Mã định danh đầu sách, tự sinh SACH-000001)
 *   + TenSach: String (Tên tựa sách)
 *   + DonGia: Double (Đơn giá sách - Dùng tính tiền phạt nếu làm mất)
 *   + SoQuyen: Integer (Số lượng sách thực tế còn trong kho)
 *   + NamXuatBan: Integer (Năm xuất bản sách)
 *   + MaNXB: String (Tham chiếu đến nhaxuatban.MaNXB)
 *   + MaTheLoai: String (Tham chiếu đến theloai.MaTheLoai)
 *   + TacGia: String (Tên tác giả hoặc cơ quan biên soạn)
 *   + HinhAnh: String (Đường dẫn ảnh bìa sách)
 *   + MoTa: String (Tóm tắt nội dung sách)
 * =========================================================================================
 */
class SachService {
    constructor(client) {
        this.Sach = client.db().collection("sach");
        this.NhaXuatBan = client.db().collection("nhaxuatban");
        this.TheLoai = client.db().collection("theloai");
        this.TheoDoi = client.db().collection("theodoimuonsach");
        this.AuditLog = new AuditLogService(client);
    }

    // Sinh mã sách tự động - Completed
    async generateMaSach() {
        const last = await this.Sach.find(
            { MaSach: { $regex: /^SACH-\d{6}$/ } },
            { projection: { MaSach: 1 } }
        ).sort({ MaSach: -1 }).limit(1).toArray();

        let nextNum = 1;
        if (last.length > 0) {
            const lastNum = parseInt(last[0].MaSach.replace("SACH-", ""), 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        return `SACH-${String(nextNum).padStart(6, "0")}`;
    }

    // Chuẩn hóa dữ liệu đầu vào - Completed
    extractData(payload, isCreating = false) {
        const data = {};

        if (payload.TenSach !== undefined) data.TenSach = String(payload.TenSach).trim();
        if (payload.DonGia !== undefined) data.DonGia = Number(payload.DonGia);
        if (payload.SoQuyen !== undefined) data.SoQuyen = parseInt(payload.SoQuyen, 10);
        if (payload.NamXuatBan !== undefined) data.NamXuatBan = parseInt(payload.NamXuatBan, 10);
        if (payload.MaNXB !== undefined) data.MaNXB = String(payload.MaNXB).trim();
        if (payload.MaTheLoai !== undefined) {
            if (typeof payload.MaTheLoai !== "string") throw new Error("Mã thể loại phải là chuỗi hợp lệ.");
            data.MaTheLoai = payload.MaTheLoai.trim();
        }
        if (payload.TacGia !== undefined) data.TacGia = String(payload.TacGia).trim();
        if (payload.HinhAnh !== undefined) data.HinhAnh = String(payload.HinhAnh).trim();
        if (payload.MoTa !== undefined) data.MoTa = String(payload.MoTa).trim();
        if (payload.NguonGoc !== undefined) data.NguonGoc = String(payload.NguonGoc).trim();

        if (isCreating) {
            if (data.HinhAnh === undefined) data.HinhAnh = "";
            if (data.MoTa === undefined) data.MoTa = "";
            if (data.NguonGoc === undefined) {
                data.NguonGoc = payload.NguonGoc ? String(payload.NguonGoc).trim() : "Không rõ";
            }
            if (payload.NamXuatBan !== undefined) {
                // Nếu người dùng để trống hoặc truyền giá trị rỗng, gán là "Không rõ"
                data.NamXuatBan = payload.NamXuatBan ? String(payload.NamXuatBan).trim() : "Không rõ";
            }
        }
        return data;
    }

    // Thêm sách mới - Completed
    async create(payload, actor = {}) {
        const data = this.extractData(payload, true);

        if (!data.TenSach || data.DonGia === undefined || data.SoQuyen === undefined || !data.MaNXB || !data.TacGia || !data.MaTheLoai) {
            throw new Error("Vui lòng điền đầy đủ các thông tin: Tên sách, Đơn giá, Số quyển, NXB, thể loại và tác giả.");
        }

        if (isNaN(data.DonGia) || data.DonGia < 0) {
            throw new Error("Đơn giá sách phải là số dương hoặc bằng 0.");
        }

        if (isNaN(data.SoQuyen) || data.SoQuyen < 0) {
            throw new Error("Số lượng sách tồn kho phải là số nguyên không âm (>= 0).");
        }

        // Kiểm tra tồn tại Nhà xuất bản
        const nxb = await this.NhaXuatBan.findOne({ MaNXB: data.MaNXB });
        if (!nxb) {
            throw new Error(`Nhà xuất bản có mã '${data.MaNXB}' không tồn tại trong hệ thống.`);
        }
        if (!await this.TheLoai.findOne({ MaTheLoai: data.MaTheLoai }, { projection: { _id: 1 } })) {
            throw new Error(`Thể loại có mã '${data.MaTheLoai}' không tồn tại trong danh mục.`);
        }

        data.MaSach = await this.generateMaSach();
        data.deleted = false;
        data.CreatedAt = new Date();
        data.UpdatedAt = new Date();

        const result = await this.Sach.insertOne(data);
        await this.AuditLog.record({
            action: "BOOK_CREATED", entityType: "book", entityId: data.MaSach,
            MaSach: data.MaSach, TenSach: data.TenSach,
            actorType: actor.type, actorId: actor.username,
            Details: { createdFields: Object.keys(data).filter((field) => !["_id", "CreatedAt", "UpdatedAt", "deleted"].includes(field)) },
        });
        return await this.findById(result.insertedId);
    }

    // Tìm kiếm sách, bộ lọc và sắp xếp - Completed
    async find(filter = {}) {
        const includeDeleted = filter.includeDeleted === "true";
        const query = includeDeleted ? { deleted: true } : { deleted: { $ne: true } };
        if (filter.tenSach) {
            query.TenSach = { $regex: new RegExp(filter.tenSach, "i") };
        }
        if (filter.tacGia) {
            query.TacGia = { $regex: new RegExp(filter.tacGia, "i") };
        }
        if (filter.maNxb && filter.maNxb !== "all") {
            query.MaNXB = filter.maNxb;
        }
        if (filter.maTheLoai && filter.maTheLoai !== "all") {
            query.MaTheLoai = String(filter.maTheLoai);
        }
        if (filter.availableOnly === "true" || filter.availableOnly === true) {
            query.SoQuyen = { $gt: 0 };
        }
        if (filter.search) {
            const regex = { $regex: new RegExp(filter.search, "i") };
            query.$or = [{ TenSach: regex }, { TacGia: regex }, { MaSach: regex }];
        }

        const projection = includeDeleted ? { ...publicFields, deleted: 1, DeletedAt: 1, DeletedBy: 1 } : publicFields;
        const cursor = await this.Sach.find(query, { projection }).sort({ CreatedAt: -1, _id: -1 });
        return await cursor.toArray();
    }

    // Lấy chi tiết 1 quyển sách - Completed
    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MaSach: id }] };
        } else {
            query = { MaSach: id };
        }
        return await this.Sach.findOne({ ...query, deleted: { $ne: true } }, { projection: publicFields });
    }

    // Cập nhật thông tin sách - Completed
    async update(id, payload, actor = {}) {
        const data = this.extractData(payload, false);
        delete data.MaSach; // Không sửa MaSach

        if (data.DonGia !== undefined && (isNaN(data.DonGia) || data.DonGia < 0)) {
            throw new Error("Đơn giá không được âm.");
        }
        if (data.SoQuyen !== undefined && (isNaN(data.SoQuyen) || data.SoQuyen < 0)) {
            throw new Error("Số quyển tồn kho không được âm.");
        }

        if (data.MaNXB) {
            const nxb = await this.NhaXuatBan.findOne({ MaNXB: data.MaNXB });
            if (!nxb) {
                throw new Error(`Nhà xuất bản có mã '${data.MaNXB}' không tồn tại.`);
            }
        }
        if (data.MaTheLoai && !await this.TheLoai.findOne({ MaTheLoai: data.MaTheLoai }, { projection: { _id: 1 } })) {
            throw new Error(`Thể loại có mã '${data.MaTheLoai}' không tồn tại trong danh mục.`);
        }

        data.UpdatedAt = new Date();

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaSach: id }] };
        } else {
            filter = { MaSach: id };
        }

        const current = await this.Sach.findOne({ ...filter, deleted: { $ne: true } });
        if (!current) return null;
        const changes = {};
        for (const [key, value] of Object.entries(data)) {
            if (key === "UpdatedAt" || JSON.stringify(current[key]) === JSON.stringify(value)) continue;
            changes[key] = { from: current[key] ?? null, to: value };
        }

        const result = await this.Sach.findOneAndUpdate(
            { _id: current._id, deleted: { $ne: true } },
            { $set: data },
            { returnDocument: "after" }
        );
        if (result && Object.keys(changes).length) {
            await this.AuditLog.record({
                action: "BOOK_UPDATED", entityType: "book", entityId: current.MaSach,
                MaSach: current.MaSach, TenSach: result.TenSach,
                actorType: actor.type, actorId: actor.username, Details: { changes },
            });
        }
        return result ? this.findById(id) : null;
    }

    // Xóa sách có ràng buộc không xóa nếu sách đang có người mượn - Completed
    async delete(id, actor = {}) {
        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaSach: id }] };
        } else {
            filter = { MaSach: id };
        }

        const current = await this.Sach.findOne({ ...filter, deleted: { $ne: true } });
        if (!current) return null;

        // Ràng buộc toàn vẹn: Không xóa nếu sách đang có người mượn hoặc chờ duyệt
        const borrowingCount = await this.TheoDoi.countDocuments({
            MaSach: current.MaSach,
            TrangThai: { $in: ["DangMuon", "ChoDuyet", "ChoNhan"] }
        });

        if (borrowingCount > 0) {
            throw new Error(`Không thể xóa cuốn sách '${current.TenSach}' vì đang có ${borrowingCount} phiếu mượn dở dang.`);
        }

        const deletedAt = new Date();
        const result = await this.Sach.updateOne(
            { _id: current._id, deleted: { $ne: true } },
            { $set: { deleted: true, DeletedAt: deletedAt, DeletedBy: String(actor.username || ""), UpdatedAt: deletedAt } }
        );
        if (!result.modifiedCount) return null;
        await this.AuditLog.record({
            action: "BOOK_SOFT_DELETED", entityType: "book", entityId: current.MaSach,
            MaSach: current.MaSach, TenSach: current.TenSach,
            actorType: actor.type, actorId: actor.username,
        });
        return { MaSach: current.MaSach };
    }

    async restore(id, actor = {}) {
        const filter = ObjectId.isValid(id)
            ? { $or: [{ _id: new ObjectId(id) }, { MaSach: id }], deleted: true }
            : { MaSach: id, deleted: true };
        const current = await this.Sach.findOne(filter);
        if (!current) return null;

        const restoredAt = new Date();
        const result = await this.Sach.updateOne(
            { _id: current._id, deleted: true },
            { $set: { deleted: false, UpdatedAt: restoredAt }, $unset: { DeletedAt: "", DeletedBy: "" } }
        );
        if (!result.modifiedCount) return null;
        await this.AuditLog.record({
            action: "BOOK_RESTORED", entityType: "book", entityId: current.MaSach,
            MaSach: current.MaSach, TenSach: current.TenSach,
            actorType: actor.type, actorId: actor.username,
        });
        return { MaSach: current.MaSach };
    }

    // Cập nhật số quyển - Completed !!! Chưa được gọi ở bất kỳ đâu
    async changeSoQuyen(maSach, soLuong) {
        return await this.Sach.findOneAndUpdate(
            { MaSach: maSach },
            { $inc: { SoQuyen: soLuong }, $set: { UpdatedAt: new Date() } },
            { returnDocument: "after" }
        );
    }
}

module.exports = SachService;
