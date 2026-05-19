import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  ListOrdered,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { apiUrl } from "../../config/api";
import { getNotificationSocket } from "../../services/socket";
import CreateSelfTaskModal from "./CreateSelfTaskModal";
import PendingApprovalsView from "./PendingApprovalsView";
import SelfTaskCard from "./SelfTaskCard";

const EMPTY_FORM = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  dueDate: "",
  estimatedHours: "",
};

const STATUS_OPTIONS = ["pending", "in_progress", "queued", "active", "completed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];
const HOURS_PER_DAY = 8;

const prettify = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "No date";

const toDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const priorityBadge = (priority) => {
  if (priority === "high" || priority === "urgent") return "error";
  if (priority === "medium") return "warning";
  return "info";
};

const statusBadge = (status) => {
  if (status === "completed" || status === "reviewed") return "success";
  if (status === "active" || status === "in_progress") return "info";
  if (status === "queued") return "ghost";
  if (status === "pending") return "warning";
  return "warning";
};

const queueLabel = (task) => {
  if (task.status === "active" || task.queuePosition === 1) return "Active";
  if (task.status === "queued" && task.queuePosition > 1) return `#${task.queuePosition} in queue`;
  if (task.status === "queued") return "Queued";
  return "None";
};

function nextWorkingDay(date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while ([0, 6].includes(next.getDay())) next.setDate(next.getDate() + 1);
  return next;
}

function addWorkingDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (![0, 6].includes(result.getDay())) added += 1;
  }
  return result;
}

function previewScheduledDate(nextAvailableDate, estimatedHours, dueDate) {
  if (!nextAvailableDate) return new Date();
  const base = new Date(nextAvailableDate);
  const hours = Number(estimatedHours) || HOURS_PER_DAY;
  if (dueDate) {
    const due = new Date(dueDate);
    const naturalEnd = addWorkingDays(base, Math.ceil(hours / HOURS_PER_DAY));
    if (due > naturalEnd) return nextWorkingDay(due);
  }
  if (hours <= HOURS_PER_DAY) return nextWorkingDay(base);
  return addWorkingDays(base, Math.ceil(hours / HOURS_PER_DAY));
}

function getInitialTab() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  if (tab === "self") return "self";
  if (tab === "pending-approvals") return "pending-approvals";
  return "assigned";
}

