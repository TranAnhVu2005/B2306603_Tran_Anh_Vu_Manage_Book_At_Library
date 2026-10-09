const { ObjectId } = require("mongodb");

class NhaXuatBanService {
    constructor(client) {
        this.NhaXuatBan = client.db().collection("nhaxuatban");
        this.Sach = client.db().collection("sach");
    }

    extractData(payload) {
        const data = {
            MaNXB: payload.MaNXB ? String(payload.MaNXB).trim() : undefined,
            TenNXB: payload.TenNXB ? String(payload.TenNXB).trim() : undefined,
            DiaChi: payload.DiaChi !== undefined ? String(payload.DiaChi).trim() : "",
        };

        Object.keys(data).forEach(
            (key) => data[key] === undefined && delete data[key]
        );
        return data;
    }

    async create(payload) {
        const data = this.extractData(payload);
        if (!data.MaNXB || !data.TenNXB) {
            throw new Error("Mã NXB và Tên NXB là bắt buộc.");
        }

        const existing = await this.NhaXuatBan.findOne({ MaNXB: data.MaNXB });
        if (existing) {
            throw new Error(`Nhà xuất bản có mã '${data.MaNXB}' đã tồn tại.`);
        }

        const result = await this.NhaXuatBan.insertOne(data);
        return await this.NhaXuatBan.findOne({ _id: result.insertedId });
    }

    async find(filter = {}) {
        const query = {};
        if (filter.tenNxb) {
            query.TenNXB = { $regex: new RegExp(filter.tenNxb, "i") };
        }
        if (filter.maNxb) {
            query.MaNXB = filter.maNxb;
        }
        const cursor = await this.NhaXuatBan.find(query);
        return await cursor.toArray();
    }

    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MaNXB: id }] };
        } else {
            query = { MaNXB: id };
        }
        return await this.NhaXuatBan.findOne(query);
    }

    async update(id, payload) {
        const data = this.extractData(payload);
        // Không cho phép thay đổi MaNXB nếu đã có
        delete data.MaNXB;

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
        return result;
    }

    async delete(id) {
        const current = await this.findById(id);
        if (!current) {
            return null;
        }

        // Ràng buộc toàn vẹn: Không xóa NXB nếu còn sách thuộc NXB này
        const bookCount = await this.Sach.countDocuments({ MaNXB: current.MaNXB });
        if (bookCount > 0) {
            throw new Error(`Không thể xóa NXB '${current.TenNXB}' vì vẫn còn ${bookCount} cuốn sách tham chiếu đến NXB này.`);
        }

        const filter = { _id: current._id };
        const result = await this.NhaXuatBan.findOneAndDelete(filter);
        return result;
    }
}

module.exports = NhaXuatBanService;
