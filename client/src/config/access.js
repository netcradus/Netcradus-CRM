export const ALL_ROLES = [
  "super_user",
  "admin",
  "management",
  "sales",
  "support",
  "hr",
  "it",
  "digital_media",
  "partner",
];

export const ACCESS_GROUPS = {
  all: ALL_ROLES,
  security: ["super_user"],
  userAdmin: ["super_user"],
  peopleOps: ["super_user", "hr"],
  tickets: ["super_user", "admin", "management", "sales", "support", "hr", "it", "digital_media"],
  financeAdmin: ["super_user", "admin"],
  financeBusiness: ["super_user", "admin", "management", "sales"],
  quotes: ["super_user", "management", "sales"],
  priceBooks: ["super_user", "management", "sales"],
  purchaseOrders: ["super_user", "management"],
  crmLeads: ["super_user", "sales"],
  crmAccounts: ["super_user", "admin"],
  crmContacts: ["super_user", "hr"],
  crmDeals: ["super_user"],
  projects: ["super_user", "it", "management"],
  management: ["super_user", "management"],
  tasks: ["super_user", "admin", "management", "sales", "support", "hr", "it", "digital_media"],
  calls: ["super_user", "management", "sales", "support"],
  cases: ["super_user", "support"],
  solutions: ["super_user", "management", "support"],
  meetings: ["super_user"],
  visits: ["super_user", "sales"],
  vendors: ["super_user", "management", "sales"],
  products: ["super_user", "management", "sales"],
  forecasts: ["super_user", "management", "sales"],
  marketing: ["super_user", "digital_media"],
  reports: ["super_user", "digital_media"],
  // Partners are external accounts and must not see attendance/HR employee flows.
  attendance: ALL_ROLES.filter((role) => role !== "partner"),
  attendanceAdmin: ["super_user", "admin", "hr"],
  // Personal employee tools exclude partners; partner profile is routed explicitly.
  personal: ALL_ROLES.filter((role) => role !== "partner"),
  partner: ["partner", "admin", "super_user"],
  admin: ["admin", "super_user"],
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
