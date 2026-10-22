const express = require("express");
const controller = require("../controllers/nhanvien.controller");
const { authenticate } = require("../middleware/auth.middleware");
const createUploader = require("../middleware/upload.middleware");


const router = express.Router();

const upload = createUploader("avatars")

router.route("/")
    .get(controller.findAll) // Chưa dùng ở frontend
    .post(upload.single("AnhDaiDien"), controller.create); //Chưa dùng ở frontend

router.route("/:id")
    .get(controller.findOne)  // Chưa dùng ở frontend
    .put(authenticate, upload.single("AnhDaiDien"), controller.update)
    .delete(controller.delete);

module.exports = router;
