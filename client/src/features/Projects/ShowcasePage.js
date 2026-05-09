import { useEffect, useMemo, useState } from "react";
import { Edit3, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { projectApi, projectAssetUrl } from "./projectApi";
// import "./Projects.css";


export default function ShowcasePage() {
  const [projects, setProjects] = useState([]);
  const [industry, setIndustry] = useState("All");

  useEffect(() => {
    const load = async () => {
      const { data } = await projectApi.showcase();
      setProjects(data.projects || []);
    };
    load();
  }, []);

  const industries = useMemo(() => ["All", ...new Set(projects.map((project) => project.industry).filter(Boolean))], [projects]);
  const visible = industry === "All" ? projects : projects.filter((project) => project.industry === industry);
  const featured = visible.filter((project) => project.isFeatured);
  const rest = visible.filter((project) => !project.isFeatured);

  const renderCard = (project, large = false) => (
    <article key={project._id} className={`showcase-card ${large ? "large" : ""}`}>
      <div className="showcase-thumb">
        {project.thumbnail ? <img src={projectAssetUrl(project.thumbnail)} alt={project.name} /> : <div>{project.name?.slice(0, 2).toUpperCase()}</div>}
      </div>
      <div className="showcase-card-body">
        <div className="showcase-card-top">
          <h3>{project.name}</h3>
          <span className={`portfolio-status status-${project.status}`}>{project.status}</span>
        </div>
        <p>{project.showcaseDescription || project.tagline || "A Netcradus project."}</p>
        <span className="portfolio-client">{[project.clientName, project.clientCompany].filter(Boolean).join(", ") || "Netcradus"}</span>
        <div className="portfolio-tags">
          {(project.techStack || []).slice(0, 6).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="portfolio-card-actions">
          {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="portfolio-action-link"><ExternalLink size={16} /> Visit</a>}
          <Link to={`/projects/${project._id}/edit`} className="portfolio-icon-btn" title="Edit"><Edit3 size={16} /></Link>
        </div>
      </div>
    </article>
  );

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <div className="page-header-left">
          <h1 className="title">Project Showcase</h1>
          <p className="subtitle">Exploring our portfolio of high-impact engineering and design projects.</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {industries.map((item) => (
            <button 
              key={item} 
              className={`btn ${industry === item ? "btn-primary" : "btn-ghost"}`} 
              onClick={() => setIndustry(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      {visible.length > 0 ? (
        <div className="showcase-grid">
          {visible.map((project) => renderCard(project, project.isFeatured))}
        </div>
      ) : (
        <div className="nc-card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>No projects found for this category.</div>
          <button className="btn btn-secondary" onClick={() => setIndustry("All")}>Clear Filters</button>
        </div>
      )}
    </div>
  );
}
