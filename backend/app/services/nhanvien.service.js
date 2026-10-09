const { ObjectId } = require("mongodb");

class NhanVienService {
    constructor(client) {
        this.NhanVien = client.db().collection("nhanvien");
    }

    extractData(payload) {
        const data = {
            MSNV: payload.MSNV ? String(payload.MSNV).trim() : undefined,
            HoTenNV: payload.HoTenNV ? String(payload.HoTenNV).trim() : undefined,
            Password: payload.Password ? String(payload.Password).trim() : undefined,
            ChucVu: payload.ChucVu ? String(payload.ChucVu).trim() : "THUTHU",
            DiaChi: payload.DiaChi !== undefined ? String(payload.DiaChi).trim() : "",
            SoDienThoai: payload.SoDienThoai !== undefined ? String(payload.SoDienThoai).trim() : "",
        };

        // Lọc bỏ những giá trị undefined trong object data
        Object.keys(data).forEach(
            (key) => data[key] === undefined && delete data[key]
        );
        return data;
    }

    async create(payload) {
        const data = this.extractData(payload);
        if (!data.MSNV || !data.HoTenNV || !data.Password) {
            throw new Error("Vui lòng điền đầy đủ MSNV, HoTenNV và Password.");
        }

        const existing = await this.NhanVien.findOne({ MSNV: data.MSNV });
        if (existing) {
            throw new Error(`Mã số nhân viên '${data.MSNV}' đã tồn tại.`);
        }

        const result = await this.NhanVien.insertOne(data);
        return await this.NhanVien.findOne({ _id: result.insertedId });
    }

    async find(filter = {}) {
        const query = {};
        if (filter.search) {
            // Chữ i = ignorecase (không phân biệt hoa thường)
            const regex = { $regex: new RegExp(filter.search, "i") };

            //Khớp họ tên nhân viên hay mã số nhân viên đều được
            query.$or = [{ HoTenNV: regex }, { MSNV: regex }];
        }
        if (filter.chucVu) {
            query.ChucVu = filter.chucVu;
        }
        const cursor = await this.NhanVien.find(query);
        return await cursor.toArray();
    }

    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MSNV: id }] };
        } else {
            query = { MSNV: id };
        }
        return await this.NhanVien.findOne(query);
    }

    async login(msnv, password) {
        const staff = await this.NhanVien.findOne({
            MSNV: msnv,
            Password: password,
        });
        return staff;
    }

    async update(id, payload) {
        const data = this.extractData(payload);
        delete data.MSNV; // Không sửa MSNV

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MSNV: id }] };
        } else {
            filter = { MSNV: id };
        }

        // returnDocument: "after" trả về dữ liệu sau khi đã cập nhật
        const result = await this.NhanVien.findOneAndUpdate(
            filter,
            { $set: data },
            { returnDocument: "after" }
        );
        return result;
    }

    async delete(id) {
        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MSNV: id }] };
        } else {
            filter = { MSNV: id };
        }

        const result = await this.NhanVien.findOneAndDelete(filter);
        return result;
    }
}

module.exports = NhanVienService;
