import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Facebook,
  ImagePlus,
  Instagram,
  Linkedin,
  MessageCircle,
  RefreshCw,
  Send,
  Trash2,
  Twitter,
} from "lucide-react";
import { dmApi, formatDateTime, truncate } from "./api";

const PLATFORM_META = [
  {
    key: "facebook",
    label: "Facebook",
    accountPlaceholder: "Facebook Page",
    oauthUrl: "https://oauth.placeholder.netcradus.local/facebook",
    icon: Facebook,
    color: "#1877F2",
    limit: 63206,
  },
  {
    key: "instagram",
    label: "Instagram",
    accountPlaceholder: "Instagram Handle",
    oauthUrl: "https://oauth.placeholder.netcradus.local/instagram",
    icon: Instagram,
    color: "#E4405F",
    limit: 2200,
  },
  {
    key: "x",
    label: "X (Twitter)",
    accountPlaceholder: "X Profile",
    oauthUrl: "https://oauth.placeholder.netcradus.local/x",
    icon: Twitter,
    color: "#111827",
    limit: 280,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    accountPlaceholder: "LinkedIn Page",
    oauthUrl: "https://oauth.placeholder.netcradus.local/linkedin",
    icon: Linkedin,
    color: "#0A66C2",
    limit: 63206,
  },
  {
    key: "whatsapp_business",
    label: "WhatsApp Business",
    accountPlaceholder: "WhatsApp Business",
    oauthUrl: "https://oauth.placeholder.netcradus.local/whatsapp_business",
    icon: MessageCircle,
    color: "#25D366",
    limit: 63206,
  },
];

const emptyComposer = {
  content: "",
  platforms: [],
  scheduledAt: "",
  mediaUrl: "",
};

