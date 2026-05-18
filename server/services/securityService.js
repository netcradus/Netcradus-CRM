const crypto = require("crypto");
const axios = require("axios");
const SecurityLog = require("../models/SecurityLog");

const GEO_CACHE_TTL_MS = Number(process.env.GEOLOCATION_CACHE_TTL_MS || 24 * 60 * 60 * 1000);
const GEO_NEGATIVE_CACHE_TTL_MS = Number(process.env.GEOLOCATION_NEGATIVE_CACHE_TTL_MS || 15 * 60 * 1000);
const GEO_TIMEOUT_MS = Number(process.env.GEOLOCATION_TIMEOUT_MS || 800);
const GEO_BACKOFF_MS = Number(process.env.GEOLOCATION_BACKOFF_MS || 10 * 60 * 1000);
const GEO_CACHE_MAX = Number(process.env.GEOLOCATION_CACHE_MAX || 500);
const geoCache = new Map();
const pendingGeoLookups = new Map();
let geoProviderBackoffUntil = 0;
let lastGeoErrorLogAt = 0;

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

const normalizeIp = (ip = "") => {
    const raw = String(ip || "").split(",")[0].trim();
    return raw.startsWith("::ffff:") ? raw.substring(7) : raw;
};

const isPrivateIp = (ip = "") => {
    const value = normalizeIp(ip);
    return !value ||
        value === "unknown" ||
        value === "::1" ||
        value === "127.0.0.1" ||
        value.startsWith("10.") ||
        value.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(value) ||
        /^169\.254\./.test(value) ||
        /^fc00:/i.test(value) ||
        /^fd[0-9a-f]{2}:/i.test(value);
};

const setGeoCache = (ip, value, ttlMs) => {
    if (geoCache.size >= GEO_CACHE_MAX) {
        const oldestKey = geoCache.keys().next().value;
        if (oldestKey) geoCache.delete(oldestKey);
    }

    geoCache.set(ip, {
        value,
        expiresAt: Date.now() + ttlMs,
    });
};

const logGeoError = (message) => {
    const now = Date.now();
    if (now - lastGeoErrorLogAt > 60 * 1000) {
        console.warn("GeoLocation Error:", message);
        lastGeoErrorLogAt = now;
    }
};

/**
 * Get Geolocation from IP using ip-api.com (Free tier)
 */
const getIpGeoLocation = async (ip) => {
    const normalizedIp = normalizeIp(ip);

    if (isPrivateIp(normalizedIp)) {
        return null;
    }

    const cached = geoCache.get(normalizedIp);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
    }
    geoCache.delete(normalizedIp);

    if (Date.now() < geoProviderBackoffUntil) {
        return null;
    }

    if (pendingGeoLookups.has(normalizedIp)) {
        return pendingGeoLookups.get(normalizedIp);
    }

    const lookup = (async () => {
    try {
        const response = await axios.get(`http://ip-api.com/json/${normalizedIp}?fields=status,lat,lon,country,city`, { timeout: GEO_TIMEOUT_MS });
        if (response.data && response.data.status === "success") {
            const location = {
                lat: response.data.lat,
                lon: response.data.lon,
                country: response.data.country,
                city: response.data.city
            };
            setGeoCache(normalizedIp, location, GEO_CACHE_TTL_MS);
            return location;
        }
    } catch (error) {
        if (error.response?.status === 429) {
            geoProviderBackoffUntil = Date.now() + GEO_BACKOFF_MS;
        }
        logGeoError(error.message);
    }
    setGeoCache(normalizedIp, null, GEO_NEGATIVE_CACHE_TTL_MS);
    return null;
    })();

    pendingGeoLookups.set(normalizedIp, lookup);
    try {
        return await lookup;
    } finally {
        pendingGeoLookups.delete(normalizedIp);
    }
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
