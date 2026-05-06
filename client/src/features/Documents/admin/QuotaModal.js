import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../../../config/api";
import { X } from "lucide-react";
import "../Documents.css";

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const QuotaModal = ({ user, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [newQuota, setNewQuota] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        await axios.get(
          apiUrl(`/api/documents/admin/user/${user.userId}/files?limit=0`),
          { headers: authHeaders() }
        );
        // Build a simple storage object from what we have
        setNewQuota(String(user.quotaMB));
      } catch (err) {
        setNewQuota(String(user.quotaMB));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!reason.trim()) { setError("Reason is required."); return; }
    const quota = Number(newQuota);
    if (!quota || quota < 1) { setError("Enter a valid quota in MB."); return; }
    if (quota <= user.usedMB) { setError(`Quota must be greater than current usage (${user.usedMB?.toFixed(1)} MB).`); return; }

    setSaving(true);
    setError("");
    try {
      await axios.patch(
        apiUrl(`/api/documents/admin/user/${user.userId}/quota`),
        { newQuotaMB: quota, reason: reason.trim() },
        { headers: authHeaders() }
      );
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update quota.");
      setSaving(false);
    }
  };

  return (
    <div className="drive-modal-overlay" onClick={onClose}>
      <div className="drive-modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <button className="drive-modal-close" onClick={onClose}><X size={18} /></button>
        <h3>📦 Manage Storage Quota</h3>
        <p>Updating quota for <strong>{user.name || user.email}</strong></p>

        {!loading && (
          <div style={{ background: "var(--nc-bg-soft)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: "0.82rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "var(--nc-text-muted)" }}>Current Usage</span>
              <strong>{user.usedMB?.toFixed(1)} MB / {user.quotaMB} MB ({user.usedPercent?.toFixed(1)}%)</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--nc-text-muted)" }}>Files</span>
              <strong>{user.fileCount}</strong>
            </div>
          </div>
        )}

        <label style={{ fontSize: "0.78rem", color: "var(--nc-text-muted)", display: "block", marginBottom: 4 }}>
          New Quota (MB) <span style={{ color: "#f87171" }}>*</span>
        </label>
        <input
          className="drive-modal-input"
          type="number"
          min={Math.ceil((user.usedMB || 0) + 1)}
          value={newQuota}
          onChange={e => setNewQuota(e.target.value)}
          placeholder="e.g. 1000"
        />

        <label style={{ fontSize: "0.78rem", color: "var(--nc-text-muted)", display: "block", marginBottom: 4 }}>
          Reason <span style={{ color: "#f87171" }}>*</span>
        </label>
        <input
          className="drive-modal-input"
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="e.g. Project expansion approved"
          maxLength={200}
        />

        {error && <p style={{ color: "#f87171", fontSize: "0.8rem", marginBottom: 10 }}>{error}</p>}

        <div className="drive-modal-actions">
          <button className="drive-btn drive-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="drive-btn drive-btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Update Quota"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotaModal;
