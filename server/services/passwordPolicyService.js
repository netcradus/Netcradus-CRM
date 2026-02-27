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

/**
 * Compares new password against history to prevent reuse
 */
const checkHistory = async (userId, newPlainPassword) => {
    const user = await User.findById(userId);
    if (!user || !user.previousPasswords || user.previousPasswords.length === 0) {
        return { valid: true };
    }

    for (const storedHash of user.previousPasswords) {
        const isMatch = await bcrypt.compare(newPlainPassword, storedHash);
        if (isMatch) {
            return {
                valid: false,
                message: `You cannot reuse any of your last ${user.previousPasswords.length} passwords.`
            };
        }
    }

    return { valid: true };
};

module.exports = {
    validateStrength,
    checkHistory
};
