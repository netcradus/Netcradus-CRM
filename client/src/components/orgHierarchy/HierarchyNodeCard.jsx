import React from "react";
import { Handle, Position } from "reactflow";

const ROLE_BADGES = {
  super_user: "error",
  admin: "warning",
  management: "info",
  hr: "success",
  sales: "ghost",
  support: "ghost",
  it: "info",
  digital_media: "ghost",
};

const getInitials = (name = "") =>
  String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

const formatRole = (role = "") =>
  String(role || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

function HierarchyNodeCard({ data }) {
  const badge = ROLE_BADGES[data.role] || "ghost";

  return (
    <div
      className="nc-card nc-card--interactive"
      onClick={(event) => {
        event.stopPropagation();
        data.onSelect?.();
      }}
      style={{
        width: 230,
        minHeight: 146,
        padding: "var(--space-4)",
        borderColor: data.selected ? "var(--color-border-accent)" : "var(--color-border)",
        background: data.selected ? "var(--color-accent-muted)" : "var(--color-bg-surface)",
        cursor: "grab",
      }}
    >
      {!data.isRoot && <Handle type="target" position={Position.Top} style={{ background: "var(--color-accent)", width: 10, height: 10 }} />}
      <Handle type="source" position={Position.Bottom} style={{ background: "var(--color-accent)", width: 10, height: 10 }} />

      <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-3)" }}>
        {data.profilePhoto ? (
          <img src={data.profilePhoto} alt="" style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", objectFit: "cover" }} />
        ) : (
          <div style={{ width: 42, height: 42, borderRadius: "var(--radius-md)", display: "grid", placeItems: "center", background: "var(--color-accent-muted)", color: "var(--color-accent-strong)", fontWeight: "var(--font-bold)" }}>
            {getInitials(data.name)}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: "var(--font-bold)", color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.name}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{data.designation || formatRole(data.role)}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
        <span className={`badge badge-${badge}`}>{formatRole(data.role)}</span>
        <span className="badge badge-neutral">{data.department || "General"}</span>
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)" }} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="btn btn-ghost btn--sm" style={{ flex: 1 }} onClick={data.onEdit}>Edit</button>
        <button type="button" className="btn btn-ghost btn--sm" style={{ flex: 1, color: "var(--color-error)" }} onClick={data.onRemove}>Remove</button>
      </div>
    </div>
  );
}

export default HierarchyNodeCard;
