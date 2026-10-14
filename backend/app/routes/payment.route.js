const express = require("express");
const controller = require("../controllers/payment.controller");

const router = express.Router();

// Khởi tạo phiên thanh toán MoMo cho tiền bồi thường / phạt
router.post("/momo/create", controller.createMoMoPayment);

// Webhook IPN lắng nghe phản hồi từ máy chủ MoMo
router.post("/momo/ipn", controller.handleMoMoIPN);

// Kiểm tra trạng thái giao dịch
router.get("/momo/status/:orderId", controller.checkPaymentStatus);

module.exports = router;
