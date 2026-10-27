const NhanVienService = require("../services/nhanvien.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const ThongBaoService = require("../services/thongbao.service");
const AuditLogService = require("../services/audit-log.service");
const CloudinaryService = require("../services/cloudinary.service");

async function deleteAvatarIfUnreferenced(publicId) {
    if (!publicId) return;
    try {
        const reference = await MongoDB.client.db().collection("nhanvien").findOne({ AnhDaiDienPublicId: publicId }, { projection: { _id: 1 } });
        if (!reference) await CloudinaryService.deleteImage(publicId);
    } catch { /* Cleanup is best-effort; never hide the original request result. */ }
}

// Tạo tài khoản nhân viên - Completed
exports.create = async (req, res, next) => {
    let uploadedAvatar;
    try {
        const service = new NhanVienService(MongoDB.client);
        if (req.file) {
            uploadedAvatar = await CloudinaryService.uploadImage(req.file, "library/avatars");
            req.body.AnhDaiDien = uploadedAvatar.secureUrl;
            req.body.AnhDaiDienPublicId = uploadedAvatar.publicId;
        }
        const result = await service.create(req.body);
        await new ThongBaoService(MongoDB.client).createSafely({
            recipientCode: result.MSNV,
            recipientType: "nhanvien",
            type: "TAO_TAI_KHOAN_NHAN_VIEN",
            title: "Tài khoản nhân viên đã được tạo",
            message: `Quản trị viên đã tạo tài khoản ${result.MSNV} cho bạn. Bạn có thể đăng nhập vào cổng quản lý bằng thông tin được cấp.`,
            reference: result.MSNV,
        });
        return res.status(201).json({
            message: "Tạo tài khoản nhân viên thành công.",
            data: result,
        });
    } catch (error) {
        if (uploadedAvatar) await deleteAvatarIfUnreferenced(uploadedAvatar.publicId);
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

//Hàm tìm tất cả nhân viên - Completed
exports.findAll = async (req, res, next) => {
    try {
        const service = new NhanVienService(MongoDB.client);
        if (req.query.includeDeleted === "true" && req.user?.role !== "ADMIN") {
            return next(new ApiError(403, "Chỉ quản trị viên mới được xem tài khoản đã xóa mềm."));
        }
        const results = await service.find({ ...req.query, includeDeleted: req.user?.role === "ADMIN" && req.query.includeDeleted === "true" });
        return res.json(results);
    } catch (error) {
        return next(new ApiError(500, "Lỗi xảy ra khi lấy danh sách nhân viên."));
    }
};

//Lấy thông tin một nhân viên - Completed
exports.findOne = async (req, res, next) => {
    try {
        const service = new NhanVienService(MongoDB.client);
        const result = await service.findById(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy thông tin nhân viên."));
        }
        return res.json(result);
    } catch (error) {
        return next(new ApiError(500, `Lỗi khi lấy thông tin nhân viên với id=${req.params.id}`));
    }
};

// Cập nhật hồ sơ nhân viên - Completed
exports.update = async (req, res, next) => {
    let uploadedAvatar;
    try {
        const isOwnStaffProfile = req.user?.type === "staff" &&
            (req.user.id === req.params.id || req.user.username === req.params.id);
        if (!isOwnStaffProfile) {
            return next(new ApiError(403, "Bạn chỉ có thể cập nhật hồ sơ nhân viên của chính mình."));
        }

        const service = new NhanVienService(MongoDB.client);
        const previousAvatar = req.file ? await service.findImageMetadata(req.params.id) : null;
        if (req.file) {
            uploadedAvatar = await CloudinaryService.uploadImage(req.file, "library/avatars");
            req.body.AnhDaiDien = uploadedAvatar.secureUrl;
            req.body.AnhDaiDienPublicId = uploadedAvatar.publicId;
        }
        const result = await service.update(req.params.id, req.body);
        if (!result) {
            if (uploadedAvatar) await deleteAvatarIfUnreferenced(uploadedAvatar.publicId);
            return next(new ApiError(404, "Không tìm thấy nhân viên để cập nhật."));
        }
        if (previousAvatar?.AnhDaiDienPublicId) {
            await deleteAvatarIfUnreferenced(previousAvatar.AnhDaiDienPublicId);
        }
        return res.json({
            message: "Cập nhật thông tin nhân viên thành công.",
            data: result,
        });
    } catch (error) {
        if (uploadedAvatar) await deleteAvatarIfUnreferenced(uploadedAvatar.publicId);
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

// Xóa hồ sơ nhân viên - Completed
exports.delete = async (req, res, next) => {
    try {
        const service = new NhanVienService(MongoDB.client);
        const result = await service.delete(req.params.id, req.user?.username);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy nhân viên để xóa."));
        }
        await new AuditLogService(MongoDB.client).record({
            action: "STAFF_SOFT_DELETED", entityType: "staff", entityId: result.MSNV,
            MSNV: result.MSNV, TenNhanVien: result.HoTenNV,
            actorType: req.user?.type, actorId: req.user?.username,
            Details: { to: "XoaMem" },
        });
        return res.json({ message: "Đã chuyển tài khoản nhân viên vào trạng thái xóa mềm." });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

exports.restore = async (req, res, next) => {
    try {
        const service = new NhanVienService(MongoDB.client);
        const result = await service.restore(req.params.id);
        if (!result) return next(new ApiError(404, "Không tìm thấy nhân viên đã xóa mềm để khôi phục."));
        await new AuditLogService(MongoDB.client).record({
            action: "STAFF_RESTORED", entityType: "staff", entityId: result.MSNV,
            MSNV: result.MSNV, TenNhanVien: result.HoTenNV,
            actorType: req.user?.type, actorId: req.user?.username, Details: { from: "XoaMem", to: "HoatDong" },
        });
        return res.json({ message: "Đã khôi phục tài khoản nhân viên.", data: result });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

async function updateStaffAccountStatus(req, res, next, status) {
    try {
        const reason = typeof req.body?.LyDo === "string" ? req.body.LyDo.trim() : "";
        if (!reason || reason.length > 500) {
            return next(new ApiError(400, "Vui lòng nhập lý do từ 1 đến 500 ký tự."));
        }

        const service = new NhanVienService(MongoDB.client);
        const result = await service.setAccountStatus(req.params.id, status, {
            id: req.user?.id,
            username: req.user?.username,
        });
        const locked = status === "Khoa";
        const action = locked ? "STAFF_ACCOUNT_LOCKED" : "STAFF_ACCOUNT_UNLOCKED";
        const verb = locked ? "khóa" : "mở khóa";

        await new AuditLogService(MongoDB.client).record({
            action,
            entityType: "staff",
            entityId: result.MSNV,
            actorType: "staff",
            actorId: req.user.username,
            actorName: req.user.HoTenNV,
            MSNV: result.MSNV,
            TenNhanVien: result.HoTenNV,
            Details: { reason, from: locked ? "HoatDong" : "Khoa", to: status },
        });
        await new ThongBaoService(MongoDB.client).createSafely({
            recipientCode: result.MSNV,
            recipientType: "nhanvien",
            type: locked ? "TAI_KHOAN_NHAN_VIEN_BI_KHOA" : "TAI_KHOAN_NHAN_VIEN_DUOC_MO_KHOA",
            title: locked ? "Tài khoản nhân viên đã bị khóa" : "Tài khoản nhân viên đã được mở khóa",
            message: locked
                ? `Quản trị viên đã khóa tài khoản của bạn. Lý do: ${reason}`
                : `Quản trị viên đã mở khóa tài khoản của bạn. Lý do: ${reason}`,
            reference: result.MSNV,
        });

        return res.json({
            message: locked ? "Đã khóa tài khoản thủ thư." : "Đã mở khóa tài khoản thủ thư.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
}

exports.lockAccount = (req, res, next) => updateStaffAccountStatus(req, res, next, "Khoa");
exports.unlockAccount = (req, res, next) => updateStaffAccountStatus(req, res, next, "HoatDong");
