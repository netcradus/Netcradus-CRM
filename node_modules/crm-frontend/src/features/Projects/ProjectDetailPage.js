import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Copy, Edit3, FileText, Plus, Trash2 } from "lucide-react";
import DocumentPickerModal from "./DocumentPickerModal";
import SensitiveRevealModal from "./SensitiveRevealModal";
import { projectApi, projectAssetUrl } from "./projectApi";
// import "./Projects.css";


export const SENSITIVE_FIELD_LABELS = {
  deploymentId: "Deployment ID",
  deploymentPassword: "Deployment Password",
  stagingUrl: "Staging URL",
  githubUrl: "GitHub URL",
  serverNotes: "Server Notes",
  clientName: "Client Name",
  clientCompany: "Client Company",
  clientWebsite: "Client Website",
  liveUrl: "Live URL",
  deploymentPlatform: "Deployment Platform",
};

const ALL_FIELD_KEYS = [
  "name",
  "tagline",
  "description",
  "showcaseDescription",
  "status",
  "startDate",
  "endDate",
  "industry",
  "techStack",
  "thumbnail",
  "screenshots",
  "clientName",
  "clientCompany",
  "clientCountry",
  "clientWebsite",
  "liveUrl",
  "stagingUrl",
  "githubUrl",
  "deploymentPlatform",
  "deploymentId",
  "deploymentPassword",
  "serverNotes",
  "environment",
  "createdBy",
  "collaborators",
];

const tabs = ["Overview", "Client & Deployment", "Documents", "Settings"];

const formatDate = (date) => date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const isSensitive = (fieldKey, project) => project?.sensitiveFields?.includes(fieldKey);
const getUserLabel = (user) => {
  if (!user) return "—";
  if (typeof user === "string") return user;
  return user.name || user.email || "—";
};

const renderField = (fieldKey, value, project, sensitiveRevealed) => {
  if (isSensitive(fieldKey, project) && !sensitiveRevealed) {
    return <span className="nc-text-muted">••••••••</span>;
  }
  return <span>{value || "—"}</span>;
};

