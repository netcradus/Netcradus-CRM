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

/* ───────────────────────────────────────────────
   Constants
─────────────────────────────────────────────── */
const EMPTY_FORM = {
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  dueDate: "",
  status: "pending",
  estimatedHours: "",
};

const STATUS_OPTIONS = ["pending", "in_progress", "queued", "active", "completed"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];
const HOURS_PER_DAY = 8;

/* ───────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────── */
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
    : "—";

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
  if (status === "active") return "info";      // blue — stands out as "in progress now"
  if (status === "in_progress") return "info";
  if (status === "queued") return "ghost";     // neutral grey — waiting
  if (status === "pending") return "warning";
  return "warning";
};

const queueLabel = (task) => {
  // Only show queue position for tasks managed by the queue system
  if (task.status === "active" || task.queuePosition === 1) return "Active";
  if (task.status === "queued" && task.queuePosition > 1) return `#${task.queuePosition} in queue`;
  if (task.status === "queued") return "Queued";
  return "—"; // pending / in_progress = legacy, no queue position
};

/* ───────────────────────────────────────────────
   Client-side scheduling preview (mirrors Rule 2/3)
   Used only for display in modal — not authoritative.
─────────────────────────────────────────────── */
function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function nextWorkingDay(date) {
  let next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (isWeekend(next)) next.setDate(next.getDate() + 1);
  return next;
}

function addWorkingDays(date, n) {
  let result = new Date(date);
  let added = 0;
  while (added < n) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) added++;
  }
  return result;
}

function previewScheduledDate(nextAvailableDate, estimatedHours, dueDate) {
  if (!nextAvailableDate) {
    // User is free — starts today
    return new Date();
  }
  const base = new Date(nextAvailableDate);
  const hours = Number(estimatedHours) || HOURS_PER_DAY;
  // Rule 3 — dueDate awareness
  if (dueDate) {
    const due = new Date(dueDate);
    const naturalEnd = addWorkingDays(base, Math.ceil(hours / HOURS_PER_DAY));
    if (due > naturalEnd) return nextWorkingDay(due);
  }
  // Rule 2
  if (hours <= 8) return nextWorkingDay(base);
  return addWorkingDays(base, Math.ceil(hours / HOURS_PER_DAY));
}

