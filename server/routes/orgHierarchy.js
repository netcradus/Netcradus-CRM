const express = require("express");
const rbac = require("../middleware/rbac");
const {
  getHierarchy,
  createHierarchyNode,
  updateHierarchyNode,
  bulkUpdateHierarchy,
  deleteHierarchyNode,
  getAssignableUsers,
} = require("../controllers/orgHierarchyController");

const router = express.Router();

router.get("/assignable-users", getAssignableUsers);

router.use(rbac(["super_user"]));

router.get("/", getHierarchy);
router.post("/", createHierarchyNode);
router.put("/bulk-update", bulkUpdateHierarchy);
router.put("/:id", updateHierarchyNode);
router.delete("/:id", deleteHierarchyNode);

module.exports = router;
