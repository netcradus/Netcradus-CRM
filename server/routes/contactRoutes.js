// contactRoutes.js
const express = require("express");
const router = express.Router();
const contactsController = require("../controllers/contactsController");

const authMiddleware = require("../middleware/authMiddleware");
const rbac = require("../middleware/rbac");
const { checkReAuthToken } = require("../controllers/authController");

// Public access (with role hierarchy)
router.get("/", authMiddleware, contactsController.getContacts);
router.get("/profiles", authMiddleware, rbac(["super_user", "hr"]), contactsController.listEmployeeProfiles);
router.get("/profiles/me", authMiddleware, contactsController.getMyProfile);
router.put("/profiles/me", authMiddleware, contactsController.updateMyProfile);
router.put("/profiles/:userId", authMiddleware, rbac(["super_user", "hr"]), contactsController.updateEmployeeProfile);
router.post("/profiles/:userId/salary-slips", authMiddleware, rbac(["super_user", "hr"]), contactsController.generateSalarySlip);
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