const SocialMediaManagerPage = () => {
  const [connections, setConnections] = useState([]);
  const [posts, setPosts] = useState([]);
  const [queueFilter, setQueueFilter] = useState("all");
  const [composer, setComposer] = useState(emptyComposer);
  const [editingPostId, setEditingPostId] = useState(null);
  const fileInputRef = useRef(null);

  const loadPage = async () => {
    try {
      const [connectionsRes, postsRes] = await Promise.all([
        dmApi.get("/api/social/connections"),
        dmApi.get("/api/social/posts"),
      ]);

      setConnections(Array.isArray(connectionsRes.data) ? connectionsRes.data : []);
      setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
    } catch (error) {
      setConnections([]);
      setPosts([]);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const connectionMap = useMemo(
    () =>
      connections.reduce((acc, item) => {
        acc[item.platform] = item;
        return acc;
      }, {}),
    [connections]
  );

  const connectedPlatforms = useMemo(
    () => PLATFORM_META.filter((platform) => connectionMap[platform.key]),
    [connectionMap]
  );

  const filteredPosts = useMemo(() => {
    if (queueFilter === "all") {
      return posts;
    }
    return posts.filter((post) => post.status === queueFilter);
  }, [posts, queueFilter]);

  const handleConnect = async (platform) => {
    window.open(platform.oauthUrl, "_blank", "noopener,noreferrer");
    const accountName = window.prompt(`Enter the connected ${platform.accountPlaceholder} name`);
    if (!accountName) {
      return;
    }

    await dmApi.post("/api/social/connect", {
      platform: platform.key,
      accountName,
      accessToken: `mock-token-${platform.key}-${Date.now()}`,
    });

    loadPage();
  };

  const handleDisconnect = async (platformKey) => {
    await dmApi.delete(`/api/social/connections/${platformKey}`);
    setComposer((current) => ({
      ...current,
      platforms: current.platforms.filter((item) => item !== platformKey),
    }));
    loadPage();
  };

  const togglePlatform = (platformKey) => {
    setComposer((current) => ({
      ...current,
      platforms: current.platforms.includes(platformKey)
        ? current.platforms.filter((item) => item !== platformKey)
        : [...current.platforms, platformKey],
    }));
  };

  const handleMediaPick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const mockUrl = `mock://social-media/${encodeURIComponent(file.name)}`;
    setComposer((current) => ({ ...current, mediaUrl: mockUrl }));
    event.target.value = "";
  };

  const resetComposer = () => {
    setComposer(emptyComposer);
    setEditingPostId(null);
  };

  const savePost = async (action) => {
    if (!composer.content.trim()) {
      return;
    }

    const payload = {
      ...composer,
      action,
    };

    if (editingPostId) {
      await dmApi.patch(`/api/social/posts/${editingPostId}`, payload);
    } else {
      await dmApi.post("/api/social/posts", payload);
    }

    resetComposer();
    loadPage();
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Delete this post from the queue?")) {
      return;
    }

    await dmApi.delete(`/api/social/posts/${postId}`);
    loadPage();
  };

  const handleEdit = (post) => {
    setEditingPostId(post._id);
    setComposer({
      content: post.content || "",
      platforms: Array.isArray(post.platforms) ? post.platforms : [],
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
      mediaUrl: post.mediaUrl || "",
    });
  };

  const handleSubmitForReview = async (postId) => {
    await dmApi.post(`/api/social/posts/${postId}/submit-for-review`);
    loadPage();
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Marketing</span><ChevronRight size={10} /><span>Social Media Manager</span>
          </div>
          <h1 className="title">Social Media Manager</h1>
          <p className="subtitle">Connect channels, draft posts, and manage the publishing queue from one place.</p>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h3 style={{ fontSize: "var(--text-base)" }}>Channel Connections</h3>
          <button className="btn btn-ghost" onClick={loadPage}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)" }}>
          {PLATFORM_META.map((platform) => {
            const Icon = platform.icon;
            const connection = connectionMap[platform.key];

            return (
              <div
                key={platform.key}
                style={{
                  padding: "var(--space-5)",
                  borderRadius: "var(--radius-xl)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-bg-secondary)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, display: "grid", placeItems: "center", background: "white", color: platform.color }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: "var(--font-semibold)" }}>{platform.label}</div>
                    <div style={{ fontSize: "11px", color: connection ? "var(--color-success)" : "var(--color-text-muted)" }}>
                      {connection ? "Connected" : "Disconnected"}
                    </div>
                  </div>
                </div>
                <div style={{ minHeight: "36px", fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
                  {connection ? connection.accountName : `No ${platform.label} account linked yet.`}
                </div>
                {connection ? (
                  <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => handleDisconnect(platform.key)}>
                    Disconnect
                  </button>
                ) : (
                  <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => handleConnect(platform)}>
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", alignItems: "center", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: "var(--text-base)" }}>Post Management</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "12px", marginTop: "4px" }}>
              Connected platforms only appear in the composer. Posting still uses mock delivery for now.
            </p>
          </div>
          {editingPostId && (
            <button className="btn btn-ghost" onClick={resetComposer}>
              Cancel Edit
            </button>
          )}
        </div>

        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <textarea
            className="form-input"
            rows={5}
            placeholder="Write your post..."
            value={composer.content}
            onChange={(event) => setComposer((current) => ({ ...current, content: event.target.value }))}
          />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {PLATFORM_META.map((platform) => (
              <span
                key={platform.key}
                className={`badge ${composer.content.length > platform.limit ? "badge-danger" : "badge-neutral"}`}
              >
                {platform.label}: {composer.content.length}/{platform.limit}
              </span>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)" }}>
            <div>
              <label className="form-label">Connected Platforms</label>
              <div style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                {connectedPlatforms.map((platform) => (
                  <label key={platform.key} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "13px" }}>
                    <input
                      type="checkbox"
                      checked={composer.platforms.includes(platform.key)}
                      onChange={() => togglePlatform(platform.key)}
                    />
                    <span>{platform.label}</span>
                  </label>
                ))}
                {connectedPlatforms.length === 0 && (
                  <div style={{ color: "var(--color-text-muted)", fontSize: "12px" }}>Connect a platform to enable posting.</div>
                )}
              </div>
            </div>

            <div>
              <label className="form-label">Schedule</label>
              <input
                className="form-input"
                type="datetime-local"
                value={composer.scheduledAt}
                onChange={(event) => setComposer((current) => ({ ...current, scheduledAt: event.target.value }))}
              />
            </div>

            <div>
              <label className="form-label">Media Attachment</label>
              <input ref={fileInputRef} type="file" hidden accept="image/*,video/*" onChange={handleMediaPick} />
              <button className="btn btn-ghost" style={{ width: "100%" }} onClick={() => fileInputRef.current?.click()}>
                <ImagePlus size={14} /> Attach Media
              </button>
              <div style={{ marginTop: "var(--space-2)", fontSize: "11px", color: "var(--color-text-muted)" }}>
                {composer.mediaUrl || "No media selected"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={() => savePost("schedule")}>
              <Send size={14} /> {editingPostId ? "Update Post" : "Schedule Post"}
            </button>
            <button className="btn btn-ghost" onClick={() => savePost("post_now")}>
              <Send size={14} /> Post Now
            </button>
          </div>
        </div>
      </div>

      <div className="nc-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", alignItems: "center", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
          <h3 style={{ fontSize: "var(--text-base)" }}>Posts Queue</h3>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            {["all", "scheduled", "posted", "failed"].map((status) => (
              <button
                key={status}
                className={`btn ${queueFilter === status ? "btn-primary" : "btn-ghost"}`}
                style={{ height: "34px", textTransform: "capitalize" }}
                onClick={() => setQueueFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="nc-table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Platforms</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Approval</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post._id}>
                  <td>{truncate(post.content, 60)}</td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {(post.platforms || []).map((platform) => {
                        const platformMeta = PLATFORM_META.find((item) => item.key === platform);
                        return (
                          <span key={platform} className="badge badge-neutral">
                            {platformMeta?.label || platform}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td>{formatDateTime(post.scheduledAt || post.postedAt)}</td>
                  <td>
                    <span className={`badge ${post.status === "posted" ? "badge-success" : post.status === "failed" ? "badge-danger" : "badge-warning"}`}>
                      {post.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${post.approvalStatus === "approved" ? "badge-success" : post.approvalStatus === "rejected" ? "badge-danger" : post.approvalStatus === "pending_review" ? "badge-warning" : "badge-neutral"}`}>
                      {post.approvalStatus}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                      <button className="btn btn-ghost" style={{ height: "32px" }} onClick={() => handleEdit(post)}>Edit</button>
                      {(post.approvalStatus === "draft" || post.approvalStatus === "rejected") && (
                        <button className="btn btn-primary" style={{ height: "32px" }} onClick={() => handleSubmitForReview(post._id)}>
                          Submit
                        </button>
                      )}
                      <button className="btn btn-ghost" style={{ height: "32px", color: "var(--color-error)" }} onClick={() => handleDelete(post._id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPosts.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                    No posts in this queue yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaManagerPage;
