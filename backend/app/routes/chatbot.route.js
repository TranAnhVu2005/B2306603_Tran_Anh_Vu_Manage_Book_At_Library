const express = require("express");
const controller = require("../controllers/chatbot.controller");
const { optionalAuth } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/ask", optionalAuth, controller.ask);

module.exports = router;
