const { ObjectId } = require("mongodb");

const publicFields = {
    _id: 1,
    MaNXB: 1,
    TENNXB: 1,
    DiaChi: 1,
};

/**
 * =========================================================================================
 * SERVICE QUẢN LÝ NHÀ XUẤT BẢN (NHAXUATBAN SERVICE)
 * =========================================================================================
 * Căn cứ thiết kế Cơ sở dữ liệu Báo cáo CT449 (Mục 2.5, Trang 25):
 * - Collection: 'nhaxuatban'
 * - Cấu trúc trường:
 *   + _id: ObjectId
 *   + MaNXB: String (Mã định danh nhà xuất bản, tự sinh NXB-0001)
 *   + TENNXB: String (Tên nhà xuất bản - CDM)
 *   + DiaChi: String (Địa chỉ trụ sở nhà xuất bản)
 * =========================================================================================
 */
class NhaXuatBanService {
    constructor(client) {
        this.NhaXuatBan = client.db().collection("nhaxuatban");
        this.Sach = client.db().collection("sach");
    }

    // Tự sinh mã - Completed
    async generateMaNXB() {
        const last = await this.NhaXuatBan.find(
            { MaNXB: { $regex: /^NXB-\d{4}$/ } },
            { projection: { MaNXB: 1 } }
        ).sort({ MaNXB: -1 }).limit(1).toArray();

        let nextNum = 1;
        if (last.length > 0) {
            const lastNum = parseInt(last[0].MaNXB.replace("NXB-", ""), 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        return `NXB-${String(nextNum).padStart(4, "0")}`;
    }

    // Lọc và chuẩn hóa dữ liệu - Completed
    extractData(payload) {
        const data = {};

        const name = payload.TENNXB;
        if (name !== undefined) {
            data.TENNXB = String(name).trim();
        }

        if (payload.DiaChi !== undefined) {
            data.DiaChi = String(payload.DiaChi).trim();
        }

        return data;
    }

    // Thêm nhà xuất bản mới - Completed
    async create(payload) {
        const data = this.extractData(payload);
        if (!data.TENNXB) {
            throw new Error("Tên nhà xuất bản không được để trống.");
        }

        data.MaNXB = await this.generateMaNXB();
        data.CreatedAt = new Date();
        data.UpdatedAt = new Date();

        const result = await this.NhaXuatBan.insertOne(data);
        return await this.findById(result.insertedId);
    }

    // Tìm nhà xuất bản, cho phép query - Completed
    async find(filter = {}) {
        const query = {};
        if (filter.search) {
            const regex = { $regex: new RegExp(filter.search, "i") };
            query.$or = [{ TENNXB: regex }, { TenNXB: regex }, { MaNXB: regex }];
        }
        if (filter.tenNxb) {
            const regex = { $regex: new RegExp(filter.tenNxb, "i") };
            query.$or = [{ TENNXB: regex }, { TenNXB: regex }];
        }
        if (filter.maNxb) {
            query.MaNXB = filter.maNxb;
        }

        const cursor = await this.NhaXuatBan.find(query, { projection: publicFields }).sort({ CreatedAt: -1, _id: -1 });
        return await cursor.toArray();
    }

    // Tìm nhà xuất bản theo id hoặc mã - Completed
    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MaNXB: id }] };
        } else {
            query = { MaNXB: id };
        }
        return await this.NhaXuatBan.findOne(query, { projection: publicFields });
    }

    // Cập nhật thông tin nhà xuất bản, tìm theo object id hoặc mã - Completed
    async update(id, payload) {
        const data = this.extractData(payload);
        delete data.MaNXB; // Không cho phép sửa MaNXB
        data.UpdatedAt = new Date();

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaNXB: id }] };
        } else {
            filter = { MaNXB: id };
        }

        const result = await this.NhaXuatBan.findOneAndUpdate(
            filter,
            { $set: data },
            { returnDocument: "after" }
        );
        return result ? this.findById(id) : null;
    }

    // Xóa nhà xuất bản tìm theo mã hoặc object id - Completed
    async delete(id) {
        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaNXB: id }] };
        } else {
            filter = { MaNXB: id };
        }

        const current = await this.NhaXuatBan.findOne(filter);
        if (!current) return null;

        // Ràng buộc toàn vẹn dữ liệu
        const bookCount = await this.Sach.countDocuments({ MaNXB: current.MaNXB });
        if (bookCount > 0) {
            throw new Error(`Không thể xóa NXB '${current.TENNXB || current.TenNXB}' vì vẫn còn ${bookCount} cuốn sách tham chiếu đến NXB này.`);
        }

        const result = await this.NhaXuatBan.findOneAndDelete({ _id: current._id });
        return result;
    }
}

module.exports = NhaXuatBanService;
