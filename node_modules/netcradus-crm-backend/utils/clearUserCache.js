const User = require('../models/User');

const userCache = new Map();
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const clearUserCache = (userId) => {
  userCache.delete(String(userId));
};

const getUserFromCache = async (userId) => {
  const idStr = String(userId);
  const cached = userCache.get(idStr);
  
  if (cached && Date.now() - cached.cachedAt < USER_CACHE_TTL_MS) {
    return cached.user;
  }
  
  const user = await User.findById(userId);
  if (user) {
    userCache.set(idStr, { user, cachedAt: Date.now() });
  }
  return user;
};

module.exports = {
  clearUserCache,
  getUserFromCache,
};
