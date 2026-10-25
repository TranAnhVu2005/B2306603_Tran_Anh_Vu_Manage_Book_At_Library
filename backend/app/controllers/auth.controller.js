const DocGiaService = require("../services/docgia.service");
const NhanVienService = require("../services/nhanvien.service");
const googleAuthService = require("../services/google-auth.service");
const JwtUtil = require("../utils/jwt.util");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const TokenRevocation = require("../utils/token-revocation.util");
const YeuCauNhanVienService = require("../services/yeu-cau-nhan-vien.service");

/**
 * POST /api/auth/login    - Đăng nhập => trả JWT
 * POST /api/auth/register - Đăng ký thẻ độc giả mới
 * POST /api/auth/google   - Đăng nhập / Đăng ký qua Google OAuth 2.0 => trả JWT
 * GET  /api/auth/me       - Lấy thông tin người dùng hiện tại từ JWT (yêu cầu authenticate)
 */
class AuthController {

    async staffLogin(req, res, next) {
        try {
            const { identifier, password } = req.body;
            if (!identifier || !password) return next(new ApiError(400, "Vui lòng nhập số điện thoại và mật khẩu."));
            const staffAuth = await new NhanVienService(MongoDB.client).loginWithStatus(identifier, password);
            if (staffAuth.status === "locked") {
                return next(new ApiError(403, "Tài khoản thủ thư của bạn đang bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ."));
            }
            const staff = staffAuth.staff;
            if (staff) {
                const role = staff.ChucVu === "ADMIN" ? "ADMIN" : "MANAGER";
                const data = {
                    _id: String(staff._id), MSNV: staff.MSNV, HoTenNV: staff.HoTenNV,
                    ChucVu: staff.ChucVu, SoDienThoai: staff.SoDienThoai, DiaChi: staff.DiaChi,
                    TrangThaiThe: staff.TrangThaiThe || "HoatDong",
                };
                const token = JwtUtil.sign({ id: String(staff._id), username: staff.MSNV, role, type: "staff", sessionVersion: staff.PhienBanToken || 0 });
                return res.json({ message: `Đăng nhập thành công với vai trò ${role === "ADMIN" ? "Quản trị viên" : "Thủ thư"}.`, token, data });
            }
            const status = await new YeuCauNhanVienService(MongoDB.client).matchLoginStatus(identifier, password);
            if (status) return next(new ApiError(403, status.message));
            return next(new ApiError(401, "Số điện thoại hoặc mật khẩu không chính xác."));
        } catch (error) {
            return next(new ApiError(500, "Lỗi xảy ra trong quá trình xác thực đăng nhập."));
        }
    }

    // Xử lý đăng nhập - Completed
    async login(req, res, next) {
        try {
            const { identifier, password } = req.body;
            if (!identifier || !password) {
                return next(new ApiError(400, "Vui lòng nhập số điện thoại và mật khẩu."));
            }

            const nhanVienService = new NhanVienService(MongoDB.client);
            const docGiaService = new DocGiaService(MongoDB.client);

            // 1. Kiểm tra tài khoản Nhân viên / Quản trị viên trước
            const staffAuth = await nhanVienService.loginWithStatus(identifier, password);
            if (staffAuth.status === "locked") {
                return next(new ApiError(403, "Tài khoản nhân viên của bạn đang bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ."));
            }
            const staff = staffAuth.staff;
            if (staff) {
                const vaiTro = (staff.ChucVu === "ADMIN") ? "ADMIN" : "MANAGER";
                const userData = {
                    _id: String(staff._id),
                    MSNV: staff.MSNV,
                    HoTenNV: staff.HoTenNV,
                    ChucVu: staff.ChucVu,
                    SoDienThoai: staff.SoDienThoai,
                    DiaChi: staff.DiaChi,
                    TrangThaiThe: staff.TrangThaiThe || "HoatDong",
                };

                const token = JwtUtil.sign({
                    id: String(staff._id),
                    username: staff.MSNV,
                    role: vaiTro,
                    type: "staff",
                    sessionVersion: staff.PhienBanToken || 0,
                });

                return res.json({
                    message: `Đăng nhập thành công với vai trò ${vaiTro === "ADMIN" ? "Quản trị viên" : "Thủ thư"}.`,
                    token,
                    data: userData,
                });
            }

            // 2. Kiểm tra tài khoản Độc giả
            const reader = await docGiaService.login(identifier, password);
            if (reader) {
                const userData = {
                    _id: String(reader._id),
                    MaDocGia: reader.MaDocGia,
                    HoLot: reader.HoLot,
                    Ten: reader.Ten,
                    Phai: reader.Phai,
                    NgaySinh: reader.NgaySinh,
                    DiaChi: reader.DiaChi,
                    DienThoai: reader.DienThoai,
                    VaiTro: "USER",
                    SoLanViPham: reader.SoLanViPham || 0,
                    TrangThaiThe: reader.TrangThaiThe,
                };

                const token = JwtUtil.sign({
                    id: String(reader._id),
                    username: reader.MaDocGia,
                    role: "USER",
                    type: "reader",
                });

                return res.json({
                    message: "Đăng nhập thành công với vai trò Độc giả.",
                    token,
                    data: userData,
                });
            }

            const applicationStatus = await new YeuCauNhanVienService(MongoDB.client).matchLoginStatus(identifier, password);
            if (applicationStatus) return next(new ApiError(403, applicationStatus.message));

            return next(new ApiError(401, "Tài khoản hoặc mật khẩu không chính xác."));
        } catch (error) {
            return next(new ApiError(500, "Lỗi xảy ra trong quá trình xác thực đăng nhập."));
        }
    }

