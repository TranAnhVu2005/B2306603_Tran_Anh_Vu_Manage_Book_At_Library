const TheoDoiMuonSachService = require("../services/theodoimuonsach.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

// Đăng ký mượn sách - Tạo một đăng ký mượn - Completed
exports.dangKyMuon = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        if (req.body.MaDocGia && req.body.MaDocGia !== req.user.username) {
            return next(new ApiError(403, "Chỉ có thể đăng ký mượn bằng tài khoản độc giả đang đăng nhập."));
        }
        const result = await service.createDangKy({ ...req.body, MaDocGia: req.user.username });
        return res.status(201).json({
            message: "Đăng ký mượn sách thành công! Đơn đang chờ thủ thư xét duyệt.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

// Duyệt mượn - Completed
exports.duyetMuon = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);

        // 1. Lấy MSNV trực tiếp từ token của nhân viên đang đăng nhập (thông qua middleware xác thực)
        // (Giả sử middleware authenticate của bạn đã gán thông tin vào req.user)
        const msnv = req.user?.username;

        if (!msnv) {
            return next(new ApiError(401, "Không xác định được danh tính nhân viên thực hiện thao tác này."));
        }

        const result = await service.duyetMuon(req.params.id, msnv);
        return res.json({
            message: "Duyệt yêu cầu mượn thành công. Đã xuất kho 1 cuốn và hẹn trả sau 14 ngày.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

//Từ chối mượn - Completed
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

// Xác nhận trả - Completed
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
            message: "Đã ghi nhận sự cố mất sách và tính tiền bồi thường.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

// Tìm tất cả các theo dõi mượn sách - Completed
exports.findAll = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const filters = { ...req.query };
        if (req.user.type === "reader") filters.maDocGia = req.user.username;
        const results = await service.find(filters);
        return res.json(results);
    } catch (error) {
        return next(new ApiError(500, "Lỗi xảy ra khi lấy danh sách mượn sách."));
    }
};

// Tìm 1 phiếu mượn - Completed 
exports.findOne = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const result = await service.findById(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy phiếu mượn."));
        }
        if (req.user.type === "reader" && result.MaDocGia !== req.user.username) {
            return next(new ApiError(403, "Bạn không có quyền xem phiếu mượn của độc giả khác."));
        }
        return res.json(result);
    } catch (error) {
        return next(new ApiError(500, `Lỗi khi lấy thông tin phiếu mượn id=${req.params.id}`));
    }
};

// Xóa phiếu mượn - Completed
exports.delete = async (req, res, next) => {
    try {
        const service = new TheoDoiMuonSachService(MongoDB.client);
        const result = await service.delete(req.params.id);
        if (!result) {
            return next(new ApiError(404, "Không tìm thấy phiếu mượn để xóa."));
        }
        return res.json({ message: "Xóa phiếu mượn lưu trữ thành công." });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};
