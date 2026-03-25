const express = require("express");
const router  = express.Router();
const columnController = require("../controllers/columnController");

router.get(  "/",    columnController.getColumns);
router.post( "/",    columnController.createColumn);
router.put(  "/:id", columnController.updateColumn);   // rename / recolor
router.delete("/:id", columnController.deleteColumn);

module.exports = router;