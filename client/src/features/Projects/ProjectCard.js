import { ExternalLink, Eye, Globe, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { projectAssetUrl } from "./projectApi";

const statusLabel = { completed: "Completed", ongoing: "Ongoing", maintenance: "Maintenance" };

export default function ProjectCard({ project }) {
  const tags = project.techStack || [];

  return (
    <article className="nc-card nc-card--interactive" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ position: 'relative', height: '180px', overflow: 'hidden', background: 'var(--color-bg-elevated)' }}>
        {project.thumbnail ? (
          <img src={projectAssetUrl(project.thumbnail)} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent)', opacity: 0.2 }}>
            {project.name?.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div style={{ position: 'absolute', top: 'var(--space-3)', right: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
           {project.isFeatured && <span className="badge badge-warning" style={{ boxShadow: 'var(--shadow-lg)' }}>Featured</span>}
           <span className={`badge badge-${project.status === 'completed' ? 'success' : 'info'}`} style={{ boxShadow: 'var(--shadow-lg)' }}>{statusLabel[project.status] || project.status}</span>
        </div>
      </div>

      <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>{project.name}</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{project.tagline || "No description provided."}</p>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
           <Building2 size={12} /> <span>{project.clientCompany || "Internal project"}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)', marginBottom: 'var(--space-6)' }}>
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{ fontSize: '9px', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>{tag}</span>
          ))}
          {tags.length > 3 && <span style={{ fontSize: '9px', color: 'var(--color-text-muted)', alignSelf: 'center', marginLeft: '4px' }}>+{tags.length - 3}</span>}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
           {project.liveUrl ? (
              <a href={project.liveUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '11px', color: 'var(--color-accent)', fontWeight: 'var(--font-semibold)', textDecoration: 'none' }}>
                 <Globe size={12} /> Visit Site
              </a>
           ) : <div />}
           <Link to={`/projects/${project._id}`} className="btn btn-ghost" style={{ padding: 'var(--space-1) var(--space-3)', fontSize: '11px' }}>
             <Eye size={12} style={{ marginRight: '6px' }} /> Details
           </Link>
        </div>
      </div>
    </article>
  );
}