    // Xử lý đăng ký thẻ độc giả - Completed
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

    // Xử lý đăng nhập bằng google - Completed
    async loginWithGoogle(req, res, next) {
        try {
            const { idToken } = req.body;
            const token = idToken;

            if (!token) {
                return next(new ApiError(400, "Thiếu Google ID Token."));
            }

            const googleProfile = await googleAuthService.verifyIdToken(token);

            const docGiaService = new DocGiaService(MongoDB.client);
            const db = MongoDB.client.db();

            let reader = await db.collection("docgia").findOne({
                $or: [
                    { GoogleId: googleProfile.googleId },
                    { Email: googleProfile.email },
                    { DienThoai: `GG_${String(googleProfile.googleId).slice(-8)}` }
                ]
            });

            // Chưa đăng nhập bằng tài khoản google thì tạo cái mới
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
                MaDocGia: reader.MaDocGia,
                HoLot: reader.HoLot || "",
                Ten: reader.Ten,
                Phai: reader.Phai,
                NgaySinh: reader.NgaySinh,
                DiaChi: reader.DiaChi,
                DienThoai: reader.DienThoai,
                VaiTro: "USER",
                SoLanViPham: reader.SoLanViPham || 0,
                TrangThaiThe: reader.TrangThaiThe,
            };

            const jwtToken = JwtUtil.sign({
                id: String(reader._id),
                username: reader.MaDocGia,
                role: "USER",
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

    // Lấy thông tin người dùng hiện tại từ JWT - Completed
    async getMe(req, res, next) {
        try {
            const { id, type } = req.user; // Lúc đăng nhập thành công, trong token có lưu thông tin về id và type
            let userData = null;

            if (type === "staff") {
                const nhanVienService = new NhanVienService(MongoDB.client);
                const staff = await nhanVienService.findById(id);
                if (!staff) return next(new ApiError(404, "Không tìm thấy tài khoản nhân viên."));
                userData = {
                    _id: String(staff._id),
                    MSNV: staff.MSNV,
                    HoTenNV: staff.HoTenNV,
                    ChucVu: staff.ChucVu,
                    SoDienThoai: staff.SoDienThoai,
                    DiaChi: staff.DiaChi,
                    AnhDaiDien: staff.AnhDaiDien,
                    TrangThaiThe: staff.TrangThaiThe || "HoatDong",
                };
            } else {
                const docGiaService = new DocGiaService(MongoDB.client);
                const reader = await docGiaService.findById(id);
                if (!reader) return next(new ApiError(404, "Không tìm thấy tài khoản độc giả."));

                userData = {
                    _id: String(reader._id),
                    MaDocGia: reader.MaDocGia,
                    HoLot: reader.HoLot,
                    Ten: reader.Ten,
                    Phai: reader.Phai,
                    NgaySinh: reader.NgaySinh,
                    DiaChi: reader.DiaChi,
                    DienThoai: reader.DienThoai,
                    VaiTro: "USER",
                    SoLanViPham: reader.SoLanViPham || 0,
                    TrangThaiThe: reader.TrangThaiThe,
                    AnhDaiDien: reader.AnhDaiDien,
                };
            }

            return res.json({ data: userData });
        } catch (error) {
            return next(new ApiError(500, "Không thể lấy thông tin người dùng."));
        }
    }

    async logout(req, res, next) {
        try {
            await TokenRevocation.revoke(req.authToken, req.user.exp);
            return res.json({ message: "Đăng xuất thành công." });
        } catch (error) {
            return next(new ApiError(500, "Không thể thu hồi phiên đăng nhập."));
        }
    }
}

module.exports = new AuthController();
