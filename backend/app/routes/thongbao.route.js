const express = require("express");
const controller = require("../controllers/thongbao.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authenticate, controller.findMine);
router.put("/read-all", authenticate, controller.markAllRead);
router.put("/:id/read", authenticate, controller.markRead);

module.exports = router;
