const express = require("express");
const controller = require("../controllers/sach.controller");
const { authenticate, authorizeStaff, authorizeAdmin } = require("../middleware/auth.middleware");
const { allowFields } = require("../middleware/security.middleware");
const { validateImageUpload } = require("../middleware/upload.middleware");

const router = express.Router();
const createUploader = require("../middleware/upload.middleware");

const upload = createUploader();

// Gắn middleware upload.single("HinhAnh") vào route POST (Thêm) và PUT (Sửa)
router.route("/")
    .get((req, res, next) => {
        if (req.query.includeDeleted === "true") {
            return authenticate(req, res, (authError) => {
                if (authError) return next(authError);
                return authorizeAdmin(req, res, next);
            });
        }
        return next();
    }, controller.findAll)
    .post(authenticate, authorizeStaff("STAFF", "ADMIN"), upload.single("HinhAnh"), validateImageUpload, allowFields("TenSach", "DonGia", "SoQuyen", "NamXuatBan", "MaNXB", "MaTheLoai", "TacGia", "HinhAnh", "MoTa"), controller.create);

router.route("/:id")
    .get(controller.findOne)
    .put(authenticate, authorizeStaff("STAFF", "ADMIN"), upload.single("HinhAnh"), validateImageUpload, allowFields("TenSach", "DonGia", "SoQuyen", "NamXuatBan", "MaNXB", "MaTheLoai", "TacGia", "HinhAnh", "MoTa"), controller.update)
    .delete(authenticate, authorizeStaff("STAFF", "ADMIN"), controller.delete);

router.route("/:id/restore")
    .put(authenticate, authorizeAdmin, controller.restore);

module.exports = router;
