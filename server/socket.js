const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

let ioInstance = null;
const INVALID_TOKEN_VALUES = new Set(["undefined", "null", ""]);

const normalizeToken = (value) => {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  const token = trimmedValue.replace(/^Bearer\s+/i, "").trim();

  if (!token || INVALID_TOKEN_VALUES.has(token.toLowerCase())) {
    return null;
  }

  return token;
};

function initializeSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || true,
      methods: ["GET", "POST"],
    },
  });

  ioInstance.use(async (socket, next) => {
    try {
      const token =
        normalizeToken(socket.handshake.auth?.token) ||
        normalizeToken(socket.handshake.headers?.authorization);

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id role name");

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.user = user;
      socket.join(`user:${user._id}`);
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", (socket) => {
    socket.emit("socket:ready", {
      userId: String(socket.user._id),
      role: socket.user.role,
    });
  });

  return ioInstance;
}

function emitToUsers(userIds, eventName, payload) {
  if (!ioInstance || !Array.isArray(userIds)) return;

  [...new Set(userIds.filter(Boolean).map(String))].forEach((userId) => {
    ioInstance.to(`user:${userId}`).emit(eventName, payload);
  });
}

module.exports = {
  initializeSocket,
  emitToUsers,
};
