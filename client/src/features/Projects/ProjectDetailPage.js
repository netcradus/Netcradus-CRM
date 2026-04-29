import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Copy, Edit3, FileText, Plus, Trash2 } from "lucide-react";
import DocumentPickerModal from "./DocumentPickerModal";
import SensitiveRevealModal from "./SensitiveRevealModal";
import { projectApi, projectAssetUrl } from "./projectApi";
import "./Projects.css";

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
  if (!user) return "â€”";
  if (typeof user === "string") return user;
  return user.name || user.email || "â€”";
};

const renderField = (fieldKey, value, project, sensitiveRevealed) => {
  if (isSensitive(fieldKey, project) && !sensitiveRevealed) {
    return <span className="masked-field">••••••••</span>;
  }
  return <span className={isSensitive(fieldKey, project) ? "revealed-field" : ""}>{value || "—"}</span>;
};

function DetailRow({ label, children }) {
  return (
    <div className="portfolio-detail-row">
      <span>{label}</span>
      <strong>{children}</strong>
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

  if (error) return <div className="portfolio-page"><div className="portfolio-error">{error}</div></div>;
  if (!project) return <div className="portfolio-page"><div className="portfolio-empty">Loading project...</div></div>;

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
    if (!window.confirm("Delete this project from the portfolio?")) return;
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
    <div className="portfolio-page">
      <header className="portfolio-page-head">
        <div>
          <span className="portfolio-kicker">Project Detail</span>
          <h1>{project.name}</h1>
        </div>
        <div className="portfolio-head-actions">
          <Link to={`/projects/${project._id}/edit`} className="portfolio-secondary-btn"><Edit3 size={16} /> Edit</Link>
          <button className="portfolio-danger-btn" onClick={removeProject}><Trash2 size={16} /> Delete</button>
        </div>
      </header>

      <nav className="portfolio-tabs">
        {tabs.map((tab) => (
          <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
      </nav>

      {activeTab === "Overview" && (
        <section className="portfolio-detail-layout">
          <div className="portfolio-detail-media">
            {project.thumbnail ? <img src={projectAssetUrl(project.thumbnail)} alt={project.name} /> : <div>{project.name?.slice(0, 2).toUpperCase()}</div>}
          </div>
          <div className="portfolio-panel">
            <DetailRow label="Tagline">{renderField("tagline", project.tagline, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Status"><span className={`portfolio-status status-${project.status}`}>{project.status}</span></DetailRow>
            <DetailRow label="Dates">{formatDate(project.startDate)} to {formatDate(project.endDate)}</DetailRow>
            <DetailRow label="Industry">{renderField("industry", project.industry, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Created By">{getUserLabel(project.createdBy)}</DetailRow>
            <DetailRow label="Collaborators">
              {(project.collaborators || []).length ? (
                <span className="portfolio-tags inline">{project.collaborators.map((user) => <span key={user._id || user.email}>{getUserLabel(user)}</span>)}</span>
              ) : "â€”"}
            </DetailRow>
            <DetailRow label="Tech Stack"><span className="portfolio-tags inline">{(project.techStack || []).map((tag) => <span key={tag}>{tag}</span>)}</span></DetailRow>
            <DetailRow label="Live URL">{isSensitive("liveUrl", project) && !sensitiveRevealed ? renderField("liveUrl", project.liveUrl, project, sensitiveRevealed) : project.liveUrl ? <a href={project.liveUrl} target="_blank" rel="noreferrer">{project.liveUrl}</a> : "—"}</DetailRow>
            <DetailRow label="Internal Notes">{renderField("description", project.description, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Showcase Copy">{renderField("showcaseDescription", project.showcaseDescription, project, sensitiveRevealed)}</DetailRow>
          </div>
        </section>
      )}

      {activeTab === "Client & Deployment" && (
        <section className="portfolio-panel">
          <div className="portfolio-two-col">
            <DetailRow label="Client Name">{renderField("clientName", project.clientName, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Company">{renderField("clientCompany", project.clientCompany, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Country">{renderField("clientCountry", project.clientCountry, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Website">{renderField("clientWebsite", project.clientWebsite, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Platform">{renderField("deploymentPlatform", project.deploymentPlatform, project, sensitiveRevealed)}</DetailRow>
            <DetailRow label="Environment">{project.environment || "—"}</DetailRow>
          </div>
          <div className="portfolio-sensitive-head">
            <h3>Sensitive Fields</h3>
            <button className="portfolio-primary-btn" onClick={() => setRevealModalOpen(true)}>Reveal Sensitive Fields</button>
          </div>
          <div className="portfolio-sensitive-grid">
            {sensitiveRows.map((field) => (
              <div key={field} className="portfolio-sensitive-item">
                <span>{SENSITIVE_FIELD_LABELS[field]}</span>
                <strong>{renderField(field, project[field], project, sensitiveRevealed)}</strong>
                {sensitiveRevealed && project[field] && (
                  <button title="Copy" onClick={() => navigator.clipboard.writeText(project[field])}><Copy size={15} /></button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === "Documents" && (
        <section className="portfolio-panel">
          <div className="portfolio-panel-head">
            <h3>Attached Documents</h3>
            <button className="portfolio-primary-btn" onClick={attachDocument}><Plus size={16} /> Attach Document</button>
          </div>
          <div className="portfolio-doc-table">
            {(project.documents || []).map((doc) => (
              <div key={doc.driveFileId} className="portfolio-doc-row">
                <FileText size={18} />
                <span>{doc.fileName}</span>
                <small>{Number(doc.fileSizeMB || 0).toFixed(2)} MB</small>
                <small>{formatDate(doc.uploadedAt)}</small>
                <a href={projectAssetUrl(doc.driveFileId)} target="_blank" rel="noreferrer">View</a>
                <button onClick={() => removeDocument(doc.driveFileId)} title="Unlink"><Trash2 size={15} /></button>
              </div>
            ))}
            {!project.documents?.length && <div className="portfolio-empty compact">No documents attached.</div>}
          </div>
        </section>
      )}

      {activeTab === "Settings" && (
        <section className="portfolio-panel">
          <div className="portfolio-settings-grid">
            <label className="portfolio-switch-row">
              <input type="checkbox" checked={project.isVisibleInShowcase} onChange={toggleShowcase} />
              Visible in Showcase
            </label>
            <label className="portfolio-switch-row">
              <input type="checkbox" checked={project.isFeatured} onChange={toggleFeatured} />
              Featured Project
            </label>
          </div>
          <h3>Sensitive Field Config</h3>
          <div className="portfolio-check-grid">
            {ALL_FIELD_KEYS.map((field) => (
              <label key={field}>
                <input type="checkbox" checked={sensitiveDraft.includes(field)} onChange={() => toggleSensitiveDraft(field)} />
                {SENSITIVE_FIELD_LABELS[field] || field}
              </label>
            ))}
          </div>
          <button className="portfolio-primary-btn" onClick={saveSensitiveFields}>Save Sensitive Fields</button>
        </section>
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
  );
}
