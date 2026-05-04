export const formatRoleLabel = (role = "general") => {
  return role === "admin"
    ? "Administrator"
    : String(role)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};