function DetailRow({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 'var(--space-4)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-bg-hover)' }}>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>{label}</span>
      <div style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-medium)' }}>{children}</div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [sensitiveRevealed, setSensitiveRevealed] = useState(false);
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [passwordAction, setPasswordAction] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [documentPassword, setDocumentPassword] = useState("");
  const [sensitiveDraft, setSensitiveDraft] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await projectApi.get(id);
        setProject(data.project);
        setSensitiveDraft(data.project.sensitiveFields || []);
      } catch (err) {
        setError("Project not found.");
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (!sensitiveRevealed) return undefined;
    const timer = setTimeout(() => setSensitiveRevealed(false), 15 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [sensitiveRevealed]);

  const sensitiveRows = useMemo(
    () => ["deploymentId", "deploymentPassword", "stagingUrl", "githubUrl", "serverNotes"],
    []
  );

  if (error) return <div className="nc-page"><div className="nc-error">{error}</div></div>;
  if (!project) return <div className="nc-page"><div className="nc-loading">Loading project...</div></div>;

  const toggleSensitiveDraft = (field) => {
    setSensitiveDraft((prev) => prev.includes(field) ? prev.filter((item) => item !== field) : [...prev, field]);
  };

  const runPasswordAction = async (password) => {
    const action = passwordAction;
    setPasswordAction(null);

    if (action === "delete") {
      await projectApi.remove(project._id, password);
      navigate("/projects");
      return;
    }

    if (action === "saveSensitive") {
      const { data } = await projectApi.updateSensitive(project._id, sensitiveDraft, password);
      setProject(data.project);
      return;
    }

    if (action === "toggleShowcase") {
      const { data } = await projectApi.toggleShowcase(project._id, password);
      setProject((prev) => ({ ...prev, isVisibleInShowcase: data.isVisibleInShowcase }));
      return;
    }

    if (action === "toggleFeatured") {
      const { data } = await projectApi.toggleFeatured(project._id, password);
      setProject((prev) => ({ ...prev, isFeatured: data.isFeatured }));
      return;
    }

    if (action === "attachDocument") {
      setDocumentPassword(password);
      setPickerOpen(true);
      return;
    }

    if (action?.type === "removeDocument") {
      const { data } = await projectApi.removeDocument(project._id, action.driveFileId, password);
      setProject((prev) => ({ ...prev, documents: data.documents || [] }));
    }
  };

  const saveSensitiveFields = async () => {
    setPasswordAction("saveSensitive");
  };

  const toggleShowcase = async () => {
    setPasswordAction("toggleShowcase");
  };

  const toggleFeatured = async () => {
    setPasswordAction("toggleFeatured");
  };

  const removeProject = async () => {
    if (!window.confirm("Delete this project?")) return;
    setPasswordAction("delete");
  };

  const removeDocument = async (driveFileId) => {
    setPasswordAction({ type: "removeDocument", driveFileId });
  };

  const setAttachedDocuments = (documents) => {
    setProject((prev) => ({ ...prev, documents }));
    setDocumentPassword("");
  };

  const attachDocument = () => {
    setPasswordAction("attachDocument");
  };

  return (
    <div className="nc-page">
      <div className="nc-container">
        <header style={{ marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
          <Link to="/projects" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textDecoration: 'none', display: 'block', marginBottom: 'var(--space-2)' }}>← Projects</Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-primary)', margin: 0 }}>{project.name}</h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>{project.tagline}</p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <span className={`badge`} style={{ 
                background: project.status === 'completed' ? 'var(--color-success-muted)' : 'var(--color-warning-muted)',
                color: project.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)',
                padding: 'var(--space-1) var(--space-3)',
                borderRadius: 'var(--radius-full)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-semibold)',
                textTransform: 'uppercase'
              }}>{project.status}</span>
              <Link to={`/projects/${project._id}/edit`} className="btn btn-secondary"><Edit3 size={16} /> Edit</Link>
              <button className="btn btn-danger" onClick={removeProject}><Trash2 size={16} /> Delete</button>
            </div>
          </div>
        </header>

        <nav style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-6)', gap: 'var(--space-6)' }}>
          {tabs.map((tab) => (
            <button 
              key={tab} 
              style={{ 
                padding: 'var(--space-3) 0',
                fontSize: 'var(--text-sm)',
                fontWeight: activeTab === tab ? 'var(--font-semibold)' : 'var(--font-medium)',
                color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                border: 'none',
                background: 'transparent',
                borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }} 
              onClick={() => setActiveTab(tab)}
            >{tab}</button>
          ))}
        </nav>

        {activeTab === "Overview" && (
          <div style={{ maxWidth: '800px' }}>
            <div className="nc-card" style={{ padding: 'var(--space-6)' }}>
              <DetailRow label="Status">{project.status}</DetailRow>
              <DetailRow label="Timeline">{formatDate(project.startDate)} — {formatDate(project.endDate)}</DetailRow>
              <DetailRow label="Industry">{renderField("industry", project.industry, project, sensitiveRevealed)}</DetailRow>
              <DetailRow label="Created By">{getUserLabel(project.createdBy)}</DetailRow>
              <DetailRow label="Collaborators">
                {(project.collaborators || []).length ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                    {project.collaborators.map((user) => (
                      <span key={user._id || user.email} className="badge" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                        {getUserLabel(user)}
                      </span>
                    ))}
                  </div>
                ) : "—"}
              </DetailRow>
              <DetailRow label="Tech Stack">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {(project.techStack || []).map((tag) => (
                    <span key={tag} className="badge" style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}>{tag}</span>
                  ))}
                </div>
              </DetailRow>
              <DetailRow label="Live URL">
                {isSensitive("liveUrl", project) && !sensitiveRevealed 
                  ? renderField("liveUrl", project.liveUrl, project, sensitiveRevealed) 
                  : project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)' }}>{project.liveUrl}</a> : "—"
                }
              </DetailRow>
              <DetailRow label="Internal Notes">{renderField("description", project.description, project, sensitiveRevealed)}</DetailRow>
              <DetailRow label="Showcase Copy">{renderField("showcaseDescription", project.showcaseDescription, project, sensitiveRevealed)}</DetailRow>
            </div>
          </div>
        )}


      {activeTab === "Client & Deployment" && (
        <div style={{ maxWidth: '800px' }}>
          <div className="nc-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <DetailRow label="Client Name">{renderField("clientName", project.clientName, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Company">{renderField("clientCompany", project.clientCompany, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Country">{renderField("clientCountry", project.clientCountry, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Website">{renderField("clientWebsite", project.clientWebsite, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Platform">{renderField("deploymentPlatform", project.deploymentPlatform, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Environment">{project.environment || "—"}</DetailRow>
          </div>

          <div className="nc-card" style={{ padding: 'var(--space-6)', border: '1px solid var(--color-warning-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-primary)', margin: 0 }}>Sensitive Fields</h3>
              <button className="btn btn-primary" onClick={() => setRevealModalOpen(true)}>Reveal Fields</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              {sensitiveRows.map((field) => (
                <div key={field} style={{ padding: 'var(--space-3)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>{SENSITIVE_FIELD_LABELS[field]}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 'var(--text-sm)' }}>{renderField(field, project[field], project, sensitiveRevealed)}</strong>
                    {sensitiveRevealed && project[field] && (
                      <button className="btn btn-ghost" style={{ padding: '4px' }} title="Copy" onClick={() => navigator.clipboard.writeText(project[field])}><Copy size={14} /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Documents" && (
        <div style={{ maxWidth: '800px' }}>
          <div className="nc-card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', margin: 0 }}>Attached Documents</h3>
              <button className="btn btn-primary" onClick={attachDocument}><Plus size={16} /> Attach</button>
            </div>
            
            <div className="nc-table-wrapper">
              <table className="nc-table">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(project.documents || []).map((doc) => (
                    <tr key={doc.driveFileId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <FileText size={16} className="nc-text-muted" />
                          <span>{doc.fileName}</span>
                        </div>
                      </td>
                      <td>{Number(doc.fileSizeMB || 0).toFixed(2)} MB</td>
                      <td>{formatDate(doc.uploadedAt)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <a href={projectAssetUrl(doc.driveFileId)} target="_blank" rel="noreferrer" className="btn btn-ghost btn--sm">View</a>
                          <button className="btn btn-ghost btn--sm" style={{ color: 'var(--color-error)' }} onClick={() => removeDocument(doc.driveFileId)} title="Unlink"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!project.documents?.length && <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No documents attached.</div>}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Settings" && (
        <div style={{ maxWidth: '800px' }}>
          <div className="nc-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>Showcase Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={project.isVisibleInShowcase} onChange={toggleShowcase} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: 'var(--text-sm)' }}>Visible in Showcase</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
                <input type="checkbox" checked={project.isFeatured} onChange={toggleFeatured} style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: 'var(--text-sm)' }}>Featured Project</span>
              </label>
            </div>
          </div>

          <div className="nc-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>Sensitive Field Configuration</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {ALL_FIELD_KEYS.map((field) => (
                <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', padding: 'var(--space-2)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <input type="checkbox" checked={sensitiveDraft.includes(field)} onChange={() => toggleSensitiveDraft(field)} />
                  <span style={{ fontSize: 'var(--text-xs)' }}>{SENSITIVE_FIELD_LABELS[field] || field}</span>
                </label>
              ))}
            </div>
            <button className="btn btn-primary" onClick={saveSensitiveFields} style={{ width: '100%' }}>Save Configuration</button>
          </div>
        </div>
      )}


      <SensitiveRevealModal
        open={revealModalOpen}
        onClose={() => setRevealModalOpen(false)}
        title="Reveal Sensitive Fields"
        submitLabel="Reveal"
        onVerified={() => {
          setSensitiveRevealed(true);
          setRevealModalOpen(false);
        }}
      />
      <SensitiveRevealModal
        open={Boolean(passwordAction)}
        onClose={() => setPasswordAction(null)}
        title="Confirm Project Action"
        submitLabel="Continue"
        onVerified={runPasswordAction}
      />
      <DocumentPickerModal
        open={pickerOpen}
        projectId={project._id}
        password={documentPassword}
        onClose={() => {
          setPickerOpen(false);
          setDocumentPassword("");
        }}
        onAttached={setAttachedDocuments}
      />
    </div>
  </div>
  );
}



