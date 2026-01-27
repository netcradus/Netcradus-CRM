const Document = require("../models/Document");

// Get all documents
exports.getDocuments = async (req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get single document
exports.getDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json(doc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Create new document
exports.createDocument = async (req, res) => {
  try {
    const { name, category, owner, status } = req.body;
    const newDoc = new Document({
      name,
      category,
      owner,
      status,
      created: new Date(),
      modified: new Date(),
    });

    const savedDoc = await newDoc.save();
    res.json(savedDoc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Update document
exports.updateDocument = async (req, res) => {
  try {
    const updatedDoc = await Document.findByIdAndUpdate(
      req.params.id,
      { ...req.body, modified: new Date() },
      { new: true }
    );

    if (!updatedDoc) return res.status(404).json({ message: "Document not found" });
    res.json(updatedDoc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const deletedDoc = await Document.findByIdAndDelete(req.params.id);
    if (!deletedDoc) return res.status(404).json({ message: "Document not found" });
    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
