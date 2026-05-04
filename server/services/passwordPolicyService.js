const bcrypt = require("bcryptjs");
const User = require("../models/User");

/**
 * Verifies that the password meets Enterprise requirements:
 * Min 8, Max 128 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
const validateStrength = (password) => {
    if (!password || password.length < 8 || password.length > 128) {
        return { valid: false, message: "Password must be between 8 and 128 characters long." };
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return {
            valid: false,
            message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
        };
    }

    return { valid: true };
};

const PasswordHistory = require("../models/PasswordHistory");

/**
 * Compares new password against history to prevent reuse
 */
const checkHistory = async (userId, newPlainPassword) => {
    const history = await PasswordHistory.find({ userId }).sort({ createdAt: -1 });
    if (!history || history.length === 0) {
        return { valid: true };
    }

    for (const record of history) {
        const isMatch = await bcrypt.compare(newPlainPassword, record.passwordHash);
        if (isMatch) {
            return {
                valid: false,
                message: `You cannot reuse any of your last ${history.length} passwords.`
            };
        }
    }

    return { valid: true };
};

module.exports = {
    validateStrength,
    checkHistory
};
