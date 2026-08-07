import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Users, UserCheck, CalendarClock, Activity, Headphones } from "lucide-react";
import axios from "axios";
// No longer needed: import "./AdminDashboard.css"; // Reuse existing styles

import AdminDashboard from "./AdminDashboard";
import SalesDashboard from "./SalesDashboard";
import SupportDashboard from "./SupportDashboard";
import HRDashboard from "./HRDashboard";
import TechDashboard from "./TechDashboard";
import DigitalMediaDashboard from "./DigitalMediaDashboard";
import { apiUrl } from "../../config/api";
import { isExternalClientSupportUser, isInternalUser } from "../../config/access";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import ManagementDashboard from "./ManagementDashboard";
import WorkspaceWidget from "./WorkspaceWidget";
import ManagerDashboard from "../../features/ManagerPortal/ManagerDashboard";
import COODashboard from "./COODashboard";

const DASHBOARD_REFRESH_MS = 60000;
const DASHBOARD_REQUEST_TIMEOUT_MS = 10000;
const initialReminderForm = { title: "", meetingLink: "", meetingDate: "", meetingTime: "" };

const formatRoleLabel = (role = "general") =>
  role === "admin"
    ? "Administrator"
    : role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

const SuperUserDashboard = () => {
  const previewRef = useRef(null);
  const participantDropdownRef = useRef(null);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [attendanceSnapshot, setAttendanceSnapshot] = useState(null);
  const [error, setError] = useState("");
  const [meetingReminders, setMeetingReminders] = useState([]);
  const [reminderForm, setReminderForm] = useState(initialReminderForm);
  const [reminderStatus, setReminderStatus] = useState("");
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderPage, setReminderPage] = useState(1);
  const [reminderTotalPages, setReminderTotalPages] = useState(1);
  const [loadingReminders, setLoadingReminders] = useState(false);
  const [remindersError, setRemindersError] = useState("");
  const [editingReminder, setEditingReminder] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", meetingLink: "", meetingDate: "", meetingTime: "" });
  const [updatingReminder, setUpdatingReminder] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [participantSearch, setParticipantSearch] = useState("");
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [includeMyself, setIncludeMyself] = useState(false);
  const [viewingParticipantsList, setViewingParticipantsList] = useState([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const userName = localStorage.getItem("userName") || "Super User";
  const token = localStorage.getItem("token");

  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null); // 'employees', 'present', 'leave', 'client_support' or null
  const [modalSearch, setModalSearch] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [clients, setClients] = useState([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [errorUsers, setErrorUsers] = useState(null);
  const [errorAttendance, setErrorAttendance] = useState(null);
  const [errorProfiles, setErrorProfiles] = useState(null);

  const internalEmployees = useMemo(() => {
    return users.filter(u => isInternalUser(u));
  }, [users]);

  const activeEmployeeOptions = useMemo(() => {
    const currentUserId = localStorage.getItem("userId");
    return users.filter(u => {
      if (u.isDisabled) return false;
      if (u.role === "super_user" || u._id === currentUserId) return false;
      if (selectedParticipants.some(p => p._id === u._id)) return false;
      return true;
    });
  }, [users, selectedParticipants]);

  const filteredEmployees = useMemo(() => {
    const query = participantSearch.toLowerCase().trim();
    if (!query) return activeEmployeeOptions;

    return activeEmployeeOptions.filter(u => {
      const contact = profiles.find(p => p.linkedUser?._id === u._id);
      const empId = (contact?.employeeId || u.userId || "").toLowerCase();
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const dept = (u.department || "").toLowerCase();
      const des = (u.designation || "").toLowerCase();

      return (
        name.includes(query) ||
        empId.includes(query) ||
        email.includes(query) ||
        dept.includes(query) ||
        des.includes(query)
      );
    });
  }, [activeEmployeeOptions, participantSearch, profiles]);


  const clientSupportUsers = useMemo(() => {
    return users.filter(u => isExternalClientSupportUser(u));
  }, [users]);

  const presentEmployees = useMemo(() => {
    if (!attendanceSnapshot?.employees) return [];
    return attendanceSnapshot.employees.filter(e =>
      ['present', 'overtime', 'half_day'].includes(e.status)
    );
  }, [attendanceSnapshot]);

  const leaveEmployees = useMemo(() => {
    if (!attendanceSnapshot?.employees) return [];
    return attendanceSnapshot.employees.filter(e => e.status === 'on_leave');
  }, [attendanceSnapshot]);

  const handleOpenModal = (type) => {
    setModalSearch("");
    setActiveModal(type);
  };

  const getModalTitle = () => {
    switch (activeModal) {
      case "employees":
        return `All Internal Employees (${internalEmployees.length})`;
      case "present":
        return `Present Today (${presentEmployees.length})`;
      case "leave":
        return `Employees On Leave (${leaveEmployees.length})`;
      case "client_support":
        return `Client Support Users (${clientSupportUsers.length})`;
      default:
        return "";
    }
  };

  const activeList = useMemo(() => {
    if (!activeModal) return [];
    let list = [];
    if (activeModal === 'employees') {
      list = internalEmployees;
    } else if (activeModal === 'present') {
      list = presentEmployees;
    } else if (activeModal === 'leave') {
      list = leaveEmployees;
    } else if (activeModal === 'client_support') {
      list = clientSupportUsers;
    }

    if (!modalSearch.trim()) return list;
    const query = modalSearch.toLowerCase().trim();
    return list.filter(record => {
      const targetUserId = activeModal === 'employees' || activeModal === 'client_support' ? record._id : record.userId;
      const userProfile = profiles.find(p => p.linkedUser?._id === targetUserId);
      const userRecord = activeModal === 'employees' || activeModal === 'client_support' ? record : users.find(u => u._id === record.userId);
      const employeeId = userProfile?.employeeId || userRecord?.userId || '';
      const designation = userProfile?.designation || userRecord?.designation || '';

      return (
        record.name?.toLowerCase().includes(query) ||
        record.email?.toLowerCase().includes(query) ||
        record.role?.toLowerCase().includes(query) ||
        record.department?.toLowerCase().includes(query) ||
        employeeId.toLowerCase().includes(query) ||
        designation.toLowerCase().includes(query)
      );
    });
  }, [activeModal, internalEmployees, presentEmployees, leaveEmployees, clientSupportUsers, modalSearch, profiles, users]);

  const isLoading =
    (activeModal === 'employees' || activeModal === 'client_support')
      ? (loadingUsers || loadingProfiles)
      : (activeModal === 'present' || activeModal === 'leave')
        ? (loadingAttendance || loadingProfiles)
        : false;

  const hasError =
    (activeModal === 'employees' || activeModal === 'client_support')
      ? (errorUsers || errorProfiles)
      : (activeModal === 'present' || activeModal === 'leave')
        ? (errorAttendance || errorProfiles)
        : null;

  const isEmpty = !isLoading && !hasError && activeList.length === 0;

  const handleRetry = () => {
    if (activeModal === 'employees' || activeModal === 'client_support') {
      fetchUsers();
      fetchProfiles();
    } else if (activeModal === 'present' || activeModal === 'leave') {
      fetchAttendance();
      fetchProfiles();
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const res = await axios.get(apiUrl("/api/auth/users"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setErrorUsers(err.response?.data?.message || err.message || "Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    setErrorAttendance(null);
    try {
      const res = await axios.get(apiUrl("/api/attendance/admin/today-snapshot"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setAttendanceSnapshot(res.data.data);
    } catch (err) {
      console.error("Error fetching attendance snapshot:", err);
      setErrorAttendance(err.response?.data?.message || err.message || "Failed to load attendance");
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchProfiles = async () => {
    setLoadingProfiles(true);
    setErrorProfiles(null);
    try {
      const res = await axios.get(apiUrl("/api/contacts/profiles"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setProfiles(res.data);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      setErrorProfiles(err.response?.data?.message || err.message || "Failed to load profile details");
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await axios.get(apiUrl("/api/clients"), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      if (res.data && res.data.data) {
        setClients(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchAttendance();
      fetchProfiles();
      fetchClients();
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      const interval = setInterval(fetchAttendance, DASHBOARD_REFRESH_MS);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveModal(null);
      }
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModal]);

  useEffect(() => {
    if (!showParticipantDropdown) return;

    const handleOutsideClick = (event) => {
      if (
        participantDropdownRef.current &&
        !participantDropdownRef.current.contains(event.target)
      ) {
        setShowParticipantDropdown(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowParticipantDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showParticipantDropdown]);

  const fetchMeetingReminders = async (page = 1) => {
    setLoadingReminders(true);
    setRemindersError("");
    try {
      const res = await axios.get(apiUrl(`/api/meeting-reminders?status=scheduled&scope=upcoming&page=${page}&limit=5`), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      setMeetingReminders(res.data?.reminders || []);
      setReminderPage(res.data?.pagination?.page || 1);
      setReminderTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Error fetching meeting reminders:", err);
      setRemindersError("Failed to fetch meeting reminders.");
    } finally {
      setLoadingReminders(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMeetingReminders();
    }
  }, [token]);



  const upcomingMeetingReminders = useMemo(() => {
    return meetingReminders;
  }, [meetingReminders]);

  useEffect(() => {
    if (selectedRole && previewRef.current) {
      previewRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [selectedRole, selectedUser]);

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setSelectedRole(role);
    setSelectedUser(null);
  };

  const handleSearch = () => {
    const searchValue = search.toLowerCase().trim();
    if (!searchValue) return;

    const foundUser = users.find(
      (user) =>
        user.name?.toLowerCase().includes(searchValue) ||
        user.email?.toLowerCase().includes(searchValue) ||
        user.role?.toLowerCase().includes(searchValue)
    );

    if (foundUser) {
      setSelectedUser(foundUser);
      setSelectedRole(foundUser.role);
      setError("");
    } else {
      setError("User not found");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleReminderSubmit = async (e) => {
    e.preventDefault();
    setSavingReminder(true);
    setReminderStatus("");

    try {
      const meetingAt = new Date(`${reminderForm.meetingDate}T${reminderForm.meetingTime}`);
      const currentUserId = localStorage.getItem("userId");
      const participantIds = selectedParticipants.map(p => p._id);
      if (includeMyself && currentUserId && !participantIds.includes(currentUserId)) {
        participantIds.push(currentUserId);
      }

      const res = await axios.post(
        apiUrl("/api/meeting-reminders"),
        {
          title: reminderForm.title,
          meetingLink: reminderForm.meetingLink,
          meetingDateTime: meetingAt.toISOString(),
          participants: participantIds,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
        }
      );
      setReminderForm(initialReminderForm);
      setSelectedParticipants([]);
      setIncludeMyself(false);
      setReminderStatus(res.data?.warning ? `Reminder set. Warning: ${res.data.warning}` : "Reminder set successfully.");
      fetchMeetingReminders(reminderPage);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to set reminder.";
      setReminderStatus(message);
    } finally {
      setSavingReminder(false);
    }
  };

  const handleEditClick = (reminder) => {
    const dt = new Date(reminder.meetingDateTime || reminder.meetingAt);
    const date = dt.toISOString().split("T")[0];
    const time = dt.toTimeString().split(" ")[0].substring(0, 5);

    const currentParticipants = (reminder.participants || []).map((p) => {
      const pId = typeof p === "object" ? p._id : p;
      return users.find((u) => u._id === pId);
    }).filter(Boolean);

    const currentUserId = localStorage.getItem("userId");
    const hasSelf = currentParticipants.some(p => p._id === currentUserId);

    setSelectedParticipants(currentParticipants.filter(p => p._id !== currentUserId));
    setIncludeMyself(hasSelf);

    setEditForm({
      title: reminder.title,
      meetingLink: reminder.meetingLink || "",
      meetingDate: date,
      meetingTime: time,
    });
    setEditingReminder(reminder);
    setEditStatus("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdatingReminder(true);
    setEditStatus("");

    try {
      const meetingDateTime = new Date(`${editForm.meetingDate}T${editForm.meetingTime}`);
      const currentUserId = localStorage.getItem("userId");
      const participantIds = selectedParticipants.map(p => p._id);
      if (includeMyself && currentUserId && !participantIds.includes(currentUserId)) {
        participantIds.push(currentUserId);
      }

      await axios.patch(
        apiUrl(`/api/meeting-reminders/${editingReminder._id}`),
        {
          title: editForm.title,
          meetingLink: editForm.meetingLink,
          meetingDateTime: meetingDateTime.toISOString(),
          participants: participantIds,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
        }
      );
      setEditingReminder(null);
      fetchMeetingReminders(reminderPage);
    } catch (err) {
      setEditStatus(err.response?.data?.message || "Failed to update reminder.");
    } finally {
      setUpdatingReminder(false);
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm("Are you sure you want to cancel this meeting reminder?")) return;
    try {
      await axios.delete(apiUrl(`/api/meeting-reminders/${reminderId}`), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: DASHBOARD_REQUEST_TIMEOUT_MS,
      });
      fetchMeetingReminders(reminderPage);
    } catch (err) {
      setReminderStatus(err.response?.data?.message || "Failed to delete reminder.");
    }
  };

  const handleParticipantSelect = (employee) => {
    setSelectedParticipants((current) => {
      if (current.some((item) => item._id === employee._id)) {
        return current;
      }
      return [...current, employee];
    });
    setParticipantSearch("");
    setShowParticipantDropdown(false);
  };

  const toggleParticipant = (u) => {
    setSelectedParticipants((current) => {
      if (current.some(p => p._id === u._id)) {
        return current.filter(p => p._id !== u._id);
      } else {
        return [...current, u];
      }
    });
  };

  const renderDropdownList = () => {
    if (!showParticipantDropdown) return null;
    return (
      <div style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 2210,
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        background: 'var(--color-bg-surface-strong, #1f1f1f)',
        boxShadow: 'var(--shadow-lg)',
        marginTop: '2px',
      }}>
        {filteredEmployees.length === 0 ? (
          <div style={{ padding: 'var(--space-3)', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
            No employees found
          </div>
        ) : (
          filteredEmployees.map((u) => {
            const contact = profiles.find(p => p.linkedUser?._id === u._id);
            const empId = contact?.employeeId || u.userId || "N/A";
            const dept = u.department || "General";
            const des = u.designation || "N/A";

            return (
              <div
                key={u._id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleParticipantSelect(u);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--color-bg-hover, #2c2c2c)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-bg-alt, #3f3f3f)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 'bold', fontSize: '10px', overflow: 'hidden' }}>
                  {contact?.profilePhoto ? (
                    <img src={`${apiUrl(contact.profilePhoto)}?token=${token}`} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                  ) : null}
                  <span>{getInitials(u.name)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                  <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>{u.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{empId} • {dept} • {des}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderChipsList = () => {
    if (selectedParticipants.length === 0) return null;
    return (
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        {selectedParticipants.map((p) => (
          <div
            key={p._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '2px var(--space-2)',
              background: 'var(--color-bg-alt, #3f3f3f)',
              borderRadius: '999px',
              border: '1px solid var(--color-border)',
              fontSize: '10px',
              color: 'var(--color-text-primary)',
            }}
          >
            <span>{p.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleParticipant(p);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-danger, #ef4444)',
                cursor: 'pointer',
                fontSize: '12px',
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedParticipants([]);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            cursor: 'pointer',
            fontSize: '10px',
            textDecoration: 'underline',
          }}
        >
          Clear all
        </button>
      </div>
    );
  };
  const renderSelectedDashboard = () => {
    const role = selectedUser ? selectedUser.role : selectedRole;
    switch (role) {
      case "admin": return <AdminDashboard />;
      case "sales": return <SalesDashboard preview={!selectedUser} />;
      case "support": return <SupportDashboard preview={!selectedUser} />;
      case "hr": return <HRDashboard preview={!selectedUser} />;
      case "it": return <TechDashboard preview={!selectedUser} />;
      case "digital_media": return <DigitalMediaDashboard preview={!selectedUser} />;
      case "management": return <ManagementDashboard preview={!selectedUser} />;
      case "manager": return <ManagerDashboard preview={!selectedUser} />;
      case "coo": return <COODashboard preview={!selectedUser} readOnly={true} embedded={true} />;
      default: return null;
    }
  };
  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">System Overview</h1>
          <p className="subtitle">Welcome back, {userName}. Monitoring {users.length} registered users.</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div className="form-field">
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '200px' }}
              />
              <button onClick={handleSearch} className="btn btn-primary">
                Search
              </button>
            </div>
          </div>
          <select className="form-select" value={selectedRole} onChange={handleRoleChange} style={{ width: '180px' }}>
            <option value="">Filter by Role</option>
            <option value="admin">Administrator</option>
            <option value="sales">Sales</option>
            <option value="support">Support</option>
            <option value="hr">HR</option>
            <option value="it">IT</option>
            <option value="digital_media">Digital Media</option>
            <option value="management">Management</option>
            <option value="manager">Manager</option>
            <option value="coo">COO</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="badge badge-error" style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-2) var(--space-4)', width: '100%' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div
          className="nc-stat-card clickable-card"
          role="button"
          tabIndex={0}
          onClick={() => handleOpenModal('employees')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenModal('employees');
            }
          }}
          style={{
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none',
          }}
        >
          <span className="metric-label">Total Employees</span>
          <span className="metric-value">{internalEmployees.length}</span>
          <div className="circle-badge circle-badge--accent">
            <Users />
          </div>
        </div>
        <div
          className="nc-stat-card clickable-card"
          role="button"
          tabIndex={0}
          onClick={() => handleOpenModal('present')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenModal('present');
            }
          }}
          style={{
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none',
          }}
        >
          <span className="metric-label">Present Today</span>
          <span className="metric-value">{attendanceSnapshot?.presentCount || 0}</span>
          <div className="circle-badge circle-badge--success">
            <UserCheck />
          </div>
        </div>
        <div
          className="nc-stat-card clickable-card"
          role="button"
          tabIndex={0}
          onClick={() => handleOpenModal('leave')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenModal('leave');
            }
          }}
          style={{
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none',
          }}
        >
          <span className="metric-label">On Leave</span>
          <span className="metric-value">{attendanceSnapshot?.onLeaveCount || 0}</span>
          <div className="circle-badge circle-badge--info">
            <CalendarClock />
          </div>
        </div>
        <div
          className="nc-stat-card clickable-card"
          role="button"
          tabIndex={0}
          onClick={() => handleOpenModal('client_support')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleOpenModal('client_support');
            }
          }}
          style={{
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none',
          }}
        >
          <span className="metric-label">Client Support Users</span>
          <span className="metric-value">{clientSupportUsers.length}</span>
          <div className="circle-badge circle-badge--warning">
            <Headphones />
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-8)' }}>
        <WorkspaceWidget />
      </div>

      <div className="nc-card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 style={{ marginBottom: 'var(--space-1)', fontSize: 'var(--text-base)' }}>Set Meeting Reminder</h3>
            <p className="subtitle" style={{ margin: 0 }}>Bell notifications are sent 1 hour and 15 minutes before the meeting.</p>
          </div>
        </div>

        <form onSubmit={handleReminderSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
            <div className="form-field">
              <label className="form-label">Meeting Title</label>
              <input
                className="form-input"
                required
                value={reminderForm.title}
                onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                placeholder="Client sync"
              />
            </div>
            <div className="form-field">
              <label className="form-label">Meeting Link</label>
              <input
                className="form-input"
                type="url"
                value={reminderForm.meetingLink}
                onChange={(e) => setReminderForm({ ...reminderForm, meetingLink: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>
            <div className="form-field">
              <label className="form-label">Date</label>
              <input
                className="form-input"
                required
                type="date"
                value={reminderForm.meetingDate}
                onChange={(e) => setReminderForm({ ...reminderForm, meetingDate: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Time</label>
              <input
                className="form-input"
                required
                type="time"
                value={reminderForm.meetingTime}
                onChange={(e) => setReminderForm({ ...reminderForm, meetingTime: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div ref={participantDropdownRef} className="form-field" style={{ position: 'relative', flex: 1 }}>
              <label className="form-label">Meeting Participants</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, ID, or email..."
                value={participantSearch}
                onChange={(e) => {
                  setParticipantSearch(e.target.value);
                  setShowParticipantDropdown(true);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowParticipantDropdown(true);
                }}
                onFocus={() => setShowParticipantDropdown(true)}
              />
              {renderDropdownList()}
            </div>
            
            <button className="btn btn-primary" type="submit" disabled={savingReminder} style={{ alignSelf: 'flex-end', height: '42px' }}>
              {savingReminder ? "Saving..." : "Set Reminder"}
            </button>
          </div>

          {renderChipsList()}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input
              type="checkbox"
              id="includeMyself"
              checked={includeMyself}
              onChange={(e) => setIncludeMyself(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <label htmlFor="includeMyself" style={{ fontSize: 'var(--text-xs)', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              Include myself (organizer) as a participant
            </label>
          </div>
        </form>

        {reminderStatus && (
          <div className="badge badge-warning" style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)' }}>
            {reminderStatus}
          </div>
        )}

        <div style={{ marginTop: 'var(--space-5)' }}>
          <h4 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>Upcoming Reminders</h4>
          {upcomingMeetingReminders.length === 0 ? (
            <p className="subtitle" style={{ margin: 0 }}>No upcoming meeting reminders.</p>
          ) : (
            <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
              {upcomingMeetingReminders.map((reminder) => {
                const displayParticipants = reminder.participants || [];
                const participantCount = displayParticipants.length;
                const mTime = reminder.meetingDateTime || reminder.meetingAt;
                const dateStr = new Date(mTime).toLocaleDateString("en-IN", { dateStyle: "medium" });
                const timeStr = new Date(mTime).toLocaleTimeString("en-IN", { timeStyle: "short" });

                return (
                  <div
                    key={reminder._id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-4)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '16px',
                      background: 'var(--color-bg-surface, #262626)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{reminder.title}</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            background: reminder.status === 'cancelled' ? 'rgba(239, 68, 68, 0.15)' : (reminder.status === 'completed' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)'),
                            color: reminder.status === 'cancelled' ? '#ef4444' : (reminder.status === 'completed' ? '#22c55e' : '#3b82f6'),
                            fontWeight: 'var(--font-semibold)'
                          }}>
                            {reminder.status ? reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1) : 'Scheduled'}
                          </span>
                        </div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          Organized by {reminder.createdBy?.name || "Super User"}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          📅 {dateStr} at {timeStr}
                        </span>
                        {reminder.meetingLink && (
                          <a
                            href={reminder.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', textDecoration: 'underline', width: 'fit-content' }}
                          >
                            🔗 Join Meeting
                          </a>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        {reminder.status === "scheduled" && (
                          <>
                            <button className="btn btn-ghost btn-sm" type="button" onClick={() => handleEditClick(reminder)}>
                              Edit
                            </button>
                            <button className="btn btn-ghost btn-sm" type="button" onClick={() => handleDeleteReminder(reminder._id)} style={{ color: 'var(--color-danger, #ef4444)' }}>
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Participant Avatars & Count & View Option */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-1)', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginLeft: '4px' }}>
                        {displayParticipants.slice(0, 3).map((p, idx) => (
                          <div
                            key={p._id || idx}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: 'var(--color-bg-alt, #3f3f3f)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '9px',
                              fontWeight: 'bold',
                              border: '1px solid var(--color-border)',
                              marginLeft: idx > 0 ? '-8px' : '0',
                              position: 'relative',
                              zIndex: 3 - idx,
                              overflow: 'hidden',
                            }}
                            title={p.name}
                          >
                            {p.profilePhoto ? (
                              <img src={`${apiUrl(p.profilePhoto)}?token={token}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
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
                                fontSize: '9px',
                              }}
                            >
                              {getInitials(p.name)}
                            </div>
                          </div>
                        ))}
                        {participantCount > 3 && (
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginLeft: 'var(--space-1)' }}>
                            +{participantCount - 3} more
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                        ({participantCount} {participantCount === 1 ? "participant" : "participants"})
                      </span>
                      {participantCount > 0 && (
                        <button
                          className="btn btn-ghost"
                          type="button"
                          style={{ padding: '0 var(--space-2)', height: '24px', fontSize: '10px' }}
                          onClick={() => {
                            setViewingParticipantsList(displayParticipants);
                            setShowParticipantsModal(true);
                          }}
                        >
                          View Participants
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Pagination controls */}
              {reminderTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)', alignItems: 'center' }}>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={reminderPage <= 1}
                    onClick={() => fetchMeetingReminders(reminderPage - 1)}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Page {reminderPage} of {reminderTotalPages}
                  </span>
                  <button
                    className="btn btn-ghost"
                    type="button"
                    disabled={reminderPage >= reminderTotalPages}
                    onClick={() => fetchMeetingReminders(reminderPage + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>



      {selectedRole && (
        <div ref={previewRef} className="nc-card" style={{ marginTop: 'var(--space-6)', minHeight: '400px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-lg)' }}>Role Preview: {formatRoleLabel(selectedUser ? selectedUser.role : selectedRole)}</h3>
            <button className="btn btn-ghost" onClick={() => { setSelectedRole(""); setSelectedUser(null); }}>Close Preview</button>
          </div>
          {renderSelectedDashboard()}
        </div>
      )}

      <div className="nc-card" style={{ marginTop: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Team Attendance Live</h3>
        <AttendanceWidget />
      </div>

      <style>{`
        .clickable-card:hover {
          border-color: var(--color-accent) !important;
          box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.15) !important;
        }
        .clickable-card:focus-visible {
          border-color: var(--color-accent) !important;
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.3) !important;
        }
      `}</style>

      {activeModal && (
        <div
          className="nc-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2100,
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
              width: 'min(100%, 800px)',
              maxHeight: 'min(88vh, 720px)',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '28px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface-strong, #1f1f1f)',
              boxShadow: 'var(--shadow-2xl)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              className="nc-modal-header"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-5) var(--space-6)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>
                {getModalTitle()}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Specific Search Bar */}
            <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search in list..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Body */}
            <div
              className="nc-modal-body"
              style={{
                padding: 'var(--space-6)',
                overflowY: 'auto',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {/* Loading state */}
              {isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-8)' }}>
                  <div
                    className="animate-spin"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(255, 255, 255, 0.08)',
                      borderTopColor: 'var(--color-accent)',
                      borderRadius: '50%',
                      marginBottom: 'var(--space-4)',
                    }}
                  />
                  <p style={{ color: 'var(--color-text-muted)' }}>Loading records...</p>
                </div>
              )}

              {/* Error state */}
              {hasError && !isLoading && (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                  <p style={{ color: 'var(--color-danger, #ef4444)', marginBottom: 'var(--space-4)' }}>
                    {hasError}
                  </p>
                  <button className="btn btn-primary" onClick={handleRetry}>
                    Retry
                  </button>
                </div>
              )}

              {/* Empty state */}
              {isEmpty && (
                <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  {activeModal === 'employees'
                    ? "No internal employees found."
                    : activeModal === 'present'
                      ? "No employees are present today."
                      : activeModal === 'leave'
                        ? "No employees are on leave today."
                        : "No client support users found."}
                </div>
              )}

              {/* Records list */}
              {!isLoading && !hasError && !isEmpty && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {activeList.map((record) => {
                    const targetUserId = activeModal === 'employees' || activeModal === 'client_support' ? record._id : record.userId;
                    const userProfile = profiles.find((p) => p.linkedUser?._id === targetUserId);
                    const userRecord = activeModal === 'employees' || activeModal === 'client_support' ? record : users.find(u => u._id === record.userId);

                    if (activeModal === 'client_support') {
                      const fullName = record.name;
                      const email = record.email;
                      const portalStatus = !record.isDisabled ? 'Active' : 'Suspended';
                      const linkedClientName = clients.find(c => String(c._id) === String(record.clientId))?.clientName || 'Unknown Client';
                      return (
                        <div
                          key={record._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--space-4)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '16px',
                            background: 'var(--color-bg-surface, #262626)',
                            gap: 'var(--space-4)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0 }}>
                            {/* Avatar */}
                            <div
                              style={{
                                display: 'flex',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-bg-alt, #3f3f3f)',
                                color: 'var(--color-text-primary, #ffffff)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                flexShrink: 0
                              }}
                            >
                              {getInitials(fullName)}
                            </div>

                            {/* Support Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                              <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {fullName}
                              </span>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Email: {email}
                              </span>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Client: <strong>{linkedClientName}</strong> (ID: {record.clientId})
                              </span>
                              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: '2px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  background: portalStatus === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: portalStatus === 'Active' ? '#22c55e' : '#ef4444',
                                  fontWeight: 'var(--font-semibold)'
                                }}>
                                  {portalStatus}
                                </span>
                                {record.createdAt && (
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '999px',
                                    fontSize: '10px',
                                    background: 'var(--color-bg-alt, #3f3f3f)',
                                    color: 'var(--color-text-muted)'
                                  }}>
                                    Granted: {new Date(record.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setActiveModal(null);
                                navigate(`/clients/${record.clientId}`);
                              }}
                            >
                              View Client
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setActiveModal(null);
                                navigate(`/clients/${record.clientId}?tab=Support`);
                              }}
                            >
                              Manage Support Access
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Render Employee Card
                    const fullName = record.name;
                    const email = userRecord?.email || record.email || '';
                    const role = userRecord?.role || record.role || '';
                    const department = record.department || userRecord?.department || 'General';
                    const employeeId = userProfile?.employeeId || userRecord?.userId || 'N/A';
                    const designation = userProfile?.designation || userRecord?.designation || 'N/A';
                    const profilePhoto = userProfile?.profilePhoto || '';

                    const activeStatus = !(userRecord?.isDisabled) ? 'Active' : 'Inactive';
                    const checkInTime = activeModal === 'present' ? (record.punchIn ? new Date(record.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A') : null;
                    const attendanceStatus = activeModal === 'present' || activeModal === 'leave' ? record.status : null;

                    return (
                      <div
                        key={targetUserId}
                        onClick={() => {
                          setActiveModal(null);
                          navigate(`/employee-profiles?userId=${targetUserId}`);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 'var(--space-4)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '16px',
                          background: 'var(--color-bg-surface, #262626)',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s, background-color 0.2s',
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-accent)';
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', minWidth: 0 }}>
                          {/* Avatar */}
                          <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                            {profilePhoto ? (
                              <img
                                src={`${apiUrl(profilePhoto)}?token=${localStorage.getItem('token') || ''}`}
                                alt={fullName}
                                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              style={{
                                display: profilePhoto ? 'none' : 'flex',
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-bg-alt, #3f3f3f)',
                                color: 'var(--color-text-primary, #ffffff)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '16px',
                              }}
                            >
                              {getInitials(fullName)}
                            </div>
                          </div>

                          {/* User Info */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                            <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {fullName}
                            </span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                              ID: {employeeId} · {designation}
                            </span>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {email}
                            </span>
                            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginTop: '2px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                background: 'var(--color-bg-alt, #3f3f3f)',
                                color: 'var(--color-text-muted)'
                              }}>
                                {formatRoleLabel(role)}
                              </span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                background: 'var(--color-bg-alt, #3f3f3f)',
                                color: 'var(--color-text-muted)'
                              }}>
                                {department}
                              </span>
                              {/* Active Status Badge */}
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '10px',
                                background: activeStatus === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: activeStatus === 'Active' ? '#22c55e' : '#ef4444',
                                fontWeight: 'var(--font-semibold)'
                              }}>
                                {activeStatus}
                              </span>
                              {/* Punch in time for Present Today */}
                              {checkInTime && (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: '#3b82f6',
                                  fontWeight: 'var(--font-semibold)'
                                }}>
                                  In: {checkInTime}
                                </span>
                              )}
                              {/* Attendance Status Badge */}
                              {attendanceStatus && (
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '999px',
                                  fontSize: '10px',
                                  background: attendanceStatus === 'present' ? 'rgba(34, 197, 94, 0.15)' : (attendanceStatus === 'on_leave' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)'),
                                  color: attendanceStatus === 'present' ? '#22c55e' : (attendanceStatus === 'on_leave' ? '#3b82f6' : '#eab308'),
                                  fontWeight: 'var(--font-semibold)'
                                }}>
                                  {attendanceStatus === 'on_leave' ? 'On Leave' : attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn btn-ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveModal(null);
                            navigate(`/employee-profiles?userId=${targetUserId}`);
                          }}
                          style={{
                            padding: 'var(--space-2) var(--space-4)',
                            fontSize: 'var(--text-xs)',
                            height: '32px',
                            flexShrink: 0,
                          }}
                        >
                          View Profile
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- Edit Modal overlay ----------------- */}
      {editingReminder && (
        <div
          className="nc-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingReminder(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2200,
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
              borderRadius: '24px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface-strong, #1f1f1f)',
              boxShadow: 'var(--shadow-2xl)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-base)' }}>Edit Meeting Reminder</h3>
              <button className="btn btn-ghost" type="button" onClick={() => setEditingReminder(null)}>Close</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-field">
                <label className="form-label">Meeting Title</label>
                <input
                  className="form-input"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Meeting Link</label>
                <input
                  className="form-input"
                  type="url"
                  value={editForm.meetingLink}
                  onChange={(e) => setEditForm({ ...editForm, meetingLink: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="form-field">
                  <label className="form-label">Date</label>
                  <input
                    className="form-input"
                    required
                    type="date"
                    value={editForm.meetingDate}
                    onChange={(e) => setEditForm({ ...editForm, meetingDate: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Time</label>
                  <input
                    className="form-input"
                    required
                    type="time"
                    value={editForm.meetingTime}
                    onChange={(e) => setEditForm({ ...editForm, meetingTime: e.target.value })}
                  />
                </div>
              </div>

              {/* Participants Selector */}
              <div ref={participantDropdownRef} className="form-field" style={{ position: 'relative' }}>
                <label className="form-label">Meeting Participants</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name, ID, or email..."
                  value={participantSearch}
                  onChange={(e) => {
                    setParticipantSearch(e.target.value);
                    setShowParticipantDropdown(true);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowParticipantDropdown(true);
                  }}
                  onFocus={() => setShowParticipantDropdown(true)}
                />
                {renderDropdownList()}
              </div>

              {renderChipsList()}

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <input
                  type="checkbox"
                  id="editIncludeMyself"
                  checked={includeMyself}
                  onChange={(e) => setIncludeMyself(e.target.checked)}
                />
                <label htmlFor="editIncludeMyself" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  Include myself (organizer) as a participant
                </label>
              </div>

              {editStatus && (
                <div className="badge badge-warning" style={{ padding: 'var(--space-2) var(--space-3)' }}>
                  {editStatus}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
                <button className="btn btn-ghost" type="button" onClick={() => setEditingReminder(null)} disabled={updatingReminder}>
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={updatingReminder}>
                  {updatingReminder ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- Participants Modal ----------------- */}
      {showParticipantsModal && (
        <div
          className="nc-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowParticipantsModal(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2250,
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
              width: 'min(100%, 600px)',
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
              <button className="btn btn-ghost" type="button" onClick={() => setShowParticipantsModal(false)}>Close</button>
            </div>
            <div style={{ padding: 'var(--space-4) var(--space-5)', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {viewingParticipantsList.map((p) => (
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
};

export default SuperUserDashboard;


