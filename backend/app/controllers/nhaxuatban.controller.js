const NhaXuatBanService = require("../services/nhaxuatban.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.create = async (req, res, next) => {
    try {
        const service = new NhaXuatBanService(MongoDB.client);
        const result = await service.create(req.body);
        return res.status(201).json({
            message: "Tạo nhà xuất bản thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const service = new NhaXuatBanService(MongoDB.client);
        const results = await service.find(req.query);
        return res.json(results);
    } catch (error) {
        return next(new ApiError(500, "Lỗi xảy ra khi lấy danh sách nhà xuất bản."));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const service = new NhaXuatBanService(MongoDB.client);
        const result = await service.findById(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy nhà xuất bản."));
        }
        return res.json(result);
    } catch (error) {
        return next(new ApiError(500, `Lỗi khi lấy thông tin NXB với id=${req.params.id}`));
    }
};

exports.update = async (req, res, next) => {
    try {
        const service = new NhaXuatBanService(MongoDB.client);
        const result = await service.update(req.params.id, req.body);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy nhà xuất bản để cập nhật."));
        }
        return res.json({
            message: "Cập nhật nhà xuất bản thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const service = new NhaXuatBanService(MongoDB.client);
        const result = await service.delete(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy nhà xuất bản để xóa."));
        }
        return res.json({ message: "Xóa nhà xuất bản thành công." });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};
