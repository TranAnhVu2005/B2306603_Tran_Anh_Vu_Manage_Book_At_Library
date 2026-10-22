const express = require("express");
const controller = require("../controllers/sach.controller");

const router = express.Router();
const createUploader = require("../middleware/upload.middleware");

const upload = createUploader("books")

// Gắn middleware upload.single("HinhAnh") vào route POST (Thêm) và PUT (Sửa)
router.route("/")
    .get(controller.findAll)
    .post(upload.single("HinhAnh"), controller.create);

router.route("/:id")
    .get(controller.findOne)
    .put(upload.single("HinhAnh"), controller.update)
    .delete(controller.delete);

module.exports = router;
