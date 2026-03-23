import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Projects.css";

// ─── Column structure only — no hardcoded card data ──────────────────────────
const COLUMN_DEFS = [
  { id: "pending",   title: "Pending",   color: "#ff3e6c", statusFilter: "Pending"   },
  { id: "ongoing",   title: "Ongoing",   color: "#ffb020", statusFilter: "Ongoing"   },
  { id: "completed", title: "Completed", color: "#00d68f", statusFilter: "Completed" },
  { id: "todo",      title: "To Do",     color: "#7c6dfa", statusFilter: "To Do"       },
  { id: "bugs",      title: "Bugs",      color: "#f04aff", statusFilter: "Bugs"        },
  { id: "solutions", title: "Solutions", color: "#2eb8ff", statusFilter: "Solutions"       },
  { id: "ideas",     title: "New Ideas", color: "#00c9b1", statusFilter: "Ideas"        },
];

const RANDOM_COLORS = ["#e879f9", "#34d399", "#fb923c", "#38bdf8", "#facc15", "#f87171", "#a3e635"];
const BASE_URL      = "http://localhost:5000/api/projects";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getProgressLevel = (pct) => pct >= 100 ? "high" : pct >= 50 ? "mid" : "low";

const badgeClass = (status = "") => `pb-badge pb-badge--${status.toLowerCase()}`;

const formatDate = (str) =>
  str ? new Date(str).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Card ────────────────────────────────────────────────────────────────────
