const DeviceManagement = require("../models/DeviceManagement");

// GET /api/device-management
exports.getDevices = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", sortBy = "created_at", sortOrder = "desc" } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { number: { $regex: search, $options: "i" } },
        { serial_number: { $regex: search, $options: "i" } }
      ];
    }

    const sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [devices, total] = await Promise.all([
      DeviceManagement.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      DeviceManagement.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: devices,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error("GET Devices Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/device-management
exports.createDevice = async (req, res) => {
  try {
    const { number, product, product_type, serial_number } = req.body;

    // Validation
    if (!number || !product || !product_type || !serial_number) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check for duplicate number + product_type combination
    const existing = await DeviceManagement.findOne({
      number: String(number).trim(),
      product_type: String(product_type).trim()
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A device with number '${number}' and product type '${product_type}' already exists.`
      });
    }

    const newDevice = new DeviceManagement({
      number: String(number).trim(),
      product: String(product).trim(),
      product_type: String(product_type).trim(),
      serial_number: String(serial_number).trim(),
      created_by: req.user._id
    });

    await newDevice.save();

    res.status(201).json({
      success: true,
      message: "Device added successfully",
      data: newDevice
    });
  } catch (err) {
    console.error("POST Device Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/device-management/:id
exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const { number, product, product_type, serial_number } = req.body;

    // Validation
    if (!number || !product || !product_type || !serial_number) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Check if the device exists
    const device = await DeviceManagement.findById(id);
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    // Check for duplicate number + product_type combination (excluding current device)
    const existing = await DeviceManagement.findOne({
      number: String(number).trim(),
      product_type: String(product_type).trim(),
      _id: { $ne: id }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A device with number '${number}' and product type '${product_type}' already exists.`
      });
    }

    device.number = String(number).trim();
    device.product = String(product).trim();
    device.product_type = String(product_type).trim();
    device.serial_number = String(serial_number).trim();

    await device.save();

    res.json({
      success: true,
      message: "Device updated successfully",
      data: device
    });
  } catch (err) {
    console.error("PUT Device Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/device-management/:id
exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = await DeviceManagement.findByIdAndDelete(id);
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    res.json({
      success: true,
      message: "Device deleted successfully"
    });
  } catch (err) {
    console.error("DELETE Device Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
