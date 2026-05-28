import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
 
const PRESET_COLORS = ["#1e293b", "#115e59", "#312e81", "#334155"];
const DEFAULT_COLOR = PRESET_COLORS[0];
 
const WorkspaceWidget = () => {
  const [activeTab, setActiveTab] = useState("notes");
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notesFetched, setNotesFetched] = useState(false);
  const [tasksFetched, setTasksFetched] = useState(false);
 
  const token = localStorage.getItem("token");
 
  useEffect(() => {
    if (activeTab === "notes" && !notesFetched) {
      fetchNotes();
    } else if (activeTab === "tasks" && !tasksFetched) {
      fetchTasks();
    }
  }, [activeTab]);
 
  const fetchNotes = async () => {
    try {
      const res = await axios.get(apiUrl("/api/workspace/notes"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotes(res.data.data);
        setNotesFetched(true);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
    }
  };
 
  const fetchTasks = async () => {
    try {
      const res = await axios.get(apiUrl("/api/workspace/tasks"), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTasks(res.data.data);
        setTasksFetched(true);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };
 
  const handleAddNote = async () => {
    const tempId = `temp-${Date.now()}`;
    const newNote = { _id: tempId, content: "", color: DEFAULT_COLOR, isEditing: true };
   
    setNotes(prev => [newNote, ...prev]);
   
    try {
      const res = await axios.post(apiUrl("/api/workspace/notes"), { content: "", color: DEFAULT_COLOR }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setNotes(prev => prev.map(n => n._id === tempId ? { ...res.data.data, isEditing: true } : n));
      }
    } catch (err) {
      console.error("Failed to add note:", err);
      setNotes(prev => prev.filter(n => n._id !== tempId));
    }
  };
 
  const handleUpdateNote = async (id, updates) => {
    setNotes(prev => prev.map(n => n._id === id ? { ...n, ...updates } : n));
   
    if (!id.startsWith("temp-")) {
      try {
        await axios.patch(apiUrl(`/api/workspace/notes/${id}`), updates, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to update note:", err);
      }
    }
  };
 
  const handleDeleteNote = async (id) => {
    const prevNotes = [...notes];
    setNotes(prev => prev.filter(n => n._id !== id));
   
    if (!id.startsWith("temp-")) {
      try {
        await axios.delete(apiUrl(`/api/workspace/notes/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to delete note:", err);
        setNotes(prevNotes);
      }
    }
  };
 
  const handleAddTask = async (e) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      const label = e.target.value.trim();
      e.target.value = "";
     
      const tempId = `temp-${Date.now()}`;
      const newTask = { _id: tempId, label, completed: false };
     
      setTasks(prev => [newTask, ...prev]);
     
      try {
        const res = await axios.post(apiUrl("/api/workspace/tasks"), { label }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setTasks(prev => prev.map(t => t._id === tempId ? res.data.data : t));
        }
      } catch (err) {
        console.error("Failed to add task:", err);
        setTasks(prev => prev.filter(t => t._id !== tempId));
      }
    }
  };
 
  const handleToggleTask = async (id, currentCompleted) => {
    const newCompleted = !currentCompleted;
    setTasks(prev => prev.map(t => t._id === id ? { ...t, completed: newCompleted } : t));
   
    if (!id.startsWith("temp-")) {
      try {
        await axios.patch(apiUrl(`/api/workspace/tasks/${id}`), { completed: newCompleted }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to toggle task:", err);
        setTasks(prev => prev.map(t => t._id === id ? { ...t, completed: currentCompleted } : t));
      }
    }
  };
 
  const handleDeleteTask = async (id) => {
    const prevTasks = [...tasks];
    setTasks(prev => prev.filter(t => t._id !== id));
   
    if (!id.startsWith("temp-")) {
      try {
        await axios.delete(apiUrl(`/api/workspace/tasks/${id}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to delete task:", err);
        setTasks(prevTasks);
      }
    }
  };
 
  const NoteCard = ({ note }) => {
    const [isEditing, setIsEditing] = useState(note.isEditing || false);
    const [content, setContent] = useState(note.content);
    const inputRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
 
    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
      }
    }, [isEditing]);
 
    const handleBlur = () => {
      setIsEditing(false);
      if (content !== note.content) {
        handleUpdateNote(note._id, { content });
      }
    };
 
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          minWidth: "220px",
          width: "220px",
          height: "160px",
          backgroundColor: note.color,
          borderRadius: "var(--radius-md)",
          padding: "var(--space-3)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          boxShadow: "var(--shadow-sm)",
          border: "1px solid rgba(255,255,255,0.05)"
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", marginBottom: isHovered ? "24px" : "0" }} className="hide-scrollbar">
          {isEditing ? (
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleBlur}
              style={{
                width: "100%",
                height: "100%",
                background: "transparent",
                border: "none",
                color: "var(--color-text-primary)",
                resize: "none",
                outline: "none",
                fontSize: "var(--text-sm)",
                fontFamily: "var(--font-sans)"
              }}
              placeholder="Type note..."
            />
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              style={{
                width: "100%",
                height: "100%",
                cursor: "text",
                fontSize: "var(--text-sm)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word"
              }}
            >
              {note.content || <span style={{ color: "var(--color-text-faint)" }}>Click to edit...</span>}
            </div>
          )}
        </div>
       
        {isHovered && (
          <div style={{
            position: "absolute",
            bottom: "var(--space-2)",
            left: "var(--space-3)",
            right: "var(--space-3)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {PRESET_COLORS.map(c => (
                <div
                  key={c}
                  onClick={() => handleUpdateNote(note._id, { color: c })}
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: c,
                    cursor: "pointer",
                    border: note.color === c ? "2px solid rgba(255,255,255,0.8)" : "1px solid rgba(255,255,255,0.2)"
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => handleDeleteNote(note._id)}
              style={{ color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
              title="Delete note"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    );
  };
 
  const TaskRow = ({ task }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "var(--space-2) 0",
          borderBottom: "1px solid var(--color-border)",
          gap: "var(--space-3)"
        }}
      >
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => handleToggleTask(task._id, task.completed)}
          style={{ cursor: "pointer", width: "16px", height: "16px", accentColor: "var(--color-accent)" }}
        />
        <span style={{
          flex: 1,
          fontSize: "var(--text-sm)",
          textDecoration: task.completed ? "line-through" : "none",
          opacity: task.completed ? 0.5 : 1,
          wordBreak: "break-word"
        }}>
          {task.label}
        </span>
        {isHovered && (
          <button
            onClick={() => handleDeleteTask(task._id)}
            style={{ color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>
    );
  };
 
  return (
    <div className="nc-card" style={{ height: "320px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
        <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-semibold)", margin: 0 }}>Workspace</h3>
        <div style={{ display: "flex", gap: "var(--space-2)", backgroundColor: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "var(--radius-full)" }}>
          <button
            onClick={() => setActiveTab("notes")}
            style={{
              padding: "4px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-medium)",
              cursor: "pointer",
              transition: "background-color 100ms ease, color 100ms ease",
              backgroundColor: activeTab === "notes" ? "var(--color-accent)" : "transparent",
              color: activeTab === "notes" ? "#fff" : "var(--color-text-secondary)"
            }}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            style={{
              padding: "4px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)",
              fontWeight: "var(--font-medium)",
              cursor: "pointer",
              transition: "background-color 100ms ease, color 100ms ease",
              backgroundColor: activeTab === "tasks" ? "var(--color-accent)" : "transparent",
              color: activeTab === "tasks" ? "#fff" : "var(--color-text-secondary)"
            }}
          >
            Tasks
          </button>
        </div>
      </div>
 
      <div style={{ flex: 1, position: "relative" }}>
       
        <div style={{
          position: "absolute", inset: 0,
          opacity: activeTab === "notes" ? 1 : 0,
          pointerEvents: activeTab === "notes" ? "auto" : "none",
          transition: "opacity 100ms ease",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ marginBottom: "var(--space-3)" }}>
            <button
              onClick={handleAddNote}
              style={{
                padding: "4px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-accent)",
                color: "var(--color-accent)",
                fontSize: "var(--text-xs)",
                fontWeight: "var(--font-medium)",
                cursor: "pointer",
                background: "transparent"
              }}
            >
              + Add Note
            </button>
          </div>
         
          {!notesFetched ? null : notes.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              No notes yet
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                gap: "var(--space-4)",
                overflowX: "auto",
                paddingBottom: "var(--space-2)",
                flex: 1
              }}
              className="workspace-hide-scrollbar"
            >
              <style>{`.workspace-hide-scrollbar::-webkit-scrollbar { display: none; } .workspace-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
              {notes.map(note => <NoteCard key={note._id} note={note} />)}
            </div>
          )}
        </div>
 
        <div style={{
          position: "absolute", inset: 0,
          opacity: activeTab === "tasks" ? 1 : 0,
          pointerEvents: activeTab === "tasks" ? "auto" : "none",
          transition: "opacity 100ms ease",
          display: "flex",
          flexDirection: "column"
        }}>
          {!tasksFetched ? null : tasks.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
              No tasks yet
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "var(--space-2)" }}>
              {tasks.map(task => <TaskRow key={task._id} task={task} />)}
            </div>
          )}
         
          <div style={{ marginTop: "auto", paddingTop: "var(--space-3)" }}>
            <input
              type="text"
              placeholder="Add a task..."
              onKeyDown={handleAddTask}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "rgba(255,255,255,0.03)",
                color: "var(--color-text-primary)",
                fontSize: "var(--text-sm)",
                outline: "none"
              }}
            />
          </div>
        </div>
 
      </div>
    </div>
  );
};
 
export default WorkspaceWidget;
 
 