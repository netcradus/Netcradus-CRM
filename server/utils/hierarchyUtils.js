const OrgHierarchy = require('../models/OrgHierarchy');

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

module.exports = { getAssignableUserIds, getDescendantUserIds, canAssignTask };
