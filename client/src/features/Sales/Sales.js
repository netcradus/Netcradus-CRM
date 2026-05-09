import React from "react";
import { TrendingUp, Users, Target, DollarSign, ChevronRight, Search, Plus, Calendar, CheckCircle2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Jan', sales: 12000 },
  { name: 'Feb', sales: 15000 },
  { name: 'Mar', sales: 14000 },
  { name: 'Apr', sales: 18000 },
  { name: 'May', sales: 17000 },
  { name: 'Jun', sales: 21000 },
  { name: 'Jul', sales: 25000 },
];

const Sales = () => {
  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Intelligence</span><ChevronRight size={10} /><span>Sales Dashboard</span>
           </div>
           <h1 className="title">Sales Performance</h1>
           <p className="subtitle">Real-time overview of revenue growth, lead conversion and team targets.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary"><Plus size={16} /> New Entry</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card">
            <span className="metric-label">Leads Contacted</span>
            <span className="metric-value">1,204</span>
            <div style={{ fontSize: '10px', color: 'var(--color-success)' }}>↑ 12% vs last month</div>
         </div>
         <div className="nc-stat-card">
            <span className="metric-label">Deals Closed</span>
            <span className="metric-value">321</span>
            <div style={{ fontSize: '10px', color: 'var(--color-success)' }}>↑ 8% vs last month</div>
         </div>
         <div className="nc-stat-card">
            <span className="metric-label">Revenue Generated</span>
            <span className="metric-value">₹85,900</span>
            <div style={{ fontSize: '10px', color: 'var(--color-info)' }}>Target: ₹100,000</div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
               <h3 style={{ fontSize: 'var(--text-lg)' }}>Revenue Trend</h3>
               <select className="form-select" style={{ width: '120px', height: '32px', fontSize: '10px' }}>
                  <option>Last 7 Months</option><option>Last 12 Months</option>
               </select>
            </div>
            <div style={{ flex: 1 }}>
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                     <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                     <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                     <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                     <Tooltip 
                        contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--color-text-primary)', fontSize: '12px' }}
                     />
                     <Area type="monotone" dataKey="sales" stroke="var(--color-accent)" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="nc-card">
            <h3 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-6)' }}>Priority Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
               {[
                 { title: "Follow up with 5 leads", time: "Due Today", icon: <Users size={14} />, color: "var(--color-accent)" },
                 { title: "Prepare Q3 forecast", time: "Due Tomorrow", icon: <TrendingUp size={14} />, color: "var(--color-info)" },
                 { title: "Call back ZoomConnect", time: "Completed", icon: <CheckCircle2 size={14} />, color: "var(--color-success)" },
               ].map((task, i) => (
                 <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-elevated)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--color-bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: task.color }}>{task.icon}</div>
                    <div>
                       <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)' }}>{task.title}</div>
                       <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{task.time}</div>
                    </div>
                 </div>
               ))}
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 'var(--space-6)' }}>View All Tasks <ChevronRight size={14} /></button>
         </div>
      </div>
    </div>
  );
};

export default Sales;
