const jwt = require("jsonwebtoken");
const User = require("../models/User");

const INVALID_TOKEN_VALUES = new Set(["undefined", "null", ""]);

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  let headerToken = null;

  if (typeof authHeader === "string") {
    const trimmedHeader = authHeader.trim();

    if (/^Bearer\s+/i.test(trimmedHeader)) {
      headerToken = trimmedHeader.replace(/^Bearer\s+/i, "").trim();
    } else if (!trimmedHeader.includes(" ")) {
      headerToken = trimmedHeader;
    }
  }

  const queryToken = typeof req.query.token === "string" ? req.query.token.trim() : "";
  const candidate = headerToken || queryToken;

  if (!candidate || INVALID_TOKEN_VALUES.has(candidate.toLowerCase())) {
    return null;
  }

  return candidate;
};

// Auth middleware - checks if user is authenticated
// Accepts token from Authorization header OR ?token= query param
// (query param is needed for browser-navigated routes like document view proxy)
const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({ message: "No token provided. Please login first." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password has been changed since token was issued
    // decoded.iat is in seconds, lastPasswordChange is in MS
    if (user.lastPasswordChange) {
      const changedTimestamp = parseInt(user.lastPasswordChange.getTime() / 1000, 10);
      if (decoded.iat < changedTimestamp) {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
    }

    // Attach user to request
    req.user = user;
    req.authIssuedAt = decoded.iat;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized. Invalid or expired token." });
    }

    console.error("Auth Middleware Error:", err);
    return res.status(401).json({ message: "Unauthorized. Invalid or expired token.", error: err.message });
  }
};

module.exports = authMiddleware;
