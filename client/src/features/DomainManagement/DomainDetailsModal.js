import React, { useState } from "react";
import { Layers, Globe, Server, Link2, User, ExternalLink, Check, Copy } from "lucide-react";

export default function DomainDetailsModal({ record, onClose }) {
  const [copyStatus, setCopyStatus] = useState({});

  if (!record) return null;

  const handleCopy = (field, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyStatus((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [field]: false }));
    }, 2000);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderFieldBlock = (label, value, options = {}) => {
    const { isUrl, isCopyable, isFullWidth, icon: FieldIcon } = options;
    const canCopy = isCopyable && value;
    const canLink = isUrl && value;

    return (
      <div 
        className={`details-field-block ${isFullWidth ? 'field-full-width' : ''}`}
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--border-radius-md)",
          padding: "var(--space-3) var(--space-4)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "var(--space-3)",
          minWidth: 0
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ color: "var(--color-text-muted)", fontSize: "10px", fontWeight: "var(--font-bold)", textTransform: "uppercase", display: "block", marginBottom: "4px", letterSpacing: "0.5px" }}>
            {label}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
            {FieldIcon && <FieldIcon size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />}
            <span 
              style={{ 
                color: "var(--color-text-primary)", 
                fontSize: "var(--text-sm)", 
                fontWeight: "var(--font-medium)", 
                overflowWrap: "anywhere", 
                wordBreak: "break-word" 
              }}
            >
              {value || "—"}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-1)", flexShrink: 0 }}>
          {canCopy && (
            <button
              type="button"
              className="copy-btn-icon"
              onClick={() => handleCopy(label, value)}
              title={`Copy ${label}`}
              style={{ width: "32px", height: "32px" }}
            >
              {copyStatus[label] ? <Check size={14} style={{ color: "var(--color-success)" }} /> : <Copy size={14} />}
            </button>
          )}
          {canLink && (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="copy-btn-icon"
              title={`Open ${label}`}
              style={{ width: "32px", height: "32px", display: "inline-flex" }}
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    );
  };

  const owner = record.ownerUser || {};
  const ownerInitials = getInitials(owner.name || owner.email);

  return (
    <div className="details-grid-layout" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="details-two-columns">
        {renderFieldBlock("Project Name", record.project, { icon: Layers })}
        {renderFieldBlock("Hosting Provider", record.hosting, { icon: Server })}
      </div>

      <div className="details-two-columns">
        {renderFieldBlock("Primary Domain", record.domain, { isCopyable: true, icon: Globe })}
        
        {/* Owner Display */}
        <div 
          className="details-field-block"
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--border-radius-md)",
            padding: "var(--space-3) var(--space-4)",
            display: "flex",
            alignItems: "center",
            gap: "var(--space-4)",
            minWidth: 0
          }}
        >
          <div 
            style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              background: "var(--color-bg-hover)", 
              color: "var(--color-accent)", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontWeight: "var(--font-bold)", 
              fontSize: "var(--text-sm)",
              flexShrink: 0
            }}
          >
            {ownerInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <span style={{ color: "var(--color-text-muted)", fontSize: "10px", fontWeight: "var(--font-bold)", textTransform: "uppercase", display: "block", marginBottom: "2px", letterSpacing: "0.5px" }}>
              ASSIGNED DEVELOPER
            </span>
            <div style={{ color: "var(--color-text-primary)", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {owner.name || "—"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px" }}>
              {owner.userId ? `ID: ${owner.userId}` : ""}
              {owner.department ? ` • ${owner.department}` : ""}
            </div>
            {owner.email && (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", wordBreak: "break-all" }}>
                {owner.email}
              </div>
            )}
          </div>
        </div>
      </div>

      {renderFieldBlock("Repository URL", record.repository, { isUrl: true, isCopyable: true, isFullWidth: true, icon: Link2 })}
      {renderFieldBlock("Frontend Deployment URL", record.frontend, { isUrl: true, isCopyable: true, isFullWidth: true, icon: Layers })}
      {renderFieldBlock("Backend Deployment URL", record.backend, { isUrl: true, isCopyable: true, isFullWidth: true, icon: Server })}
      {renderFieldBlock("API Base URL", record.api, { isUrl: true, isCopyable: true, isFullWidth: true, icon: Link2 })}
    </div>
  );
}
