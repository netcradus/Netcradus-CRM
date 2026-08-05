const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const isExternalClientSupportUser = (user) => {
  return normalizeRole(user?.role) === "support" && !!user?.clientId;
};

const isInternalUser = (user) => {
  if (user?.isDisabled) return false;
  if (normalizeRole(user?.role) === "partner") return false;
  return !isExternalClientSupportUser(user);
};

const buildExternalClientSupportQuery = () => {
  return {
    role: "support",
    clientId: { $ne: null }
  };
};

const buildInternalUserQuery = () => {
  return {
    isDisabled: { $ne: true },
    role: { $ne: "partner" },
    $or: [
      { role: { $ne: "support" } },
      { clientId: null }
    ]
  };
};

module.exports = {
  isExternalClientSupportUser,
  isInternalUser,
  buildExternalClientSupportQuery,
  buildInternalUserQuery
};
