import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, ChevronRight, LayoutGrid, Filter, ArrowUpDown } from "lucide-react";
import ProjectCard from "./ProjectCard";
import { projectApi } from "./projectApi";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ search: "", status: "", industry: "", sortBy: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = { ...filters, page, limit: 12 };
        Object.keys(params).forEach((key) => !params[key] && delete params[key]);
        const { data } = await projectApi.list(params);
        setProjects(data.projects || []);
        setMeta({ page: data.page || 1, pages: data.pages || 1, total: data.total || 0 });
      } catch (err) { setError("Could not load projects."); }
      finally { setLoading(false); }
    };
    load();
  }, [filters, page]);

  const industries = useMemo(() => [...new Set(projects.map((project) => project.industry).filter(Boolean))], [projects]);

  const setFilter = (field, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Delivery</span><ChevronRight size={10} /><span>Projects</span>
           </div>
           <h1 className="title">Project Portfolio</h1>
           <p className="subtitle">Overview of internal and client-facing project delivery status.</p>
        </div>
        <div className="page-header-right">
           <Link to="/projects/new" className="btn btn-primary"><Plus size={16} /> Add Project</Link>
        </div>
      </div>

      <div className="nc-card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-8)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
         <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search name, client, company..." value={filters.search} onChange={e => setFilter("search", e.target.value)} />
         </div>
         <select className="form-select" style={{ width: '150px' }} value={filters.status} onChange={e => setFilter("status", e.target.value)}>
            <option value="">All Status</option>
            <option value="in_progress">In Progress</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="testing">Testing</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
         </select>
         <select className="form-select" style={{ width: '150px' }} value={filters.industry} onChange={e => setFilter("industry", e.target.value)}>
            <option value="">All Industries</option>
            {industries.map(i => <option key={i} value={i}>{i}</option>)}
         </select>
         <select className="form-select" style={{ width: '150px' }} value={filters.sortBy} onChange={e => setFilter("sortBy", e.target.value)}>
            <option value="">Featured First</option>
            <option value="createdAt">Newest</option>
            <option value="name">Name</option>
         </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>Loading projects portfolio...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
           {projects.map(p => <ProjectCard key={p._id} project={p} />)}
           {projects.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 'var(--space-20)', color: 'var(--color-text-muted)' }}>No projects matched your filters.</div>}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-10)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
         <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{meta.total} Projects listed</span>
         <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(v => v - 1)}>Previous</button>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>{meta.page} / {meta.pages}</span>
            <button className="btn btn-ghost" disabled={page >= meta.pages} onClick={() => setPage(v => v + 1)}>Next</button>
         </div>
      </div>
    </div>
  );
}
