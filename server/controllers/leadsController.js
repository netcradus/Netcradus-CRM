const Lead = require("../models/Lead");
const User = require("../models/User");

// Get all leads with pagination, filtering, and sorting
const getLeads = async (req, res) => {
    try {
        // 1. Parse Pagination Params Safely
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const skip = (page - 1) * limit;

        // 2. Parse & Validate Sorting Params
        const allowedSortFields = ["createdAt", "updatedAt", "name", "company", "status"];
        const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
        const order = req.query.order === "asc" ? 1 : -1;

        // 3. Build & Validate Dynamic Query
        const query = {};
        const { status, search, startDate, endDate } = req.query;

        if (status) {
            const allowedStatuses = ["Closed", "In Progress", "Not Interested"];
            // Support multi-status filtering with validation
            const statusArray = status.split(",").filter(s => allowedStatuses.includes(s));
            if (statusArray.length > 0) {
                query.status = { $in: statusArray };
            }
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
            ];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                // Parse as UTC start of day
                query.createdAt.$gte = new Date(startDate + "T00:00:00.000Z");
            }
            if (endDate) {
                // Use start of NEXT day in UTC — covers the full selected day regardless of server timezone
                const nextDay = new Date(endDate + "T00:00:00.000Z");
                nextDay.setUTCDate(nextDay.getUTCDate() + 1);
                query.createdAt.$lt = nextDay;
            }
        }

        // 4. Parallelize Queries for Performance
        const [leads, totalLeads] = await Promise.all([
            Lead.find(query)
                .populate('createdBy', 'name email')
                .populate('assignedTo', 'name email')
                .sort({ [sortBy]: order })
                .skip(skip)
                .limit(limit)
                .lean(), // Use lean() for faster read-only queries
            Lead.countDocuments(query)
        ]);

        // 5. Format response
        const formattedLeads = leads.map(lead => {
            if (!lead.createdBy) {
                lead.createdBy = { name: 'System', email: 'system@unknown' };
            }
            return lead;
        });

        res.json({
            success: true,
            data: formattedLeads,
            pagination: {
                totalLeads,
                totalPages: Math.ceil(totalLeads / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        console.error("Fetch Leads Error:", err);
        res.status(500).json({ success: false, message: "Server error while fetching leads", error: err.message });
    }
};

// Get lead by ID
const getLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email');
        if (!lead) return res.status(404).json({ message: "Lead not found" });

        // Ensure createdBy has a name even if null
        const leadObj = lead.toObject();
        if (!leadObj.createdBy) {
            leadObj.createdBy = { name: 'System', email: 'system@unknown' };
        }

        res.json(leadObj);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// Create new lead (User and Admin can create)
const createLead = async (req, res) => {
    try {
        const { name, email, phone, company, status, notes, assignedTo } = req.body;

        // No required fields validation to allow importing incomplete tabular data

        // Create lead with createdBy set to current user
        const lead = new Lead({
            name,
            email,
            phone,
            company,
            status: status || 'In Progress',
            notes,
            assignedTo: assignedTo && assignedTo.trim() ? assignedTo : null,
            createdBy: req.user._id
        });

        const savedLead = await lead.save();

        // Populate user details before sending response
        await savedLead.populate([
            { path: 'createdBy', select: 'name email' },
            { path: 'assignedTo', select: 'name email' }
        ]);

        res.status(201).json(savedLead);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
};

// Update lead (Owner, Assigned user, and Admin can update)
const updateLead = async (req, res) => {
    try {
        const leadId = req.params.id;
        const lead = await Lead.findById(leadId);

        if (!lead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        // Check authorization: creator or admin can update
        if (lead.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: "You don't have permission to update this lead" });
        }

        // Update allowed fields
        const { name, email, phone, company, status, notes, assignedTo } = req.body;

        if (name) lead.name = name;
        if (email) lead.email = email;
        if (phone) lead.phone = phone;
        if (company) lead.company = company;
        if (status) lead.status = status;
        if (notes) lead.notes = notes;
        if (assignedTo !== undefined) lead.assignedTo = assignedTo && assignedTo.trim() ? assignedTo : null;

        const updatedLead = await lead.save();

        // Populate user details before sending response
        await updatedLead.populate([
            { path: 'createdBy', select: 'name email' },
            { path: 'assignedTo', select: 'name email' }
        ]);

        res.json(updatedLead);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
};

// Delete lead (Admin only)
const deleteLead = async (req, res) => {
    try {
        const leadId = req.params.id;

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admins can delete leads" });
        }

        const deletedLead = await Lead.findByIdAndDelete(leadId);

        if (!deletedLead) {
            return res.status(404).json({ message: "Lead not found" });
        }

        res.json({ message: "Lead deleted successfully", lead: deletedLead });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// Bulk delete leads by IDs (Admin only)
const bulkDeleteLeads = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admins can bulk delete leads" });
        }

        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No lead IDs provided" });
        }

        // Cap at 1000 per request to prevent abuse
        if (ids.length > 1000) {
            return res.status(400).json({ message: "Cannot delete more than 1000 leads at once" });
        }

        const result = await Lead.deleteMany({ _id: { $in: ids } });

        res.json({
            success: true,
            message: `${result.deletedCount} lead(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error("Bulk Delete Error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Delete all leads matching filters (Admin only) — used for "delete all filtered" / "delete all"
const deleteAllLeads = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: "Only admins can delete leads" });
        }

        // Build the same query as getLeads for consistency
        const query = {};
        const { status, search, startDate, endDate } = req.query;

        if (status) {
            const allowedStatuses = ["Closed", "In Progress", "Not Interested"];
            const statusArray = status.split(",").filter(s => allowedStatuses.includes(s));
            if (statusArray.length > 0) query.status = { $in: statusArray };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
            ];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate + "T00:00:00.000Z");
            }
            if (endDate) {
                const nextDay = new Date(endDate + "T00:00:00.000Z");
                nextDay.setUTCDate(nextDay.getUTCDate() + 1);
                query.createdAt.$lt = nextDay;
            }
        }

        // Require at least one filter OR explicit "confirmDeleteAll" flag to prevent accidental wipeout
        const hasFilters = Object.keys(query).length > 0;
        const confirmed = req.query.confirmDeleteAll === "true";

        if (!hasFilters && !confirmed) {
            return res.status(400).json({
                message: "To delete ALL leads with no filters, pass ?confirmDeleteAll=true",
                requiresConfirmation: true
            });
        }

        const result = await Lead.deleteMany(query);

        res.json({
            success: true,
            message: `${result.deletedCount} lead(s) deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error("Delete All Error:", err);
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead,
    bulkDeleteLeads,
    deleteAllLeads
};
