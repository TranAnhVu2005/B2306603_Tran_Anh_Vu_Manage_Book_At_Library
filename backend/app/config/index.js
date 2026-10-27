require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

const config = {
    app: {
        port: Number(process.env.PORT || 3000),
        env: process.env.NODE_ENV || "development",
    },
    db: {
        // Local development defaults to local MongoDB. Production must supply
        // the Atlas URI through Render's environment settings.
        uri: process.env.MONGODB_URI || (isProduction ? "" : "mongodb://127.0.0.1:27017/quanlymuonsach"),
        name: process.env.MONGODB_DB_NAME || "quanlymuonsach",
    },
    auth: {
        bcryptSaltRounds: 10,
        jwtSecret: process.env.JWT_SECRET,
        jwtExpiresIn: process.env.JWT_EXPIRES_IN,
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
    },

};

module.exports = config;
