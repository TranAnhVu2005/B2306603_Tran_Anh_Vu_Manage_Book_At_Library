const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const { securityHeaders, rejectXml, rejectSimpleFormMutations, rejectMongoOperators } = require("./app/middleware/security.middleware");

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(rejectXml);
app.use(rejectSimpleFormMutations);
app.use(express.static(path.join(__dirname, "public")));
const ApiError = require("./app/api-error");

// Import các bộ định tuyến API (Routes)
const authRouter = require("./app/routes/auth.route");
const nxbRouter = require("./app/routes/nhaxuatban.route");
const sachRouter = require("./app/routes/sach.route");
const docGiaRouter = require("./app/routes/docgia.route");
const nhanVienRouter = require("./app/routes/nhanvien.route");
const theoDoiRouter = require("./app/routes/theodoimuonsach.route");
const auditLogRouter = require("./app/routes/audit-log.route");
const thongBaoRouter = require("./app/routes/thongbao.route");

// Chỉ cho phép hai frontend đã cấu hình; localhost là mặc định dành cho phát triển.
const defaultOrigins = process.env.NODE_ENV === "production" ? "" : "http://localhost:3001,http://localhost:3002";
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || defaultOrigins)
    .split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new ApiError(403, "Origin không được phép truy cập API."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    credentials: false,
    maxAge: 600,
}));
app.use(express.json({ limit: "1mb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "1mb", parameterLimit: 100 }));
app.use(rejectMongoOperators);
app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});

// Middleware log request cho môi trường phát triển
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// Đăng ký các Endpoint RESTful API
app.use("/api/auth", authRouter);
app.use("/api/nhaxuatban", nxbRouter);
app.use("/api/sach", sachRouter);
app.use("/api/docgia", docGiaRouter);
app.use("/api/nhanvien", nhanVienRouter);
app.use("/api/theodoimuonsach", theoDoiRouter);
app.use("/api/nhatkykiemtoan", auditLogRouter);
app.use("/api/thongbao", thongBaoRouter);

// Endpoint kiểm tra tình trạng máy chủ (Health Check)
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        name: "Library Management System Backend API",
        version: "2.0.0",
        timestamp: new Date().toISOString()
    });
});

// Xử lý khi truy cập Endpoint không tồn tại (404 Not Found)
app.use((req, res, next) => {
    return next(new ApiError(404, `Không tìm thấy tài nguyên API yêu cầu: ${req.method} ${req.originalUrl}`));
});

// Middleware xử lý lỗi tập trung (Centralized Error Handler)
app.use((error, req, res, next) => {
    const statusCode = error.statusCode || error.status || 500;
    const message = statusCode >= 500 && process.env.NODE_ENV === "production"
        ? "Lỗi máy chủ nội bộ."
        : error.message || "Lỗi máy chủ nội bộ (Internal Server Error)";

    if (statusCode >= 500) {
        console.error(">>> Server Error Stack:", error);
    }

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});

module.exports = app;
