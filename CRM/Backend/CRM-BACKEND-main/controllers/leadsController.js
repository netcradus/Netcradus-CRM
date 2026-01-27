// const Lead = require("../models/Lead");

// // Get all leads
// const getLeads = async (req, res) => {
//     try {
//         const leads = await leadsService.getAllLeads();
//         res.json(leads);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // Get lead by ID
// const getLead = async (req, res) => {
//     try {
//         const lead = await leadsService.getLeadById(req.params.id);
//         if (!lead) return res.status(404).json({ message: 'Lead not found' });
//         res.json(lead);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// // Create new lead
// const createLead = async (req, res) => {
//     try {
//         const lead = await leadsService.createLead(req.body);
//         res.status(201).json(lead);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// };

// // Update lead
// const updateLead = async (req, res) => {
//     try {
//         const updatedLead = await leadsService.updateLead(req.params.id, req.body);
//         if (!updatedLead) return res.status(404).json({ message: 'Lead not found' });
//         res.json(updatedLead);
//     } catch (err) {
//         res.status(400).json({ message: err.message });
//     }
// };

// // Delete lead
// const deleteLead = async (req, res) => {
//     try {
//         const deletedLead = await leadsService.deleteLead(req.params.id);
//         if (!deletedLead) return res.status(404).json({ message: 'Lead not found' });
//         res.json({ message: 'Lead deleted successfully' });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// };

// module.exports = {
//     getLeads,
//     getLead,
//     createLead,
//     updateLead,
//     deleteLead
// };




const Lead = require("../models/Lead");

// Get all leads
const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find(); // Directly fetch from MongoDB
        res.json(leads);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// Get lead by ID
const getLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ message: "Lead not found" });
        res.json(lead);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

// Create new lead
const createLead = async (req, res) => {
    try {
        const lead = new Lead(req.body);
        const savedLead = await lead.save();
        res.status(201).json(savedLead);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
};

// Update lead
const updateLead = async (req, res) => {
    try {
        const updatedLead = await Lead.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!updatedLead) return res.status(404).json({ message: "Lead not found" });
        res.json(updatedLead);
    } catch (err) {
        console.error(err);
        res.status(400).json({ message: err.message });
    }
};

// Delete lead
const deleteLead = async (req, res) => {
    try {
        const deletedLead = await Lead.findByIdAndDelete(req.params.id);
        if (!deletedLead) return res.status(404).json({ message: "Lead not found" });
        res.json({ message: "Lead deleted successfully" });
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
