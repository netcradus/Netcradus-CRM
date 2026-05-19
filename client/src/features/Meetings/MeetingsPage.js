import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Calendar,
  CalendarClock,
  CheckSquare,
  Flag,
  MessageSquare,
  TrendingUp,
  XCircle,
  X,
} from "lucide-react";
import { Navigate } from "react-router-dom";

import { apiUrl } from "../../config/api";

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
});

const normalizeRole = (role) => String(role || "").trim().toLowerCase();

const meetingTypeLabels = {
  in_person: "In Person",
  video_call: "Video Call",
  phone_call: "Phone Call",
};

const timelineIcons = {
  meeting_scheduled: Calendar,
  meeting_rescheduled: CalendarClock,
  meeting_held: CheckSquare,
  outcome_set: Flag,
  note_added: MessageSquare,
  converted_to_deal: TrendingUp,
  dropped: XCircle,
};

const emptyOutcomeForm = {
  outcome: "converted",
  note: "",
  rescheduledAt: "",
  dealData: {
    name: "",
    value: "",
    assignedTo: "",
    expectedCloseDate: "",
    status: "New",
  },
};

const formatDateTime = (value) => {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString();
};

const toInputDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const isOverdueMeeting = (lead) => {
  if (!lead?.meetingScheduledAt || lead?.meetingOutcome) {
    return false;
  }
  return new Date(lead.meetingScheduledAt) < new Date();
};

