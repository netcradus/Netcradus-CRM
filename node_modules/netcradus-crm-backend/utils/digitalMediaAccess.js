const PRIVILEGED_ROLES = new Set(["admin", "hr", "super_user"]);
const DIGITAL_MEDIA_ROLES = ["digital_media", "admin", "hr", "super_user"];

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const isPrivilegedRole = (role) => PRIVILEGED_ROLES.has(normalizeRole(role));

const isPrivilegedUser = (user) => isPrivilegedRole(user?.role);

const ensureOwnership = (document, req) => {
  if (!document) {
    return { allowed: false, status: 404, message: "Record not found" };
  }

  if (isPrivilegedUser(req.user)) {
    return { allowed: true };
  }

  const ownerId = document.userId || document.createdBy || document.uploadedBy;
  if (!ownerId) {
    return { allowed: true };
  }

  if (String(ownerId) === String(req.user._id)) {
    return { allowed: true };
  }

  return { allowed: false, status: 403, message: "Forbidden" };
};

const getScopedQuery = (req, ownerField = "userId", baseQuery = {}, includeLegacy = true) => {
  if (isPrivilegedUser(req.user)) {
    return baseQuery;
  }

  if (includeLegacy) {
    return {
      ...baseQuery,
      $or: [{ [ownerField]: req.user._id }, { [ownerField]: { $exists: false } }, { [ownerField]: null }],
    };
  }

  return {
    ...baseQuery,
    [ownerField]: req.user._id,
  };
};

module.exports = {
  DIGITAL_MEDIA_ROLES,
  isPrivilegedRole,
  isPrivilegedUser,
  ensureOwnership,
  getScopedQuery,
};
