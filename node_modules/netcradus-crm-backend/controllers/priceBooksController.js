const PriceBook = require("../models/PriceBook");

// ✅ Get all Price Books
exports.getPriceBooks = async (req, res) => {
  try {
    const priceBooks = await PriceBook.find().sort({ createdAt: -1 });
    res.json(priceBooks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ✅ Get a single Price Book by ID
exports.getPriceBookById = async (req, res) => {
  try {
    const priceBook = await PriceBook.findById(req.params.id);
    if (!priceBook)
      return res.status(404).json({ message: "Price Book not found" });
    res.json(priceBook);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ✅ Create a new Price Book
exports.createPriceBook = async (req, res) => {
  try {
    const { name, currency, type, products, effectiveDate, expiryDate, status, version } = req.body;

    const newPriceBook = new PriceBook({
      name,
      currency,
      type,
      products,
      effectiveDate,
      expiryDate,
      status,
      version,
    });

    const savedPriceBook = await newPriceBook.save();
    res.json(savedPriceBook);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ✅ Update a Price Book
exports.updatePriceBook = async (req, res) => {
  try {
    const priceBook = await PriceBook.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!priceBook)
      return res.status(404).json({ message: "Price Book not found" });
    res.json(priceBook);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// ✅ Delete a Price Book
exports.deletePriceBook = async (req, res) => {
  try {
    const priceBook = await PriceBook.findByIdAndDelete(req.params.id);
    if (!priceBook)
      return res.status(404).json({ message: "Price Book not found" });
    res.json({ message: "Price Book deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
