import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../config/api";
import {
  addToHierarchy,
  bulkUpdateHierarchy,
  deleteHierarchyNode,
  getHierarchy,
  updateHierarchyNode,
} from "../api/orgHierarchyApi";
import AddToHierarchyModal from "../components/orgHierarchy/AddToHierarchyModal";
import HierarchyCanvas from "../components/orgHierarchy/HierarchyCanvas";
import ReassignModal from "../components/orgHierarchy/ReassignModal";

const authConfig = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

const HORIZONTAL_PLACEMENT_GAP = 240;
const VERTICAL_PLACEMENT_GAP = 170;
const ROOT_X = 540;
const ROOT_Y = 70;

function EditHierarchyModal({ entry, hierarchy, submitting, onClose, onSubmit }) {
  const [form, setForm] = useState({ parentId: "", priorityLevel: 0 });

  useEffect(() => {
    if (!entry) return;
    setForm({
      parentId: entry.parentId?._id || entry.parentId || "",
      priorityLevel: Number(entry.priorityLevel || 0),
    });
  }, [entry]);

  if (!entry) return null;

  const isRoot = Number(entry.priorityLevel || 0) === 0;
  const availableParents = hierarchy.filter((item) => String(item._id) !== String(entry._id));

  return (
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" style={{ width: 520 }} onClick={(event) => event.stopPropagation()}>
        <div className="nc-modal-header"><h3>Edit Reporting Line</h3></div>
        <div className="form" style={{ display: "grid", gap: "var(--space-4)" }}>
          <div className="form-field">
            <label className="form-label">Employee</label>
            <input className="form-input" value={entry.userId?.name || "Unknown"} readOnly />
          </div>
          <div className="form-field">
            <label className="form-label">Designation</label>
            <input className="form-input" value={entry.userId?.designation || ""} readOnly />
          </div>
          <div className="form-field">
            <label className="form-label">Reports To</label>
            <select
              className="form-select"
              value={form.parentId}
              disabled={isRoot}
              onChange={(event) => {
                const parent = hierarchy.find((item) => String(item._id) === String(event.target.value));
                setForm({
                  parentId: event.target.value,
                  priorityLevel: parent ? Number(parent.priorityLevel || 0) + 1 : 0,
                });
              }}
            >
              <option value="">None - Root Level</option>
              {availableParents.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.userId?.name || "Unknown"} - Level {item.priorityLevel}
                </option>
              ))}
            </select>
          </div>
          <div className="badge badge-ghost" style={{ justifyContent: "flex-start", padding: "var(--space-2) var(--space-3)" }}>
            Level will update automatically based on the selected reporting manager.
          </div>
        </div>
        <div className="nc-modal-footer" style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={submitting}
            onClick={() => onSubmit({ parentId: form.parentId || null, priorityLevel: Number(form.priorityLevel || 0) })}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmRemoveModal({ entry, submitting, onClose, onConfirm }) {
  if (!entry) return null;

  return (
    <div className="nc-modal-overlay" onClick={onClose}>
      <div className="nc-modal-content" style={{ width: 440 }} onClick={(event) => event.stopPropagation()}>
        <div className="nc-modal-header"><h3>Remove Employee</h3></div>
        <div className="form">
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
            Remove {entry.userId?.name || "this employee"} from the hierarchy? Their direct reports will be detached until you reconnect them.
          </p>
        </div>
        <div className="nc-modal-footer" style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Removing..." : "Remove"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrgHierarchyPage() {
  const [users, setUsers] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingNode, setEditingNode] = useState(null);
  const [removingNode, setRemovingNode] = useState(null);
  const [pendingReassign, setPendingReassign] = useState(null);
  const [snapbackRequest, setSnapbackRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingLayout, setSavingLayout] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isCompactLayout, setIsCompactLayout] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 1180 : false
  );

  useEffect(() => {
    const handleResize = () => {
      const nextCompact = window.innerWidth < 1180;
      setIsCompactLayout(nextCompact);
      if (nextCompact) {
        setIsPanelOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [hierarchyResponse, usersResponse] = await Promise.all([
        getHierarchy(),
        axios.get(apiUrl("/api/auth/users"), authConfig()),
      ]);

      setHierarchy(Array.isArray(hierarchyResponse.data) ? hierarchyResponse.data : []);
      setUsers(Array.isArray(usersResponse.data) ? usersResponse.data : []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to load organization hierarchy");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assignedUserIds = useMemo(
    () => new Set(hierarchy.map((entry) => String(entry.userId?._id || entry.userId))),
    [hierarchy]
  );

  const unassignedUsers = useMemo(
    () => users.filter((user) => !assignedUserIds.has(String(user._id))),
    [assignedUserIds, users]
  );

  const getSuggestedPosition = useCallback(
    ({ parentId = null, priorityLevel, excludeNodeId = null }) => {
      const siblings = hierarchy
        .filter(
          (entry) =>
            String(entry._id) !== String(excludeNodeId || "") &&
            String(entry.parentId?._id || entry.parentId || "") === String(parentId || "") &&
            Number(entry.priorityLevel || 1) === Number(priorityLevel || 1)
        )
        .sort((left, right) => Number(left.positionX || 0) - Number(right.positionX || 0));

      const parentEntry = parentId
        ? hierarchy.find((entry) => String(entry._id) === String(parentId))
        : null;

      if (!siblings.length) {
        return {
          positionX: parentEntry ? Number(parentEntry.positionX || ROOT_X) : ROOT_X,
          positionY: parentEntry
            ? Number(parentEntry.positionY || ROOT_Y) + VERTICAL_PLACEMENT_GAP
            : ROOT_Y + (Number(priorityLevel || 1) - 1) * VERTICAL_PLACEMENT_GAP,
        };
      }

      return {
        positionX: Number(siblings[siblings.length - 1].positionX || ROOT_X) + HORIZONTAL_PLACEMENT_GAP,
        positionY: parentEntry
          ? Number(parentEntry.positionY || ROOT_Y) + VERTICAL_PLACEMENT_GAP
          : ROOT_Y + (Number(priorityLevel || 1) - 1) * VERTICAL_PLACEMENT_GAP,
      };
    },
    [hierarchy]
  );

  const handleAdd = async (payload) => {
    try {
      setSubmitting(true);
      const parentEntry = payload.parentId
        ? hierarchy.find((entry) => String(entry._id) === String(payload.parentId))
        : null;
      const priorityLevel = parentEntry ? Number(parentEntry.priorityLevel || 0) + 1 : Number(payload.priorityLevel || 0);
      const suggestedPosition = getSuggestedPosition({
        parentId: payload.parentId,
        priorityLevel,
      });

      await addToHierarchy({
        ...payload,
        priorityLevel,
        positionX: suggestedPosition.positionX,
        positionY: suggestedPosition.positionY,
      });
      setSelectedUser(null);
      await loadData();
      setSuccess("User added to hierarchy successfully");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to add user to hierarchy");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveConfirm = async () => {
    if (!removingNode) return;
    try {
      setSubmitting(true);
      await deleteHierarchyNode(removingNode._id);
      setRemovingNode(null);
      await loadData();
      setSuccess("Hierarchy node removed successfully");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to remove hierarchy node");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditConfirm = async ({ parentId, priorityLevel }) => {
    if (!editingNode) return;

    const normalizedParentId = parentId || null;
    const normalizedPriorityLevel = Number(priorityLevel);
    const parentChanged =
      String(editingNode.parentId?._id || editingNode.parentId || "") !== String(normalizedParentId || "");
    const levelChanged = Number(editingNode.priorityLevel || 0) !== normalizedPriorityLevel;
    const suggestedPosition =
      parentChanged || levelChanged
        ? getSuggestedPosition({
            parentId: normalizedParentId,
            priorityLevel: normalizedPriorityLevel,
            excludeNodeId: editingNode._id,
          })
        : {
            positionX: editingNode.positionX,
            positionY: editingNode.positionY,
          };

    try {
      setSubmitting(true);
      await updateHierarchyNode(editingNode._id, {
        priorityLevel: normalizedPriorityLevel,
        parentId: normalizedParentId,
        positionX: suggestedPosition.positionX,
        positionY: suggestedPosition.positionY,
      });
      setEditingNode(null);
      await loadData();
      setSuccess("Hierarchy node updated successfully");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to update hierarchy node");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveLayout = async (nodes) => {
    try {
      setSavingLayout(true);
      await bulkUpdateHierarchy(nodes);
      await loadData();
      setSuccess("Hierarchy layout saved successfully");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to save layout");
    } finally {
      setSavingLayout(false);
    }
  };

  const handleReassignConfirm = async () => {
    if (!pendingReassign) return;

    try {
      setSubmitting(true);
      const suggestedPosition = getSuggestedPosition({
        parentId: pendingReassign.targetNodeId,
        priorityLevel: pendingReassign.newPriorityLevel,
        excludeNodeId: pendingReassign.nodeId,
      });

      await updateHierarchyNode(pendingReassign.nodeId, {
        parentId: pendingReassign.targetNodeId,
        priorityLevel: pendingReassign.newPriorityLevel,
        positionX: suggestedPosition.positionX,
        positionY: suggestedPosition.positionY,
      });
      setPendingReassign(null);
      await loadData();
      setSuccess("Hierarchy node reassigned successfully");
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to reassign hierarchy node");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassignCancel = () => {
    if (pendingReassign?.originalPosition) {
      setSnapbackRequest({
        nodeId: pendingReassign.nodeId,
        position: pendingReassign.originalPosition,
      });
    }
    setPendingReassign(null);
  };

  if (loading) {
    return (
      <div className="nc-page">
        <div className="nc-panel nc-section">Loading organization hierarchy...</div>
      </div>
    );
  }

  return (
    <div className="nc-page">
      <div className="nc-hero">
        <div className="nc-hero-copy">
          <h1 className="nc-hero-title" style={{ fontSize: isCompactLayout ? 28 : undefined }}>
            Organization Hierarchy
          </h1>
          <p className="nc-hero-subtitle">
            Manage reporting structure, keep placements stable, and save the canvas only when you are ready.
          </p>
        </div>
      </div>

      {error && (
        <div className="nc-panel nc-section" style={{ marginBottom: 16, borderColor: "rgba(239, 68, 68, 0.35)" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="nc-panel nc-section" style={{ marginBottom: 16, borderColor: "rgba(34, 197, 94, 0.35)" }}>
          {success}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: isCompactLayout ? "column" : "row",
          gap: 16,
          alignItems: "stretch",
        }}
      >
        <div
          className="nc-panel nc-section"
          style={{
            width: isCompactLayout ? "100%" : isPanelOpen ? 320 : 68,
            minWidth: isCompactLayout ? "100%" : isPanelOpen ? 320 : 68,
            transition: "width 0.2s ease, min-width 0.2s ease",
            alignSelf: isCompactLayout ? "stretch" : "flex-start",
            overflow: "hidden",
            padding: isPanelOpen ? 18 : 10,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: isPanelOpen ? 12 : 0,
              gap: 8,
            }}
          >
            {isPanelOpen ? (
              <h3 style={{ margin: 0, fontSize: 18 }}>Unassigned Users</h3>
            ) : (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  margin: "0 auto",
                }}
              >
                Users
              </div>
            )}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setIsPanelOpen((value) => !value)}
              style={{
                minWidth: isPanelOpen ? 82 : 42,
                width: isPanelOpen ? 82 : 42,
                padding: 0,
                height: 42,
                borderRadius: 999,
                fontSize: isPanelOpen ? 12 : 18,
              }}
            >
              {isPanelOpen ? "Hide" : ">"}
            </button>
          </div>

          {isPanelOpen && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isCompactLayout ? "repeat(auto-fit, minmax(220px, 1fr))" : "1fr",
                gap: 12,
                maxHeight: isCompactLayout ? "none" : 640,
                overflowY: isCompactLayout ? "visible" : "auto",
              }}
            >
              {unassignedUsers.map((user) => (
                <div key={user._id} className="nc-card" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{user.name}</div>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 4 }}>
                    {user.designation || "-"}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 10 }}>{user.role}</div>
                  <button type="button" className="btn btn-primary" style={{ width: "100%" }} onClick={() => setSelectedUser(user)}>
                    Add to Hierarchy
                  </button>
                </div>
              ))}
              {!unassignedUsers.length && <div className="nc-card">No unassigned users found.</div>}
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, width: "100%" }}>
          <HierarchyCanvas
            hierarchy={hierarchy}
            onEditNode={(nodeId) => setEditingNode(hierarchy.find((item) => String(item._id) === String(nodeId)) || null)}
            onRemoveNode={(nodeId) => setRemovingNode(hierarchy.find((item) => String(item._id) === String(nodeId)) || null)}
            onRequestSaveLayout={handleSaveLayout}
            onShowError={(message) => {
              setError(message);
              setSuccess("");
            }}
            onReassign={setPendingReassign}
            saving={savingLayout}
            snapbackRequest={snapbackRequest}
            onSnapbackApplied={() => setSnapbackRequest(null)}
            compact={isCompactLayout}
          />
        </div>
      </div>

      <AddToHierarchyModal
        user={selectedUser}
        hierarchy={hierarchy}
        onClose={() => setSelectedUser(null)}
        onSubmit={handleAdd}
        submitting={submitting}
      />

      <ReassignModal
        pending={pendingReassign}
        onCancel={handleReassignCancel}
        onConfirm={handleReassignConfirm}
        submitting={submitting}
      />

      <EditHierarchyModal
        entry={editingNode}
        hierarchy={hierarchy}
        submitting={submitting}
        onClose={() => setEditingNode(null)}
        onSubmit={handleEditConfirm}
      />

      <ConfirmRemoveModal
        entry={removingNode}
        submitting={submitting}
        onClose={() => setRemovingNode(null)}
        onConfirm={handleRemoveConfirm}
      />
    </div>
  );
}

export default OrgHierarchyPage;
