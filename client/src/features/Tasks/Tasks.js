import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Filter,
  MessageSquareText,
  Plus,
} from "lucide-react";
import { FaEye, FaPencilAlt, FaTrashAlt } from "react-icons/fa";
import { apiUrl } from "../../config/api";
import "./Tasks.css";

const EMPTY_FORM = { title: "", description: "", assignedTo: "", priority: "medium", dueDate: "" };
const STATUS_OPTIONS = ["pending", "in_progress", "completed", "reviewed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

const authConfig = (token) => ({ headers: { Authorization: `Bearer ${token}` } });
const prettify = (value) => {
  if (value === "admin") return "Administrator";
  return String(value || "").split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
};
const formatDateOnly = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not set";
const getInitials = (name) => String(name || "U").split(" ").slice(0, 2).map((p) => p.charAt(0)).join("").toUpperCase();
const getCommentRoleTone = (role) => {
  if (role === "super_user" || role === "admin") return "admin";
  if (role === "hr") return "reviewer";
  return "assignee";
};
const isPastDate = (value) => value && new Date(value).getTime() < Date.now();
const toInputDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const minInputDateTime = () => {
  const nextMinute = new Date(Date.now() + 60000);
  return toInputDateTime(nextMinute);
};

function TaskFormModal({ form, setForm, users, saving, onClose, onSubmit, isEdit }) {
  return (
    <div className="tasks-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tasks-modal">
        <div className="tasks-modal-header">
          <div>
            <h3>{isEdit ? "Edit Task" : "Create Task"}</h3>
            <p>{isEdit ? "Update the selected task." : "Assign a new task to a team member."}</p>
          </div>
          <button type="button" className="tasks-close-btn" onClick={onClose}>x</button>
        </div>
        <div className="tasks-form-grid">
          <label><span>Title</span><input className="nc-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></label>
          {!isEdit && (
            <label>
              <span>Assign To</span>
              <select className="nc-select" value={form.assignedTo} onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}>
                <option value="">Select user</option>
                {users.map((user) => <option key={user._id} value={user._id}>{user.name} ({prettify(user.role)})</option>)}
              </select>
            </label>
          )}
          <label>
            <span>Priority</span>
            <select className="nc-select" value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
              {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{prettify(option)}</option>)}
            </select>
          </label>
          <label><span>Due Date</span><input className="nc-input" type="datetime-local" min={minInputDateTime()} value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} /></label>
          <label className="tasks-field-span"><span>Description</span><textarea className="nc-input tasks-textarea" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
        </div>
        <div className="tasks-modal-actions">
          <button type="button" className="nc-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="nc-btn nc-btn--primary" onClick={onSubmit} disabled={saving}>{saving ? "Saving..." : isEdit ? "Update Task" : "Create Task"}</button>
        </div>
      </div>
    </div>
  );
}

