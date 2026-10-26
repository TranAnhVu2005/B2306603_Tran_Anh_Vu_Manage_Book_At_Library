const express = require("express");
const controller = require("../controllers/nhanvien.controller");
const { authenticate, authorizeAdmin, authorizeStaff } = require("../middleware/auth.middleware");
const createUploader = require("../middleware/upload.middleware");
const { validateImageUpload } = require("../middleware/upload.middleware");
const { allowFields } = require("../middleware/security.middleware");


const router = express.Router();

const upload = createUploader("avatars")

router.route("/")
    .get(authenticate, authorizeAdmin, controller.findAll)
    .post(authenticate, authorizeAdmin, upload.single("AnhDaiDien"), validateImageUpload, allowFields("HoTenNV", "ChucVu", "MatKhau", "SoDienThoai", "DiaChi"), controller.create);

router.route("/:id")
    .get(authenticate, authorizeStaff("STAFF", "ADMIN"), controller.findOne)
    .put(authenticate, authorizeStaff("STAFF", "ADMIN"), upload.single("AnhDaiDien"), validateImageUpload, allowFields("HoTenNV", "SoDienThoai", "DiaChi"), controller.update)
    .delete(authenticate, authorizeAdmin, controller.delete);

router.put("/:id/restore", authenticate, authorizeAdmin, controller.restore);

router.route("/:id/lock")
    .put(authenticate, authorizeAdmin, allowFields("LyDo"), controller.lockAccount);

router.route("/:id/unlock")
    .put(authenticate, authorizeAdmin, allowFields("LyDo"), controller.unlockAccount);

module.exports = router;
