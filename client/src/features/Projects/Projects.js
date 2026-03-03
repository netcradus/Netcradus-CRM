import React from "react";
import { FaProjectDiagram } from "react-icons/fa";
import "./Projects.css";

function Projects() {
  const projects = [
  {
    name: "Website Redesign",
    client: "ABC Pvt Ltd",
    status: "Ongoing",
    deadline: "25 Mar 2026",
    progress: 70,
  },
  {
    name: "E-commerce App",
    client: "XYZ Store",
    status: "Completed",
    deadline: "10 Feb 2026",
    progress: 100,
  },
  {
    name: "SEO Optimization",
    client: "Growth Corp",
    status: "Pending",
    deadline: "5 Apr 2026",
    progress: 20,
  },
];
  return (
    <div className="projects-container">
      <h2 className="projects-heading"><FaProjectDiagram /> Projects</h2>

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
      {projects.map((project, index) => (
        <tr key={index}>
          <td data-label="Project Name">{project.name}</td>
          <td data-label="Client">{project.client}</td>
          <td data-label="Status">
            <span className={`badge ${project.status.toLowerCase()}`}>
              {project.status}
            </span>
          </td>
          <td data-label="Deadline">{project.deadline}</td>
          <td data-label="Progress">
            <progress value={project.progress} max="100"></progress>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
}

export default Projects;
