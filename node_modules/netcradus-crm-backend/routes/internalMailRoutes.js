const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const ctrl = require("../controllers/internalMailController");
const authMiddleware = require("../middleware/authMiddleware");

// Secure authentication required for all routes
router.use(authMiddleware);

// Multer Disk Storage Configuration for Mail Attachments
const mailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads/mail";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg"
];

const mailUpload = multer({
  storage: mailStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Permitted: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG."), false);
    }
  }
});

// Mail actions
router.post("/", mailUpload.array("files", 5), ctrl.sendMail);
router.post("/draft", mailUpload.array("files", 5), ctrl.saveDraft);
router.put("/draft/:mailId", mailUpload.array("files", 5), ctrl.updateDraft);

router.get("/inbox", ctrl.listInbox);
router.get("/sent", ctrl.listSent);
router.get("/drafts", ctrl.listDrafts);
router.get("/deleted", ctrl.listDeleted);
router.get("/unread-count", ctrl.getUnreadCount);
router.get("/users", ctrl.getActiveUsers);

router.get("/:mailId", ctrl.readMail);
router.patch("/:mailId/read", ctrl.toggleReadState);
router.patch("/:mailId/star", ctrl.toggleStarred);
router.patch("/:mailId/delete", ctrl.softDelete);
router.patch("/:mailId/restore", ctrl.restoreMail);
router.get("/:mailId/attachment/:attachmentId/download", ctrl.downloadAttachment);

module.exports = router;
