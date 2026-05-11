import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const EMPTY_FORM = { title: "", description: "", assignedTo: "", priority: "medium", dueDate: "", status: "pending" };
const STATUS_OPTIONS = ["pending", "in_progress", "completed"];
const PRIORITY_OPTIONS = ["low", "medium", "high"];

const prettify = (value) =>
  String(value || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";

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
  if (status === "in_progress") return "info";
  return "warning";
};

export default function Tasks() {
  const token = localStorage.getItem("token");
  const role = (localStorage.getItem("userRole") || "").trim().toLowerCase();
  const currentUserId = localStorage.getItem("userId");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [tasks, setTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTasks: 0, limit: 10 });
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", assignedTo: "" });
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const canDeleteTask = useCallback(
    (task) => role === "super_user" || role === "admin" || String(task.assignedBy?._id || task.assignedBy) === String(currentUserId),
    [currentUserId, role]
  );

  const fetchAssignableUsers = useCallback(async () => {
    try {
      const { data } = await axios.get(apiUrl("/api/tasks/assignable-users"), { headers });
      setAssignableUsers(data.data || []);
    } catch (requestError) {
      setAssignableUsers([]);
    }
  }, [headers]);

  const fetchTasks = useCallback(async (page = 1) => {
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
  }, [filters, headers, pagination.limit]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchAssignableUsers();
  }, [fetchAssignableUsers]);

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
      await fetchTasks(pagination.currentPage);
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
      await fetchTasks(pagination.currentPage);
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
      await fetchTasks(pagination.currentPage);
      setSuccess("Task deleted successfully");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to delete task");
    }
  };

  const activeTasks = tasks.filter((task) => task.status !== "completed" && task.status !== "reviewed").length;

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Tasks Management</h1>
          <p className="subtitle">Assign work through the reporting hierarchy and track progress.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={handleOpenCreate} disabled={!assignableUsers.length}>
            <Plus size={16} /> Create Task
          </button>
        </div>
      </div>

      {error && <div className="badge badge-error" style={{ marginBottom: "var(--space-4)", padding: "var(--space-2) var(--space-4)", width: "100%" }}>{error}</div>}
      {success && <div className="badge badge-success" style={{ marginBottom: "var(--space-4)", padding: "var(--space-2) var(--space-4)", width: "100%" }}>{success}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
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
          <span className="metric-value" style={{ color: "var(--color-success)" }}>{tasks.filter((task) => task.status === "completed" || task.status === "reviewed").length}</span>
        </div>
      </div>

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
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading tasks...</td></tr>
            ) : tasks.length ? tasks.map((task) => (
              <tr key={task._id}>
                <td>
                  <div style={{ fontWeight: "var(--font-semibold)" }}>{task.title}</div>
                  <div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{task.description || "No description"}</div>
                </td>
                <td>{task.assignedTo?.name || "Unassigned"}</td>
                <td>{task.assignedBy?.name || "System"}</td>
                <td><span className={`badge badge-${priorityBadge(task.priority)}`}>{prettify(task.priority)}</span></td>
                <td><span className={`badge badge-${statusBadge(task.status)}`}>{prettify(task.status)}</span></td>
                <td>{formatDate(task.dueDate)}</td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                    <button className="btn btn-ghost" onClick={() => setViewTask(task)} title="View task"><Eye size={14} /></button>
                    <button className="btn btn-ghost" onClick={() => updateStatus(task, task.status === "completed" ? "in_progress" : "completed")} title="Update status"><CheckCircle2 size={14} /></button>
                    {String(task.assignedBy?._id || task.assignedBy) === String(currentUserId) && (
                      <button className="btn btn-ghost" onClick={() => { setEditingTask(task); setForm({ ...task, assignedTo: task.assignedTo?._id || task.assignedTo, dueDate: toDateTimeInput(task.dueDate) }); setShowModal(true); }} title="Edit task"><Pencil size={14} /></button>
                    )}
                    {canDeleteTask(task) && (
                      <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={() => deleteTask(task)} title="Delete task"><Trash2 size={14} /></button>
                    )}
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="7" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No tasks found.</td></tr>
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
          <button className="btn btn-ghost" disabled={pagination.currentPage === 1} onClick={() => fetchTasks(pagination.currentPage - 1)}><ChevronLeft size={16} /></button>
          <button className="btn btn-ghost" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => fetchTasks(pagination.currentPage + 1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: 520 }}>
            <div className="nc-modal-header"><h3>{editingTask ? "Edit Task" : "Create Task"}</h3></div>
            <form className="form" onSubmit={handleSubmit}>
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
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                    {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status || "pending"} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                    {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Due Date</label>
                <input className="form-input" required type="datetime-local" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
              </div>
              {!assignableUsers.length && !editingTask && (
                <div className="badge badge-warning" style={{ padding: "var(--space-2) var(--space-4)", width: "100%" }}>
                  No subordinate users are available in your hierarchy.
                </div>
              )}
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving || (!editingTask && !assignableUsers.length)}>{saving ? "Saving..." : "Save Task"}</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewTask && (
        <div className="nc-modal-overlay" onClick={() => setViewTask(null)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: 520 }}>
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
                <div><label className="form-label">Due Date</label><div style={{ fontSize: "var(--text-sm)" }}>{formatDate(viewTask.dueDate)}</div></div>
              </div>
            </div>
            <div className="nc-modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewTask(null)} style={{ width: "100%" }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
