const AuditLogService = require("../services/audit-log.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.findAll = async (req, res, next) => {
    try {
        const allowed = ["HanhDong", "LoaiDoiTuong", "MaSach", "MaDocGia", "MSNV", "from", "to", "limit", "skip"];
        const unknown = Object.keys(req.query).filter((key) => !allowed.includes(key));
        if (unknown.length) return next(new ApiError(400, `Tham số lọc không được hỗ trợ: ${unknown.join(", ")}.`));

        for (const [key, value] of Object.entries(req.query)) {
            if (typeof value !== "string" || value.length > 120) {
                return next(new ApiError(400, `Tham số '${key}' phải là một giá trị đơn không quá 120 ký tự.`));
            }
        }

        for (const field of ["from", "to"]) {
            if (req.query[field] && Number.isNaN(Date.parse(req.query[field]))) {
                return next(new ApiError(400, `Thời gian '${field}' không hợp lệ.`));
            }
        }
        if (req.query.from && req.query.to && new Date(req.query.from) > new Date(req.query.to)) {
            return next(new ApiError(400, "Khoảng thời gian lọc không hợp lệ."));
        }
        const service = new AuditLogService(MongoDB.client);
        return res.json(await service.find(req.query));
    } catch (error) {
        return next(new ApiError(500, "Không thể tải nhật ký kiểm toán."));
    }
};
