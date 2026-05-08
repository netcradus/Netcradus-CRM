import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Search,
  Plus,
  Download,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid,
  ResponsiveContainer
} from "recharts";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import { apiUrl } from "../../config/api";

const API = apiUrl("/api/deals");

const formatRoleLabel = (value = "") =>
  value === "admin"
    ? "Administrator"
    : String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const SalesDashboard = ({ preview }) => {
  const [deals, setDeals] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [newDeal, setNewDeal] = useState({
    name: "",
    value: "",
    status: "In Progress",
    assignedTo: "",
  });
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "sales";

  const fetchDeals = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setDeals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDeals();
    const interval = setInterval(fetchDeals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddDeal = async (e) => {
    e.preventDefault();
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDeal),
      });
      fetchDeals();
      setShowModal(false);
      setNewDeal({ name: "", value: "", status: "In Progress", assignedTo: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDeals = deals.filter((d) => {
    const matchesStatus = filter ? d.status?.toLowerCase() === filter.toLowerCase() : true;
    const matchesSearch = search ? d.name?.toLowerCase().includes(search.toLowerCase()) : true;
    return matchesStatus && matchesSearch;
  });

  const revenueTrend = deals.map((d, index) => ({
    name: d.name?.substring(0, 10) || `Deal ${index + 1}`,
    revenue: Number(d.value || 0),
  }));

  const dealsOverTime = deals.map((d, index) => ({
    name: d.name?.substring(0, 10) || `Deal ${index + 1}`,
    count: 1,
  }));

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Sales Dashboard</h1>
          <p className="subtitle">Pipeline overview and deal management.</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-outline" onClick={() => {
             const csv = deals.map(d => `${d.name},${d.value},${d.status}`).join("\n");
             const blob = new Blob([csv], { type: "text/csv" });
             const url = window.URL.createObjectURL(blob);
             const a = document.createElement("a");
             a.href = url; a.download = "deals.csv"; a.click();
          }}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Deal
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Open Deals</span>
          <span className="metric-value">{deals.filter(d => d.status === "In Progress").length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Pipeline Value</span>
          <span className="metric-value">₹ {deals.reduce((acc, d) => acc + Number(d.value || 0), 0).toLocaleString()}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Deals Won</span>
          <span className="metric-value" style={{ color: 'var(--color-success)' }}>{deals.filter(d => d.status === "Won").length}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-base)' }}>Revenue Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} dot={{r: 3}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Sales Activity</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={dealsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-accent-muted)" stroke="var(--color-accent)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="nc-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-base)' }}>Pipeline Deals</h3>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <input 
                className="form-input" 
                placeholder="Search..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{ height: '32px', width: '160px' }}
              />
            </div>
            <select className="form-select" onChange={(e) => setFilter(e.target.value)} style={{ height: '32px', width: '130px' }}>
              <option value="">All Statuses</option>
              <option value="In Progress">In Progress</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>
        
        <table className="nc-table">
          <thead>
            <tr>
              <th>Deal Name</th>
              <th>Value</th>
              <th>Status</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeals.map((deal) => (
              <tr key={deal._id}>
                <td>{deal.name}</td>
                <td>₹ {Number(deal.value || 0).toLocaleString()}</td>
                <td>
                  <span className={`badge badge-${deal.status?.toLowerCase() === 'won' ? 'success' : deal.status?.toLowerCase() === 'lost' ? 'error' : 'warning'}`}>
                    {deal.status}
                  </span>
                </td>
                <td>{deal.assignedTo || '--'}</td>
              </tr>
            ))}
            {filteredDeals.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                  No deals found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="nc-card" style={{ marginTop: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Shift Status</h3>
        <AttendanceWidget />
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
            <div className="nc-modal-header">
              <h3>Add New Deal</h3>
            </div>
            <form onSubmit={handleAddDeal} className="form">
              <div className="form-field">
                <label className="form-label">Deal Name</label>
                <input className="form-input" value={newDeal.name} onChange={e => setNewDeal({...newDeal, name: e.target.value})} required />
              </div>
              <div className="form-field">
                <label className="form-label">Value (₹)</label>
                <input className="form-input" type="number" value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: e.target.value})} required />
              </div>
              <div className="form-field">
                <label className="form-label">Assigned To</label>
                <input className="form-input" value={newDeal.assignedTo} onChange={e => setNewDeal({...newDeal, assignedTo: e.target.value})} required />
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-select" value={newDeal.status} onChange={e => setNewDeal({...newDeal, status: e.target.value})}>
                  <option>In Progress</option>
                  <option>Won</option>
                  <option>Lost</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Deal</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
