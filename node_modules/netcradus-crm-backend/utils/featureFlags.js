const isEnabled = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") return defaultValue;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const isDriveEnabled = () => isEnabled(process.env.DRIVE_FEATURE_ENABLED, false);

module.exports = {
  isDriveEnabled,
};
