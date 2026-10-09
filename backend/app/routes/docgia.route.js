const express = require("express");
const controller = require("../controllers/docgia.controller");

const router = express.Router();

router.route("/")
    .get(controller.findAll)
    .post(controller.create);

router.route("/:id")
    .get(controller.findOne)
    .put(controller.update)
    .delete(controller.delete);

router.route("/:id/role")
    .put(controller.updateRole);

router.route("/:id/unblock")
    .put(controller.unblock);

module.exports = router;
