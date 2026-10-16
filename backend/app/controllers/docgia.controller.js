const DocGiaService = require("../services/docgia.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

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

// Tìm danh sách tất cả độc giả
exports.findAll = async (req, res, next) => {
    try {
        const service = new DocGiaService(MongoDB.client);
        const results = await service.find(req.query);
        return res.json(results);
    } catch (error) {
        return next(new ApiError(500, "Lỗi xảy ra khi lấy danh sách độc giả."));
    }
};

exports.findOne = async (req, res, next) => {
    try {
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

exports.update = async (req, res, next) => {
    try {
        const service = new DocGiaService(MongoDB.client);
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
        return res.json({
            message: `Phân quyền thành công vai trò '${role}'.`,
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

exports.unblock = async (req, res, next) => {
    try {
        const service = new DocGiaService(MongoDB.client);
        const result = await service.unblock(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy độc giả để mở khóa."));
        }
        return res.json({
            message: "Mở khóa độc giả khỏi Blacklist thành công. Số lần vi phạm đã reset về 0.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

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
