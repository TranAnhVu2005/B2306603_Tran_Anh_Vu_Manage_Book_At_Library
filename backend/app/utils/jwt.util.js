const jwt = require("jsonwebtoken");
const config = require("../config");


const JwtUtil = {
    // Hàm ký jwt lúc đăng nhập
    //Có payload để đính kèm thêm thông tin + secret key mã khóa, thời gian hết hạn token cũng từ config
    sign(payload) {
        return jwt.sign(payload, config.auth.jwtSecret, {
            expiresIn: config.auth.jwtExpiresIn,
        });
    },

    // Token lấy từ Authorization header + secret để giải mã kiểm tra xem token hợp lệ không
    verify(token) {
        return jwt.verify(token, config.auth.jwtSecret);
    },
};

module.exports = JwtUtil;
