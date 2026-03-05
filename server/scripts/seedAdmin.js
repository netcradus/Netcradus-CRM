const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");
const User = require("../models/User");

// Load .env
dotenv.config({ path: path.join(__dirname, "../.env") });

const seedAdmin = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const username = process.env.ADMIN_SEED_USERNAME || "admin@netcradus.com";
        const plainPassword = process.env.ADMIN_SEED_PASSWORD;

        if (!plainPassword) {
            console.error("Error: ADMIN_SEED_PASSWORD is not set in .env");
            process.exit(1);
        }

        const email = username.includes("@") ? username.toLowerCase() : `${username.toLowerCase()}@netcradus.com`;

        const existingAdmin = await User.findOne({ role: "admin" });
        if (existingAdmin) {
            console.log(`Admin user already exists (found user: ${existingAdmin.email}). Only one admin is allowed.`);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Generate userId (admin_001)
        const uniqueId = `admin_001`;

        const admin = new User({
            userId: uniqueId,
            name: username.split("@")[0],
            email,
            password: hashedPassword,
            role: "admin",
            lastPasswordChange: new Date(),
            lastWeeklyVerification: new Date()
        });

        await admin.save();

        console.log("Admin seeded successfully:");
        console.log(`- UserID: ${admin.userId}`);
        console.log(`- Email: ${admin.email}`);
        console.log(`- Role: ${admin.role}`);

        process.exit(0);
    } catch (error) {
        console.error("Seed Admin Error:", error);
        process.exit(1);
    }
};

seedAdmin();
