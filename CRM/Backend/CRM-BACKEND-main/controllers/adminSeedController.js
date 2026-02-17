const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async (req, res) => {
  try {
    const providedKey = req.headers["x-seed-key"] || req.body.seedKey;
    const requiredKey = process.env.ADMIN_SEED_KEY;

    if (requiredKey && providedKey !== requiredKey) {
      return res.status(403).json({ message: "Invalid seed key" });
    }

    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      return res.status(409).json({ message: "Admin user already exists" });
    }

    const username = String(
      req.body.username || process.env.ADMIN_SEED_USERNAME || "admin"
    ).trim();

    const plainPassword = String(
      req.body.password || process.env.ADMIN_SEED_PASSWORD || ""
    ).trim();

    if (!plainPassword) {
      return res.status(400).json({ message: "Admin password is required for seeding" });
    }

    const email = `${username.toLowerCase()}@netcradus.local`;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const admin = await User.create({
      name: username,
      email,
      password: hashedPassword,
      role: "admin",
    });

    return res.status(201).json({
      message: "Admin seeded successfully",
      user: {
        id: admin._id,
        username: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Seed Admin Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  seedAdmin,
};
