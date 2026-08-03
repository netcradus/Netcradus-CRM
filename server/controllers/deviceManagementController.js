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

// POST /api/device-management/bulk
exports.bulkImportDevices = async (req, res) => {
  try {
    const { devices } = req.body;
    if (!Array.isArray(devices)) {
      return res.status(400).json({ success: false, message: "Devices array is required" });
    }

    const result = {
      imported: 0,
      skipped: 0,
      invalid: 0,
      duplicate: 0,
      rowErrors: []
    };

    // Load existing records to check duplicates
    const existingDevices = await DeviceManagement.find({}, "number serial_number").lean();
    const dbNumbers = new Set(existingDevices.map(d => String(d.number).trim().toLowerCase()));
    const dbSerials = new Set(existingDevices.map(d => String(d.serial_number).trim().toLowerCase()));

    const localNumbers = new Set();
    const localSerials = new Set();

    const isCorruptedString = (str) => {
      if (typeof str !== "string") return false;
      const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(str);
      const hasZipFragments = /xl\/(sharedStrings|worksheets|drawings|charts)\.xml|docProps\/(core|app)\.xml|\[Content_Types\]\.xml/.test(str);
      return hasControlChars || hasZipFragments;
    };

    for (let i = 0; i < devices.length; i++) {
      const row = devices[i];
      const rowIndex = i + 1;

      // Skip completely empty rows
      if (!row || (!row.number && !row.product && !row.product_type && !row.serial_number)) {
        result.skipped++;
        continue;
      }

      const number = String(row.number || "").trim();
      const product = String(row.product || "").trim();
      const product_type = String(row.product_type || "").trim();
      const serial_number = String(row.serial_number || "").trim();

      // Check required fields
      if (!number || !product || !product_type || !serial_number) {
        result.invalid++;
        result.rowErrors.push({
          row: rowIndex,
          number: number || "N/A",
          error: "All fields (Number, Product, Product Type, Serial Number) are required"
        });
        continue;
      }

      // Check for binary/control character corruption
      if (
        isCorruptedString(number) ||
        isCorruptedString(product) ||
        isCorruptedString(product_type) ||
        isCorruptedString(serial_number)
      ) {
        result.invalid++;
        result.rowErrors.push({
          row: rowIndex,
          number: number.substring(0, 15),
          error: "Row contains binary / corrupted control characters"
        });
        continue;
      }

      // Check duplicate number
      const normNumber = number.toLowerCase();
      if (dbNumbers.has(normNumber) || localNumbers.has(normNumber)) {
        result.duplicate++;
        result.rowErrors.push({
          row: rowIndex,
          number,
          error: `Duplicate device number: '${number}' already exists`
        });
        continue;
      }

      // Check duplicate serial number
      const normSerial = serial_number.toLowerCase();
      if (dbSerials.has(normSerial) || localSerials.has(normSerial)) {
        result.duplicate++;
        result.rowErrors.push({
          row: rowIndex,
          number,
          error: `Duplicate serial number: '${serial_number}' already exists`
        });
        continue;
      }

      try {
        // Create and save device
        const newDevice = new DeviceManagement({
          number,
          product,
          product_type,
          serial_number,
          created_by: req.user._id
        });
        await newDevice.save();

        // Track in local sets
        localNumbers.add(normNumber);
        localSerials.add(normSerial);
        result.imported++;
      } catch (err) {
        console.error(`Bulk import row ${rowIndex} save error:`, err);
        result.invalid++;
        result.rowErrors.push({
          row: rowIndex,
          number,
          error: err.message || "Failed to save device record"
        });
      }
    }

    res.json({
      success: true,
      message: "Bulk import process completed",
      data: result
    });
  } catch (err) {
    console.error("Bulk Import Devices Error:", err);
    res.status(500).json({ success: false, message: "Server error during bulk import" });
  }
};
