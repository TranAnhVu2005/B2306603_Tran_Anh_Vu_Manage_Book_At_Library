const JwtUtil = require("../utils/jwt.util");
const ApiError = require("../api-error");

function authenticate(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ApiError(401, "Yêu cầu đăng nhập. Vui lòng cung cấp token xác thực."));
    }

    //Cắt chuỗi từ vị trí thứ 7 trở đi, bỏ "Bearer " 
    const token = authHeader.substring(7).trim();
    if (!token) {
        return next(new ApiError(401, "Token xác thực bị thiếu."));
    }

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

// Phân quyền, roles được truyền trong lúc gọi các hàm xử lý, nếu không có quyền trả về 403
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

// Hàm xác thực cho các chức năng khách vãng lai có thể truy cập, không có token thì bỏ qua, không lỗi.
function optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        try {
            req.user = JwtUtil.verify(token);
        } catch (_) {
            // Token sai hoặc hết hạn → bỏ qua, tiếp tục như anonymous
        }
    }
    next();
}

module.exports = { authenticate, authorize, optionalAuth };
