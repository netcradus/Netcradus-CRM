import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { useNavigate } from "react-router-dom";
import {
  Megaphone,
  Globe,
  CalendarClock,
  Plus
} from "lucide-react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";

const DIGITAL_CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

const formatRoleLabel = (value = "") =>
  String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

function DigitalMediaDashboard({ preview }) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "digital_media";

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const { data } = await axios.get(apiUrl("/api/campaigns"));
        setCampaigns(data || []);
      } catch (error) {
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
    const interval = setInterval(fetchCampaigns, 60000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => {
    const activeCampaigns = campaigns.filter((campaign) => campaign.status === "Active");
    const uniqueChannels = new Set(campaigns.map((campaign) => campaign.channel).filter(Boolean));
    const endingSoon = campaigns.filter((campaign) => {
      if (!campaign.endDate) return false;
      const diffMs = new Date(campaign.endDate).getTime() - Date.now();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    });

    return [
      { label: "Total Campaigns", value: campaigns.length, icon: <Megaphone size={18} /> },
      { label: "Active Now", value: activeCampaigns.length, icon: <Globe size={18} /> },
      { label: "Live Channels", value: uniqueChannels.size, icon: <Globe size={18} /> },
      { label: "Ending Soon", value: endingSoon.length, icon: <CalendarClock size={18} />, color: 'var(--color-warning)' },
    ];
  }, [campaigns]);

  const channelChartData = useMemo(() => {
    const grouped = campaigns.reduce((acc, campaign) => {
      const key = campaign.channel || "General";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [campaigns]);

  const statusChartData = useMemo(() => {
    const grouped = campaigns.reduce((acc, campaign) => {
      const key = String(campaign.status || "Unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, value], index) => ({
      name, value, color: DIGITAL_CHART_COLORS[index % DIGITAL_CHART_COLORS.length]
    }));
  }, [campaigns]);

  const launchTrendData = useMemo(() => {
    const grouped = campaigns.reduce((acc, campaign) => {
      const sourceDate = campaign.startDate || campaign.createdAt;
      if (!sourceDate) return acc;
      const date = new Date(sourceDate);
      if (Number.isNaN(date.getTime())) return acc;
      const key = date.toLocaleDateString("en-GB", { month: "short" });
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(grouped).map(([month, launches]) => ({ month, launches })).slice(-6);
  }, [campaigns]);

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Digital Media Dashboard</h1>
          <p className="subtitle">Campaign performance and channel distribution overview.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => navigate("/campaigns")}>
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        {metrics.map((metric, idx) => (
          <div key={idx} className="nc-stat-card">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value" style={{ color: metric.color }}>{metric.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Channel Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={channelChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip cursor={{fill: 'var(--color-bg-hover)'}} />
              <Bar dataKey="total" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Campaign Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-4)', justifyContent: 'center' }}>
            {statusChartData.map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: '11px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Recent Launch Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={launchTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="launches" stroke="var(--color-accent)" strokeWidth={2} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Active Shift</h3>
          <AttendanceWidget />
        </div>
      </div>

      <div className="nc-card">
        <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Recent Activity</h3>
        <table className="nc-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Channel</th>
              <th>Period</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.slice(0, 5).map(campaign => (
              <tr key={campaign._id}>
                <td>{campaign.name}</td>
                <td>{campaign.channel || '--'}</td>
                <td>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</td>
                <td>
                  <span className={`badge badge-${campaign.status?.toLowerCase() === 'active' ? 'success' : 'warning'}`}>
                    {campaign.status}
                  </span>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', color: 'var(--color-text-muted)'}}>No campaigns found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DigitalMediaDashboard;
