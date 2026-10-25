const express = require("express");
const controller = require("../controllers/docgia.controller");
const { authenticate, authorizeStaff, authorizeAdmin } = require("../middleware/auth.middleware");
const createUploader = require("../middleware/upload.middleware");
const { validateImageUpload } = require("../middleware/upload.middleware");
const { allowFields } = require("../middleware/security.middleware");


const router = express.Router();

const upload = createUploader("avatars")

router.route("/")
    .get(authenticate, authorizeStaff("MANAGER", "ADMIN"), controller.findAll)
    .post(authenticate, authorizeAdmin, upload.single("AnhDaiDien"), validateImageUpload, allowFields("HoLot", "Ten", "NgaySinh", "Phai", "DiaChi", "DienThoai", "MatKhau"), controller.create);

router.route("/:id")
    .get(authenticate, controller.findOne)
    .put(authenticate, upload.single("AnhDaiDien"), validateImageUpload, allowFields("HoLot", "Ten", "NgaySinh", "Phai", "DiaChi", "DienThoai"), controller.update)
    .delete(authenticate, authorizeAdmin, controller.delete);

router.route("/:id/unblock")
    .put(authenticate, authorizeAdmin, controller.unblock);

router.route("/:id/lock")
    .put(authenticate, authorizeAdmin, controller.lock);

router.route("/:id/reinstate")
    .put(authenticate, authorizeAdmin, controller.reinstate);

module.exports = router;
