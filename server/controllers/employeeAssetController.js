const mongoose = require("mongoose");
const EmployeeAsset = require("../models/EmployeeAsset");
const Contact = require("../models/Contact");
const AuditLog = require("../models/AuditLog");

// Helper to write audit entries
const logAssetEvent = async (action, req, asset, note = "") => {
  try {
    await AuditLog.create({
      action,
      performedBy: req.user?._id || req.user?.id,
      userId: req.user?._id || req.user?.id,
      note: note || `${action} for asset: ${asset?.assetName}`,
      targetId: asset?._id,
      targetModel: "EmployeeAsset",
      details: { asset },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error("Audit log failed for asset event:", err);
  }
};

// Reusable validation logic
const validateAssetInput = async (userId, assetData, indexInBatch = null) => {
  const {
    category,
    assetName,
    serialNumber,
    assetTag,
    imeiNumber,
    mobileNumber,
    issueDate,
    expectedReturnDate,
    conditionAtIssue,
    customAssetType,
  } = assetData;

  const rowLabel = indexInBatch !== null ? `Asset row ${indexInBatch + 1}: ` : "";

  if (!category) {
    return `${rowLabel}Category is required.`;
  }
  if (!assetName || !assetName.trim()) {
    return `${rowLabel}Asset Name is required.`;
  }
  if (!issueDate) {
    return `${rowLabel}Issue Date is required.`;
  }
  if (!conditionAtIssue) {
    return `${rowLabel}Condition at issue is required.`;
  }

  // Date checks
  const issueDateObj = new Date(issueDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (issueDateObj > today) {
    return `${rowLabel}Issue date cannot be in the future.`;
  }
  if (expectedReturnDate && new Date(expectedReturnDate) < issueDateObj) {
    return `${rowLabel}Expected return date cannot be before the issue date.`;
  }

  const normalizedSerial = serialNumber ? String(serialNumber).trim().toUpperCase() : "";
  const normalizedTag = assetTag ? String(assetTag).trim().toUpperCase() : "";

  // Other Category Custom Field validation
  if (category === "Other") {
    if (!customAssetType || !customAssetType.trim()) {
      return `${rowLabel}Custom Asset Type is required when category is "Other".`;
    }
    const cleanCustom = String(customAssetType).trim();
    if (cleanCustom.length < 2 || cleanCustom.length > 50) {
      return `${rowLabel}Custom Asset Type must be between 2 and 50 characters.`;
    }
  }

  // Category validations
  const trackables = ["Laptop", "Desktop", "Monitor", "Mobile", "Tablet"];
  if (trackables.includes(category) && !normalizedSerial && !normalizedTag) {
    return `${rowLabel}A serial number or asset tag is required for category: ${category}.`;
  }

  const accessoriesGroup = ["Keyboard", "Mouse", "Headphones", "Charger", "Webcam", "Pendrive", "Docking Station"];
  if (accessoriesGroup.includes(category) && !normalizedTag) {
    return `${rowLabel}An asset tag is required for category: ${category}.`;
  }

  if (category === "Mobile" && imeiNumber) {
    const cleanImei = String(imeiNumber).replace(/\s/g, "");
    if (!/^\d{15}$/.test(cleanImei)) {
      return `${rowLabel}Mobile IMEI must contain exactly 15 digits.`;
    }
  }

  if (category === "SIM") {
    if (!mobileNumber && !normalizedTag) {
      return `${rowLabel}SIM/mobile number or asset tag is required for SIM category.`;
    }
    if (mobileNumber) {
      const cleanMobile = String(mobileNumber).trim();
      if (!/^\d+$/.test(cleanMobile)) {
        return `${rowLabel}SIM mobile number must contain digits only.`;
      }
    }
  }

  if (category === "ID Card" && !normalizedTag) {
    return `${rowLabel}An asset tag or Card ID is required for ID Card category.`;
  }

  return null; // Valid
};

// GET /api/employee-assets?userId=:userId
exports.getAssets = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "userId query parameter is required." });
    }

    // Role-based access validation
    const userRole = (req.user?.role || "").trim().toLowerCase();
    const isPrivileged = ["super_user", "hr"].includes(userRole);
    if (!isPrivileged && String(req.user?.id || req.user?._id) !== String(userId)) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this user's assets." });
    }

    // Resolve Contact
    const contact = await Contact.findOne({ linkedUser: userId });
    if (!contact) {
      return res.status(404).json({ success: false, message: "No Contact profile exists for the selected user." });
    }

    const assets = await EmployeeAsset.find({ userId, isDeleted: false }).lean();

    const activeAssets = assets.filter(a => a.status !== "Returned");
    const returnedAssets = assets.filter(a => a.status === "Returned");

    const summary = {
      total: assets.length,
      assigned: assets.filter(a => a.status === "Assigned").length,
      returned: assets.filter(a => a.status === "Returned").length,
      underRepair: assets.filter(a => a.status === "Under Repair").length,
      damaged: assets.filter(a => a.status === "Damaged").length,
      lost: assets.filter(a => a.status === "Lost").length,
    };

    res.json({
      success: true,
      data: {
        activeAssets,
        returnedAssets,
        summary,
      },
    });
  } catch (err) {
    console.error("Get Assets Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch assets." });
  }
};

