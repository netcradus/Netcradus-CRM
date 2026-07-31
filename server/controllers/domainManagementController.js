const DomainManagement = require("../models/DomainManagement");
const User = require("../models/User");

// URL Validator
const isValidUrl = (urlStr) => {
  if (!urlStr) return false;
  try {
    const url = new URL(urlStr);
    return ["http:", "https:"].includes(url.protocol);
  } catch (_) {
    return false;
  }
};

// Clean domain utility
const cleanDomainName = (domainStr) => {
  if (!domainStr) return "";
  let cleaned = domainStr.trim().toLowerCase();
  // Strip protocol
  cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, "");
  // Strip path/query params if present
  cleaned = cleaned.split("/")[0];
  return cleaned;
};

// GET /api/domain-management
exports.getDomains = async (req, res) => {
  try {
    const domains = await DomainManagement.find()
      .populate("ownerUser", "name userId department email isActive")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: domains });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/domain-management/:id
exports.getDomainById = async (req, res) => {
  try {
    const record = await DomainManagement.findById(req.params.id)
      .populate("ownerUser", "name userId department email isActive")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .lean();

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.status(200).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/domain-management
exports.createDomain = async (req, res) => {
  try {
    const { project, repository, domain, frontend, backend, api, hosting, ownerUser } = req.body;

    // Required fields check
    if (!project || !repository || !domain || !frontend || !backend || !api || !hosting || !ownerUser) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    // URL validations
    if (!isValidUrl(repository)) {
      return res.status(400).json({ success: false, message: "Repository must be a valid URL." });
    }
    if (!isValidUrl(frontend)) {
      return res.status(400).json({ success: false, message: "Frontend must be a valid URL." });
    }
    if (!isValidUrl(backend)) {
      return res.status(400).json({ success: false, message: "Backend must be a valid URL." });
    }
    if (!isValidUrl(api)) {
      return res.status(400).json({ success: false, message: "API must be a valid URL." });
    }

    const cleanedDomain = cleanDomainName(domain);
    if (!cleanedDomain) {
      return res.status(400).json({ success: false, message: "Domain name is invalid." });
    }

    // Check domain uniqueness
    const duplicate = await DomainManagement.findOne({ domain: cleanedDomain });
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Domain already exists." });
    }

    // Check owner validity
    const owner = await User.findById(ownerUser);
    if (!owner) {
      return res.status(400).json({ success: false, message: "Selected developer is invalid." });
    }
    if (owner.isDisabled || owner.isActive === false) {
      return res.status(400).json({ success: false, message: "Selected developer is inactive." });
    }

    const newRecord = new DomainManagement({
      project: project.trim(),
      repository: repository.trim(),
      domain: cleanedDomain,
      frontend: frontend.trim(),
      backend: backend.trim(),
      api: api.trim(),
      hosting: hosting.trim(),
      ownerUser,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await newRecord.save();

    res.status(201).json({ success: true, data: newRecord });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/domain-management/:id
exports.updateDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const { project, repository, domain, frontend, backend, api, hosting, ownerUser } = req.body;

    const record = await DomainManagement.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    // Check updates
    if (project !== undefined) {
      if (!project.trim()) return res.status(400).json({ success: false, message: "Project name cannot be empty." });
      record.project = project.trim();
    }

    if (repository !== undefined) {
      if (!isValidUrl(repository)) return res.status(400).json({ success: false, message: "Repository must be a valid URL." });
      record.repository = repository.trim();
    }

    if (domain !== undefined) {
      const cleanedDomain = cleanDomainName(domain);
      if (!cleanedDomain) return res.status(400).json({ success: false, message: "Domain name is invalid." });

      const duplicate = await DomainManagement.findOne({ domain: cleanedDomain, _id: { $ne: id } });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Domain already exists." });
      }
      record.domain = cleanedDomain;
    }

    if (frontend !== undefined) {
      if (!isValidUrl(frontend)) return res.status(400).json({ success: false, message: "Frontend must be a valid URL." });
      record.frontend = frontend.trim();
    }

    if (backend !== undefined) {
      if (!isValidUrl(backend)) return res.status(400).json({ success: false, message: "Backend must be a valid URL." });
      record.backend = backend.trim();
    }

    if (api !== undefined) {
      if (!isValidUrl(api)) return res.status(400).json({ success: false, message: "API must be a valid URL." });
      record.api = api.trim();
    }

    if (hosting !== undefined) {
      if (!hosting.trim()) return res.status(400).json({ success: false, message: "Hosting provider cannot be empty." });
      record.hosting = hosting.trim();
    }

    if (ownerUser !== undefined) {
      const owner = await User.findById(ownerUser);
      if (!owner) {
        return res.status(400).json({ success: false, message: "Selected developer is invalid." });
      }
      if (owner.isDisabled || owner.isActive === false) {
        return res.status(400).json({ success: false, message: "Selected developer is inactive." });
      }
      record.ownerUser = ownerUser;
    }

    record.updatedBy = req.user._id;
    await record.save();

    res.status(200).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/domain-management/:id
exports.deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await DomainManagement.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    await record.deleteOne();
    res.status(200).json({ success: true, message: "Record deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
