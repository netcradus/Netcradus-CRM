import React, { useEffect, useMemo, useState } from "react";
import { Copy, Plus, Trash2 } from "lucide-react";
import { dmApi, formatDate } from "./api";

const blankSegment = {
  name: "",
  description: "",
  estimatedSize: "",
  channel: "Email",
};

const blankUtm = {
  destinationUrl: "",
  utmSource: "",
  utmMedium: "",
  utmCampaignName: "",
  utmTerm: "",
  utmContent: "",
};

const AudiencePage = () => {
  const [activeTab, setActiveTab] = useState("segments");
  const [segments, setSegments] = useState([]);
  const [utmLinks, setUtmLinks] = useState([]);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [segmentForm, setSegmentForm] = useState(blankSegment);
  const [utmForm, setUtmForm] = useState(blankUtm);

  const loadPage = async () => {
    const [segmentsRes, utmRes] = await Promise.all([
      dmApi.get("/api/audience/segments"),
      dmApi.get("/api/utm"),
    ]);

    setSegments(Array.isArray(segmentsRes.data) ? segmentsRes.data : []);
    setUtmLinks(Array.isArray(utmRes.data) ? utmRes.data : []);
  };

  useEffect(() => {
    loadPage();
  }, []);

  const generatedUrl = useMemo(() => {
    if (!utmForm.destinationUrl) {
      return "";
    }

    try {
      const url = new URL(utmForm.destinationUrl);
      if (utmForm.utmSource) url.searchParams.set("utm_source", utmForm.utmSource);
      if (utmForm.utmMedium) url.searchParams.set("utm_medium", utmForm.utmMedium);
      if (utmForm.utmCampaignName) url.searchParams.set("utm_campaign", utmForm.utmCampaignName);
      if (utmForm.utmTerm) url.searchParams.set("utm_term", utmForm.utmTerm);
      if (utmForm.utmContent) url.searchParams.set("utm_content", utmForm.utmContent);
      return url.toString();
    } catch (error) {
      return "";
    }
  }, [utmForm]);

  const saveSegment = async (event) => {
    event.preventDefault();
    await dmApi.post("/api/audience/segments", {
      ...segmentForm,
      estimatedSize: Number(segmentForm.estimatedSize) || 0,
    });
    setSegmentForm(blankSegment);
    setShowSegmentModal(false);
    loadPage();
  };

  const saveUtm = async (event) => {
    event.preventDefault();
    await dmApi.post("/api/utm", {
      ...utmForm,
      generatedUrl,
    });
    setUtmForm(blankUtm);
    loadPage();
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Audience</h1>
          <p className="subtitle">Manage audience segments and generate campaign-safe UTM links.</p>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <button className={`btn ${activeTab === "segments" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("segments")}>Segments</button>
        <button className={`btn ${activeTab === "utm" ? "btn-primary" : "btn-ghost"}`} onClick={() => setActiveTab("utm")}>UTM Tracker</button>
      </div>

      {activeTab === "segments" ? (
        <>
          <div className="page-header" style={{ marginBottom: "var(--space-4)" }}>
            <div className="page-header-left">
              <h3 style={{ fontSize: "var(--text-base)" }}>Audience Segments</h3>
            </div>
            <div className="page-header-right">
              <button className="btn btn-primary" onClick={() => setShowSegmentModal(true)}>
                <Plus size={14} /> New Segment
              </button>
            </div>
          </div>
          <div className="nc-card">
            <table className="nc-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Estimated Size</th>
                  <th>Channel</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment._id}>
                    <td>{segment.name}</td>
                    <td>{segment.description || "--"}</td>
                    <td>{segment.estimatedSize}</td>
                    <td><span className="badge badge-neutral">{segment.channel}</span></td>
                    <td>{formatDate(segment.createdAt)}</td>
                    <td>
                      <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={async () => { await dmApi.delete(`/api/audience/segments/${segment._id}`); loadPage(); }}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {segments.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No segments saved yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-6)" }}>
          <div className="nc-card">
            <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Generate UTM Link</h3>
            <form onSubmit={saveUtm} style={{ display: "grid", gap: "var(--space-4)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
                <input className="form-input" placeholder="Destination URL" value={utmForm.destinationUrl} onChange={(event) => setUtmForm((current) => ({ ...current, destinationUrl: event.target.value }))} required />
                <input className="form-input" placeholder="UTM Source" value={utmForm.utmSource} onChange={(event) => setUtmForm((current) => ({ ...current, utmSource: event.target.value }))} required />
                <input className="form-input" placeholder="UTM Medium" value={utmForm.utmMedium} onChange={(event) => setUtmForm((current) => ({ ...current, utmMedium: event.target.value }))} required />
                <input className="form-input" placeholder="Campaign Name" value={utmForm.utmCampaignName} onChange={(event) => setUtmForm((current) => ({ ...current, utmCampaignName: event.target.value }))} required />
                <input className="form-input" placeholder="UTM Term" value={utmForm.utmTerm} onChange={(event) => setUtmForm((current) => ({ ...current, utmTerm: event.target.value }))} />
                <input className="form-input" placeholder="UTM Content" value={utmForm.utmContent} onChange={(event) => setUtmForm((current) => ({ ...current, utmContent: event.target.value }))} />
              </div>
              <div>
                <label className="form-label">Generated URL</label>
                <div className="form-input" style={{ minHeight: 44, display: "flex", alignItems: "center" }}>{generatedUrl || "--"}</div>
              </div>
              <button className="btn btn-primary" style={{ width: "fit-content" }}>Save UTM Link</button>
            </form>
          </div>
          <div className="nc-card">
            <table className="nc-table">
              <thead>
                <tr>
                  <th>Destination</th>
                  <th>Source</th>
                  <th>Medium</th>
                  <th>Campaign</th>
                  <th>Generated URL</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {utmLinks.map((link) => (
                  <tr key={link._id}>
                    <td>{link.destinationUrl}</td>
                    <td>{link.utmSource}</td>
                    <td>{link.utmMedium}</td>
                    <td>{link.utmCampaignName}</td>
                    <td>{link.generatedUrl}</td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(link.generatedUrl)}>
                          <Copy size={14} />
                        </button>
                        <button className="btn btn-ghost" style={{ color: "var(--color-error)" }} onClick={async () => { await dmApi.delete(`/api/utm/${link._id}`); loadPage(); }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {utmLinks.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No UTM links saved yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showSegmentModal && (
        <div className="nc-modal-overlay" onClick={() => setShowSegmentModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: 460 }}>
            <div className="nc-modal-header"><h3>Create Segment</h3></div>
            <form onSubmit={saveSegment} style={{ display: "grid", gap: "var(--space-4)" }}>
              <input className="form-input" placeholder="Segment name" value={segmentForm.name} onChange={(event) => setSegmentForm((current) => ({ ...current, name: event.target.value }))} required />
              <textarea className="form-input" rows={4} placeholder="Description" value={segmentForm.description} onChange={(event) => setSegmentForm((current) => ({ ...current, description: event.target.value }))} />
              <input className="form-input" type="number" placeholder="Estimated size" value={segmentForm.estimatedSize} onChange={(event) => setSegmentForm((current) => ({ ...current, estimatedSize: event.target.value }))} required />
              <select className="form-select" value={segmentForm.channel} onChange={(event) => setSegmentForm((current) => ({ ...current, channel: event.target.value }))}>
                <option value="Email">Email</option>
                <option value="Social">Social</option>
                <option value="PPC">PPC</option>
                <option value="Direct Mail">Direct Mail</option>
              </select>
              <button className="btn btn-primary">Save Segment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudiencePage;
