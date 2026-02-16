import React from "react";
import "./Projects.css";

function Projects() {
  return (
    <div className="projects-container">
      <h2 className="projects-heading">Projects</h2>

      {/* 🔶 Project Summary Section */}
      <div className="project-summary-cards">
        <div className="summary-card total">
         
        </div>
        <div className="summary-card ongoing">
         
        </div>
        <div className="summary-card completed">
          
        </div>
        <div className="summary-card pending">
          
        </div>
      </div>

      <div className="projects-actions">
        <button className="btn-primary">Add Project</button>
        <input className="search-bar" type="text" placeholder="Search Projects" />
      </div>

      <div className="project-status">
        <div className="status-tag ongoing">Ongoing</div>
        <div className="status-tag completed">Completed</div>
        <div className="status-tag pending">Pending</div>
      </div>

      <div className="projects-table">
        <table>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Client</th>
              <th>Status</th>
              <th>Deadline</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            <tr>
             
            </tr>
            <tr>
              
            </tr>
            <tr>
             
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Projects;
