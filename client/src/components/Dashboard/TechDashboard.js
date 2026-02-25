import React, { useState } from 'react';
import './TechDashboard.css';

const initialData = {
  "TO DO": ["Setup project repo", "Define database schema"],
  "DOING": ["Implement login API", "Design dashboard UI"],
  "DONE": ["Install React", "Setup ESLint"],
  "Bugs & Issues": ["Fix navbar collapse bug", "API auth error"],
  "Solutions": ["Add token refresh", "Improve UI responsiveness"],
  "New Ideas": ["Add dark mode toggle", "Implement notifications"]
};

function TechDashboard() {
  const [data, setData] = useState(initialData);
  const [newCard, setNewCard] = useState({});
  const [newProject, setNewProject] = useState("");

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
    <div className="dashboard-wrapper">
      <div className="add-project">
        <input
          type="text"
          placeholder="New Project/Column"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
        />
        <button onClick={addProject}>Add Project</button>
      </div>

      <div className="board-container">
        {Object.keys(data).map((column) => (
          <div key={column} className="board-column">
            <h2>{column}</h2>
            <div className="cards">
              {data[column].map((card, index) => (
                <div key={index} className="card">
                  {card}
                </div>
              ))}
            </div>
            <div className="add-card">
              <input
                type="text"
                placeholder="Add a card"
                value={newCard[column] || ""}
                onChange={(e) =>
                  setNewCard({ ...newCard, [column]: e.target.value })
                }
              />
              <button onClick={() => addCard(column)}>Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TechDashboard;