function Card({ card, onDelete, onDragStart }) {
  const pct   = Number(card.progress) || 0;
  const level = getProgressLevel(pct);

  return (
    <div className="pb-card" draggable onDragStart={(e) => onDragStart(e, card._id)}>
      <div className="pb-card-top">
        <span className="pb-card-name">{card.name}</span>
        <button className="pb-card-del" onClick={() => onDelete(card._id)} aria-label="Delete">×</button>
      </div>
      <div className="pb-card-mid">
        <span className={badgeClass(card.status)}>{card.status}</span>
        <span className="pb-card-client">{card.client}</span>
      </div>
      <div className="pb-card-deadline">Due {formatDate(card.deadline)}</div>
      <div className="pb-progress-track">
        <div className={`pb-progress-fill pb-progress-fill--${level}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`pb-progress-pct pb-progress-pct--${level}`}>{pct}%</div>
    </div>
  );
}

// ─── Column ──────────────────────────────────────────────────────────────────
function Column({ col, cards, loading, onAddCard, onDeleteCard, onDeleteCol, onDragStart, onDrop }) {
  const dragOver  = (e) => { e.preventDefault(); e.currentTarget.classList.add("is-drag-over"); };
  const dragLeave = (e) =>   e.currentTarget.classList.remove("is-drag-over");
  const drop      = (e) => { e.currentTarget.classList.remove("is-drag-over"); onDrop(e, col.id); };

  return (
    <div className="pb-col" onDragOver={dragOver} onDragLeave={dragLeave} onDrop={drop}>
      <div className="pb-col-head">
        <div className="pb-col-title-row">
          <div className="pb-col-pip" style={{ background: col.color }} />
          <span className="pb-col-name">{col.title}</span>
          <span className="pb-col-count">{cards.length}</span>
        </div>
        <button className="pb-col-menu-btn" onClick={() => onDeleteCol(col.id)} title="Remove column">⋯</button>
      </div>

      <div className="pb-cards">
        {loading ? (
          <>
            <div className="pb-skeleton" />
            <div className="pb-skeleton" style={{ height: 50, opacity: 0.5 }} />
          </>
        ) : cards.length === 0 ? (
          <p className="pb-empty-col">No cards yet.<br />Drop one here or add below.</p>
        ) : (
          cards.map((card) => (
            <Card key={card._id} card={card} onDelete={onDeleteCard} onDragStart={onDragStart} />
          ))
        )}
      </div>

      <div className="pb-col-foot">
        <button className="pb-add-placeholder" onClick={() => onAddCard(col.id)}>Add a card…</button>
        <button className="pb-add-card-btn"    onClick={() => onAddCard(col.id)}>+ Add card</button>
      </div>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
function AddCardModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", client: "", status: "Pending", deadline: "", progress: 0 });
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="pb-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pb-modal" role="dialog" aria-modal="true">
        <p className="pb-modal-title">Add Card</p>

        {[
          { label: "Project / Task", field: "name",     type: "text",   placeholder: "e.g. Landing page redesign" },
          { label: "Client",         field: "client",   type: "text",   placeholder: "e.g. Acme Corp"             },
          { label: "Deadline",       field: "deadline", type: "date",   placeholder: ""                           },
          { label: "Progress %",     field: "progress", type: "number", placeholder: "0 – 100"                    },
        ].map(({ label, field, type, placeholder }) => (
          <div className="pb-modal-field" key={field}>
            <label className="pb-modal-label">{label}</label>
            <input
              className="pb-modal-input"
              type={type}
              placeholder={placeholder}
              value={form[field]}
              onChange={set(field)}
              min={type === "number" ? 0 : undefined}
              max={type === "number" ? 100 : undefined}
              autoFocus={field === "name"}
            />
          </div>
        ))}

        <div className="pb-modal-field">
          <label className="pb-modal-label">Status</label>
          <select className="pb-modal-select" value={form.status} onChange={set("status")}>
            <option>Pending</option>
            <option>Ongoing</option>
            <option>Completed</option>
             <option>To Do</option>
             <option>Bugs</option> 
              <option>Solutions</option>
               <option>Completed</option>
          </select>
        </div>

        <div className="pb-modal-btns">
          <button className="pb-btn-save"   onClick={() => form.name.trim() && onSave({ ...form, progress: Number(form.progress) })}>
            Save Card
          </button>
          <button className="pb-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Board ───────────────────────────────────────────────────────────────
export default function Project() {
  const [projects,    setProjects]    = useState([]);
  const [colDefs,     setColDefs]     = useState(COLUMN_DEFS);
  const [colCards,    setColCards]    = useState(() =>
    Object.fromEntries(COLUMN_DEFS.map((c) => [c.id, []]))
  );
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [modal,       setModal]       = useState({ open: false, colId: null });
  const [newColName,  setNewColName]  = useState("");

  const dragCardId  = useRef(null);
  const dragFromCol = useRef(null);

  // ── Fetch from backend ──────────────────────────────────────────────────────
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(BASE_URL);
      setProjects(data);

      // Distribute into status-based columns; leave manual cols intact
      setColCards((prev) => {
        const next = { ...prev };
        COLUMN_DEFS.filter((d) => d.statusFilter).forEach((d) => { next[d.id] = []; });

        data.forEach((p) => {
          const target = COLUMN_DEFS.find((d) => d.statusFilter === p.status);
          if (target) next[target.id] = [...(next[target.id] || []), p._id];
        });
        return next;
      });
    } catch (err) {
      console.error(err);
      setError("Could not reach the server. Make sure your backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  // ── Derived stats (computed from live data) ─────────────────────────────────
  const total     = projects.length;
  const ongoing   = projects.filter((p) => p.status === "Ongoing").length;
  const completed = projects.filter((p) => p.status === "Completed").length;
  const pending   = projects.filter((p) => p.status === "Pending").length;

  const getColProjects = (colId) =>
    (colCards[colId] || []).map((id) => projects.find((p) => p._id === id)).filter(Boolean);

  // ── Add card → POST ─────────────────────────────────────────────────────────
  const handleSaveCard = async (colId, formData) => {
    try {
      const { data: created } = await axios.post(BASE_URL, formData);
      setProjects((prev) => [...prev, created]);
      setColCards((prev) => ({ ...prev, [colId]: [...(prev[colId] || []), created._id] }));
    } catch (err) {
      console.error(err);
      setError("Failed to save card.");
    }
    setModal({ open: false, colId: null });
  };

  // ── Delete card → DELETE ────────────────────────────────────────────────────
  const handleDeleteCard = async (cardId) => {
    try {
      await axios.delete(`${BASE_URL}/${cardId}`);
      setProjects((prev) => prev.filter((p) => p._id !== cardId));
      setColCards((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((col) => { next[col] = next[col].filter((id) => id !== cardId); });
        return next;
      });
    } catch (err) {
      console.error(err);
      setError("Failed to delete card.");
    }
  };

  // ── Column management (client-side) ─────────────────────────────────────────
  const handleAddColumn = () => {
    if (!newColName.trim()) return;
    const id    = `custom_${Date.now()}`;
    const color = RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
    setColDefs((prev) => [...prev, { id, title: newColName.trim(), color, statusFilter: null }]);
    setColCards((prev) => ({ ...prev, [id]: [] }));
    setNewColName("");
  };

  const handleDeleteCol = (colId) => {
    setColDefs((prev)  => prev.filter((c) => c.id !== colId));
    setColCards((prev) => { const n = { ...prev }; delete n[colId]; return n; });
  };

  // ── Drag & drop ─────────────────────────────────────────────────────────────
  const handleDragStart = (e, cardId) => {
    dragCardId.current  = cardId;
    dragFromCol.current = Object.keys(colCards).find((col) => colCards[col].includes(cardId));
  };

  const handleDrop = (e, targetColId) => {
    e.preventDefault();
    const id   = dragCardId.current;
    const from = dragFromCol.current;
    if (!id || from === targetColId) return;
    setColCards((prev) => ({
      ...prev,
      [from]:        (prev[from] || []).filter((x) => x !== id),
      [targetColId]: [...(prev[targetColId] || []), id],
    }));
    dragCardId.current = dragFromCol.current = null;
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="pb-root">

      {/* Header */}
      <header className="pb-header">
        <div className="pb-logo">
          <div className="pb-logo-icon">
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="7" height="18" rx="2"/>
              <rect x="12" y="1" width="7" height="11" rx="2"/>
              <rect x="12" y="15" width="7" height="4" rx="2"/>
            </svg>
          </div>
          <span className="pb-title">Project Board</span>
          <span className="pb-live-badge"><span className="pb-live-dot" />Live</span>
        </div>

        <div className="pb-header-right">
          <input
            className="pb-col-input"
            placeholder="New column name…"
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddColumn()}
          />
          <button className="pb-btn-primary" onClick={handleAddColumn}>+ Column</button>
        </div>
      </header>

      {error && <p className="pb-error">⚠ {error}</p>}

      {/* Summary — driven entirely by live fetched data */}
      <div className="pb-summary">
        <div className="pb-stat pb-stat--total">
          <span className="pb-stat-label">Total</span>
          <span className="pb-stat-value">{total}</span>
        </div>
        <div className="pb-stat pb-stat--ongoing">
          <span className="pb-stat-label">Ongoing</span>
          <span className="pb-stat-value">{ongoing}</span>
        </div>
        <div className="pb-stat pb-stat--done">
          <span className="pb-stat-label">Completed</span>
          <span className="pb-stat-value">{completed}</span>
        </div>
        <div className="pb-stat pb-stat--pending">
          <span className="pb-stat-label">Pending</span>
          <span className="pb-stat-value">{pending}</span>
        </div>
      </div>

      {/* Kanban board */}
      <div className="pb-board">
        {colDefs.map((col) => (
          <Column
            key={col.id}
            col={col}
            cards={getColProjects(col.id)}
            loading={loading}
            onAddCard={(colId)  => setModal({ open: true, colId })}
            onDeleteCard={handleDeleteCard}
            onDeleteCol={handleDeleteCol}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
      </div>

      {/* Modal */}
      {modal.open && (
        <AddCardModal
          onSave={(formData) => handleSaveCard(modal.colId, formData)}
          onClose={() => setModal({ open: false, colId: null })}
        />
      )}
    </div>
  );
}