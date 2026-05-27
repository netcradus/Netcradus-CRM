const Vendor = require("../models/vendorModel");

// Get all vendors
exports.getVendors = async (req, res) => {
  try {
    // Partner users are isolated to their own vendors while internal teams keep the full vendor directory.
    const query = req.user?.role === "partner" ? { partnerId: req.user._id } : {};
    const vendors = await Vendor.find(query).sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get a vendor by ID
exports.getVendorById = async (req, res) => {
  try {
    // Partner users can only read vendors linked to their own account.
    const query = req.user?.role === "partner" ? { _id: req.params.id, partnerId: req.user._id } : { _id: req.params.id };
    const vendor = await Vendor.findOne(query);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Create a new vendor
exports.createVendor = async (req, res) => {
  try {
    const { name, email, category, status, lastInteraction, contactPerson, phone, country, industry, address, notes } = req.body;

    const newVendor = new Vendor({
      name,
      email,
      category,
      status,
      lastInteraction,
      // Partner-created vendors are linked to the logged-in partner account.
      partnerId: req.user?.role === "partner" ? req.user._id : req.body.partnerId || null,
      contactPerson,
      phone,
      country,
      industry,
      address,
      notes,
    });

    const savedVendor = await newVendor.save();
    res.json(savedVendor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Update a vendor
exports.updateVendor = async (req, res) => {
  try {
    // Partner users can only update vendors linked to their own account.
    const query = req.user?.role === "partner" ? { _id: req.params.id, partnerId: req.user._id } : { _id: req.params.id };
    const vendor = await Vendor.findOneAndUpdate(query, req.body, {
      new: true,
    });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete a vendor
exports.deleteVendor = async (req, res) => {
  try {
    // Partner users can only delete vendors linked to their own account.
    const query = req.user?.role === "partner" ? { _id: req.params.id, partnerId: req.user._id } : { _id: req.params.id };
    const vendor = await Vendor.findOneAndDelete(query);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json({ message: "Vendor deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};
