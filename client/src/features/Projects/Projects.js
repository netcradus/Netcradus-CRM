import { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Projects.css";

const RANDOM_COLORS = [
  "#ff3e6c","#ffb020","#00d68f","#7c6dfa",
  "#f04aff","#2eb8ff","#00c9b1","#fb923c","#34d399",
];

const BASE_PROJECTS = "http://localhost:5000/api/projects";
const BASE_COLUMNS  = "http://localhost:5000/api/columns";

const getProgressLevel = (pct) => pct >= 100 ? "high" : pct >= 50 ? "mid" : "low";
const formatDate = (str) =>
  str ? new Date(str).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }) : "";

/* ------------------------------------------------------------------ Card */
function Card({ card, onDelete, onDragStart }) {
  const pct   = Number(card.progress) || 0;
  const level = getProgressLevel(pct);
  return (
    <div className="pb-card" draggable onDragStart={(e) => onDragStart(e, card._id)}>
      <div className="pb-card-top">
        <span className="pb-card-name">{card.name}</span>
        <button className="pb-card-del" onClick={() => onDelete(card._id)} title="Delete card">x</button>
      </div>
      {card.client && (
        <div className="pb-card-meta">
          <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {card.client}
        </div>
      )}
      {card.deadline && (
        <div className="pb-card-meta pb-card-meta--deadline">
          <svg viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 1v2M11 1v2M2 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {formatDate(card.deadline)}
        </div>
      )}
      <div className="pb-progress-row">
        <div className="pb-progress-track">
          <div className={`pb-progress-fill pb-progress-fill--${level}`} style={{ width:`${pct}%` }} />
        </div>
        <span className={`pb-progress-pct pb-progress-pct--${level}`}>{pct}%</span>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Column */
function Column({ col, cards, loading, onAddCard, onDeleteCard, onDeleteCol, onRenameCol, onDragStart, onDrop }) {
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [renaming,    setRenaming]    = useState(false);
  const [renameValue, setRenameValue] = useState(col.name);
  const menuRef   = useRef(null);
  const submitted = useRef(false);

  // Sync local input if parent updates col.name (after successful save)
  useEffect(() => {
    if (!renaming) setRenameValue(col.name);
  }, [col.name, renaming]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const commitRename = () => {
    if (submitted.current) return;
    submitted.current = true;
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== col.name) onRenameCol(col._id, trimmed);
    setRenaming(false);
    setMenuOpen(false);
    setTimeout(() => { submitted.current = false; }, 150);
  };

  const dragOver  = (e) => { e.preventDefault(); e.currentTarget.classList.add("is-drag-over"); };
  const dragLeave = (e) =>   e.currentTarget.classList.remove("is-drag-over");
  const drop      = (e) => { e.currentTarget.classList.remove("is-drag-over"); onDrop(e, col._id); };

  return (
    <div className="pb-col" onDragOver={dragOver} onDragLeave={dragLeave} onDrop={drop}>
      <div className="pb-col-head">
        <div className="pb-col-title-row">
          <div className="pb-col-pip" style={{ background: col.color || "#7c6dfa" }} />
          {renaming ? (
            <input
              className="pb-col-rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter")  commitRename();
                if (e.key === "Escape") { setRenaming(false); setRenameValue(col.name); }
              }}
              autoFocus
            />
          ) : (
            <span className="pb-col-name">{col.name}</span>
          )}
          <span className="pb-col-count">{cards.length}</span>
        </div>

        <div className="pb-col-menu-wrap" ref={menuRef}>
          <button
            className={`pb-col-menu-btn${menuOpen ? " is-active" : ""}`}
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            title="Column options"
          >
            <svg viewBox="0 0 4 16" fill="currentColor" width="14" height="14">
              <circle cx="2" cy="2"  r="1.5"/>
              <circle cx="2" cy="8"  r="1.5"/>
              <circle cx="2" cy="14" r="1.5"/>
            </svg>
          </button>

          {menuOpen && (
            <div className="pb-col-dropdown" onClick={(e) => e.stopPropagation()}>
              <button className="pb-dropdown-item" onClick={() => { setRenaming(true); setMenuOpen(false); }}>
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                Rename list
              </button>
              <button className="pb-dropdown-item" onClick={() => { onAddCard(col._id); setMenuOpen(false); }}>
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                Add a card
              </button>
              <div className="pb-dropdown-divider" />
              <button className="pb-dropdown-item pb-dropdown-item--danger" onClick={() => { onDeleteCol(col._id); setMenuOpen(false); }}>
                <svg viewBox="0 0 16 16" fill="none" width="13" height="13"><path d="M3 4h10M6 4V2h4v2M5 4v8a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Delete list
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pb-cards">
        {loading ? (
          <><div className="pb-skeleton" /><div className="pb-skeleton" style={{ height:52, opacity:0.4 }} /></>
        ) : cards.length === 0 ? (
          <div className="pb-empty-col">
            <svg viewBox="0 0 40 40" fill="none"><rect x="6" y="10" width="28" height="24" rx="4" stroke="currentColor" strokeWidth="1.5"/><path d="M13 6h14M20 17v10M15 22h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <p>No cards yet</p>
          </div>
        ) : (
          cards.map((card) => (
            <Card key={card._id} card={card} onDelete={onDeleteCard} onDragStart={onDragStart} />
          ))
        )}
      </div>

      <div className="pb-col-foot">
        <button className="pb-add-card-btn" onClick={() => onAddCard(col._id)}>
          <span>+</span> Add card
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- AddCardModal */
function AddCardModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name:"", client:"", deadline:"", progress:0 });
  const [saving, setSaving] = useState(false);
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));
  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave({ ...form, progress: Number(form.progress) });
    setSaving(false);
  };
  return (
    <div className="pb-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pb-modal" role="dialog" aria-modal="true">
        <div className="pb-modal-header">
          <p className="pb-modal-title">New Card</p>
          <button className="pb-modal-close" onClick={onClose}>x</button>
        </div>
        {[
          { label:"Project / Task", field:"name",     type:"text",   placeholder:"e.g. Landing page redesign", autoFocus:true },
          { label:"Client",         field:"client",   type:"text",   placeholder:"e.g. Acme Corp" },
          { label:"Deadline",       field:"deadline", type:"date",   placeholder:"" },
          { label:"Progress %",     field:"progress", type:"number", placeholder:"0 - 100" },
        ].map(({ label, field, type, placeholder, autoFocus }) => (
          <div className="pb-modal-field" key={field}>
            <label className="pb-modal-label">{label}</label>
            <input
              className="pb-modal-input" type={type} placeholder={placeholder}
              value={form[field]} onChange={set(field)}
              min={type==="number"?0:undefined} max={type==="number"?100:undefined}
              autoFocus={autoFocus||undefined}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
        ))}
        <div className="pb-modal-btns">
          <button className="pb-btn-save" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? "Saving..." : "Save Card"}
          </button>
          <button className="pb-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- AddColumnModal */