// POST /api/employee-assets
exports.assignAsset = async (req, res) => {
  try {
    const userRole = (req.user?.role || "").trim().toLowerCase();
    const isPrivileged = ["super_user", "hr"].includes(userRole);
    if (!isPrivileged) {
      return res.status(403).json({ success: false, message: "Unauthorized. HR or Super User access required." });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Employee User ID is required." });
    }

    // Resolve Contact
    const contact = await Contact.findOne({ linkedUser: userId });
    if (!contact) {
      return res.status(400).json({ success: false, message: "No Contact profile exists for the selected user. Create a profile first." });
    }

    // Validation
    const validationError = await validateAssetInput(userId, req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const normalizedSerial = req.body.serialNumber ? String(req.body.serialNumber).trim().toUpperCase() : "";
    const normalizedTag = req.body.assetTag ? String(req.body.assetTag).trim().toUpperCase() : "";

    // Duplicate active assignment checks
    if (normalizedSerial) {
      const dupSerial = await EmployeeAsset.findOne({
        serialNumber: normalizedSerial,
        status: { $ne: "Returned" },
        isDeleted: false,
      });
      if (dupSerial) {
        return res.status(400).json({ success: false, message: `An active asset with serial number "${normalizedSerial}" is already assigned.` });
      }
    }
    if (normalizedTag) {
      const dupTag = await EmployeeAsset.findOne({
        assetTag: normalizedTag,
        status: { $ne: "Returned" },
        isDeleted: false,
      });
      if (dupTag) {
        return res.status(400).json({ success: false, message: `An active asset with tag "${normalizedTag}" is already assigned.` });
      }
    }

    // Save asset assignment
    const asset = new EmployeeAsset({
      contactId: contact._id,
      userId,
      category: req.body.category,
      customAssetType: req.body.category === "Other" && req.body.customAssetType ? String(req.body.customAssetType).trim() : "",
      assetName: req.body.assetName,
      serialNumber: normalizedSerial,
      assetTag: normalizedTag,
      brand: req.body.brand || "",
      model: req.body.model || "",
      imeiNumber: req.body.imeiNumber || "",
      mobileNumber: req.body.mobileNumber || "",
      accessoriesDescription: req.body.accessoriesDescription || "",
      issueDate: req.body.issueDate,
      expectedReturnDate: req.body.expectedReturnDate || null,
      conditionAtIssue: req.body.conditionAtIssue,
      notes: req.body.notes || "",
      assignedBy: req.user?._id || req.user?.id,
      status: "Assigned",
    });

    await asset.save();
    await logAssetEvent("ASSET_ASSIGNED", req, asset, `Assigned asset: ${req.body.assetName} (Serial: ${normalizedSerial || "N/A"})`);

    res.status(201).json({ success: true, message: "Asset assigned successfully.", data: asset });
  } catch (err) {
    console.error("Assign Asset Error:", err);
    res.status(500).json({ success: false, message: "Failed to assign asset." });
  }
};

// POST /api/employee-assets/bulk
exports.assignAssetsBulk = async (req, res) => {
  try {
    const userRole = (req.user?.role || "").trim().toLowerCase();
    const isPrivileged = ["super_user", "hr"].includes(userRole);
    if (!isPrivileged) {
      return res.status(403).json({ success: false, message: "Unauthorized. HR or Super User access required." });
    }

    const { userId, commonDetails, assets } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "userId is required." });
    }

    if (!assets || !Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ success: false, message: "At least one asset is required for assignment." });
    }

    // Resolve Contact
    const contact = await Contact.findOne({ linkedUser: userId });
    if (!contact) {
      return res.status(400).json({ success: false, message: "No Contact profile exists for the selected user. Create a profile first." });
    }

    const assignmentBatchId = new mongoose.Types.ObjectId().toString();
    const resolvedAssets = [];
    const localSerials = new Set();
    const localTags = new Set();

    // 1. Validation loop
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      
      // Merge with commonDetails
      const mergedAsset = {
        ...asset,
        issueDate: asset.issueDate || commonDetails?.issueDate,
        expectedReturnDate: asset.expectedReturnDate || commonDetails?.expectedReturnDate,
        conditionAtIssue: asset.conditionAtIssue || commonDetails?.conditionAtIssue || "Good",
        notes: asset.notes || commonDetails?.notes || ""
      };

      const validationError = await validateAssetInput(userId, mergedAsset, i);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }

      const normalizedSerial = mergedAsset.serialNumber ? String(mergedAsset.serialNumber).trim().toUpperCase() : "";
      const normalizedTag = mergedAsset.assetTag ? String(mergedAsset.assetTag).trim().toUpperCase() : "";

      // Check duplicates within the form
      if (normalizedSerial) {
        if (localSerials.has(normalizedSerial)) {
          return res.status(400).json({ success: false, message: `Asset row ${i + 1}: Duplicate serial number "${normalizedSerial}" found in the same request.` });
        }
        localSerials.add(normalizedSerial);
      }
      if (normalizedTag) {
        if (localTags.has(normalizedTag)) {
          return res.status(400).json({ success: false, message: `Asset row ${i + 1}: Duplicate asset tag "${normalizedTag}" found in the same request.` });
        }
        localTags.add(normalizedTag);
      }

      // Check duplicate against existing active assets
      if (normalizedSerial) {
        const dupSerial = await EmployeeAsset.findOne({
          serialNumber: normalizedSerial,
          status: { $ne: "Returned" },
          isDeleted: false
        });
        if (dupSerial) {
          return res.status(400).json({ success: false, message: `Asset row ${i + 1}: Serial number "${normalizedSerial}" is already actively assigned.` });
        }
      }
      if (normalizedTag) {
        const dupTag = await EmployeeAsset.findOne({
          assetTag: normalizedTag,
          status: { $ne: "Returned" },
          isDeleted: false
        });
        if (dupTag) {
          return res.status(400).json({ success: false, message: `Asset row ${i + 1}: Asset tag "${normalizedTag}" is already actively assigned.` });
        }
      }

      resolvedAssets.push({
        contactId: contact._id,
        userId,
        category: mergedAsset.category,
        customAssetType: mergedAsset.category === "Other" && mergedAsset.customAssetType ? String(mergedAsset.customAssetType).trim() : "",
        assetName: mergedAsset.assetName,
        serialNumber: normalizedSerial,
        assetTag: normalizedTag,
        brand: mergedAsset.brand || "",
        model: mergedAsset.model || "",
        imeiNumber: mergedAsset.imeiNumber || "",
        mobileNumber: mergedAsset.mobileNumber || "",
        accessoriesDescription: mergedAsset.accessoriesDescription || "",
        issueDate: mergedAsset.issueDate,
        expectedReturnDate: mergedAsset.expectedReturnDate || null,
        conditionAtIssue: mergedAsset.conditionAtIssue,
        notes: mergedAsset.notes,
        assignedBy: req.user?._id || req.user?.id,
        status: "Assigned",
        assignmentBatchId,
      });
    }

    // 2. Insert and audit loop
    const createdAssets = await EmployeeAsset.insertMany(resolvedAssets);

    // Audit logs for each asset
    for (const asset of createdAssets) {
      await logAssetEvent("ASSET_ASSIGNED", req, asset, `Assigned asset: ${asset.assetName} (Serial: ${asset.serialNumber || "N/A"}) in batch`);
    }

    res.status(201).json({
      success: true,
      message: `${createdAssets.length} assets assigned successfully.`,
      data: createdAssets
    });
  } catch (err) {
    console.error("Bulk Assign Asset Error:", err);
    res.status(500).json({ success: false, message: "Failed to perform bulk asset assignment." });
  }
};

