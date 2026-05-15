const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const {
  onboardingSubmissionLimiter,
} = require("../middleware/rateLimiter");
const {
  getOnboardingStatus,
  submitStep1,
  submitStep2,
  getMyOnboardingRecord,
} = require("../controllers/onboardingController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPEG, PNG, WEBP and PDF files are allowed."));
    }

    callback(null, true);
  },
});

router.use(authMiddleware);

router.get("/status", getOnboardingStatus);
router.post(
  "/step1",
  onboardingSubmissionLimiter,
  upload.fields([
    { name: "aadhaarCopy", maxCount: 1 },
    { name: "photo", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
  ]),
  submitStep1
);
router.post("/step2", onboardingSubmissionLimiter, submitStep2);
router.get("/my-record", getMyOnboardingRecord);

module.exports = router;
