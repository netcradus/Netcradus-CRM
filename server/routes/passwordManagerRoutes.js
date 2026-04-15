const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const passwordManagerController = require("../controllers/passwordManagerController");
const { passwordVerificationLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.use(authMiddleware, passwordManagerController.requireSuperUser, passwordManagerController.requireFreshAuth);

router.get("/list", passwordManagerController.listCredentials);
router.post("/create", passwordManagerController.createCredential);
router.post("/verify-password", passwordVerificationLimiter, passwordManagerController.verifyPassword);
router.get("/view/:id", passwordManagerController.requireReAuth, passwordManagerController.viewCredential);
router.put("/update/:id", passwordManagerController.requireReAuth, passwordManagerController.updateCredential);
router.delete("/delete/:id", passwordManagerController.requireReAuth, passwordManagerController.deleteCredential);

module.exports = router;
