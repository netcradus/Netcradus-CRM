import React from "react";
import { BarChart3, PieChart, LineChart, FileText, ChevronRight, Search, Download, Filter } from "lucide-react";

function Reports() {
  const categories = [
    { name: "Sales & Revenue", description: "Track pipeline value, conversion rates and revenue growth.", icon: <BarChart3 size={20} />, color: "var(--color-accent)" },
    { name: "Customer Support", description: "Monitor ticket volume, resolution times and satisfaction.", icon: <PieChart size={20} />, color: "var(--color-info)" },
    { name: "Inventory & Supply", description: "Analyze stock levels, vendor performance and PO status.", icon: <FileText size={20} />, color: "var(--color-success)" },
    { name: "Marketing ROI", description: "Evaluate campaign performance and lead generation costs.", icon: <LineChart size={20} />, color: "var(--color-warning)" },
  ];

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Intelligence</span><ChevronRight size={10} /><span>Reports</span>
           </div>
           <h1 className="title">Analytics & Reports</h1>
           <p className="subtitle">Data-driven insights to help you make informed business decisions.</p>
        </div>
        <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-3)' }}>
           <button className="btn btn-ghost"><Filter size={16} /> Filters</button>
           <button className="btn btn-primary"><Download size={16} /> Export All</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {categories.map((c, i) => (
          <div key={i} className="nc-card nc-card--interactive" style={{ padding: 'var(--space-6)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, marginBottom: 'var(--space-4)' }}>
              {c.icon}
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>{c.name}</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>{c.description}</p>
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'space-between' }}>View Dashboard <ChevronRight size={14} /></button>
          </div>
        ))}
      </div>

      <div className="nc-card" style={{ padding: 'var(--space-10)', textAlign: 'center', background: 'var(--gradient-subtle)' }}>
         <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
               <BarChart3 size={32} color="var(--color-accent)" style={{ opacity: 0.4 }} />
            </div>
            <h3>Custom Report Builder</h3>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>Can't find the data you need? Use our drag-and-drop report builder to create custom visualizations.</p>
            <button className="btn btn-primary">Start Building</button>
         </div>
      </div>
    </div>
  );
}

export default Reports;
