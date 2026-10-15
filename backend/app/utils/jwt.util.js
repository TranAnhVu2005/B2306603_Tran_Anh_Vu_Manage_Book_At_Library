const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * =========================================================================================
 * TIỆN ÍCH JWT - JSON WEB TOKEN
 * =========================================================================================
 * Cung cấp 2 hàm:
 *  - sign(payload)   : Ký và tạo token mới kèm thông tin người dùng
 *  - verify(token)   : Xác thực token, trả về payload nếu hợp lệ, ném lỗi nếu không
 * =========================================================================================
 */
const JwtUtil = {
    /**
     * Ký JWT với payload người dùng
     * @param {Object} payload - Dữ liệu cần nhúng vào token (id, role, username,...)
     * @returns {string} JWT token string
     */
    sign(payload) {
        return jwt.sign(payload, config.auth.jwtSecret, {
            expiresIn: config.auth.jwtExpiresIn, // Mặc định "7d"
        });
    },

    /**
     * Xác thực JWT và giải mã payload
     * @param {string} token - JWT token string (lấy từ Authorization header)
     * @returns {Object} Payload đã giải mã nếu token hợp lệ
     * @throws {Error} Nếu token không hợp lệ hoặc đã hết hạn
     */
    verify(token) {
        return jwt.verify(token, config.auth.jwtSecret);
    },
};

module.exports = JwtUtil;
