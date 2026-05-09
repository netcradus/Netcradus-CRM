import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Plus, Search, Trash2, Download, Upload, SlidersHorizontal, ChevronLeft, ChevronRight, LayoutPanelLeft, Pencil } from "lucide-react";

import { apiUrl } from "../../config/api";

function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [pagination, setPagination] = useState({ totalLeads: 0, totalPages: 0, currentPage: 1, limit: 10 });
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const [selectedLeads, setSelectedLeads] = useState(new Set());

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "", status: "In Progress", notes: "", assignedTo: "" });

  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  const LEAD_STATUSES = ["Closed", "In Progress", "Not Interested"];

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(searchParams.entries());
      const response = await axios.get(apiUrl("/api/leads"), { params });
      if (response.data.success) {
        setLeads(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setLeads(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) { setError("Failed to fetch leads"); }
    finally { setLoading(false); }
  }, [searchParams]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const updateFilter = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await axios.put(apiUrl(`/api/leads/${editingLead}`), formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(apiUrl("/api/leads"), formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      fetchLeads();
      setShowModal(false);
      setFormData({ name: "", email: "", phone: "", company: "", status: "In Progress", notes: "", assignedTo: "" });
    } catch (err) { setError("Failed to save lead"); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Leads Management</h1>
          <p className="subtitle">Track and nurture potential customer leads.</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost" onClick={() => { /* CSV Export logic */ }}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingLead(null); setShowModal(true); }}>
            <Plus size={16} /> New Lead
          </button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
              <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Name, email, company..." value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && updateFilter('search', searchInput)} />
            </div>
          </div>
          <div className="form-field" style={{ width: '160px', marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-select" value={searchParams.get('status') || ''} onChange={e => updateFilter('status', e.target.value)}>
              <option value="">All Status</option>
              {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-field" style={{ width: '120px', marginBottom: 0 }}>
            <label className="form-label">Limit</label>
            <select className="form-select" value={searchParams.get('limit') || '10'} onChange={e => updateFilter('limit', e.target.value)}>
              <option value="10">10 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
          <button className="btn btn-ghost" onClick={() => { setSearchInput(''); setSearchParams({}); }}>Clear</button>
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr>
              <th>Lead Name</th>
              <th>Company</th>
              <th>Email / Phone</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading leads...</td></tr>
            ) : leads.map(l => (
              <tr key={l._id}>
                <td><div style={{ fontWeight: 'var(--font-semibold)' }}>{l.name}</div></td>
                <td>{l.company || "--"}</td>
                <td>
                  <div style={{ fontSize: 'var(--text-xs)' }}>
                    <div>{l.email}</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>{l.phone || "--"}</div>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${l.status === 'Closed' ? 'success' : l.status === 'Not Interested' ? 'error' : 'warning'}`}>
                    {l.status}
                  </span>
                </td>
                <td>{l.assignedTo?.name || "Unassigned"}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-ghost" onClick={() => {
                      setEditingLead(l._id);
                      setFormData({ ...l, assignedTo: l.assignedTo?._id || "" });
                      setShowModal(true);
                    }}><Pencil size={14} /></button>
                    {userRole === 'super_user' && (
                      <button className="btn btn-ghost" style={{ color: 'var(--color-error)' }} onClick={async () => {
                        if(window.confirm("Delete lead?")) {
                          await axios.delete(apiUrl(`/api/leads/${l._id}`), { headers: { Authorization: `Bearer ${token}` } });
                          fetchLeads();
                        }
                      }}><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)', padding: '0 var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Showing {leads.length} of {pagination.totalLeads} leads
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-ghost" disabled={pagination.currentPage === 1} onClick={() => updateFilter('page', pagination.currentPage - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button className="btn btn-ghost" disabled={pagination.currentPage === pagination.totalPages} onClick={() => updateFilter('page', pagination.currentPage + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
            <div className="nc-modal-header"><h3>{editingLead ? "Edit Lead" : "Add New Lead"}</h3></div>
            <form onSubmit={handleSubmitForm} className="form">
              <div className="form-field">
                <label className="form-label">Full Name</label>
                <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-field">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-field">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Company</label>
                  <input className="form-input" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-select" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Lead</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leads;
