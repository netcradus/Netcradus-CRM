import React, { useState, useEffect, useCallback } from "react";
import { Mail, Plus, Search, ChevronRight, Trash2, CheckCircle, Clock, Inbox, Send, Archive } from "lucide-react";
import { apiUrl } from "../../config/api";

const SalesInbox = () => {
  const [inboxData, setInboxData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newMessage, setNewMessage] = useState({ subject: "", sender: "", recipient: "", message: "", category: "General", status: "Unread", date: new Date().toISOString() });

  const fetchInbox = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/sales-inbox"));
      const data = await res.json();
      setInboxData(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchInbox(); }, [fetchInbox]);

  const toggleStatus = async (id) => {
    const msg = inboxData.find((m) => m._id === id);
    const updatedStatus = msg.status === "Unread" ? "Read" : "Unread";
    try {
      const res = await fetch(apiUrl(`/api/sales-inbox/${id}`), { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: updatedStatus }) });
      const updatedMsg = await res.json();
      setInboxData(inboxData.map((m) => (m._id === id ? updatedMsg : m)));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await fetch(apiUrl(`/api/sales-inbox/${id}`), { method: "DELETE" });
      setInboxData(inboxData.filter((m) => m._id !== id));
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/sales-inbox"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newMessage) });
      const savedMessage = await res.json();
      setInboxData([savedMessage, ...inboxData]);
      setNewMessage({ subject: "", sender: "", recipient: "", message: "", category: "General", status: "Unread", date: new Date().toISOString() });
      setShowModal(false);
    } catch (err) { console.error(err); }
  };

  const filtered = inboxData.filter(m => m.subject.toLowerCase().includes(search.toLowerCase()) || m.sender.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Sales</span><ChevronRight size={10} /><span>Sales Inbox</span>
           </div>
           <h1 className="title">Sales Inbox</h1>
           <p className="subtitle">Unified inbox for all client communications and lead outreach.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Compose New</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 'var(--space-8)' }}>
         <aside>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
               <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', background: 'var(--color-bg-elevated)' }}><Inbox size={16} style={{ marginRight: '12px' }} /> All Messages</button>
               <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Clock size={16} style={{ marginRight: '12px' }} /> Recent</button>
               <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Send size={16} style={{ marginRight: '12px' }} /> Sent</button>
               <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}><Archive size={16} style={{ marginRight: '12px' }} /> Archived</button>
            </div>
         </aside>

         <main>
            <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
               <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                  <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search subject or sender..." value={search} onChange={e => setSearch(e.target.value)} />
               </div>
            </div>

            <div className="nc-card">
               <table className="nc-table">
                  <thead>
                     <tr><th>Subject</th><th>From / To</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                     {filtered.map((msg) => (
                       <tr key={msg._id} className={msg.status === 'Unread' ? 'is-unread' : ''}>
                          <td>
                             <div style={{ fontWeight: msg.status === 'Unread' ? 'var(--font-bold)' : 'var(--font-semibold)' }}>{msg.subject}</div>
                             <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.message}</div>
                          </td>
                          <td>
                             <div style={{ fontSize: 'var(--text-sm)' }}>{msg.sender}</div>
                             <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{msg.recipient}</div>
                          </td>
                          <td style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{new Date(msg.date).toLocaleDateString()}</td>
                          <td>
                             <span className={`badge badge-${msg.status?.toLowerCase() === 'unread' ? 'error' : 'ghost'}`} onClick={() => toggleStatus(msg._id)} style={{ cursor: 'pointer' }}>{msg.status}</span>
                          </td>
                          <td>
                             <button className="btn btn-ghost" style={{ color: 'var(--color-error)', padding: 'var(--space-1)' }} onClick={() => handleDelete(msg._id)}><Trash2 size={14} /></button>
                          </td>
                       </tr>
                     ))}
                     {filtered.length === 0 && !loading && (
                       <tr><td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>Inbox is empty.</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </main>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
              <div className="nc-modal-header"><h3>Compose Sales Message</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div className="form-field">
                    <label className="form-label">Subject</label>
                    <input className="form-input" required name="subject" value={newMessage.subject} onChange={e => setNewMessage({...newMessage, subject: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">From</label>
                       <input className="form-input" required name="sender" value={newMessage.sender} onChange={e => setNewMessage({...newMessage, sender: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">To</label>
                       <input className="form-input" required name="recipient" value={newMessage.recipient} onChange={e => setNewMessage({...newMessage, recipient: e.target.value})} />
                    </div>
                 </div>
                 <div className="form-field">
                    <label className="form-label">Message Content</label>
                    <textarea className="form-input" required rows={5} name="message" value={newMessage.message} onChange={e => setNewMessage({...newMessage, message: e.target.value})} />
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Send Message</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SalesInbox;