// PUT /api/employee-assets/:id
exports.updateAsset = async (req, res) => {
  try {
    const userRole = (req.user?.role || "").trim().toLowerCase();
    const isPrivileged = ["super_user", "hr"].includes(userRole);
    if (!isPrivileged) {
      return res.status(403).json({ success: false, message: "Unauthorized. HR or Super User access required." });
    }

    const asset = await EmployeeAsset.findOne({ _id: req.params.id, isDeleted: false });
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }

    // Validate if the asset is already returned
    if (asset.status === "Returned") {
      const allowedKeys = ["returnNotes", "returnCondition", "actualReturnDate", "notes"];
      const keysToChange = Object.keys(req.body).filter(
        key => req.body[key] !== undefined && String(asset[key]) !== String(req.body[key])
      );
      const hasDisallowed = keysToChange.some(k => !allowedKeys.includes(k));
      if (hasDisallowed) {
        return res.status(400).json({
          success: false,
          message: "Cannot edit specifications of a returned asset. You may only modify return metadata.",
        });
      }
    }

    // Validation
    const validationError = await validateAssetInput(asset.userId, { ...asset.toObject(), ...req.body });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const {
      category,
      assetName,
      serialNumber,
      assetTag,
      brand,
      model,
      imeiNumber,
      mobileNumber,
      accessoriesDescription,
      issueDate,
      expectedReturnDate,
      conditionAtIssue,
      status,
      notes,
    } = req.body;

    const normalizedSerial = serialNumber !== undefined ? String(serialNumber).trim().toUpperCase() : asset.serialNumber;
    const normalizedTag = assetTag !== undefined ? String(assetTag).trim().toUpperCase() : asset.assetTag;

    // Duplicate active checks on change
    if (normalizedSerial && normalizedSerial !== asset.serialNumber) {
      const dupSerial = await EmployeeAsset.findOne({
        _id: { $ne: asset._id },
        serialNumber: normalizedSerial,
        status: { $ne: "Returned" },
        isDeleted: false,
      });
      if (dupSerial) {
        return res.status(400).json({ success: false, message: `An active asset with serial number "${normalizedSerial}" is already assigned.` });
      }
    }
    if (normalizedTag && normalizedTag !== asset.assetTag) {
      const dupTag = await EmployeeAsset.findOne({
        _id: { $ne: asset._id },
        assetTag: normalizedTag,
        status: { $ne: "Returned" },
        isDeleted: false,
      });
      if (dupTag) {
        return res.status(400).json({ success: false, message: `An active asset with tag "${normalizedTag}" is already assigned.` });
      }
    }

    // Update keys
    if (category !== undefined) {
      asset.category = category;
      if (category !== "Other") {
        asset.customAssetType = "";
      }
    }
    if (req.body.customAssetType !== undefined && (category === "Other" || asset.category === "Other")) {
      asset.customAssetType = String(req.body.customAssetType).trim();
    }
    if (assetName !== undefined) asset.assetName = assetName;
    if (serialNumber !== undefined) asset.serialNumber = normalizedSerial;
    if (assetTag !== undefined) asset.assetTag = normalizedTag;
    if (brand !== undefined) asset.brand = brand;
    if (model !== undefined) asset.model = model;
    if (imeiNumber !== undefined) asset.imeiNumber = imeiNumber;
    if (mobileNumber !== undefined) asset.mobileNumber = mobileNumber;
    if (accessoriesDescription !== undefined) asset.accessoriesDescription = accessoriesDescription;
    if (issueDate !== undefined) asset.issueDate = issueDate;
    if (expectedReturnDate !== undefined) asset.expectedReturnDate = expectedReturnDate || null;
    if (conditionAtIssue !== undefined) asset.conditionAtIssue = conditionAtIssue;
    if (status !== undefined) asset.status = status;
    if (notes !== undefined) asset.notes = notes;

    const statusChanged = req.body.status && req.body.status !== asset.status;

    await asset.save();
    
    let auditAction = "ASSET_UPDATED";
    if (statusChanged && ["Lost", "Damaged", "Under Repair"].includes(status)) {
      auditAction = `ASSET_STATUS_${status.toUpperCase().replace(" ", "_")}`;
    }
    
    await logAssetEvent(auditAction, req, asset, `Updated asset: ${asset.assetName} (Status: ${asset.status})`);

    res.json({ success: true, message: "Asset updated successfully.", data: asset });
  } catch (err) {
    console.error("Update Asset Error:", err);
    res.status(500).json({ success: false, message: "Failed to update asset." });
  }
};

