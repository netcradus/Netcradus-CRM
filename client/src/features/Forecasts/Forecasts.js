import React, { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, Plus, Search, ChevronRight, BarChart3, Target, CheckCircle2, AlertCircle } from "lucide-react";
import { apiUrl } from "../../config/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

const Forecasts = () => {
  const [forecastData, setForecastData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ period: "", owner: "", target: "", forecast: "", achieved: "" });

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const res = await axios.get(apiUrl("/api/forecasts"));
        setForecastData(res.data || []);
      } catch (err) { console.error(err); }
    };
    fetchForecasts();
  }, []);

  const handleAddForecast = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(apiUrl("/api/forecasts"), form);
      setForecastData([...forecastData, res.data]);
      setForm({ period: "", owner: "", target: "", forecast: "", achieved: "" });
      setShowModal(false);
    } catch (err) { console.error(err); }
  };

  const totalAchieved = forecastData.reduce((sum, f) => sum + parseInt(f.achieved || 0), 0);
  const totalTarget = forecastData.reduce((sum, f) => sum + parseInt(f.target || 0), 0);
  const percentage = totalTarget ? ((totalAchieved / totalTarget) * 100).toFixed(1) : 0;

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Sales</span><ChevronRight size={10} /><span>Forecasts</span>
           </div>
           <h1 className="title">Sales Forecasting</h1>
           <p className="subtitle">Track revenue targets against actual achievements and future projections.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Set Target</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-stat-card"><span className="metric-label">Total Target</span><span className="metric-value">₹ {totalTarget.toLocaleString('en-IN')}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Actual Achieved</span><span className="metric-value" style={{ color: 'var(--color-success)' }}>₹ {totalAchieved.toLocaleString('en-IN')}</span></div>
         <div className="nc-stat-card"><span className="metric-label">Performance</span><span className="metric-value" style={{ color: 'var(--color-accent)' }}>{percentage}%</span></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
         <div className="nc-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-base)' }}>Achievement Trends</h3>
            <div style={{ height: '300px' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecastData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                     <XAxis dataKey="period" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                     <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${v/1000}k`} />
                     <Tooltip 
                        contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-base)' }}
                        itemStyle={{ fontSize: '12px' }}
                     />
                     <Bar dataKey="achieved" fill="var(--color-accent)" radius={[4, 4, 0, 0]} barSize={32} />
                     <Bar dataKey="target" fill="var(--color-bg-elevated)" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
         <div className="nc-card" style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Key Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
               <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}><CheckCircle2 size={14} color="var(--color-success)" /><span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>Best Period</span></div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>Q2 2025 showed 124% achievement.</div>
               </div>
               <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}><AlertCircle size={14} color="var(--color-warning)" /><span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)' }}>Current Gap</span></div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>₹ {(totalTarget - totalAchieved).toLocaleString()} still to be closed.</div>
               </div>
            </div>
         </div>
      </div>

      <div className="nc-card">
         <table className="nc-table">
            <thead>
               <tr><th>Period</th><th>Owner</th><th>Target</th><th>Achieved</th><th>% Target</th><th>Gap</th></tr>
            </thead>
            <tbody>
               {forecastData.map((f, i) => (
                 <tr key={i}>
                    <td style={{ fontWeight: 'var(--font-bold)' }}>{f.period}</td>
                    <td><span className="badge badge-neutral">{f.owner}</span></td>
                    <td>₹ {Number(f.target).toLocaleString()}</td>
                    <td style={{ fontWeight: 'var(--font-bold)', color: 'var(--color-success)' }}>₹ {Number(f.achieved).toLocaleString()}</td>
                    <td>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <div style={{ flex: 1, height: '4px', background: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                             <div style={{ width: `${Math.min(100, (f.achieved/f.target)*100)}%`, height: '100%', background: 'var(--color-accent)' }} />
                          </div>
                          <span style={{ fontSize: '10px' }}>{((f.achieved/f.target)*100).toFixed(0)}%</span>
                       </div>
                    </td>
                    <td>₹ {(f.target - f.achieved).toLocaleString()}</td>
                 </tr>
               ))}
               {forecastData.length === 0 && (
                 <tr><td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>No forecast data available.</td></tr>
               )}
            </tbody>
         </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '450px' }}>
              <div className="nc-modal-header"><h3>Set Revenue Target</h3></div>
              <form className="form" onSubmit={handleAddForecast}>
                 <div className="form-field">
                    <label className="form-label">Period</label>
                    <input className="form-input" placeholder="e.g. Q3 2025" required value={form.period} onChange={e => setForm({...form, period: e.target.value})} />
                 </div>
                 <div className="form-field">
                    <label className="form-label">Owner</label>
                    <input className="form-input" placeholder="Team or Manager name" required value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} />
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                       <label className="form-label">Target Amount (₹)</label>
                       <input className="form-input" type="number" required value={form.target} onChange={e => setForm({...form, target: e.target.value})} />
                    </div>
                    <div className="form-field">
                       <label className="form-label">Achieved So Far (₹)</label>
                       <input className="form-input" type="number" required value={form.achieved} onChange={e => setForm({...form, achieved: e.target.value})} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Set Forecast</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Forecasts;
