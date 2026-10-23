const express = require("express");
const controller = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authRateLimit, allowFields } = require("../middleware/security.middleware");

const router = express.Router();

// Đăng nhập chung (Độc giả / Nhân viên / Admin) → trả JWT
router.post("/login", allowFields("identifier", "password"), authRateLimit({ max: 10 }), controller.login);

// Đăng ký thẻ độc giả mới trực tuyến
router.post("/register", allowFields("HoLot", "Ten", "NgaySinh", "Phai", "DiaChi", "DienThoai", "MatKhau"), authRateLimit({ max: 5 }), controller.registerDocGia);

// Đăng nhập / Đăng ký nhanh bằng tài khoản Google → trả JWT
router.post("/google", allowFields("idToken"), authRateLimit({ max: 10 }), controller.loginWithGoogle);

// Lấy thông tin người dùng hiện tại (yêu cầu JWT hợp lệ)
router.get("/me", authenticate, controller.getMe);
router.post("/logout", authenticate, controller.logout);

module.exports = router;
