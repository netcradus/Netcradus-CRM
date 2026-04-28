import { ExternalLink, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { projectAssetUrl } from "./projectApi";

const statusLabel = {
  completed: "Completed",
  ongoing: "Ongoing",
  maintenance: "Maintenance",
};

export default function ProjectCard({ project }) {
  const tags = project.techStack || [];

  return (
    <article className="portfolio-card">
      <div className="portfolio-thumb">
        {project.thumbnail ? (
          <img src={projectAssetUrl(project.thumbnail)} alt={project.name} />
        ) : (
          <div className="portfolio-thumb-placeholder">{project.name?.slice(0, 2).toUpperCase() || "PR"}</div>
        )}
        {project.isFeatured && <span className="portfolio-featured">Featured</span>}
      </div>
      <div className="portfolio-card-body">
        <div className="portfolio-card-title-row">
          <h3>{project.name}</h3>
          <span className={`portfolio-status status-${project.status}`}>{statusLabel[project.status] || project.status}</span>
        </div>
        <p>{project.tagline || "No tagline added"}</p>
        <span className="portfolio-client">{project.clientCompany || "Internal project"}</span>
        <div className="portfolio-tags">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
          {tags.length > 4 && <span>+{tags.length - 4} more</span>}
        </div>
        <div className="portfolio-card-actions">
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer" className="portfolio-icon-btn" title="Open live URL">
              <ExternalLink size={16} />
            </a>
          )}
          <Link to={`/projects/${project._id}`} className="portfolio-action-link">
            <Eye size={16} />
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
