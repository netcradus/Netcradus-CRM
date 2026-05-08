import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BriefcaseBusiness, CalendarRange, CircleGauge, FileUser, Plus, Pencil, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const INTERVIEW_API = apiUrl("/api/interviews");

const defaultForm = {
  candidateName: "",
  email: "",
  phone: "",
  appliedRole: "",
  department: "",
  interviewRound: "Screening",
  interviewDate: "",
  interviewer: "",
  status: "New",
  overallRating: "0",
  communicationRating: "0",
  technicalRating: "0",
  cultureFitRating: "0",
  feedbackNotes: "",
  expectedSalary: "",
  offeredSalary: "",
  finalDecision: "Pending",
  joiningDate: "",
  offerNotes: "",
};

const roundOptions = ["Screening", "HR Round", "Technical Round", "Manager Round", "Final Round"];
const statusOptions = ["New", "Scheduled", "In Progress", "Feedback Pending", "Shortlisted", "Rejected", "On Hold", "Selected", "No Show"];
const decisionOptions = ["Pending", "Offered", "Accepted", "Rejected", "Hold", "Not Selected"];

const getAuthConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const formatCurrency = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v) || 0);
const formatDate = (v) => v ? new Date(v).toLocaleDateString("en-GB") : "--";
const formatDateForInput = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(INTERVIEW_API, getAuthConfig());
      setInterviews(data.data || []);
    } catch (err) { setError("Failed to load records"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInterviews(); }, []);

  const totals = useMemo(() => ({
    total: interviews.length,
    scheduled: interviews.filter(i => i.status === "Scheduled").length,
    selected: interviews.filter(i => i.status === "Selected").length,
    pending: interviews.filter(i => i.status === "Feedback Pending").length,
  }), [interviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        feedback: { 
          overallRating: Number(form.overallRating), 
          communicationRating: Number(form.communicationRating),
          technicalRating: Number(form.technicalRating),
          cultureFitRating: Number(form.cultureFitRating),
          notes: form.feedbackNotes 
        },
        offerDetails: {
          expectedSalary: Number(form.expectedSalary),
          offeredSalary: Number(form.offeredSalary),
          finalDecision: form.finalDecision,
          joiningDate: form.joiningDate || null,
          notes: form.offerNotes
        }
      };
      if (editingId) {
        await axios.put(`${INTERVIEW_API}/${editingId}`, payload, getAuthConfig());
      } else {
        await axios.post(INTERVIEW_API, payload, getAuthConfig());
      }
      fetchInterviews();
      setShowModal(false);
      setForm(defaultForm);
      setEditingId("");
    } catch (err) { setError("Failed to save"); }
    finally { setSaving(false); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Candidate Interviews</h1>
          <p className="subtitle">Track recruitment pipeline and interview feedback.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(""); setForm(defaultForm); setShowModal(true); }}>
            <Plus size={16} /> Add Candidate
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Total Candidates</span>
          <span className="metric-value">{totals.total}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Scheduled</span>
          <span className="metric-value" style={{ color: 'var(--color-accent)' }}>{totals.scheduled}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Selected</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>{totals.selected}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Feedback Pending</span>
          <span className="metric-value" style={{ color: 'var(--color-warning)' }}>{totals.pending}</span>
        </div>
      </div>

      <div className="nc-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-base)' }}>Interview Records</h3>
        </div>
        <table className="nc-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Role / Dept</th>
              <th>Round / Date</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Decision</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map(item => (
              <tr key={item._id}>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'var(--font-semibold)' }}>{item.candidateName}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{item.email}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 'var(--text-xs)' }}>
                    <div>{item.appliedRole}</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>{item.department}</div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 'var(--text-xs)' }}>
                    <div>{item.interviewRound}</div>
                    <div style={{ color: 'var(--color-text-muted)' }}>{formatDate(item.interviewDate)}</div>
                  </div>
                </td>
                <td>
                  <span className={`badge badge-${item.status === 'Selected' ? 'success' : item.status === 'Rejected' ? 'error' : 'warning'}`}>
                    {item.status}
                  </span>
                </td>
                <td>{item.feedback?.overallRating || 0}/5</td>
                <td>{item.offerDetails?.finalDecision || 'Pending'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button className="btn btn-ghost" onClick={() => { 
                       setEditingId(item._id); 
                       setForm({
                         ...item,
                         overallRating: String(item.feedback?.overallRating || 0),
                         communicationRating: String(item.feedback?.communicationRating || 0),
                         technicalRating: String(item.feedback?.technicalRating || 0),
                         cultureFitRating: String(item.feedback?.cultureFitRating || 0),
                         feedbackNotes: item.feedback?.notes || "",
                         expectedSalary: String(item.offerDetails?.expectedSalary || ""),
                         offeredSalary: String(item.offerDetails?.offeredSalary || ""),
                         finalDecision: item.offerDetails?.finalDecision || "Pending",
                         joiningDate: formatDateForInput(item.offerDetails?.joiningDate),
                         offerNotes: item.offerDetails?.notes || "",
                         interviewDate: formatDateForInput(item.interviewDate)
                       });
                       setShowModal(true);
                    }}><Pencil size={14} /></button>
                    <button className="btn btn-ghost" style={{ color: 'var(--color-error)' }} onClick={async () => {
                      if(window.confirm("Delete record?")) {
                        await axios.delete(`${INTERVIEW_API}/${item._id}`, getAuthConfig());
                        fetchInterviews();
                      }
                    }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '800px', maxWidth: '95vw' }}>
            <div className="nc-modal-header">
              <h3>{editingId ? "Edit Candidate" : "Add Candidate"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-field">
                  <label className="form-label">Candidate Name</label>
                  <input className="form-input" required value={form.candidateName} onChange={e => setForm({...form, candidateName: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Applied Role</label>
                  <input className="form-input" required value={form.appliedRole} onChange={e => setForm({...form, appliedRole: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Department</label>
                  <input className="form-input" required value={form.department} onChange={e => setForm({...form, department: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Interview Round</label>
                  <select className="form-select" value={form.interviewRound} onChange={e => setForm({...form, interviewRound: e.target.value})}>
                    {roundOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Interview Date</label>
                  <input className="form-input" type="date" value={form.interviewDate} onChange={e => setForm({...form, interviewDate: e.target.value})} />
                </div>
              </div>
              
              <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                <h4 style={{ marginBottom: 'var(--space-3)' }}>Feedback & Ratings</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
                  <div className="form-field">
                    <label className="form-label">Overall (0-5)</label>
                    <input className="form-input" type="number" min="0" max="5" value={form.overallRating} onChange={e => setForm({...form, overallRating: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Technical</label>
                    <input className="form-input" type="number" min="0" max="5" value={form.technicalRating} onChange={e => setForm({...form, technicalRating: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Decision</label>
                    <select className="form-select" value={form.finalDecision} onChange={e => setForm({...form, finalDecision: e.target.value})}>
                      {decisionOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">Feedback Notes</label>
                  <textarea className="form-input" rows={2} value={form.feedbackNotes} onChange={e => setForm({...form, feedbackNotes: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? "Saving..." : "Save Record"}</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
