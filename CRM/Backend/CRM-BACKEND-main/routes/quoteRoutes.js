const express = require("express");
const router = express.Router();
const quoteController = require("../controllers/quoteController");

// Routes
router.get("/", quoteController.getQuotes);
router.post("/", quoteController.createQuote);
router.get("/:id", quoteController.getQuoteById);
router.put("/:id", quoteController.updateQuote);
router.delete("/:id", quoteController.deleteQuote);

module.exports = router;
