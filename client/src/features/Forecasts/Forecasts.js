import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Plus, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { apiUrl } from "../../config/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const emptyForm = { period: "", owner: "", target: "", forecast: "", achieved: "" };

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

const Forecasts = () => {
  const [forecastData, setForecastData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const res = await axios.get(apiUrl("/api/forecasts"));
        setForecastData(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchForecasts();
  }, []);

  const handleAddForecast = async (event) => {
    event.preventDefault();

    try {
      const payload = {
        ...form,
        target: Number(form.target) || 0,
        forecast: Number(form.forecast) || 0,
        achieved: Number(form.achieved) || 0,
      };
      const res = await axios.post(apiUrl("/api/forecasts"), payload);
      setForecastData((current) => [res.data, ...current]);
      setForm(emptyForm);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const totalAchieved = useMemo(
    () => forecastData.reduce((sum, item) => sum + (Number(item.achieved) || 0), 0),
    [forecastData]
  );
  const totalTarget = useMemo(
    () => forecastData.reduce((sum, item) => sum + (Number(item.target) || 0), 0),
    [forecastData]
  );
  const performance = totalTarget ? ((totalAchieved / totalTarget) * 100).toFixed(1) : "0.0";

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Sales</span><ChevronRight size={10} /><span>Forecasts</span>
          </div>
          <h1 className="title">Sales Forecasting</h1>
          <p className="subtitle">Track targets, forecasts, and achieved revenue across reporting periods.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Set Target</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        <div className="nc-stat-card"><span className="metric-label">Total Target</span><span className="metric-value">{formatCurrency(totalTarget)}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Actual Achieved</span><span className="metric-value" style={{ color: "var(--color-success)" }}>{formatCurrency(totalAchieved)}</span></div>
        <div className="nc-stat-card"><span className="metric-label">Performance</span><span className="metric-value" style={{ color: "var(--color-accent)" }}>{performance}%</span></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 350px)", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        <div className="nc-card" style={{ padding: "var(--space-6)" }}>
          <h3 style={{ marginBottom: "var(--space-6)", fontSize: "var(--text-base)" }}>Achievement Trends</h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="period" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}
                />
                <Bar dataKey="achieved" fill="var(--color-accent)" radius={[4, 4, 0, 0]} barSize={26} />
                <Bar dataKey="forecast" fill="var(--color-info)" radius={[4, 4, 0, 0]} barSize={26} />
                <Bar dataKey="target" fill="rgba(255,255,255,0.18)" radius={[4, 4, 0, 0]} barSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="nc-card" style={{ padding: "var(--space-6)" }}>
          <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Key Insights</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}><CheckCircle2 size={14} color="var(--color-success)" /><span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)" }}>Best Period</span></div>
              <div style={{ fontSize: "var(--text-sm)" }}>{forecastData[0]?.period || "No data yet"} is ready for review.</div>
            </div>
            <div style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-base)", border: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}><AlertCircle size={14} color="var(--color-warning)" /><span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-semibold)" }}>Current Gap</span></div>
              <div style={{ fontSize: "var(--text-sm)" }}>{formatCurrency(Math.max(totalTarget - totalAchieved, 0))} still to be closed.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr><th>Period</th><th>Owner</th><th>Target</th><th>Forecast</th><th>Achieved</th><th>Gap</th></tr>
          </thead>
          <tbody>
            {forecastData.map((item) => (
              <tr key={item._id}>
                <td style={{ fontWeight: "var(--font-bold)" }}>{item.period}</td>
                <td><span className="badge badge-neutral">{item.owner}</span></td>
                <td>{formatCurrency(item.target)}</td>
                <td>{formatCurrency(item.forecast)}</td>
                <td style={{ fontWeight: "var(--font-bold)", color: "var(--color-success)" }}>{formatCurrency(item.achieved)}</td>
                <td>{formatCurrency((Number(item.target) || 0) - (Number(item.achieved) || 0))}</td>
              </tr>
            ))}
            {forecastData.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No forecast data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "450px" }}>
            <div className="nc-modal-header"><h3>Set Revenue Target</h3></div>
            <form className="form" onSubmit={handleAddForecast}>
              <div className="form-field">
                <label className="form-label">Period</label>
                <input className="form-input" placeholder="e.g. Q3 2026" required value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Owner</label>
                <input className="form-input" placeholder="Team or manager name" required value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
                <div className="form-field">
                  <label className="form-label">Target Amount</label>
                  <input className="form-input" type="number" required value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Forecast Amount</label>
                  <input className="form-input" type="number" required value={form.forecast} onChange={(event) => setForm({ ...form, forecast: event.target.value })} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Achieved So Far</label>
                <input className="form-input" type="number" required value={form.achieved} onChange={(event) => setForm({ ...form, achieved: event.target.value })} />
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
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
