const DocGiaService = require("../services/docgia.service");
const NhanVienService = require("../services/nhanvien.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.login = async (req, res, next) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return next(new ApiError(400, "Vui lòng nhập tài khoản và mật khẩu."));
        }

        const nhanVienService = new NhanVienService(MongoDB.client);
        const docGiaService = new DocGiaService(MongoDB.client);

        // 1. Thử đăng nhập Nhân viên
        const staff = await nhanVienService.login(identifier, password);
        if (staff) {
            return res.json({
                message: "Đăng nhập thành công với tư cách Nhân viên.",
                data: {
                    _id: staff._id,
                    username: staff.MSNV,
                    fullName: staff.HoTenNV,
                    role: staff.ChucVu === "ADMIN" ? "ADMIN" : "MANAGER",
                    chucVu: staff.ChucVu,
                    phone: staff.SoDienThoai,
                }
            });
        }

        // 2. Thử đăng nhập Độc giả
        const reader = await docGiaService.login(identifier, password);
        if (reader) {
            return res.json({
                message: "Đăng nhập thành công với tư cách Độc giả.",
                data: {
                    _id: reader._id,
                    username: reader.MaDocGia,
                    fullName: `${reader.HoLot} ${reader.Ten}`,
                    role: reader.Role || "USER", // có thể là USER, MANAGER hoặc ADMIN nếu đã được thăng cấp
                    phone: reader.DienThoai,
                    trangThaiThe: reader.TrangThaiThe,
                    soLanViPham: reader.SoLanViPham || 0,
                }
            });
        }

        return next(new ApiError(401, "Tài khoản hoặc mật khẩu không chính xác."));
    } catch (error) {
        return next(new ApiError(500, "Lỗi xảy ra trong quá trình đăng nhập."));
    }
};

exports.registerDocGia = async (req, res, next) => {
    try {
        const service = new DocGiaService(MongoDB.client);
        const result = await service.create(req.body);
        return res.status(201).json({
            message: "Đăng ký tài khoản độc giả thành công.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};
