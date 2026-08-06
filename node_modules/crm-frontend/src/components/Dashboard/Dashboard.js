import React, { lazy, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { apiUrl } from "../../config/api";
import SuperUserDashboard from "./SuperUserDashboard.js";
import ManagementDashboard from "./ManagementDashboard.js";
import AdminDashboard from "./AdminDashboard.js";
import SalesDashboard from "./SalesDashboard.js";
import SupportDashboard from "./SupportDashboard.js";
import HRDashboard from "./HRDashboard.js";
import TechDashboard from "./TechDashboard.js";
import DigitalMediaDashboard from "./DigitalMediaDashboard.js";
import PartnerDashboard from "../../features/Partner/PartnerDashboard.js";
import ManagerDashboard from "../../features/ManagerPortal/ManagerDashboard.js";
import COODashboard from "./COODashboard.js";
import { normalizeRole } from "../../config/access";

function Dashboard() {
  const userRole = normalizeRole(localStorage.getItem("userRole"));
  const token = localStorage.getItem("token");

  const [myMeetings, setMyMeetings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalParticipants, setModalParticipants] = useState([]);

  useEffect(() => {
    if (token && userRole !== "super_user") {
      const fetchMyMeetings = async () => {
        try {
          const res = await axios.get(apiUrl("/api/meeting-reminders?scope=upcoming&status=scheduled&page=1&limit=20"), {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMyMeetings(res.data?.reminders || []);
        } catch (err) {
          console.error("Error fetching my meetings:", err);
        }
      };
      fetchMyMeetings();

      const interval = setInterval(fetchMyMeetings, 300000);
      return () => clearInterval(interval);
    }
  }, [token, userRole]);

  const getTimeRemainingLabel = (dateTimeStr) => {
    const diffMs = new Date(dateTimeStr).getTime() - Date.now();
    if (diffMs <= 0) return "Started";
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 60) return `In ${diffMins} min${diffMins > 1 ? "s" : ""}`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `In ${diffHours} hr${diffHours > 1 ? "s" : ""}`;
    const diffDays = Math.floor(diffHours / 24);
    return `In ${diffDays} day${diffDays > 1 ? "s" : ""}`;
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderDashboard = () => {
    switch (userRole) {
      case "super_user": return <SuperUserDashboard />;
      case "coo": return <COODashboard />;
      case "admin": return <AdminDashboard />;
      case "management": return <ManagementDashboard />;
      case "manager": return <ManagerDashboard />;
      case "sales": return <SalesDashboard />;
      case "support": return <SupportDashboard />;
      case "hr": return <HRDashboard />;
      case "it": return <TechDashboard />;
      case "digital_media": return <DigitalMediaDashboard />;
      case "partner": return <PartnerDashboard />;
      default:
        return (
          <div className="role-fallback">
            <p>Welcome to Netcradus CRM. Your dashboard is being configured.</p>
          </div>
        );
    }
  };

  const [expiryInfo, setExpiryInfo] = useState(null);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if warning dismissed for today
    const lastDismissedDate = localStorage.getItem("passwordWarningDismissedDate");
    const today = new Date().toDateString();
    if (lastDismissedDate === today) {
      setIsWarningDismissed(true);
    }

    const fetchMe = async () => {
      try {
        const res = await axios.get(apiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.success) {
          setExpiryInfo(res.data.passwordExpiry);
          if (res.data.passwordExpiry.passwordChangeRequired) {
            localStorage.setItem("passwordChangeRequired", "true");
            navigate("/change-password");
          } else {
            localStorage.setItem("passwordChangeRequired", "false");
          }
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
      }
    };
    if (token) {
      fetchMe();
    }
  }, [token, navigate]);

  const handleDismissWarning = () => {
    localStorage.setItem("passwordWarningDismissedDate", new Date().toDateString());
    setIsWarningDismissed(true);
  };

  const getWarningStyle = (days) => {
    if (days <= 1) {
      return {
        backgroundColor: "rgba(234, 67, 53, 0.15)",
        borderColor: "var(--color-error, #ea4335)",
        color: "var(--color-error, #ea4335)"
      };
    }
    if (days <= 3) {
      return {
        backgroundColor: "rgba(251, 188, 5, 0.15)",
        borderColor: "var(--color-warning, #fbbc05)",
        color: "var(--color-warning, #fbbc05)"
      };
    }
    return {
      backgroundColor: "rgba(66, 133, 244, 0.15)",
      borderColor: "var(--color-accent, #4285F4)",
      color: "var(--color-accent, #4285F4)"
    };
  };

  const renderWarningBanner = () => {
    if (!expiryInfo || !expiryInfo.showPasswordExpiryWarning || isWarningDismissed) {
      return null;
    }

    const style = getWarningStyle(expiryInfo.passwordExpiresInDays);
    const dayText = expiryInfo.passwordExpiresInDays === 1 ? "1 day" : `${expiryInfo.passwordExpiresInDays} days`;
    const message = `Your password will expire in ${dayText}. Please change it to avoid losing access to the CRM.`;

    return (
      <div style={{ padding: "var(--space-6) var(--space-6) 0 var(--space-6)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            borderRadius: "16px",
            border: `1px solid ${style.borderColor}`,
            backgroundColor: style.backgroundColor,
            color: style.color,
            gap: "16px",
            flexWrap: "wrap",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)"
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: "600" }}>{message}</span>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => navigate("/change-password")}
              style={{
                padding: "6px 16px",
                fontSize: "13px",
                fontWeight: "600",
                border: "none",
                borderRadius: "6px",
                backgroundColor: style.borderColor,
                color: "#fff",
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              Change Password
            </button>
            <button
              type="button"
              onClick={handleDismissWarning}
              style={{
                background: "none",
                border: "none",
                color: "inherit",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    );
  };

  const dashboardContent = renderDashboard();

  if (userRole === "super_user") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {renderWarningBanner()}
        {dashboardContent}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {renderWarningBanner()}
      {myMeetings.length > 0 && (
        <div style={{ padding: 'var(--space-6) var(--space-6) 0 var(--space-6)' }}>
          <div className="nc-card" style={{ background: 'var(--color-bg-surface-strong, #1f1f1f)', border: '1px solid var(--color-border)', borderRadius: '24px', padding: 'var(--space-5)' }}>
            <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--text-base)', color: 'var(--color-text-primary)' }}>My Upcoming Meetings</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {myMeetings.map((meeting) => {
                const dateStr = new Date(meeting.meetingDateTime || meeting.meetingAt).toLocaleDateString("en-IN", { dateStyle: "medium" });
                const timeStr = new Date(meeting.meetingDateTime || meeting.meetingAt).toLocaleTimeString("en-IN", { timeStyle: "short" });
                const timeRemaining = getTimeRemainingLabel(meeting.meetingDateTime || meeting.meetingAt);
                const participantsCount = meeting.participants ? meeting.participants.length : 0;

                return (
                  <div
                    key={meeting._id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-4)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '16px',
                      background: 'var(--color-bg-surface, #262626)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={meeting.title}>
                          {meeting.title}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                          Organizer: {meeting.createdBy?.name || "Organizer"}
                        </div>
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontSize: '10px',
                        background: 'rgba(59, 130, 246, 0.15)',
                        color: '#3b82f6',
                        fontWeight: 'var(--font-semibold)',
                        flexShrink: 0
                      }}>
                        {timeRemaining}
                      </span>
                    </div>

                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      📅 {dateStr} at {timeStr}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {participantsCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ padding: '0 var(--space-2)', height: '28px', fontSize: 'var(--text-xs)' }}
                          onClick={() => {
                            setModalParticipants(meeting.participants || []);
                            setShowModal(true);
                          }}
                        >
                          View Participants ({participantsCount})
                        </button>
                      )}

                      {meeting.meetingLink && (
                        <a
                          href={meeting.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            height: '28px',
                            padding: '0 var(--space-3)',
                            fontSize: 'var(--text-xs)',
                            fontWeight: 'var(--font-semibold)'
                          }}
                        >
                          Join Meeting
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {dashboardContent}

      {/* Participants List Modal */}
      {showModal && (
        <div
          className="nc-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            background: 'var(--color-overlay, rgba(0, 0, 0, 0.6))',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="nc-modal-content"
            style={{
              width: 'min(100%, 550px)',
              maxHeight: 'min(80vh, 500px)',
              borderRadius: '20px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface-strong, #1f1f1f)',
              boxShadow: 'var(--shadow-2xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>Meeting Participants</h3>
              <button className="btn btn-ghost" type="button" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {modalParticipants.map((p) => (
                <div
                  key={p._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    background: 'var(--color-bg-surface, #262626)',
                  }}
                >
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--color-bg-alt, #3f3f3f)', color: '#fff', display: 'flex', alignItems: 'center', justify: 'center', flexShrink: 0, fontWeight: 'bold', fontSize: 'var(--text-xs)', overflow: 'hidden' }}>
                    {p.profilePhoto ? (
                      <img src={`${apiUrl(p.profilePhoto)}?token=${token}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                    ) : null}
                    <div
                      style={{
                        display: p.profilePhoto ? 'none' : 'flex',
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--color-bg-alt, #3f3f3f)',
                        color: 'var(--color-text-primary, #ffffff)',
                        fontWeight: 'bold',
                        fontSize: '12px',
                      }}
                    >
                      {getInitials(p.name)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)' }}>
                      {p.name}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {p.employeeId || p.userId || "N/A"} · {p.department || "General"} · {p.designation || "N/A"}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {p.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;

