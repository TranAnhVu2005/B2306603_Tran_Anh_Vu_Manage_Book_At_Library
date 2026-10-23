const express = require("express");
const controller = require("../controllers/audit-log.controller");
const { authenticate, authorizeAdmin } = require("../middleware/auth.middleware");

const router = express.Router();
router.get("/", authenticate, authorizeAdmin, controller.findAll);

module.exports = router;
