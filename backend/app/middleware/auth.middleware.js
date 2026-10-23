const JwtUtil = require("../utils/jwt.util");
const ApiError = require("../api-error");
const TokenRevocation = require("../utils/token-revocation.util");
const MongoDB = require("../utils/mongodb.util");
const { ObjectId } = require("mongodb");

async function authenticate(req, res, next) {
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
        if (!["reader", "staff"].includes(decoded.type) || !decoded.id) {
            return next(new ApiError(401, "Token xác thực không hợp lệ."));
        }
        if (await TokenRevocation.isRevoked(token)) {
            return next(new ApiError(401, "Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại."));
        }
        const collection = decoded.type === "staff" ? "nhanvien" : "docgia";
        const id = ObjectId.isValid(decoded.id) ? new ObjectId(decoded.id) : null;
        const currentAccount = id
            ? await MongoDB.client.db().collection(collection).findOne({ _id: id }, {
                projection: decoded.type === "staff" ? { ChucVu: 1 } : { VaiTro: 1 },
            })
            : null;
        if (!currentAccount) return next(new ApiError(401, "Tài khoản không còn hợp lệ."));
        decoded.role = decoded.type === "staff"
            ? (currentAccount.ChucVu === "ADMIN" ? "ADMIN" : "MANAGER")
            : (currentAccount.VaiTro || "USER");
        req.user = decoded; // Gắn thông tin user vào request để các middleware sau sử dụng
        req.authToken = token;
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

function authorizeStaff(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Chưa xác thực danh tính."));
        }
        if (req.user.type !== "staff" || !roles.includes(req.user.role)) {
            return next(new ApiError(403, `Chỉ nhân viên có quyền ${roles.join(" hoặc ")} mới được thực hiện thao tác này.`));
        }
        next();
    };
}

function authorizeReader(req, res, next) {
    if (!req.user) return next(new ApiError(401, "Chưa xác thực danh tính."));
    if (req.user.type !== "reader" || req.user.role !== "USER") {
        return next(new ApiError(403, "Chức năng này chỉ dành cho độc giả."));
    }
    next();
}

function authorizeAdmin(req, res, next) {
    if (!req.user) return next(new ApiError(401, "Chưa xác thực danh tính."));
    if (req.user.type !== "staff" || req.user.role !== "ADMIN") {
        return next(new ApiError(403, "Chỉ quản trị viên mới được thực hiện thao tác này."));
    }
    next();
}

// Hàm xác thực cho các chức năng khách vãng lai có thể truy cập, không có token thì bỏ qua, không lỗi.
async function optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        try {
            req.user = JwtUtil.verify(token);
            if (await TokenRevocation.isRevoked(token)) req.user = undefined;
        } catch (_) {
            // Token sai hoặc hết hạn → bỏ qua, tiếp tục như anonymous
        }
    }
    next();
}

module.exports = { authenticate, authorize, authorizeStaff, authorizeReader, authorizeAdmin, optionalAuth };
