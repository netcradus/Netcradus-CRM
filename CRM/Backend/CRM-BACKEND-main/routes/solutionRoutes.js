const express = require("express");
const router = express.Router();
const solutionsController = require("../controllers/solutionsController");

// Routes
router.get("/", solutionsController.getSolutions);       // Get all solutions
router.get("/:id", solutionsController.getSolution);     // Get solution by ID
router.post("/", solutionsController.createSolution);    // Create solution
router.put("/:id", solutionsController.updateSolution);  // Update solution
router.delete("/:id", solutionsController.deleteSolution);// Delete solution

module.exports = router;
