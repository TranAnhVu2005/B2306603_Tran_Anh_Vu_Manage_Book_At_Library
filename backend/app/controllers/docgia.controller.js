const DocGiaService = require("../services/docgia.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const ThongBaoService = require("../services/thongbao.service");

async function notifyReader(reader, type, title, message) {
    if (!reader?._id) return;
    await new ThongBaoService(MongoDB.client).createSafely({
        recipientId: String(reader._id), recipientType: "docgia", type, title, message, reference: reader.MaDocGia,
    });
}

// Thêm một độc giả mới - Completed
exports.create = async (req, res, next) => {
    try {
        const service = new DocGiaService(MongoDB.client);

        const result = await service.create(req.body);
        return res.status(201).json({
            message: "Đăng ký thẻ bạn đọc trực tuyến thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

// Tìm danh sách tất cả độc giả - Completed
exports.findAll = async (req, res, next) => {
    try {
        const service = new DocGiaService(MongoDB.client);
        const results = await service.find(req.query);
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
    try {
        const isOwnReaderProfile = req.user?.type === "reader" &&
            (req.user.id === req.params.id || req.user.username === req.params.id);
        if (!isOwnReaderProfile) {
            return next(new ApiError(403, "Bạn chỉ có thể cập nhật hồ sơ độc giả của chính mình."));
        }

        const service = new DocGiaService(MongoDB.client);


        if (req.file) {
            req.body.AnhDaiDien = `/uploads/avatars/${req.file.filename}`;
        }

        const result = await service.update(req.params.id, req.body);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy độc giả để cập nhật."));
        }
        return res.json({
            message: "Cập nhật hồ sơ độc giả thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

// Cập nhật vai trò - Completed
exports.updateRole = async (req, res, next) => {
    try {
        const { role } = req.body;
        if (!role) {
            return next(new ApiError(400, "Vui lòng chỉ định vai trò mới (USER, MANAGER, ADMIN)."));
        }
        const service = new DocGiaService(MongoDB.client);
        const result = await service.updateRole(req.params.id, role);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy người dùng để phân quyền."));
        }
        await notifyReader(
            result,
            "VAI_TRO_CAP_NHAT",
            "Vai trò tài khoản đã được cập nhật",
            result.VaiTro === "MANAGER"
                ? "Tài khoản của bạn đã được cấp quyền Quản lý / Thủ thư."
                : "Tài khoản của bạn hiện có quyền Độc giả."
        );
        return res.json({
            message: `Phân quyền thành công vai trò '${role}'.`,
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
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

// Xét gỡ người dùng khỏi danh sách đen nhưng giữ lịch sử vi phạm.
exports.reinstate = async (req, res, next) => {
    try {
        if (req.user?.type !== "staff" || req.user?.role !== "ADMIN") {
            return next(new ApiError(403, "Chỉ Quản trị viên tối cao mới được xét gỡ độc giả khỏi danh sách đen."));
        }

        const service = new DocGiaService(MongoDB.client);
        const result = await service.reinstate(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy độc giả đang ở trạng thái danh sách đen."));
        }
        await notifyReader(result, "THE_GO_DANH_SACH_DEN", "Thẻ đã được gỡ khỏi danh sách đen", "Quản trị viên đã xét gỡ thẻ của bạn khỏi Danh sách đen. Lịch sử vi phạm vẫn được lưu; bạn có thể tiếp tục sử dụng các chức năng theo trạng thái thẻ hiện tại.");
        return res.json({
            message: "Đã gỡ thẻ khỏi danh sách đen sau khi xét duyệt. Lịch sử vi phạm được giữ nguyên.",
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
        const result = await service.delete(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy độc giả để xóa."));
        }
        return res.json({ message: "Xóa hồ sơ độc giả thành công." });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};
