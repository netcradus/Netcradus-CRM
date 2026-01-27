const express = require("express");
const router = express.Router();
const priceBooksController = require("../controllers/priceBooksController");

// Routes
router.get("/", priceBooksController.getPriceBooks);          // Get all price books
router.get("/:id", priceBooksController.getPriceBookById);    // Get single price book by ID
router.post("/", priceBooksController.createPriceBook);       // Create a new price book
router.put("/:id", priceBooksController.updatePriceBook);     // Update a price book
router.delete("/:id", priceBooksController.deletePriceBook);  // Delete a price book

module.exports = router;
