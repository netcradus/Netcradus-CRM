import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { FaTicketAlt, FaComment, FaInfoCircle } from "react-icons/fa";
import "./TicketsPage.css";

const TicketsPage = () => {
    const [tickets, setTickets] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTicket, setNewTicket] = useState({ title: "", description: "", category: "Technical", priority: "medium", attachments: [] });
    const [newComment, setNewComment] = useState("");
    const [newInfo, setNewInfo] = useState("");
    
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const canManageTickets = userRole === "super_user";

    const fetchTickets = useCallback(async () => {
        try {
            const res = await axios.get(apiUrl("/api/tickets"), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTickets(res.data.data);
        } catch (err) {
            console.error("Error fetching tickets:", err);
        }
    }, [token]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

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
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            fetchTickets();
            setShowModal(false);
            setNewTicket({ title: "", description: "", category: "Technical", priority: "medium", attachments: [] });
        } catch (err) {
            console.error("Error creating ticket:", err);
        }
    };

    const handleAddComment = async (id) => {
        try {
            await axios.post(apiUrl(`/api/tickets/${id}/comment`), { message: newComment }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewComment("");
            fetchTickets();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddInfo = async (id) => {
        try {
            await axios.post(apiUrl(`/api/tickets/${id}/info`), { message: newInfo }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewInfo("");
            fetchTickets();
        } catch (err) {
            console.error(err);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.patch(apiUrl(`/api/tickets/${id}/status`), { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchTickets();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="tickets-container">
            <div className="tickets-header">
                <h2><FaTicketAlt /> Support Tickets</h2>
                <button className="btn-primary" onClick={() => setShowModal(true)}>Raise New Ticket</button>
            </div>

            <div className="tickets-grid">
                {tickets.map(ticket => (
                    <div key={ticket._id} className={`ticket-card status-${ticket.status}`}>
                        <div className="ticket-main">
                            <div className="ticket-id">{ticket.ticketId} - <span className={`priority-${ticket.priority}`}>{ticket.priority}</span></div>
                            <h3>{ticket.title}</h3>
                            <p>{ticket.description}</p>
                            <div className="ticket-meta">
                                <span>Category: {ticket.category}</span>
                                <span>Raised By: {ticket.raisedBy?.name}</span>
                            </div>
                        </div>

                        <div className="ticket-actions">
                            <div className="status-badge">{ticket.status}</div>
                            {canManageTickets && (
                                <select value={ticket.status} onChange={(e) => updateStatus(ticket._id, e.target.value)}>
                                    <option value="open">Open</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                </select>
                            )}
                        </div>

                        <div className="ticket-comments">
                            {ticket.comments?.map((c, i) => (
                                <div key={i} className="comment">
                                    <strong>{c.senderRole.toUpperCase()}:</strong> {c.message}
                                </div>
                            ))}
                            {ticket.infoUpdates?.map((u, i) => (
                                <div key={i} className="info-update">
                                    <FaInfoCircle /> <strong>Raiser Info:</strong> {u.message}
                                </div>
                            ))}
                        </div>

                        <div className="comment-box">
                            {canManageTickets ? (
                                <div className="input-flex">
                                    <input placeholder="Add a resolution comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                                    <button onClick={() => handleAddComment(ticket._id)}><FaComment /></button>
                                </div>
                            ) : (
                                ticket.raisedBy?._id === userId && (
                                    <div className="input-flex">
                                        <input placeholder="Add more information..." value={newInfo} onChange={(e) => setNewInfo(e.target.value)} />
                                        <button onClick={() => handleAddInfo(ticket._id)}><FaInfoCircle /></button>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Raise Support Ticket</h3>
                        <form onSubmit={handleCreateTicket}>
                            <input placeholder="Title" value={newTicket.title} onChange={e => setNewTicket({...newTicket, title: e.target.value})} required />
                            <textarea placeholder="Describe the issue..." value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})} required />
                            <select value={newTicket.category} onChange={e => setNewTicket({...newTicket, category: e.target.value})}>
                                <option>Technical</option><option>HR</option><option>Facility</option><option>Access</option>
                            </select>
                            <select value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})}>
                                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                            </select>
                            <input type="file" multiple onChange={e => setNewTicket({...newTicket, attachments: e.target.files})} />
                            <div className="modal-buttons">
                                <button type="submit" className="btn-primary">Submit Ticket</button>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TicketsPage;
