const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const AuditLog = require("../models/AuditLog");
const PasswordManagerCredential = require("../models/PasswordManagerCredential");
const { checkReAuthToken, verifyPasswordForReAuth } = require("./authController");

const REVEAL_MS = 5 * 60 * 1000;

const getKey = () => {
  const secret = process.env.PASSWORD_MANAGER_ENCRYPTION_KEY || process.env.JWT_SECRET || "crm-password-manager-dev-key";
  return crypto.createHash("sha256").update(secret).digest();
};

const encryptPassword = (value) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value || ""), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encryptedPassword: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
};

const decryptPassword = (doc) => {
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(doc.iv, "base64"));
  decipher.setAuthTag(Buffer.from(doc.authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(doc.encryptedPassword, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
};

const serializeListRow = (doc) => ({
  _id: doc._id,
  accountName: doc.accountName,
  username: doc.username,
  userEmail: doc.userEmail,
  description: doc.description || "",
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

const requireSuperUser = async (req, res, next) => {
  if (String(req.user?.role || "").trim().toLowerCase() === "super_user") return next();

  await AuditLog.create({
    action: "PASSWORD_MANAGER_UNAUTHORIZED",
    performedBy: req.user?._id,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
    details: { path: req.originalUrl },
  });
  return res.status(403).json({ message: "Only super users can access Password Manager." });
};

const requireFreshAuth = (req, res, next) => {
  const authHeader = String(req.headers.authorization || "");
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
  const decoded = jwt.decode(token);
  const issuedAt = req.authIssuedAt || decoded?.iat;

  if (!issuedAt || Date.now() - issuedAt * 1000 > 30 * 60 * 1000) {
    return res.status(401).json({
      message: "Password Manager requires a fresh login.",
      code: "FRESH_LOGIN_REQUIRED",
    });
  }
  return next();
};

const verifyPassword = (req, res) => verifyPasswordForReAuth(req, res);

const listCredentials = async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10));
  const limit = Math.min(50, Math.max(10, Number.parseInt(req.query.limit || "10", 10)));
  const search = String(req.query.q || "").trim();
  const sortBy = ["accountName", "username", "userEmail", "createdAt"].includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
  const order = String(req.query.order || "desc").toLowerCase() === "asc" ? 1 : -1;

  const query = search
    ? {
        $or: [
          { accountName: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
          { userEmail: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    PasswordManagerCredential.find(query)
      .sort({ [sortBy]: order, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    PasswordManagerCredential.countDocuments(query),
  ]);

  return res.json({
    rows: rows.map(serializeListRow),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
};

const createCredential = async (req, res) => {
  const { accountName, username, userEmail, password, description } = req.body;
  if (!accountName || !username || !userEmail || !password) {
    return res.status(400).json({ message: "Account name, username, email, and password are required." });
  }

  const encrypted = encryptPassword(password);
  const doc = await PasswordManagerCredential.create({
    accountName: String(accountName).trim(),
    username: String(username).trim(),
    userEmail: String(userEmail).trim().toLowerCase(),
    description: String(description || "").trim(),
    ...encrypted,
    createdBy: req.user._id,
  });

  await AuditLog.create({
    action: "PASSWORD_CREATED",
    performedBy: req.user._id,
    entityType: "PasswordManagerCredential",
    entityId: doc._id,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
    details: { accountName: doc.accountName, username: doc.username, status: "SUCCESS" },
  });

  return res.status(201).json(serializeListRow(doc));
};

const viewCredential = async (req, res) => {
  const doc = await PasswordManagerCredential.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Credential not found." });

  await AuditLog.create({
    action: "PASSWORD_VIEWED",
    performedBy: req.user._id,
    entityType: "PasswordManagerCredential",
    entityId: doc._id,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
    details: { accountName: doc.accountName, username: doc.username, status: "SUCCESS" },
  });

  return res.json({
    ...serializeListRow(doc),
    password: decryptPassword(doc),
    unlockedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + REVEAL_MS).toISOString(),
  });
};

const updateCredential = async (req, res) => {
  const doc = await PasswordManagerCredential.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Credential not found." });

  const { accountName, username, userEmail, password, description } = req.body;
  if (accountName !== undefined) doc.accountName = String(accountName).trim();
  if (username !== undefined) doc.username = String(username).trim();
  if (userEmail !== undefined) doc.userEmail = String(userEmail).trim().toLowerCase();
  if (description !== undefined) doc.description = String(description || "").trim();
  if (password) {
    const encrypted = encryptPassword(password);
    doc.encryptedPassword = encrypted.encryptedPassword;
    doc.iv = encrypted.iv;
    doc.authTag = encrypted.authTag;
  }
  doc.updatedBy = req.user._id;
  await doc.save();

  await AuditLog.create({
    action: "PASSWORD_UPDATED",
    performedBy: req.user._id,
    entityType: "PasswordManagerCredential",
    entityId: doc._id,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
    details: { accountName: doc.accountName, username: doc.username, status: "SUCCESS" },
  });

  return res.json(serializeListRow(doc));
};

const deleteCredential = async (req, res) => {
  const doc = await PasswordManagerCredential.findByIdAndDelete(req.params.id);
  if (!doc) return res.status(404).json({ message: "Credential not found." });

  await AuditLog.create({
    action: "PASSWORD_DELETED",
    performedBy: req.user._id,
    entityType: "PasswordManagerCredential",
    entityId: doc._id,
    ipAddress: req.ip,
    userAgent: req.get("User-Agent"),
    details: { accountName: doc.accountName, username: doc.username, status: "SUCCESS" },
  });

  return res.json({ message: "Credential deleted successfully." });
};

module.exports = {
  requireSuperUser,
  requireFreshAuth,
  requireReAuth: checkReAuthToken,
  verifyPassword,
  listCredentials,
  createCredential,
  viewCredential,
  updateCredential,
  deleteCredential,
};
