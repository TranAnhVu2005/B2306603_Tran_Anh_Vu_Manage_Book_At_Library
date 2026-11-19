const PayosService = require("../services/payos.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.createPayment = async (req, res, next) => {
    try {
        const { borrowId, ghiChu, forceNew } = req.body || {};
        if (!borrowId || typeof borrowId !== "string") {
            return next(new ApiError(400, "Vui lòng cung cấp mã phiếu mượn (borrowId) hợp lệ."));
        }
        const service = new PayosService(MongoDB.client);
        const result = await service.reportLostAndCreatePayment(borrowId, req.user.username, {
            ghiChu,
            forceNew: forceNew === true || forceNew === "true",
        });
        return res.status(201).json({
            message: "Đã khởi tạo mã thanh toán đền bù PayOS. Vui lòng quét mã QR hoặc mở cổng thanh toán để chuyển khoản.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.getByBorrowId = async (req, res, next) => {
    try {
        const service = new PayosService(MongoDB.client);
        const result = await service.getLatestByBorrowId(req.params.borrowId, req.user);
        return res.json({ data: result });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.confirmTransfer = async (req, res, next) => {
    try {
        const service = new PayosService(MongoDB.client);
        const result = await service.confirmTransferByReader(
            req.params.borrowId,
            req.user.username,
            req.body || {}
        );
        return res.json({
            message: "Đã ghi nhận xác nhận chuyển khoản đền bù. Yêu cầu đang chờ quản trị viên xét duyệt.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.syncOrder = async (req, res, next) => {
    try {
        const service = new PayosService(MongoDB.client);
        const result = await service.syncOrderByOrderCode(req.params.orderCode, req.user.username);
        return res.json({
            message: "Đã đồng bộ trạng thái thanh toán PayOS và gửi yêu cầu chờ quản trị viên duyệt.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.webhook = async (req, res, next) => {
    try {
        const service = new PayosService(MongoDB.client);
        const result = await service.handleWebhook(req.body);
        return res.json({ success: true, data: result });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        const service = new PayosService(MongoDB.client);
        const data = await service.findAll(req.query || {}, req.user);
        return res.json({ data });
    } catch (error) {
        return next(new ApiError(error.statusCode || 500, error.message || "Lỗi khi tải danh sách giao dịch đền bù."));
    }
};

exports.approve = async (req, res, next) => {
    try {
        const service = new PayosService(MongoDB.client);
        const result = await service.approveTransaction(req.params.id, req.user);
        return res.json({
            message: "Đã duyệt xác nhận đền bù mất sách qua PayOS thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};

exports.reject = async (req, res, next) => {
    try {
        const service = new PayosService(MongoDB.client);
        const { lyDo } = req.body || {};
        const result = await service.rejectTransaction(req.params.id, req.user, lyDo);
        return res.json({
            message: "Đã từ chối yêu cầu xác nhận đền bù mất sách.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};
