const FileAccessToken = require('../models/FileAccessToken');
const User = require('../models/User');

const fileTokenMiddleware = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { documentId } = req.params;

    if (!token) {
      return res.status(401).json({ message: "No file access token provided." });
    }

    const accessToken = await FileAccessToken.findOne({ token });

    if (!accessToken) {
      return res.status(401).json({ message: "Invalid or expired file access token." });
    }

    if (String(accessToken.fileId) !== String(documentId)) {
      return res.status(403).json({ message: "Token is not valid for this document." });
    }

    // Attach user to request (similar to authMiddleware)
    const user = await User.findById(accessToken.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    req.user = user;
    
    // Single use token - delete after successful validation
    await FileAccessToken.deleteOne({ _id: accessToken._id });

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error validating token." });
  }
};

module.exports = fileTokenMiddleware;
