const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
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

        const username = process.env.SUPER_USER_SEED_USERNAME || "info@netcradus.com";
        const plainPassword = process.env.SUPER_USER_SEED_PASSWORD;

        if (!plainPassword) {
            console.error("Error: SUPER_USER_SEED_PASSWORD is not set in .env");
            process.exit(1);
        }

        const email = username.includes("@") ? username.toLowerCase() : `${username.toLowerCase()}@netcradus.com`;

        const existingSuperUser = await User.findOne({ role: "super_user" });
        if (existingSuperUser) {
            console.log(`Super User already exists (found user: ${existingSuperUser.email}). Only one super_user is allowed via seed.`);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // Generate userId (superuser_001)
        const uniqueId = `superuser_001`;

        const superUser = new User({
            userId: uniqueId,
            name: username.split("@")[0],
            email,
            password: hashedPassword,
            role: "super_user",
            lastPasswordChange: new Date(),
            lastWeeklyVerification: new Date()
        });

        await superUser.save();

        console.log("Super User seeded successfully:");
        console.log(`- UserID: ${superUser.userId}`);
        console.log(`- Email: ${superUser.email}`);
        console.log(`- Role: ${superUser.role}`);

        process.exit(0);
    } catch (error) {
        console.error("Seed Admin Error:", error);
        process.exit(1);
    }
};

seedAdmin();
