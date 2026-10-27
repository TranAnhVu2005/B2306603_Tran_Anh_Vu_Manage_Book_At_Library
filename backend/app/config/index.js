require("dotenv").config();

const atlasHost = "quanlymuonsach.csiixui.mongodb.net";
const databaseName = "quanlymuonsach";
const configuredMongoUri = process.env.MONGODB_URI?.trim();

if (!configuredMongoUri) {
    throw new Error("Cần cấu hình MONGODB_URI của MongoDB Atlas trong mọi môi trường.");
}

let parsedMongoUri;
try {
    parsedMongoUri = new URL(configuredMongoUri);
} catch {
    throw new Error("MONGODB_URI không hợp lệ.");
}

if (parsedMongoUri.protocol !== "mongodb+srv:" || parsedMongoUri.hostname.toLowerCase() !== atlasHost) {
    throw new Error("Backend chỉ được kết nối MongoDB Atlas đã cấu hình.");
}

if (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME !== databaseName) {
    throw new Error(`MONGODB_DB_NAME phải là ${databaseName}.`);
}

const config = {
    app: {
        port: Number(process.env.PORT || 3000),
        env: process.env.NODE_ENV || "development",
    },
    db: {
        // All environments use only this Atlas cluster; credentials stay in env.
        uri: configuredMongoUri,
        name: databaseName,
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
