const { ObjectId } = require("mongodb");
const PasswordUtil = require("../utils/password.util");

/**
 * =========================================================================================
 * SERVICE QUẢN LÝ NHÂN VIÊN (NHANVIEN SERVICE)
 * =========================================================================================
 * Căn cứ thiết kế Cơ sở dữ liệu Báo cáo CT449 (Mục 2.3, Trang 24):
 * - Collection: 'nhanvien'
 * - Cấu trúc trường:
 *   + _id: ObjectId
 *   + MSNV: String (Mã số nhân viên, tự sinh chuẩn hóa NV-0001)
 *   + HoTenNV: String (Họ và tên đầy đủ của nhân viên)
 *   + MatKhau: String (Mật khẩu đăng nhập hệ thống - Đã mã hóa an toàn)
 *   + ChucVu: String (Chức danh công tác: THUTHU, ADMIN)
 *   + SoDienThoai: String (Số điện thoại nhân viên)
 *   + DiaChi: String (Địa chỉ liên hệ)
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

        const cursor = await this.NhanVien.find(query).sort({ CreatedAt: -1, _id: -1 });
        const list = await cursor.toArray();

        return list.map(item => {
            const safe = { ...item };
            delete safe.MatKhau;
            delete safe.Password;
            return safe;
        });
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

        const staff = await this.NhanVien.findOne(query);
        if (staff) {
            delete staff.MatKhau;
            delete staff.Password;
        }
        return staff;
    }

    /**
     * Xác thực đăng nhập nhân viên / quản trị viên
     */
    async login(msnv, password) {
        const idStr = String(msnv || "").trim();
        const staff = await this.NhanVien.findOne({
            $or: [{ MSNV: idStr }, { SoDienThoai: idStr }]
        });

        if (!staff) return null;

        const passwordHash = staff.MatKhau || staff.Password;
        const isValid = await PasswordUtil.compare(password, passwordHash);
        if (!isValid) return null;

        return staff;
    }

    /**
     * Cập nhật thông tin nhân viên
     */
    async update(id, payload) {
        const data = await this.extractData(payload, false);
        delete data.MSNV; // Không cho phép sửa MSNV

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

        if (result) {
            delete result.MatKhau;
            delete result.Password;
        }
        return result;
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
