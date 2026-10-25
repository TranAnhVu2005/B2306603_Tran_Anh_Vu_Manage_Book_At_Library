const express = require("express");
const controller = require("../controllers/theodoimuonsach.controller");
const { authenticate, authorizeReader, authorizeStaff, authorizeAdmin } = require("../middleware/auth.middleware");
const { allowFields } = require("../middleware/security.middleware");

const router = express.Router();

router.route("/")
    .get(authenticate, controller.findAll)
    .post(authenticate, authorizeReader, allowFields("MaDocGia", "MaSach", "GhiChu"), controller.dangKyMuon);

router.route("/:id")
    .get(authenticate, controller.findOne)
    .delete(authenticate, authorizeAdmin, controller.delete);
    

router.route("/:id/duyet")
    .put(authenticate, authorizeStaff("STAFF", "ADMIN"), controller.duyetMuon);

router.route("/:id/giao-sach")
    .put(authenticate, authorizeStaff("STAFF", "ADMIN"), controller.giaoSach);

router.route("/:id/tu-choi")
    .put(authenticate, authorizeStaff("STAFF", "ADMIN"), allowFields("lyDo"), controller.tuChoiMuon);

router.route("/:id/huy")
    .put(authenticate, authorizeReader, controller.huyDangKy);

router.route("/:id/gia-han")
    .put(authenticate, authorizeReader, allowFields(), controller.giaHan);

router.route("/:id/tra-sach")
    .put(authenticate, authorizeStaff("STAFF", "ADMIN"), controller.xacNhanTra);

router.route("/:id/bao-mat")
    .put(authenticate, authorizeStaff("STAFF", "ADMIN"), allowFields("ghiChu"), controller.baoMat);

module.exports = router;
