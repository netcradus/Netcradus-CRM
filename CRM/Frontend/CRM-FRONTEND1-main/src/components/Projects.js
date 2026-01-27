import React from "react";
import "./Projects.css";

function Projects() {
  return (
    <div className="projects-container">
      <h2 className="projects-heading">Projects</h2>

      {/* 🔶 Project Summary Section */}
      <div className="project-summary-cards">
        <div className="summary-card total">
          <p>Total Projects</p>
          <strong>15</strong>
        </div>
        <div className="summary-card ongoing">
          <p>Ongoing</p>
          <strong>6</strong>
        </div>
        <div className="summary-card completed">
          <p>Completed</p>
          <strong>7</strong>
        </div>
        <div className="summary-card pending">
          <p>Pending</p>
          <strong>2</strong>
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
              <td>CRM Revamp</td>
              <td>Acme Corp</td>
              <td><span className="badge ongoing">Ongoing</span></td>
              <td>2025-08-20</td>
              <td><progress value="70" max="100">70%</progress></td>
            </tr>
            <tr>
              <td>Website Redesign</td>
              <td>Beta Inc</td>
              <td><span className="badge completed">Completed</span></td>
              <td>2025-06-15</td>
              <td><progress value="100" max="100">100%</progress></td>
            </tr>
            <tr>
              <td>Mobile App Dev</td>
              <td>Gamma Ltd</td>
              <td><span className="badge pending">Pending</span></td>
              <td>2025-09-10</td>
              <td><progress value="10" max="100">10%</progress></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Projects;
