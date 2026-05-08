import React from "react";
import { Share2, Plus, Search, ChevronRight, Facebook, Twitter, Instagram, Linkedin, Globe, MessageCircle } from "lucide-react";

const Social = () => {
  const socialPlatforms = [
    { name: "Facebook", status: "Connected", color: "#1877F2", icon: <Facebook size={20} /> },
    { name: "Twitter / X", status: "Connected", color: "#1DA1F2", icon: <Twitter size={20} /> },
    { name: "Instagram", status: "Not Connected", color: "#E4405F", icon: <Instagram size={20} /> },
    { name: "LinkedIn", status: "Connected", color: "#0A66C2", icon: <Linkedin size={20} /> },
    { name: "WhatsApp Business", status: "Not Connected", color: "#25D366", icon: <MessageCircle size={20} /> },
  ];

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Marketing</span><ChevronRight size={10} /><span>Social Media</span>
           </div>
           <h1 className="title">Social Integrations</h1>
           <p className="subtitle">Manage connections with external social platforms and communication channels.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary"><Plus size={16} /> Link New Channel</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
        {socialPlatforms.map((p, index) => (
          <div key={index} className="nc-card nc-card--interactive" style={{ padding: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color }}>
                {p.icon}
             </div>
             <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', marginBottom: '2px' }}>{p.name}</h3>
                <span style={{ fontSize: '10px', color: p.status === 'Connected' ? 'var(--color-success)' : 'var(--color-text-muted)', fontWeight: 'var(--font-semibold)' }}>{p.status}</span>
             </div>
             <button className={`btn btn-${p.status === 'Connected' ? 'ghost' : 'primary'}`} style={{ fontSize: '11px', padding: 'var(--space-1) var(--space-3)' }}>
                {p.status === 'Connected' ? 'Settings' : 'Connect'}
             </button>
          </div>
        ))}
      </div>

      <div className="nc-card" style={{ marginTop: 'var(--space-8)', padding: 'var(--space-8)', textAlign: 'center', background: 'var(--gradient-subtle)' }}>
         <Globe size={48} color="var(--color-accent)" style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
         <h3>Centralized Social Feed</h3>
         <p style={{ color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto var(--space-6)' }}>Our unified inbox feature is coming soon. Connect your platforms now to prepare for seamless cross-channel communication.</p>
         <button className="btn btn-primary" disabled>Notify Me When Ready</button>
      </div>
    </div>
  );
};

export default Social;
