const TheoDoiMuonSachService = require("../services/theodoimuonsach.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.dangKyMuon = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const result = await service.createDangKy(req.body);
        return res.status(201).json({
            message: "Đăng ký mượn sách thành công! Đơn đang chờ thủ thư xét duyệt.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.duyetMuon = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const result = await service.duyetMuon(req.params.id);
        return res.json({
            message: "Duyệt yêu cầu mượn thành công. Đã trừ 1 cuốn trong kho.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.tuChoiMuon = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const { lyDo } = req.body;
        const result = await service.tuChoi(req.params.id, lyDo);
        return res.json({
            message: "Đã từ chối yêu cầu mượn sách.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.xacNhanTra = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const result = await service.xacNhanTra(req.params.id);
        return res.json({
            message: "Xác nhận trả sách thành công. Đã hoàn trả 1 cuốn về kho.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.baoMat = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const { ghiChu } = req.body;
        const result = await service.baoMat(req.params.id, ghiChu);
        return res.json({
            message: "Đã ghi nhận sự cố mất sách và tính tiền bồi hoàn.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const results = await service.find(req.query);
        return res.json(results);
    } catch (error) {
        return next(new ApiError(500, "Lỗi xảy ra khi lấy danh sách mượn sách."));
    }
};

exports.findOne = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const result = await service.findById(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy phiếu mượn."));
        }
        return res.json(result);
    } catch (error) {
        return next(new ApiError(500, `Lỗi khi lấy thông tin phiếu mượn id=${req.params.id}`));
    }
};

exports.delete = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const result = await service.delete(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy phiếu mượn để xóa."));
        }
        return res.json({ message: "Xóa phiếu mượn thành công." });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};
