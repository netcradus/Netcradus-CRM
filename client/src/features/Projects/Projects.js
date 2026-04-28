import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import ProjectCard from "./ProjectCard";
import { projectApi } from "./projectApi";
import "./Projects.css";

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
      } catch (err) {
        setError("Could not load projects.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters, page]);

  const industries = useMemo(
    () => [...new Set(projects.map((project) => project.industry).filter(Boolean))],
    [projects]
  );

  const setFilter = (field, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="portfolio-page">
      <header className="portfolio-page-head">
        <div>
          <span className="portfolio-kicker">Internal Portfolio</span>
          <h1>Projects</h1>
        </div>
        <Link to="/projects/new" className="portfolio-primary-btn">
          <Plus size={18} />
          Add Project
        </Link>
      </header>

      <section className="portfolio-filter-bar">
        <div className="portfolio-search-box">
          <Search size={16} />
          <input
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Search name, client, company"
          />
        </div>
        <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="ongoing">Ongoing</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <select value={filters.industry} onChange={(e) => setFilter("industry", e.target.value)}>
          <option value="">All industries</option>
          {industries.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
        </select>
        <select value={filters.sortBy} onChange={(e) => setFilter("sortBy", e.target.value)}>
          <option value="">Featured first</option>
          <option value="createdAt">Newest</option>
          <option value="name">Name</option>
          <option value="status">Status</option>
        </select>
      </section>

      {error && <div className="portfolio-error">{error}</div>}
      {loading ? (
        <div className="portfolio-empty">Loading projects...</div>
      ) : projects.length ? (
        <div className="portfolio-grid">
          {projects.map((project) => <ProjectCard key={project._id} project={project} />)}
        </div>
      ) : (
        <div className="portfolio-empty">No projects found.</div>
      )}

      <footer className="portfolio-pagination">
        <span>{meta.total} projects</span>
        <div>
          <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
          <span>{meta.page} / {meta.pages}</span>
          <button disabled={page >= meta.pages} onClick={() => setPage((value) => value + 1)}>Next</button>
        </div>
      </footer>
    </div>
  );
}
