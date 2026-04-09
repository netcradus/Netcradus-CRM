// contactRoutes.js
const express = require("express");
const router = express.Router();
const contactsController = require("../controllers/contactsController");

const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");
const { checkReAuthToken } = require("../controllers/authController");

// Public access (with role hierarchy)
router.get("/", authMiddleware, contactsController.getContacts);
router.post("/", authMiddleware, rbac(["admin"]), contactsController.createContact);
router.get("/:id", authMiddleware, contactsController.getContactById);
router.put("/:id", authMiddleware, rbac(["admin"]), contactsController.updateContact);
router.delete("/:id", authMiddleware, rbac(["admin"]), contactsController.deleteContact);
router.get("/:id/salary-slips", authMiddleware, contactsController.getSalarySlipList);
router.get("/:id/salary-slips/:index/download", authMiddleware, contactsController.downloadSalarySlip);

// Sensitive Information Access (Requires re-auth)
router.get(
  "/:id/sensitive",
  authMiddleware,
  rbac(["admin", "super_user", "hr"]),
  checkReAuthToken,
  contactsController.getContactSensitive
);

module.exports = router;
