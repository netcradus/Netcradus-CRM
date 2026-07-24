import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, Mic, Camera, ArrowLeft, ExternalLink } from "lucide-react";

const GoogleSearchModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"
  const [retryTrigger, setRetryTrigger] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [viewUrl, setViewUrl] = useState("");

  // Listen for Escape key to close the modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus the modal when opened for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Reset landing state on modal close
  useEffect(() => {
    if (!isOpen) {
      setShowResults(false);
      setInputVal("");
      setViewUrl("");
    }
  }, [isOpen]);

  // Intercept Google CSE result links click events in capture phase to load inside modal iframe
  useEffect(() => {
    const container = document.getElementById("crm-google-search-container");
    if (!container) return;

    const handleContainerClick = (e) => {
      let target = e.target;
      while (target && target !== container) {
        if (target.tagName === "A") {
          const href = target.getAttribute("href");
          if (href && href.startsWith("http")) {
            e.preventDefault();
            e.stopPropagation();
            setViewUrl(href);
            break;
          }
        }
        target = target.parentNode;
      }
    };

    container.addEventListener("click", handleContainerClick, true);
    return () => container.removeEventListener("click", handleContainerClick, true);
  }, [status, showResults]);

  // Handle click outside to close the modal
  const handleOverlayClick = (e) => {
    // Only close if clicking overlay backdrop and not active inside built-in iframe browser
    if (e.target.classList.contains("gcse-modal-overlay")) {
      onClose();
    }
  };

  // Trigger retry attempt
  const handleRetry = () => {
    setRetryTrigger(prev => prev + 1);
  };

  // Google CSE script loading and explicit rendering lifecycle
  useEffect(() => {
    if (!isOpen) return;

    setStatus("loading");

    const renderSearchElement = () => {
      try {
        const container = document.getElementById("crm-google-search-container");
        if (!container) return false;

        // Prevent duplicate rendering
        if (container.children.length > 0) {
          setStatus("ready");
          return true;
        }

        // If the Google CSE element library is fully loaded, render explicitly
        if (window.google?.search?.cse?.element) {
          window.google.search.cse.element.render({
            div: "crm-google-search-container",
            tag: "search",
            gname: "netcradus-search",
            attributes: {
              linkTarget: "_self"
            }
          });
          setStatus("ready");
          return true;
        }
      } catch (err) {
        console.error("Failed to render Google CSE element:", err);
      }
      return false;
    };

    const scriptId = "google-cse-script";
    let script = document.getElementById(scriptId);

    const initializeSearch = () => {
      // Try rendering immediately if script was loaded already
      if (renderSearchElement()) {
        return;
      }

      // Check element loading via interval polling
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 150;
        if (renderSearchElement()) {
          clearInterval(interval);
        } else if (elapsed >= 5000) {
          clearInterval(interval);
          setStatus("error");
        }
      }, 150);

      return () => clearInterval(interval);
    };

    if (!script) {
      // Define explicit CSE rendering callback hook before loading script
      window.__gcse = {
        parsetags: "explicit",
        callback: () => {
          initializeSearch();
        }
      };

      // Load search engine script asynchronously
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cse.google.com/cse.js?cx=87ecbf7f7d83c4063";
      script.async = true;
      document.body.appendChild(script);
    } else {
      // Script is already in document body, proceed with element check
      const cleanup = initializeSearch();
      return cleanup;
    }
  }, [isOpen, retryTrigger]);

  // Execute Google Search via the element API
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    setShowResults(true);
    setViewUrl(""); // Reset active browser tab

    const executeGoogleSearch = () => {
      const element = window.google?.search?.cse?.element?.getElement("netcradus-search");
      if (element) {
        element.execute(inputVal);
      } else {
        // Retry execution up to 3 seconds if element is initializing
        const interval = setInterval(() => {
          const el = window.google?.search?.cse?.element?.getElement("netcradus-search");
          if (el) {
            el.execute(inputVal);
            clearInterval(interval);
          }
        }, 100);
        setTimeout(() => clearInterval(interval), 3000);
      }
    };

    // Delay slightly to allow the results DOM element to mount and render
    setTimeout(executeGoogleSearch, 10);
  };

  const handleReturnToHome = () => {
    setShowResults(false);
    setInputVal("");
    setViewUrl("");
  };

  const handleBackToResults = () => {
    setViewUrl("");
  };

  return createPortal(
    <div 
      className="gcse-modal-overlay" 
      onClick={handleOverlayClick}
      style={{ display: isOpen ? "flex" : "none" }}
    >
      <div 
        className="gcse-modal" 
        ref={modalRef}
        tabIndex="-1"
        style={{ outline: "none" }}
      >
        {/* Modal Close Button */}
        <button 
          type="button" 
          className="gcse-modal-close-btn" 
          onClick={onClose}
          title="Close Search"
          aria-label="Close search"
          style={{ position: "absolute", top: "16px", right: "20px", zIndex: 110 }}
        >
          <X size={18} />
        </button>

        <div 
          className="gcse-modal-body" 
          style={{ 
            display: "block", 
            overflowY: "auto", 
            minHeight: "200px",
            padding: 0,
            height: "100%"
          }}
        >
          {status === "loading" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", minHeight: "350px", color: "var(--color-text-muted)" }}>
              <span>Loading Google Search...</span>
            </div>
          )}

          {status === "error" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "350px", gap: "12px", textAlign: "center", padding: "20px" }}>
              <p style={{ fontSize: "13px", color: "var(--color-error, #ff6363)", maxWidth: "500px", lineHeight: "1.6" }}>
                Google Search could not be loaded. Please check your internet connection, browser extensions, and Programmable Search Engine configuration.
              </p>
              <button 
                type="button" 
                onClick={handleRetry}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "var(--color-accent, #e8420a)",
                  color: "#fff",
                  border: "none",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Retry
              </button>
            </div>
          )}

          {status === "ready" && viewUrl && (
            /* CASE 3: BUILT-IN IFRAME BROWSER VIEW (PREVENTS REDIRECTS TO NEW TABS) */
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div className="google-results-header-bar" style={{ gap: "12px", padding: "10px 16px", height: "54px" }}>
                <button 
                  type="button" 
                  onClick={handleBackToResults}
                  className="google-search-btn"
                  style={{ display: "flex", alignItems: "center", gap: "6px", height: "34px", padding: "0 12px" }}
                >
                  <ArrowLeft size={14} /> Back to results
                </button>
                <div 
                  className="google-custom-search-input-box" 
                  style={{ 
                    height: "34px", 
                    borderRadius: "6px", 
                    flexGrow: 1, 
                    maxWidth: "680px", 
                    opacity: 0.8,
                    cursor: "not-allowed" 
                  }}
                >
                  <input
                    type="text"
                    value={viewUrl}
                    readOnly
                    style={{ fontSize: "12px", cursor: "not-allowed" }}
                  />
                </div>
                <a 
                  href={viewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="google-search-btn"
                  title="Open in new window"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", padding: 0 }}
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              <div style={{ flexGrow: 1, height: "calc(100% - 54px)", position: "relative" }}>
                <iframe 
                  src={viewUrl} 
                  title="Built-in CRM Browser" 
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    border: "none", 
                    backgroundColor: "#ffffff" 
                  }} 
                />
              </div>
            </div>
          )}

          {status === "ready" && !viewUrl && !showResults && (
            /* CASE 1: GOOGLE HOMEPAGE UI */
            <div className="google-landing-container">
              <h1 className="netcradus-world-logo">
                <span style={{ color: "#4285F4" }}>N</span>
                <span style={{ color: "#FBBC05" }}>E</span>
                <span style={{ color: "#4285F4" }}>T</span>
                <span style={{ color: "#34A853" }}>C</span>
                <span style={{ color: "#EA4335" }}>R</span>
                <span style={{ color: "#4285F4" }}>A</span>
                <span style={{ color: "#FBBC05" }}>D</span>
                <span style={{ color: "#34A853" }}>U</span>
                <span style={{ color: "#EA4335" }}>S</span>
                <span> </span>
                <span style={{ color: "#4285F4" }}>W</span>
                <span style={{ color: "#EA4335" }}>O</span>
                <span style={{ color: "#FBBC05" }}>R</span>
                <span style={{ color: "#4285F4" }}>L</span>
                <span style={{ color: "#34A853" }}>D</span>
              </h1>

              <form onSubmit={handleSearchSubmit} className="google-custom-search-wrapper">
                <div className="google-custom-search-input-box">
                  <Search size={16} style={{ color: "var(--color-text-faint)" }} />
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Search Netcradus World or type a URL"
                    aria-label="Search Netcradus World"
                    autoFocus
                  />
                  <div className="google-search-input-icons">
                    <Mic size={16} />
                    <Camera size={16} />
                  </div>
                </div>
              </form>

              <div className="google-search-buttons-row">
                <button type="button" onClick={handleSearchSubmit} className="google-search-btn">
                  Netcradus Search
                </button>
                <button type="button" onClick={handleSearchSubmit} className="google-search-btn">
                  I'm Feeling Lucky
                </button>
              </div>
            </div>
          )}

          {status === "ready" && !viewUrl && showResults && (
            /* CASE 2: SEARCH RESULTS HEADER BAR ONLY */
            <div className="google-results-header-bar">
              <span className="google-results-logo" onClick={handleReturnToHome}>
                <span style={{ color: "#4285F4" }}>N</span>
                <span style={{ color: "#FBBC05" }}>E</span>
                <span style={{ color: "#4285F4" }}>T</span>
                <span style={{ color: "#34A853" }}>C</span>
                <span style={{ color: "#EA4335" }}>R</span>
                <span style={{ color: "#4285F4" }}>A</span>
                <span style={{ color: "#FBBC05" }}>D</span>
                <span style={{ color: "#34A853" }}>U</span>
                <span style={{ color: "#EA4335" }}>S</span>
              </span>
              
              <form onSubmit={handleSearchSubmit} style={{ flexGrow: 1, maxWidth: "580px" }}>
                <div className="google-custom-search-input-box" style={{ height: "38px", borderRadius: "19px" }}>
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Search Netcradus World or type a URL"
                  />
                  <div className="google-search-input-icons">
                    <Mic size={14} />
                    <Camera size={14} />
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Google Search Results output - ALWAYS mounted in the DOM to prevent loading failure */}
          <div 
            id="crm-google-search-container"
            data-linktarget="_self"
            style={{ 
              display: (status === "ready" && showResults && !viewUrl) ? "block" : "none",
              padding: "16px 24px",
              minHeight: "150px"
            }}
          ></div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GoogleSearchModal;
