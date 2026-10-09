const { ObjectId } = require("mongodb");

class SachService {
    constructor(client) {
        this.Sach = client.db().collection("sach");
        this.NhaXuatBan = client.db().collection("nhaxuatban");
        this.TheoDoi = client.db().collection("theodoimuonsach");
    }

    extractData(payload) {
        const data = {
            MaSach: payload.MaSach ? String(payload.MaSach).trim() : undefined,
            TenSach: payload.TenSach ? String(payload.TenSach).trim() : undefined,
            DonGia: payload.DonGia !== undefined ? Number(payload.DonGia) : undefined,
            SoQuyen: payload.SoQuyen !== undefined ? Number(payload.SoQuyen) : undefined,
            NamXuatBan: payload.NamXuatBan !== undefined ? Number(payload.NamXuatBan) : undefined,
            MaNXB: payload.MaNXB ? String(payload.MaNXB).trim() : undefined,
            NguonGoc: payload.NguonGoc !== undefined ? String(payload.NguonGoc).trim() : "",
            TacGia: payload.TacGia ? String(payload.TacGia).trim() : undefined,
            HinhAnh: payload.HinhAnh !== undefined ? String(payload.HinhAnh).trim() : "",
            MoTa: payload.MoTa !== undefined ? String(payload.MoTa).trim() : "",
        };

        Object.keys(data).forEach(
            (key) => data[key] === undefined && delete data[key]
        );
        return data;
    }

    async create(payload) {
        const data = this.extractData(payload);
        if (!data.MaSach || !data.TenSach || data.DonGia === undefined || data.SoQuyen === undefined || !data.MaNXB || !data.TacGia) {
            throw new Error("Vui lòng điền đầy đủ các thông tin bắt buộc: MaSach, TenSach, DonGia, SoQuyen, MaNXB, TacGia.");
        }

        if (data.DonGia < 0 || data.SoQuyen < 0) {
            throw new Error("Đơn giá và số quyển phải là số không âm (>= 0).");
        }

        // Kiểm tra trùng MaSach
        const existing = await this.Sach.findOne({ MaSach: data.MaSach });
        if (existing) {
            throw new Error(`Sách có mã '${data.MaSach}' đã tồn tại.`);
        }

        // Kiểm tra MaNXB có tồn tại không
        const nxb = await this.NhaXuatBan.findOne({ MaNXB: data.MaNXB });
        if (!nxb) {
            throw new Error(`Nhà xuất bản có mã '${data.MaNXB}' không tồn tại trong hệ thống.`);
        }

        const result = await this.Sach.insertOne(data);
        return await this.Sach.findOne({ _id: result.insertedId });
    }

    async find(filter = {}) {
        const query = {};
        if (filter.tenSach) {
            query.TenSach = { $regex: new RegExp(filter.tenSach, "i") };
        }
        if (filter.tacGia) {
            query.TacGia = { $regex: new RegExp(filter.tacGia, "i") };
        }
        if (filter.maNxb && filter.maNxb !== "all") {
            query.MaNXB = filter.maNxb;
        }
        if (filter.availableOnly === "true" || filter.availableOnly === true) {
            query.SoQuyen = { $gt: 0 };
        }
        if (filter.search) {
            const regex = { $regex: new RegExp(filter.search, "i") };
            query.$or = [{ TenSach: regex }, { TacGia: regex }, { MaSach: regex }];
        }

        const cursor = await this.Sach.find(query);
        return await cursor.toArray();
    }

    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MaSach: id }] };
        } else {
            query = { MaSach: id };
        }
        return await this.Sach.findOne(query);
    }

    async update(id, payload) {
        const data = this.extractData(payload);
        delete data.MaSach; // Không sửa MaSach

        if (data.DonGia !== undefined && data.DonGia < 0) {
            throw new Error("Đơn giá không được âm.");
        }
        if (data.SoQuyen !== undefined && data.SoQuyen < 0) {
            throw new Error("Số quyển không được âm.");
        }

        if (data.MaNXB) {
            const nxb = await this.NhaXuatBan.findOne({ MaNXB: data.MaNXB });
            if (!nxb) {
                throw new Error(`Nhà xuất bản có mã '${data.MaNXB}' không tồn tại.`);
            }
        }

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaSach: id }] };
        } else {
            filter = { MaSach: id };
        }

        const result = await this.Sach.findOneAndUpdate(
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

        // Ràng buộc toàn vẹn: Không xóa sách nếu có phiếu mượn đang mượn hoặc chờ duyệt
        const borrowingCount = await this.TheoDoi.countDocuments({
            MaSach: current.MaSach,
            TrangThai: { $in: ["DangMuon", "ChoDuyet"] }
        });

        if (borrowingCount > 0) {
            throw new Error(`Không thể xóa sách '${current.TenSach}' vì đang có ${borrowingCount} phiếu mượn chưa hoàn tất.`);
        }

        const filter = { _id: current._id };
        const result = await this.Sach.findOneAndDelete(filter);
        return result;
    }

    async changeSoQuyen(maSach, delta) {
        const result = await this.Sach.findOneAndUpdate(
            { MaSach: maSach },
            { $inc: { SoQuyen: delta } },
            { returnDocument: "after" }
        );
        return result;
    }
}

module.exports = SachService;
