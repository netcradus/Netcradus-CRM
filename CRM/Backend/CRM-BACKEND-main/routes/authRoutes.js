const express = require("express");
const router = express.Router();
const { register, login, getUsers } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// Register Route
router.post("/register", register);

// Login Route
router.post("/login", login);

// Get all users (admin only - for assigning leads)
router.get("/users", authMiddleware, getUsers);

module.exports = router;




