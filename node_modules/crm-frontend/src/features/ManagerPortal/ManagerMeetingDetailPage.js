import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronRight, ArrowLeft, Edit3, Trash2, Calendar, Video, Clock, Users, MapPin, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { managerMeetingApi } from "./managerMeetingApi";

const typeLabel = {
  team_meeting: "Team Meeting",
  one_to_one: "One-to-One",
  project_review: "Project Review",
  daily_standup: "Daily Stand-up",
  performance_review: "Performance Review",
  training: "Training",
  internal_discussion: "Internal Discussion"
};

const statusLabel = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled"
};

export default function ManagerMeetingDetailPage() {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId") || "";

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Cancel modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const loadMeeting = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await managerMeetingApi.get(meetingId);
      setMeeting(res.data?.data || null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load meeting details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  const handleCancelMeeting = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      alert("Cancellation reason is mandatory.");
      return;
    }

    setCancelling(true);
    try {
      await managerMeetingApi.cancel(meetingId, cancelReason);
      setShowCancelModal(false);
      loadMeeting();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to cancel meeting.");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-20)", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
        <RefreshCw className="animate-spin" size={28} style={{ color: "var(--color-primary)" }} />
        <span style={{ color: "var(--color-text-muted)" }}>Loading meeting details...</span>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
        <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
          <AlertCircle size={40} style={{ color: "var(--color-error)", marginBottom: "var(--space-3)", opacity: 0.8 }} />
          <p style={{ color: "var(--color-error)", marginBottom: "var(--space-4)" }}>{error || "Meeting not found."}</p>
          <Link to="/manager/meetings" className="btn btn-secondary"><ArrowLeft size={14} style={{ marginRight: "6px" }} /> Back to Meetings</Link>
        </div>
      </div>
    );
  }

  const isOrganizer = meeting.organizer?._id === currentUserId;

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>ManagerPortal</span><ChevronRight size={10} /><span>Meetings</span><ChevronRight size={10} /><span>{meeting._id}</span>
          </div>
          <h1 className="title">{meeting.title}</h1>
          <p className="subtitle">Detailed overview of meeting agenda, participants, and timings.</p>
        </div>
        <div className="page-header-right" style={{ display: "flex", gap: "var(--space-2)" }}>
          <Link to="/manager/meetings" className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Meetings
          </Link>
          {isOrganizer && meeting.status !== "cancelled" && (
            <>
              <Link to={`/manager/meetings/${meetingId}/edit`} className="btn btn-secondary">
                <Edit3 size={16} style={{ marginRight: "6px" }} /> Edit / Reschedule
              </Link>
              <button className="btn btn-secondary" style={{ border: "1px solid var(--color-error)", color: "var(--color-error)" }} onClick={() => setShowCancelModal(true)}>
                <Trash2 size={16} style={{ marginRight: "6px" }} /> Cancel Meeting
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
        {/* Left main details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          
          {/* Status Alert Banner */}
          {meeting.status === "cancelled" && (
            <div className="nc-card" style={{ borderLeft: "4px solid var(--color-error)", background: "rgba(239, 68, 68, 0.05)", padding: "var(--space-4)" }}>
              <h4 style={{ color: "var(--color-error)", margin: "0 0 var(--space-1) 0", fontSize: "var(--text-sm)" }}>This meeting has been Cancelled</h4>
              <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-muted)" }}>
                <strong>Reason: </strong> {meeting.cancelReason || "No reason specified."}
              </p>
            </div>
          )}

          {/* Agenda */}
          <div className="nc-card" style={{ padding: "var(--space-6)" }}>
            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-3)", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-muted)" }}>Meeting Agenda</h3>
            <p style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              {meeting.agenda || "No agenda has been defined for this meeting."}
            </p>
          </div>

          {/* Prep Notes */}
          <div className="nc-card" style={{ padding: "var(--space-6)" }}>
            <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-3)", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-muted)" }}>Internal Preparation Notes</h3>
            <p style={{ whiteSpace: "pre-wrap", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
              {meeting.notes || "No prep notes provided."}
            </p>
          </div>

        </div>

        {/* Right sidebar details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          
          {/* Metadata Card */}
          <div className="nc-card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div>
              <span className="metric-label" style={{ fontSize: "10px" }}>Status</span>
              <div style={{ marginTop: "4px" }}>
                <span className={`badge badge-${meeting.status === 'scheduled' ? 'info' : meeting.status === 'completed' ? 'success' : 'neutral'}`}>
                  {statusLabel[meeting.status] || meeting.status}
                </span>
              </div>
            </div>

            <div>
              <span className="metric-label" style={{ fontSize: "10px" }}>Meeting Type</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "var(--font-semibold)", marginTop: "4px" }}>
                <Calendar size={14} style={{ color: "var(--color-primary)" }} />
                <span>{typeLabel[meeting.meetingType] || meeting.meetingType}</span>
              </div>
            </div>

            <div>
              <span className="metric-label" style={{ fontSize: "10px" }}>Date & Time</span>
              <div style={{ display: "flex", alignItems: "start", gap: "8px", fontSize: "13px", marginTop: "4px" }}>
                <Clock size={14} style={{ color: "var(--color-accent)", marginTop: "2px" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: "var(--font-semibold)" }}>{formatDate(meeting.meetingDate)}</span>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>{meeting.startTime} - {meeting.endTime}</span>
                </div>
              </div>
            </div>

            {meeting.relatedProject && (
              <div>
                <span className="metric-label" style={{ fontSize: "10px" }}>Related Project</span>
                <div style={{ marginTop: "4px" }}>
                  <span className="badge badge-neutral">{meeting.relatedProject.name}</span>
                </div>
              </div>
            )}

            <div>
              <span className="metric-label" style={{ fontSize: "10px" }}>Location / Join details</span>
              <div style={{ fontSize: "13px", marginTop: "4px" }}>
                {meeting.meetingLink ? (
                  <a href={meeting.meetingLink} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", textDecoration: "none", width: "100%", justifyContent: "center", padding: "6px 12px" }}>
                    Join Meeting <ExternalLink size={12} />
                  </a>
                ) : meeting.location ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-muted)" }}>
                    <MapPin size={14} /> <span>{meeting.location}</span>
                  </div>
                ) : (
                  <span style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>No physical location or link provided.</span>
                )}
              </div>
            </div>

            {meeting.reminderMinutes && (
              <div>
                <span className="metric-label" style={{ fontSize: "10px" }}>Reminder</span>
                <div style={{ fontSize: "12px", marginTop: "2px" }}>
                  Sends alert {meeting.reminderMinutes} minutes in advance.
                </div>
              </div>
            )}
          </div>

          {/* Organizer & Participants Card */}
          <div className="nc-card" style={{ padding: "var(--space-5)" }}>
            <h3 style={{ fontSize: "12px", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-muted)" }}>Participants</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              {/* Organizer */}
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "13px", fontWeight: "var(--font-semibold)" }}>{meeting.organizer?.name || "Unknown"}</span>
                <span style={{ fontSize: "10px", color: "var(--color-primary)", fontWeight: "var(--font-bold)" }}>ORGANIZER / CHAIR</span>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{meeting.organizer?.email}</span>
              </div>
              
              <hr style={{ border: "none", borderTop: "1px solid var(--color-border-subtle)", margin: "var(--space-2) 0" }} />

              {/* Invited Participants */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <span style={{ fontSize: "11px", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)" }}>INVITED REPORTING EMPLOYEES</span>
                {meeting.participants?.filter(p => p._id !== meeting.organizer?._id).map(p => (
                  <div key={p._id} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "12px", fontWeight: "var(--font-medium)" }}>{p.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{p.email}</span>
                  </div>
                ))}
                {meeting.participants?.filter(p => p._id !== meeting.organizer?._id).length === 0 && (
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>No other participants invited.</span>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div style={{ fontSize: "10px", color: "var(--color-text-muted)", padding: "0 var(--space-1)", display: "flex", flexDirection: "column", gap: "2px" }}>
            <span>Created at: {formatDateTime(meeting.createdAt)}</span>
            {meeting.updatedAt !== meeting.createdAt && <span>Updated at: {formatDateTime(meeting.updatedAt)}</span>}
          </div>

        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <form className="nc-card" style={{ width: "400px", padding: "var(--space-5)" }} onSubmit={handleCancelMeeting}>
            <h3 style={{ fontSize: "var(--text-lg)", marginBottom: "var(--space-3)" }}>Cancel Meeting</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
              Are you sure you want to cancel this meeting? This action cannot be undone, and a notification will be sent to all participants.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", marginBottom: "var(--space-5)" }}>
              <label className="form-label" style={{ fontWeight: "var(--font-semibold)" }}>Cancellation Reason *</label>
              <textarea 
                className="form-input" 
                style={{ height: "70px", resize: "none" }} 
                required 
                placeholder="e.g. Client requested reschedule, scheduling conflict..."
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <button type="button" className="btn btn-secondary" disabled={cancelling} onClick={() => setShowCancelModal(false)}>Close</button>
              <button type="submit" className="btn btn-primary" style={{ background: "var(--color-error)", borderColor: "var(--color-error)" }} disabled={cancelling}>
                {cancelling ? <RefreshCw className="animate-spin" size={14} /> : "Cancel Meeting"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
