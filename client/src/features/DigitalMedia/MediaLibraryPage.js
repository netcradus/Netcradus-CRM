import React, { useEffect, useRef, useState } from "react";
import { Copy, FileText, Film, Image as ImageIcon, Search, Upload } from "lucide-react";
import { dmApi, formatDate, truncate } from "./api";

const MediaLibraryPage = () => {
  const [assets, setAssets] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const fileInputRef = useRef(null);

  const loadLibrary = async () => {
    const [assetsRes, campaignsRes] = await Promise.all([
      dmApi.get("/api/media", { params: { search, type: typeFilter } }),
      dmApi.get("/api/campaigns"),
    ]);

    setAssets(Array.isArray(assetsRes.data) ? assetsRes.data : []);
    setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
  };

  useEffect(() => {
    loadLibrary();
  }, [search, typeFilter]);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const tagsInput = window.prompt("Enter tags separated by commas", "");
    const tags = String(tagsInput || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    await dmApi.post("/api/media", {
      filename: file.name,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
      tags,
      url: `mock://media/${encodeURIComponent(file.name)}`,
    });

    event.target.value = "";
    loadLibrary();
  };

  const getTypeIcon = (fileType) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon size={18} />;
    }
    if (fileType.startsWith("video/")) {
      return <Film size={18} />;
    }
    return <FileText size={18} />;
  };

  const formatFileSize = (size) => {
    if (!size) {
      return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    let value = size;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const handleLinkCampaign = async (assetId, campaignId) => {
    await dmApi.patch(`/api/media/${assetId}/link-campaign`, {
      linkedCampaigns: campaignId ? [campaignId] : [],
    });
    loadLibrary();
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Media Library</h1>
          <p className="subtitle">Store campaign-ready assets, copy references, and associate files with active work.</p>
        </div>
        <div className="page-header-right" style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <input ref={fileInputRef} type="file" hidden onChange={handleUpload} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Upload Asset
          </button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", display: "grid", gridTemplateColumns: "minmax(0, 1fr) 200px", gap: "var(--space-4)" }}>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by filename or tag" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <select className="form-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="all">All</option>
          <option value="images">Images</option>
          <option value="videos">Videos</option>
          <option value="documents">Documents</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
        {assets.map((asset) => (
          <div key={asset._id} className="nc-card" style={{ display: "grid", gap: "var(--space-3)" }}>
            <div style={{ height: 132, borderRadius: "var(--radius-lg)", background: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(16,185,129,0.12))", display: "grid", placeItems: "center" }}>
              {getTypeIcon(asset.fileType)}
            </div>
            <div>
              <div style={{ fontWeight: "var(--font-semibold)", marginBottom: "4px" }}>{truncate(asset.filename, 34)}</div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                {formatDate(asset.createdAt)} · {formatFileSize(asset.fileSize)}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(asset.tags || []).map((tag) => (
                <span key={tag} className="badge badge-neutral">{tag}</span>
              ))}
              {asset.tags?.length === 0 && <span className="badge badge-neutral">No tags</span>}
            </div>
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(asset.url)}>
                <Copy size={14} /> Copy Link
              </button>
              <div style={{ display: "grid", gap: "6px" }}>
                <label className="form-label">Link to Campaign</label>
                <select className="form-select" value={asset.linkedCampaigns?.[0]?._id || ""} onChange={(event) => handleLinkCampaign(asset._id, event.target.value)}>
                  <option value="">None</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign._id} value={campaign._id}>{campaign.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
        {assets.length === 0 && (
          <div className="nc-card" style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--color-text-muted)" }}>
            No assets matched your current search.
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaLibraryPage;
