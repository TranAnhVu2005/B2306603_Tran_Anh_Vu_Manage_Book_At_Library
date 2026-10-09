const express = require("express");
const cors = require("cors");

const app = express();
const ApiError = require("./app/api-error");

const authRouter = require("./app/routes/auth.route");
const nxbRouter = require("./app/routes/nhaxuatban.route");
const sachRouter = require("./app/routes/sach.route");
const docGiaRouter = require("./app/routes/docgia.route");
const nhanVienRouter = require("./app/routes/nhanvien.route");
const theoDoiRouter = require("./app/routes/theodoimuonsach.route");

// Cho phép cross-origin resource sharing
app.use(cors());
app.use(express.json());

// Tuyến đường API
app.use("/api/auth", authRouter);
app.use("/api/nhaxuatban", nxbRouter);
app.use("/api/sach", sachRouter);
app.use("/api/docgia", docGiaRouter);
app.use("/api/nhanvien", nhanVienRouter);
app.use("/api/theodoimuonsach", theoDoiRouter);

// Trang kiểm tra trạng thái API
app.get("/api/health", (req, res) => {
    res.json({ status: "OK", message: "Library Management API is running normally." });
});

// Handle 404 response
app.use((req, res, next) => {
    return next(new ApiError(404, "Resource not found"));
});

// Define error-handling middleware
app.use((error, req, res, next) => {
    return res.status(error.statusCode || 500).json({
        message: error.message || "Internal Server Error",
    });
});

module.exports = app;