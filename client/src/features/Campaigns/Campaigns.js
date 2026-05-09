import React, { useState, useEffect, useCallback } from "react";
import { Megaphone, Plus, Search, ChevronRight, Trash2, Calendar, Target } from "lucide-react";
import { apiUrl } from "../../config/api";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  
  const [form, setForm] = useState({ name: "", channel: "", status: "Active", startDate: "", endDate: "" });

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/campaigns"));
      const data = await res.json();
      setCampaigns(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetch(apiUrl("/api/campaigns"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      fetchCampaigns();
      setShowModal(false);
      setForm({ name: "", channel: "", status: "Active", startDate: "", endDate: "" });
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    try {
      await fetch(apiUrl(`/api/campaigns/${id}`), { method: "DELETE" });
      fetchCampaigns();
    } catch (err) { console.error(err); }
  };

  const filtered = campaigns.filter(c => {
    const matchesTab = filter === "All" || c.status === filter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Marketing</span><ChevronRight size={10} /><span>Campaigns</span>
           </div>
           <h1 className="title">Marketing Campaigns</h1>
           <p className="subtitle">Track and manage your multi-channel marketing efforts.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Campaign</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Total Active</span><span className="metric-value">{campaigns.filter(c => c.status === 'Active').length}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Channels</span><span className="metric-value">{new Set(campaigns.map(c => c.channel)).size}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Completed</span><span className="metric-value">{campaigns.filter(c => c.status === 'Completed').length}</span></div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['All', 'Active', 'Paused', 'Completed'].map(t => (
              <button key={t} className={`btn ${filter === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(t)} style={{ height: '32px', fontSize: 'var(--text-xs)' }}>{t}</button>
            ))}
         </div>
         <div style={{ position: 'relative', width: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px', height: '32px' }} placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} />
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Campaign</th><th>Channel</th><th>Status</th><th>Duration</th><th>Actions</th></tr>
            </thead>
            <tbody>
               {filtered.map(c => (
                 <tr key={c._id}>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Megaphone size={14} color="var(--color-accent)" /></div>
                          <span style={{ fontWeight: 'var(--font-semibold)' }}>{c.name}</span>
                       </div>
                    </td>
                    <td><span className="badge badge-neutral">{c.channel}</span></td>
                    <td><span className={`badge badge-${c.status?.toLowerCase() === 'active' ? 'success' : 'warning'}`}>{c.status}</span></td>
                    <td><span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}</span></td>
                    <td>
                       <button className="btn btn-ghost" style={{ padding: 'var(--space-1)', color: 'var(--color-error)' }} onClick={() => handleDelete(c._id)}><Trash2 size={14} /></button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
              <div className="nc-modal-header"><h3>New Campaign</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div className="form-field">
                    <label className="form-label">Campaign Name</label>
                    <input className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Channel</label>
                    <select className="form-select" required value={form.channel} onChange={e => setForm({...form, channel: e.target.value})}>
                       <option value="">Select Channel...</option>
                       <option value="Email">Email</option>
                       <option value="Social Media">Social Media</option>
                       <option value="PPC">PPC</option>
                       <option value="Direct Mail">Direct Mail</option>
                    </select>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Start Date</label>
                       <input className="form-input" type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">End Date</label>
                       <input className="form-input" type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Launch Campaign</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
