const rbac = (allowedRoles) => {
  const roleHierarchy = {
    'super_user': 3,
    'admin': 2,
    'management': 1
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const userRoleValue = roleHierarchy[req.user.role] || 0;
    const isAllowed = allowedRoles.some(role => userRoleValue >= (roleHierarchy[role] || 0));

    if (!isAllowed) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges', code: 'FORBIDDEN' });
    }

    next();
  };
};

module.exports = rbac;
