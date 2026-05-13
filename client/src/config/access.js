export const ALL_ROLES = [
  "super_user",
  "admin",
  "management",
  "sales",
  "support",
  "hr",
  "it",
  "digital_media",
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
  crmLeads: ["super_user", "admin", "sales"],
  crmAccounts: ["super_user", "admin"],
  crmContacts: ["super_user", "hr"],
  crmDeals: ["super_user", "sales"],
  projects: ["super_user", "it", "management"],
  management: ["super_user", "management"],
  tasks: ["super_user", "admin", "management", "sales", "support", "hr", "it", "digital_media"],
  calls: ["super_user", "management", "sales", "support"],
  cases: ["super_user", "support"],
  solutions: ["super_user", "management", "support"],
  meetings: ["super_user", "sales"],
  visits: ["super_user", "sales"],
  vendors: ["super_user", "management", "sales"],
  products: ["super_user", "management", "sales"],
  forecasts: ["super_user", "management", "sales"],
  marketing: ["super_user", "digital_media"],
  reports: ["super_user", "digital_media"],
  attendance: ALL_ROLES,
  attendanceAdmin: ["super_user", "admin", "hr"],
  personal: ALL_ROLES,
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
