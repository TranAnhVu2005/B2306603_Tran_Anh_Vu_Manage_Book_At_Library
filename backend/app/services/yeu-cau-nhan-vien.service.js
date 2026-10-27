const { ObjectId } = require("mongodb");
const PasswordUtil = require("../utils/password.util");
const NhanVienService = require("./nhanvien.service");
const AuditLogService = require("./audit-log.service");

const publicFields = {
    _id: 1, HoTenNV: 1, SoDienThoai: 1, DiaChi: 1, TrangThai: 1,
    ThoiGianGui: 1, ThoiGianXuLy: 1, NguoiDuyet: 1, LyDoTuChoi: 1, MSNV: 1,
};

class YeuCauNhanVienService {
    constructor(client) {
        this.client = client;
        this.YeuCau = client.db().collection("yeucaunhanvien");
        this.NhanVien = client.db().collection("nhanvien");
        this.DocGia = client.db().collection("docgia");
    }

    async ensureIndexes() {
        await this.YeuCau.createIndex({ SoDienThoai: 1, TrangThai: 1 }, { unique: true, name: "uq_yeucaunv_phone_status" });
    }

    async submit(payload) {
        const HoTenNV = String(payload.HoTenNV || "").trim();
        const SoDienThoai = String(payload.SoDienThoai || "").trim();
        const DiaChi = String(payload.DiaChi || "").trim();
        const MatKhau = String(payload.MatKhau || "");
        if (!HoTenNV || !SoDienThoai || !MatKhau) throw new Error("Vui lòng nhập họ tên, số điện thoại và mật khẩu.");
        if (HoTenNV.length > 120 || DiaChi.length > 300) throw new Error("Thông tin đăng ký vượt quá độ dài cho phép.");
        if (!/^\+?[0-9]{9,15}$/.test(SoDienThoai)) throw new Error("Số điện thoại phải có từ 9 đến 15 chữ số.");
        if (MatKhau.length < 8 || MatKhau.length > 128) throw new Error("Mật khẩu phải có từ 8 đến 128 ký tự.");

        await this.ensureIndexes();
        if (await this.NhanVien.findOne({ SoDienThoai }, { projection: { _id: 1 } })) {
            throw new Error("Số điện thoại này đã có tài khoản nhân viên.");
        }
        if (await this.DocGia.findOne({ DienThoai: SoDienThoai }, { projection: { _id: 1 } })) {
            throw new Error("Số điện thoại này đã được dùng cho tài khoản độc giả.");
        }
        if (await this.YeuCau.findOne({ SoDienThoai, TrangThai: { $in: ["ChoDuyet", "DangDuyet"] } }, { projection: { _id: 1 } })) {
            throw new Error("Số điện thoại này đã có hồ sơ đang chờ xử lý.");
        }

        const request = {
            HoTenNV, SoDienThoai, DiaChi, MatKhau: await PasswordUtil.hash(MatKhau),
            TrangThai: "ChoDuyet", ThoiGianGui: new Date(),
        };
        const rejected = await this.YeuCau.findOne({ SoDienThoai, TrangThai: "TuChoi" }, { sort: { ThoiGianGui: -1 }, projection: { _id: 1 } });
        let id;
        if (rejected) {
            id = rejected._id;
            await this.YeuCau.updateOne({ _id: id, TrangThai: "TuChoi" }, {
                $set: request,
                $unset: { LyDoTuChoi: "", NguoiDuyet: "", ThoiGianXuLy: "", MSNV: "" },
            });
        } else {
            const result = await this.YeuCau.insertOne(request);
            id = result.insertedId;
        }
        await new AuditLogService(this.client).record({
            action: "NHANVIEN_DANG_KY", entityType: "yeucaunhanvien", entityId: id,
            actorType: "system", actorId: "public", actorName: "Ứng viên nhân viên",
            Details: { HoTenNV, SoDienThoai },
        });
        return { _id: id, HoTenNV, SoDienThoai, DiaChi, TrangThai: request.TrangThai, ThoiGianGui: request.ThoiGianGui };
    }

    async findAll() {
        await this.ensureIndexes();
        return this.YeuCau.find({ TrangThai: { $in: ["ChoDuyet", "DangDuyet"] } }, { projection: publicFields })
            .sort({ ThoiGianGui: 1, _id: 1 }).toArray();
    }

    async resolveReviewer(actor) {
        if (!actor?.id || !ObjectId.isValid(actor.id)) {
            throw new Error("Không xác định được tài khoản quản trị viên đang xử lý hồ sơ.");
        }
        const reviewer = await this.NhanVien.findOne(
            { _id: new ObjectId(actor.id), ChucVu: "ADMIN", deleted: { $ne: true } },
            { projection: { MSNV: 1, HoTenNV: 1 } }
        );
        if (!reviewer?.MSNV || reviewer.MSNV !== actor.MSNV) {
            throw new Error("Mã nhân viên người duyệt không hợp lệ hoặc tài khoản không còn quyền quản trị.");
        }
        return reviewer;
    }

