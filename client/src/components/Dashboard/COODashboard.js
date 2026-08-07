import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import axios from "axios";
import SalesDashboard from "./SalesDashboard";
import SupportDashboard from "./SupportDashboard";
import HRDashboard from "./HRDashboard";
import TechDashboard from "./TechDashboard";
import DigitalMediaDashboard from "./DigitalMediaDashboard";
import { apiUrl } from "../../config/api";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import ManagementDashboard from "./ManagementDashboard";
import WorkspaceWidget from "./WorkspaceWidget";
import { X, Users, UserCheck, CalendarClock, Clock3 } from "lucide-react";

const DASHBOARD_REFRESH_MS = 60000;
const DASHBOARD_REQUEST_TIMEOUT_MS = 10000;

const PIE_COLORS = ["#ff7a18", "#ff5f3d", "#ff3f6c", "#ff2d8f", "#ff8a00", "#c084fc"];

const formatRoleLabel = (role = "general") => {
  const norm = String(role || "").trim().toLowerCase();
  if (norm === "coo") return "Chief Operating Officer (COO)";
  return role === "admin"
    ? "Administrator"
    : role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const calculateWorkingHours = (employee) => {
  if (!employee.punchIn) return "0.00 hrs";
  if (employee.punchOut) return `${Number(employee.workingHours).toFixed(2)} hrs`;
  const punchInTime = new Date(employee.punchIn);
  const elapsedMs = new Date() - punchInTime;
  const breakMs = (employee.totalBreakDurationMinutes || 0) * 60 * 1000;
  const netMs = Math.max(0, elapsedMs - breakMs);
  const hours = netMs / (1000 * 60 * 60);
  return `${hours.toFixed(2)} hrs`;
};

const COODashboard = ({ preview = false, readOnly = false, embedded = false }) => {
  const previewRef = useRef(null);
  const graphRef = useRef(null);
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [loadingPendingTasks, setLoadingPendingTasks] = useState(false);
  const [error, setError] = useState("");

  // Drawer States
  const [activeDrawer, setActiveDrawer] = useState("");
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState("");
  const [drawerData, setDrawerData] = useState([]);

  // Subordinates Search/Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [desgFilter, setDesgFilter] = useState("");

  const fetchDrawerData = async (type) => {
    setDrawerLoading(true);
    setDrawerError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (type === "subordinates") {
        const res = await axios.get(apiUrl("/api/contacts/profiles"), { headers });
        setDrawerData(Array.isArray(res.data) ? res.data : []);
      } else if (type === "clockedIn" || type === "onLeave") {
        const res = await axios.get(apiUrl("/api/attendance/admin/today-snapshot"), { headers });
        const employees = Array.isArray(res.data?.data?.employees) ? res.data.data.employees : [];
        setDrawerData(employees);
      } else if (type === "pendingApprovals") {
        const res = await axios.get(apiUrl("/api/tasks/self/pending-approvals"), { headers });
        setDrawerData(Array.isArray(res.data?.tasks) ? res.data.tasks : []);
      }
    } catch (err) {
      console.error(`Error fetching drawer details for ${type}:`, err);
      setDrawerError("Failed to fetch detailed data. Please try again.");
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCardClick = (type) => {
    setActiveDrawer(type);
    fetchDrawerData(type);
  };

  const handleRetryDrawer = () => {
    if (activeDrawer) {
      fetchDrawerData(activeDrawer);
    }
  };

  const handleApproveTask = async (task) => {
    const note = window.prompt("Approval note (optional):") ?? "";
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(apiUrl(`/api/tasks/self/${task._id}/approve`), { note }, { headers });
      setDrawerData(prev => prev.filter(t => t._id !== task._id));
      setPendingTasks(prev => prev.filter(t => t._id !== task._id));
      alert("Task approved successfully.");
    } catch (err) {
      console.error("Failed to approve task:", err);
      alert(err.response?.data?.message || "Failed to approve task");
    }
  };

  const handleRejectTask = async (task) => {
    const reason = window.prompt("Reason for rejection (required):");
    if (reason === null) return;
    if (!reason.trim()) {
      alert("Rejection reason is required.");
      return;
    }
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(apiUrl(`/api/tasks/self/${task._id}/reject`), { reason }, { headers });
      setDrawerData(prev => prev.filter(t => t._id !== task._id));
      setPendingTasks(prev => prev.filter(t => t._id !== task._id));
      alert("Task rejected.");
    } catch (err) {
      console.error("Failed to reject task:", err);
      alert(err.response?.data?.message || "Failed to reject task");
    }
  };

  const drawerTitle = () => {
    switch (activeDrawer) {
      case "subordinates": return "Total Subordinates";
      case "clockedIn": return "Clocked In Today";
      case "onLeave": return "On Leave Today";
      case "pendingApprovals": return "Pending Approvals";
      default: return "";
    }
  };

  const drawerSubtitle = () => {
    switch (activeDrawer) {
      case "subordinates": return "All registered employees and organization profiles";
      case "clockedIn": return "Staff who have punched in for the current shift";
      case "onLeave": return "Staff on approved leave applications today";
      case "pendingApprovals": return "Task approval requests waiting for your review";
      default: return "";
    }
  };

  const renderDrawerContent = () => {
    if (activeDrawer === "subordinates") {
      const depts = [...new Set(drawerData.map(p => p.department).filter(Boolean))];
      const desgs = [...new Set(drawerData.map(p => p.designation).filter(Boolean))];

      const filtered = drawerData.filter(p => {
        const name = String(p.name || "").toLowerCase();
        const empId = String(p.employeeId || p._id || "").toLowerCase();
        const desg = String(p.designation || "").toLowerCase();
        const matchesQuery = name.includes(searchQuery.toLowerCase()) || 
                             empId.includes(searchQuery.toLowerCase()) ||
                             desg.includes(searchQuery.toLowerCase());
        const matchesDept = deptFilter ? p.department === deptFilter : true;
        const matchesDesg = desgFilter ? p.designation === desgFilter : true;
        return matchesQuery && matchesDept && matchesDesg;
      });

      return (
        <div>
          <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-5)", flexWrap: "wrap" }}>
            <input 
              type="text" 
              placeholder="Search by name, ID, role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nc-input"
              style={{ flex: 1, minWidth: "150px", padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", color: "var(--color-text)" }}
            />
            <select 
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
              className="nc-select"
              style={{ minWidth: "120px", padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", color: "var(--color-text)" }}
            >
              <option value="">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select 
              value={desgFilter} 
              onChange={(e) => setDesgFilter(e.target.value)}
              className="nc-select"
              style={{ minWidth: "120px", padding: "6px 12px", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-bg-base)", color: "var(--color-text)" }}
            >
              <option value="">All Designations</option>
              {desgs.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
                No subordinates found.
              </div>
            ) : (
              filtered.map(p => (
                <div 
                  key={p._id}
                  onClick={() => !preview && (window.location.href = "/employee-profiles")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    padding: "var(--space-4)",
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    cursor: preview ? "default" : "pointer",
                    transition: "all 0.2s"
                  }}
                  className="coo-drawer-item"
                >
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "var(--font-bold)",
                    fontSize: "var(--text-lg)",
                    overflow: "hidden"
                  }}>
                    {p.profilePhoto ? <img src={p.profilePhoto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getInitials(p.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{p.name}</span>
                      <span style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>ID: {p.employeeId || p._id?.substring(0, 8)}</span>
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "2px" }}>
                      {p.designation} • {p.department}
                    </div>
                    {p.reportsTo && (
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                        Manager: {p.reportsTo?.name || p.reportsTo}
                      </div>
                    )}
                  </div>
                  <span className={`badge badge-${p.employeeStatus?.toLowerCase() === "active" ? "success" : "warning"}`} style={{ fontSize: "10px" }}>
                    {p.employeeStatus || "Active"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeDrawer === "clockedIn") {
      const clockedIn = drawerData.filter(e => e.punchIn);
      return (
        <div>
          <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>
            Total Clocked In: {clockedIn.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {clockedIn.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
                No employees clocked in today.
              </div>
            ) : (
              clockedIn.map(e => (
                <div 
                  key={e.userId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-4)",
                    padding: "var(--space-4)",
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)"
                  }}
                >
                  <div style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--color-accent)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "var(--font-bold)"
                  }}>
                    {getInitials(e.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{e.name}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{e.department}</div>
                    <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "4px", fontSize: "10px", color: "var(--color-text-muted)" }}>
                      <span>In: {e.punchIn ? new Date(e.punchIn).toLocaleTimeString() : "--"}</span>
                      <span>Hours: {calculateWorkingHours(e)}</span>
                    </div>
                  </div>
                  <span className={`badge badge-${e.status === "overtime" ? "success" : "accent"}`} style={{ fontSize: "10px" }}>
                    {e.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (activeDrawer === "onLeave") {
      const onLeave = drawerData.filter(e => e.status === "on_leave" || e.leaveDates);
      return (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {onLeave.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-12)", border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-muted)" }}>
                No employees currently on leave today.
              </div>
            ) : (
              onLeave.map(e => {
                const leaveDays = e.leaveDates ? Math.max(1, Math.round((new Date(e.leaveDates.to) - new Date(e.leaveDates.from)) / (1000 * 60 * 60 * 24)) + 1) : 0;
                return (
                  <div 
                    key={e.userId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-4)",
                      padding: "var(--space-4)",
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-lg)"
                    }}
                  >
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "var(--color-warning)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "var(--font-bold)"
                    }}>
                      {getInitials(e.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>{e.name}</div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{e.department}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px", fontSize: "10px", color: "var(--color-text-muted)" }}>
                        <span>Leave Type: <strong>{e.leaveType || "Casual Leave"}</strong></span>
                        <span>Period: {e.leaveDates ? `${new Date(e.leaveDates.from).toLocaleDateString()} - ${new Date(e.leaveDates.to).toLocaleDateString()}` : "--"}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className="badge badge-warning" style={{ fontSize: "10px" }}>Approved</span>
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "4px" }}>{leaveDays} Days</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      );
    }

    if (activeDrawer === "pendingApprovals") {
      return (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {drawerData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-12)", border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-muted)" }}>
                No pending approvals at this time.
              </div>
            ) : (
              drawerData.map(task => (
                <div 
                  key={task._id}
                  style={{
                    padding: "var(--space-4)",
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-2)" }}>
                    <h3 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", margin: 0 }}>{task.title}</h3>
                    <span className={`badge badge-${task.priority === "high" || task.priority === "urgent" ? "danger" : task.priority === "medium" ? "warning" : "success"}`} style={{ fontSize: "10px" }}>
                      {task.priority || "Normal"}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "0 0 var(--space-3) 0" }}>
                    {task.description || "No description provided."}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
                    <span>Requested By: <strong>{task.createdBy?.name || "Employee"}</strong> ({task.createdBy?.role})</span>
                    <span>Assigned To: <strong>{task.assignedTo?.name || "Staff"}</strong></span>
                    <span>Due Date: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "--"}</span>
                  </div>

                  <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                    <button 
                      onClick={() => !preview && (window.location.href = "/tasks")} 
                      className="nc-btn nc-btn-outline nc-btn-xs"
                      disabled={preview}
                      style={{ fontSize: "11px", padding: "4px 8px", cursor: preview ? "default" : "pointer" }}
                    >
                      View Detail
                    </button>
                    {!preview && !readOnly && (
                      <>
                        <button 
                          onClick={() => handleApproveTask(task)} 
                          className="nc-btn nc-btn-xs"
                          style={{ background: "var(--color-success)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "11px", padding: "4px 8px", cursor: "pointer" }}
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectTask(task)} 
                          className="nc-btn nc-btn-xs"
                          style={{ background: "var(--color-error)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: "11px", padding: "4px 8px", cursor: "pointer" }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const userName = localStorage.getItem("userName") || "COO";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(apiUrl("/api/auth/users"), {
          headers: { Authorization: `Bearer ${token}` },
          timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
        });
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, [token]);

  const fetchPendingTasks = async () => {
    setLoadingPendingTasks(true);
    try {
      const res = await axios.get(apiUrl("/api/tasks/self/pending-approvals"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setPendingTasks(res.data?.tasks || []);
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
    } finally {
      setLoadingPendingTasks(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingTasks();
    }
  }, [token]);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(apiUrl("/api/attendance/admin/today-snapshot"), {
          headers: { Authorization: `Bearer ${token}` },
          timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
        });
        setAttendanceSnapshot(res.data.data);
      } catch (err) {
        console.error("Error fetching attendance snapshot:", err);
      }
    };
    fetchAttendance();
    const interval = setInterval(fetchAttendance, DASHBOARD_REFRESH_MS);
    return () => clearInterval(interval);
  }, [token]);

  const liveAttendanceChartData = useMemo(() => {
    if (!attendanceSnapshot) return [];
    
    const totalEmployees = Math.max(0, Number(users.length) || 0);
    const present = Math.max(0, Number(attendanceSnapshot.presentCount) || 0);
    const late = Math.max(0, Number(attendanceSnapshot.lateCount) || 0);
    const onLeave = Math.max(0, Number(attendanceSnapshot.onLeaveCount) || 0);

    const presentOnTime = Math.max(0, present - late);
    const absent = Math.max(
      0,
      totalEmployees - presentOnTime - late - onLeave
    );

    return [
      { label: "Present On Time", count: presentOnTime },
      { label: "Late", count: late },
      { label: "On Leave", count: onLeave },
      { label: "Absent", count: absent },
    ];
  }, [attendanceSnapshot, users]);

  const visibleChartData = useMemo(() => {
    return liveAttendanceChartData.filter(d => d.count > 0);
  }, [liveAttendanceChartData]);

  const hasAttendanceData = useMemo(() => {
    return liveAttendanceChartData.some(d => d.count > 0);
  }, [liveAttendanceChartData]);

  const roleDistributionData = useMemo(() => {
    const employees = attendanceSnapshot?.employees || [];
    const groupedRoles = employees.reduce((acc, employee) => {
      const roleLabel = formatRoleLabel(employee.role || "general");
      acc[roleLabel] = (acc[roleLabel] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedRoles).map(([name, value]) => ({ name, value }));
  }, [attendanceSnapshot]);

  const registeredRoleData = useMemo(() => {
    const grouped = users.reduce((acc, user) => {
      const label = formatRoleLabel(user.role || "general");
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [users]);

  useEffect(() => {
    if (selectedRole && previewRef.current) {
      previewRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedRole]);

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
  };

  const renderDashboardPreview = () => {
    switch (selectedRole) {
      case "management":
        return <ManagementDashboard />;
      case "hr":
        return <HRDashboard />;
      case "sales":
        return <SalesDashboard />;
      case "support":
        return <SupportDashboard />;
      case "it":
        return <TechDashboard />;
      case "digital_media":
        return <DigitalMediaDashboard />;
      default:
        return null;
    }
  };

  return (
    <div className={preview ? "" : "dashboard-container"} style={{ padding: preview ? "0" : "var(--space-6)" }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div className="page-header-left">
          <h1 className="title">Chief Operating Officer Dashboard</h1>
          <p className="subtitle">Welcome back, {userName}. Here is your operations overview.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
               <div 
          onClick={() => handleCardClick("subordinates")} 
          className="nc-stat-card coo-kpi-card"
        >
          <span className="metric-label">Total Subordinates</span>
          <span className="metric-value">{users.length}</span>
          <div className="circle-badge circle-badge--accent">
            <Users />
          </div>
        </div>

        <div 
          onClick={() => handleCardClick("clockedIn")} 
          className="nc-stat-card coo-kpi-card"
        >
          <span className="metric-label">Clocked In Today</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>
            {attendanceSnapshot ? attendanceSnapshot.clockedInCount : "--"}
          </span>
          <div className="circle-badge circle-badge--success">
            <UserCheck />
          </div>
        </div>

        <div 
          onClick={() => handleCardClick("onLeave")} 
          className="nc-stat-card coo-kpi-card"
        >
          <span className="metric-label">On Leave Today</span>
          <span className="metric-value" style={{ color: "var(--color-warning)" }}>
            {attendanceSnapshot ? attendanceSnapshot.onLeaveCount : "--"}
          </span>
          <div className="circle-badge circle-badge--info">
            <CalendarClock />
          </div>
        </div>

        <div 
          onClick={() => handleCardClick("pendingApprovals")} 
          className="nc-stat-card coo-kpi-card"
        >
          <span className="metric-label">Pending Task Approvals</span>
          <span className="metric-value" style={{ color: "var(--color-accent)" }}>
            {pendingTasks.length}
          </span>
          <div className="circle-badge circle-badge--warning">
            <Clock3 />
          </div>
        </div>

      </div>

      <style>{`
        .coo-kpi-card {
          cursor: pointer;
          transition: all 0.2s ease-in-out !important;
        }
        .coo-kpi-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1), 0 0 8px rgba(99, 102, 241, 0.2) !important;
          border-color: var(--color-accent) !important;
        }
        .coo-drawer-item:hover {
          background: var(--color-bg-hover) !important;
          border-color: var(--color-accent) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>

      {/* Right Side Drawer */}
      {activeDrawer && (
        <div style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "flex-end",
          animation: "fadeIn 0.2s ease-out"
        }} onClick={() => setActiveDrawer("")}>
          <div style={{
            width: "100%",
            maxWidth: "600px",
            background: "var(--color-bg-elevated)",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            animation: "slideIn 0.3s ease-out",
            borderLeft: "1px solid var(--color-border)"
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{
              padding: "var(--space-5) var(--space-6)",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <h2 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", margin: 0 }}>
                  {drawerTitle()}
                </h2>
                {drawerSubtitle() && (
                  <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: "4px 0 0 0" }}>
                    {drawerSubtitle()}
                  </p>
                )}
              </div>
              <button 
                type="button" 
                style={{ padding: "var(--space-2)", border: "none", background: "none", cursor: "pointer", color: "var(--color-text)" }}
                onClick={() => setActiveDrawer("")}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-6)" }}>
              {drawerLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  <div style={{ height: "40px", background: "var(--color-bg-hover)", borderRadius: "var(--radius-md)", animation: "pulse 1.5s infinite" }} />
                  <div style={{ height: "120px", background: "var(--color-bg-hover)", borderRadius: "var(--radius-md)", animation: "pulse 1.5s infinite" }} />
                  <div style={{ height: "120px", background: "var(--color-bg-hover)", borderRadius: "var(--radius-md)", animation: "pulse 1.5s infinite" }} />
                </div>
              ) : drawerError ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
                  <p style={{ color: "var(--color-error)", marginBottom: "var(--space-4)" }}>{drawerError}</p>
                  <button className="nc-btn nc-btn-outline" onClick={handleRetryDrawer}>
                    Retry
                  </button>
                </div>
              ) : (
                renderDrawerContent()
              )}
            </div>

          </div>
        </div>
      )}

      {/* Workspace Widget */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <WorkspaceWidget />
      </div>

      {/* Action Center & Tasks */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        {/* Action Center List */}
        <div className="nc-card">
          <h2 className="section-title" style={{ marginBottom: "var(--space-4)" }}>Action Center & Alerts</h2>
          {loadingPendingTasks ? (
            <p className="loading-state">Loading pending actions...</p>
          ) : pendingTasks.length === 0 ? (
            <div className="empty-state" style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)" }}>
              <p>All clear! No pending task approvals.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", maxHeight: "300px", overflowY: "auto" }}>
              {pendingTasks.map((task) => (
                <div key={task._id} className="pending-action-item" style={{ padding: "var(--space-3)", background: "var(--color-bg-elevated)", borderRadius: "var(--border-radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: "600" }}>{task.title}</h4>
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      Submitted by: {task.createdBy?.name || "Employee"} ({task.createdBy?.department || "General"})
                    </p>
                  </div>
                  <button onClick={() => !preview && (window.location.href = "/tasks")} className="nc-btn nc-btn-xs" disabled={preview} style={{ background: "var(--color-accent)", color: "#fff", border: "none", borderRadius: "var(--border-radius-sm)", padding: "var(--space-2) var(--space-3)", cursor: preview ? "default" : "pointer", fontSize: "var(--text-xs)" }}>
                    View & Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Attendance Snapshot */}
        <div className="nc-card">
          <h2 className="section-title" style={{ marginBottom: "var(--space-4)" }}>Today's Workforce Pulse</h2>
          {attendanceSnapshot ? (
            hasAttendanceData ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", alignItems: "center" }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={visibleChartData} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                      {visibleChartData.map((entry, idx) => {
                        const colorIdx = liveAttendanceChartData.findIndex(d => d.label === entry.label);
                        return <Cell key={`cell-${idx}`} fill={PIE_COLORS[colorIdx % PIE_COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(value, name) => {
                      const totalEmployees = Math.max(0, Number(users.length) || 0);
                      const percentage = totalEmployees > 0 ? ((value / totalEmployees) * 100).toFixed(1) : 0;
                      return [`${value} employee(s) (${percentage}%)`, name];
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {liveAttendanceChartData.map((d, idx) => (
                    <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-xs)" }}>
                      <span style={{ width: "10px", height: "10px", display: "inline-block", background: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: "50%" }}></span>
                      <span>
                        {d.label}: <strong>{d.count}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                No workforce attendance data available today
              </div>
            )
          ) : (
            <p className="loading-state">Loading attendance data...</p>
          )}
        </div>
      </div>

      {/* Role Distribution Bar Chart */}
      <div className="nc-card" style={{ marginBottom: "var(--space-8)" }}>
        <h2 className="section-title" style={{ marginBottom: "var(--space-4)" }}>Workforce Role Distribution</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={registeredRoleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} stroke="var(--color-text-muted)" />
            <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="var(--color-text-muted)" />
            <Tooltip cursor={{ fill: "var(--color-bg-hover)" }} />
            <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Department Preview Selector */}
      {!preview && (
        <div className="nc-card" style={{ marginBottom: "var(--space-6)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            <div>
              <h2 className="section-title">Department Dashboard Previews</h2>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", margin: 0 }}>
                Select a department below to view its specific portal, KPIs, and operational dashboards.
              </p>
            </div>
            <div>
              <select value={selectedRole} onChange={handleRoleChange} className="nc-select" style={{ minWidth: "220px", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--border-radius-md)", border: "1px solid var(--color-border)", background: "var(--color-bg-card)", color: "var(--color-text)" }}>
                <option value="">-- Select Dashboard --</option>
                <option value="management">Management Hub</option>
                <option value="sales">Sales & Deals Portal</option>
                <option value="hr">HR & People Operations</option>
                <option value="support">Customer Support Portal</option>
                <option value="it">IT & Tech Ops</option>
                <option value="digital_media">Digital Media & Marketing</option>
              </select>
            </div>
          </div>
  
          {selectedRole ? (
            <div ref={previewRef} style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--space-6)", marginTop: "var(--space-6)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
                <span className="badge badge-accent" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "10px" }}>
                  Preview Mode: {selectedRole}
                </span>
                <button onClick={() => setSelectedRole("")} className="nc-btn nc-btn-outline nc-btn-xs">
                  Close Preview
                </button>
              </div>
              {renderDashboardPreview()}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "var(--space-8)", textAlign: "center", border: "2px dashed var(--color-border)", borderRadius: "var(--border-radius-lg)", color: "var(--color-text-muted)" }}>
              <p>Select a department dashboard from the dropdown above to view its live preview.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default COODashboard;
