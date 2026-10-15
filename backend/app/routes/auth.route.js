const express = require("express");
const controller = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Đăng nhập chung (Độc giả / Nhân viên / Admin) → trả JWT
router.post("/login", controller.login);

// Đăng ký thẻ độc giả mới trực tuyến
router.post("/register", controller.registerDocGia);

// Đăng nhập / Đăng ký nhanh bằng tài khoản Google → trả JWT
router.post("/google", controller.loginWithGoogle);

// Lấy thông tin người dùng hiện tại (yêu cầu JWT hợp lệ)
router.get("/me", authenticate, controller.getMe);

module.exports = router;
