const TheLoaiService = require("../services/theloai.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.findAll = async (_req, res, next) => {
    try {
        const result = await new TheLoaiService(MongoDB.client).findAll();
        return res.json(result);
    } catch {
        return next(new ApiError(500, "Không thể tải danh mục thể loại sách."));
    }
};
