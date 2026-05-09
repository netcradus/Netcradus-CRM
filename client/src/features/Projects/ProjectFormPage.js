import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DocumentPickerModal from "./DocumentPickerModal";
import SensitiveRevealModal from "./SensitiveRevealModal";
import { projectApi } from "./projectApi";
// import "./Projects.css";


const emptyForm = {
  name: "",
  tagline: "",
  description: "",
  showcaseDescription: "",
  status: "completed",
  startDate: "",
  endDate: "",
  industry: "",
  techStack: [],
  thumbnail: "",
  screenshots: [],
  isVisibleInShowcase: true,
  isFeatured: false,
  clientName: "",
  clientCompany: "",
  clientCountry: "",
  clientWebsite: "",
  liveUrl: "",
  stagingUrl: "",
  githubUrl: "",
  deploymentPlatform: "",
  deploymentId: "",
  deploymentPassword: "",
  serverNotes: "",
  environment: "production",
  createdBy: "",
  collaborators: [],
};

const toInputDate = (date) => date ? new Date(date).toISOString().slice(0, 10) : "";

function TextField({ label, name, value, onChange, type = "text", maxLength, required }) {
  return (
    <label className="portfolio-form-field">
      {label}
      <input type={type} name={name} value={value || ""} onChange={onChange} maxLength={maxLength} required={required} />
    </label>
  );
}

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userId") || "";
  const currentUserName = localStorage.getItem("userName") || "";
  const currentUserRole = String(localStorage.getItem("userRole") || "").trim().toLowerCase();
  const isSuperUser = currentUserRole === "super_user";
  const [form, setForm] = useState(() => ({ ...emptyForm, createdBy: currentUserId }));
  const [tagInput, setTagInput] = useState("");
  const [collaboratorInput, setCollaboratorInput] = useState("");
  const [users, setUsers] = useState([]);
  const [pickerMode, setPickerMode] = useState(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [editUnlocked, setEditUnlocked] = useState(false);
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(id);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data } = await projectApi.users();
        setUsers(data.users || []);
      } catch (err) {
        setUsers([]);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (!editing) return;
    if (!editUnlocked) return;
    const load = async () => {
      const { data } = await projectApi.get(id);
      const createdById = data.project.createdBy?._id || data.project.createdBy || "";
      setForm({
        ...emptyForm,
        ...data.project,
        startDate: toInputDate(data.project.startDate),
        endDate: toInputDate(data.project.endDate),
        techStack: data.project.techStack || [],
        screenshots: data.project.screenshots || [],
        createdBy: createdById,
        collaborators: (data.project.collaborators || []).map((user) => user._id || user).filter(Boolean),
      });
    };
    load();
  }, [editing, id, editUnlocked]);

  useEffect(() => {
    if (editing) return;
    setForm((prev) => ({ ...prev, createdBy: prev.createdBy || currentUserId }));
  }, [currentUserId, editing]);

  useEffect(() => {
    if (!editing || !editUnlocked) return undefined;
    const timer = setTimeout(() => {
      setEditUnlocked(false);
      setEditPassword("");
    }, 15 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [editing, editUnlocked]);

  const setValue = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const addTag = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = tagInput.trim();
    if (!value) return;
    setForm((prev) => ({
      ...prev,
      techStack: [...new Set([...prev.techStack, value])].slice(0, 20),
    }));
    setTagInput("");
  };

  const saveProject = async (password) => {
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.endDate) payload.endDate = null;
      if (editing) {
        await projectApi.update(id, payload, password || editPassword);
      } else {
        await projectApi.create(payload);
      }
      navigate("/projects");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save project.");
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (editing) {
      if (!editUnlocked) {
        setPasswordModalOpen(true);
        return;
      }
      await saveProject(editPassword);
      return;
    }
    await saveProject();
  };

  const selectFromPicker = (last) => {
    if (!last) return;
    if (pickerMode === "thumbnail") setForm((prev) => ({ ...prev, thumbnail: last.driveFileId }));
    if (pickerMode === "screenshots") setForm((prev) => ({ ...prev, screenshots: [...prev.screenshots, last.driveFileId].slice(0, 10) }));
  };

  const userOptions = users.map((user) => ({
    id: user._id,
    label: user.name || user.email,
    meta: user.email,
  }));

  const createdByLabel =
    userOptions.find((user) => user.id === form.createdBy)?.label || currentUserName || "Current user";

  const collaboratorOptions = userOptions.filter((user) => user.id !== form.createdBy);
  const collaboratorEntries = form.collaborators
    .map((userId) => collaboratorOptions.find((user) => user.id === userId) || userOptions.find((user) => user.id === userId))
    .filter(Boolean);

  const addCollaborator = (userId) => {
    if (!userId) return;
    setForm((prev) => ({
      ...prev,
      collaborators: [...new Set([...prev.collaborators, userId])].slice(0, 25),
    }));
    setCollaboratorInput("");
  };

  return (
    <div className="portfolio-page">
      <header className="portfolio-page-head">
        <div>
          <span className="portfolio-kicker">{editing ? "Edit Project" : "New Project"}</span>
          <h1>{editing ? form.name || "Project" : "Add Project"}</h1>
        </div>
      </header>

      {editing && !editUnlocked ? (
        <section className="portfolio-panel portfolio-edit-lock">
          <h3>Password Required</h3>
          <p className="portfolio-muted">Confirm your CRM password to edit this project and view protected fields.</p>
          <div className="portfolio-form-actions">
            <button type="button" className="portfolio-secondary-btn" onClick={() => navigate(`/projects/${id}`)}>Cancel</button>
            <button type="button" className="portfolio-primary-btn" onClick={() => setPasswordModalOpen(true)}>Unlock Edit</button>
          </div>
        </section>
      ) : (
      <form className="portfolio-form" onSubmit={submit}>
        {error && <div className="portfolio-error">{error}</div>}

        <section className="portfolio-panel">
          <h3>General Info</h3>
          <div className="portfolio-form-grid">
            <TextField label="Name" name="name" value={form.name} onChange={setValue} maxLength={100} required />
            <TextField label="Tagline" name="tagline" value={form.tagline} onChange={setValue} maxLength={200} />
            <TextField label="Industry" name="industry" value={form.industry} onChange={setValue} />
            <label className="portfolio-form-field">Status<select name="status" value={form.status} onChange={setValue}><option value="completed">Completed</option><option value="ongoing">Ongoing</option><option value="maintenance">Maintenance</option></select></label>
            <TextField label="Start Date" name="startDate" value={form.startDate} onChange={setValue} type="date" />
            <TextField label="End Date" name="endDate" value={form.endDate} onChange={setValue} type="date" />
          </div>
          <div className="portfolio-form-grid">
            <label className="portfolio-form-field">
              Created By
              {isSuperUser ? (
                <select name="createdBy" value={form.createdBy} onChange={setValue}>
                  {!userOptions.some((user) => user.id === form.createdBy) && form.createdBy ? <option value={form.createdBy}>{createdByLabel}</option> : null}
                  {userOptions.map((user) => (
                    <option key={user.id} value={user.id}>{user.label}</option>
                  ))}
                </select>
              ) : (
                <input value={createdByLabel} readOnly />
              )}
            </label>
            <label className="portfolio-form-field">
              Collaborators
              <div className="portfolio-multi-select">
                <input
                  list="project-collaborators"
                  value={collaboratorInput}
                  onChange={(e) => setCollaboratorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const match = collaboratorOptions.find(
                      (user) =>
                        `${user.label} (${user.meta})` === collaboratorInput ||
                        user.label === collaboratorInput ||
                        user.meta === collaboratorInput
                    );
                    addCollaborator(match?.id || "");
                  }}
                  placeholder="Select a user and press Add"
                />
                <button
                  type="button"
                  className="portfolio-secondary-btn"
                  onClick={() => {
                    const match = collaboratorOptions.find(
                      (user) =>
                        `${user.label} (${user.meta})` === collaboratorInput ||
                        user.label === collaboratorInput ||
                        user.meta === collaboratorInput
                    );
                    addCollaborator(match?.id || "");
                  }}
                >
                  Add
                </button>
                <datalist id="project-collaborators">
                  {collaboratorOptions
                    .filter((user) => !form.collaborators.includes(user.id))
                    .map((user) => (
                      <option key={user.id} value={`${user.label} (${user.meta})`} />
                    ))}
                </datalist>
              </div>
              <div className="portfolio-tags">
                {collaboratorEntries.map((user) => (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        collaborators: prev.collaborators.filter((id) => id !== user.id),
                      }))
                    }
                  >
                    {user.label}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <label className="portfolio-form-field">Internal Notes<textarea name="description" value={form.description || ""} onChange={setValue} maxLength={2000} /></label>
          <label className="portfolio-form-field">Showcase Description<textarea name="showcaseDescription" value={form.showcaseDescription || ""} onChange={setValue} maxLength={500} /></label>
        </section>

        <section className="portfolio-panel">
          <h3>Client Info</h3>
          <div className="portfolio-form-grid">
            <TextField label="Client Name" name="clientName" value={form.clientName} onChange={setValue} />
            <TextField label="Client Company" name="clientCompany" value={form.clientCompany} onChange={setValue} />
            <TextField label="Client Country" name="clientCountry" value={form.clientCountry} onChange={setValue} />
            <TextField label="Client Website" name="clientWebsite" value={form.clientWebsite} onChange={setValue} />
          </div>
        </section>

        <section className="portfolio-panel">
          <h3>Links</h3>
          <div className="portfolio-form-grid">
            <TextField label="Live URL" name="liveUrl" value={form.liveUrl} onChange={setValue} />
            <TextField label="Staging URL" name="stagingUrl" value={form.stagingUrl} onChange={setValue} />
            <TextField label="GitHub URL" name="githubUrl" value={form.githubUrl} onChange={setValue} />
          </div>
        </section>

        <section className="portfolio-panel">
          <h3>Deployment</h3>
          <div className="portfolio-form-grid">
            <TextField label="Platform" name="deploymentPlatform" value={form.deploymentPlatform} onChange={setValue} />
            <TextField label="Deployment ID" name="deploymentId" value={form.deploymentId} onChange={setValue} />
            <TextField label="Deployment Password" name="deploymentPassword" value={form.deploymentPassword} onChange={setValue} />
            <label className="portfolio-form-field">Environment<select name="environment" value={form.environment} onChange={setValue}><option value="production">Production</option><option value="staging">Staging</option><option value="both">Both</option></select></label>
          </div>
          <label className="portfolio-form-field">Server Notes<textarea name="serverNotes" value={form.serverNotes || ""} onChange={setValue} /></label>
        </section>

        <section className="portfolio-panel">
          <h3>Tech Stack</h3>
          <input className="portfolio-tag-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} placeholder="Type and press Enter" />
          <div className="portfolio-tags">
            {form.techStack.map((tag) => <button type="button" key={tag} onClick={() => setForm((prev) => ({ ...prev, techStack: prev.techStack.filter((item) => item !== tag) }))}>{tag}</button>)}
          </div>
        </section>

        <section className="portfolio-panel">
          <h3>Thumbnail & Screenshots</h3>
          <div className="portfolio-settings-grid">
            <button type="button" className="portfolio-secondary-btn" onClick={() => setPickerMode("thumbnail")}>Pick Thumbnail</button>
            <button type="button" className="portfolio-secondary-btn" onClick={() => setPickerMode("screenshots")}>Add Screenshot</button>
          </div>
          <p className="portfolio-muted">Thumbnail: {form.thumbnail || "None selected"}</p>
          <p className="portfolio-muted">Screenshots: {form.screenshots.length}</p>
        </section>

        <div className="portfolio-form-actions">
          <button type="button" className="portfolio-secondary-btn" onClick={() => navigate("/projects")}>Cancel</button>
          <button type="submit" className="portfolio-primary-btn" disabled={saving}>{saving ? "Saving..." : "Save Project"}</button>
        </div>
      </form>
      )}

      <DocumentPickerModal
        open={Boolean(pickerMode)}
        projectId={null}
        onClose={() => setPickerMode(null)}
        onSelect={selectFromPicker}
      />
      <SensitiveRevealModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Confirm Edit"
        submitLabel={editUnlocked ? "Save Project" : "Unlock Edit"}
        onVerified={(password) => {
          setPasswordModalOpen(false);
          setEditUnlocked(true);
          setEditPassword(password);
          if (editUnlocked) saveProject(password);
        }}
      />
    </div>
  );
}
