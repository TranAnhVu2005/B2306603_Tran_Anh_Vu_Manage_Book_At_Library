const DocGiaService = require("../services/docgia.service");
const NhanVienService = require("../services/nhanvien.service");
const googleAuthService = require("../services/google-auth.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

/**
 * Controller xử lý xác thực tài khoản (Đăng nhập, Đăng ký, Đăng nhập Google)
 */
class AuthController {
    /**
     * Đăng nhập hợp nhất cho toàn bộ hệ thống (Độc giả, Thủ thư, Quản trị viên)
     * POST /api/auth/login
     */
    async login(req, res, next) {
        try {
            const { identifier, password } = req.body;
            if (!identifier || !password) {
                return next(new ApiError(400, "Vui lòng nhập số điện thoại/tài khoản và mật khẩu."));
            }

            const nhanVienService = new NhanVienService(MongoDB.client);
            const docGiaService = new DocGiaService(MongoDB.client);

            // 1. Kiểm tra tài khoản Nhân viên / Quản trị viên trước
            const staff = await nhanVienService.login(identifier, password);
            if (staff) {
                const role = (staff.ChucVu === "ADMIN") ? "ADMIN" : "MANAGER";
                return res.json({
                    message: `Đăng nhập thành công với vai trò ${role === "ADMIN" ? "Quản trị viên (Super Admin)" : "Thủ thư (Manager)"}.`,
                    data: {
                        _id: staff._id,
                        username: staff.MSNV,
                        fullName: staff.HoTenNV,
                        role: role,
                        chucVu: staff.ChucVu,
                        phone: staff.SoDienThoai,
                        diaChi: staff.DiaChi,
                    }
                });
            }

            // 2. Kiểm tra tài khoản Độc giả
            const reader = await docGiaService.login(identifier, password);
            if (reader) {
                return res.json({
                    message: "Đăng nhập thành công với vai trò Độc giả.",
                    data: {
                        _id: reader._id,
                        username: reader.MaDocGia,
                        fullName: `${reader.HoLot} ${reader.Ten}`.trim(),
                        role: reader.Role || "USER",
                        phone: reader.DienThoai,
                        diaChi: reader.DiaChi,
                        phai: reader.Phai,
                        trangThaiThe: reader.TrangThaiThe,
                        soLanViPham: reader.SoLanViPham || 0,
                    }
                });
            }

            // Không tìm thấy hoặc sai mật khẩu
            return next(new ApiError(401, "Tài khoản hoặc mật khẩu không chính xác."));
        } catch (error) {
            return next(new ApiError(500, "Lỗi xảy ra trong quá trình xác thực đăng nhập."));
        }
    }

    /**
     * Đăng ký thẻ độc giả mới trực tuyến
     * POST /api/auth/register
     */
    async registerDocGia(req, res, next) {
        try {
            const service = new DocGiaService(MongoDB.client);
            const result = await service.create(req.body);
            return res.status(201).json({
                message: "Đăng ký thẻ bạn đọc trực tuyến thành công!",
                data: result,
            });
        } catch (error) {
            return next(new ApiError(400, error.message));
        }
    }

    /**
     * Đăng nhập hoặc Đăng ký nhanh thông qua tài khoản Google OAuth 2.0
     * POST /api/auth/google
     */
    async loginWithGoogle(req, res, next) {
        try {
            const { idToken, credential } = req.body;
            const token = idToken || credential;

            if (!token) {
                return next(new ApiError(400, "Thiếu Google ID Token hoặc thông tin chứng thực."));
            }

            // 1. Xác thực Google Token thông qua GoogleAuthService
            const googleProfile = await googleAuthService.verifyIdToken(token);

            const docGiaService = new DocGiaService(MongoDB.client);
            const db = MongoDB.client.db();

            // 2. Tìm tài khoản độc giả liên kết với Email hoặc GoogleId này
            let reader = await db.collection("docgia").findOne({
                $or: [
                    { GoogleId: googleProfile.googleId },
                    { Email: googleProfile.email },
                    { DienThoai: `GG_${String(googleProfile.googleId).slice(-8)}` }
                ]
            });

            // 3. Nếu chưa có -> Tự động đăng ký thẻ độc giả mới
            if (!reader) {
                const newReaderData = googleAuthService.formatReaderFromGoogleProfile(googleProfile);
                newReaderData.MaDocGia = await docGiaService.generateMaDocGia();
                newReaderData.CreatedAt = new Date();
                newReaderData.UpdatedAt = new Date();

                const insertRes = await db.collection("docgia").insertOne(newReaderData);
                reader = await docGiaService.findById(insertRes.insertedId);
            }

            return res.json({
                message: "Đăng nhập bằng tài khoản Google thành công.",
                data: {
                    _id: reader._id,
                    username: reader.MaDocGia,
                    fullName: `${reader.HoLot} ${reader.Ten}`.trim(),
                    role: reader.Role || "USER",
                    phone: reader.DienThoai,
                    email: reader.Email || googleProfile.email,
                    trangThaiThe: reader.TrangThaiThe,
                    soLanViPham: reader.SoLanViPham || 0,
                    isGoogleAccount: true,
                }
            });
        } catch (error) {
            return next(new ApiError(401, error.message || "Xác thực tài khoản Google thất bại."));
        }
    }
}

module.exports = new AuthController();
