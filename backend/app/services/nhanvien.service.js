const { ObjectId } = require("mongodb");
const PasswordUtil = require("../utils/password.util");

const publicFields = {
    _id: 1,
    MSNV: 1,
    HoTenNV: 1,
    ChucVu: 1,
    SoDienThoai: 1,
    DiaChi: 1,
    AnhDaiDien: 1,
    TrangThaiThe: 1,
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
        this.DocGia = client.db().collection("docgia");
        this.YeuCauNhanVien = client.db().collection("yeucaunhanvien");
        this.TheoDoi = client.db().collection("theodoimuonsach");
    }

    // Tự động sinh mã số nhân viên, tương tự như độc giả - Completed
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

    // Chuẩn hóa dữ liệu từ payload, mặc định là tạo, nếu truyền true thì update - Completed
    async extractData(payload, isCreating = false) {
        const data = {};

        if (payload.HoTenNV !== undefined) data.HoTenNV = String(payload.HoTenNV).trim();
        if (payload.ChucVu !== undefined) data.ChucVu = String(payload.ChucVu).trim().toUpperCase();
        if (payload.DiaChi !== undefined) data.DiaChi = String(payload.DiaChi).trim();
        if (payload.SoDienThoai !== undefined) data.SoDienThoai = String(payload.SoDienThoai).trim();
        if (payload.AnhDaiDien !== undefined) data.AnhDaiDien = String(payload.AnhDaiDien).trim();

        // Mật khẩu tài khoản nhân viên
        const rawPassword = payload.MatKhau;
        if (rawPassword) {
            data.MatKhau = await PasswordUtil.hash(rawPassword);
        }

        if (isCreating) {
            if (!data.ChucVu) data.ChucVu = "STAFF";
            if (!["STAFF", "ADMIN"].includes(data.ChucVu)) {
                throw new Error("Chức vụ nhân viên không hợp lệ. Chỉ chấp nhận STAFF hoặc ADMIN.");
            }
            if (data.DiaChi === undefined) data.DiaChi = "";
            data.TrangThaiThe = "HoatDong";
            data.PhienBanToken = 0;
        }

        return data;
    }

    // Thêm tài khoản nhân viên
    async create(payload) {
        const data = await this.extractData(payload, true);

        if (!data.HoTenNV || !data.MatKhau || !data.SoDienThoai) {
            throw new Error("Vui lòng điền đầy đủ Họ tên, số điện thoại và mật khẩu nhân viên.");
        }
        if (!["STAFF", "ADMIN"].includes(data.ChucVu)) {
            throw new Error("Chức vụ nhân viên không hợp lệ. Chỉ chấp nhận STAFF hoặc ADMIN.");
        }
        if (!/^\+?[0-9]{9,15}$/.test(data.SoDienThoai)) {
            throw new Error("Số điện thoại nhân viên phải có từ 9 đến 15 chữ số.");
        }
        if (await this.NhanVien.findOne({ SoDienThoai: data.SoDienThoai }, { projection: { _id: 1 } })) {
            throw new Error("Số điện thoại nhân viên đã được sử dụng.");
        }
        if (await this.DocGia.findOne({ DienThoai: data.SoDienThoai }, { projection: { _id: 1 } }) ||
            await this.YeuCauNhanVien.findOne({ SoDienThoai: data.SoDienThoai }, { projection: { _id: 1 } })) {
            throw new Error("Số điện thoại đã được sử dụng trong tài khoản hoặc hồ sơ đăng ký khác.");
        }

        // Tự sinh mã số nhân viên
        data.MSNV = await this.generateMSNV();

        data.CreatedAt = new Date();
        data.UpdatedAt = new Date();

        const result = await this.NhanVien.insertOne(data);
        return await this.findById(result.insertedId);
    }

    async createFromApprovedRequest(request) {
        await this.NhanVien.createIndex({ MaYeuCauDangKy: 1 }, { unique: true, sparse: true, name: "uq_nhanvien_yeucau_dangky" });
        const existing = await this.NhanVien.findOne({ MaYeuCauDangKy: String(request._id) }, { projection: { _id: 1 } });
        if (existing) return this.findById(existing._id);
        const data = {
            MSNV: await this.generateMSNV(),
            HoTenNV: String(request.HoTenNV).trim(),
            SoDienThoai: String(request.SoDienThoai).trim(),
            DiaChi: String(request.DiaChi || "").trim(),
            MatKhau: request.MatKhau,
            ChucVu: "STAFF",
            TrangThaiThe: "HoatDong",
            PhienBanToken: 0,
            CreatedAt: new Date(),
            UpdatedAt: new Date(),
            MaYeuCauDangKy: String(request._id),
        };
        if (await this.NhanVien.findOne({ SoDienThoai: data.SoDienThoai }, { projection: { _id: 1 } }) ||
            await this.DocGia.findOne({ DienThoai: data.SoDienThoai }, { projection: { _id: 1 } })) {
            throw new Error("Số điện thoại nhân viên đã được sử dụng.");
        }
        try {
            const result = await this.NhanVien.insertOne(data);
            return this.findById(result.insertedId);
        } catch (error) {
            if (error.code !== 11000) throw error;
            const created = await this.NhanVien.findOne({ MaYeuCauDangKy: String(request._id) }, { projection: { _id: 1 } });
            if (!created) throw error;
            return this.findById(created._id);
        }
    }

    // Lấy danh sách nhân viên thư viện, có lọc theo họ tên, msnv, số điện thoại - Completed
    async find(filter = {}) {
        const query = filter.includeDeleted ? {} : { deleted: { $ne: true } };
        if (filter.search) {
            const regex = { $regex: new RegExp(filter.search, "i") };
            query.$or = [{ HoTenNV: regex }, { MSNV: regex }, { SoDienThoai: regex }];
        }
        if (filter.chucVu) {
            query.ChucVu = filter.chucVu;
        }

        const projection = filter.includeDeleted
            ? { ...publicFields, deleted: 1, DeletedAt: 1, DeletedBy: 1 }
            : publicFields;
        const cursor = await this.NhanVien.find(query, { projection }).sort({ CreatedAt: -1, _id: -1 });
        return await cursor.toArray();
    }


    // Query theo object id hoặc mã nhân viên, trả về các trường được quy định sẵn trong publicFields - Completed
    async findById(id) {
        let query = {};
        if (ObjectId.isValid(id)) {
            query = { $or: [{ _id: new ObjectId(id) }, { MSNV: id }], deleted: { $ne: true } };
        } else {
            query = { MSNV: id, deleted: { $ne: true } };
        }

        return await this.NhanVien.findOne(query, { projection: publicFields });
    }

    //Xác thực đăng nhập cho nhân viên thủ thư/ quản trị viên - Completed
    async loginWithStatus(phone, password) {
        const accountPhone = String(phone || "").trim();
        if (!/^\+?[0-9]{9,15}$/.test(accountPhone)) return { staff: null, status: "invalid" };
        const staff = await this.NhanVien.findOne({ SoDienThoai: accountPhone, deleted: { $ne: true } });

        if (!staff || !["STAFF", "ADMIN"].includes(staff.ChucVu)) return { staff: null, status: "invalid" };

        const passwordHash = staff.MatKhau;
        const isValid = await PasswordUtil.compare(password, passwordHash);
        if (!isValid) return { staff: null, status: "invalid" };
        if (staff.TrangThaiThe === "Khoa") return { staff: null, status: "locked" };
        return { staff, status: "authenticated" };
    }

    async login(phone, password) {
        const result = await this.loginWithStatus(phone, password);
        return result.staff;
    }

    async setAccountStatus(id, status, actor = {}) {
        const target = await this.findById(id);
        if (!target) {
            const error = new Error("Không tìm thấy nhân viên cần cập nhật trạng thái.");
            error.statusCode = 404;
            throw error;
        }
        if (String(target._id) === String(actor.id || "") || target.MSNV === String(actor.username || "")) {
            const error = new Error("Không thể khóa hoặc mở khóa tài khoản của chính mình.");
            error.statusCode = 403;
            throw error;
        }
        if (target.ChucVu !== "STAFF") {
            const error = new Error("Chỉ có thể khóa hoặc mở khóa tài khoản thủ thư.");
            error.statusCode = 403;
            throw error;
        }
        if (!["HoatDong", "Khoa"].includes(status)) {
            const error = new Error("Trạng thái tài khoản không hợp lệ.");
            error.statusCode = 400;
            throw error;
        }

        const currentStatus = target.TrangThaiThe || "HoatDong";
        if (currentStatus === status) {
            const error = new Error(status === "Khoa" ? "Tài khoản thủ thư đã bị khóa." : "Tài khoản thủ thư đang hoạt động.");
            error.statusCode = 409;
            throw error;
        }

        const expectedStatus = currentStatus === "HoatDong"
            ? { $or: [{ TrangThaiThe: "HoatDong" }, { TrangThaiThe: { $exists: false } }] }
            : { TrangThaiThe: currentStatus };
        const result = await this.NhanVien.updateOne(
            { _id: target._id, ChucVu: "STAFF", ...expectedStatus },
            {
                $set: { TrangThaiThe: status, UpdatedAt: new Date() },
                ...(status === "Khoa" ? { $inc: { PhienBanToken: 1 } } : {}),
            }
        );
        if (!result.modifiedCount) {
            const error = new Error("Trạng thái tài khoản vừa thay đổi. Vui lòng tải lại danh sách.");
            error.statusCode = 409;
            throw error;
        }
        return this.findById(target._id.toString());
    }

    // Cập nhật thông tin nhân viên - Completed
    async update(id, payload) {
        const editableFields = ["HoTenNV", "SoDienThoai", "DiaChi", "AnhDaiDien"];
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
        if (data.SoDienThoai !== undefined) {
            if (!/^\+?[0-9]{9,15}$/.test(data.SoDienThoai)) {
                throw new Error("Số điện thoại nhân viên phải có từ 9 đến 15 chữ số.");
            }
            let phoneFilter = { SoDienThoai: data.SoDienThoai };
            if (ObjectId.isValid(id)) phoneFilter._id = { $ne: new ObjectId(id) };
            else phoneFilter.MSNV = { $ne: id };
            const currentStaff = ObjectId.isValid(id)
                ? await this.NhanVien.findOne({ _id: new ObjectId(id) }, { projection: { SoDienThoai: 1 } })
                : await this.NhanVien.findOne({ MSNV: id }, { projection: { SoDienThoai: 1 } });
            const isChangingPhone = data.SoDienThoai !== currentStaff?.SoDienThoai;
            const duplicateStaffPhone = await this.NhanVien.findOne(phoneFilter, { projection: { _id: 1 } });
            const duplicateReaderPhone = isChangingPhone
                ? await this.DocGia.findOne({ DienThoai: data.SoDienThoai }, { projection: { _id: 1 } })
                : null;
            const duplicateApplicationPhone = isChangingPhone
                ? await this.YeuCauNhanVien.findOne({ SoDienThoai: data.SoDienThoai, TrangThai: { $ne: "DaDuyet" } }, { projection: { _id: 1 } })
                : null;
            if (duplicateStaffPhone || duplicateReaderPhone || duplicateApplicationPhone) {
                throw new Error("Số điện thoại nhân viên đã được sử dụng.");
            }
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

    // Xóa nhân viên, quản trị viên duy nhất của hệ thống không được xóa
    async delete(id, actorCode) {
        let filter = {};
        if (ObjectId.isValid(id)) {
            filter = { $or: [{ _id: new ObjectId(id) }, { MSNV: id }] };
        } else {
            filter = { MSNV: id };
        }

        filter.deleted = { $ne: true };
        const current = await this.NhanVien.findOne(filter);
        if (!current) return null;

        // Không được xóa tài khoản quản trị viên
        if (current.ChucVu === "ADMIN") {
            throw new Error("Không thể xóa tài khoản quản trị viên.");
        }
        if (String(current._id) === String(actorCode || "")) {
            throw new Error("Không thể xóa tài khoản của chính mình.");
        }
        const activeBorrows = await this.TheoDoi.countDocuments({
            MSNV: current.MSNV,
            TrangThai: { $in: ["DangMuon", "ChoNhan"] },
        });
        if (activeBorrows > 0) {
            throw new Error(`Không thể xóa nhân viên '${current.MSNV}' vì đang phụ trách ${activeBorrows} phiếu mượn chưa hoàn tất.`);
        }
        const now = new Date();
        const result = await this.NhanVien.updateOne(
            { _id: current._id, deleted: { $ne: true } },
            {
                $set: { deleted: true, DeletedAt: now, DeletedBy: String(actorCode || ""), UpdatedAt: now },
                $inc: { PhienBanToken: 1 },
            }
        );
        return result.modifiedCount
            ? { ...current, deleted: true, DeletedAt: now, DeletedBy: String(actorCode || "") }
            : null;
    }

    async restore(id) {
        let filter = {};
        if (ObjectId.isValid(id)) filter = { $or: [{ _id: new ObjectId(id) }, { MSNV: id }] };
        else filter = { MSNV: id };
        const result = await this.NhanVien.findOneAndUpdate(
            { ...filter, deleted: true, ChucVu: "STAFF" },
            { $unset: { deleted: "", DeletedAt: "", DeletedBy: "" }, $set: { UpdatedAt: new Date() } },
            { returnDocument: "after" }
        );
        return result ? this.findById(String(result._id)) : null;
    }
}

module.exports = NhanVienService;