export default function Tasks() {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("userRole") || "").trim().toLowerCase();
  const currentUserId = localStorage.getItem("userId");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [tasks, setTasks] = useState([]);
  const [selfTasks, setSelfTasks] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [myQueue, setMyQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selfLoading, setSelfLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTasks: 0, limit: 10 });
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", assignedTo: "" });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showSelfModal, setShowSelfModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingSelfTask, setEditingSelfTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [assigneeNextDate, setAssigneeNextDate] = useState(null);
  const [assigneeQueueLoading, setAssigneeQueueLoading] = useState(false);

  const scheduledPreview = useMemo(() => {
    if (!form.assignedTo || editingTask) return null;
    return previewScheduledDate(assigneeNextDate, form.estimatedHours, form.dueDate);
  }, [assigneeNextDate, editingTask, form.assignedTo, form.dueDate, form.estimatedHours]);

  const canCreateSelfTask = role !== "super_user";
  const canViewPendingApprovals = pendingApprovals.length > 0 || assignableUsers.length > 0 || role === "super_user";

  const canDeleteTask = useCallback(
    (task) =>
      role === "super_user" ||
      role === "admin" ||
      String(task.assignedBy?._id || task.assignedBy) === String(currentUserId),
    [currentUserId, role]
  );

  const fetchAssignableUsers = useCallback(async () => {
    try {
      const { data } = await axios.get(apiUrl("/api/tasks/assignable-users"), { headers });
      setAssignableUsers(data.data || []);
    } catch {
      setAssignableUsers([]);
    }
  }, [headers]);

  const fetchTasks = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const { data } = await axios.get(apiUrl("/api/tasks"), {
          headers,
          params: { page, limit: pagination.limit, ...filters },
        });
        setTasks(data.data || []);
        setPagination((prev) => ({ ...prev, ...(data.pagination || {}), currentPage: page }));
        setError("");
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Failed to fetch tasks");
      } finally {
        setLoading(false);
      }
    },
    [filters, headers, pagination.limit]
  );

  const fetchSelfTasks = useCallback(async () => {
    try {
      setSelfLoading(true);
      const { data } = await axios.get(apiUrl("/api/tasks/self/mine"), { headers });
      setSelfTasks(data.tasks || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to fetch self tasks");
    } finally {
      setSelfLoading(false);
    }
  }, [headers]);

  const fetchPendingApprovals = useCallback(async () => {
    try {
      setApprovalLoading(true);
      const { data } = await axios.get(apiUrl("/api/tasks/self/pending-approvals"), { headers });
      setPendingApprovals(data.tasks || []);
    } catch {
      setPendingApprovals([]);
    } finally {
      setApprovalLoading(false);
    }
  }, [headers]);

  const fetchMyQueue = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const { data } = await axios.get(apiUrl(`/api/tasks/queue/${currentUserId}`), { headers });
      setMyQueue(data.data || []);
    } catch {
      setMyQueue([]);
    }
  }, [currentUserId, headers]);

  const fetchAssigneeQueue = useCallback(
    async (userId) => {
      if (!userId) {
        setAssigneeNextDate(null);
        return;
      }
      try {
        setAssigneeQueueLoading(true);
        const { data } = await axios.get(apiUrl(`/api/tasks/queue/${userId}`), { headers });
        setAssigneeNextDate(data.nextAvailableDate || null);
      } catch {
        setAssigneeNextDate(null);
      } finally {
        setAssigneeQueueLoading(false);
      }
    },
    [headers]
  );

  const refreshSelfTaskData = useCallback(
    async () => Promise.all([fetchSelfTasks(), fetchPendingApprovals(), fetchTasks(pagination.currentPage), fetchMyQueue()]),
    [fetchMyQueue, fetchPendingApprovals, fetchSelfTasks, fetchTasks, pagination.currentPage]
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchAssignableUsers();
    fetchSelfTasks();
    fetchPendingApprovals();
    fetchMyQueue();
  }, [fetchAssignableUsers, fetchMyQueue, fetchPendingApprovals, fetchSelfTasks]);

  useEffect(() => {
    if (showTaskModal && !editingTask && form.assignedTo) {
      fetchAssigneeQueue(form.assignedTo);
    } else {
      setAssigneeNextDate(null);
    }
  }, [editingTask, fetchAssigneeQueue, form.assignedTo, showTaskModal]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = getNotificationSocket(token);
    if (!socket) return undefined;

    const handleNotification = (payload) => {
      if (
        ["self_task_approval_requested", "self_task_approved", "self_task_rejected"].includes(payload?.type)
      ) {
        fetchSelfTasks();
        fetchPendingApprovals();
      }
    };

    socket.on("notification:new", handleNotification);
    return () => socket.off("notification:new", handleNotification);
  }, [fetchPendingApprovals, fetchSelfTasks, token]);

  const openCreateTask = () => {
    setEditingTask(null);
    setForm({ ...EMPTY_FORM, assignedTo: assignableUsers[0]?._id || "" });
    setShowTaskModal(true);
  };

  const saveTask = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (editingTask) {
        await axios.put(apiUrl(`/api/tasks/${editingTask._id}`), form, { headers });
        setSuccess("Task updated successfully");
      } else {
        await axios.post(apiUrl("/api/tasks"), form, { headers });
        setSuccess("Task created successfully");
      }
      await Promise.all([fetchTasks(pagination.currentPage), fetchMyQueue()]);
      setShowTaskModal(false);
      setForm(EMPTY_FORM);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const saveSelfTask = async (payload) => {
    setSaving(true);
    try {
      if (editingSelfTask) {
        await axios.put(apiUrl(`/api/tasks/${editingSelfTask._id}`), payload, { headers });
        setSuccess("Self task revised");
      } else {
        await axios.post(apiUrl("/api/tasks/self"), payload, { headers });
        setSuccess("Self task created");
      }
      setShowSelfModal(false);
      setEditingSelfTask(null);
      setActiveTab("self");
      await refreshSelfTaskData();
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save self task");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (task, status) => {
    try {
      await axios.patch(apiUrl(`/api/tasks/${task._id}`), { status }, { headers });
      await Promise.all([fetchTasks(pagination.currentPage), fetchMyQueue(), fetchSelfTasks()]);
      setSuccess("Task status updated");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update task status");
    }
  };

  const submitSelfTaskForApproval = async (task) => {
    if (!window.confirm("Are you sure the task is complete and ready for manager approval?")) return;
    try {
      if (task.status !== "completed") {
        await axios.patch(apiUrl(`/api/tasks/${task._id}`), { status: "completed" }, { headers });
      }
      await axios.post(apiUrl(`/api/tasks/self/${task._id}/submit`), {}, { headers });
      setSuccess("Self task submitted for approval");
      setError("");
      await refreshSelfTaskData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to submit self task");
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(apiUrl(`/api/tasks/${task._id}`), { headers });
      await Promise.all([fetchTasks(pagination.currentPage), fetchMyQueue(), fetchSelfTasks()]);
      setSuccess("Task deleted successfully");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete task");
    }
  };

  const approveSelfTask = async (task, note) => {
    try {
      await axios.post(apiUrl(`/api/tasks/self/${task._id}/approve`), { note }, { headers });
      setPendingApprovals((items) => items.filter((item) => item._id !== task._id));
      setSuccess("Task approved");
      setError("");
      await fetchSelfTasks();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to approve task");
      throw requestError;
    }
  };

  const rejectSelfTask = async (task, reason) => {
    try {
      await axios.post(apiUrl(`/api/tasks/self/${task._id}/reject`), { reason }, { headers });
      setPendingApprovals((items) => items.filter((item) => item._id !== task._id));
      setSuccess("Task rejected and employee notified.");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to reject task");
      throw requestError;
    }
  };

  const activeTasks = tasks.filter((task) => !["completed", "reviewed"].includes(task.status)).length;
  const completedAssignedTasks = tasks.filter((task) => ["completed", "reviewed"].includes(task.status)).length;
  const approvedSelfTasks = selfTasks.filter((task) => task.selfTaskStatus === "approved").length;

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Tasks Management</h1>
          <p className="subtitle">Assign work through the reporting hierarchy and track progress.</p>
        </div>
        <div className="page-header-right" style={{ display: "flex", gap: "var(--space-2)" }}>
          {canCreateSelfTask ? (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditingSelfTask(null);
                setShowSelfModal(true);
              }}
            >
              <Plus size={16} /> Log Self Task
            </button>
          ) : null}
          <button className="btn btn-primary" onClick={openCreateTask} disabled={!assignableUsers.length}>
            <Plus size={16} /> Create Task
          </button>
        </div>
      </div>

      {error ? (
        <div className="badge badge-error" style={{ marginBottom: "var(--space-4)", padding: "var(--space-2) var(--space-4)", width: "100%" }}>
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="badge badge-success" style={{ marginBottom: "var(--space-4)", padding: "var(--space-2) var(--space-4)", width: "100%" }}>
          {success}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="nc-stat-card">
          <span className="metric-label">Visible Tasks</span>
          <span className="metric-value">{pagination.totalTasks || tasks.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Active Tasks</span>
          <span className="metric-value" style={{ color: "var(--color-warning)" }}>{activeTasks}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Completed</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>{completedAssignedTasks + approvedSelfTasks}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Pending Approvals</span>
          <span className="metric-value" style={{ color: "var(--color-primary)" }}>{pendingApprovals.length}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)", flexWrap: "wrap" }}>
        <button className={`btn ${activeTab === "assigned" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("assigned")}>
          Assigned Tasks
        </button>
        <button className={`btn ${activeTab === "self" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("self")}>
          My Self Tasks
        </button>
        {canViewPendingApprovals ? (
          <button className={`btn ${activeTab === "pending-approvals" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("pending-approvals")}>
            Pending Approvals
            {pendingApprovals.length ? <span className="badge badge-warning" style={{ marginLeft: 6 }}>{pendingApprovals.length}</span> : null}
          </button>
        ) : null}
      </div>

      {activeTab === "assigned" ? (
        <>
          {(myQueue.length > 0) ? (
            <div className="nc-card" style={{ marginBottom: "var(--space-6)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)" }}>
                <ListOrdered size={16} style={{ color: "var(--color-primary)" }} />
                <span style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>My Queue</span>
                <span className="badge badge-primary" style={{ marginLeft: "auto", fontSize: "var(--text-xs)" }}>{myQueue.length} task{myQueue.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ padding: "var(--space-3)" }}>
                {myQueue.map((task, index) => (
                  <div key={task._id} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ minWidth: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-border)", fontSize: "var(--text-xs)", fontWeight: "var(--font-bold)" }}>{index + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "var(--font-semibold)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.title}</div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{formatDate(task.scheduledDate)} - {task.estimatedHours ? `${task.estimatedHours}h` : "No estimate"}</div>
                    </div>
                    <span className={`badge badge-${statusBadge(task.status)}`}>{task.status === "active" ? "Active" : prettify(task.status)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) repeat(3, minmax(150px, 180px)) auto", gap: "var(--space-4)", alignItems: "end" }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Search Tasks</label>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Task title..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
                </div>
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select className="form-select" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
                </select>
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Priority</label>
                <select className="form-select" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
                  <option value="">All Priority</option>
                  {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
                </select>
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="form-label">Assigned User</label>
                <select className="form-select" value={filters.assignedTo} onChange={(event) => setFilters({ ...filters, assignedTo: event.target.value })}>
                  <option value="">All Users</option>
                  {assignableUsers.map((user) => <option key={user._id} value={user._id}>{user.name || user.email}</option>)}
                </select>
              </div>
              <button className="btn btn-ghost" onClick={() => setFilters({ search: "", status: "", priority: "", assignedTo: "" })}>Reset</button>
            </div>
          </div>

          <div className="nc-card">
            <table className="nc-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Assigned To</th>
                  <th>Assigned By</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Queue</th>
                  <th>Scheduled</th>
                  <th>Est. Hours</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="10" style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading tasks...</td></tr>
                ) : tasks.length ? (
                  tasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <div style={{ fontWeight: "var(--font-semibold)" }}>{task.title}</div>
                        <div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{task.description || "No description"}</div>
                      </td>
                      <td>{task.assignedTo?.name || "Unassigned"}</td>
                      <td>{task.assignedBy?.name || "System"}</td>
                      <td><span className={`badge badge-${priorityBadge(task.priority)}`}>{prettify(task.priority)}</span></td>
                      <td><span className={`badge badge-${statusBadge(task.status)}`}>{prettify(task.status)}</span></td>
                      <td style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{queueLabel(task)}</td>
                      <td style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{formatDate(task.scheduledDate)}</td>
                      <td style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{task.estimatedHours ? `${task.estimatedHours}h` : "None"}</td>
                      <td>{formatDate(task.dueDate)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                          <button className="btn btn-ghost" onClick={() => setViewTask(task)} title="View task"><Eye size={14} /></button>
                          <button className="btn btn-ghost" onClick={() => updateStatus(task, task.status === "completed" ? "in_progress" : "completed")} title="Toggle complete"><CheckCircle2 size={14} /></button>
                          {String(task.assignedBy?._id || task.assignedBy) === String(currentUserId) ? (
                            <button
                              className="btn btn-ghost"
                              onClick={() => {
                                setEditingTask(task);
                                setForm({
                                  ...task,
                                  assignedTo: task.assignedTo?._id || task.assignedTo,
                                  dueDate: toDateTimeInput(task.dueDate),
                                  estimatedHours: task.estimatedHours || "",
                                });
                                setShowTaskModal(true);
                              }}
                              title="Edit task"
                            >
                              <Pencil size={14} />
                            </button>
                          ) : null}
                          {canDeleteTask(task) ? (
                            <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => deleteTask(task)} title="Delete task"><Trash2 size={14} /></button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="10" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No tasks found.</td></tr>
                )}
              </tbody>
            </table>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <button className="btn btn-ghost" disabled={pagination.currentPage === 1} onClick={() => fetchTasks(pagination.currentPage - 1)}><ChevronLeft size={16} /></button>
              <button className="btn btn-ghost" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => fetchTasks(pagination.currentPage + 1)}><ChevronRight size={16} /></button>
            </div>
          </div>
        </>
      ) : null}

      {activeTab === "self" ? (
        selfLoading ? (
          <div className="nc-card" style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>Loading self tasks...</div>
        ) : selfTasks.length ? (
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            {selfTasks.map((task) => (
              <SelfTaskCard
                key={task._id}
                task={task}
                onSubmitForApproval={submitSelfTaskForApproval}
                onEdit={(item) => {
                  setEditingSelfTask(item);
                  setShowSelfModal(true);
                }}
                onDelete={deleteTask}
              />
            ))}
          </div>
        ) : (
          <div className="nc-card" style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--color-text-muted)" }}>
            No self tasks yet.
          </div>
        )
      ) : null}

      {activeTab === "pending-approvals" ? (
        <PendingApprovalsView
          tasks={pendingApprovals}
          loading={approvalLoading}
          onApprove={approveSelfTask}
          onReject={rejectSelfTask}
        />
      ) : null}

      {showSelfModal ? (
        <CreateSelfTaskModal
          initialTask={editingSelfTask}
          priorityOptions={PRIORITY_OPTIONS}
          saving={saving}
          onClose={() => {
            setShowSelfModal(false);
            setEditingSelfTask(null);
          }}
          onSubmit={saveSelfTask}
        />
      ) : null}

      {showTaskModal ? (
        <div className="nc-modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: 560 }}>
            <div className="nc-modal-header"><h3>{editingTask ? "Edit Task" : "Create Task"}</h3></div>
            <form className="form" onSubmit={saveTask} style={{ padding: "var(--space-4)" }}>
              <div className="form-field">
                <label className="form-label">Task Title</label>
                <input className="form-input" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description || ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Assign To</label>
                <select className="form-select" required value={form.assignedTo} onChange={(event) => setForm({ ...form, assignedTo: event.target.value })} disabled={Boolean(editingTask)}>
                  <option value="">Select subordinate</option>
                  {assignableUsers.map((user) => <option key={user._id} value={user._id}>{user.name || user.email} - {prettify(user.role)}</option>)}
                </select>
                {!editingTask && form.assignedTo ? (
                  <div style={{ marginTop: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                    <Clock size={11} />
                    {assigneeQueueLoading ? "Checking availability..." : assigneeNextDate ? `Next available: ${formatDate(assigneeNextDate)}` : "Available now"}
                  </div>
                ) : null}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                    {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Estimated Hours</label>
                  <input className="form-input" type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={(event) => setForm({ ...form, estimatedHours: event.target.value })} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Due Date</label>
                <input className="form-input" required type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
              </div>
              {!editingTask && form.assignedTo && scheduledPreview ? (
                <div className={`badge badge-${assigneeNextDate ? "warning" : "success"}`} style={{ display: "block", padding: "var(--space-3) var(--space-4)", width: "100%", marginBottom: "var(--space-3)", whiteSpace: "normal" }}>
                  {assigneeNextDate ? `This task will be queued and scheduled for ${formatDate(scheduledPreview)}.` : `This task will be scheduled for ${formatDate(scheduledPreview)} and become active immediately.`}
                </div>
              ) : null}
              {!assignableUsers.length && !editingTask ? (
                <div className="badge badge-warning" style={{ padding: "var(--space-2) var(--space-4)", width: "100%" }}>No subordinate users are available in your hierarchy.</div>
              ) : null}
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving || (!editingTask && !assignableUsers.length)}>{saving ? "Saving..." : "Save Task"}</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowTaskModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {viewTask ? (
        <div className="nc-modal-overlay" onClick={() => setViewTask(null)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: 540 }}>
            <div className="nc-modal-header"><h3>Task Details</h3></div>
            <div style={{ padding: "var(--space-4)" }}>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label className="form-label">Title</label>
                <div style={{ color: "var(--color-text-primary)", fontWeight: "var(--font-bold)" }}>{viewTask.title}</div>
              </div>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label className="form-label">Description</label>
                <div style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", whiteSpace: "pre-wrap" }}>{viewTask.description || "No description provided."}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div><label className="form-label">Assigned To</label><div style={{ fontSize: "var(--text-sm)" }}>{viewTask.assignedTo?.name || "Unassigned"}</div></div>
                <div><label className="form-label">Assigned By</label><div style={{ fontSize: "var(--text-sm)" }}>{viewTask.assignedBy?.name || "System"}</div></div>
                <div><label className="form-label">Priority</label><span className={`badge badge-${priorityBadge(viewTask.priority)}`}>{prettify(viewTask.priority)}</span></div>
                <div><label className="form-label">Status</label><span className={`badge badge-${statusBadge(viewTask.status)}`}>{prettify(viewTask.status)}</span></div>
                <div><label className="form-label">Queue Position</label><div style={{ fontSize: "var(--text-sm)" }}>{queueLabel(viewTask)}</div></div>
                <div><label className="form-label">Est. Hours</label><div style={{ fontSize: "var(--text-sm)" }}>{viewTask.estimatedHours ? `${viewTask.estimatedHours}h` : "None"}</div></div>
                <div><label className="form-label">Scheduled Date</label><div style={{ fontSize: "var(--text-sm)" }}>{formatDate(viewTask.scheduledDate)}</div></div>
                <div><label className="form-label">Due Date</label><div style={{ fontSize: "var(--text-sm)" }}>{formatDate(viewTask.dueDate)}</div></div>
              </div>
            </div>
            <div className="nc-modal-footer"><button className="btn btn-ghost" onClick={() => setViewTask(null)} style={{ width: "100%" }}>Close</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
