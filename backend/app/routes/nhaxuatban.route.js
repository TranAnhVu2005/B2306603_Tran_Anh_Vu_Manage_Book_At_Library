const express = require("express");
const controller = require("../controllers/nhaxuatban.controller");
const { authenticate, authorizeStaff } = require("../middleware/auth.middleware");
const { allowFields } = require("../middleware/security.middleware");

const router = express.Router();

router.route("/")
    .get(controller.findAll)
    .post(authenticate, authorizeStaff("MANAGER", "ADMIN"), allowFields("TENNXB", "DiaChi"), controller.create);

router.route("/:id")
    .get(controller.findOne)
    .put(authenticate, authorizeStaff("MANAGER", "ADMIN"), allowFields("TENNXB", "DiaChi"), controller.update)
    .delete(authenticate, authorizeStaff("MANAGER", "ADMIN"), controller.delete);

module.exports = router;
