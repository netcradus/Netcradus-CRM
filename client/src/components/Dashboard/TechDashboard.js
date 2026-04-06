import React, { useState } from "react";
import { Kanban, Plus, Columns3, Clock3 } from "lucide-react";
import "./TechDashboard.css";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";


const initialData = {
  "TO DO": ["Setup project repo", "Define database schema"],
  "DOING": ["Implement login API", "Design dashboard UI"],
  "DONE": ["Install React", "Setup ESLint"],
  "Bugs & Issues": ["Fix navbar collapse bug", "API auth error"],
  "Solutions": ["Add token refresh", "Improve UI responsiveness"],
  "New Ideas": ["Add dark mode toggle", "Implement notifications"]
};

function TechDashboard({ preview = false, isAdmin = false }) {
  const [data, setData] = useState(initialData);
  const [newCard, setNewCard] = useState({});
  const [newProject, setNewProject] = useState("");
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "it";

  const addCard = (column) => {
    if (newCard[column] && newCard[column].trim() !== "") {
      setData({
        ...data,
        [column]: [...data[column], newCard[column]]
      });
      setNewCard({ ...newCard, [column]: "" });
    }
  };

  const addProject = () => {
    if (newProject.trim() !== "" && !data[newProject]) {
      setData({ ...data, [newProject]: [] });
      setNewProject("");
    }
  };

  return (
    <div className={`nc-page tech-page ${preview ? "preview-mode" : ""}`}>

      {/* 🔥 HERO (hidden in preview) */}
      {!preview && (
        <div className="nc-hero">
          <div className="nc-hero-copy">
            <div className="nc-badge">
              <Kanban size={14} />
              <span>Netcradus IT Workspace</span>
            </div>
            <h1 className="nc-hero-title">
              Welcome, <span className="nc-gradient-text">{userName}</span>
            </h1>
            <p className="nc-role-line">
              Role: <strong>{userRole}</strong>
            </p>
            <div className="nc-attendance-brief">
              <p className="nc-attendance-kicker">
                <Clock3 size={14} />
                Attendance System
              </p>
              <h2 className="nc-attendance-heading">Attendance system live for your shift</h2>
              <p className="nc-attendance-copy">
                The panel on the right keeps your work timer and break controls visible while you manage tasks.
              </p>
            </div>
            <p className="nc-hero-note">
              Track initiatives, bugs, and improvements with a clean kanban workflow built for production teams.
            </p>
          </div>

          <div className="nc-hero-actions">
            <AttendanceWidget />
          </div>
        </div>
      )}

      {/* 🔥 CONTROLS (hidden in preview) */}
      {!preview && (
        <div className="nc-panel nc-section">
          <div className="nc-controls">
            <div className="nc-controls-left">
              <div className="tech-add-project">
                <Columns3 size={16} />
                <input
                  className="nc-input tech-project-input"
                  type="text"
                  placeholder="New column (e.g., Sprint 12)"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                />
              </div>
            </div>

            <div className="nc-controls-right">
              <button className="nc-btn nc-btn--primary" onClick={addProject}>
                <Plus size={16} />
                Add Column
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 BOARD */}
      <div className="board-container">
        {Object.keys(data).map((column) => (
          <div key={column} className="board-column">

            <div className="board-column-header">
              <h2>{column}</h2>
              <span className="board-count">{data[column].length}</span>
            </div>

            <div className="cards">
              {data[column].map((card, index) => (
                <div key={index} className="card">
                  {card}

                  {/* 🔥 Admin Controls */}
                  {isAdmin && !preview && (
                    <button
                      className="delete-btn"
                      onClick={() => {
                        const updated = data[column].filter((_, i) => i !== index);
                        setData({ ...data, [column]: updated });
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* 🔥 Add card hidden in preview */}
            {!preview && (
              <div className="add-card">
                <input
                  className="nc-input tech-card-input"
                  type="text"
                  placeholder="Add a card"
                  value={newCard[column] || ""}
                  onChange={(e) =>
                    setNewCard({ ...newCard, [column]: e.target.value })
                  }
                />
                <button
                  className="nc-btn tech-add-card-btn"
                  onClick={() => addCard(column)}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechDashboard;
