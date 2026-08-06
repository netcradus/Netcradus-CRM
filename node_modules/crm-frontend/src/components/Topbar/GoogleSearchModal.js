import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Search, Mic, Camera, ArrowLeft, Loader2, Globe, ChevronLeft, ChevronRight, Trash2, Calendar, Filter } from "lucide-react";
import axios from "axios";
import { apiUrl } from "../../config/api";

// Helper to safely highlight query matches without dangerouslySetInnerHTML
const renderHighlightedText = (text) => {
  if (!text) return "";
  const parts = text.split(/(<b>.*?<\/b>)/g);
  return parts.map((part, index) => {
    if (part.startsWith("<b>") && part.endsWith("</b>")) {
      return (
        <strong key={index} style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>
          {part.slice(3, -4)}
        </strong>
      );
    }
    return part;
  });
};

const GoogleSearchModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("search"); // "search" | "history"

  // User details
  const userRole = localStorage.getItem("userRole") || "";
  const isSuperUser = userRole.trim().toLowerCase() === "super_user";

  // --- Search State ---
  const [status, setStatus] = useState("ready"); // "ready" | "loading" | "error"
  const [showResults, setShowResults] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [results, setResults] = useState([]);
  const [searchHistoryId, setSearchHistoryId] = useState(null);
  const [page, setPage] = useState(1);
  const [searchTime, setSearchTime] = useState(0);
  const [totalResults, setTotalResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);

  // Search details
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);
  const [answerBox, setAnswerBox] = useState(null);
  const [peopleAlsoAsk, setPeopleAlsoAsk] = useState([]);
  const [relatedSearches, setRelatedSearches] = useState([]);

  // --- History Tab State ---
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);

  // History Filters
  const [historyFilterQuery, setHistoryFilterQuery] = useState("");
  const [historyFilterPreset, setHistoryFilterPreset] = useState("all"); // "all" | "today" | "7days" | "30days" | "custom"
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");
  const [historyFilterStatus, setHistoryFilterStatus] = useState(""); // "" | "success" | "no_results" | "failed"

  // Super User Organization Filters
  const [superFilterEmployee, setSuperFilterEmployee] = useState("");
  const [superFilterDept, setSuperFilterDept] = useState("");
  const [superFilterRole, setSuperFilterRole] = useState("");

  // Deletion Confirmation Modal Overlay
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Close on Escape key
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

  // Focus modal for accessibility
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Fetch recent searches Suggestions
  const fetchRecentQueries = () => {
    const token = localStorage.getItem("token");
    axios.get(apiUrl("/api/web-search/recent"), {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (res.data && res.data.success) {
        setRecentSearches(res.data.history || []);
      }
    })
    .catch(err => {
      console.error("Failed to load recent searches:", err);
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecentQueries();
    }
  }, [isOpen]);

  // Restore Search Modal State (if coming back from Viewer)
  useEffect(() => {
    if (isOpen && location.state?.openSearchModal) {
      const state = location.state;
      setInputVal(state.query || "");
      setResults(state.results || []);
      setPage(state.page || 1);
      setShowResults(true);
      setStatus("ready");
      setActiveTab("search");

      // Reset the navigation state immediately
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [isOpen, location, navigate]);

  // Reset landing state on modal close
  useEffect(() => {
    if (!isOpen) {
      setShowResults(false);
      setInputVal("");
      setResults([]);
      setSearchHistoryId(null);
      setPage(1);
      setSearchTime(0);
      setTotalResults(null);
      setErrorMsg("");
      setKnowledgeGraph(null);
      setAnswerBox(null);
      setPeopleAlsoAsk([]);
      setRelatedSearches([]);
      setActiveTab("search");
      setShowConfirmClear(false);
    }
  }, [isOpen]);

  // Fetch History logs
  const fetchHistory = () => {
    setHistoryLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    // Calculate dates based on preset
    let finalDateFrom = historyDateFrom;
    let finalDateTo = historyDateTo;

    if (historyFilterPreset !== "custom") {
      const now = new Date();
      if (historyFilterPreset === "today") {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        finalDateFrom = todayStart.toISOString();
        finalDateTo = now.toISOString();
      } else if (historyFilterPreset === "7days") {
        const start7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        finalDateFrom = start7.toISOString();
        finalDateTo = now.toISOString();
      } else if (historyFilterPreset === "30days") {
        const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        finalDateFrom = start30.toISOString();
        finalDateTo = now.toISOString();
      } else {
        finalDateFrom = "";
        finalDateTo = "";
      }
    }

    const params = {
      page: historyPage,
      limit: 8,
      query: historyFilterQuery || undefined,
      dateFrom: finalDateFrom || undefined,
      dateTo: finalDateTo || undefined,
      status: historyFilterStatus || undefined,
      employee: isSuperUser && superFilterEmployee ? superFilterEmployee : undefined,
      department: isSuperUser && superFilterDept ? superFilterDept : undefined,
      role: isSuperUser && superFilterRole ? superFilterRole : undefined
    };

    axios.get(apiUrl("/api/web-search/history"), { headers, params })
      .then(res => {
        if (res.data && res.data.success) {
          setHistoryList(res.data.data || []);
          setHistoryTotalPages(res.data.pagination?.pages || 1);
          setHistoryTotalCount(res.data.pagination?.total || 0);
        }
        setHistoryLoading(false);
      })
      .catch(err => {
        console.error("Failed to load search logs:", err);
        setHistoryLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && activeTab === "history") {
      fetchHistory();
    }
  }, [isOpen, activeTab, historyPage, historyFilterPreset, historyDateFrom, historyDateTo, historyFilterStatus, superFilterEmployee, superFilterDept, superFilterRole]);

  // Handle click outside backdrop
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains("gcse-modal-overlay")) {
      onClose();
    }
  };

  // Submit Search Query
  const handleSearchSubmit = (e, targetPage = 1) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    setStatus("loading");
    setErrorMsg("");
    setShowResults(true);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios.post(apiUrl("/api/web-search"), {
      query: inputVal.trim(),
      page: targetPage,
      sessionId: localStorage.getItem("crm_search_session") || "session_default"
    }, { headers })
    .then((res) => {
      if (res.data && res.data.success) {
        setResults(res.data.results || []);
        setSearchHistoryId(res.data.searchHistoryId || null);
        setPage(res.data.page || targetPage);
        setSearchTime(res.data.searchTimeMs || 0);
        setTotalResults(res.data.totalResults || null);
        setKnowledgeGraph(res.data.knowledgeGraph || null);
        setAnswerBox(res.data.answerBox || null);
        setPeopleAlsoAsk(res.data.peopleAlsoAsk || []);
        setRelatedSearches(res.data.relatedSearches || []);
        setStatus("ready");
        fetchRecentQueries();
      } else {
        setResults([]);
        setSearchHistoryId(null);
        setStatus("ready");
        setErrorMsg("No matching results were found.");
      }
    })
    .catch((err) => {
      console.error("Search execution failed:", err);
      setStatus("error");
      setErrorMsg(err.response?.data?.message || "Search service is temporarily unavailable.");
    });
  };

  // Submit Lucky Query
  const handleLuckySubmit = (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;

    setStatus("loading");
    setErrorMsg("");
    setShowResults(true);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios.post(apiUrl("/api/web-search"), {
      query: inputVal.trim(),
      page: 1,
      sessionId: localStorage.getItem("crm_search_session") || "session_default"
    }, { headers })
    .then((res) => {
      if (res.data && res.data.success && res.data.results && res.data.results.length > 0) {
        const firstResult = res.data.results[0];

        // Track Click & navigate to internal viewer directly
        axios.post(apiUrl("/api/web-search/click"), {
          searchHistoryId: res.data.searchHistoryId,
          query: inputVal.trim(),
          resultTitle: firstResult.title,
          resultUrl: firstResult.url,
          resultDomain: firstResult.displayUrl || "",
          resultPosition: firstResult.position,
          openMethod: "iframe",
          sessionId: localStorage.getItem("crm_search_session") || "session_default"
        }, { headers })
        .then((clickRes) => {
          navigate("/dashboard/web-search/view", {
            state: {
              url: firstResult.url,
              title: firstResult.title,
              query: inputVal.trim(),
              results: res.data.results,
              page: 1,
              searchHistoryId: res.data.searchHistoryId,
              clickHistoryId: clickRes.data.clickHistoryId,
              fromPath: location.pathname
            }
          });
          onClose();
        })
        .catch(() => {
          navigate("/dashboard/web-search/view", {
            state: {
              url: firstResult.url,
              title: firstResult.title,
              query: inputVal.trim(),
              results: res.data.results,
              page: 1,
              searchHistoryId: res.data.searchHistoryId,
              clickHistoryId: null,
              fromPath: location.pathname
            }
          });
          onClose();
        });
      } else {
        setResults([]);
        setSearchHistoryId(null);
        setStatus("ready");
        setErrorMsg("No matching results were found.");
      }
    })
    .catch((err) => {
      console.error("Search execution failed:", err);
      setStatus("error");
      setErrorMsg(err.response?.data?.message || "Search service is temporarily unavailable.");
    });
  };

  // Click Search Result
  const handleResultClick = (result, method = "iframe") => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    if (!searchHistoryId) {
      // Opt-out logic fallback
      navigate("/dashboard/web-search/view", {
        state: {
          url: result.url,
          title: result.title,
          query: inputVal.trim(),
          results,
          page,
          searchHistoryId: null,
          clickHistoryId: null,
          fromPath: location.pathname
        }
      });
      onClose();
      return;
    }

    axios.post(apiUrl("/api/web-search/click"), {
      searchHistoryId,
      query: inputVal.trim(),
      resultTitle: result.title,
      resultUrl: result.url,
      resultDomain: result.displayUrl || "",
      resultPosition: result.position,
      openMethod: method,
      sessionId: localStorage.getItem("crm_search_session") || "session_default"
    }, { headers })
    .then((clickRes) => {
      navigate("/dashboard/web-search/view", {
        state: {
          url: result.url,
          title: result.title,
          query: inputVal.trim(),
          results,
          page,
          searchHistoryId,
          clickHistoryId: clickRes.data.clickHistoryId,
          fromPath: location.pathname
        }
      });
      onClose();
    })
    .catch(() => {
      navigate("/dashboard/web-search/view", {
        state: {
          url: result.url,
          title: result.title,
          query: inputVal.trim(),
          results,
          page,
          searchHistoryId,
          clickHistoryId: null,
          fromPath: location.pathname
        }
      });
      onClose();
    });
  };

  // Clicking Recent Search Tags
  const handleRecentClick = (queryText) => {
    setInputVal(queryText);
    setStatus("loading");
    setErrorMsg("");
    setShowResults(true);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios.post(apiUrl("/api/web-search"), {
      query: queryText,
      page: 1,
      sessionId: localStorage.getItem("crm_search_session") || "session_default"
    }, { headers })
    .then((res) => {
      if (res.data && res.data.success) {
        setResults(res.data.results || []);
        setSearchHistoryId(res.data.searchHistoryId || null);
        setPage(1);
        setSearchTime(res.data.searchTimeMs || 0);
        setTotalResults(res.data.totalResults || null);
        setKnowledgeGraph(res.data.knowledgeGraph || null);
        setAnswerBox(res.data.answerBox || null);
        setPeopleAlsoAsk(res.data.peopleAlsoAsk || []);
        setRelatedSearches(res.data.relatedSearches || []);
        setStatus("ready");
      } else {
        setResults([]);
        setSearchHistoryId(null);
        setStatus("ready");
        setErrorMsg("No matching results were found.");
      }
    })
    .catch((err) => {
      setStatus("error");
      setErrorMsg(err.response?.data?.message || "Search service is temporarily unavailable.");
    });
  };

  // Clicking History items
  const handleHistoryItemClick = (historyItem) => {
    setInputVal(historyItem.query);
    setActiveTab("search");
    setShowResults(false);
  };

  // Soft Delete History Item
  const handleDeleteHistory = (historyId, e) => {
    if (e) e.stopPropagation();
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios.delete(apiUrl(`/api/web-search/history/${historyId}`), { headers })
      .then(() => {
        fetchHistory();
        fetchRecentQueries();
      })
      .catch((err) => {
        console.error("Failed to delete history item:", err);
      });
  };

  // Clear All Search Logs (Soft Delete)
  const handleClearAllHistory = () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    axios.delete(apiUrl("/api/web-search/history"), { headers })
      .then(() => {
        setShowConfirmClear(false);
        fetchHistory();
        fetchRecentQueries();
      })
      .catch((err) => {
        console.error("Failed to clear history:", err);
      });
  };

  const handleReturnToHome = () => {
    setShowResults(false);
    setInputVal("");
    setResults([]);
    setSearchHistoryId(null);
    setPage(1);
    setSearchTime(0);
    setTotalResults(null);
    setErrorMsg("");
    setKnowledgeGraph(null);
    setAnswerBox(null);
    setPeopleAlsoAsk([]);
    setRelatedSearches([]);
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

        {/* Tab Header Selector */}
        <div style={{ display: "flex", gap: "24px", padding: "16px 24px 0", borderBottom: "1px solid var(--color-border)", zIndex: 100 }}>
          <button
            type="button"
            onClick={() => setActiveTab("search")}
            style={{
              fontSize: "14px",
              fontWeight: "600",
              background: "none",
              border: "none",
              color: activeTab === "search" ? "var(--color-accent)" : "var(--color-text-muted)",
              borderBottom: activeTab === "search" ? "2px solid var(--color-accent)" : "2px solid transparent",
              paddingBottom: "8px",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              setHistoryPage(1);
            }}
            style={{
              fontSize: "14px",
              fontWeight: "600",
              background: "none",
              border: "none",
              color: activeTab === "history" ? "var(--color-accent)" : "var(--color-text-muted)",
              borderBottom: activeTab === "history" ? "2px solid var(--color-accent)" : "2px solid transparent",
              paddingBottom: "8px",
              cursor: "pointer",
              transition: "all 0.15s"
            }}
          >
            History
          </button>
        </div>

        {/* Modal Scrollable Container */}
        <div
          className="gcse-modal-body"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "calc(100% - 47px)",
            padding: 0,
            overflow: "hidden"
          }}
        >
          {/* ======================================================== */}
          {/* TAB 1: SEARCH TAB */}
          {/* ======================================================== */}
          {activeTab === "search" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              {/* Sticky top headers if results are showing */}
              {showResults && (
                <div className="google-results-header-bar" style={{ display: "flex", alignItems: "center", gap: "20px", padding: "12px 24px", borderBottom: "1px solid var(--color-border)", zIndex: 100 }}>
                  <span className="google-results-logo" onClick={handleReturnToHome} style={{ userSelect: "none" }}>
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

                  <form onSubmit={(e) => handleSearchSubmit(e, 1)} style={{ flexGrow: 1, maxWidth: "580px" }}>
                    <div className="google-custom-search-input-box" style={{ height: "38px", borderRadius: "19px" }}>
                      <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        placeholder="Search Netcradus World..."
                        disabled={status === "loading"}
                      />
                      <div className="google-search-input-icons">
                        <Mic size={14} />
                        <Camera size={14} />
                      </div>
                    </div>
                  </form>

                  {status === "loading" && (
                    <Loader2 className="animate-spin" size={16} style={{ color: "var(--color-accent)" }} />
                  )}
                </div>
              )}

              {/* Scrollable results view */}
              <div
                style={{
                  flexGrow: 1,
                  overflowY: "auto",
                  padding: showResults ? "20px 24px 24px" : 0,
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {!showResults ? (
                  /* Landing Homepage View */
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

                    <form onSubmit={(e) => handleSearchSubmit(e, 1)} className="google-custom-search-wrapper">
                      <div className="google-custom-search-input-box">
                        <Search size={16} style={{ color: "var(--color-text-faint)" }} />
                        <input
                          type="text"
                          value={inputVal}
                          onChange={(e) => setInputVal(e.target.value)}
                          placeholder="Search Netcradus World..."
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
                      <button
                        type="button"
                        onClick={(e) => handleSearchSubmit(e, 1)}
                        className="google-search-btn"
                      >
                        Netcradus Search
                      </button>
                      <button
                        type="button"
                        onClick={handleLuckySubmit}
                        className="google-search-btn"
                      >
                        I'm Feeling Lucky
                      </button>
                    </div>

                    {/* DEDUPLICATED SUGGESTIONS tags */}
                    {recentSearches.length > 0 && (
                      <div style={{ marginTop: "32px", textAlign: "center", width: "100%", maxWidth: "580px" }}>
                        <h3 style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-muted)", marginBottom: "12px", fontWeight: "700" }}>
                          Recent Searches
                        </h3>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px" }}>
                          {recentSearches.map((item, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleRecentClick(item.query)}
                              className="google-search-btn"
                              style={{ borderRadius: "16px", padding: "4px 12px", fontSize: "12px" }}
                            >
                              {item.query}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Results Cards View */
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "750px", margin: "0 auto" }}>
                    {status === "loading" && results.length === 0 && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px" }}>
                        <Loader2 className="animate-spin" size={24} style={{ color: "var(--color-accent)" }} />
                        <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                          Searching Netcradus World...
                        </span>
                      </div>
                    )}

                    {status === "error" && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px", padding: "20px", textAlign: "center" }}>
                        <p style={{ fontSize: "13px", color: "var(--color-error, #ff6363)", maxWidth: "500px", lineHeight: "1.6" }}>
                          {errorMsg}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => handleSearchSubmit(e, page)}
                          className="google-search-btn"
                          style={{ padding: "8px 20px", backgroundColor: "var(--color-accent, #e8420a)", color: "#fff" }}
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {status !== "loading" && results.length === 0 && !errorMsg && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", gap: "12px" }}>
                        <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                          No matching results were found.
                        </span>
                      </div>
                    )}

                    {results.length > 0 && (
                      <>
                        <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                          {totalResults ? `About ${totalResults.toLocaleString()} results` : `${results.length} results`} ({searchTime / 1000} seconds)
                        </div>

                        {/* Answer Box */}
                        {answerBox && (
                          <div
                            style={{
                              padding: "16px",
                              borderRadius: "12px",
                              border: "1px solid var(--color-border)",
                              backgroundColor: "rgba(66, 133, 244, 0.05)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px"
                            }}
                          >
                            <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", color: "#4285F4" }}>
                              Quick Answer: {answerBox.title}
                            </span>
                            <div style={{ fontSize: "18px", fontWeight: "500", color: "var(--color-text-primary)", lineHeight: "1.4" }}>
                              {renderHighlightedText(answerBox.answer)}
                            </div>
                          </div>
                        )}

                        {/* Knowledge Panel */}
                        {knowledgeGraph && (
                          <div
                            style={{
                              padding: "16px",
                              borderRadius: "12px",
                              border: "1px solid var(--color-border)",
                              backgroundColor: "var(--color-bg-surface)",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px"
                            }}
                          >
                            <h4 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "var(--color-text-primary)" }}>
                              {knowledgeGraph.title}
                            </h4>
                            {knowledgeGraph.type && (
                              <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                                {knowledgeGraph.type}
                              </span>
                            )}
                            <p style={{ fontSize: "13px", color: "var(--color-text-secondary)", margin: 0, lineHeight: "1.5" }}>
                              {knowledgeGraph.description}
                            </p>
                          </div>
                        )}

                        {/* Result Cards */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                          {results.map((result, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleResultClick(result, "iframe")}
                              style={{
                                padding: "16px",
                                borderRadius: "12px",
                                border: "1px solid var(--color-border)",
                                backgroundColor: "var(--color-bg-surface)",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--color-accent)";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--color-border)";
                                e.currentTarget.style.boxShadow = "none";
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {result.favicon ? (
                                  <img
                                    src={result.favicon}
                                    alt=""
                                    style={{ width: "16px", height: "16px", borderRadius: "4px" }}
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <Globe size={14} style={{ color: "var(--color-text-muted)" }} />
                                )}
                                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: "500" }}>
                                  {result.displayUrl}
                                </span>
                                <span style={{ fontSize: "11px", color: "var(--color-text-faint)" }}>
                                  #{result.position}
                                </span>
                              </div>

                              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "var(--color-accent, #e8420a)", margin: 0 }}>
                                {renderHighlightedText(result.title)}
                              </h3>

                              <span style={{ fontSize: "11px", color: "var(--color-text-muted)", wordBreak: "break-all" }}>
                                {result.url}
                              </span>

                              <p style={{ fontSize: "13px", color: "var(--color-text-primary)", margin: 0, lineHeight: "1.5" }}>
                                {renderHighlightedText(result.snippet)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* People Also Ask */}
                        {peopleAlsoAsk.length > 0 && (
                          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: "600", color: "var(--color-text-primary)", margin: 0 }}>
                              People also ask
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              {peopleAlsoAsk.map((item, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => handleResultClick({ url: item.url, title: item.question, displayUrl: "", position: 0 }, "iframe")}
                                  style={{
                                    padding: "12px 16px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--color-border)",
                                    backgroundColor: "var(--color-bg-surface)",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    color: "var(--color-text-primary)",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center"
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
                                >
                                  <span>{item.question}</span>
                                  <ChevronRight size={14} style={{ color: "var(--color-text-muted)" }} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related Keywords */}
                        {relatedSearches.length > 0 && (
                          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: "600", color: "var(--color-text-primary)", margin: 0 }}>
                              Related searches
                            </h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {relatedSearches.map((item, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleRecentClick(item)}
                                  className="google-search-btn"
                                  style={{ borderRadius: "16px", padding: "6px 16px" }}
                                >
                                  {item}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Search Paging */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={(e) => handleSearchSubmit(e, page - 1)}
                            disabled={page <= 1 || status === "loading"}
                            style={{ display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <ChevronLeft size={16} /> Prev
                          </button>
                          <span style={{ fontSize: "13px", color: "var(--color-text-primary)", fontWeight: "600" }}>
                            Page {page}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={(e) => handleSearchSubmit(e, page + 1)}
                            disabled={status === "loading" || results.length < 10}
                            style={{ display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            Next <ChevronRight size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: HISTORY TAB */}
          {/* ======================================================== */}
          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              {/* History Search/Filter Controls Bar */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--color-border)",
                  backgroundColor: "var(--color-bg-surface)",
                  gap: "12px"
                }}
              >
                {/* Search within history */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center", width: "100%" }}>
                  <div style={{ position: "relative", flexGrow: 1 }}>
                    <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                    <input
                      type="text"
                      value={historyFilterQuery}
                      onChange={(e) => {
                        setHistoryFilterQuery(e.target.value);
                        setHistoryPage(1);
                      }}
                      placeholder="Search query in history..."
                      style={{
                        width: "100%",
                        padding: "8px 12px 8px 34px",
                        borderRadius: "6px",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-bg-base)",
                        fontSize: "13px",
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Clear all logs action */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmClear(true)}
                    className="btn btn-ghost"
                    style={{
                      color: "var(--color-error, #ff6363)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "13px",
                      padding: "8px 12px",
                      height: "36px"
                    }}
                  >
                    <Trash2 size={14} /> Clear all history
                  </button>
                </div>

                {/* Filters Row */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  {/* Preset Selector */}
                  <div style={{ display: "flex", gap: "4px" }}>
                    {[
                      { key: "all", label: "All time" },
                      { key: "today", label: "Today" },
                      { key: "7days", label: "Last 7 days" },
                      { key: "30days", label: "Last 30 days" },
                      { key: "custom", label: "Custom" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          setHistoryFilterPreset(item.key);
                          setHistoryPage(1);
                        }}
                        style={{
                          fontSize: "11px",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: historyFilterPreset === item.key ? "var(--color-accent)" : "var(--color-bg-hover)",
                          color: historyFilterPreset === item.key ? "#fff" : "var(--color-text-secondary)",
                          fontWeight: "600"
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Pickers */}
                  {historyFilterPreset === "custom" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                      <Calendar size={12} style={{ color: "var(--color-text-muted)" }} />
                      <input
                        type="date"
                        value={historyDateFrom}
                        onChange={(e) => {
                          setHistoryDateFrom(e.target.value);
                          setHistoryPage(1);
                        }}
                        style={{ padding: "3px 6px", border: "1px solid var(--color-border)", borderRadius: "4px", backgroundColor: "var(--color-bg-base)", fontSize: "11px" }}
                      />
                      <span>to</span>
                      <input
                        type="date"
                        value={historyDateTo}
                        onChange={(e) => {
                          setHistoryDateTo(e.target.value);
                          setHistoryPage(1);
                        }}
                        style={{ padding: "3px 6px", border: "1px solid var(--color-border)", borderRadius: "4px", backgroundColor: "var(--color-bg-base)", fontSize: "11px" }}
                      />
                    </div>
                  )}

                  {/* Status Dropdown */}
                  <select
                    value={historyFilterStatus}
                    onChange={(e) => {
                      setHistoryFilterStatus(e.target.value);
                      setHistoryPage(1);
                    }}
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "var(--color-bg-base)",
                      fontSize: "12px",
                      color: "var(--color-text-primary)",
                      outline: "none"
                    }}
                  >
                    <option value="">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="no_results">No Results</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Organization Filters (Super User Only) */}
                {isSuperUser && (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", borderTop: "1px solid var(--color-border)", paddingTop: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Employee ID:</span>
                      <input
                        type="text"
                        placeholder="Search ObjectId..."
                        value={superFilterEmployee}
                        onChange={(e) => {
                          setSuperFilterEmployee(e.target.value);
                          setHistoryPage(1);
                        }}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-bg-base)",
                          fontSize: "12px",
                          width: "140px"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Dept:</span>
                      <input
                        type="text"
                        placeholder="e.g. Sales"
                        value={superFilterDept}
                        onChange={(e) => {
                          setSuperFilterDept(e.target.value);
                          setHistoryPage(1);
                        }}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-bg-base)",
                          fontSize: "12px",
                          width: "100px"
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Role:</span>
                      <input
                        type="text"
                        placeholder="e.g. manager"
                        value={superFilterRole}
                        onChange={(e) => {
                          setSuperFilterRole(e.target.value);
                          setHistoryPage(1);
                        }}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-bg-base)",
                          fontSize: "12px",
                          width: "100px"
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable list */}
              <div
                style={{
                  flexGrow: 1,
                  overflowY: "auto",
                  padding: "16px 24px"
                }}
              >
                {historyLoading && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "10px" }}>
                    <Loader2 className="animate-spin" size={20} style={{ color: "var(--color-accent)" }} />
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>Loading history logs...</span>
                  </div>
                )}

                {!historyLoading && historyList.length === 0 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>No search history records found.</span>
                  </div>
                )}

                {!historyLoading && historyList.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {historyList.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => handleHistoryItemClick(item)}
                        style={{
                          padding: "14px 16px",
                          borderRadius: "10px",
                          border: "1px solid var(--color-border)",
                          backgroundColor: "var(--color-bg-surface)",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "all 0.15s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexGrow: 1 }}>
                          {/* Query & stats */}
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--color-text-primary)" }}>
                              {item.query}
                            </span>
                            <span style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: item.searchStatus === "success" ? "rgba(52, 168, 83, 0.1)" : "rgba(234, 67, 53, 0.1)",
                              color: item.searchStatus === "success" ? "var(--color-success)" : "var(--color-error)",
                              fontWeight: "600"
                            }}>
                              {item.searchStatus}
                            </span>
                          </div>

                          {/* Stats metadata */}
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", fontSize: "11px", color: "var(--color-text-muted)" }}>
                            <span>{new Date(item.searchedAt).toLocaleString("en-GB")}</span>
                            <span>•</span>
                            <span>{item.resultCount} results</span>
                            {item.clickCount > 0 && (
                              <>
                                <span>•</span>
                                <span style={{ color: "var(--color-success)" }}>{item.clickCount} click{item.clickCount > 1 ? "s" : ""}</span>
                              </>
                            )}
                            {item.lastOpenedDomain && (
                              <>
                                <span>•</span>
                                <span>Last visited: <strong>{item.lastOpenedDomain}</strong></span>
                              </>
                            )}
                          </div>

                          {/* Super User log auditing details */}
                          {isSuperUser && item.user && (
                            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                              Logged by: <strong>{item.user.name}</strong> ({item.user.role} | {item.user.department})
                            </div>
                          )}
                        </div>

                        {/* Individual delete history log */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteHistory(item._id, e)}
                          title="Delete from history"
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-text-faint)",
                            cursor: "pointer",
                            padding: "6px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s"
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--color-error)"; e.currentTarget.style.backgroundColor = "var(--color-bg-hover)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--color-text-faint)"; e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}

                    {/* History pagination footer */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "16px" }}>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setHistoryPage((p) => Math.max(p - 1, 1))}
                        disabled={historyPage <= 1 || historyLoading}
                        style={{ display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <ChevronLeft size={16} /> Prev
                      </button>
                      <span style={{ fontSize: "12px", color: "var(--color-text-primary)", fontWeight: "600" }}>
                        Page {historyPage} of {historyTotalPages} ({historyTotalCount} items)
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setHistoryPage((p) => Math.min(p + 1, historyTotalPages))}
                        disabled={historyPage >= historyTotalPages || historyLoading}
                        style={{ display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clear All Confirmation Modal Overlay */}
        {showConfirmClear && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 120,
              padding: "20px"
            }}
          >
            <div
              className="nc-card"
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                backgroundColor: "var(--color-bg-surface)"
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "var(--color-text-primary)", margin: 0 }}>
                Clear Search History?
              </h3>
              <p style={{ fontSize: "13px", color: "var(--color-text-muted)", margin: 0, lineHeight: "1.5" }}>
                Are you sure you want to clear your search history? This action is permanent and cannot be undone. Click logs and visit durations will be preserved as audit archives.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowConfirmClear(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleClearAllHistory}
                  style={{ backgroundColor: "var(--color-error, #ff6363)", borderColor: "var(--color-error, #ff6363)", color: "#fff" }}
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default GoogleSearchModal;