/* ───────────────────────────────────────────────
   Component
─────────────────────────────────────────────── */
export default function Tasks() {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("userRole") || "").trim().toLowerCase();
  const currentUserId = localStorage.getItem("userId");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  /* ── State ── */
  const [tasks, setTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalTasks: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    priority: "",
    assignedTo: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  /* ── My Queue state ── */
  const [myQueue, setMyQueue] = useState([]);
  const [myQueueLoading, setMyQueueLoading] = useState(false);

  /* ── Assignee queue state (modal) ── */
  const [assigneeNextDate, setAssigneeNextDate] = useState(null);
  const [assigneeQueueLoading, setAssigneeQueueLoading] = useState(false);

  /* ── Derived ── */
  const scheduledPreview = useMemo(() => {
    if (!form.assignedTo || editingTask) return null;
    return previewScheduledDate(assigneeNextDate, form.estimatedHours, form.dueDate);
  }, [form.assignedTo, form.estimatedHours, form.dueDate, assigneeNextDate, editingTask]);

  const willBeQueued = assigneeNextDate !== null && !editingTask;

  const canDeleteTask = useCallback(
    (task) =>
      role === "super_user" ||
      role === "admin" ||
      String(task.assignedBy?._id || task.assignedBy) === String(currentUserId),
    [currentUserId, role]
  );

  /* ── Data fetchers ── */
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

  const fetchMyQueue = useCallback(async () => {
    if (!currentUserId) return;
    try {
      setMyQueueLoading(true);
      const { data } = await axios.get(apiUrl(`/api/tasks/queue/${currentUserId}`), { headers });
      setMyQueue(data.data || []);
    } catch {
      setMyQueue([]);
    } finally {
      setMyQueueLoading(false);
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

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { fetchAssignableUsers(); }, [fetchAssignableUsers]);
  useEffect(() => { fetchMyQueue(); }, [fetchMyQueue]);

  /* ── Fetch assignee queue whenever assignedTo changes in modal ── */
  useEffect(() => {
    if (showModal && !editingTask && form.assignedTo) {
      fetchAssigneeQueue(form.assignedTo);
    } else {
      setAssigneeNextDate(null);
    }
  }, [showModal, editingTask, form.assignedTo, fetchAssigneeQueue]);

  /* ── Modal handlers ── */
  const handleOpenCreate = () => {
    setEditingTask(null);
    setForm({ ...EMPTY_FORM, assignedTo: assignableUsers[0]?._id || "" });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
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
      setShowModal(false);
      setForm(EMPTY_FORM);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (task, status) => {
    try {
      await axios.patch(apiUrl(`/api/tasks/${task._id}`), { status }, { headers });
      await Promise.all([fetchTasks(pagination.currentPage), fetchMyQueue()]);
      setSuccess("Task status updated");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update task status");
    }
  };

  const deleteTask = async (task) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(apiUrl(`/api/tasks/${task._id}`), { headers });
      await Promise.all([fetchTasks(pagination.currentPage), fetchMyQueue()]);
      setSuccess("Task deleted successfully");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete task");
    }
  };

  /* ── Derived counts ── */
  const activeTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "reviewed"
  ).length;

  /* ═══════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════ */
  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      {/* ── Page header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Tasks Management</h1>
          <p className="subtitle">
            Assign work through the reporting hierarchy and track progress.
          </p>
        </div>
        <div className="page-header-right">
          <button
            className="btn btn-primary"
            onClick={handleOpenCreate}
            disabled={!assignableUsers.length}
          >
            <Plus size={16} /> Create Task
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {error && (
        <div
          className="badge badge-error"
          style={{ marginBottom: "var(--space-4)", padding: "var(--space-2) var(--space-4)", width: "100%" }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="badge badge-success"
          style={{ marginBottom: "var(--space-4)", padding: "var(--space-2) var(--space-4)", width: "100%" }}
        >
          {success}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "var(--space-6)",
          marginBottom: "var(--space-8)",
        }}
      >
        <div className="nc-stat-card">
          <span className="metric-label">Visible Tasks</span>
          <span className="metric-value">{pagination.totalTasks || tasks.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Active Tasks</span>
          <span className="metric-value" style={{ color: "var(--color-warning)" }}>
            {activeTasks}
          </span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Completed</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>
            {tasks.filter((t) => t.status === "completed" || t.status === "reviewed").length}
          </span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">In My Queue</span>
          <span className="metric-value" style={{ color: "var(--color-primary)" }}>
            {myQueue.length}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          MY QUEUE SECTION
      ───────────────────────────────────────── */}
      {(myQueue.length > 0 || myQueueLoading) && (
        <div className="nc-card" style={{ marginBottom: "var(--space-6)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-4) var(--space-4) var(--space-2)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <ListOrdered size={16} style={{ color: "var(--color-primary)" }} />
            <span style={{ fontWeight: "var(--font-semibold)", fontSize: "var(--text-sm)" }}>
              My Queue
            </span>
            <span
              className="badge badge-primary"
              style={{ marginLeft: "auto", fontSize: "var(--text-xs)" }}
            >
              {myQueue.length} task{myQueue.length !== 1 ? "s" : ""}
            </span>
          </div>

          {myQueueLoading ? (
            <div
              style={{
                padding: "var(--space-6)",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
              }}
            >
              Loading queue…
            </div>
          ) : (
            <div style={{ padding: "var(--space-3)" }}>
              {myQueue.map((qt, idx) => {
                const isActive = qt.status === "active" || qt.queuePosition === 1;
                return (
                  <div
                    key={qt._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      padding: "var(--space-3) var(--space-4)",
                      marginBottom: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      borderLeft: isActive
                        ? "3px solid var(--color-primary)"
                        : "3px solid var(--color-border)",
                      background: isActive
                        ? "color-mix(in srgb, var(--color-primary) 6%, var(--color-surface))"
                        : "var(--color-surface-alt, var(--color-surface))",
                    }}
                  >
                    {/* Position badge */}
                    <span
                      style={{
                        minWidth: 28,
                        height: 28,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "var(--text-xs)",
                        fontWeight: "var(--font-bold)",
                        background: isActive
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                        color: isActive ? "#fff" : "var(--color-text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>

                    {/* Task info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: isActive ? "var(--font-semibold)" : "var(--font-normal)",
                          fontSize: "var(--text-sm)",
                          color: "var(--color-text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {qt.title}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "var(--space-4)",
                          marginTop: "var(--space-1)",
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {qt.scheduledDate && (
                          <span>📅 {formatDate(qt.scheduledDate)}</span>
                        )}
                        {qt.estimatedHours && (
                          <span>⏱ {qt.estimatedHours}h estimated</span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={`badge badge-${statusBadge(qt.status)}`}>
                      {isActive ? "Active" : prettify(qt.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div
        className="nc-card"
        style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(220px, 1fr) repeat(3, minmax(150px, 180px)) auto",
            gap: "var(--space-4)",
            alignItems: "end",
          }}
        >
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label">Search Tasks</label>
            <div style={{ position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                className="form-input"
                style={{ paddingLeft: 36 }}
                placeholder="Task title..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>{prettify(o)}</option>
              ))}
            </select>
          </div>

          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">All Priority</option>
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o} value={o}>{prettify(o)}</option>
              ))}
            </select>
          </div>

          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="form-label">Assigned User</label>
            <select
              className="form-select"
              value={filters.assignedTo}
              onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
            >
              <option value="">All Users</option>
              {assignableUsers.map((u) => (
                <option key={u._id} value={u._id}>{u.name || u.email}</option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-ghost"
            onClick={() => setFilters({ search: "", status: "", priority: "", assignedTo: "" })}
          >
            Reset
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          TASKS TABLE
      ───────────────────────────────────────── */}
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
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "var(--space-8)" }}>
                  Loading tasks…
                </td>
              </tr>
            ) : tasks.length ? (
              tasks.map((task) => (
                <tr key={task._id}>
                  <td>
                    <div style={{ fontWeight: "var(--font-semibold)" }}>{task.title}</div>
                    <div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                      {task.description || "No description"}
                    </div>
                  </td>
                  <td>{task.assignedTo?.name || "Unassigned"}</td>
                  <td>{task.assignedBy?.name || "System"}</td>
                  <td>
                    <span className={`badge badge-${priorityBadge(task.priority)}`}>
                      {prettify(task.priority)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${statusBadge(task.status)}`}>
                      {prettify(task.status)}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "var(--text-xs)",
                        color:
                          task.queuePosition === 1 || task.status === "active"
                            ? "var(--color-primary)"
                            : "var(--color-text-muted)",
                        fontWeight:
                          task.queuePosition === 1 || task.status === "active"
                            ? "var(--font-semibold)"
                            : "var(--font-normal)",
                      }}
                    >
                      {queueLabel(task)}
                    </span>
                  </td>
                  <td style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {formatDate(task.scheduledDate)}
                  </td>
                  <td style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {task.estimatedHours ? `${task.estimatedHours}h` : "—"}
                  </td>
                  <td>{formatDate(task.dueDate)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                      <button
                        className="btn btn-ghost"
                        onClick={() => setViewTask(task)}
                        title="View task"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-ghost"
                        onClick={() =>
                          updateStatus(
                            task,
                            task.status === "completed" ? "in_progress" : "completed"
                          )
                        }
                        title="Toggle complete"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      {String(task.assignedBy?._id || task.assignedBy) ===
                        String(currentUserId) && (
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
                            setShowModal(true);
                          }}
                          title="Edit task"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {canDeleteTask(task) && (
                        <button
                          className="btn btn-ghost"
                          style={{ color: "var(--color-error)" }}
                          onClick={() => deleteTask(task)}
                          title="Delete task"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="10"
                  style={{
                    textAlign: "center",
                    padding: "var(--space-10)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--space-2)",
            marginTop: "var(--space-4)",
          }}
        >
          <button
            className="btn btn-ghost"
            disabled={pagination.currentPage === 1}
            onClick={() => fetchTasks(pagination.currentPage - 1)}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="btn btn-ghost"
            disabled={pagination.currentPage >= pagination.totalPages}
            onClick={() => fetchTasks(pagination.currentPage + 1)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CREATE / EDIT MODAL
      ═══════════════════════════════════════════ */}
      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="nc-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 560 }}
          >
            <div className="nc-modal-header">
              <h3>{editingTask ? "Edit Task" : "Create Task"}</h3>
            </div>

            <form className="form" onSubmit={handleSubmit} style={{ padding: "var(--space-4)" }}>
              {/* Title */}
              <div className="form-field">
                <label className="form-label">Task Title</label>
                <input
                  className="form-input"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Assign To */}
              <div className="form-field">
                <label className="form-label">Assign To</label>
                <select
                  className="form-select"
                  required
                  value={form.assignedTo}
                  onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  disabled={Boolean(editingTask)}
                >
                  <option value="">Select subordinate</option>
                  {assignableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name || u.email} — {prettify(u.role)}
                    </option>
                  ))}
                </select>

                {/* Assignee availability */}
                {!editingTask && form.assignedTo && (
                  <div
                    style={{
                      marginTop: "var(--space-2)",
                      fontSize: "var(--text-xs)",
                      color: "var(--color-text-muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-1)",
                    }}
                  >
                    <Clock size={11} />
                    {assigneeQueueLoading ? (
                      "Checking availability…"
                    ) : assigneeNextDate ? (
                      <>Next available: <strong style={{ color: "var(--color-text-primary)" }}>&nbsp;{formatDate(assigneeNextDate)}</strong></>
                    ) : (
                      <span style={{ color: "var(--color-success)" }}>✓ Available now</span>
                    )}
                  </div>
                )}
              </div>

              {/* Priority + Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITY_OPTIONS.map((o) => (
                      <option key={o} value={o}>{prettify(o)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Estimated Hours</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0.5"
                    step="0.5"
                    placeholder="e.g. 4"
                    value={form.estimatedHours}
                    onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
                  />
                </div>
              </div>

              {/* Due Date */}
              <div className="form-field">
                <label className="form-label">Due Date</label>
                <input
                  className="form-input"
                  required
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>

              {/* ── Queue notice (create mode only) ── */}
              {!editingTask && form.assignedTo && (
                <>
                  {willBeQueued ? (
                    <div
                      className="badge badge-warning"
                      style={{
                        display: "block",
                        padding: "var(--space-3) var(--space-4)",
                        width: "100%",
                        marginBottom: "var(--space-3)",
                        fontSize: "var(--text-xs)",
                        lineHeight: 1.5,
                      }}
                    >
                      ⚠️ This user already has an active task. This task will be{" "}
                      <strong>queued</strong>
                      {scheduledPreview
                        ? ` and scheduled for ${formatDate(scheduledPreview)}.`
                        : "."}
                    </div>
                  ) : (
                    scheduledPreview && (
                      <div
                        className="badge badge-success"
                        style={{
                          display: "block",
                          padding: "var(--space-3) var(--space-4)",
                          width: "100%",
                          marginBottom: "var(--space-3)",
                          fontSize: "var(--text-xs)",
                        }}
                      >
                        ✓ This task will be scheduled for{" "}
                        <strong>{formatDate(scheduledPreview)}</strong> and become{" "}
                        <strong>active</strong> immediately.
                      </div>
                    )
                  )}
                </>
              )}

              {!assignableUsers.length && !editingTask && (
                <div
                  className="badge badge-warning"
                  style={{ padding: "var(--space-2) var(--space-4)", width: "100%" }}
                >
                  No subordinate users are available in your hierarchy.
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={saving || (!editingTask && !assignableUsers.length)}
                >
                  {saving ? "Saving…" : "Save Task"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          VIEW TASK MODAL
      ═══════════════════════════════════════════ */}
      {viewTask && (
        <div className="nc-modal-overlay" onClick={() => setViewTask(null)}>
          <div
            className="nc-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 540 }}
          >
            <div className="nc-modal-header">
              <h3>Task Details</h3>
            </div>
            <div style={{ padding: "var(--space-4)" }}>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label className="form-label">Title</label>
                <div style={{ color: "var(--color-text-primary)", fontWeight: "var(--font-bold)" }}>
                  {viewTask.title}
                </div>
              </div>
              <div style={{ marginBottom: "var(--space-4)" }}>
                <label className="form-label">Description</label>
                <div
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--text-sm)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {viewTask.description || "No description provided."}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div>
                  <label className="form-label">Assigned To</label>
                  <div style={{ fontSize: "var(--text-sm)" }}>
                    {viewTask.assignedTo?.name || "Unassigned"}
                  </div>
                </div>
                <div>
                  <label className="form-label">Assigned By</label>
                  <div style={{ fontSize: "var(--text-sm)" }}>
                    {viewTask.assignedBy?.name || "System"}
                  </div>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <span className={`badge badge-${priorityBadge(viewTask.priority)}`}>
                    {prettify(viewTask.priority)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <span className={`badge badge-${statusBadge(viewTask.status)}`}>
                    {prettify(viewTask.status)}
                  </span>
                </div>
                <div>
                  <label className="form-label">Queue Position</label>
                  <div style={{ fontSize: "var(--text-sm)" }}>{queueLabel(viewTask)}</div>
                </div>
                <div>
                  <label className="form-label">Est. Hours</label>
                  <div style={{ fontSize: "var(--text-sm)" }}>
                    {viewTask.estimatedHours ? `${viewTask.estimatedHours}h` : "—"}
                  </div>
                </div>
                <div>
                  <label className="form-label">Scheduled Date</label>
                  <div style={{ fontSize: "var(--text-sm)" }}>
                    {formatDate(viewTask.scheduledDate)}
                  </div>
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <div style={{ fontSize: "var(--text-sm)" }}>{formatDate(viewTask.dueDate)}</div>
                </div>
                {viewTask.actualStartDate && (
                  <div>
                    <label className="form-label">Actual Start</label>
                    <div style={{ fontSize: "var(--text-sm)" }}>
                      {formatDate(viewTask.actualStartDate)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="nc-modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setViewTask(null)}
                style={{ width: "100%" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
