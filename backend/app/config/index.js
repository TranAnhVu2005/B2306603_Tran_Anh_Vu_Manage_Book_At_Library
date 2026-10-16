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
    
    // Cấu hình cổng thanh toán điện tử MoMo
    // Đăng ký tài khoản Merchant thử nghiệm tại https://developers.momo.vn
    momo: {
        partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO_DEMO_PARTNER_CODE",
        accessKey: process.env.MOMO_ACCESS_KEY || "MOMO_DEMO_ACCESS_KEY",
        secretKey: process.env.MOMO_SECRET_KEY || "MOMO_DEMO_SECRET_KEY",
        endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
        returnUrl: process.env.MOMO_RETURN_URL || "http://localhost:3001/profile",
        notifyUrl: process.env.MOMO_NOTIFY_URL || "http://localhost:3000/api/payment/momo/ipn",
    }
};

module.exports = config;