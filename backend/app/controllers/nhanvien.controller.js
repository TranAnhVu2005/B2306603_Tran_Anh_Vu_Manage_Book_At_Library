const NhanVienService = require("../services/nhanvien.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const ThongBaoService = require("../services/thongbao.service");
const AuditLogService = require("../services/audit-log.service");

// Tạo tài khoản nhân viên - Completed
exports.create = async (req, res, next) => {
    try {
        const service = new NhanVienService(MongoDB.client);


        const result = await service.create(req.body);
        await new ThongBaoService(MongoDB.client).createSafely({
            recipientId: String(result._id),
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
        return next(new ApiError(400, error.message));
    }
};

//Hàm tìm tất cả nhân viên - Completed
exports.findAll = async (req, res, next) => {
    try {
        const service = new NhanVienService(MongoDB.client);
        const results = await service.find(req.query);
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
    try {
        const isOwnStaffProfile = req.user?.type === "staff" &&
            (req.user.id === req.params.id || req.user.username === req.params.id);
        if (!isOwnStaffProfile) {
            return next(new ApiError(403, "Bạn chỉ có thể cập nhật hồ sơ nhân viên của chính mình."));
        }

        const service = new NhanVienService(MongoDB.client);

        if (req.file) {
            req.body.AnhDaiDien = `/uploads/avatars/${req.file.filename}`;
        }
        const result = await service.update(req.params.id, req.body);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy nhân viên để cập nhật."));
        }
        return res.json({
            message: "Cập nhật thông tin nhân viên thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

// Xóa hồ sơ nhân viên - Completed
exports.delete = async (req, res, next) => {
    try {
        const service = new NhanVienService(MongoDB.client);
        const result = await service.delete(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy nhân viên để xóa."));
        }
        return res.json({ message: "Xóa nhân viên thành công." });
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
            recipientId: String(result._id),
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
