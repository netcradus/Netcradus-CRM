const ZohoAccount = require("../models/ZohoAccount");

const zohoAccountMiddleware = async (req, res, next) => {
  try {
    const account = await ZohoAccount.findOne({
      userId: req.user.id,
      isActive: true,
    }).lean();

    if (!account) {
      return res.status(403).json({
        success: false,
        message: "Zoho Mail is not connected for your account.",
        code: "ZOHO_NOT_CONNECTED",
      });
    }

    req.zohoAccount = account;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = zohoAccountMiddleware;
