import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, RotateCw, Copy, ExternalLink, Globe, AlertTriangle, Check, Loader2 } from "lucide-react";
import { apiUrl } from "../../config/api";

function WebSearchViewer() {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract router state
  const { url, title, query, results, page, searchHistoryId, clickHistoryId, fromPath } = location.state || {};

  const [embeddable, setEmbeddable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  // Visit tracking references
  const visitHistoryIdRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const intervalRef = useRef(null);

  // Redirect if no URL is provided
  useEffect(() => {
    if (!url) {
      navigate(fromPath || "/dashboard", { replace: true });
    }
  }, [url, navigate, fromPath]);

  // Step 1: Create visit log on mount
  useEffect(() => {
    if (!url || !searchHistoryId) return;

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const payload = {
      searchHistoryId,
      clickHistoryId: clickHistoryId || undefined,
      query: query || "",
      pageTitle: title || "Web Page",
      url,
      domain: new URL(url).hostname || url,
      resultPosition: location.state?.position || 0,
      viewerStatus: "loading",
      navigationType: "search_result",
      sessionId: localStorage.getItem("crm_search_session") || "session_default"
    };

    axios.post(apiUrl("/api/web-search/visit"), payload, { headers })
      .then((res) => {
        if (res.data && res.data.success) {
          visitHistoryIdRef.current = res.data.visitHistoryId;
        }
      })
      .catch((err) => {
        console.error("Failed to initialize visit tracking:", err);
      });

    // Cleanup: log page closure
    return () => {
      if (visitHistoryIdRef.current) {
        const finalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
        
        // Use modern keepalive fetch to log closure safely during page unmounts
        fetch(apiUrl(`/api/web-search/visit/${visitHistoryIdRef.current}`), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            durationSeconds: finalDuration,
            closedAt: new Date().toISOString(),
            viewerStatus: "closed"
          }),
          keepalive: true
        }).catch(() => {});
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [url, searchHistoryId]);

  // Run backend pre-flight check to see if website blocks embedding
  useEffect(() => {
    if (!url) return;

    let isMounted = true;
    setLoading(true);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios
      .get(apiUrl(`/api/web-search/check-embed?url=${encodeURIComponent(url)}`), { headers })
      .then((res) => {
        if (!isMounted) return;
        
        const isEmbeddable = res.data && res.data.success ? res.data.embeddable : true;
        setEmbeddable(isEmbeddable);
        setLoading(false);

        // Update visit log with check-embed status
        if (visitHistoryIdRef.current) {
          axios.patch(apiUrl(`/api/web-search/visit/${visitHistoryIdRef.current}`), {
            viewerStatus: isEmbeddable ? "opened" : "iframe_blocked"
          }, { headers }).catch(err => console.error(err));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Embedding pre-flight check failed:", err);
        setEmbeddable(true); // default optimistic fallback
        setLoading(false);

        if (visitHistoryIdRef.current) {
          axios.patch(apiUrl(`/api/web-search/visit/${visitHistoryIdRef.current}`), {
            viewerStatus: "opened"
          }, { headers }).catch(e => console.error(e));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url, key]);

  // Step 2: Session Heartbeat loop (every 10 seconds)
  useEffect(() => {
    if (!url || !searchHistoryId) return;

    const runHeartbeat = () => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      elapsedRef.current = elapsed;

      if (visitHistoryIdRef.current) {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        axios.patch(apiUrl(`/api/web-search/visit/${visitHistoryIdRef.current}`), {
          durationSeconds: elapsed,
          lastActive: new Date().toISOString()
        }, { headers }).catch(err => console.error("Heartbeat log update failed:", err));
      }
    };

    intervalRef.current = setInterval(runHeartbeat, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [url, searchHistoryId]);

  // Window unload listener using keepalive fetch
  useEffect(() => {
    const handleUnload = () => {
      if (visitHistoryIdRef.current) {
        const finalDuration = Math.round((Date.now() - startTimeRef.current) / 1000);
        fetch(apiUrl(`/api/web-search/visit/${visitHistoryIdRef.current}`), {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            durationSeconds: finalDuration,
            closedAt: new Date().toISOString(),
            viewerStatus: "closed"
          }),
          keepalive: true
        }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  if (!url) return null;

  const displayDomain = (() => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  })();

  const handleBack = () => {
    navigate(fromPath || "/dashboard", {
      state: {
        openSearchModal: true,
        query,
        results,
        page
      }
    });
  };

  const handleRefresh = () => {
    setKey((prev) => prev + 1);
    
    // Log refresh action
    if (visitHistoryIdRef.current) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      axios.patch(apiUrl(`/api/web-search/visit/${visitHistoryIdRef.current}`), {
        navigationType: "refresh"
      }, { headers }).catch(e => console.error(e));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy URL:", err);
      });
  };

  const handleOpenExternal = () => {
    window.open(url, "_blank", "noopener,noreferrer");

    // Log external fallback redirect
    if (visitHistoryIdRef.current) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      axios.patch(apiUrl(`/api/web-search/visit/${visitHistoryIdRef.current}`), {
        navigationType: "external_fallback",
        viewerStatus: "externally_opened"
      }, { headers }).catch(e => console.error(e));
    }
  };

  return (
    <div
      className="nc-page"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "16px",
        gap: "16px",
        boxSizing: "border-box"
      }}
    >
      {/* Search Viewer Control Header */}
      <div
        className="nc-card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          gap: "16px",
          flexWrap: "wrap"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              height: "36px"
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to results</span>
          </button>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "var(--color-text-primary)",
                maxWidth: "400px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
              title={title}
            >
              {title || "Web Page"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Globe size={12} style={{ color: "var(--color-text-muted)" }} />
              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                {displayDomain}
              </span>
            </div>
          </div>
        </div>

        {/* View Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleRefresh}
            title="Refresh iframe content"
            style={{ width: "36px", height: "36px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <RotateCw size={15} />
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy link address"}
            style={{ width: "36px", height: "36px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {copied ? <Check size={15} style={{ color: "var(--color-success)" }} /> : <Copy size={15} />}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleOpenExternal}
            title="Open original website externally"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0 12px",
              height: "36px"
            }}
          >
            <ExternalLink size={15} />
            <span style={{ fontSize: "13px" }}>Open original</span>
          </button>
        </div>
      </div>

      {/* Viewport Content */}
      <div
        className="nc-card"
        style={{
          flexGrow: 1,
          position: "relative",
          minHeight: "450px",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden"
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "var(--color-bg-surface)",
              zIndex: 10,
              gap: "12px"
            }}
          >
            <Loader2 className="animate-spin" size={24} style={{ color: "var(--color-accent)" }} />
            <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
              Checking connection...
            </span>
          </div>
        )}

        {embeddable === false ? (
          /* EMBED BLOCK FALLBACK */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexGrow: 1,
              padding: "40px 24px",
              textAlign: "center",
              gap: "16px",
              backgroundColor: "var(--color-bg-surface)"
            }}
          >
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                backgroundColor: "rgba(232, 66, 10, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AlertTriangle size={32} style={{ color: "var(--color-accent)" }} />
            </div>
            <div style={{ maxWidth: "480px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--color-text-primary)", marginBottom: "8px" }}>
                This website does not allow embedded viewing inside the CRM.
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: "1.6" }}>
                To protect user security, <strong>{displayDomain}</strong> restricts third-party systems from mounting their website inside an iframe. You can view the original page by opening it in a new browser tab.
              </p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleBack}
                style={{ height: "36px" }}
              >
                Back to Results
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleCopy}
                style={{ height: "36px" }}
              >
                Copy Link
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenExternal}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 20px"
                }}
              >
                <ExternalLink size={15} />
                <span>Open Original Website</span>
              </button>
            </div>
          </div>
        ) : (
          /* IFRAME VIEWPORT */
          <iframe
            key={key}
            src={url}
            title={title || "Embedded Web Search Viewer"}
            sandbox="allow-forms allow-scripts allow-same-origin allow-popups-to-escape-sandbox"
            style={{
              width: "100%",
              height: "100%",
              flexGrow: 1,
              border: "none",
              backgroundColor: "#ffffff"
            }}
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </div>
  );
}

export default WebSearchViewer;