function AddColumnModal({ onSave, onClose }) {
  const [name,  setName]  = useState("");
  const [color, setColor] = useState(RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]);
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), color });
    setSaving(false);
  };
  return (
    <div className="pb-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pb-modal" role="dialog" aria-modal="true">
        <div className="pb-modal-header">
          <p className="pb-modal-title">New List</p>
          <button className="pb-modal-close" onClick={onClose}>x</button>
        </div>
        <div className="pb-modal-field">
          <label className="pb-modal-label">List Name</label>
          <input className="pb-modal-input" type="text" placeholder="e.g. In Review"
            value={name} onChange={(e) => setName(e.target.value)} autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()} />
        </div>
        <div className="pb-modal-field">
          <label className="pb-modal-label">Colour</label>
          <div className="pb-color-row">
            {RANDOM_COLORS.map((c) => (
              <button key={c} className={`pb-color-swatch${color===c?" is-active":""}`}
                style={{ background:c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <div className="pb-modal-btns">
          <button className="pb-btn-save" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Creating..." : "Create List"}
          </button>
          <button className="pb-btn-cancel" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- Main Board */
export default function Project() {
  const [columns,   setColumns]   = useState([]);
  const [projects,  setProjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [cardModal, setCardModal] = useState({ open:false, colId:null });
  const [colModal,  setColModal]  = useState(false);
  const dragCardId  = useRef(null);
  const dragFromCol = useRef(null);

  const fetchAll = async () => {
    setLoading(true); setError(null);
    try {
      const [{ data: cols }, { data: projs }] = await Promise.all([
        axios.get(BASE_COLUMNS),
        axios.get(BASE_PROJECTS),
      ]);
      setColumns(cols);
      setProjects(projs);
    } catch (err) {
      setError("Could not reach the server. Make sure your backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAll(); }, []);

  const getColProjects = (colId) =>
    projects.filter((p) => String(p.columnId?._id ?? p.columnId) === String(colId));

  const handleSaveColumn = async (formData) => {
    try {
      const { data } = await axios.post(BASE_COLUMNS, formData);
      setColumns((prev) => [...prev, data]);
    } catch (err) {
      setError("Failed to create list.");
    }
    setColModal(false);
  };

  const handleRenameCol = async (colId, newName) => {
    const prevName = columns.find((c) => c._id === colId)?.name;
    setColumns((prev) => prev.map((c) => c._id === colId ? { ...c, name: newName } : c));
    try {
      const { data } = await axios.put(`${BASE_COLUMNS}/${colId}`, { name: newName });
      setColumns((prev) => prev.map((c) => c._id === colId ? { ...c, name: data.name } : c));
    } catch (err) {
      setError(`Failed to rename: ${err.response?.data?.error || err.message}`);
      setColumns((prev) => prev.map((c) => c._id === colId ? { ...c, name: prevName } : c));
    }
  };

  const handleDeleteCol = async (colId) => {
    try {
      await axios.delete(`${BASE_COLUMNS}/${colId}`);
      setColumns((prev) => prev.filter((c) => c._id !== colId));
    } catch (err) {
      setError("Failed to delete list.");
    }
  };

  const handleSaveCard = async (colId, formData) => {
    try {
      const { data: created } = await axios.post(BASE_PROJECTS, { ...formData, columnId: colId });
      setProjects((prev) => [...prev, created]);
      setCardModal({ open:false, colId:null });
    } catch (err) {
      setError(`Failed to save card: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteCard = async (cardId) => {
    try {
      await axios.delete(`${BASE_PROJECTS}/${cardId}`);
      setProjects((prev) => prev.filter((p) => p._id !== cardId));
    } catch (err) {
      setError("Failed to delete card.");
    }
  };

  const handleDragStart = (e, cardId) => {
    dragCardId.current  = cardId;
    const card = projects.find((p) => p._id === cardId);
    dragFromCol.current = card?.columnId?._id ?? card?.columnId;
  };

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    const id = dragCardId.current, from = dragFromCol.current;
    if (!id || String(from) === String(targetColId)) return;
    setProjects((prev) => prev.map((p) => p._id === id ? { ...p, columnId: targetColId } : p));
    try {
      await axios.put(`${BASE_PROJECTS}/${id}/move`, { columnId: targetColId });
    } catch (err) {
      setError("Failed to move card.");
      setProjects((prev) => prev.map((p) => p._id === id ? { ...p, columnId: from } : p));
    }
    dragCardId.current = dragFromCol.current = null;
  };

  return (
    <div className="pb-root">
      <header className="pb-header">
        <div className="pb-logo">
          <div className="pb-logo-icon">
            <svg viewBox="0 0 20 20"><rect x="1" y="1" width="7" height="18" rx="2"/><rect x="12" y="1" width="7" height="11" rx="2"/><rect x="12" y="15" width="7" height="4" rx="2"/></svg>
          </div>
          <span className="pb-title">Project Board</span>
          <span className="pb-live-badge"><span className="pb-live-dot" />Live</span>
        </div>
        <div className="pb-header-right">
          <button className="pb-btn-primary" onClick={() => setColModal(true)}>+ Add List</button>
        </div>
      </header>

      {error && (
        <div className="pb-error">
          {error}
          <button className="pb-error-dismiss" onClick={() => setError(null)}>x</button>
        </div>
      )}

      <div className="pb-board">
        {columns.map((col) => (
          <Column
            key={col._id} col={col}
            cards={getColProjects(col._id)}
            loading={loading}
            onAddCard={(colId)  => setCardModal({ open:true, colId })}
            onDeleteCard={handleDeleteCard}
            onDeleteCol={handleDeleteCol}
            onRenameCol={handleRenameCol}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ))}
        {!loading && (
          <div className="pb-add-col-ghost" onClick={() => setColModal(true)}>
            <span>+</span><p>Add another list</p>
          </div>
        )}
      </div>

      {cardModal.open && (
        <AddCardModal
          onSave={(fd) => handleSaveCard(cardModal.colId, fd)}
          onClose={() => setCardModal({ open:false, colId:null })}
        />
      )}
      {colModal && <AddColumnModal onSave={handleSaveColumn} onClose={() => setColModal(false)} />}
    </div>
  );
}