// PATCH /api/employee-assets/:id/return
exports.returnAsset = async (req, res) => {
  try {
    const userRole = (req.user?.role || "").trim().toLowerCase();
    const isPrivileged = ["super_user", "hr"].includes(userRole);
    if (!isPrivileged) {
      return res.status(403).json({ success: false, message: "Unauthorized. HR or Super User access required." });
    }

    const asset = await EmployeeAsset.findOne({ _id: req.params.id, isDeleted: false });
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }

    if (asset.status === "Returned") {
      return res.status(400).json({ success: false, message: "This asset has already been returned." });
    }

    const { actualReturnDate, returnCondition, returnNotes } = req.body;

    if (!actualReturnDate || !returnCondition) {
      return res.status(400).json({ success: false, message: "Actual return date and Return condition are required." });
    }

    if (new Date(actualReturnDate) < new Date(asset.issueDate)) {
      return res.status(400).json({ success: false, message: "Return date cannot be before the issue date." });
    }

    if (["Damaged", "Lost"].includes(returnCondition) && (!returnNotes || !returnNotes.trim())) {
      return res.status(400).json({ success: false, message: "Return notes are required when condition is Damaged or Lost." });
    }

    asset.status = "Returned";
    asset.actualReturnDate = actualReturnDate;
    asset.returnCondition = returnCondition;
    asset.returnNotes = returnNotes || "";
    asset.returnedTo = req.user?._id || req.user?.id;

    await asset.save();
    await logAssetEvent("ASSET_RETURNED", req, asset, `Returned asset: ${asset.assetName} (Condition: ${returnCondition})`);

    res.json({ success: true, message: "Asset returned successfully.", data: asset });
  } catch (err) {
    console.error("Return Asset Error:", err);
    res.status(500).json({ success: false, message: "Failed to return asset." });
  }
};

// DELETE /api/employee-assets/:id
exports.archiveAsset = async (req, res) => {
  try {
    const userRole = (req.user?.role || "").trim().toLowerCase();
    const isPrivileged = ["super_user", "hr"].includes(userRole);
    if (!isPrivileged) {
      return res.status(403).json({ success: false, message: "Unauthorized. HR or Super User access required." });
    }

    const asset = await EmployeeAsset.findOne({ _id: req.params.id, isDeleted: false });
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }

    if (asset.status !== "Returned") {
      return res.status(400).json({ success: false, message: "Cannot archive an actively assigned asset. Please return it first." });
    }

    asset.isDeleted = true;
    asset.deletedAt = new Date();
    asset.deletedBy = req.user?._id || req.user?.id;

    await asset.save();
    await logAssetEvent("ASSET_ARCHIVED", req, asset, `Archived asset: ${asset.assetName}`);

    res.json({ success: true, message: "Asset archived successfully." });
  } catch (err) {
    console.error("Archive Asset Error:", err);
    res.status(500).json({ success: false, message: "Failed to archive asset." });
  }
};
