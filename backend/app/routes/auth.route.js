const express = require("express");
const controller = require("../controllers/auth.controller");

const router = express.Router();

// Tuyến đường đăng nhập chung
router.post("/login", controller.login);

// Tuyến đường đăng ký độc giả trực tuyến
router.post("/register", controller.registerDocGia);

// Tuyến đường đăng nhập / đăng ký bằng tài khoản Google
router.post("/google", controller.loginWithGoogle);

module.exports = router;
