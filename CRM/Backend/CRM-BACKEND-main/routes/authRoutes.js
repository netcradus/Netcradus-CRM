const express = require("express");
const router = express.Router();
const { createUserByAdmin, login, getUsers } = require("../controllers/authController");
const { seedAdmin } = require("../controllers/adminSeedController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// Seed first admin
router.post("/seed-admin", seedAdmin);

// Login Route
router.post("/login", login);

// Admin-only user management
router.get("/users", authMiddleware, adminMiddleware, getUsers);
router.post("/users", authMiddleware, adminMiddleware, createUserByAdmin);

module.exports = router;




