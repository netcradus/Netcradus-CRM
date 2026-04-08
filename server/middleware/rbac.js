const rbac = (allowedRoles = []) => {
  const normalizedAllowedRoles = allowedRoles.map((role) => String(role).trim().toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized", code: "UNAUTHORIZED" });
    }

    const currentRole = String(req.user.role || "").trim().toLowerCase();
    const isAllowed = normalizedAllowedRoles.includes(currentRole);

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Insufficient privileges",
        code: "FORBIDDEN",
      });
    }

    next();
  };
};

module.exports = rbac;
