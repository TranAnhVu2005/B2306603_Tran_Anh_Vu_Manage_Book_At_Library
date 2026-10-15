const DocGiaService = require("../services/docgia.service");
const NhanVienService = require("../services/nhanvien.service");
const googleAuthService = require("../services/google-auth.service");
const JwtUtil = require("../utils/jwt.util");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

/**
 * =========================================================================================
 * CONTROLLER XÁC THỰC TÀI KHOẢN (AUTH CONTROLLER)
 * =========================================================================================
 * POST /api/auth/login    - Đăng nhập (Độc giả, Thủ thư, Admin) → trả JWT
 * POST /api/auth/register - Đăng ký thẻ độc giả mới
 * POST /api/auth/google   - Đăng nhập / Đăng ký qua Google OAuth 2.0 → trả JWT
 * GET  /api/auth/me       - Lấy thông tin người dùng hiện tại từ JWT (yêu cầu authenticate)
 * =========================================================================================
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
                const userData = {
                    _id: String(staff._id),
                    username: staff.MSNV,
                    fullName: staff.HoTenNV,
                    role: role,
                    chucVu: staff.ChucVu,
                    phone: staff.SoDienThoai,
                };

                // Ký JWT với thông tin nhân viên
                const token = JwtUtil.sign({
                    id: String(staff._id),
                    username: staff.MSNV,
                    role: role,
                    type: "staff",
                });

                return res.json({
                    message: `Đăng nhập thành công với vai trò ${role === "ADMIN" ? "Quản trị viên (Super Admin)" : "Thủ thư (Manager)"}.`,
                    token,
                    data: userData,
                });
            }

            // 2. Kiểm tra tài khoản Độc giả
            const reader = await docGiaService.login(identifier, password);
            if (reader) {
                const userData = {
                    _id: String(reader._id),
                    username: reader.MaDocGia,
                    fullName: `${reader.HoLot} ${reader.Ten}`.trim(),
                    role: reader.Role || "USER",
                    phone: reader.DienThoai,
                    diaChi: reader.DiaChi,
                    phai: reader.Phai,
                    trangThaiThe: reader.TrangThaiThe,
                    soLanViPham: reader.SoLanViPham || 0,
                };

                // Ký JWT với thông tin độc giả
                const token = JwtUtil.sign({
                    id: String(reader._id),
                    username: reader.MaDocGia,
                    role: reader.Role || "USER",
                    type: "reader",
                });

                return res.json({
                    message: "Đăng nhập thành công với vai trò Độc giả.",
                    token,
                    data: userData,
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

            // 3. Nếu chưa có → Tự động đăng ký thẻ độc giả mới
            if (!reader) {
                const newReaderData = googleAuthService.formatReaderFromGoogleProfile(googleProfile);
                newReaderData.MaDocGia = await docGiaService.generateMaDocGia();
                newReaderData.CreatedAt = new Date();
                newReaderData.UpdatedAt = new Date();

                const insertRes = await db.collection("docgia").insertOne(newReaderData);
                reader = await db.collection("docgia").findOne({ _id: insertRes.insertedId });
            }

            const userData = {
                _id: String(reader._id),
                username: reader.MaDocGia,
                fullName: `${reader.HoLot} ${reader.Ten}`.trim(),
                role: reader.Role || "USER",
                phone: reader.DienThoai,
                email: reader.Email || googleProfile.email,
                trangThaiThe: reader.TrangThaiThe,
                soLanViPham: reader.SoLanViPham || 0,
                isGoogleAccount: true,
            };

            // 4. Ký JWT cho phiên đăng nhập Google
            const jwtToken = JwtUtil.sign({
                id: String(reader._id),
                username: reader.MaDocGia,
                role: reader.Role || "USER",
                type: "reader",
                isGoogleAccount: true,
            });

            return res.json({
                message: "Đăng nhập bằng tài khoản Google thành công.",
                token: jwtToken,
                data: userData,
            });
        } catch (error) {
            return next(new ApiError(401, error.message || "Xác thực tài khoản Google thất bại."));
        }
    }

    /**
     * Lấy thông tin người dùng hiện tại từ JWT đã xác thực
     * GET /api/auth/me  (yêu cầu middleware authenticate)
     */
    async getMe(req, res, next) {
        try {
            const { id, type } = req.user;
            let userData = null;

            if (type === "staff") {
                const nhanVienService = new NhanVienService(MongoDB.client);
                const staff = await nhanVienService.findById(id);
                if (!staff) return next(new ApiError(404, "Không tìm thấy tài khoản nhân viên."));
                const role = (staff.ChucVu === "ADMIN") ? "ADMIN" : "MANAGER";
                userData = {
                    _id: String(staff._id),
                    username: staff.MSNV,
                    fullName: staff.HoTenNV,
                    role,
                    chucVu: staff.ChucVu,
                    phone: staff.SoDienThoai,
                };
            } else {
                const docGiaService = new DocGiaService(MongoDB.client);
                const reader = await docGiaService.findById(id);
                if (!reader) return next(new ApiError(404, "Không tìm thấy tài khoản độc giả."));
                userData = {
                    _id: String(reader._id),
                    username: reader.MaDocGia,
                    fullName: `${reader.HoLot} ${reader.Ten}`.trim(),
                    role: reader.Role || "USER",
                    phone: reader.DienThoai,
                    trangThaiThe: reader.TrangThaiThe,
                    soLanViPham: reader.SoLanViPham || 0,
                };
            }

            return res.json({ data: userData });
        } catch (error) {
            return next(new ApiError(500, "Không thể lấy thông tin người dùng."));
        }
    }
}

module.exports = new AuthController();
