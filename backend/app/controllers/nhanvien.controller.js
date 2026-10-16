const NhanVienService = require("../services/nhanvien.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

// Tạo tài khoản nhân viên, sử dụng thông qua api, không dùng trên giao diện
exports.create = async (req, res, next) => {
    try {
        const service = new NhanVienService(MongoDB.client);
        const result = await service.create(req.body);
        return res.status(201).json({
            message: "Tạo tài khoản nhân viên thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const service = new NhanVienService(MongoDB.client);
        const results = await service.find(req.query);
        return res.json(results);
    } catch (error) {
        return next(new ApiError(500, "Lỗi xảy ra khi lấy danh sách nhân viên."));
    }
};

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

exports.update = async (req, res, next) => {
    try {
        const isOwnStaffProfile = req.user?.type === "staff" &&
            (req.user.id === req.params.id || req.user.username === req.params.id);
        if (!isOwnStaffProfile) {
            return next(new ApiError(403, "Bạn chỉ có thể cập nhật hồ sơ nhân viên của chính mình."));
        }

        const service = new NhanVienService(MongoDB.client);
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
