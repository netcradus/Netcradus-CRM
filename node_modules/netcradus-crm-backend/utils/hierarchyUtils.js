const OrgHierarchy = require('../models/OrgHierarchy');
const User = require('../models/User');

const CACHE_TTL_MS = 5 * 60 * 1000;
const superiorCache = new Map();
const subordinateCache = new Map();

function getCached(cache, key) {
  const cached = cache.get(String(key));
  if (!cached || cached.expiresAt <= Date.now()) {
    cache.delete(String(key));
    return null;
  }
  return cached.value;
}

function setCached(cache, key, value) {
  cache.set(String(key), {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

async function getDescendantUserIds(nodeId) {
  const allNodes = await OrgHierarchy.find().select('_id parentId userId').lean();
  const childrenByParent = allNodes.reduce((map, node) => {
    const parentKey = node.parentId ? String(node.parentId) : null;
    if (!map.has(parentKey)) map.set(parentKey, []);
    map.get(parentKey).push(node);
    return map;
  }, new Map());

  const queue = [String(nodeId)];
  const descendantIds = [];

  while (queue.length) {
    const currentId = queue.shift();
    const children = childrenByParent.get(currentId) || [];
    for (const child of children) {
      if (child.userId) {
        descendantIds.push(String(child.userId));
      }
      queue.push(String(child._id));
    }
  }

  return descendantIds;
}

async function getSuperiorsForUser(userId) {
  const cached = getCached(superiorCache, userId);
  if (cached) return cached;

  const allNodes = await OrgHierarchy.find().select('_id parentId userId').lean();
  const nodesById = new Map(allNodes.map((node) => [String(node._id), node]));
  const currentEntry = allNodes.find((node) => String(node.userId) === String(userId));

  if (!currentEntry?.parentId) {
    setCached(superiorCache, userId, []);
    return [];
  }

  const chainUserIds = [];
  const seenNodeIds = new Set();
  let parentId = String(currentEntry.parentId);

  while (parentId && !seenNodeIds.has(parentId)) {
    seenNodeIds.add(parentId);
    const parent = nodesById.get(parentId);
    if (!parent) break;
    if (parent.userId) chainUserIds.push(String(parent.userId));
    parentId = parent.parentId ? String(parent.parentId) : null;
  }

  if (!chainUserIds.length) {
    setCached(superiorCache, userId, []);
    return [];
  }

  const activeUsers = await User.find({
    _id: { $in: chainUserIds },
    isDisabled: false,
  }).select('_id').lean();
  const activeUserIds = new Set(activeUsers.map((user) => String(user._id)));
  const activeChain = chainUserIds.filter((id) => activeUserIds.has(id));

  setCached(superiorCache, userId, activeChain);
  return activeChain;
}

async function isUserSuperiorTo(superiorUserId, subordinateUserId) {
  if (String(superiorUserId) === String(subordinateUserId)) return false;
  const superiors = await getSuperiorsForUser(subordinateUserId);
  return superiors.some((id) => String(id) === String(superiorUserId));
}

async function getSubordinatesForUser(userId) {
  const cached = getCached(subordinateCache, userId);
  if (cached) return cached;

  const currentEntry = await OrgHierarchy.findOne({ userId }).select('_id').lean();
  if (!currentEntry) {
    setCached(subordinateCache, userId, []);
    return [];
  }

  const descendantIds = await getDescendantUserIds(currentEntry._id);
  if (!descendantIds.length) {
    setCached(subordinateCache, userId, []);
    return [];
  }

  const activeUsers = await User.find({
    _id: { $in: descendantIds },
    isDisabled: false,
  }).select('_id').lean();
  const activeUserIds = new Set(activeUsers.map((user) => String(user._id)));
  const activeDescendants = descendantIds.filter((id) => activeUserIds.has(id));

  setCached(subordinateCache, userId, activeDescendants);
  return activeDescendants;
}

/**
 * Get all users that the given userId can assign tasks to,
 * based on their position in the OrgHierarchy.
 *
 * Rules:
 * - If user is not in hierarchy → return null (caller handles fallback)
 * - If user is Level 0 (Super Admin) → return 'ALL' signal
 * - Otherwise → return array of descendant userIds under the current user's node
 */
async function getAssignableUserIds(currentUserId) {
  try {
    // Find current user's hierarchy entry
    const currentEntry = await OrgHierarchy.findOne({
      userId: currentUserId
    }).select('_id priorityLevel');

    // Not in hierarchy — return null for fallback
    if (!currentEntry) return null;

    // Super Admin (level 0) — can assign to everyone
    if (currentEntry.priorityLevel === 0) return 'ALL';

    return await getDescendantUserIds(currentEntry._id);

  } catch (err) {
    console.error('getAssignableUserIds error:', err);
    return null;
  }
}

/**
 * Check if currentUserId can assign a task to targetUserId.
 *
 * Returns:
 * { allowed: true } if assignment is permitted
 * { allowed: false, reason: string } if not permitted
 */
async function canAssignTask(currentUserId, targetUserId, currentUserRole) {
  if (currentUserId.toString() === targetUserId.toString()) {
    return {
      allowed: false,
      reason: 'You can only assign tasks to users below you in the organization hierarchy.'
    };
  }

  if (currentUserRole?.toLowerCase() === 'super_user') {
    return { allowed: true };
  }

  const assignableIds = await getAssignableUserIds(currentUserId);

  // Not in hierarchy — use role-based fallback
  if (assignableIds === null) {
    const allowedRoles = ['superadmin', 'super_admin', 'admin',
                          'administrator', 'hr'];
    const roleAllowed = allowedRoles.includes(
      currentUserRole?.toLowerCase()
    );
    if (roleAllowed) return { allowed: true };
    return {
      allowed: false,
      reason: 'You are not in the organization hierarchy. ' +
               'Only Super Admin, Admin, and HR can assign tasks.'
    };
  }

  // Super Admin — allow all
  if (assignableIds === 'ALL') return { allowed: true };

  // Check if target is in assignable list
  if (assignableIds.includes(targetUserId.toString())) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'You can only assign tasks to users at a lower ' +
            'level than yourself in the organization hierarchy.'
  };
}

module.exports = {
  getAssignableUserIds,
  getDescendantUserIds,
  getSuperiorsForUser,
  isUserSuperiorTo,
  getSubordinatesForUser,
  canAssignTask,
};