function MeetingsPage() {
  const userRole = normalizeRole(localStorage.getItem("userRole"));
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [meetingDetail, setMeetingDetail] = useState(null);
  const [panelLoading, setPanelLoading] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [outcomeForm, setOutcomeForm] = useState(emptyOutcomeForm);
  const [meetingNote, setMeetingNote] = useState("");

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(apiUrl("/api/meetings"), getAuthConfig());
      setMeetings(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load meetings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingDetail = async (leadId) => {
    try {
      setPanelLoading(true);
      const response = await axios.get(apiUrl(`/api/meetings/${leadId}`), getAuthConfig());
      setMeetingDetail(response.data?.data || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load meeting details.");
    } finally {
      setPanelLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    if (selectedLeadId) {
      fetchMeetingDetail(selectedLeadId);
    } else {
      setMeetingDetail(null);
    }
  }, [selectedLeadId]);

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((left, right) => {
      const leftOverdue = isOverdueMeeting(left) ? 0 : 1;
      const rightOverdue = isOverdueMeeting(right) ? 0 : 1;
      if (leftOverdue !== rightOverdue) {
        return leftOverdue - rightOverdue;
      }
      return new Date(left.meetingScheduledAt || 0) - new Date(right.meetingScheduledAt || 0);
    });
  }, [meetings]);

  const stats = useMemo(() => ({
    upcoming: meetings.filter((lead) => lead.meetingScheduledAt && new Date(lead.meetingScheduledAt) > new Date()).length,
    overdue: meetings.filter((lead) => isOverdueMeeting(lead)).length,
    rescheduled: meetings.filter((lead) => lead.meetingOutcome === "rescheduled").length,
  }), [meetings]);

  if (userRole !== "super_user") {
    return <Navigate to="/dashboard" replace />;
  }

  const selectedLead = meetingDetail?.lead || null;
  const timeline = meetingDetail?.timeline?.events || [];

  const openOutcomeModal = (lead) => {
    setSelectedLeadId(lead._id);
    setOutcomeForm({
      outcome: "converted",
      note: "",
      rescheduledAt: toInputDateTime(lead.meetingScheduledAt),
      dealData: {
        name: lead.name || "",
        value: "",
        assignedTo: lead.assignedTo?.name || lead.createdBy?.name || "",
        expectedCloseDate: "",
        status: "New",
      },
    });
    setShowOutcomeModal(true);
  };

  const saveOutcome = async (event) => {
    event.preventDefault();
    if (!selectedLeadId) {
      return;
    }

    try {
      await axios.patch(
        apiUrl(`/api/meetings/${selectedLeadId}/outcome`),
        {
          outcome: outcomeForm.outcome,
          note: outcomeForm.note,
          rescheduledAt: outcomeForm.rescheduledAt || null,
          dealData: outcomeForm.dealData,
        },
        getAuthConfig()
      );

      setShowOutcomeModal(false);
      setOutcomeForm(emptyOutcomeForm);
      setSelectedLeadId(null);
      await fetchMeetings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save meeting outcome.");
    }
  };

  const saveMeetingNote = async () => {
    if (!selectedLeadId || !meetingNote.trim()) {
      return;
    }

    try {
      await axios.post(apiUrl(`/api/meetings/${selectedLeadId}/note`), { note: meetingNote.trim() }, getAuthConfig());
      setMeetingNote("");
      await Promise.all([fetchMeetings(), fetchMeetingDetail(selectedLeadId)]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to add meeting note.");
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)", position: "relative" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Meetings</h1>
          <p className="subtitle">Leads aligned for a meeting.</p>
        </div>
      </div>

      {error ? (
        <div className="nc-card" style={{ marginBottom: "var(--space-4)", color: "var(--color-error)" }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <div className="nc-stat-card">
          <span className="metric-label">Upcoming</span>
          <span className="metric-value">{stats.upcoming}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Overdue</span>
          <span className="metric-value" style={{ color: "var(--color-error)" }}>{stats.overdue}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Rescheduled</span>
          <span className="metric-value">{stats.rescheduled}</span>
        </div>
      </div>

      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        {loading ? (
          <div className="nc-card">Loading meetings...</div>
        ) : sortedMeetings.length ? (
          sortedMeetings.map((lead) => {
            const lastEvent = lead.timeline?.events?.[lead.timeline.events.length - 1];
            return (
              <div key={lead._id} className="nc-card" style={{ display: "grid", gap: "var(--space-3)", cursor: "pointer" }} onClick={() => setSelectedLeadId(lead._id)}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-lg)" }}>{lead.name}</div>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                      {lead.phone || "--"} · {lead.company || "No company"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
                    {isOverdueMeeting(lead) ? <span className="badge badge-error">Overdue</span> : null}
                    <span className="badge badge-warning">{meetingTypeLabels[lead.meetingType] || "Meeting"}</span>
                  </div>
                </div>
                <div style={{ display: "grid", gap: "var(--space-1)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                  <div><strong>Sales Owner:</strong> {lead.assignedTo?.name || lead.createdBy?.name || "Unassigned"}</div>
                  <div><strong>Scheduled:</strong> {formatDateTime(lead.meetingScheduledAt)}</div>
                  <div><strong>Location:</strong> {lead.meetingLocation || "--"}</div>
                  <div><strong>Last Timeline Event:</strong> {lastEvent?.eventType ? lastEvent.eventType.replace(/_/g, " ") : "meeting scheduled"}</div>
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button className="btn btn-primary" onClick={(event) => { event.stopPropagation(); openOutcomeModal(lead); }}>Set Outcome</button>
                  <button className="btn btn-ghost" onClick={(event) => { event.stopPropagation(); setSelectedLeadId(lead._id); }}>Add Note</button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="nc-card" style={{ color: "var(--color-text-muted)" }}>No meetings are waiting for follow-up.</div>
        )}
      </div>

      {selectedLeadId ? (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.35)", zIndex: 30 }}
            onClick={() => {
              setSelectedLeadId(null);
              setMeetingDetail(null);
            }}
          />
          <aside
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "min(42vw, 560px)",
              minWidth: "380px",
              height: "100vh",
              background: "var(--color-surface, #fff)",
              zIndex: 31,
              overflowY: "auto",
              padding: "var(--space-6)",
              boxShadow: "-16px 0 40px rgba(15, 23, 42, 0.16)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
              <div>
                <h2 style={{ marginBottom: "var(--space-1)" }}>{selectedLead?.name || "Meeting Detail"}</h2>
                <p style={{ color: "var(--color-text-muted)", margin: 0 }}>{selectedLead?.company || "No company"}</p>
              </div>
              <button className="btn btn-ghost" onClick={() => { setSelectedLeadId(null); setMeetingDetail(null); }}>
                <X size={16} />
              </button>
            </div>

            {panelLoading ? (
              <div className="nc-card">Loading meeting details...</div>
            ) : selectedLead ? (
              <>
                <div className="nc-card" style={{ marginBottom: "var(--space-4)" }}>
                  <div style={{ display: "grid", gap: "var(--space-2)" }}>
                    <div><strong>Phone:</strong> {selectedLead.phone || "--"}</div>
                    <div><strong>Email:</strong> {selectedLead.email || "--"}</div>
                    <div><strong>Company:</strong> {selectedLead.company || "--"}</div>
                    <div><strong>Meeting Type:</strong> {meetingTypeLabels[selectedLead.meetingType] || "--"}</div>
                    <div><strong>Meeting Date:</strong> {formatDateTime(selectedLead.meetingScheduledAt)}</div>
                    <div><strong>Meeting Location:</strong> {selectedLead.meetingLocation || "--"}</div>
                  </div>
                </div>

                <div className="nc-card">
                  <h3 style={{ marginBottom: "var(--space-4)" }}>Timeline</h3>
                  <div style={{ display: "grid", gap: "var(--space-4)" }}>
                    {timeline.length ? (
                      timeline.map((event) => {
                        const Icon = timelineIcons[event.eventType] || MessageSquare;
                        return (
                          <div key={event._id || `${event.performedAt}-${event.eventType}`} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: "var(--space-3)" }}>
                            <div style={{ color: event.eventType === "converted_to_deal" ? "var(--color-success)" : event.eventType === "dropped" ? "var(--color-error)" : "var(--color-accent)" }}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <div style={{ fontWeight: "var(--font-semibold)" }}>{event.eventType.replace(/_/g, " ")}</div>
                              <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                                {event.performedBy?.name || "System"} · {formatDateTime(event.performedAt)}
                              </div>
                              {event.note ? <div style={{ marginTop: "var(--space-1)" }}>{event.note}</div> : null}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ color: "var(--color-text-muted)" }}>No timeline events yet.</div>
                    )}
                  </div>

                  <div style={{ marginTop: "var(--space-6)" }}>
                    <label className="form-label">Add Note</label>
                    <textarea className="form-input" rows={3} value={meetingNote} onChange={(event) => setMeetingNote(event.target.value)} />
                    <button className="btn btn-primary" style={{ marginTop: "var(--space-3)" }} onClick={saveMeetingNote}>Save Note</button>
                  </div>
                </div>
              </>
            ) : null}
          </aside>
        </>
      ) : null}

      {showOutcomeModal ? (
        <div className="nc-modal-overlay" onClick={() => setShowOutcomeModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "620px" }}>
            <div className="nc-modal-header">
              <h3>Set Outcome</h3>
            </div>

            <form className="form" onSubmit={saveOutcome}>
              <div className="form-field">
                <label className="form-label">Outcome</label>
                <select className="form-select" value={outcomeForm.outcome} onChange={(event) => setOutcomeForm({ ...outcomeForm, outcome: event.target.value })}>
                  <option value="converted">Converted to Deal</option>
                  <option value="dropped">Dropped</option>
                  <option value="rescheduled">Rescheduled</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label">Note</label>
                <textarea className="form-input" rows={3} required={outcomeForm.outcome === "dropped"} value={outcomeForm.note} onChange={(event) => setOutcomeForm({ ...outcomeForm, note: event.target.value })} />
              </div>

              {outcomeForm.outcome === "converted" ? (
                <>
                  <div className="form-field">
                    <label className="form-label">Deal Name</label>
                    <input className="form-input" required value={outcomeForm.dealData.name} onChange={(event) => setOutcomeForm({ ...outcomeForm, dealData: { ...outcomeForm.dealData, name: event.target.value } })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label className="form-label">Deal Value</label>
                      <input className="form-input" type="number" required value={outcomeForm.dealData.value} onChange={(event) => setOutcomeForm({ ...outcomeForm, dealData: { ...outcomeForm.dealData, value: event.target.value } })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Assigned To</label>
                      <input className="form-input" required value={outcomeForm.dealData.assignedTo} onChange={(event) => setOutcomeForm({ ...outcomeForm, dealData: { ...outcomeForm.dealData, assignedTo: event.target.value } })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Expected Close Date</label>
                      <input className="form-input" type="date" value={outcomeForm.dealData.expectedCloseDate} onChange={(event) => setOutcomeForm({ ...outcomeForm, dealData: { ...outcomeForm.dealData, expectedCloseDate: event.target.value } })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={outcomeForm.dealData.status} onChange={(event) => setOutcomeForm({ ...outcomeForm, dealData: { ...outcomeForm.dealData, status: event.target.value } })}>
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : null}

              {outcomeForm.outcome === "rescheduled" ? (
                <div className="form-field">
                  <label className="form-label">New Meeting Date & Time</label>
                  <input className="form-input" type="datetime-local" required value={outcomeForm.rescheduledAt} onChange={(event) => setOutcomeForm({ ...outcomeForm, rescheduledAt: event.target.value })} />
                </div>
              ) : null}

              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Outcome</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowOutcomeModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MeetingsPage;
