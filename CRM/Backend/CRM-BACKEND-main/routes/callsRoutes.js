const express = require("express");
const router = express.Router();
const callsController = require("../controllers/callsController");

// Routes
router.get("/", callsController.getCalls);
router.post("/", callsController.createCall);
router.get("/:id", callsController.getCallById);
router.put("/:id", callsController.updateCall);
router.delete("/:id", callsController.deleteCall);

module.exports = router;