    async approve(id, actor) {
        if (!ObjectId.isValid(id)) return null;
        const reviewer = await this.resolveReviewer(actor);
        let request = await this.YeuCau.findOneAndUpdate(
            { _id: new ObjectId(id), TrangThai: "ChoDuyet" },
            { $set: { TrangThai: "DangDuyet", NguoiDuyet: reviewer.MSNV, ThoiGianXuLy: new Date() } },
            { returnDocument: "after" }
        );
        if (!request) {
            const retryBefore = new Date(Date.now() - 5 * 60 * 1000);
            request = await this.YeuCau.findOneAndUpdate(
                { _id: new ObjectId(id), TrangThai: "DangDuyet", ThoiGianXuLy: { $lt: retryBefore } },
                { $set: { NguoiDuyet: reviewer.MSNV, ThoiGianXuLy: new Date() } },
                { returnDocument: "after" }
            );
            if (!request) return null;
        }

        let staff;
        try {
            const existingPhone = await this.NhanVien.findOne({ SoDienThoai: request.SoDienThoai }, { projection: { _id: 1, MaYeuCauDangKy: 1 } });
            if (existingPhone && existingPhone.MaYeuCauDangKy !== String(request._id)) {
                throw new Error("Số điện thoại đã được dùng bởi tài khoản nhân viên khác.");
            }
            const staffService = new NhanVienService(this.client);
            staff = await staffService.createFromApprovedRequest(request);
        } catch (error) {
            await this.YeuCau.updateOne({ _id: request._id, TrangThai: "DangDuyet" }, {
                $set: { TrangThai: "ChoDuyet" }, $unset: { NguoiDuyet: "", ThoiGianXuLy: "" },
            });
            throw error;
        }
        await this.YeuCau.updateOne({ _id: request._id, TrangThai: "DangDuyet" }, {
            $set: { TrangThai: "DaDuyet", MSNV: staff.MSNV, ThoiGianXuLy: new Date(), NguoiDuyet: reviewer.MSNV },
            $unset: { MatKhau: "" },
        });
        await new AuditLogService(this.client).record({
            action: "NHANVIEN_DUYET_DANG_KY", entityType: "yeucaunhanvien", entityId: request._id,
            actorType: "staff", actorId: reviewer.MSNV, actorName: reviewer.HoTenNV || actor.name,
            MSNV: staff.MSNV, TenNhanVien: staff.HoTenNV,
            Details: { HoTenNV: request.HoTenNV, SoDienThoai: request.SoDienThoai },
        });
        return { ...staff, _applicationId: request._id };
    }

    async reject(id, reason, actor) {
        if (!ObjectId.isValid(id)) return null;
        const reviewer = await this.resolveReviewer(actor);
        const safeReason = String(reason || "").trim().slice(0, 500);
        if (!safeReason) throw new Error("Vui lòng ghi rõ lý do từ chối hồ sơ.");
        const request = await this.YeuCau.findOneAndUpdate(
            { _id: new ObjectId(id), TrangThai: "ChoDuyet" },
            { $set: { TrangThai: "TuChoi", LyDoTuChoi: safeReason, NguoiDuyet: reviewer.MSNV, ThoiGianXuLy: new Date() } },
            { returnDocument: "after", projection: publicFields }
        );
        if (!request) return null;
        await new AuditLogService(this.client).record({
            action: "NHANVIEN_TU_CHOI_DANG_KY", entityType: "yeucaunhanvien", entityId: request._id,
            actorType: "staff", actorId: reviewer.MSNV, actorName: reviewer.HoTenNV || actor.name,
            Details: { HoTenNV: request.HoTenNV, SoDienThoai: request.SoDienThoai, reason: safeReason },
        });
        return request;
    }

    async matchLoginStatus(phone, password) {
        const request = await this.YeuCau.find(
            { SoDienThoai: String(phone || "").trim(), TrangThai: { $in: ["ChoDuyet", "TuChoi"] } },
            { projection: { MatKhau: 1, TrangThai: 1, LyDoTuChoi: 1 } }
        ).sort({ ThoiGianGui: -1 }).limit(1).next();
        if (!request || !await PasswordUtil.compare(password, request.MatKhau)) return null;
        return request.TrangThai === "ChoDuyet"
            ? { status: "ChoDuyet", message: "Hồ sơ nhân viên đang chờ Quản trị viên duyệt. Bạn chưa thể đăng nhập." }
            : { status: "TuChoi", message: `Hồ sơ đăng ký chưa được duyệt. Lý do: ${request.LyDoTuChoi || "Vui lòng liên hệ Quản trị viên."}` };
    }

    async lookupStatus(phone, password) {
        const normalizedPhone = String(phone || "").trim();
        const request = await this.YeuCau.find({
            SoDienThoai: normalizedPhone,
            TrangThai: { $in: ["ChoDuyet", "DangDuyet", "TuChoi"] },
        }, { projection: { ...publicFields, MatKhau: 1 } })
            .sort({ ThoiGianGui: -1 }).limit(1).next();

        if (request && request.MatKhau && await PasswordUtil.compare(String(password || ""), request.MatKhau)) {
            const { _id, HoTenNV, SoDienThoai, TrangThai, ThoiGianGui, ThoiGianXuLy, LyDoTuChoi } = request;
            return { _id, HoTenNV, SoDienThoai, TrangThai, ThoiGianGui, ThoiGianXuLy, LyDoTuChoi };
        }

        // Hồ sơ đã duyệt đã xóa hash mật khẩu ứng tuyển; xác thực bằng tài khoản STAFF vừa được tạo.
        const staffAuth = await new NhanVienService(this.client).loginWithStatus(normalizedPhone, String(password || ""));
        const staff = staffAuth.staff;
        if (!staff || staffAuth.status === "locked" || !staff.MaYeuCauDangKy) return null;
        const approved = await this.YeuCau.findOne({
            _id: new ObjectId(staff.MaYeuCauDangKy),
            SoDienThoai: normalizedPhone,
            TrangThai: "DaDuyet",
        }, { projection: publicFields });
        if (!approved) return null;
        const { _id, HoTenNV, SoDienThoai, TrangThai, ThoiGianGui, ThoiGianXuLy, MSNV } = approved;
        return { _id, HoTenNV, SoDienThoai, TrangThai, ThoiGianGui, ThoiGianXuLy, MSNV };
    }
}

module.exports = YeuCauNhanVienService;
