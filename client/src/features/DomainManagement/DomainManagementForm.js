import React, { useState, useEffect } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { apiUrl } from "../../config/api";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const HOSTING_OPTIONS = [
  "DigitalOcean",
  "AWS",
  "Vercel",
  "Netlify",
  "Render",
  "Railway",
  "Hostinger",
  "Other"
];

export default function DomainManagementForm({ record, onClose, onSave, onSubmittingChange }) {
  const [project, setProject] = useState("");
  const [repository, setRepository] = useState("");
  const [domain, setDomain] = useState("");
  const [frontend, setFrontend] = useState("");
  const [backend, setBackend] = useState("");
  const [api, setApi] = useState("");
  const [hosting, setHosting] = useState("DigitalOcean");
  const [customHosting, setCustomHosting] = useState("");
  const [ownerUser, setOwnerUser] = useState("");

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch users for the owner selector dropdown
  useEffect(() => {
    setLoadingUsers(true);
    setUsersError("");
    axios.get(apiUrl("/api/auth/users"), { headers: getHeaders() })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setUsers(list);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        setUsersError("Unable to load employees.");
      })
      .finally(() => {
        setLoadingUsers(false);
      });
  }, []);

  // Pre-fill form if editing
  useEffect(() => {
    if (record) {
      setProject(record.project || "");
      setRepository(record.repository || "");
      setDomain(record.domain || "");
      setFrontend(record.frontend || "");
      setBackend(record.backend || "");
      setApi(record.api || "");
      
      const isPredefined = HOSTING_OPTIONS.slice(0, -1).includes(record.hosting);
      if (isPredefined) {
        setHosting(record.hosting);
        setCustomHosting("");
      } else {
        setHosting("Other");
        setCustomHosting(record.hosting || "");
      }
      setOwnerUser(record.ownerUser?._id || record.ownerUser || "");
    }
  }, [record]);

  const isValidUrl = (urlStr) => {
    if (!urlStr) return false;
    try {
      const url = new URL(urlStr);
      return ["http:", "https:"].includes(url.protocol);
    } catch (_) {
      return false;
    }
  };

  const cleanDomainName = (domainStr) => {
    if (!domainStr) return "";
    let cleaned = domainStr.trim().toLowerCase();
    cleaned = cleaned.replace(/^(https?:\/\/)?(www\.)?/, "");
    cleaned = cleaned.split("/")[0];
    return cleaned;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    // Validate empty checks
    const finalProject = project.trim();
    const finalRepo = repository.trim();
    const cleanedDomain = cleanDomainName(domain);
    const finalFrontend = frontend.trim();
    const finalBackend = backend.trim();
    const finalApi = api.trim();
    const finalHosting = hosting === "Other" ? customHosting.trim() : hosting;
    const finalOwner = ownerUser;

    if (!finalProject || !finalRepo || !cleanedDomain || !finalFrontend || !finalBackend || !finalApi || !finalHosting || !finalOwner) {
      setFormError("All fields are required.");
      return;
    }

    // URL validations
    if (!isValidUrl(finalRepo)) {
      setFormError("Repository must be a valid URL (including http:// or https://).");
      return;
    }
    if (!isValidUrl(finalFrontend)) {
      setFormError("Frontend URL must be a valid URL (including http:// or https://).");
      return;
    }
    if (!isValidUrl(finalBackend)) {
      setFormError("Backend URL must be a valid URL (including http:// or https://).");
      return;
    }
    if (!isValidUrl(finalApi)) {
      setFormError("API URL must be a valid URL (including http:// or https://).");
      return;
    }

    setIsSubmitting(true);
    if (onSubmittingChange) onSubmittingChange(true);
    const payload = {
      project: finalProject,
      repository: finalRepo,
      domain: cleanedDomain,
      frontend: finalFrontend,
      backend: finalBackend,
      api: finalApi,
      hosting: finalHosting,
      ownerUser: finalOwner
    };

    try {
      if (record?._id) {
        // Edit Record
        const response = await axios.patch(apiUrl(`/api/domain-management/${record._id}`), payload, { headers: getHeaders() });
        onSave(response.data.data);
      } else {
        // Add Record
        const response = await axios.post(apiUrl("/api/domain-management"), payload, { headers: getHeaders() });
        onSave(response.data.data);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save record.";
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
      if (onSubmittingChange) onSubmittingChange(false);
    }
  };

  return (
    <form id="domain-mgmt-form" onSubmit={handleSubmit}>
      {formError && (
        <div style={{ padding: "var(--space-3)", marginBottom: "var(--space-4)", background: "rgba(239, 68, 68, 0.05)", border: "1px solid var(--color-error)", borderRadius: "var(--border-radius-md)", color: "var(--color-error)", fontSize: "var(--text-sm)" }}>
          {formError}
        </div>
      )}

      <div className="form-grid-layout">
        <div className="form-field">
          <label className="form-label">Project Name</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Netcradus CRM" 
            value={project} 
            onChange={(e) => setProject(e.target.value)} 
            required 
          />
        </div>

        <div className="form-field">
          <label className="form-label">Primary Domain</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. netcradus.tech" 
            value={domain} 
            onChange={(e) => setDomain(e.target.value)} 
            required 
          />
        </div>

        <div className="form-field form-full-width">
          <label className="form-label">Repository URL</label>
          <input 
            type="url" 
            className="form-control" 
            placeholder="e.g. https://github.com/netcradus/Netcradus-CRM" 
            value={repository} 
            onChange={(e) => setRepository(e.target.value)} 
            required 
          />
        </div>

        <div className="form-field">
          <label className="form-label">Frontend Deployment URL</label>
          <input 
            type="url" 
            className="form-control" 
            placeholder="e.g. https://netcradus.tech" 
            value={frontend} 
            onChange={(e) => setFrontend(e.target.value)} 
            required 
          />
        </div>

        <div className="form-field">
          <label className="form-label">Backend Deployment URL</label>
          <input 
            type="url" 
            className="form-control" 
            placeholder="e.g. https://goldfish-app-62dia.ondigitalocean.app" 
            value={backend} 
            onChange={(e) => setBackend(e.target.value)} 
            required 
          />
        </div>

        <div className="form-field">
          <label className="form-label">API Base URL</label>
          <input 
            type="url" 
            className="form-control" 
            placeholder="e.g. https://netcradus.tech/api" 
            value={api} 
            onChange={(e) => setApi(e.target.value)} 
            required 
          />
        </div>

        <div className="form-field">
          <label className="form-label">Hosting Provider</label>
          <select 
            className="form-select" 
            value={hosting} 
            onChange={(e) => setHosting(e.target.value)} 
            required
          >
            {HOSTING_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {hosting === "Other" && (
          <div className="form-field form-full-width">
            <label className="form-label">Custom Hosting Provider</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Enter custom hosting name" 
              value={customHosting} 
              onChange={(e) => setCustomHosting(e.target.value)} 
              required 
            />
          </div>
        )}

        <div className="form-field form-full-width">
          <label className="form-label">Assigned Developer</label>
          {loadingUsers ? (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Loading employees list...</div>
          ) : usersError ? (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-error)" }}>{usersError}</div>
          ) : (
            <select 
              className="form-select" 
              value={ownerUser} 
              onChange={(e) => setOwnerUser(e.target.value)} 
              required
            >
              <option value="">Select Employee</option>
              {users
                .filter(u => u.isDisabled !== true && u.role !== 'partner')
                .map((u) => {
                  const idStr = u.userId ? ` — ${u.userId}` : "";
                  const deptStr = u.department ? ` — ${u.department}` : "";
                  return (
                    <option key={u._id} value={u._id}>
                      {u.name || u.email}{idStr}{deptStr}
                    </option>
                  );
                })}
            </select>
          )}
        </div>
      </div>
    </form>
  );
}
