const express = require("express");
const controller = require("../controllers/docgia.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.route("/")
    .get(controller.findAll)
    .post(controller.create);

router.route("/:id")
    .get(controller.findOne) // Chưa sử dụng trong frontend
    .put(authenticate, controller.update)
    .delete(controller.delete);

router.route("/:id/role")
    .put(controller.updateRole);

router.route("/:id/unblock")
    .put(authenticate, controller.unblock);

router.route("/:id/lock")
    .put(authenticate, controller.lock);

router.route("/:id/reinstate")
    .put(authenticate, controller.reinstate);

module.exports = router;
