import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Ticket, MessageSquare, Info, Plus, ChevronRight, Search, Clock, AlertCircle } from "lucide-react";
import { apiUrl } from "../../config/api";

const TicketsPage = () => {
    const [tickets, setTickets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTicket, setNewTicket] = useState({
        companyName: "",
        contactPerson: "",
        email: "",
        phone: "",
        product: "CRM System",
        priority: "medium",
        category: "Technical",
        title: "",
        description: "",
        attachments: []
    });
    const [dragOver, setDragOver] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [activeDropdownTicketId, setActiveDropdownTicketId] = useState(null);
    const [viewingTicket, setViewingTicket] = useState(null);
    const [replyingTicket, setReplyingTicket] = useState(null);
    const [newComment, setNewComment] = useState("");
    const [attachmentsTicket, setAttachmentsTicket] = useState(null);
    const [statusModalTicket, setStatusModalTicket] = useState(null);

    useEffect(() => {
        const handleGlobalSearch = (e) => {
            setSearchQuery(e.detail?.query || "");
        };
        window.addEventListener("global-search", handleGlobalSearch);
        return () => {
            window.removeEventListener("global-search", handleGlobalSearch);
        };
    }, []);

    useEffect(() => {
        const closeDropdown = () => setActiveDropdownTicketId(null);
        document.addEventListener("click", closeDropdown);
        return () => document.removeEventListener("click", closeDropdown);
    }, []);

    const filteredTickets = tickets.filter(t => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
            (t.ticketId && t.ticketId.toLowerCase().includes(q)) ||
            (t.title && t.title.toLowerCase().includes(q)) ||
            (t.companyName && t.companyName.toLowerCase().includes(q)) ||
            (t.contactPerson && t.contactPerson.toLowerCase().includes(q))
        );
    });

    const getStatusBadgeStyle = (status) => {
        const s = String(status).toLowerCase();
        switch (s) {
            case 'open':
                return { backgroundColor: 'var(--color-warning-light, #FFF0E6)', color: 'var(--color-warning, #FF6B00)', borderColor: 'var(--color-warning-border, #FFD3B3)', border: '1px solid', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' };
            case 'in-progress':
                return { backgroundColor: '#E6F0FF', color: '#0066FF', borderColor: '#B3D1FF', border: '1px solid', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' };
            case 'waiting for customer':
                return { backgroundColor: '#F5E6FF', color: '#9900FF', borderColor: '#E1B3FF', border: '1px solid', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' };
            case 'on hold':
                return { backgroundColor: '#FFFFE6', color: '#D4A017', borderColor: '#FFEBB3', border: '1px solid', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' };
            case 'resolved':
                return { backgroundColor: 'var(--color-success-light, #E6FFE6)', color: 'var(--color-success, #00CC00)', borderColor: 'var(--color-success-border, #B3FFB3)', border: '1px solid', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' };
            case 'closed':
                return { backgroundColor: '#F0F0F0', color: '#666666', borderColor: '#D9D9D9', border: '1px solid', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' };
            default:
                return { backgroundColor: 'var(--color-bg-muted)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' };
        }
    };

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
        formData.append("companyName", newTicket.companyName);
        formData.append("contactPerson", newTicket.contactPerson);
        formData.append("email", newTicket.email);
        formData.append("phone", newTicket.phone);
        formData.append("product", newTicket.product);
        for (let i = 0; i < newTicket.attachments.length; i++) {
            formData.append("attachments", newTicket.attachments[i]);
        }
        try {
            await axios.post(apiUrl("/api/tickets"), formData, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
            });
            fetchTickets();
            setShowModal(false);
            setNewTicket({
                companyName: "",
                contactPerson: "",
                email: "",
                phone: "",
                product: "CRM System",
                priority: "medium",
                category: "Technical",
                title: "",
                description: "",
                attachments: []
            });
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

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !replyingTicket) return;
        try {
            await axios.post(apiUrl(`/api/tickets/${replyingTicket._id}/comment`), {
                message: newComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewComment("");
            setReplyingTicket(null);
            fetchTickets();
        } catch (err) {
            console.error(err);
        }
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

            <div className="nc-card" style={{ overflowX: 'auto' }}>
                <table className="nc-table">
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Company</th>
                            <th>Contact</th>
                            <th>Email / Phone</th>
                            <th>Product</th>
                            <th>Subject</th>
                            <th>Category</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.map(t => (
                            <tr key={t._id}>
                                <td><span style={{ fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{t.ticketId}</span></td>
                                <td><span style={{ fontSize: '11px' }}>{t.companyName || '-'}</span></td>
                                <td><span style={{ fontSize: '11px' }}>{t.contactPerson || '-'}</span></td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px' }}>
                                        <span>{t.email || '-'}</span>
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>{t.phone || '-'}</span>
                                    </div>
                                </td>
                                <td><span className="badge badge-neutral" style={{ fontSize: '10px' }}>{t.product || '-'}</span></td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 'var(--font-semibold)' }}>{t.title}</span>
                                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Raised by {t.raisedBy?.name}</span>
                                    </div>
                                </td>
                                <td><span className="badge badge-neutral">{t.category}</span></td>
                                <td><span className={`badge badge-${t.priority === 'urgent' ? 'error' : t.priority === 'high' ? 'warning' : 'info'}`}>{t.priority}</span></td>
                                <td>
                                    <span style={getStatusBadgeStyle(t.status)}>
                                        {t.status === 'in-progress' ? 'In Progress' : t.status === 'waiting for customer' ? 'Waiting for Customer' : t.status === 'on hold' ? 'On Hold' : t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', position: 'relative' }}>
                                        {/* 1. View Ticket */}
                                        <button
                                            className="btn btn-ghost"
                                            style={{ padding: 'var(--space-1) var(--space-2)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', height: '28px' }}
                                            onClick={() => setViewingTicket(t)}
                                            title="View Ticket Details"
                                        >
                                            <span style={{ fontSize: '12px' }}>👁</span> View
                                        </button>

                                        {/* 2. More Action Dropdown Toggle */}
                                        <button
                                            className="btn btn-ghost"
                                            style={{ padding: 'var(--space-1)', minWidth: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveDropdownTicketId(activeDropdownTicketId === t._id ? null : t._id);
                                            }}
                                        >
                                            ⋮
                                        </button>

                                        {/* Dropdown Menu */}
                                        {activeDropdownTicketId === t._id && (
                                            <div
                                                onClick={e => e.stopPropagation()}
                                                style={{
                                                    position: 'absolute',
                                                    right: 0,
                                                    top: '32px',
                                                    backgroundColor: 'var(--color-bg-elevated, #1c1c27)',
                                                    border: '1px solid var(--color-border, rgba(255, 255, 255, 0.08))',
                                                    borderRadius: 'var(--border-radius, 6px)',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                                    zIndex: 100,
                                                    minWidth: '180px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    padding: '4px 0'
                                                }}
                                            >
                                                {/* Reply */}
                                                <button
                                                    onClick={() => { setReplyingTicket(t); setActiveDropdownTicketId(null); }}
                                                    style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', color: 'var(--color-text-primary, #f7f4ee)' }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-hover, rgba(255, 255, 255, 0.045))'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                >
                                                    💬 Reply to Customer
                                                </button>

                                                {/* Update Status */}
                                                <button
                                                    onClick={() => { setStatusModalTicket(t); setActiveDropdownTicketId(null); }}
                                                    style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', color: 'var(--color-text-primary, #f7f4ee)' }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-hover, rgba(255, 255, 255, 0.045))'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                >
                                                    🔄 Update Status
                                                </button>

                                                {/* View Attachments */}
                                                <button
                                                    onClick={() => { setAttachmentsTicket(t); setActiveDropdownTicketId(null); }}
                                                    style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', color: 'var(--color-text-primary, #f7f4ee)' }}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-bg-hover, rgba(255, 255, 255, 0.045))'}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                                >
                                                    📎 View Attachments
                                                </button>

                                                {/* Assign Engineer */}
                                                <button
                                                    disabled
                                                    style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'not-allowed', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', color: 'var(--color-text-muted, #857d72)', opacity: 0.6 }}
                                                >
                                                    👤 Assign Engineer <span style={{ fontSize: '9px', background: 'var(--color-bg-hover, rgba(255,255,255,0.045))', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto', color: 'var(--color-text-muted)' }}>Coming Soon</span>
                                                </button>

                                                {/* Edit Ticket */}
                                                <button
                                                    disabled
                                                    style={{ padding: '8px 12px', background: 'none', border: 'none', textAlign: 'left', cursor: 'not-allowed', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', color: 'var(--color-text-muted, #857d72)', opacity: 0.6 }}
                                                >
                                                    ✏ Edit Ticket <span style={{ fontSize: '9px', background: 'var(--color-bg-hover, rgba(255,255,255,0.045))', padding: '2px 4px', borderRadius: '4px', marginLeft: 'auto', color: 'var(--color-text-muted)' }}>Disabled</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* View Ticket Details Modal */}
            {viewingTicket && (
                <div className="nc-modal-overlay" onClick={() => setViewingTicket(null)}>
                    <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '95%' }}>
                        <div className="nc-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Ticket Detail: {viewingTicket.ticketId}</h3>
                            <span style={getStatusBadgeStyle(viewingTicket.status)}>
                                {viewingTicket.status.toUpperCase()}
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Company</label>
                                    <div style={{ fontSize: '13px', fontWeight: 'var(--font-semibold)', marginTop: '2px' }}>{viewingTicket.companyName || '-'}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Contact Person</label>
                                    <div style={{ fontSize: '13px', fontWeight: 'var(--font-semibold)', marginTop: '2px' }}>{viewingTicket.contactPerson || '-'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Email</label>
                                    <div style={{ fontSize: '13px', marginTop: '2px' }}>{viewingTicket.email || '-'}</div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Phone</label>
                                    <div style={{ fontSize: '13px', marginTop: '2px' }}>{viewingTicket.phone || '-'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Product</label>
                                    <div style={{ fontSize: '13px', marginTop: '2px' }}><span className="badge badge-neutral">{viewingTicket.product || '-'}</span></div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Category / Priority</label>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                                        <span className="badge badge-neutral">{viewingTicket.category}</span>
                                        <span className={`badge badge-${viewingTicket.priority === 'urgent' ? 'error' : viewingTicket.priority === 'high' ? 'warning' : 'info'}`}>{viewingTicket.priority}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Subject</label>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{viewingTicket.title}</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Description</label>
                                <div style={{ fontSize: '13px', padding: '12px', background: 'var(--color-bg-muted)', borderRadius: '4px', whiteSpace: 'pre-wrap', marginTop: '4px', border: '1px solid var(--color-border)' }}>
                                    {viewingTicket.description}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'end', marginTop: 'var(--space-6)' }}>
                            <button className="btn btn-ghost" onClick={() => setViewingTicket(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reply / Comment Modal */}
            {replyingTicket && (
                <div className="nc-modal-overlay" onClick={() => setReplyingTicket(null)}>
                    <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '550px', maxWidth: '95%' }}>
                        <div className="nc-modal-header">
                            <h3>Reply to Customer (Ticket {replyingTicket.ticketId})</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                            {/* Comments History */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                                <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Comments History</label>
                                {(!replyingTicket.comments || replyingTicket.comments.length === 0) ? (
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No comments posted yet.</div>
                                ) : (
                                    replyingTicket.comments.map((comment, index) => (
                                        <div key={index} style={{ padding: '8px 12px', background: comment.senderRole === 'super_user' ? 'var(--color-bg-alt, #f7fafc)' : 'var(--color-bg-muted)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                                <strong>{comment.senderRole === 'super_user' ? 'You (Super User)' : 'Customer'}</strong>
                                                <span>{new Date(comment.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div style={{ fontSize: '12px' }}>{comment.message}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* Post New Comment Form */}
                            <form onSubmit={handleAddComment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                                <div className="form-field">
                                    <label className="form-label">Message</label>
                                    <textarea
                                        className="form-input"
                                        rows={4}
                                        required
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Type your response to the customer here..."
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send Reply</button>
                                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setReplyingTicket(null)}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {statusModalTicket && (
                <div className="nc-modal-overlay" onClick={() => setStatusModalTicket(null)}>
                    <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px', maxWidth: '95%' }}>
                        <div className="nc-modal-header">
                            <h3>Update Status (Ticket {statusModalTicket.ticketId})</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                            <div className="form-field">
                                <label className="form-label">Select Ticket Status</label>
                                <select
                                    className="form-select"
                                    value={statusModalTicket.status}
                                    onChange={async (e) => {
                                        const newStatus = e.target.value;
                                        await updateStatus(statusModalTicket._id, newStatus);
                                        setStatusModalTicket(null);
                                    }}
                                >
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="waiting for customer" disabled>Waiting for Customer (Unsupported by Server)</option>
                                    <option value="on hold" disabled>On Hold (Unsupported by Server)</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                    Note: "Waiting for Customer" and "On Hold" are disabled because they are not yet supported by the server.
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'end' }}>
                                <button className="btn btn-ghost" onClick={() => setStatusModalTicket(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Attachments Modal */}
            {attachmentsTicket && (
                <div className="nc-modal-overlay" onClick={() => setAttachmentsTicket(null)}>
                    <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px', maxWidth: '95%' }}>
                        <div className="nc-modal-header">
                            <h3>Attachments (Ticket {attachmentsTicket.ticketId})</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                            {(!attachmentsTicket.attachments || attachmentsTicket.attachments.length === 0) ? (
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: 'var(--space-4)' }}>
                                    No attachments uploaded for this ticket.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                    {attachmentsTicket.attachments.map((file, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 14px',
                                                backgroundColor: 'var(--color-bg-muted)',
                                                borderRadius: 'var(--border-radius)',
                                                fontSize: '12px',
                                                border: '1px solid var(--color-border)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '70%' }}>
                                                <span style={{ fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    {file.filename}
                                                </span>
                                                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </span>
                                            </div>
                                            <a
                                                href={apiUrl("/" + file.path)}
                                                download={file.filename}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-primary"
                                                style={{ fontSize: '11px', padding: '4px 10px', textDecoration: 'none' }}
                                            >
                                                Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'end', marginTop: 'var(--space-2)' }}>
                                <button className="btn btn-ghost" onClick={() => setAttachmentsTicket(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {showModal && (
                <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '650px', maxWidth: '95%' }}>
                        <div className="nc-modal-header"><h3>Raise New Ticket</h3></div>
                        <form className="form" onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
                            
                            {/* Row 1: Company Name / Contact Person */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-field">
                                    <label className="form-label">Company Name</label>
                                    <input className="form-input" required value={newTicket.companyName} onChange={e => setNewTicket({...newTicket, companyName: e.target.value})} />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Contact Person</label>
                                    <input className="form-input" required value={newTicket.contactPerson} onChange={e => setNewTicket({...newTicket, contactPerson: e.target.value})} />
                                </div>
                            </div>

                            {/* Row 2: Email / Phone */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-field">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-input" required value={newTicket.email} onChange={e => setNewTicket({...newTicket, email: e.target.value})} />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" required value={newTicket.phone} onChange={e => setNewTicket({...newTicket, phone: e.target.value})} />
                                </div>
                            </div>

                            {/* Row 3: Product / Priority */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                                <div className="form-field">
                                    <label className="form-label">Product</label>
                                    <select className="form-select" value={newTicket.product} onChange={e => setNewTicket({...newTicket, product: e.target.value})}>
                                        <option>CRM System</option>
                                        <option>CyberSecurity</option>
                                        <option>Cloud Services</option>
                                        <option>Network Infrastructure</option>
                                        <option>Custom Development</option>
                                        <option>Support & Maintenance</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Priority</label>
                                    <select className="form-select" value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Issue Category (Full width) */}
                            <div className="form-field">
                                <label className="form-label">Issue Category</label>
                                <select className="form-select" value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})}>
                                    <option>Technical</option>
                                    <option>HR</option>
                                    <option>Facility</option>
                                    <option>Access</option>
                                </select>
                            </div>

                            {/* Subject (Full width) */}
                            <div className="form-field">
                                <label className="form-label">Subject</label>
                                <input className="form-input" required value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} />
                            </div>

                            {/* Description (Full width) */}
                            <div className="form-field">
                                <label className="form-label">Description</label>
                                <textarea className="form-input" rows={4} required value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} />
                            </div>

                            {/* Attachment Upload (Drag & Drop + File Picker) */}
                            <div className="form-field">
                                <label className="form-label">Attachment Upload</label>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragOver(false);
                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                            const files = Array.from(e.dataTransfer.files);
                                            setNewTicket(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
                                        }
                                    }}
                                    onClick={() => document.getElementById('file-upload-input').click()}
                                    style={{
                                        border: dragOver ? '2px dashed var(--color-accent)' : '2px dashed var(--color-border)',
                                        borderRadius: 'var(--border-radius)',
                                        padding: 'var(--space-6)',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: dragOver ? 'var(--color-bg-alt)' : 'var(--color-bg-muted)',
                                        transition: 'all 0.2s ease-in-out',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)'
                                    }}
                                >
                                    <Plus size={20} style={{ color: 'var(--color-text-muted)' }} />
                                    <span style={{ fontSize: '11px', fontWeight: 'var(--font-semibold)' }}>
                                        Drag & Drop files here or click to browse
                                    </span>
                                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                                        Supports files of any format
                                    </span>
                                    <input
                                        id="file-upload-input"
                                        type="file"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                const files = Array.from(e.target.files);
                                                setNewTicket(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
                                            }
                                        }}
                                    />
                                </div>

                                {/* Render Selected Attachments */}
                                {newTicket.attachments.length > 0 && (
                                    <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                                        {newTicket.attachments.map((file, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: 'var(--space-2) var(--space-3)',
                                                    backgroundColor: 'var(--color-bg-muted)',
                                                    borderRadius: 'var(--border-radius)',
                                                    fontSize: '11px',
                                                    border: '1px solid var(--color-border)'
                                                }}
                                            >
                                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                                                    {file.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNewTicket(prev => ({
                                                            ...prev,
                                                            attachments: prev.attachments.filter((_, i) => i !== index)
                                                        }));
                                                    }}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: 'var(--color-error)',
                                                        cursor: 'pointer',
                                                        fontSize: '11px',
                                                        fontWeight: 'var(--font-bold)'
                                                    }}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
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
