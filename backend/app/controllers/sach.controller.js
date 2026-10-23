const SachService = require("../services/sach.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

// Thêm sách mới - Completed
exports.create = async (req, res, next) => {
    try {
        const service = new SachService(MongoDB.client);
        if (req.file) {
            req.body.HinhAnh = `/uploads/books/${req.file.filename}`;
        }
        const result = await service.create(req.body, req.user);
        return res.status(201).json({
            message: "Thêm sách mới thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

// Tìm tất cả sách - Completed
exports.findAll = async (req, res, next) => {
    try {
        const service = new SachService(MongoDB.client);
        const filters = { ...req.query };
        if (filters.includeDeleted === "true" && req.user?.role !== "ADMIN") {
            return next(new ApiError(403, "Chỉ Admin được xem sách đã xóa mềm."));
        }
        const results = await service.find(filters);
        return res.json(results);
    } catch (error) {
        return next(new ApiError(500, "Lỗi xảy ra khi lấy danh sách sách."));
    }
};

// Tìm chi tiết sách - Completed
exports.findOne = async (req, res, next) => {
    try {
        const service = new SachService(MongoDB.client);
        const result = await service.findById(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy cuốn sách yêu cầu."));
        }
        return res.json(result);
    } catch (error) {
        return next(new ApiError(500, `Lỗi khi lấy thông tin sách với id=${req.params.id}`));
    }
};

// Cập nhật thông tin sách - Completed
exports.update = async (req, res, next) => {
    try {
        const service = new SachService(MongoDB.client);

        if (req.file) {
            req.body.HinhAnh = `/uploads/books/${req.file.filename}`;
        }
        const result = await service.update(req.params.id, req.body, req.user);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy sách để cập nhật."));
        }
        return res.json({
            message: "Cập nhật thông tin sách thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

// Xóa sách - Completed
exports.delete = async (req, res, next) => {
    try {
        const service = new SachService(MongoDB.client);
        const result = await service.delete(req.params.id, req.user);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy sách để xóa."));
        }
        return res.json({ message: "Đã chuyển sách sang trạng thái xóa mềm; dữ liệu và lịch sử vẫn được lưu." });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

exports.restore = async (req, res, next) => {
    try {
        const service = new SachService(MongoDB.client);
        const result = await service.restore(req.params.id, req.user);
        if (!result) return next(new ApiError(404, "Không tìm thấy sách đã xóa mềm để khôi phục."));
        return res.json({ message: "Đã khôi phục sách vào danh mục đang hoạt động." });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};
