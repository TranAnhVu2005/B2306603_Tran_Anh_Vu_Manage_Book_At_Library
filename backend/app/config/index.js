require("dotenv").config();

const config = {
    app: {
        port: process.env.PORT,
        env: process.env.NODE_ENV,
    },
    db: {
        uri: process.env.MONGODB_URI,
        name: "quanlymuonsach",
    },
    auth: {
        bcryptSaltRounds: 10,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    },
    // Cấu hình tích hợp Đăng nhập bằng Google (Google OAuth 2.0)
    // Người dùng cấu hình Client ID và Secret lấy từ Google Cloud Console
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },

};

module.exports = config;