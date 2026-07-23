import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, Calendar, ArrowLeft, RefreshCw, Save } from "lucide-react";
import { managerMeetingApi } from "./managerMeetingApi";

const initialFormState = {
  title: "",
  meetingType: "team_meeting",
  agenda: "",
  notes: "",
  meetingDate: "",
  startTime: "",
  endTime: "",
  participants: [],
  relatedProject: "",
  location: "",
  meetingLink: "",
  reminderMinutes: 30
};

export default function ManagerMeetingFormPage() {
  const { id } = useParams(); // exists if editing
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId") || "";
  const currentUserName = localStorage.getItem("userName") || "Manager";

  const [form, setForm] = useState(initialFormState);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMetadata = async () => {
      setLoading(true);
      setError("");
      try {
        const [teamRes, projectsRes] = await Promise.all([
          managerMeetingApi.team(),
          managerMeetingApi.projects()
        ]);
        setTeamMembers(teamRes.data?.team || []);
        setProjects(projectsRes.data?.projects || []);

        if (id) {
          // If editing, load the existing meeting details
          const meetingRes = await managerMeetingApi.get(id);
          const m = meetingRes.data?.data;
          if (m) {
            if (m.status === "cancelled") {
              setError("Cancelled meetings cannot be modified.");
              return;
            }
            setForm({
              title: m.title || "",
              meetingType: m.meetingType || "team_meeting",
              agenda: m.agenda || "",
              notes: m.notes || "",
              meetingDate: m.meetingDate ? m.meetingDate.substring(0, 10) : "",
              startTime: m.startTime || "",
              endTime: m.endTime || "",
              participants: m.participants?.map(p => p._id || p) || [],
              relatedProject: m.relatedProject?._id || m.relatedProject || "",
              location: m.location || "",
              meetingLink: m.meetingLink || "",
              reminderMinutes: m.reminderMinutes || 30
            });
          }
        } else {
          // New meeting default: organizer included in participants
          setForm(prev => ({
            ...prev,
            participants: [currentUserId]
          }));
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch meeting initialization details.");
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [id, currentUserId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleParticipantChange = (memberId) => {
    setForm(prev => {
      const isSelected = prev.participants.includes(memberId);
      let updatedParticipants;
      if (isSelected) {
        updatedParticipants = prev.participants.filter(id => id !== memberId);
      } else {
        updatedParticipants = [...prev.participants, memberId];
      }
      return { ...prev, participants: updatedParticipants };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Basic UI Time validation before payload send
    if (form.endTime <= form.startTime) {
      setError("Meeting end time must be after start time.");
      setSubmitting(false);
      return;
    }

    const subordinateParticipants = form.participants.filter(pid => pid !== currentUserId);

    if (form.meetingType === "one_to_one") {
      if (subordinateParticipants.length !== 1) {
        setError("One-to-One meetings must select exactly one subordinate.");
        setSubmitting(false);
        return;
      }
    } else {
      if (subordinateParticipants.length === 0) {
        setError("Team meetings must select at least one participant other than the organizer.");
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      ...form,
      participants: form.participants,
      relatedProject: form.relatedProject || null
    };

    try {
      if (id) {
        await managerMeetingApi.update(id, payload);
        navigate(`/manager/meetings/${id}`);
      } else {
        await managerMeetingApi.create(payload);
        navigate("/manager/meetings");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to save team meeting. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-20)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
        <RefreshCw className="animate-spin" size={28} style={{ color: "var(--color-primary)" }} />
        <span style={{ color: "var(--color-text-muted)" }}>Loading form configurations...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>ManagerPortal</span><ChevronRight size={10} /><span>Meetings</span><ChevronRight size={10} /><span>{id ? "Edit" : "New"}</span>
          </div>
          <h1 className="title">{id ? "Reschedule / Edit Meeting" : "Schedule Team Meeting"}</h1>
          <p className="subtitle">{id ? "Reschedule meeting timings or update agendas." : "Schedule discussions, daily updates, or project review meetings with subordinates."}</p>
        </div>
        <div className="page-header-right">
          <Link to={id ? `/manager/meetings/${id}` : "/manager/meetings"} className="btn btn-secondary">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {error && (
          <div className="nc-card" style={{ padding: "var(--space-4)", marginBottom: "var(--space-6)", color: "var(--color-error)", borderLeft: "4px solid var(--color-error)", background: "rgba(239, 68, 68, 0.05)" }}>
            {error}
          </div>
        )}

        <form className="nc-card" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-6)" }} onSubmit={handleSubmit}>
          
          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Meeting Title *</label>
            <input 
              type="text" 
              name="title" 
              className="form-input" 
              required 
              placeholder="e.g. Daily Stand-up, Sprint Demo, 1-on-1 Feedback"
              value={form.title} 
              onChange={handleChange} 
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            {/* Type */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Meeting Type *</label>
              <select name="meetingType" className="form-select" value={form.meetingType} onChange={handleChange}>
                <option value="daily_standup">Daily Stand-up</option>
                <option value="team_meeting">Team Meeting</option>
                <option value="one_to_one">One-to-One</option>
                <option value="project_review">Project Review</option>
                <option value="performance_review">Performance Review</option>
                <option value="training">Training</option>
                <option value="internal_discussion">Internal Discussion</option>
              </select>
            </div>

            {/* Project */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Related Project</label>
              <select name="relatedProject" className="form-select" value={form.relatedProject} onChange={handleChange}>
                <option value="">None / Not Applicable</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-4)" }}>
            {/* Date */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Meeting Date *</label>
              <input type="date" name="meetingDate" className="form-input" required value={form.meetingDate} onChange={handleChange} />
            </div>

            {/* Start Time */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Start Time *</label>
              <input type="time" name="startTime" className="form-input" required value={form.startTime} onChange={handleChange} />
            </div>

            {/* End Time */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>End Time *</label>
              <input type="time" name="endTime" className="form-input" required value={form.endTime} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            {/* Location */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Location / Room</label>
              <input type="text" name="location" className="form-input" placeholder="e.g. Conference Room A, Cabin 3" value={form.location} onChange={handleChange} />
            </div>

            {/* Meeting Link */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Meeting Link (Virtual)</label>
              <input type="url" name="meetingLink" className="form-input" placeholder="e.g. Google Meet or Zoom URL" value={form.meetingLink} onChange={handleChange} />
            </div>
          </div>

          {/* Participants Dropdown Selection List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Invite Participants *</label>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
              {form.meetingType === "one_to_one" 
                ? "Select exactly one direct report." 
                : "Select at least one reporting team member."}
            </span>
            <div className="form-input" style={{ height: "auto", minHeight: "100px", maxHeight: "200px", overflowY: "auto", padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              
              {/* Logged in Manager (Self) */}
              <label key={currentUserId} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "13px" }}>
                <input 
                  type="checkbox" 
                  checked={form.participants.includes(currentUserId)}
                  onChange={() => handleParticipantChange(currentUserId)}
                  disabled={true} // Manager is always included as organizer
                />
                <span style={{ fontWeight: "var(--font-bold)" }}>{currentUserName} (Organizer / Self)</span>
              </label>

              {/* Subordinates */}
              {teamMembers.map(m => (
                <label key={m._id} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", cursor: "pointer", fontSize: "13px" }}>
                  <input 
                    type="checkbox" 
                    checked={form.participants.includes(m._id)}
                    onChange={() => handleParticipantChange(m._id)}
                  />
                  <span>{m.name} ({m.designation || "Staff"} — {m.role})</span>
                </label>
              ))}

              {teamMembers.length === 0 && (
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)", padding: "10px", textAlign: "center" }}>
                  No reporting team members found under your hierarchy.
                </div>
              )}
            </div>
          </div>

          {/* Agenda */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Agenda</label>
            <textarea name="agenda" className="form-input" style={{ height: "80px", resize: "vertical" }} placeholder="Describe the focus of the meeting..." value={form.agenda} onChange={handleChange} />
          </div>

          {/* Notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Internal Prep Notes</label>
            <textarea name="notes" className="form-input" style={{ height: "80px", resize: "vertical" }} placeholder="Private notes or preparation tasks..." value={form.notes} onChange={handleChange} />
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            <button type="button" className="btn btn-secondary" disabled={submitting} onClick={() => navigate(id ? `/manager/meetings/${id}` : "/manager/meetings")}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <RefreshCw className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              <span style={{ marginLeft: "6px" }}>{id ? "Update Meeting" : "Schedule Meeting"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
