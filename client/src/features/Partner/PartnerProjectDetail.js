import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileText, Save } from "lucide-react";
import { partnerApi, StatusBadge } from "./partnerApi";

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: "var(--space-4)", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
      <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
}

export default function PartnerProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = () => {
    // The detail endpoint enforces partner ownership and returns read-only internal timeline events.
    partnerApi.project(id).then((res) => {
      setProject(res.data.project);
      setTimeline(res.data.timeline || []);
      setNotes(res.data.project?.partnerNotes || "");
    });
  };

  useEffect(load, [id]);

  if (!project) return <div className="nc-page"><div className="nc-loading">Loading project...</div></div>;

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <Link to="/partner/projects" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Back to projects</Link>
      <div className="page-header" style={{ marginTop: "var(--space-4)" }}>
        <div className="page-header-left">
          <h1 className="title">{project.name}</h1>
          <p className="subtitle">{project.serviceType || "Partner project"}</p>
        </div>
        <div className="page-header-right"><StatusBadge status={project.status} large /></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, .8fr)", gap: "var(--space-6)" }}>
        <section className="nc-card" style={{ padding: "var(--space-5)" }}>
          <h3 style={{ marginTop: 0 }}>Project Fields</h3>
          <DetailRow label="Vendor/Client" value={project.vendorId?.name || project.clientCompany} />
          <DetailRow label="Description" value={project.description} />
          <DetailRow label="Priority" value={project.priority} />
          <DetailRow label="Expected Budget" value={project.expectedBudget ? project.expectedBudget.toLocaleString() : "0"} />
          <DetailRow label="Start Date" value={project.startDate ? new Date(project.startDate).toLocaleDateString("en-GB") : "-"} />
          <DetailRow label="Deadline" value={project.deadline ? new Date(project.deadline).toLocaleDateString("en-GB") : "-"} />
          <DetailRow label="Assigned Engineer" value={project.assignedEngineer?.name || "Pending"} />
        </section>

        <section className="nc-card" style={{ padding: "var(--space-5)" }}>
          <h3 style={{ marginTop: 0 }}>Activity Timeline</h3>
          <div style={{ borderLeft: "2px solid var(--color-border)", paddingLeft: "var(--space-4)" }}>
            {timeline.map((item) => (
              <div key={item._id} style={{ marginBottom: "var(--space-4)" }}>
                <strong>{item.eventText}</strong>
                <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            ))}
            {!timeline.length && <p className="subtitle">No timeline events yet.</p>}
          </div>
        </section>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "var(--space-6)", marginTop: "var(--space-6)" }}>
        <section className="nc-card" style={{ padding: "var(--space-5)" }}>
          <h3 style={{ marginTop: 0 }}>File Attachments</h3>
          {/* Partner file uploads reuse the CRM's authenticated project file endpoint. */}
          <input
            className="form-input"
            type="file"
            disabled={uploading}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const payload = new FormData();
              payload.append("file", file);
              setUploading(true);
              try {
                await partnerApi.uploadFile(project._id, payload);
                load();
              } finally {
                setUploading(false);
                event.target.value = "";
              }
            }}
            style={{ marginBottom: "var(--space-4)" }}
          />
          {(project.documents || []).map((doc) => (
            <div key={doc.driveFileId} style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", padding: "var(--space-3) 0", borderTop: "1px solid var(--color-border)" }}>
              <FileText size={16} />
              <span>{doc.fileName}</span>
            </div>
          ))}
          {!project.documents?.length && <p className="subtitle">No files attached yet.</p>}
        </section>

        <section className="nc-card" style={{ padding: "var(--space-5)" }}>
          <h3 style={{ marginTop: 0 }}>Notes</h3>
          {project.internalNotes && <div style={{ marginBottom: "var(--space-4)", padding: "var(--space-3)", background: "var(--color-bg-elevated)" }}>{project.internalNotes}</div>}
          <textarea className="form-input" value={notes} onChange={(event) => setNotes(event.target.value)} rows={6} />
          <button className="btn btn-primary" style={{ marginTop: "var(--space-3)" }} onClick={async () => { await partnerApi.updateNotes(project._id, { partnerNotes: notes }); load(); }}><Save size={16} /> Save Notes</button>
        </section>
      </div>
    </div>
  );
}
