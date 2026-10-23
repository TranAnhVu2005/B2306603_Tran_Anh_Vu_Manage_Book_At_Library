const jwt = require("jsonwebtoken");
const config = require("../config");
const ApiError = require("../api-error");


const JwtUtil = {
    // Hàm ký jwt lúc đăng nhập
    //Có payload để đính kèm thêm thông tin + secret key mã khóa, thời gian hết hạn token cũng từ config
    sign(payload) {
        if (!config.auth.jwtSecret || Buffer.byteLength(config.auth.jwtSecret) < 32 || !config.auth.jwtExpiresIn) {
            throw new ApiError(500, "JWT_SECRET (ít nhất 32 byte) và JWT_EXPIRES_IN bắt buộc phải được cấu hình.");
        }
        return jwt.sign(payload, config.auth.jwtSecret, {
            expiresIn: config.auth.jwtExpiresIn,
            algorithm: "HS256",
            issuer: "library-management-api",
            audience: "library-management-client",
        });
    },

    // Token lấy từ Authorization header + secret để giải mã kiểm tra xem token hợp lệ không
    verify(token) {
        if (!config.auth.jwtSecret || Buffer.byteLength(config.auth.jwtSecret) < 32 || !config.auth.jwtExpiresIn) {
            throw new ApiError(500, "JWT_SECRET/JWT_EXPIRES_IN chưa được cấu hình an toàn.");
        }
        return jwt.verify(token, config.auth.jwtSecret, {
            algorithms: ["HS256"],
            issuer: "library-management-api",
            audience: "library-management-client",
        });
    },
};

module.exports = JwtUtil;
