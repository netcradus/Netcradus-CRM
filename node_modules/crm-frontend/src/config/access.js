export const ALL_ROLES = [
  "super_user",
  "admin",
  "management",
  "manager",
  "sales",
  "support",
  "hr",
  "it",
  "digital_media",
  "partner",
  "coo",
];

export const ACCESS_GROUPS = {
  all: ALL_ROLES,
  security: ["super_user"],
  userAdmin: ["super_user"],
  peopleOps: ["super_user", "hr", "coo"],
  tickets: ["super_user", "admin", "management", "manager", "sales", "support", "hr", "it", "digital_media", "coo"],
  financeAdmin: ["super_user", "admin", "coo"],
  financeBusiness: ["super_user", "admin", "management", "sales", "coo"],
  quotes: ["super_user", "management", "sales", "coo"],
  priceBooks: ["super_user", "management", "sales", "coo"],
  purchaseOrders: ["super_user", "management", "coo"],
  crmLeads: ["super_user", "sales", "coo"],
  crmAccounts: ["super_user", "admin"],
  crmContacts: ["super_user", "hr", "coo"],
  crmDeals: ["super_user", "coo"],
  crmClients: ["super_user", "coo", "admin", "manager", "sales", "finance"],
  projects: ["super_user", "it", "management", "coo"],
  management: ["super_user", "management", "coo"],
  // Manager Portal is the dedicated Phase 1 portal for the manager role.
  managerPortal: ["manager"],
  tasks: ["super_user", "admin", "management", "manager", "sales", "support", "hr", "it", "digital_media", "coo"],
  calls: ["super_user", "management", "sales", "support", "coo"],
  cases: ["super_user", "support", "coo"],
  solutions: ["super_user", "management", "support", "coo"],
  meetings: ["super_user", "coo"],
  visits: ["super_user", "sales", "coo"],
  vendors: ["super_user", "management", "sales", "coo"],
  products: ["super_user", "management", "sales", "coo"],
  forecasts: ["super_user", "management", "sales", "coo"],
  marketing: ["super_user", "digital_media", "coo"],
  reports: ["super_user", "digital_media", "coo"],
  // Partners are external accounts and must not see attendance/HR employee flows.
  // Managers have attendance and personal tools.
  attendance: ALL_ROLES.filter((role) => role !== "partner"),
  attendanceAdmin: ["super_user", "admin", "hr", "coo"],
  // Personal employee tools exclude partners; partner profile is routed explicitly.
  personal: ALL_ROLES.filter((role) => role !== "partner"),
  partner: ["partner", "admin", "super_user"],
  admin: ["admin", "super_user"],
  riskManagement: ["super_user", "admin", "coo", "hr", "manager", "management", "sales", "support", "it", "digital_media"],
};

export function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

export function canAccess(role, allowedRoles = ALL_ROLES) {
  const normalizedRole = normalizeRole(role);
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  if (!normalizedRole) {
    return false;
  }

  if (normalizedRole === "super_user") {
    return true;
  }

  return normalizedAllowed.includes(normalizedRole);
}

export function isExternalClientSupportUser(user) {
  return normalizeRole(user?.role) === "support" && !!user?.clientId;
}

export function isInternalUser(user) {
  if (user?.isDisabled) return false;
  if (normalizeRole(user?.role) === "partner") return false;
  return !isExternalClientSupportUser(user);
}
