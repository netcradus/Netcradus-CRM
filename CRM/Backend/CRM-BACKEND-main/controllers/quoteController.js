const Quote = require("../models/Quote");

// Get all quotes
exports.getQuotes = async (req, res) => {
  try {
    const quotes = await Quote.find();
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get quote by ID
exports.getQuoteById = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).json({ error: "Quote not found" });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create new quote
exports.createQuote = async (req, res) => {
  try {
    const { client, amount, status } = req.body;
    const newQuote = new Quote({ client, amount, status });
    await newQuote.save();
    res.status(201).json(newQuote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a quote
exports.updateQuote = async (req, res) => {
  try {
    const updatedQuote = await Quote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedQuote) return res.status(404).json({ error: "Quote not found" });
    res.json(updatedQuote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a quote
exports.deleteQuote = async (req, res) => {
  try {
    const deletedQuote = await Quote.findByIdAndDelete(req.params.id);
    if (!deletedQuote) return res.status(404).json({ error: "Quote not found" });
    res.json({ message: "Quote deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
