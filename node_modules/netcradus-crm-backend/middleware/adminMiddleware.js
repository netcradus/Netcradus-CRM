const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role !== "admin" && req.user.role !== "super_user") {
    return res.status(403).json({ message: "Only administrators can perform this action" });
  }

  next();
};

module.exports = adminMiddleware;
