import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users2, 
  LayoutGrid, 
  ChevronRight, 
  UserCog, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Bell, 
  LifeBuoy, 
  Umbrella, 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Clock, 
  RefreshCw 
} from "lucide-react";
import axios from "axios";
import { apiUrl } from "../../config/api";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "Manager";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Leave modal states
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [leaveDetails, setLeaveDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState("");
  const [managerRemarks, setManagerRemarks] = useState("");

  const handleOpenLeaveModal = async (req) => {
    setSelectedLeave(req);
    setLeaveDetails(null);
    setLoadingDetails(true);
    setDetailsError("");
    setManagerRemarks("");
    setActionError("");
    try {
      const res = await axios.get(apiUrl(`/api/manager/leaves/${req.requestId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setLeaveDetails(res.data.data);
      } else {
        setDetailsError("Failed to fetch leave request details.");
      }
    } catch (err) {
      console.error(err);
      setDetailsError(err.response?.data?.message || "Failed to load leave details.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCloseLeaveModal = () => {
    setSelectedLeave(null);
    setLeaveDetails(null);
    setManagerRemarks("");
    setActionError("");
  };

  const handleApproveLeave = async () => {
    if (!window.confirm("Are you sure you want to approve this leave request?")) {
      return;
    }
    setSubmittingAction(true);
    setActionError("");
    try {
      const res = await axios.patch(apiUrl(`/api/manager/leaves/${selectedLeave.requestId}/approve`), {
        reviewNote: managerRemarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        alert("Leave request approved successfully!");
        handleCloseLeaveModal();
        fetchDashboardData();
      } else {
        setActionError("Failed to approve leave request.");
      }
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || "Error approving leave request.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleRejectLeave = async () => {
    if (!managerRemarks || !managerRemarks.trim()) {
      setActionError("Remarks / reason is required for rejection.");
      return;
    }
    if (!window.confirm("Are you sure you want to reject this leave request?")) {
      return;
    }
    setSubmittingAction(true);
    setActionError("");
    try {
      const res = await axios.patch(apiUrl(`/api/manager/leaves/${selectedLeave.requestId}/reject`), {
        reviewNote: managerRemarks
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data && res.data.success) {
        alert("Leave request rejected successfully!");
        handleCloseLeaveModal();
        fetchDashboardData();
      } else {
        setActionError("Failed to reject leave request.");
      }
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || "Error rejecting leave request.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(apiUrl("/api/manager/dashboard"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.success) {
        setData(res.data.data);
      } else {
        setError("Failed to load dashboard statistics.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  };

  if (loading) {
    return (
      <div className="nc-page" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: "var(--color-primary)", marginBottom: "var(--space-4)" }} />
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Loading Manager Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nc-page" style={{ padding: "var(--space-6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <AlertCircle size={48} style={{ color: "var(--color-error)", marginBottom: "var(--space-4)" }} />
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-2)" }}>Error Loading Dashboard</h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)", marginBottom: "var(--space-6)", textAlign: "center" }}>{error}</p>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          <RefreshCw size={14} style={{ marginRight: "var(--space-2)" }} /> Retry
        </button>
      </div>
    );
  }

  const { team, attendance, leaves, tasks, projects, tickets, meetings, notifications, performance } = data || {};

  return (
    <div className="nc-page" style={{ padding: "var(--space-6)" }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-6)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <UserCog size={28} style={{ color: "var(--color-primary)" }} />
          <div>
            <h1 className="title" style={{ margin: 0 }}>Manager Dashboard</h1>
            <p className="subtitle" style={{ margin: 0 }}>Operational overview for your team hierarchy.</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchDashboardData} title="Refresh data">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/manager/team")}>
          <span className="metric-label">Team Members</span>
          <span className="metric-value">{team?.totalMembers ?? 0}</span>
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
            {team?.totalMembers === 0 ? "No team members assigned." : `${team?.activeMembers ?? 0} Active`}
          </span>
        </div>
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/manager/attendance")}>
          <span className="metric-label">Present Today</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>{attendance?.presentToday ?? 0}</span>
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{attendance?.lateToday ?? 0} Late</span>
        </div>
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/holidays")}>
          <span className="metric-label">Pending Leaves</span>
          <span className="metric-value" style={{ color: "var(--color-accent)" }}>{leaves?.pendingCount ?? 0}</span>
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Awaiting Action</span>
        </div>
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/tasks")}>
          <span className="metric-label">Pending Tasks</span>
          <span className="metric-value">{tasks?.pendingCount ?? 0}</span>
          <span style={{ fontSize: "10px", color: "var(--color-error)" }}>{tasks?.overdueCount ?? 0} Overdue</span>
        </div>
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/manager/projects")}>
          <span className="metric-label">Active Projects</span>
          <span className="metric-value">{projects?.activeCount ?? 0}</span>
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>In Progress</span>
        </div>
        <div className="nc-stat-card" style={{ cursor: "pointer" }} onClick={() => navigate("/tickets")}>
          <span className="metric-label">Open Tickets</span>
          <span className="metric-value">{tickets?.openCount ?? 0}</span>
          <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
            {tickets?.openCount === 0 ? "No open tickets." : `${tickets?.highPriorityCount ?? 0} Urgent`}
          </span>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="nc-panel nc-section" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
          Team Performance Metrics
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <div className="nc-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: "var(--font-medium)" }}>Team Performance %</span>
            <span style={{ fontSize: performance?.teamPerformancePercentage === null ? "var(--text-lg)" : "var(--text-2xl)", fontWeight: "var(--font-bold)", color: "var(--color-primary)" }}>
              {performance?.teamPerformancePercentage === null ? "Not Available" : `${performance.teamPerformancePercentage}%`}
            </span>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
              {performance?.teamPerformancePercentage === null ? "No performance data calculated." : "Weighted: Tasks (62.5%), Attendance (37.5%)"}
            </span>
          </div>
          <div className="nc-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: "var(--font-medium)" }}>Attendance Rate % (30d)</span>
            <span style={{ fontSize: performance?.attendanceRate === null ? "var(--text-lg)" : "var(--text-2xl)", fontWeight: "var(--font-bold)", color: "var(--color-success)" }}>
              {performance?.attendanceRate === null ? "Not Available" : `${performance.attendanceRate}%`}
            </span>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
              {performance?.attendanceRate === null ? "No attendance data found." : "Based on actual punch logs"}
            </span>
          </div>
          <div className="nc-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: "var(--font-medium)" }}>Task Completion Rate %</span>
            <span style={{ fontSize: performance?.completionRate === null ? "var(--text-lg)" : "var(--text-2xl)", fontWeight: "var(--font-bold)", color: "var(--color-accent)" }}>
              {performance?.completionRate === null ? "Not Available" : `${performance.completionRate}%`}
            </span>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
              {performance?.completionRate === null ? "No task data found." : "Completed / Total tasks assigned"}
            </span>
          </div>
          <div className="nc-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: "var(--font-medium)" }}>Project Completion %</span>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>Not Available</span>
            <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>No project timeline/metrics available</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="nc-panel nc-section" style={{ marginBottom: "var(--space-6)" }}>
        <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
          Quick Navigation
        </h2>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <button className="btn btn-primary" onClick={() => navigate("/manager/team")}>
            <Users2 size={16} style={{ marginRight: "var(--space-2)" }} />
            View My Team
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("/tasks")}>
            <LayoutGrid size={16} style={{ marginRight: "var(--space-2)" }} />
            Task Board
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("/tickets")}>
            <LifeBuoy size={16} style={{ marginRight: "var(--space-2)" }} />
            Support Tickets
          </button>
          <button className="btn btn-ghost" onClick={() => navigate("/holidays")}>
            <Umbrella size={16} style={{ marginRight: "var(--space-2)" }} />
            Holidays Calendar
          </button>
        </div>
      </div>

      {/* Operational Sections */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--space-6)",
          alignItems: "start",
        }}
      >
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Attendance Summary */}
          <div className="nc-panel nc-section" style={{ cursor: "pointer" }} onClick={() => navigate("/manager/attendance")}>
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
              Attendance Today Summary
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--space-2)", textAlign: "center" }}>
              <div style={{ padding: "var(--space-3)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-success)" }}>{attendance?.presentToday ?? 0}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Present</div>
              </div>
              <div style={{ padding: "var(--space-3)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-error)" }}>{attendance?.absentToday ?? 0}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Absent</div>
              </div>
              <div style={{ padding: "var(--space-3)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-accent)" }}>{attendance?.lateToday ?? 0}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Late</div>
              </div>
              <div style={{ padding: "var(--space-3)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-primary)" }}>{attendance?.onLeaveToday ?? 0}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>On Leave</div>
              </div>
              <div style={{ padding: "var(--space-3)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>{attendance?.notMarkedToday ?? 0}</div>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Unmarked</div>
              </div>
            </div>
          </div>

          {/* Pending Leave Requests */}
          <div className="nc-panel nc-section">
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
              Pending Leave Requests
            </h2>
            {leaves?.recentRequests?.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
                <Umbrella size={24} style={{ marginBottom: "var(--space-2)", opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>No pending leave requests.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="nc-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "var(--space-2)" }}>Employee</th>
                      <th style={{ textAlign: "left", padding: "var(--space-2)" }}>Employee ID</th>
                      <th style={{ textAlign: "left", padding: "var(--space-2)" }}>Type</th>
                      <th style={{ textAlign: "left", padding: "var(--space-2)" }}>Start Date</th>
                      <th style={{ textAlign: "left", padding: "var(--space-2)" }}>End Date</th>
                      <th style={{ textAlign: "center", padding: "var(--space-2)" }}>Days</th>
                      <th style={{ textAlign: "left", padding: "var(--space-2)" }}>Status</th>
                      <th style={{ textAlign: "center", padding: "var(--space-2)" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves?.recentRequests?.map((r) => (
                      <tr key={r.requestId} style={{ borderTop: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "var(--space-3)", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>{r.employeeName}</td>
                        <td style={{ padding: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{r.employeeCustomId || "—"}</td>
                        <td style={{ padding: "var(--space-3)", fontSize: "var(--text-sm)" }}><span className="badge badge-neutral">{r.leaveType}</span></td>
                        <td style={{ padding: "var(--space-3)", fontSize: "var(--text-sm)" }}>{formatDate(r.startDate)}</td>
                        <td style={{ padding: "var(--space-3)", fontSize: "var(--text-sm)" }}>{formatDate(r.endDate)}</td>
                        <td style={{ padding: "var(--space-3)", fontSize: "var(--text-sm)", textAlign: "center", fontWeight: "var(--font-semibold)" }}>{r.totalDays}</td>
                        <td style={{ padding: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                          <span className="badge badge-neutral" style={{ textTransform: "capitalize" }}>{r.status}</span>
                        </td>
                        <td style={{ padding: "var(--space-3)", textAlign: "center" }}>
                          <button className="btn btn-ghost btn-xs" onClick={() => handleOpenLeaveModal(r)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Projects */}
          <div className="nc-panel nc-section">
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
              Active Projects
            </h2>
            {projects?.recentActiveProjects?.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
                <Briefcase size={24} style={{ marginBottom: "var(--space-2)", opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>No active projects.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {projects?.recentActiveProjects?.map((p) => (
                  <div 
                    key={p.projectId} 
                    style={{ padding: "var(--space-3)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)", cursor: "pointer" }}
                    onClick={() => navigate(`/manager/projects/${p.projectId}`)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-1)" }}>
                      <span style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{p.projectName}</span>
                      <span className="badge badge-primary">{p.status}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)" }}>
                      <span>Deadline: {formatDate(p.deadline)}</span>
                      <span>Assigned: {p.assignedEmployees?.join(", ") || "None"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Pending / Overdue Tasks */}
          <div className="nc-panel nc-section">
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
              Pending / Overdue Tasks
            </h2>
            {tasks?.recentPendingTasks?.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
                <CheckCircle2 size={24} style={{ marginBottom: "var(--space-2)", opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>No pending tasks.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {tasks?.recentPendingTasks?.map((t) => {
                  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed" && t.status !== "reviewed";
                  return (
                    <div key={t.taskId} style={{ padding: "var(--space-3)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)", borderLeft: isOverdue ? "4px solid var(--color-error)" : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "var(--space-1)" }}>
                        <span style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{t.title}</span>
                        <span className={`badge ${isOverdue ? "badge-error" : "badge-neutral"}`}>{t.status}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-text-muted)" }}>
                        <span>Assigned to: {t.assignedEmployee}</span>
                        <span>Due: {formatDate(t.dueDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Meetings */}
          <div className="nc-panel nc-section">
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
              Upcoming Meetings
            </h2>
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
              <Calendar size={24} style={{ marginBottom: "var(--space-2)", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "var(--text-sm)", marginBottom: "var(--space-2)" }}>No upcoming meetings.</p>
              <p style={{ margin: 0, fontSize: "10px", color: "var(--color-text-muted)" }}>Sales customer meetings are restricted for Managers.</p>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="nc-panel nc-section">
            <h2 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
              Recent Notifications
            </h2>
            {notifications?.recentNotifications?.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)" }}>
                <Bell size={24} style={{ marginBottom: "var(--space-2)", opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>No notifications available.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {notifications?.recentNotifications?.map((n) => (
                  <div key={n.notificationId} style={{ padding: "var(--space-3)", background: "var(--color-surface-alt)", borderRadius: "var(--radius-md)", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ fontSize: "var(--text-sm)", color: n.isRead ? "var(--color-text-muted)" : "var(--color-text)" }}>{n.message}</div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)", alignSelf: "flex-end" }}>{formatDateTime(n.createdAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedLeave && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "var(--space-4)"
        }}>
          <div className="nc-panel" style={{
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)"
          }}>
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>Leave Request Details</h3>
              <button className="btn btn-ghost btn-sm" style={{ minWidth: "auto", padding: "0 var(--space-2)" }} onClick={handleCloseLeaveModal}>×</button>
            </div>

            {loadingDetails ? (
              <div style={{ textAlign: "center", padding: "var(--space-12)" }}>
                <RefreshCw className="animate-spin" size={24} style={{ color: "var(--color-primary)", marginBottom: "var(--space-2)", margin: "0 auto" }} />
                <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>Loading details...</p>
              </div>
            ) : detailsError ? (
              <div style={{ color: "var(--color-error)", padding: "var(--space-4)", textAlign: "center" }}>
                <AlertCircle size={24} style={{ marginBottom: "var(--space-2)", margin: "0 auto" }} />
                <p>{detailsError}</p>
              </div>
            ) : leaveDetails ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {/* Employee Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", background: "var(--color-bg-elevated)", padding: "var(--space-3)", borderRadius: "var(--radius-md)" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Employee Name</div>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{leaveDetails.userId?.name || "Unknown"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Employee ID</div>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{leaveDetails.userId?.userId || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Department</div>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{leaveDetails.userId?.department || "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Designation</div>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{leaveDetails.userId?.designation || "—"}</div>
                  </div>
                </div>

                {/* Leave Info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Leave Type</div>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>
                      <span className="badge badge-neutral">{leaveDetails.leaveTypeId?.name || "Unknown"}</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Applied Date</div>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{formatDate(leaveDetails.appliedAt)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Date Range</div>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-xs)" }}>
                      {formatDate(leaveDetails.from)} to {formatDate(leaveDetails.to)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Total Days</div>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{leaveDetails.totalDays} day(s)</div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Reason</div>
                  <div style={{ fontSize: "var(--text-sm)", background: "var(--color-surface-alt)", padding: "var(--space-2)", borderRadius: "var(--radius-sm)", marginTop: "var(--space-1)" }}>
                    {leaveDetails.reason || "No reason provided."}
                  </div>
                </div>

                {/* Supporting Documents if any */}
                {leaveDetails.documents && leaveDetails.documents.length > 0 && (
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Supporting Documents</div>
                    <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                      {leaveDetails.documents.map((doc, idx) => (
                        <a key={idx} href={doc} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <FileText size={12} /> Document {idx + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leave Balances Breakdown */}
                {leaveDetails.balances && leaveDetails.balances.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>Employee Leave Balances</div>
                    <div style={{ overflowX: "auto" }}>
                      <table className="nc-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-xs)" }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: "left", padding: "var(--space-1)" }}>Type</th>
                            <th style={{ textAlign: "center", padding: "var(--space-1)" }}>Allocated</th>
                            <th style={{ textAlign: "center", padding: "var(--space-1)" }}>Used</th>
                            <th style={{ textAlign: "center", padding: "var(--space-1)" }}>Pending</th>
                            <th style={{ textAlign: "center", padding: "var(--space-1)" }}>Remaining</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveDetails.balances.map((bal) => (
                            <tr key={bal._id || bal.leaveTypeId?._id} style={{ borderTop: "1px solid var(--color-border)" }}>
                              <td style={{ padding: "var(--space-2)", fontWeight: "var(--font-medium)" }}>{bal.leaveTypeId?.name || "Unknown"}</td>
                              <td style={{ padding: "var(--space-2)", textAlign: "center" }}>{bal.allocated}</td>
                              <td style={{ padding: "var(--space-2)", textAlign: "center" }}>{bal.used}</td>
                              <td style={{ padding: "var(--space-2)", textAlign: "center" }}>{bal.pending}</td>
                              <td style={{ padding: "var(--space-2)", textAlign: "center", fontWeight: "var(--font-bold)", color: "var(--color-primary)" }}>{bal.remaining}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Action Input: Review Note / Remarks */}
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
                  <label style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
                    Manager Note / Remarks (Mandatory for rejection)
                  </label>
                  <textarea
                    className="nc-input"
                    rows={3}
                    placeholder="Enter remarks or approval/rejection note..."
                    value={managerRemarks}
                    onChange={(e) => setManagerRemarks(e.target.value)}
                    style={{ width: "100%", resize: "none" }}
                  />
                  {actionError && (
                    <div style={{ color: "var(--color-error)", fontSize: "var(--text-xs)", marginTop: "var(--space-1)" }}>{actionError}</div>
                  )}
                </div>

                {/* Modal Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-3)" }}>
                  <button className="btn btn-ghost" onClick={handleCloseLeaveModal} disabled={submittingAction}>Close</button>
                  <button className="btn btn-error" onClick={handleRejectLeave} disabled={submittingAction}>Reject</button>
                  <button className="btn btn-success" onClick={handleApproveLeave} disabled={submittingAction}>Approve</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