function TimingModal({ value, setValue, saving, onClose, onSubmit }) {
  return (
    <div className="tasks-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tasks-modal tasks-modal--compact">
        <div className="tasks-modal-header">
          <div><h3>Set Estimated Duration</h3><p>Examples: 2 hours, 1 day, 3 working days.</p></div>
          <button type="button" className="tasks-close-btn" onClick={onClose}>x</button>
        </div>
        <input className="nc-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="2 hours" />
        <div className="tasks-modal-actions">
          <button type="button" className="nc-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="nc-btn nc-btn--primary" onClick={onSubmit} disabled={saving}>{saving ? "Saving..." : "Save Timing"}</button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ task, comments, canReview, canComment, commentText, setCommentText, commentSaving, onClose, onPostComment, onReview }) {
  if (!task) return null;
  return (
    <div className="tasks-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tasks-modal tasks-modal--detail">
        <div className="tasks-modal-header">
          <div><h3>{task.title}</h3><p>{task.description || "No description added for this task."}</p></div>
          <button type="button" className="tasks-close-btn" onClick={onClose}>x</button>
        </div>
        <div className="tasks-detail-grid">
          <div className="tasks-detail-card">
            <h4>Task Info</h4>
            <div className="tasks-meta-list">
              <div><span>Assigned By</span><strong>{task.assignedBy?.name || "System"}</strong></div>
              <div><span>Assigned To</span><strong>{task.assignedTo?.name || "Unknown"}</strong></div>
              <div><span>Role</span><strong>{prettify(task.role)}</strong></div>
              <div><span>Priority</span><strong>{prettify(task.priority)}</strong></div>
              <div><span>Status</span><strong>{prettify(task.status)}</strong></div>
              <div><span>Due Date</span><strong>{formatDateTime(task.dueDate)}</strong></div>
              <div><span>Estimated Duration</span><strong>{task.estimatedDuration || "Pending"}</strong></div>
              <div><span>Completion Time</span><strong>{formatDateTime(task.completionTime)}</strong></div>
            </div>
            {canReview && task.status === "completed" && <button type="button" className="nc-btn nc-btn--primary" onClick={onReview}>Mark as Reviewed</button>}
          </div>
          <div className="tasks-detail-card">
            <h4>Activity Timeline</h4>
            <div className="tasks-timeline">
              {(task.statusHistory || []).length ? task.statusHistory.slice().reverse().map((item, index) => (
                <div key={`${item.changedAt}-${index}`} className="tasks-timeline-item">
                  <span className={`tasks-pill tasks-pill--${item.status}`}>{prettify(item.status)}</span>
                  <p>{item.note || "Task updated"}</p>
                  <small>{item.changedBy?.name || "System"} • {formatDateTime(item.changedAt)}</small>
                </div>
              )) : <p className="tasks-empty-inline">No activity recorded yet.</p>}
            </div>
          </div>
        </div>
        <div className="tasks-comments">
          <div className="tasks-comments-header"><h4>Comments</h4><span>{comments.length} item(s)</span></div>
          <div className="tasks-comments-list">
            {comments.length ? comments.map((comment) => (
              <div key={comment._id} className="tasks-comment">
                <div className="tasks-comment-avatar">{getInitials(comment.commentedBy?.name)}</div>
                <div className="tasks-comment-body">
                  <div className="tasks-comment-head">
                    <div className="tasks-comment-author">
                      <strong>{comment.commentedBy?.name || "Unknown"}</strong>
                      <span className={`tasks-comment-role tasks-comment-role--${getCommentRoleTone(comment.commentedBy?.role)}`}>
                        {prettify(comment.commentedBy?.role || "user")}
                      </span>
                    </div>
                    <span>{formatDateTime(comment.createdAt)}</span>
                  </div>
                  <p>{comment.comment}</p>
                </div>
              </div>
            )) : <p className="tasks-empty-inline">No comments yet.</p>}
          </div>
          {canComment && (
            <div className="tasks-comment-form">
              <textarea className="nc-input tasks-textarea" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={canReview ? "Share review feedback or next steps." : "Ask for a due-date update, mention blockers, or share suggestions for the reviewer."} />
              <button type="button" className="nc-btn nc-btn--primary" onClick={onPostComment} disabled={commentSaving}>{commentSaving ? "Posting..." : canReview ? "Post Comment" : "Send Comment"}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  return (
    <div className="tasks-pagination">
      <div className="tasks-pagination-info">Page {pagination.currentPage} of {pagination.totalPages}</div>
      <div className="tasks-pagination-actions">
        <button type="button" className="nc-btn" disabled={pagination.currentPage <= 1} onClick={() => onPageChange(pagination.currentPage - 1)}>Previous</button>
        <button type="button" className="nc-btn" disabled={pagination.currentPage >= pagination.totalPages} onClick={() => onPageChange(pagination.currentPage + 1)}>Next</button>
      </div>
    </div>
  );
}

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");
  const currentUserId = localStorage.getItem("userId");
  const canCreate = ["super_user", "admin"].includes(role);
  const canReview = ["super_user", "hr"].includes(role);
  const canViewBoard = canCreate || canReview;
  const taskParam = searchParams.get("task");

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalTasks: 0, limit: 10 });
  const [filters, setFilters] = useState({ search: "", status: "", role: "", priority: "", startDate: "", endDate: "" });
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [taskForm, setTaskForm] = useState(EMPTY_FORM);
  const [activeTask, setActiveTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [commentSaving, setCommentSaving] = useState(false);
  const [timingTask, setTimingTask] = useState(null);
  const [timingValue, setTimingValue] = useState("");
  const [timingSaving, setTimingSaving] = useState(false);

  const requestConfig = useMemo(() => authConfig(token), [token]);
  const showMessage = useCallback((type, message) => { if (type === "error") { setError(message); setSuccess(""); } else { setSuccess(message); setError(""); } }, []);

  const fetchUsers = useCallback(async () => {
    if (!canCreate) return;
    try {
      const { data } = await axios.get(apiUrl("/api/tasks/assignable-users"), requestConfig);
      setUsers(data.data || []);
    } catch (fetchError) {
      console.error("Failed to fetch users", fetchError);
    }
  }, [canCreate, requestConfig]);

  const fetchTasks = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      if (canViewBoard) {
        const { data } = await axios.get(apiUrl("/api/tasks"), {
          ...requestConfig,
          params: {
            page,
            limit: pagination.limit,
            ...(filters.search ? { search: filters.search } : {}),
            ...(filters.status ? { status: filters.status } : {}),
            ...(filters.role ? { role: filters.role } : {}),
            ...(filters.priority ? { priority: filters.priority } : {}),
            ...(filters.startDate ? { startDate: filters.startDate } : {}),
            ...(filters.endDate ? { endDate: filters.endDate } : {}),
          },
        });
        setTasks(data.data || []);
        setPagination((prev) => ({ ...prev, ...(data.pagination || prev), currentPage: page }));
      } else {
        const { data } = await axios.get(apiUrl("/api/tasks/my-tasks"), requestConfig);
        setTasks(data.data || []);
        setPagination((prev) => ({ ...prev, totalTasks: (data.data || []).length, totalPages: 1, currentPage: 1 }));
      }
    } catch (fetchError) {
      showMessage("error", fetchError.response?.data?.message || "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, [canViewBoard, filters, pagination.limit, requestConfig, showMessage]);

  const openTaskDetails = useCallback(async (taskId) => {
    try {
      const [taskResponse, commentsResponse] = await Promise.all([
        axios.get(apiUrl(`/api/tasks/${taskId}`), requestConfig),
        axios.get(apiUrl(`/api/tasks/${taskId}/comments`), requestConfig),
      ]);
      setDetailTask(taskResponse.data.data);
      setComments(commentsResponse.data.data || []);
      setCommentText("");
      setSearchParams({ task: taskId });
    } catch (fetchError) {
      showMessage("error", fetchError.response?.data?.message || "Failed to load task details");
    }
  }, [requestConfig, setSearchParams, showMessage]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchTasks(1); }, [fetchTasks]);
  useEffect(() => { if (taskParam) openTaskDetails(taskParam); }, [openTaskDetails, taskParam]);

  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return showMessage("error", "Task title is required");
    if (!isEditMode && !taskForm.assignedTo) return showMessage("error", "Please select a user to assign the task to");
    if (!taskForm.dueDate) return showMessage("error", "Due date is required");
    if (isPastDate(taskForm.dueDate)) return showMessage("error", "Due date cannot be in the past");

    try {
      setSavingTask(true);
      const payload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        priority: taskForm.priority,
        dueDate: new Date(taskForm.dueDate).toISOString(),
        ...(isEditMode ? {} : { assignedTo: taskForm.assignedTo }),
      };
      if (isEditMode && activeTask) {
        await axios.put(apiUrl(`/api/tasks/${activeTask._id}`), payload, requestConfig);
        showMessage("success", "Task updated successfully");
      } else {
        await axios.post(apiUrl("/api/tasks"), payload, requestConfig);
        showMessage("success", "Task created successfully");
      }
      setIsTaskModalOpen(false);
      setTaskForm(EMPTY_FORM);
      fetchTasks(isEditMode ? pagination.currentPage : 1);
    } catch (saveError) {
      showMessage("error", saveError.response?.data?.message || "Failed to save task");
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(apiUrl(`/api/tasks/${taskId}`), requestConfig);
      if (detailTask?._id === taskId) { setDetailTask(null); setComments([]); navigate("/tasks"); }
      showMessage("success", "Task deleted successfully");
      fetchTasks(pagination.currentPage);
    } catch (deleteError) {
      showMessage("error", deleteError.response?.data?.message || "Failed to delete task");
    }
  };

  const handleSetTiming = async () => {
    if (!timingValue.trim()) return showMessage("error", "Estimated duration is required");
    try {
      setTimingSaving(true);
      await axios.patch(apiUrl(`/api/tasks/${timingTask._id}/timing`), { estimatedDuration: timingValue.trim() }, requestConfig);
      setTimingTask(null);
      setTimingValue("");
      showMessage("success", "Estimated duration saved");
      fetchTasks();
      if (detailTask?._id) openTaskDetails(detailTask._id);
    } catch (saveError) {
      showMessage("error", saveError.response?.data?.message || "Failed to save timing");
    } finally {
      setTimingSaving(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    if (!window.confirm("Mark this task as complete?")) return;
    try {
      await axios.patch(apiUrl(`/api/tasks/${taskId}/complete`), {}, requestConfig);
      showMessage("success", "Task marked as complete");
      fetchTasks();
      if (detailTask?._id === taskId) openTaskDetails(taskId);
    } catch (completeError) {
      showMessage("error", completeError.response?.data?.message || "Failed to complete task");
    }
  };

  const handleReviewTask = async () => {
    try {
      await axios.patch(apiUrl(`/api/tasks/${detailTask._id}/review`), {}, requestConfig);
      showMessage("success", "Task reviewed successfully");
      openTaskDetails(detailTask._id);
      fetchTasks(pagination.currentPage);
    } catch (reviewError) {
      showMessage("error", reviewError.response?.data?.message || "Failed to review task");
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || !detailTask) return showMessage("error", "Comment cannot be empty");
    try {
      setCommentSaving(true);
      await axios.post(apiUrl(`/api/tasks/${detailTask._id}/comments`), { comment: commentText.trim() }, requestConfig);
      setCommentText("");
      showMessage("success", "Comment posted");
      openTaskDetails(detailTask._id);
    } catch (postError) {
      showMessage("error", postError.response?.data?.message || "Failed to post comment");
    } finally {
      setCommentSaving(false);
    }
  };

  const activeTasks = useMemo(() => tasks.filter((task) => !["completed", "reviewed"].includes(task.status)), [tasks]);
  const completedTasks = useMemo(() => tasks.filter((task) => ["completed", "reviewed"].includes(task.status)), [tasks]);
  const canComment = Boolean(detailTask) && (canReview || !canReview || detailTask.assignedTo?._id === currentUserId);
  const canManageTask = useCallback((task) => {
    if (role === "super_user") return true;
    if (role === "admin") return task.assignedBy?._id === currentUserId;
    return false;
  }, [currentUserId, role]);
  const isOwnAssignedTask = useCallback((task) => task.assignedTo?._id === currentUserId, [currentUserId]);

  return (
    <div className="nc-page tasks-page">
      <section className="nc-hero">
        <div>
          <span className="nc-badge">{canViewBoard ? "Task Control Center" : "My Task Queue"}</span>
          <h1 className="nc-hero-title"><span className="nc-gradient-text">Tasks</span> that move work forward</h1>
          <p className="nc-hero-subtitle">{canViewBoard ? "Assign work, track execution, review outcomes, and keep deadlines visible across the team." : "Check what is assigned to you, update timing, and close work with clear handoff status."}</p>
        </div>
        <div className="nc-hero-actions">
          <span className="nc-pill"><ClipboardCheck size={16} />{tasks.length} task(s)</span>
          {canCreate && <button type="button" className="nc-btn nc-btn--primary" onClick={() => { setIsEditMode(false); setActiveTask(null); setTaskForm(EMPTY_FORM); setIsTaskModalOpen(true); }}><Plus size={16} />Create Task</button>}
        </div>
      </section>

      {(error || success) && <div className={`tasks-banner ${error ? "tasks-banner--error" : "tasks-banner--success"}`}><span>{error || success}</span><button type="button" onClick={() => { setError(""); setSuccess(""); }}>x</button></div>}

      {canViewBoard ? (
        <>
          <section className="nc-panel nc-section tasks-filters-panel">
            <div className="tasks-filters-header">
              <div className="tasks-filter-title"><Filter size={15} />Filters</div>
            </div>
            <div className="nc-controls tasks-filters-bar">
              <div className="nc-controls-left tasks-filters-grid">
                <input className="nc-input" placeholder="Search title or description" value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
                <select className="nc-select" value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}><option value="">All status</option>{STATUS_OPTIONS.map((o) => <option key={o} value={o}>{prettify(o)}</option>)}</select>
                <select className="nc-select" value={filters.role} onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value }))}><option value="">All roles</option>{["sales", "support", "hr", "it", "digital_media"].map((o) => <option key={o} value={o}>{prettify(o)}</option>)}</select>
                <select className="nc-select" value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}><option value="">All priorities</option>{PRIORITY_OPTIONS.map((o) => <option key={o} value={o}>{prettify(o)}</option>)}</select>
                <input className="nc-input" type="date" value={filters.startDate} onChange={(e) => setFilters((p) => ({ ...p, startDate: e.target.value }))} />
                <input className="nc-input" type="date" value={filters.endDate} onChange={(e) => setFilters((p) => ({ ...p, endDate: e.target.value }))} />
              </div>
              <div className="nc-controls-right tasks-filters-actions">
                <button type="button" className="nc-btn" onClick={() => fetchTasks(1)}>Apply</button>
                <button type="button" className="nc-btn" onClick={() => { setFilters({ search: "", status: "", role: "", priority: "", startDate: "", endDate: "" }); setTimeout(() => fetchTasks(1), 0); }}>Reset</button>
              </div>
            </div>
          </section>

          <section className="nc-panel nc-section">
            <div className="nc-table-wrap">
              <table className="nc-table">
                <thead><tr><th>Title</th><th>Assigned To</th><th>Role</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan="7">Loading tasks...</td></tr> : tasks.length ? tasks.map((task) => (
                    <tr key={task._id} onClick={() => openTaskDetails(task._id)} className="tasks-row">
                      <td>{task.title}</td>
                      <td>{task.assignedTo?.name || "Unknown"}</td>
                      <td>{prettify(task.role)}</td>
                      <td><span className={`tasks-pill tasks-pill--${task.priority}`}>{prettify(task.priority)}</span></td>
                      <td><span className={`tasks-pill tasks-pill--${task.status}`}>{prettify(task.status)}</span></td>
                      <td>{formatDateOnly(task.dueDate)}</td>
                      <td>
                        <div className="tasks-action-row" onClick={(e) => e.stopPropagation()}>
                          <button type="button" className="tasks-icon-btn" aria-label="View task" onClick={() => openTaskDetails(task._id)}><FaEye /></button>
                          {canManageTask(task) && (
                            <>
                              <button type="button" className="tasks-icon-btn" aria-label="Edit task" onClick={() => { setIsEditMode(true); setActiveTask(task); setTaskForm({ title: task.title || "", description: task.description || "", assignedTo: task.assignedTo?._id || "", priority: task.priority || "medium", dueDate: toInputDateTime(task.dueDate) }); setIsTaskModalOpen(true); }}><FaPencilAlt /></button>
                              <button type="button" className="tasks-icon-btn tasks-icon-btn--danger" aria-label="Delete task" onClick={() => handleDeleteTask(task._id)}><FaTrashAlt /></button>
                            </>
                          )}
                          {isOwnAssignedTask(task) && !["completed", "reviewed"].includes(task.status) && (
                            <>
                              <button type="button" className="nc-btn" onClick={() => { setTimingTask(task); setTimingValue(task.estimatedDuration || ""); }}>Set Timing</button>
                              <button type="button" className="nc-btn nc-btn--primary" onClick={() => handleCompleteTask(task._id)}>Complete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : <tr><td colSpan="7">No tasks found for the current filters.</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={(page) => fetchTasks(page)} />
          </section>
        </>
      ) : (
        <div className="tasks-stack">
          <section className="nc-panel nc-section">
            <div className="tasks-section-head"><h3>Open Tasks</h3><span>{activeTasks.length} item(s)</span></div>
            <div className="tasks-cards">
              {loading ? <p className="tasks-empty-inline">Loading your tasks...</p> : activeTasks.length ? activeTasks.map((task) => (
                <article key={task._id} className="tasks-card">
                  <div className="tasks-card-top"><div><h3>{task.title}</h3><p>{task.description || "No description provided."}</p></div><span className={`tasks-pill tasks-pill--${task.priority}`}>{prettify(task.priority)}</span></div>
                  <div className="tasks-card-meta"><span><Clock3 size={14} />Due {formatDateOnly(task.dueDate)}</span><span className={`tasks-pill tasks-pill--${task.status}`}>{prettify(task.status)}</span></div>
                  <div className="tasks-card-info"><div><span>Assigned by</span><strong>{task.assignedBy?.name || "System"}</strong></div><div><span>Timing</span><strong>{task.estimatedDuration || "Pending"}</strong></div></div>
                  <div className="tasks-card-actions"><button type="button" className="nc-btn" onClick={() => openTaskDetails(task._id)}><FaEye />View</button><button type="button" className="nc-btn" onClick={() => { setTimingTask(task); setTimingValue(task.estimatedDuration || ""); }}><Clock3 size={15} />Set Timing</button><button type="button" className="nc-btn nc-btn--primary" onClick={() => handleCompleteTask(task._id)}><CheckCircle2 size={15} />Mark Complete</button></div>
                </article>
              )) : <p className="tasks-empty-inline">No active tasks assigned right now.</p>}
            </div>
          </section>
          <section className="nc-panel nc-section">
            <div className="tasks-section-head"><h3>Completed</h3><span>{completedTasks.length} item(s)</span></div>
            <div className="tasks-cards tasks-cards--compact">
              {completedTasks.length ? completedTasks.map((task) => (
                <article key={task._id} className="tasks-card tasks-card--done">
                  <div className="tasks-card-top"><div><h3>{task.title}</h3><p>Completed on {formatDateTime(task.completionTime || task.updatedAt)}</p></div><span className={`tasks-pill tasks-pill--${task.status}`}>{prettify(task.status)}</span></div>
                  <div className="tasks-card-actions"><button type="button" className="nc-btn" onClick={() => openTaskDetails(task._id)}><MessageSquareText size={15} />View Feedback</button></div>
                </article>
              )) : <p className="tasks-empty-inline">Completed work will appear here.</p>}
            </div>
          </section>
        </div>
      )}

      {isTaskModalOpen && <TaskFormModal form={taskForm} setForm={setTaskForm} users={users} saving={savingTask} onClose={() => setIsTaskModalOpen(false)} onSubmit={handleSaveTask} isEdit={isEditMode} />}
      {timingTask && <TimingModal value={timingValue} setValue={setTimingValue} saving={timingSaving} onClose={() => setTimingTask(null)} onSubmit={handleSetTiming} />}
      <DetailModal task={detailTask} comments={comments} canReview={canReview} canComment={canComment} commentText={commentText} setCommentText={setCommentText} commentSaving={commentSaving} onClose={() => { setDetailTask(null); setComments([]); navigate("/tasks"); }} onPostComment={handlePostComment} onReview={handleReviewTask} />
    </div>
  );
}
