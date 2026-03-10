const crypto = require("crypto");
const axios = require("axios");
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
    }
};

/**
 * Generate a stable server-side device fingerprint hash.
 */
const generateDeviceFingerprint = (userAgent, platform, timezone, screenResolution) => {
    const rawString = `${userAgent}|${platform}|${timezone}|${screenResolution}`;
    return crypto.createHash("sha256").update(rawString).digest("hex");
};

/**
 * Get Geolocation from IP using ip-api.com (Free tier)
 */
const getIpGeoLocation = async (ip) => {
    try {
        // Skip local IPs
        if (ip === "::1" || ip === "127.0.0.1" || ip.startsWith("::ffff:127.")) {
            return { lat: 28.6139, lon: 77.2090 }; // Default to New Delhi for local testing
        }

        const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,lat,lon,country,city`);
        if (response.data && response.data.status === "success") {
            return {
                lat: response.data.lat,
                lon: response.data.lon,
                country: response.data.country,
                city: response.data.city
            };
        }
    } catch (error) {
        console.error("GeoLocation Error:", error.message);
    }
    return null;
};

/**
 * Calculate distance between two points in KM using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

module.exports = {
    logAuthEvent,
    generateDeviceFingerprint,
    getIpGeoLocation,
    calculateDistance
};
