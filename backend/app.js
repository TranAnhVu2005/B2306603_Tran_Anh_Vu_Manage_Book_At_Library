const express = require("express");
const cors = require("cors");

const app = express();
const ApiError = require("./app/api-error");

// Import các bộ định tuyến API (Routes)
const authRouter = require("./app/routes/auth.route");
const nxbRouter = require("./app/routes/nhaxuatban.route");
const sachRouter = require("./app/routes/sach.route");
const docGiaRouter = require("./app/routes/docgia.route");
const nhanVienRouter = require("./app/routes/nhanvien.route");
const theoDoiRouter = require("./app/routes/theodoimuonsach.route");
const paymentRouter = require("./app/routes/payment.route");

// Middleware cấu hình CORS và Parser JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware log request cho môi trường phát triển
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
});

// Đăng ký các Endpoint RESTful API
app.use("/api/auth", authRouter);
app.use("/api/nhaxuatban", nxbRouter);
app.use("/api/sach", sachRouter);
app.use("/api/docgia", docGiaRouter);
app.use("/api/nhanvien", nhanVienRouter);
app.use("/api/theodoimuonsach", theoDoiRouter);
app.use("/api/payment", paymentRouter);

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
    const statusCode = error.statusCode || 500;
    const message = error.message || "Lỗi máy chủ nội bộ (Internal Server Error)";

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