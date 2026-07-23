const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");
const zohoAccountMiddleware = require("../middleware/zohoAccountMiddleware");
const {
  getConnectionStatus,
  initiateOAuth,
  handleCallback,
  disconnectZoho,
  getZohoHealth,
} = require("../controllers/zohoAuthController");
const {
  linkUserZohoAccount,
  unlinkUserZohoAccount,
  getLinkedAccounts,
} = require("../controllers/zohoAccountController");
const mailController = require("../controllers/mailController");
const rateLimit = require("express-rate-limit");

const router = express.Router();

const mailStandardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  keyGenerator: (req) => req.user?._id || req.user?.id || req.ip,
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
});

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?._id || req.user?.id || req.ip,
  validate: { keyGeneratorIpFallback: false },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id || req.user?.id || req.ip,
  validate: { keyGeneratorIpFallback: false },
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?._id || req.user?.id || req.ip,
  validate: { keyGeneratorIpFallback: false },
});

router.get("/zoho/callback", handleCallback);

router.use(authMiddleware);

router.get("/zoho/status", rbac(["super_user"]), getConnectionStatus);
router.get("/zoho/connect", rbac(["super_user"]), initiateOAuth);
router.post("/zoho/disconnect", rbac(["super_user"]), disconnectZoho);
router.get("/health/zoho", rbac(["super_user"]), getZohoHealth);

router.post("/zoho/accounts/link", rbac(["super_user"]), linkUserZohoAccount);
router.delete("/zoho/accounts/:userId/unlink", rbac(["super_user"]), unlinkUserZohoAccount);
router.get("/zoho/accounts", rbac(["super_user"]), getLinkedAccounts);

router.use("/mail", zohoAccountMiddleware, mailStandardLimiter);

router.get("/mail/folders", mailController.getFolders);
router.get("/mail/messages", mailController.getMessages);
router.get("/mail/messages/:messageId", mailController.getMessage);
router.post("/mail/messages/send", sendLimiter, mailController.sendMessage);
router.post("/mail/messages/:messageId/reply", sendLimiter, mailController.replyToMessage);
router.get("/mail/search", searchLimiter, mailController.searchMessages);
router.post("/mail/attachments/upload", uploadLimiter, mailController.uploadAttachment);
router.get("/mail/attachments/:messageId/:attachmentId", mailController.downloadAttachment);
router.delete("/mail/messages/:messageId", mailController.deleteMessage);
router.post("/mail/messages/:messageId/link", mailController.linkEmailToEntity);
router.delete("/mail/messages/:messageId/link", mailController.unlinkEmailFromEntity);
router.get("/mail/entity/:entityType/:entityId", mailController.getEmailsForEntity);
router.patch("/mail/messages/:messageId/note", mailController.updateCrmNote);

module.exports = router;
