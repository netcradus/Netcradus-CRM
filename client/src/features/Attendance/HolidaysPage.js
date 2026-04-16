import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { format, parseISO, isAfter } from "date-fns";
import { apiUrl } from "../../config/api";
import "./Attendance.css";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });
const userRole = String(localStorage.getItem("userRole") || "").trim().toLowerCase();
const canManageHolidays = ["super_user", "hr"].includes(userRole);

const TYPE_BADGE = {
  national: { label: "National", cls: "badge-present" },
  restricted: { label: "Restricted", cls: "badge-half" },
  company: { label: "Company", cls: "badge-holiday" },
};

const EMPTY_FORM = { name: "", date: "", type: "national", description: "" };

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(apiUrl("/api/holidays"), { headers: getHeaders() });
      setHolidays(data.data || []);
    } catch (e) {
      setError("Failed to load holidays.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  const openAdd = () => {
    if (!canManageHolidays) return;
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  };

  const openEdit = (holiday) => {
    if (!canManageHolidays) return;
    setForm({
      name: holiday.name,
      date: holiday.date?.substring(0, 10),
      type: holiday.type,
      description: holiday.description || "",
    });
    setEditId(holiday._id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canManageHolidays) {
      setError("Only HR and super users can manage holidays.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (editId) {
        await axios.patch(apiUrl(`/api/holidays/${editId}`), form, { headers: getHeaders() });
        setSuccess("Holiday updated.");
      } else {
        await axios.post(apiUrl("/api/holidays"), form, { headers: getHeaders() });
        setSuccess("Holiday added.");
      }

      setShowForm(false);
      fetchHolidays();
    } catch (e) {
      setError(e.response?.data?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canManageHolidays) {
      setError("Only HR and super users can manage holidays.");
      return;
    }
    if (!window.confirm("Delete this holiday?")) return;
    setError("");
    setSuccess("");

    try {
      await axios.delete(apiUrl(`/api/holidays/${id}`), { headers: getHeaders() });
      setSuccess("Holiday deleted.");
      fetchHolidays();
    } catch (e) {
      setError(e.response?.data?.message || "Delete failed.");
    }
  };

  const now = new Date();
  const filtered = holidays
    .filter((holiday) => {
      const holidayDate = holiday.date ? parseISO(holiday.date) : null;
      if (filter === "upcoming") return holidayDate && isAfter(holidayDate, now);
      if (filter === "past") return holidayDate && !isAfter(holidayDate, now);
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const upcomingCount = holidays.filter((holiday) => {
    const holidayDate = holiday.date ? parseISO(holiday.date) : null;
    return holidayDate && isAfter(holidayDate, now);
  }).length;

  const pastCount = holidays.filter((holiday) => {
    const holidayDate = holiday.date ? parseISO(holiday.date) : null;
    return holidayDate && !isAfter(holidayDate, now);
  }).length;

  return (
    <div className="att-page holiday-calendar-page">
      <div className="holiday-hero">
        <div className="holiday-hero-copy">
          <span className="holiday-hero-kicker">Attendance workspace</span>
          <h1 className="att-title holiday-hero-title">Holiday Calendar</h1>
          <p className="att-subtitle holiday-hero-subtitle">
            Company and national holidays for {now.getFullYear()}, with a cleaner view for planning schedules and leave.
          </p>
        </div>

        <div className="holiday-hero-actions">
          <div className="holiday-role-chip">
            {canManageHolidays ? "HR / Super User Access" : "View Only Access"}
          </div>
          {canManageHolidays && (
            <button className="btn-primary holiday-add-btn" onClick={openAdd}>
              + Add Holiday
            </button>
          )}
        </div>
      </div>

      <div className="holiday-summary-grid">
        <div className="holiday-summary-card">
          <span className="holiday-summary-label">Total holidays</span>
          <strong>{holidays.length}</strong>
        </div>
        <div className="holiday-summary-card">
          <span className="holiday-summary-label">Upcoming</span>
          <strong>{upcomingCount}</strong>
        </div>
        <div className="holiday-summary-card">
          <span className="holiday-summary-label">Completed</span>
          <strong>{pastCount}</strong>
        </div>
      </div>

      <div className="att-header holiday-toolbar">
        <div>
          <h2 className="holiday-section-title">Holiday Schedule</h2>
          <p className="holiday-section-subtitle">
            Filter the timeline to review all, upcoming, or past holidays.
          </p>
        </div>
      </div>

      {error && <div className="att-alert att-alert-error">{error}</div>}
      {success && <div className="att-alert att-alert-success">{success}</div>}

      <div className="att-tabs holiday-tabs">
        {["all", "upcoming", "past"].map((tab) => (
          <button
            key={tab}
            className={`att-tab ${filter === tab ? "att-tab-active" : ""}`}
            onClick={() => setFilter(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="att-section">
        {loading ? (
          <div className="att-loading">Loading holidays...</div>
        ) : filtered.length === 0 ? (
          <div className="att-empty">No holidays found for this filter.</div>
        ) : (
          <div className="holiday-grid">
            {filtered.map((holiday) => {
              const holidayDate = holiday.date ? parseISO(holiday.date) : null;
              const upcoming = holidayDate && isAfter(holidayDate, now);

              return (
                <div
                  key={holiday._id}
                  className={`holiday-card ${upcoming ? "holiday-upcoming" : "holiday-past"}`}
                >
                  <div className="holiday-date">
                    {holidayDate ? (
                      <>
                        <span className="holiday-day">{format(holidayDate, "dd")}</span>
                        <span className="holiday-month">{format(holidayDate, "MMM")}</span>
                      </>
                    ) : (
                      "-"
                    )}
                  </div>

                  <div className="holiday-info">
                    <div className="holiday-card-topline">
                      <div className="holiday-name">{holiday.name}</div>
                      <span className={`badge ${TYPE_BADGE[holiday.type]?.cls || "badge-weekend"}`}>
                        {TYPE_BADGE[holiday.type]?.label || holiday.type}
                      </span>
                    </div>
                    <div className="holiday-weekday">{holidayDate ? format(holidayDate, "EEEE") : ""}</div>
                    {holiday.description && <div className="holiday-desc">{holiday.description}</div>}
                  </div>

                  {canManageHolidays && (
                    <div className="holiday-actions">
                      <button
                        className="btn-icon holiday-action-btn"
                        onClick={() => openEdit(holiday)}
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        className="btn-icon btn-icon-danger holiday-action-btn"
                        onClick={() => handleDelete(holiday._id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="att-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="att-modal" onClick={(e) => e.stopPropagation()}>
            <div className="att-modal-header">
              <div>
                <div className="att-modal-eyebrow">Holiday calendar</div>
                <h3 className="att-modal-title">{editId ? "Edit Holiday" : "Add Holiday"}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="modal-close">
                x
              </button>
            </div>

            <form onSubmit={handleSave} className="att-form">
              <div className="form-group">
                <label>
                  Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="national">National</option>
                    <option value="restricted">Restricted</option>
                    <option value="company">Company</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Optional note..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {error && <div className="att-alert att-alert-error">{error}</div>}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
