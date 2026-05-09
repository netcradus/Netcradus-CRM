import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ClipboardCheck, Clock3, Filter, MessageSquareText, Plus, Search, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { apiUrl } from "../../config/api";

const EMPTY_FORM = { title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" };
const STATUS_OPTIONS = ["pending", "in_progress", "completed", "reviewed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

const prettify = (v) => v === "admin" ? "Administrator" : String(v || "").split("_").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
const formatDate = (v) => v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");
  const currentUserId = localStorage.getItem("userId");
  const canCreate = ["super_user", "admin"].includes(role);
  const canReview = ["super_user", "hr"].includes(role);

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTasks: 0, limit: 10 });
  const [filters, setFilters] = useState({ search: "", status: "", priority: "" });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);


  const fetchTasks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const endpoint = (canCreate || canReview) ? "/api/tasks" : "/api/tasks/my-tasks";
      const { data } = await axios.get(apiUrl(endpoint), {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: pagination.limit, ...filters }
      });
      setTasks(data.data || []);
      setPagination(prev => ({ ...prev, ...(data.pagination || {}), currentPage: page }));
    } catch (err) { setError("Failed to fetch tasks"); }
    finally { setLoading(false); }
  }, [canCreate, canReview, filters, pagination.limit, token]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await axios.put(apiUrl(`/api/tasks/${editingTask._id}`), form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(apiUrl("/api/tasks"), form, { headers: { Authorization: `Bearer ${token}` } });
      }
      fetchTasks();
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) { setError("Failed to save task"); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Tasks Management</h1>
          <p className="subtitle">Delegate work and track team progress across departments.</p>
        </div>
        <div className="page-header-right">
          {canCreate && (
            <button className="btn btn-primary" onClick={() => { setEditingTask(null); setForm(EMPTY_FORM); setShowModal(true); }}>
              <Plus size={16} /> New Task
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Active Tasks</span>
          <span className="metric-value">{tasks.filter(t => t.status !== 'completed').length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">In Progress</span>
          <span className="metric-value" style={{ color: 'var(--color-warning)' }}>{tasks.filter(t => t.status === 'in_progress').length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Completed</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>{tasks.filter(t => t.status === 'completed').length}</span>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: 1, marginBottom: 0 }}>
             <label className="form-label">Search Tasks</label>
             <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Task title..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
             </div>
          </div>
          <div className="form-field" style={{ width: '160px', marginBottom: 0 }}>
             <label className="form-label">Status</label>
             <select className="form-select" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="">All Status</option>
                {STATUS_OPTIONS.map(o => <option key={o} value={o}>{prettify(o)}</option>)}
             </select>
          </div>
          <button className="btn btn-ghost" onClick={() => setFilters({ search: "", status: "", priority: "" })}>Reset</button>
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr>
              <th>Task Title</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Loading tasks...</td></tr>
            ) : tasks.map(t => (
              <tr key={t._id}>
                <td>
                   <div style={{ fontWeight: 'var(--font-semibold)' }}>{t.title}</div>
                   <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>From: {t.assignedBy?.name || "System"}</div>
                </td>
                <td>{t.assignedTo?.name || "Unassigned"}</td>
                <td><span className={`badge badge-${t.priority === 'urgent' ? 'error' : t.priority === 'high' ? 'warning' : 'ghost'}`}>{prettify(t.priority)}</span></td>
                <td><span className={`badge badge-${t.status === 'completed' ? 'success' : 'warning'}`}>{prettify(t.status)}</span></td>
                <td>{formatDate(t.dueDate)}</td>
                <td>
                   <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-ghost" onClick={() => setViewTask(t)}><Eye size={14} /></button>
                      {canCreate && (
                        <button className="btn btn-ghost" onClick={() => { setEditingTask(t); setForm({...t, dueDate: t.dueDate?.substring(0, 16)}); setShowModal(true); }}><Pencil size={14} /></button>
                      )}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
           <button className="btn btn-ghost" disabled={pagination.currentPage === 1} onClick={() => fetchTasks(pagination.currentPage - 1)}><ChevronLeft size={16} /></button>
           <button className="btn btn-ghost" disabled={pagination.currentPage === pagination.totalPages} onClick={() => fetchTasks(pagination.currentPage + 1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
              <div className="nc-modal-header"><h3>{editingTask ? "Edit Task" : "Create New Task"}</h3></div>
              <form className="form" onSubmit={handleSubmit}>
                 <div className="form-field">
                    <label className="form-label">Task Title</label>
                    <input className="form-input" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Priority</label>
                       <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                          {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{prettify(o)}</option>)}
                       </select>
                    </div>
                    <div className="form-field">
                       <label className="form-label">Due Date</label>
                       <input className="form-input" type="datetime-local" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Task</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {viewTask && (
        <div className="nc-modal-overlay" onClick={() => setViewTask(null)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
              <div className="nc-modal-header"><h3>Task Details</h3></div>
              <div style={{ padding: 'var(--space-4)' }}>
                 <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">Title</label>
                    <div style={{ color: 'var(--color-text-primary)', fontWeight: 'bold' }}>{viewTask.title}</div>
                 </div>
                 <div style={{ marginBottom: 'var(--space-4)' }}>
                    <label className="form-label">Description</label>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', whiteSpace: 'pre-wrap' }}>{viewTask.description || "No description provided."}</div>
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div>
                       <label className="form-label">Priority</label>
                       <div><span className={`badge badge-${viewTask.priority === 'urgent' ? 'error' : viewTask.priority === 'high' ? 'warning' : 'ghost'}`}>{prettify(viewTask.priority)}</span></div>
                    </div>
                    <div>
                       <label className="form-label">Status</label>
                       <div><span className={`badge badge-${viewTask.status === 'completed' ? 'success' : 'warning'}`}>{prettify(viewTask.status)}</span></div>
                    </div>
                    <div>
                       <label className="form-label">Assigned To</label>
                       <div style={{ fontSize: 'var(--text-sm)' }}>{viewTask.assignedTo?.name || "Unassigned"}</div>
                    </div>
                    <div>
                       <label className="form-label">Due Date</label>
                       <div style={{ fontSize: 'var(--text-sm)' }}>{formatDate(viewTask.dueDate)}</div>
                    </div>
                 </div>
              </div>
              <div className="nc-modal-footer">
                 <button className="btn btn-ghost" onClick={() => setViewTask(null)} style={{ width: '100%' }}>Close</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

