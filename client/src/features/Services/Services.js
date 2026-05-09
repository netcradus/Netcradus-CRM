import React from "react";
import { Briefcase, Plus, Search, ChevronRight, Globe, BarChart3, Megaphone } from "lucide-react";

const Services = () => {
  const services = [
    { name: "Website Development", description: "Modern and responsive website development services.", price: "₹15,000", status: "Active", icon: <Globe size={24} /> },
    { name: "SEO Optimization", description: "Improve your website ranking on search engines.", price: "₹8,000", status: "Active", icon: <BarChart3 size={24} /> },
    { name: "Social Media Marketing", description: "Boost your brand presence on social platforms.", price: "₹12,000", status: "Inactive", icon: <Megaphone size={24} /> },
  ];

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Inventory</span><ChevronRight size={10} /><span>Services</span>
           </div>
           <h1 className="title">Our Services</h1>
           <p className="subtitle">Catalog of professional services and standard pricing models.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary"><Plus size={16} /> Add Service</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
        {services.map((s, index) => (
          <div key={index} className="nc-card nc-card--interactive" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
               <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}>
                  {s.icon}
               </div>
               <span className={`badge badge-${s.status === 'Active' ? 'success' : 'ghost'}`}>{s.status}</span>
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-2)' }}>{s.name}</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)', flex: 1 }}>{s.description}</p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-text-primary)' }}>{s.price}</span>
              <button className="btn btn-ghost" style={{ fontSize: 'var(--text-xs)' }}>Edit Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;
