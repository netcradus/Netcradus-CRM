// contactRoutes.js
const express = require("express");
const router = express.Router();
const contactsController = require("../controllers/contactsController");

const rbac = require("../middleware/rbac");
const { checkReAuthToken } = require("../controllers/authController");

// Public access (with role hierarchy)
router.get("/", contactsController.getContacts);
router.get("/profiles", rbac(["super_user", "hr", "coo"]), contactsController.listEmployeeProfiles);
router.get("/profiles/me", contactsController.getMyProfile);
router.put("/profiles/me", contactsController.updateMyProfile);
router.put("/profiles/:userId", rbac(["super_user", "hr", "coo"]), contactsController.updateEmployeeProfile);
router.post("/profiles/:userId/photo", rbac(["super_user", "hr", "coo"]), contactsController.uploadProfilePhoto);
router.delete("/profiles/:userId/photo", rbac(["super_user", "hr", "coo"]), contactsController.deleteProfilePhoto);
router.get("/profiles/:userId/photo", contactsController.getProfilePhoto);
router.post("/:userId/salary-slips", rbac(["super_user", "hr", "coo"]), contactsController.generateSalarySlip);
router.post("/", rbac(["admin"]), contactsController.createContact);
router.get("/:id", contactsController.getContactById);
router.put("/:id", rbac(["admin"]), contactsController.updateContact);
router.delete("/:id", rbac(["admin"]), contactsController.deleteContact);
router.get("/:id/salary-slips", contactsController.getSalarySlipList);
router.get("/salary-slips/:id/download", contactsController.downloadSalarySlip);

// Sensitive Information Access (Requires re-auth)
router.get(
  "/:id/sensitive",
  rbac(["admin", "super_user", "hr", "coo"]),
  checkReAuthToken,
  contactsController.getContactSensitive
);

module.exports = router;
