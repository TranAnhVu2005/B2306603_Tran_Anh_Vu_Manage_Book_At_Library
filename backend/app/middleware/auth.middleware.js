const JwtUtil = require("../utils/jwt.util");
const ApiError = require("../api-error");

/**
 * =========================================================================================
 * MIDDLEWARE XÁC THỰC JWT
 * =========================================================================================
 * authenticate  : Bắt buộc phải có Bearer token hợp lệ (dùng cho route cần đăng nhập)
 * authorize(...roles) : Kiểm tra role sau khi đã authenticate
 * optionalAuth  : Gắn thông tin user nếu có token, không báo lỗi nếu không có
 * =========================================================================================
 */

/**
 * Middleware bắt buộc xác thực JWT.
 * Lấy token từ header: Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ApiError(401, "Yêu cầu đăng nhập. Vui lòng cung cấp token xác thực."));
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = JwtUtil.verify(token);
        req.user = decoded; // Gắn thông tin user vào request để các middleware sau sử dụng
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return next(new ApiError(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."));
        }
        return next(new ApiError(401, "Token xác thực không hợp lệ."));
    }
}

/**
 * Middleware phân quyền theo Role.
 * Phải dùng sau authenticate.
 * @param {...string} roles - Danh sách role được phép ("USER", "MANAGER", "ADMIN")
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Chưa xác thực danh tính."));
        }
        if (!roles.includes(req.user.role)) {
            return next(new ApiError(403, `Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền: ${roles.join(", ")}.`));
        }
        next();
    };
}

/**
 * Middleware xác thực không bắt buộc.
 * Nếu có token hợp lệ → gắn req.user, nếu không có hoặc sai → bỏ qua, không báo lỗi.
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            req.user = JwtUtil.verify(token);
        } catch (_) {
            // Token sai hoặc hết hạn → bỏ qua, tiếp tục như anonymous
        }
    }
    next();
}

module.exports = { authenticate, authorize, optionalAuth };
