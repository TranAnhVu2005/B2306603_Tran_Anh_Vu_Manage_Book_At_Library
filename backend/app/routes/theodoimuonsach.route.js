const express = require("express");
const controller = require("../controllers/theodoimuonsach.controller");
const { authenticate, authorizeStaff } = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/")
    .get(controller.findAll)
    .post(controller.dangKyMuon);

router.route("/:id")
    .get(controller.findOne)
    .delete(controller.delete);
    

router.route("/:id/duyet")
    .put(authenticate, authorizeStaff("MANAGER", "ADMIN"), controller.duyetMuon);

router.route("/:id/tu-choi")
    .put(controller.tuChoiMuon);

router.route("/:id/tra-sach")
    .put(controller.xacNhanTra);

router.route("/:id/bao-mat")
    .put(controller.baoMat);

module.exports = router;
