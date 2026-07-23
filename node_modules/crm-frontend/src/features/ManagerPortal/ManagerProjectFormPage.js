import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { managerProjectApi } from "./managerProjectApi";

const emptyForm = {
  name: "",
  tagline: "",
  description: "",
  showcaseDescription: "",
  status: "in_progress",
  startDate: "",
  endDate: "",
  deadline: "",
  industry: "",
  techStack: [],
  assignedEngineer: "",
  collaborators: [],
};

const toInputDate = (date) => date ? new Date(date).toISOString().slice(0, 10) : "";

function TextField({ label, name, value, onChange, type = "text", maxLength, required }) {
  return (
    <label className="portfolio-form-field">
      {label}
      <input type={type} name={name} value={value || ""} onChange={onChange} maxLength={maxLength} required={required} />
    </label>
  );
}

export default function ManagerProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId") || "";
  const currentUserName = localStorage.getItem("userName") || "";

  const [form, setForm] = useState(() => ({ ...emptyForm }));
  const [tagInput, setTagInput] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(id);

  // Load manager's team (subordinates)
  useEffect(() => {
    const loadTeam = async () => {
      try {
        const { data } = await managerProjectApi.team();
        setTeamMembers(data.team || []);
      } catch (err) {
        console.error("Could not load team hierarchy", err);
      }
    };
    loadTeam();
  }, []);

  // Load project details if editing
  useEffect(() => {
    if (!editing) return;
    const load = async () => {
      try {
        const { data } = await managerProjectApi.get(id);
        const p = data.project;
        setForm({
          name: p.name || "",
          tagline: p.tagline || "",
          description: p.description || "",
          showcaseDescription: p.showcaseDescription || "",
          status: p.status || "in_progress",
          startDate: toInputDate(p.startDate),
          endDate: toInputDate(p.endDate),
          deadline: toInputDate(p.deadline),
          industry: p.industry || "",
          techStack: p.techStack || [],
          assignedEngineer: p.assignedEngineer?._id || p.assignedEngineer || "",
          collaborators: (p.collaborators || []).map((col) => col._id || col).filter(Boolean),
        });
      } catch (err) {
        setError("Could not load project details.");
      }
    };
    load();
  }, [editing, id]);

  const setValue = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const addTag = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = tagInput.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      techStack: [...new Set([...prev.techStack, value])].slice(0, 20),
    }));
    setTagInput("");
  };

  const removeTag = (tag) => {
    setForm((prev) => ({ ...prev, techStack: prev.techStack.filter((item) => item !== tag) }));
  };

  const toggleCollaborator = (userId) => {
    setForm((prev) => {
      const alreadyAdded = prev.collaborators.includes(userId);
      const updated = alreadyAdded
        ? prev.collaborators.filter((id) => id !== userId)
        : [...prev.collaborators, userId];
      return { ...prev, collaborators: updated };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.endDate) payload.endDate = null;
      if (!payload.startDate) payload.startDate = null;
      if (!payload.deadline) payload.deadline = null;
      if (!payload.assignedEngineer) payload.assignedEngineer = null;

      if (editing) {
        await managerProjectApi.update(id, payload);
        navigate(`/manager/projects/${id}`);
      } else {
        await managerProjectApi.create(payload);
        navigate("/manager/projects");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not save project.");
    } finally {
      setSaving(false);
    }
  };

  // Dropdown list must include ONLY: the logged-in manager and direct/indirect reporting employees
  const allowedAssignees = [
    { _id: currentUserId, name: `${currentUserName} (You)` },
    ...teamMembers,
  ];

  return (
    <div className="portfolio-page" style={{ padding: 'var(--space-6)' }}>
      <header className="portfolio-page-head" style={{ marginBottom: 'var(--space-6)' }}>
        <Link to="/manager/projects" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textDecoration: 'none', display: 'block', marginBottom: 'var(--space-2)' }}>← Projects</Link>
        <div>
          <span className="portfolio-kicker">{editing ? "Edit Project" : "New Project"}</span>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            {editing ? `Edit: ${form.name}` : "Add Project"}
          </h1>
        </div>
      </header>

      <form className="portfolio-form" onSubmit={submit}>
        {error && <div style={{ color: 'var(--color-error)', background: 'var(--color-error-muted)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>{error}</div>}

        <section className="portfolio-panel" style={{ background: 'var(--color-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>General Info</h3>
          <div className="portfolio-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
            <TextField label="Project Name" name="name" value={form.name} onChange={setValue} maxLength={100} required />
            <TextField label="Tagline" name="tagline" value={form.tagline} onChange={setValue} maxLength={200} />
            <TextField label="Industry" name="industry" value={form.industry} onChange={setValue} />
            <label className="portfolio-form-field">
              Status
              <select name="status" className="form-select" value={form.status} onChange={setValue} style={{ width: '100%', marginTop: 'var(--space-1)' }}>
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="ongoing">Ongoing</option>
                <option value="testing">Testing</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="maintenance">Maintenance</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <TextField label="Start Date" name="startDate" value={form.startDate} onChange={setValue} type="date" />
            <TextField label="End Date" name="endDate" value={form.endDate} onChange={setValue} type="date" />
            <TextField label="Deadline" name="deadline" value={form.deadline} onChange={setValue} type="date" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            <label className="portfolio-form-field">
              Assigned Engineer
              <select name="assignedEngineer" className="form-select" value={form.assignedEngineer} onChange={setValue} style={{ width: '100%', marginTop: 'var(--space-1)' }}>
                <option value="">Pending</option>
                {allowedAssignees.map((user) => (
                  <option key={user._id} value={user._id}>{user.name}</option>
                ))}
              </select>
            </label>

            <label className="portfolio-form-field">
              Collaborators
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                {allowedAssignees.map((user) => {
                  const isChecked = form.collaborators.includes(user._id);
                  return (
                    <label key={user._id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => toggleCollaborator(user._id)} 
                        style={{ width: '15px', height: '15px' }} 
                      />
                      <span>{user.name}</span>
                    </label>
                  );
                })}
              </div>
            </label>
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <label className="portfolio-form-field">
              Description / Internal Notes
              <textarea name="description" className="form-textarea" value={form.description} onChange={setValue} maxLength={2000} style={{ width: '100%', minHeight: '100px', marginTop: 'var(--space-1)' }} />
            </label>
            <label className="portfolio-form-field" style={{ marginTop: 'var(--space-4)' }}>
              Showcase Description
              <textarea name="showcaseDescription" className="form-textarea" value={form.showcaseDescription} onChange={setValue} maxLength={500} style={{ width: '100%', minHeight: '80px', marginTop: 'var(--space-1)' }} />
            </label>
          </div>
        </section>

        <section className="portfolio-panel" style={{ background: 'var(--color-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>Tech Stack</h3>
          <input 
            className="form-input" 
            value={tagInput} 
            onChange={(e) => setTagInput(e.target.value)} 
            onKeyDown={addTag} 
            placeholder="Type technology name (e.g. React) and press Enter" 
            style={{ width: '100%' }}
          />
          <div className="portfolio-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            {form.techStack.map((tag) => (
              <button 
                type="button" 
                key={tag} 
                onClick={() => removeTag(tag)}
                className="badge badge-accent"
                style={{ cursor: 'pointer', border: 'none' }}
              >
                {tag} &times;
              </button>
            ))}
          </div>
        </section>

        <div className="portfolio-form-actions" style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(editing ? `/manager/projects/${id}` : "/manager/projects")}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Project"}</button>
        </div>
      </form>
    </div>
  );
}
