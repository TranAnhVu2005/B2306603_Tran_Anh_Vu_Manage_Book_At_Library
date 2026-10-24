const ThongBaoService = require("../services/thongbao.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

const recipientType = (user) => user.type === "reader" ? "docgia" : "nhanvien";

exports.findMine = async (req, res, next) => {
    try {
        const service = new ThongBaoService(MongoDB.client);
        const result = await service.findForRecipient(req.user.id, recipientType(req.user), req.query.limit);
        return res.json(result);
    } catch (error) {
        return next(new ApiError(500, "Không thể tải thông báo của bạn."));
    }
};

exports.markRead = async (req, res, next) => {
    try {
        const service = new ThongBaoService(MongoDB.client);
        const updated = await service.markRead(req.params.id, req.user.id, recipientType(req.user));
        if (!updated) return next(new ApiError(404, "Không tìm thấy thông báo."));
        return res.json({ message: "Đã đánh dấu thông báo là đã đọc." });
    } catch (error) {
        return next(new ApiError(500, "Không thể cập nhật thông báo."));
    }
};

exports.markAllRead = async (req, res, next) => {
    try {
        const service = new ThongBaoService(MongoDB.client);
        const modifiedCount = await service.markAllRead(req.user.id, recipientType(req.user));
        return res.json({ message: "Đã đánh dấu tất cả thông báo là đã đọc.", data: { modifiedCount } });
    } catch (error) {
        return next(new ApiError(500, "Không thể cập nhật thông báo."));
    }
};
