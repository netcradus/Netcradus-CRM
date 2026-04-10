import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BriefcaseBusiness, CalendarRange, CircleGauge, FileUser } from "lucide-react";
import { apiUrl } from "../../config/api";
import "./InterviewsPage.css";

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
const statusOptions = [
  "New",
  "Scheduled",
  "In Progress",
  "Feedback Pending",
  "Shortlisted",
  "Rejected",
  "On Hold",
  "Selected",
  "No Show",
];
const decisionOptions = ["Pending", "Offered", "Accepted", "Rejected", "Hold", "Not Selected"];

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB");
};

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchInterviews = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(INTERVIEW_API, getAuthConfig());
      setInterviews(data.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load interview records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, []);

  const totals = useMemo(() => {
    const scheduled = interviews.filter((item) => item.status === "Scheduled").length;
    const selected = interviews.filter((item) => item.status === "Selected").length;
    const feedbackPending = interviews.filter((item) => item.status === "Feedback Pending").length;

    return {
      total: interviews.length,
      scheduled,
      selected,
      feedbackPending,
    };
  }, [interviews]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId("");
  };

  const buildPayload = () => ({
    candidateName: form.candidateName.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    appliedRole: form.appliedRole.trim(),
    department: form.department.trim(),
    interviewRound: form.interviewRound,
    interviewDate: form.interviewDate || null,
    interviewer: form.interviewer.trim(),
    status: form.status,
    feedback: {
      overallRating: Number(form.overallRating) || 0,
      communicationRating: Number(form.communicationRating) || 0,
      technicalRating: Number(form.technicalRating) || 0,
      cultureFitRating: Number(form.cultureFitRating) || 0,
      notes: form.feedbackNotes.trim(),
    },
    offerDetails: {
      expectedSalary: Number(form.expectedSalary) || 0,
      offeredSalary: Number(form.offeredSalary) || 0,
      finalDecision: form.finalDecision,
      joiningDate: form.joiningDate || null,
      notes: form.offerNotes.trim(),
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = buildPayload();

      if (editingId) {
        const { data } = await axios.put(`${INTERVIEW_API}/${editingId}`, payload, getAuthConfig());
        setInterviews((prev) => prev.map((item) => (item._id === editingId ? data.data : item)));
        setSuccess("Interview record updated successfully");
      } else {
        const { data } = await axios.post(INTERVIEW_API, payload, getAuthConfig());
        setInterviews((prev) => [data.data, ...prev]);
        setSuccess("Interview record created successfully");
      }

      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save interview record");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      candidateName: item.candidateName || "",
      email: item.email || "",
      phone: item.phone || "",
      appliedRole: item.appliedRole || "",
      department: item.department || "",
      interviewRound: item.interviewRound || "Screening",
      interviewDate: formatDateForInput(item.interviewDate),
      interviewer: item.interviewer || "",
      status: item.status || "New",
      overallRating: String(item.feedback?.overallRating ?? 0),
      communicationRating: String(item.feedback?.communicationRating ?? 0),
      technicalRating: String(item.feedback?.technicalRating ?? 0),
      cultureFitRating: String(item.feedback?.cultureFitRating ?? 0),
      feedbackNotes: item.feedback?.notes || "",
      expectedSalary: String(item.offerDetails?.expectedSalary ?? ""),
      offeredSalary: String(item.offerDetails?.offeredSalary ?? ""),
      finalDecision: item.offerDetails?.finalDecision || "Pending",
      joiningDate: formatDateForInput(item.offerDetails?.joiningDate),
      offerNotes: item.offerDetails?.notes || "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this interview record?")) return;

    try {
      await axios.delete(`${INTERVIEW_API}/${id}`, getAuthConfig());
      setInterviews((prev) => prev.filter((item) => item._id !== id));
      if (editingId === id) {
        resetForm();
      }
      setSuccess("Interview record deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete interview record");
    }
  };

  return (
    <div className="interviews-page">
      <section className="interviews-hero">
        <div>
          <span className="interviews-kicker">HR Interview Workspace</span>
          <h1>Candidate Interviews</h1>
          <p>
            Track applied role, department, interview round, status, feedback, ratings and final
            offer decisions from one page.
          </p>
        </div>
        <div className="interviews-hero-stats">
          <article className="interviews-stat-card">
            <FileUser size={18} />
            <span>Total Candidates</span>
            <strong>{totals.total}</strong>
          </article>
          <article className="interviews-stat-card">
            <CalendarRange size={18} />
            <span>Scheduled</span>
            <strong>{totals.scheduled}</strong>
          </article>
          <article className="interviews-stat-card">
            <BriefcaseBusiness size={18} />
            <span>Selected</span>
            <strong>{totals.selected}</strong>
          </article>
          <article className="interviews-stat-card">
            <CircleGauge size={18} />
            <span>Feedback Pending</span>
            <strong>{totals.feedbackPending}</strong>
          </article>
        </div>
      </section>

      {error ? <div className="interviews-alert interviews-alert-error">{error}</div> : null}
      {success ? <div className="interviews-alert interviews-alert-success">{success}</div> : null}

      <div className="interviews-layout">
        <section className="interviews-card interviews-form-card">
          <div className="interviews-card-header">
            <div>
              <h2>{editingId ? "Edit Interview Record" : "Add Candidate Interview"}</h2>
              <p>Capture the interview pipeline and HR decision details in one structured form.</p>
            </div>
          </div>

          <form className="interviews-form" onSubmit={handleSubmit}>
            <div className="interviews-grid interviews-grid-two">
              <label>
                <span>Candidate Name</span>
                <input required value={form.candidateName} onChange={(e) => updateField("candidateName", e.target.value)} placeholder="Candidate full name" />
              </label>
              <label>
                <span>Email</span>
                <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} placeholder="candidate@email.com" />
              </label>
              <label>
                <span>Phone</span>
                <input value={form.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="Contact number" />
              </label>
              <label>
                <span>Applied Role</span>
                <input required value={form.appliedRole} onChange={(e) => updateField("appliedRole", e.target.value)} placeholder="Role applied for" />
              </label>
              <label>
                <span>Department</span>
                <input required value={form.department} onChange={(e) => updateField("department", e.target.value)} placeholder="Department" />
              </label>
              <label>
                <span>Interview Round</span>
                <select value={form.interviewRound} onChange={(e) => updateField("interviewRound", e.target.value)}>
                  {roundOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Interview Date</span>
                <input type="date" value={form.interviewDate} onChange={(e) => updateField("interviewDate", e.target.value)} />
              </label>
              <label>
                <span>Interviewer</span>
                <input value={form.interviewer} onChange={(e) => updateField("interviewer", e.target.value)} placeholder="Interviewer name" />
              </label>
              <label>
                <span>Interview Status</span>
                <select value={form.status} onChange={(e) => updateField("status", e.target.value)}>
                  {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Final Decision</span>
                <select value={form.finalDecision} onChange={(e) => updateField("finalDecision", e.target.value)}>
                  {decisionOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <div className="interviews-section-block">
              <h3>Feedback and Ratings</h3>
              <div className="interviews-grid interviews-grid-four">
                <label>
                  <span>Overall</span>
                  <input type="number" min="0" max="5" value={form.overallRating} onChange={(e) => updateField("overallRating", e.target.value)} />
                </label>
                <label>
                  <span>Communication</span>
                  <input type="number" min="0" max="5" value={form.communicationRating} onChange={(e) => updateField("communicationRating", e.target.value)} />
                </label>
                <label>
                  <span>Technical</span>
                  <input type="number" min="0" max="5" value={form.technicalRating} onChange={(e) => updateField("technicalRating", e.target.value)} />
                </label>
                <label>
                  <span>Culture Fit</span>
                  <input type="number" min="0" max="5" value={form.cultureFitRating} onChange={(e) => updateField("cultureFitRating", e.target.value)} />
                </label>
              </div>
              <label>
                <span>Feedback Notes</span>
                <textarea rows="4" value={form.feedbackNotes} onChange={(e) => updateField("feedbackNotes", e.target.value)} placeholder="Interview observations, strengths, concerns and recommendation" />
              </label>
            </div>

            <div className="interviews-section-block">
              <h3>Offer and Final Decision</h3>
              <div className="interviews-grid interviews-grid-three">
                <label>
                  <span>Expected Salary</span>
                  <input type="number" min="0" value={form.expectedSalary} onChange={(e) => updateField("expectedSalary", e.target.value)} placeholder="Expected salary" />
                </label>
                <label>
                  <span>Offered Salary</span>
                  <input type="number" min="0" value={form.offeredSalary} onChange={(e) => updateField("offeredSalary", e.target.value)} placeholder="Offered salary" />
                </label>
                <label>
                  <span>Joining Date</span>
                  <input type="date" value={form.joiningDate} onChange={(e) => updateField("joiningDate", e.target.value)} />
                </label>
              </div>
              <label>
                <span>Offer Notes</span>
                <textarea rows="3" value={form.offerNotes} onChange={(e) => updateField("offerNotes", e.target.value)} placeholder="Package notes, decision remarks or final HR comments" />
              </label>
            </div>

            <div className="interviews-form-actions">
              <button type="submit" className="interviews-primary-btn" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Interview" : "Create Interview"}
              </button>
              {editingId ? (
                <button type="button" className="interviews-secondary-btn" onClick={resetForm}>
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="interviews-card interviews-records-card">
          <div className="interviews-card-header">
            <div>
              <h2>Interview Records</h2>
              <p>Review candidate pipeline details, scores and final outcome in one table.</p>
            </div>
            <span className="interviews-chip">{loading ? "Loading..." : `${interviews.length} records`}</span>
          </div>

          <div className="interviews-table-wrap">
            <table className="interviews-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Applied Role</th>
                  <th>Department</th>
                  <th>Round</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Decision</th>
                  <th>Offer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loading && interviews.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="interviews-empty">No interview records added yet.</td>
                  </tr>
                ) : (
                  interviews.map((item) => (
                    <tr key={item._id}>
                      <td data-label="Candidate">
                        <div className="interviews-candidate">
                          <strong>{item.candidateName}</strong>
                          <span>{item.email || item.phone || "--"}</span>
                          <small>{item.interviewer ? `Interviewer: ${item.interviewer}` : "Interviewer not assigned"}</small>
                        </div>
                      </td>
                      <td data-label="Applied Role">{item.appliedRole}</td>
                      <td data-label="Department">{item.department}</td>
                      <td data-label="Round">
                        <div className="interviews-inline-meta">
                          <span>{item.interviewRound}</span>
                          <small>{formatDate(item.interviewDate)}</small>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`interviews-status interviews-status-${String(item.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                          {item.status}
                        </span>
                      </td>
                      <td data-label="Rating">{item.feedback?.overallRating ?? 0}/5</td>
                      <td data-label="Decision">{item.offerDetails?.finalDecision || "Pending"}</td>
                      <td data-label="Offer">
                        <div className="interviews-inline-meta">
                          <span>{formatCurrency(item.offerDetails?.offeredSalary || 0)}</span>
                          <small>{formatDate(item.offerDetails?.joiningDate)}</small>
                        </div>
                      </td>
                      <td data-label="Actions">
                        <div className="interviews-actions">
                          <button type="button" className="interviews-secondary-btn" onClick={() => handleEdit(item)}>Edit</button>
                          <button type="button" className="interviews-danger-btn" onClick={() => handleDelete(item._id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
