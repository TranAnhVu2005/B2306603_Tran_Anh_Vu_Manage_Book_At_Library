const { ObjectId } = require("mongodb");
const PasswordUtil = require("../utils/password.util");

const publicFields = {
    _id: 1,
    MSNV: 1,
    HoTenNV: 1,
    ChucVu: 1,
    SoDienThoai: 1,
    DiaChi: 1,
};

/**
 * =========================================================================================
 * SCHEMA MÔ TẢ DỮ LIỆU: NHÂN VIÊN (NHANVIEN COLLECTION)
 * =========================================================================================
 * | Thuộc tính   | Kiểu dữ liệu | Khóa chính | Khóa ngoại | Mô tả                                  |
 * | :------------| :----------- | :--------: | :--------: | :------------------------------------- |
 * | `_id`        | ObjectId     |     x      |            | Định danh duy nhất tự sinh bởi MongoDB |
 * | `MSNV`       | String       |            |            | Mã số nhân viên                        |
 * | `HoTenNV`    | String       |            |            | Họ và tên đầy đủ của nhân viên         |
 * | `MatKhau`    | String       |            |            | Mật khẩu đăng nhập hệ thống            |
 * | `ChucVu`     | String       |            |            | Chức danh công tác                     |
 * | `SoDienThoai`| String       |            |            | Số điện thoại nhân viên                |
 * | `DiaChi`     | String       |            |            | Địa chỉ liên hệ của nhân viên          |
 * =========================================================================================
 */
class NhanVienService {
    constructor(client) {
        this.NhanVien = client.db().collection("nhanvien");
        this.TheoDoi = client.db().collection("theodoimuonsach");
    }

    /**
     * Tự động sinh mã nhân viên định dạng: NV-0001, NV-0002,...
     */
    async generateMSNV() {
        const last = await this.NhanVien.find(
            { MSNV: { $regex: /^NV-\d{4}$/ } },
            { projection: { MSNV: 1 } }
        ).sort({ MSNV: -1 }).limit(1).toArray();

        let nextNum = 1;
        if (last.length > 0) {
            const lastNum = parseInt(last[0].MSNV.replace("NV-", ""), 10);
            if (!isNaN(lastNum)) {
                nextNum = lastNum + 1;
            }
        }
        return `NV-${String(nextNum).padStart(4, "0")}`;
    }

    /**
     * Lọc và chuẩn hóa dữ liệu nhân viên
     */
    async extractData(payload, isCreating = false) {
        const data = {};

        if (payload.HoTenNV !== undefined) data.HoTenNV = String(payload.HoTenNV).trim();
        if (payload.ChucVu !== undefined) data.ChucVu = String(payload.ChucVu).trim().toUpperCase();
        if (payload.DiaChi !== undefined) data.DiaChi = String(payload.DiaChi).trim();
        if (payload.SoDienThoai !== undefined) data.SoDienThoai = String(payload.SoDienThoai).trim();

        // Mật khẩu tài khoản nhân viên (chuẩn hóa trường MatKhau)
        const rawPassword = payload.MatKhau || payload.Password;
        if (rawPassword) {
            data.MatKhau = await PasswordUtil.hash(rawPassword);
            data.Password = data.MatKhau; // Đồng bộ alias
        }

        if (isCreating) {
            if (!data.ChucVu) data.ChucVu = "THUTHU";
            if (data.DiaChi === undefined) data.DiaChi = "";
            if (data.SoDienThoai === undefined) data.SoDienThoai = "";
        }

        return data;
    }

    /**
     * Thêm tài khoản nhân viên / cán bộ thư viện mới
     */
    async create(payload) {
        const data = await this.extractData(payload, true);

        if (!data.HoTenNV || !data.MatKhau) {
            throw new Error("Vui lòng điền đầy đủ Họ tên nhân viên và Mật khẩu.");
        }

        // Tự sinh MSNV nếu không truyền
        if (!payload.MSNV) {
            data.MSNV = await this.generateMSNV();
        } else {
            const existing = await this.NhanVien.findOne({ MSNV: payload.MSNV });
            if (existing) {
                throw new Error(`Mã số nhân viên '${payload.MSNV}' đã tồn tại.`);
            }
            data.MSNV = payload.MSNV;
        }

        data.CreatedAt = new Date();
        data.UpdatedAt = new Date();

        const result = await this.NhanVien.insertOne(data);
        return await this.findById(result.insertedId);
    }

    /**
     * Lấy danh sách nhân viên thư viện
     */
    async find(filter = {}) {
        const query = {};
        if (filter.search) {
            const regex = { $regex: new RegExp(filter.search, "i") };
            query.$or = [{ HoTenNV: regex }, { MSNV: regex }, { SoDienThoai: regex }];
        }
        if (filter.chucVu) {
            query.ChucVu = filter.chucVu;
        }

        const cursor = await this.NhanVien.find(query, { projection: publicFields }).sort({ CreatedAt: -1, _id: -1 });
        return await cursor.toArray();
    }

    /**
     * Tìm nhân viên theo ID hoặc MSNV
     */
    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MSNV: id }] };
        } else {
            query = { MSNV: id };
        }

        return await this.NhanVien.findOne(query, { projection: publicFields });
    }

    //Xác thực đăng nhập cho nhân viên thủ thư/ quản trị viên - Completed
    async login(identifier, password) {
        const accountIdentifier = String(identifier || "").trim();
        const staff = await this.NhanVien.findOne({
            $or: [{ MSNV: accountIdentifier }, { SoDienThoai: accountIdentifier }]
        });

        if (!staff) return null; //Không tìm thấy

        const passwordHash = staff.MatKhau;
        const isValid = await PasswordUtil.compare(password, passwordHash);
        if (!isValid) return null;
        return staff;
    }

    /**
     * Cập nhật thông tin nhân viên
     */
    async update(id, payload) {
        const editableFields = ["HoTenNV", "SoDienThoai", "DiaChi"];
        const editablePayload = Object.fromEntries(
            editableFields
                .filter((field) => payload[field] !== undefined)
                .map((field) => [field, payload[field]])
        );
        if (Object.keys(editablePayload).length === 0) {
            throw new Error("Không có thông tin cá nhân hợp lệ để cập nhật.");
        }

        const data = await this.extractData(editablePayload, false);
        if (data.HoTenNV !== undefined && !data.HoTenNV) {
            throw new Error("Họ tên nhân viên không được để trống.");
        }

        data.UpdatedAt = new Date();

        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MSNV: id }] };
        } else {
            filter = { MSNV: id };
        }

        const result = await this.NhanVien.findOneAndUpdate(
            filter,
            { $set: data },
            { returnDocument: "after" }
        );

        return result ? this.findById(id) : null;
    }

    /**
     * Xóa nhân viên
     */
    async delete(id) {
        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MSNV: id }] };
        } else {
            filter = { MSNV: id };
        }

        const current = await this.NhanVien.findOne(filter);
        if (!current) return null;

        // Quản trị viên tối cao không được tự xóa tài khoản của mình
        if (current.ChucVu === "ADMIN") {
            const adminCount = await this.NhanVien.countDocuments({ ChucVu: "ADMIN" });
            if (adminCount <= 1) {
                throw new Error("Không thể xóa tài khoản Quản trị viên tối cao duy nhất trong hệ thống.");
            }
        }

        return await this.NhanVien.findOneAndDelete({ _id: current._id });
    }
}

module.exports = NhanVienService;
