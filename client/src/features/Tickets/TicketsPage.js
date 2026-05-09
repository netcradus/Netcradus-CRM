import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Ticket, MessageSquare, Info, Plus, ChevronRight, Search, Clock, AlertCircle } from "lucide-react";
import { apiUrl } from "../../config/api";

const TicketsPage = () => {
    const [tickets, setTickets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: "", description: "", category: "Technical", priority: "medium", attachments: [] });
    const [commentDrafts, setCommentDrafts] = useState({});
    const [infoDrafts, setInfoDrafts] = useState({});
    
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const canManageTickets = userRole === "super_user";

    const fetchTickets = useCallback(async () => {
        try {
            const res = await axios.get(apiUrl("/api/tickets"), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data.data || []);
        } catch (err) { console.error(err); }
    }, [token]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", newTicket.title);
        formData.append("description", newTicket.description);
        formData.append("category", newTicket.category);
        formData.append("priority", newTicket.priority);
        for (let i = 0; i < newTicket.attachments.length; i++) {
            formData.append("attachments", newTicket.attachments[i]);
        }
        try {
            await axios.post(apiUrl("/api/tickets"), formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
            });
            fetchTickets();
            setShowModal(false);
            setNewTicket({ title: "", description: "", category: "Technical", priority: "medium", attachments: [] });
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.patch(apiUrl(`/api/tickets/${id}/status`), { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTickets();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
            <div className="page-header">
                <div className="page-header-left">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                        <span>Helpdesk</span><ChevronRight size={10} /><span>Support Tickets</span>
                    </div>
                    <h1 className="title">Support Tickets</h1>
                    <p className="subtitle">Track and resolve technical or operational issues.</p>
                </div>
                <div className="page-header-right">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Raise Ticket</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                <div className="nc-stat-card"><span className="metric-label">Open</span><span className="metric-value">{tickets.filter(t => t.status === 'open').length}</span></div>
                <div className="nc-stat-card"><span className="metric-label">In Progress</span><span className="metric-value" style={{ color: 'var(--color-accent)' }}>{tickets.filter(t => t.status === 'in-progress').length}</span></div>
                <div className="nc-stat-card"><span className="metric-label">Resolved</span><span className="metric-value" style={{ color: 'var(--color-success)' }}>{tickets.filter(t => t.status === 'resolved').length}</span></div>
            </div>

            <div className="nc-card">
                <table className="nc-table">
                    <thead>
                        <tr><th>Ticket ID</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {tickets.map(t => (
                            <tr key={t._id}>
                                <td><span style={{ fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{t.ticketId}</span></td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 'var(--font-semibold)' }}>{t.title}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Raised by {t.raisedBy?.name}</span>
                                    </div>
                                </td>
                                <td><span className="badge badge-neutral">{t.category}</span></td>
                                <td><span className={`badge badge-${t.priority === 'urgent' ? 'error' : t.priority === 'high' ? 'warning' : 'info'}`}>{t.priority}</span></td>
                                <td>
                                    {canManageTickets ? (
                                        <select className="form-select" style={{ height: '28px', fontSize: '10px' }} value={t.status} onChange={(e) => updateStatus(t._id, e.target.value)}>
                                            <option value="open">Open</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    ) : (
                                        <span className={`badge badge-${t.status === 'resolved' ? 'success' : 'warning'}`}>{t.status}</span>
                                    )}
                                </td>
                                <td>
                                    <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }}><MessageSquare size={14} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
                        <div className="nc-modal-header"><h3>Raise New Ticket</h3></div>
                        <form className="form" onSubmit={handleCreateTicket}>
                            <div className="form-field">
                                <label className="form-label">Subject</label>
                                <input className="form-input" required value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} />
                            </div>
                            <div className="form-field">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows={4} required value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-field">
                                    <label className="form-label">Category</label>
                                    <select className="form-select" value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})}>
                                        <option>Technical</option><option>HR</option><option>Facility</option><option>Access</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Priority</label>
                                    <select className="form-select" value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})}>
                                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Ticket</button>
                                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketsPage;
