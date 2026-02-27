const SecurityLog = require("../models/SecurityLog");

/**
 * Audit log for auth events
 */
const logAuthEvent = async (userId, action, ipAddress, userAgent, errorMessage = null) => {
    try {
        await SecurityLog.create({
            userId,
            action,
            ipAddress,
            userAgent,
            errorMessage,
        });
    } catch (error) {
        console.error("Failed to write to SecurityLog:", error);
        // don't throw to prevent interrupting auth flow over logging errors
    }
};

module.exports = {
    logAuthEvent
};
