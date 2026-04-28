import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Lock, LockOpen, Pencil, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";
import "./PasswordManager.css";

const EMPTY_FORM = {
  accountName: "",
  username: "",
  userEmail: "",
  password: "",
  confirmPassword: "",
  description: "",
};

const MASKED = "••••••••••••";

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

function PasswordManager() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [verifyState, setVerifyState] = useState({
    open: false,
    password: "",
    error: "",
    attemptsRemaining: 3,
  });
  const [pendingAction, setPendingAction] = useState(null);
  const [reAuthToken, setReAuthToken] = useState("");
  const [unlockedRows, setUnlockedRows] = useState({});
  const [isPrinting, setIsPrinting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        q: query,
        sortBy,
        order,
      });
      const response = await fetch(apiUrl(`/api/password-manager/list?${params.toString()}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to load password credentials.");
      setRows(payload.rows || []);
      setTotal(payload.total || 0);
    } catch (fetchError) {
      setError(fetchError.message || "Unable to load password credentials.");
    } finally {
      setLoading(false);
    }
  }, [limit, order, page, query, sortBy]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRows();
    }, 250);
    return () => clearTimeout(timeout);
  }, [fetchRows]);

  useEffect(() => {
    const interval = setInterval(() => {
      setUnlockedRows((current) => {
        const next = { ...current };
        let changed = false;
        Object.entries(next).forEach(([key, value]) => {
          if (new Date(value.expiresAt).getTime() <= Date.now()) {
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : current;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);
    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, []);

  const visibleRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((row) => (statusFilter === "unlocked" ? Boolean(unlockedRows[row._id]) : !unlockedRows[row._id]));
  }, [rows, statusFilter, unlockedRows]);

  const openProtectedAction = (type, row) => {
    setPendingAction({ type, row });
    setVerifyState({ open: true, password: "", error: "", attemptsRemaining: 3 });
  };

  const closeVerify = () => {
    setVerifyState({ open: false, password: "", error: "", attemptsRemaining: 3 });
    setPendingAction(null);
  };

  const openEditor = (row = null, unlockedPassword = "") => {
    setEditingRow(row);
    setForm(
      row
        ? {
            accountName: row.accountName || "",
            username: row.username || "",
            userEmail: row.userEmail || "",
            password: unlockedPassword || "",
            confirmPassword: unlockedPassword || "",
            description: row.description || "",
          }
        : EMPTY_FORM
    );
    setShowEditor(true);
  };

  const verifyPassword = async () => {
    const response = await fetch(apiUrl("/api/password-manager/verify-password"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ password: verifyState.password }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setVerifyState((current) => ({
        ...current,
        error: payload.message || "Verification failed.",
        attemptsRemaining: payload.attemptsRemaining ?? current.attemptsRemaining,
      }));
      return null;
    }
    setReAuthToken(payload.reAuthToken);
    return payload.reAuthToken;
  };

  const fetchUnlockedValue = async (id, token) => {
    const response = await fetch(apiUrl(`/api/password-manager/view/${id}`), {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "X-ReAuth-Token": token,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "Unable to unlock credential.");
    return payload;
  };

  const runProtectedAction = async (action, token) => {
    if (!action) return;
    if (action.type === "unlock") {
      const payload = await fetchUnlockedValue(action.row._id, token);
      setUnlockedRows((current) => ({ ...current, [action.row._id]: payload }));
      return;
    }
    if (action.type === "edit") {
      const payload = await fetchUnlockedValue(action.row._id, token);
      openEditor(action.row, payload.password);
      return;
    }
    if (action.type === "delete") {
      const response = await fetch(apiUrl(`/api/password-manager/delete/${action.row._id}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-ReAuth-Token": token,
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to delete credential.");
      fetchRows();
    }
  };

  const handleVerifySubmit = async (event) => {
    event.preventDefault();
    try {
      const token = await verifyPassword();
      if (!token) return;
      const action = pendingAction;
      closeVerify();
      await runProtectedAction(action, token);
    } catch (verifyError) {
      setVerifyState((current) => ({ ...current, error: verifyError.message || "Verification failed." }));
    }
  };

  const submitEditor = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }
    try {
      const endpoint = editingRow
        ? `/api/password-manager/update/${editingRow._id}`
        : "/api/password-manager/create";
      const response = await fetch(apiUrl(endpoint), {
        method: editingRow ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          ...(editingRow ? { "X-ReAuth-Token": reAuthToken } : {}),
        },
        body: JSON.stringify({
          accountName: form.accountName,
          username: form.username,
          userEmail: form.userEmail,
          password: form.password,
          description: form.description,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "Unable to save credential.");
      setShowEditor(false);
      setEditingRow(null);
      setForm(EMPTY_FORM);
      fetchRows();
    } catch (submitError) {
      setError(submitError.message || "Unable to save credential.");
    }
  };

  const exportCsv = () => {
    const content = ["Account Name,Username,User Email", ...visibleRows.map((row) => `"${row.accountName}","${row.username}","${row.userEmail}"`)].join("\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "password-manager.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const copyPassword = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      setError("Unable to copy password.");
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortBy(field);
    setOrder("asc");
  };

  return (
    <section className="password-manager">
      <div className="password-manager-hero">
        <div>
          <p className="password-manager-breadcrumb">Security / Password Manager</p>
          <h1>Password Manager</h1>
          <p>Store account name, username, email, and password safely. Only passwords require re-verification to view.</p>
        </div>
        <button className="pm-primary-btn" onClick={() => openEditor()}>Add New Password</button>
      </div>

      <div className="password-manager-toolbar">
        <input
          type="search"
          placeholder="Search by account, username, or email"
          value={query}
          onChange={(event) => {
            setPage(1);
            setQuery(event.target.value);
          }}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All</option>
          <option value="locked">Locked</option>
          <option value="unlocked">Unlocked</option>
        </select>
        <select value={limit} onChange={(event) => setLimit(Number(event.target.value))}>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <button className="pm-secondary-btn" onClick={exportCsv}>Export CSV</button>
        <button className="pm-secondary-btn" onClick={() => window.print()}>Print</button>
      </div>

      {error && <div className="pm-alert">{error}</div>}

      <div className="pm-data-shell">
        {loading ? (
          <div className="pm-state">Loading...</div>
        ) : (
          <>
            <table className="pm-table">
              <thead>
                <tr>
                  <th onClick={() => toggleSort("accountName")}>Account Name</th>
                  <th onClick={() => toggleSort("username")}>Username</th>
                  <th onClick={() => toggleSort("userEmail")}>User Email</th>
                  <th>Notes</th>
                  <th>Password</th>
                  <th>Locked</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="pm-state">No credentials found.</td>
                  </tr>
                ) : (
                  visibleRows.map((row) => {
                    const unlocked = unlockedRows[row._id];
                    const passwordText = unlocked && !isPrinting ? unlocked.password : MASKED;
                    return (
                      <tr key={row._id}>
                        <td>{row.accountName}</td>
                        <td>{row.username}</td>
                        <td>{row.userEmail}</td>
                        <td>{row.description || "N/A"}</td>
                        <td>
                          <div className="pm-password-cell">
                            <span>{passwordText}</span>
                            {unlocked && !isPrinting && (
                              <>
                                <button type="button" className="pm-icon-btn" onClick={() => copyPassword(unlocked.password)} aria-label="Copy password">
                                  <Copy size={14} />
                                </button>
                                <button
                                  type="button"
                                  className="pm-icon-btn"
                                  onClick={() =>
                                    setUnlockedRows((current) => {
                                      const next = { ...current };
                                      delete next[row._id];
                                      return next;
                                    })
                                  }
                                >
                                  Lock Now
                                </button>
                              </>
                            )}
                          </div>
                          {unlocked && !isPrinting && <small className="pm-unlock-meta">Unlocked at: {formatDateTime(unlocked.unlockedAt)}</small>}
                        </td>
                        <td>
                          <div className="pm-actions">
                            <button type="button" className="pm-icon-btn" onClick={() => openProtectedAction("unlock", row)}>
                              {unlocked ? <LockOpen size={16} color="#10b981" /> : <Lock size={16} color="#3b82f6" />}
                            </button>
                            <button type="button" className="pm-icon-btn" onClick={() => openProtectedAction("edit", row)}>
                              <Pencil size={16} color="#3b82f6" />
                            </button>
                            <button
                              type="button"
                              className="pm-icon-btn"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this password entry?")) {
                                  openProtectedAction("delete", row);
                                }
                              }}
                            >
                              <Trash2 size={16} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="pm-mobile-list">
              {visibleRows.map((row) => {
                const unlocked = unlockedRows[row._id];
                const passwordText = unlocked && !isPrinting ? unlocked.password : MASKED;
                return (
                  <article key={row._id} className="pm-mobile-card">
                    <div className="pm-mobile-line"><span>Account</span><strong>{row.accountName}</strong></div>
                    <div className="pm-mobile-line"><span>Username</span><strong>{row.username}</strong></div>
                    <div className="pm-mobile-line"><span>Email</span><strong>{row.userEmail}</strong></div>
                    <div className="pm-mobile-line"><span>Notes</span><strong>{row.description || "N/A"}</strong></div>
                    <div className="pm-mobile-line"><span>Password</span><strong>{passwordText}</strong></div>
                    <div className="pm-actions">
                      <button type="button" className="pm-icon-btn" onClick={() => openProtectedAction("unlock", row)}>
                        {unlocked ? <LockOpen size={16} color="#10b981" /> : <Lock size={16} color="#3b82f6" />}
                      </button>
                      <button type="button" className="pm-icon-btn" onClick={() => openProtectedAction("edit", row)}>
                        <Pencil size={16} color="#3b82f6" />
                      </button>
                      <button
                        type="button"
                        className="pm-icon-btn"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this password entry?")) {
                            openProtectedAction("delete", row);
                          }
                        }}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="pm-pagination">
        <span>Showing {total === 0 ? 0 : (page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}</span>
        <div className="pm-pagination-actions">
          <button type="button" className="pm-secondary-btn" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
          <span>{page} / {totalPages}</span>
          <button type="button" className="pm-secondary-btn" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>

      {verifyState.open &&
        createPortal(
          <div className="pm-modal-backdrop">
            <div className="pm-modal">
              <h3>Verify Your Identity</h3>
              <p>To view or manage this password, please enter your super user password.</p>
              <form onSubmit={handleVerifySubmit}>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  value={verifyState.password}
                  onChange={(event) => setVerifyState((current) => ({ ...current, password: event.target.value }))}
                  required
                />
                <small>{verifyState.attemptsRemaining} attempts remaining</small>
                {verifyState.error && <p className="pm-alert pm-alert-inline">{verifyState.error}</p>}
                <div className="pm-modal-actions">
                  <button type="button" className="pm-secondary-btn" onClick={closeVerify}>Cancel</button>
                  <button type="submit" className="pm-primary-btn">Verify & Unlock</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {showEditor &&
        createPortal(
          <div className="pm-modal-backdrop">
            <div className="pm-modal pm-modal-wide">
              <h3>{editingRow ? "Edit Password Entry" : "Add Password Entry"}</h3>
              <form className="pm-form" onSubmit={submitEditor}>
                <label>
                  <span>Account Name</span>
                  <input value={form.accountName} onChange={(event) => setForm((current) => ({ ...current, accountName: event.target.value }))} required />
                </label>
                <label>
                  <span>Username</span>
                  <input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} required />
                </label>
                <label>
                  <span>User Email</span>
                  <input type="email" value={form.userEmail} onChange={(event) => setForm((current) => ({ ...current, userEmail: event.target.value }))} required />
                </label>
                <label>
                  <span>Password</span>
                  <input
                    type="text"
                    autoComplete={editingRow ? "current-password" : "new-password"}
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  <span>Confirm Password</span>
                  <input
                    type="text"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    required
                  />
                </label>
                <label className="pm-form-wide">
                  <span>Description / Notes</span>
                  <textarea
                    placeholder="Add optional notes like client portal, hosting login, or internal remarks"
                    value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  />
                </label>
                <div className="pm-modal-actions pm-form-wide">
                  <button type="button" className="pm-secondary-btn" onClick={() => setShowEditor(false)}>Cancel</button>
                  <button type="submit" className="pm-primary-btn">{editingRow ? "Save Changes" : "Create Entry"}</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}

export default PasswordManager;
