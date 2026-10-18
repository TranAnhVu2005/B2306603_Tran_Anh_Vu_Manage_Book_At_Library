const express = require("express");
const controller = require("../controllers/nhanvien.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/")
    .get(controller.findAll) // Chưa dùng ở frontend
    .post(controller.create); //Chưa dùng ở frontend

router.route("/:id")
    .get(controller.findOne)  // Chưa dùng ở frontend
    .put(authenticate, controller.update) 
    .delete(controller.delete);

module.exports = router;
