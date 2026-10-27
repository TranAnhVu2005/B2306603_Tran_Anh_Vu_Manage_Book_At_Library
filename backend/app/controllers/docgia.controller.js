const DocGiaService = require("../services/docgia.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const ThongBaoService = require("../services/thongbao.service");
const AuditLogService = require("../services/audit-log.service");
const CloudinaryService = require("../services/cloudinary.service");

async function deleteAvatarIfUnreferenced(publicId) {
    if (!publicId) return;
    try {
        const reference = await MongoDB.client.db().collection("docgia").findOne({ AnhDaiDienPublicId: publicId }, { projection: { _id: 1 } });
        if (!reference) await CloudinaryService.deleteImage(publicId);
    } catch { /* Cleanup is best-effort; never hide the original request result. */ }
}

async function notifyReader(reader, type, title, message) {
    if (!reader?.MaDocGia) return;
    await new ThongBaoService(MongoDB.client).createSafely({
        recipientCode: reader.MaDocGia, recipientType: "docgia", type, title, message, reference: reader.MaDocGia,
    });
}

// Thêm một độc giả mới - Completed
exports.create = async (req, res, next) => {
    let uploadedAvatar;
    try {
        const service = new DocGiaService(MongoDB.client);
        if (req.file) {
            uploadedAvatar = await CloudinaryService.uploadImage(req.file, "library/avatars");
            req.body.AnhDaiDien = uploadedAvatar.secureUrl;
            req.body.AnhDaiDienPublicId = uploadedAvatar.publicId;
        }
        const result = await service.create(req.body);
        return res.status(201).json({
            message: "Đăng ký thẻ bạn đọc trực tuyến thành công.",
            data: result,
        });
    } catch (error) {
        if (uploadedAvatar) await deleteAvatarIfUnreferenced(uploadedAvatar.publicId);
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

// Tìm danh sách tất cả độc giả - Completed
exports.findAll = async (req, res, next) => {
    try {
        const service = new DocGiaService(MongoDB.client);
        if (req.query.includeDeleted === "true" && req.user?.role !== "ADMIN") {
            return next(new ApiError(403, "Chỉ quản trị viên mới được xem tài khoản đã xóa mềm."));
        }
        const results = await service.find({ ...req.query, includeDeleted: req.user?.role === "ADMIN" && req.query.includeDeleted === "true" });
        return res.json(results);
    } catch (error) {
        return next(new ApiError(500, "Lỗi xảy ra khi lấy danh sách độc giả."));
    }
};

// Tìm một độc giả - Completed
exports.findOne = async (req, res, next) => {
    try {
        const isSelf = req.user?.type === "reader" &&
            (req.user.id === req.params.id || req.user.username === req.params.id);
        if (!isSelf && req.user?.type !== "staff") {
            return next(new ApiError(403, "Bạn chỉ có thể xem hồ sơ của chính mình."));
        }
        const service = new DocGiaService(MongoDB.client);
        const result = await service.findById(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy hồ sơ độc giả."));
        }
        return res.json(result);
    } catch (error) {
        return next(new ApiError(500, `Lỗi khi lấy thông tin độc giả với id=${req.params.id}`));
    }
};

// Cập nhật thông tin độc giả - Completed
exports.update = async (req, res, next) => {
    let uploadedAvatar;
    try {
        const isOwnReaderProfile = req.user?.type === "reader" &&
            (req.user.id === req.params.id || req.user.username === req.params.id);
        if (!isOwnReaderProfile) {
            return next(new ApiError(403, "Bạn chỉ có thể cập nhật hồ sơ độc giả của chính mình."));
        }

        const service = new DocGiaService(MongoDB.client);
        const previousAvatar = req.file ? await service.findImageMetadata(req.params.id) : null;
        if (req.file) {
            uploadedAvatar = await CloudinaryService.uploadImage(req.file, "library/avatars");
            req.body.AnhDaiDien = uploadedAvatar.secureUrl;
            req.body.AnhDaiDienPublicId = uploadedAvatar.publicId;
        }

        const result = await service.update(req.params.id, req.body);
        if (!result) {
            if (uploadedAvatar) await deleteAvatarIfUnreferenced(uploadedAvatar.publicId);
            return next(new ApiError(404, "Không tìm thấy độc giả để cập nhật."));
        }
        if (previousAvatar?.AnhDaiDienPublicId) {
            await deleteAvatarIfUnreferenced(previousAvatar.AnhDaiDienPublicId);
        }
        return res.json({
            message: "Cập nhật hồ sơ độc giả thành công.",
            data: result,
        });
    } catch (error) {
        if (uploadedAvatar) await deleteAvatarIfUnreferenced(uploadedAvatar.publicId);
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

// Mở khóa thẻ - Completed
exports.unblock = async (req, res, next) => {
    try {
        if (req.user?.type !== "staff" || req.user?.role !== "ADMIN") {
            return next(new ApiError(403, "Chỉ Quản trị viên tối cao mới được mở khóa thẻ."));
        }

        const service = new DocGiaService(MongoDB.client);
        const result = await service.unblock(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy thẻ đang khóa để mở khóa."));
        }
        await notifyReader(
            result,
            "THE_MO_KHOA",
            result.TrangThaiThe === "DanhSachDen" ? "Thẻ vẫn thuộc danh sách đen" : "Thẻ thư viện đã được mở khóa",
            result.TrangThaiThe === "DanhSachDen"
                ? "Quản trị viên đã mở khóa khẩn cấp. Thẻ vẫn ở Danh sách đen do lịch sử vi phạm; vui lòng liên hệ thư viện để được xem xét."
                : "Quản trị viên đã mở khóa thẻ. Bạn có thể đăng ký mượn sách trở lại."
        );
        return res.json({
            message: result.TrangThaiThe === "DanhSachDen"
                ? "Đã mở khóa khẩn cấp; thẻ vẫn thuộc danh sách đen do có từ 3 lần vi phạm."
                : "Mở khóa thẻ khẩn cấp thành công. Số lần vi phạm được giữ nguyên.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

// Khóa thẻ - Completed
exports.lock = async (req, res, next) => {
    try {
        if (req.user?.type !== "staff" || req.user?.role !== "ADMIN") {
            return next(new ApiError(403, "Chỉ Quản trị viên tối cao mới được khóa thẻ khẩn cấp."));
        }

        const service = new DocGiaService(MongoDB.client);
        const result = await service.lock(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy độc giả để khóa thẻ."));
        }
        await notifyReader(result, "THE_KHOA", "Thẻ thư viện đã bị khóa", "Quản trị viên đã khóa thẻ của bạn. Bạn vẫn có thể xem hồ sơ và lịch sử; việc đăng ký mượn sẽ bị tạm dừng. Vui lòng liên hệ thư viện nếu cần hỗ trợ.");
        return res.json({
            message: "Đã khóa thẻ khẩn cấp. Số lần vi phạm được giữ nguyên.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

// Xét gỡ người dùng khỏi danh sách đen và bắt đầu lại bộ đếm vi phạm.
exports.reinstate = async (req, res, next) => {
    try {
        if (req.user?.type !== "staff" || req.user?.role !== "ADMIN") {
            return next(new ApiError(403, "Chỉ Quản trị viên tối cao mới được xét gỡ độc giả khỏi danh sách đen."));
        }

        const service = new DocGiaService(MongoDB.client);
        const previous = await service.findById(req.params.id);
        const result = await service.reinstate(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy độc giả đang ở trạng thái danh sách đen."));
        }
        await new AuditLogService(MongoDB.client).record({
            action: "READER_BLACKLIST_REINSTATED",
            entityType: "reader",
            entityId: result.MaDocGia,
            MaDocGia: result.MaDocGia,
            TenDocGia: [result.HoLot, result.Ten].filter(Boolean).join(" "),
            actorType: req.user.type,
            actorId: req.user.username,
            Details: {
                from: { TrangThaiThe: previous?.TrangThaiThe, SoLanViPham: previous?.SoLanViPham },
                to: { TrangThaiThe: result.TrangThaiThe, SoLanViPham: result.SoLanViPham },
            },
        });
        await notifyReader(result, "THE_GO_DANH_SACH_DEN", "Thẻ đã được gỡ khỏi danh sách đen", "Quản trị viên đã xét gỡ thẻ của bạn khỏi Danh sách đen và đặt lại số lần vi phạm về 0. Bạn có thể tiếp tục sử dụng các chức năng theo trạng thái thẻ hiện tại.");
        return res.json({
            message: "Đã gỡ thẻ khỏi danh sách đen sau khi xét duyệt và đặt lại số lần vi phạm về 0.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

// Hàm xóa người dùng khỏi cơ sở dữ liệu - Completed
exports.delete = async (req, res, next) => {
    try {
        const service = new DocGiaService(MongoDB.client);
        const result = await service.delete(req.params.id, req.user?.username);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy độc giả để xóa."));
        }
        await new AuditLogService(MongoDB.client).record({
            action: "READER_SOFT_DELETED",
            entityType: "reader",
            entityId: result.MaDocGia,
            MaDocGia: result.MaDocGia,
            TenDocGia: [result.HoLot, result.Ten].filter(Boolean).join(" "),
            actorType: req.user?.type,
            actorId: req.user?.username,
            Details: { to: "XoaMem" },
        });
        return res.json({ message: "Đã chuyển hồ sơ độc giả vào trạng thái xóa mềm." });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

exports.restore = async (req, res, next) => {
    try {
        const service = new DocGiaService(MongoDB.client);
        const result = await service.restore(req.params.id);
        if (!result) return next(new ApiError(404, "Không tìm thấy độc giả đã xóa mềm để khôi phục."));
        await new AuditLogService(MongoDB.client).record({
            action: "READER_RESTORED", entityType: "reader", entityId: result.MaDocGia,
            MaDocGia: result.MaDocGia, TenDocGia: [result.HoLot, result.Ten].filter(Boolean).join(" "),
            actorType: req.user?.type, actorId: req.user?.username, Details: { from: "XoaMem", to: "HoatDong" },
        });
        return res.json({ message: "Đã khôi phục hồ sơ độc giả.", data: result });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};
