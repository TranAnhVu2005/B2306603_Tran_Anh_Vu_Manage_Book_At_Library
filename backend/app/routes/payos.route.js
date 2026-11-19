const express = require("express");
const controller = require("../controllers/payos.controller");
const { authenticate, authorizeReader, authorizeStaff } = require("../middleware/auth.middleware");
const { allowFields } = require("../middleware/security.middleware");

const router = express.Router();

// Webhook callback từ máy chủ PayOS (xác thực bằng chữ ký HMAC-SHA256)
router.post("/webhook", controller.webhook);

// Độc giả khởi tạo đền bù mất sách (chuyển khoản PayOS hoặc đăng ký trả trực tiếp tại quầy)
router.post(
    "/create",
    authenticate,
    authorizeReader,
    allowFields("borrowId", "ghiChu", "forceNew", "phuongThuc"),
    controller.createPayment
);

// Độc giả đồng bộ mã đơn sau khi quay về từ trang thanh toán PayOS
router.post(
    "/order/:orderCode/sync",
    authenticate,
    authorizeReader,
    allowFields(),
    controller.syncOrder
);

// Lấy giao dịch đền bù mới nhất của một phiếu mượn
router.get("/borrow/:borrowId", authenticate, controller.getByBorrowId);

// Độc giả xác nhận đã chuyển khoản và gửi chờ quản trị viên duyệt
router.put(
    "/borrow/:borrowId/confirm",
    authenticate,
    authorizeReader,
    allowFields("ghiChu"),
    controller.confirmTransfer
);

// Danh sách giao dịch đền bù (Độc giả xem của mình, STAFF/ADMIN xem toàn bộ)
router.get("/transactions", authenticate, controller.findAll);

// Quản trị viên / Thủ thư duyệt giao dịch đền bù
router.put(
    "/transactions/:id/approve",
    authenticate,
    authorizeStaff("STAFF", "ADMIN"),
    allowFields(),
    controller.approve
);

// Quản trị viên / Thủ thư từ chối giao dịch đền bù kèm lý do
router.put(
    "/transactions/:id/reject",
    authenticate,
    authorizeStaff("STAFF", "ADMIN"),
    allowFields("lyDo"),
    controller.reject
);

module.exports = router;
