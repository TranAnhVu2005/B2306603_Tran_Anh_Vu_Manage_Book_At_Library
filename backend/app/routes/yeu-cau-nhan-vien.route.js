const express = require("express");
const controller = require("../controllers/yeu-cau-nhan-vien.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");
const { allowFields, authRateLimit } = require("../middleware/security.middleware");

const router = express.Router();
router.post("/", allowFields("HoTenNV", "SoDienThoai", "DiaChi", "MatKhau"), authRateLimit({ max: 5 }), controller.submit);
router.post("/status", allowFields("SoDienThoai", "MatKhau"), authRateLimit({ max: 5 }), controller.lookupStatus);
router.get("/", authenticate, authorizeAdmin, controller.findAll);
router.put("/:id/approve", authenticate, authorizeAdmin, allowFields(), controller.approve);
router.put("/:id/reject", authenticate, authorizeAdmin, allowFields("LyDoTuChoi"), controller.reject);

module.exports = router;
