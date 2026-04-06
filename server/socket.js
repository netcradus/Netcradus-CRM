const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("./models/User");

let ioInstance = null;

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
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

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
