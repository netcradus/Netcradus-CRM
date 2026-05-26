const User = require("../models/User");
const ZohoAccount = require("../models/ZohoAccount");
const zohoAuthService = require("../services/zohoAuthService");
const zohoMailService = require("../services/zohoMailService");

async function linkUserZohoAccount(req, res) {
  const { userId, zohoEmail } = req.body;

  if (!userId || !zohoEmail) {
    return res.status(400).json({ success: false, message: "userId and zohoEmail are required." });
  }

  const isConnected = await zohoAuthService.isConnected();
  if (!isConnected) {
    return res.status(400).json({ success: false, message: "Zoho organization is not connected." });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  try {
    const accountInfo = await zohoMailService.getAccountIdForEmail(zohoEmail);
    await ZohoAccount.findOneAndUpdate(
      { userId },
      {
        $set: {
          zohoEmail: accountInfo.zohoEmail,
          zohoAccountId: accountInfo.zohoAccountId,
          displayName: accountInfo.displayName,
          isActive: true,
          linkedAt: new Date(),
          linkedBy: req.user.id,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    user.zohoEmail = accountInfo.zohoEmail;
    user.zohoAccountId = accountInfo.zohoAccountId;
    user.zohoConnected = true;
    user.zohoConnectedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        zohoEmail: user.zohoEmail,
        zohoAccountId: user.zohoAccountId,
        zohoConnected: user.zohoConnected,
        zohoConnectedAt: user.zohoConnectedAt,
      },
    });
  } catch (error) {
    if (error.code === "ZOHO_ACCOUNT_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "No Zoho mailbox found for this email address. Ensure the account exists in your Zoho organization.",
      });
    }

    if (error.code === "ZOHO_RECONNECT_REQUIRED") {
      return res.status(503).json({
        success: false,
        message: "Zoho Mail connection needs to be reconnected by an administrator.",
        code: "ZOHO_RECONNECT_REQUIRED",
      });
    }

    if (error.code === "ZOHO_AUTH_EXPIRED") {
      return res.status(503).json({
        success: false,
        message: "Mail service authentication expired. Contact administrator.",
        code: "ZOHO_AUTH_EXPIRED",
      });
    }

    if (error.code === "ZOHO_RATE_LIMITED") {
      return res.status(429).json({
        success: false,
        message: "Too many requests to mail service. Please wait and try again.",
        code: "ZOHO_RATE_LIMITED",
      });
    }

    return res.status(502).json({
      success: false,
      message: "Mail service error while checking this Zoho mailbox.",
      code: error.code || "ZOHO_API_ERROR",
    });
  }
}

async function unlinkUserZohoAccount(req, res) {
  const { userId } = req.params;

  await ZohoAccount.deleteOne({ userId });
  await User.findByIdAndUpdate(userId, {
    $set: {
      zohoConnected: false,
      zohoAccountId: null,
      zohoEmail: null,
      zohoConnectedAt: null,
    },
  });

  return res.json({ success: true });
}

async function getLinkedAccounts(req, res) {
  const [linkedAccounts, users] = await Promise.all([
    ZohoAccount.find({})
      .populate("userId", "_id name email role zohoConnected zohoConnectedAt")
      .populate("linkedBy", "_id name email")
      .lean(),
    User.find({})
      .select("_id name email role zohoConnected zohoEmail zohoConnectedAt")
      .lean(),
  ]);

  return res.json({
    success: true,
    linkedAccounts,
    users,
  });
}

module.exports = {
  getLinkedAccounts,
  linkUserZohoAccount,
  unlinkUserZohoAccount,
};
