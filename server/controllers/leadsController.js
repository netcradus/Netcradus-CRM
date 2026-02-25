const Lead = require("../models/Lead");
const User = require("../models/User");

// Get all leads
const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find()
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });

        // Format response to ensure createdBy has a name even if null
        const formattedLeads = leads.map(lead => {
            const leadObj = lead.toObject();
            if (!leadObj.createdBy) {
                leadObj.createdBy = { name: 'System', email: 'system@unknown' };
            }
            return leadObj;
        });

        res.json(formattedLeads);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
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

// Delete lead (Admin only - as per requirement)
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

module.exports = {
    getLeads,
    getLead,
    createLead,
    updateLead,
    deleteLead
};
