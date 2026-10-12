const { ObjectId } = require("mongodb");

class DocGiaService {
    constructor(client) {
        this.DocGia = client.db().collection("docgia");
        this.TheoDoi = client.db().collection("theodoimuonsach");
    }

    // ─── Auto-generate MaDocGia: DG-000001, DG-000002, ... ───────────────────
    async generateMaDocGia() {
        const last = await this.DocGia.find(
            { MaDocGia: { $regex: /^DG-\d{6}$/ } },
            { projection: { MaDocGia: 1 } }
        ).sort({ MaDocGia: -1 }).limit(1).toArray();

        let nextNum = 1;
        if (last.length > 0) {
            const lastNum = parseInt(last[0].MaDocGia.replace("DG-", ""), 10);
            nextNum = lastNum + 1;
        }
        return `DG-${String(nextNum).padStart(6, "0")}`;
    }

    extractData(payload) {
        const data = {
            HoLot: payload.HoLot ? String(payload.HoLot).trim() : undefined,
            Ten: payload.Ten ? String(payload.Ten).trim() : undefined,
            NgaySinh: payload.NgaySinh ? String(payload.NgaySinh).trim() : undefined,
            Phai: payload.Phai !== undefined ? String(payload.Phai).trim() : "Nam",
            DiaChi: payload.DiaChi !== undefined ? String(payload.DiaChi).trim() : "",
            DienThoai: payload.DienThoai ? String(payload.DienThoai).trim() : undefined,
            Password: payload.Password ? String(payload.Password).trim() : undefined,
            Role: payload.Role ? String(payload.Role).trim() : "USER",
            SoLanViPham: payload.SoLanViPham !== undefined ? Number(payload.SoLanViPham) : 0,
            TrangThaiThe: payload.TrangThaiThe ? String(payload.TrangThaiThe).trim() : "HoatDong",
        };

        Object.keys(data).forEach(
            (key) => data[key] === undefined && delete data[key]
        );
        return data;
    }

    async create(payload) {
        const data = this.extractData(payload);
        if (!data.HoLot || !data.Ten || !data.DienThoai || !data.Password) {
            throw new Error("Vui lòng điền đầy đủ các thông tin: HoLot, Ten, DienThoai, Password.");
        }

        // Kiểm tra trùng số điện thoại
        const existingPhone = await this.DocGia.findOne({ DienThoai: data.DienThoai });
        if (existingPhone) {
            throw new Error(`Số điện thoại '${data.DienThoai}' đã được đăng ký.`);
        }

        // Tự động sinh MaDocGia
        data.MaDocGia = await this.generateMaDocGia();

        const result = await this.DocGia.insertOne(data);
        return await this.DocGia.findOne({ _id: result.insertedId });
    }

    async find(filter = {}) {
        const query = {};
        if (filter.search) {
            const regex = { $regex: new RegExp(filter.search, "i") };
            query.$or = [{ Ten: regex }, { HoLot: regex }, { MaDocGia: regex }, { DienThoai: regex }];
        }
        if (filter.trangThai) {
            query.TrangThaiThe = filter.trangThai;
        }
        if (filter.role) {
            query.Role = filter.role;
        }
        const cursor = await this.DocGia.find(query);
        return await cursor.toArray();
    }

    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }, { DienThoai: id }] };
        } else {
            query = { $or: [{ MaDocGia: id }, { DienThoai: id }] };
        }
        return await this.DocGia.findOne(query);
    }

    async login(identifier, password) {
        // Cho phép đăng nhập bằng MaDocGia hoặc số điện thoại
        const user = await this.DocGia.findOne({
            $or: [{ MaDocGia: identifier }, { DienThoai: identifier }],
            Password: password,
        });
        return user;
    }

    async update(id, payload) {
        const data = this.extractData(payload);
        delete data.MaDocGia; // Không sửa MaDocGia
        delete data.Role;     // Không sửa Role qua update thông thường

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }] };
        } else {
            filter = { MaDocGia: id };
        }

        const result = await this.DocGia.findOneAndUpdate(
            filter,
            { $set: data },
            { returnDocument: "after" }
        );
        return result;
    }

    async updateRole(id, newRole) {
        if (!["USER", "MANAGER", "ADMIN"].includes(newRole)) {
            throw new Error("Role không hợp lệ. Phải là USER, MANAGER hoặc ADMIN.");
        }

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }] };
        } else {
            filter = { MaDocGia: id };
        }

        const result = await this.DocGia.findOneAndUpdate(
            filter,
            { $set: { Role: newRole } },
            { returnDocument: "after" }
        );
        return result;
    }

    async unblock(id) {
        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MaDocGia: id }] };
        } else {
            filter = { MaDocGia: id };
        }

        const result = await this.DocGia.findOneAndUpdate(
            filter,
            { $set: { TrangThaiThe: "HoatDong", SoLanViPham: 0 } },
            { returnDocument: "after" }
        );
        return result;
    }

    async incrementViPham(maDocGia) {
        const user = await this.DocGia.findOne({ MaDocGia: maDocGia });
        if (!user) return null;

        const newCount = (user.SoLanViPham || 0) + 1;
        const newStatus = newCount >= 3 ? "Blacklist" : user.TrangThaiThe;

        const result = await this.DocGia.findOneAndUpdate(
            { MaDocGia: maDocGia },
            { $set: { SoLanViPham: newCount, TrangThaiThe: newStatus } },
            { returnDocument: "after" }
        );
        return result;
    }

    async delete(id) {
        const current = await this.findById(id);
        if (!current) {
            return null;
        }

        const activeBorrows = await this.TheoDoi.countDocuments({
            MaDocGia: current.MaDocGia,
            TrangThai: { $in: ["DangMuon", "ChoDuyet"] }
        });

        if (activeBorrows > 0) {
            throw new Error(`Không thể xóa độc giả '${current.MaDocGia}' vì đang có ${activeBorrows} phiếu mượn chưa hoàn tất.`);
        }

        const filter = { _id: current._id };
        const result = await this.DocGia.findOneAndDelete(filter);
        return result;
    }
}

module.exports = DocGiaService;
