import React, { useEffect, useMemo, useState } from "react";
import "./DigitalMediaDashboard.css";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import { apiUrl } from "../../config/api";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Megaphone,
  BarChart3,
  Globe,
  Clock3,
  CalendarClock,
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

const DIGITAL_CHART_COLORS = ["#ff8a00", "#ff5f3d", "#ff4f9a", "#fb7185", "#38bdf8", "#22c55e"];

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
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const getCampaignStatusClass = (status = "") => {
  const safeStatus = status.toLowerCase();
  if (safeStatus === "active") return "nc-status nc-status--ok";
  if (safeStatus === "paused") return "nc-status nc-status--pending";
  return "nc-status";
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
    const pausedCampaigns = campaigns.filter((campaign) => campaign.status === "Paused");
    const uniqueChannels = new Set(campaigns.map((campaign) => campaign.channel).filter(Boolean));
    const endingSoon = campaigns.filter((campaign) => {
      if (!campaign.endDate) return false;
      const diffMs = new Date(campaign.endDate).getTime() - Date.now();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    });

    return [
      {
        key: "total-campaigns",
        icon: <Megaphone size={18} />,
        label: "Total Campaigns",
        value: campaigns.length,
        meta: "Live campaigns in the workspace",
      },
      {
        key: "active-campaigns",
        icon: <BarChart3 size={18} />,
        label: "Active Campaigns",
        value: activeCampaigns.length,
        meta: `${pausedCampaigns.length} paused right now`,
      },
      {
        key: "channel-count",
        icon: <Globe size={18} />,
        label: "Live Channels",
        value: uniqueChannels.size,
        meta: "Distinct campaign channels in use",
      },
      {
        key: "ending-soon",
        icon: <CalendarClock size={18} />,
        label: "Ending Soon",
        value: endingSoon.length,
        meta: "Campaigns closing within 7 days",
      },
    ];
  }, [campaigns]);

  const recentCampaigns = useMemo(
    () =>
      [...campaigns]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 3),
    [campaigns]
  );

  const statusChartData = useMemo(() => {
    const grouped = campaigns.reduce((acc, campaign) => {
      const key = String(campaign.status || "Unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([name, value], index) => ({
      name,
      value,
      color: DIGITAL_CHART_COLORS[index % DIGITAL_CHART_COLORS.length],
    }));
  }, [campaigns]);

  const channelChartData = useMemo(() => {
    const grouped = campaigns.reduce((acc, campaign) => {
      const key = campaign.channel || "General";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [campaigns]);

  const launchTrendData = useMemo(() => {
    const grouped = campaigns.reduce((acc, campaign) => {
      const sourceDate = campaign.startDate || campaign.createdAt;
      if (!sourceDate) return acc;
      const date = new Date(sourceDate);
      if (Number.isNaN(date.getTime())) return acc;
      const key = date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([month, launches]) => ({ month, launches }))
      .slice(-6);
  }, [campaigns]);

  const activeCampaignCount = campaigns.filter((campaign) => String(campaign.status).toLowerCase() === "active").length;
  const liveActivityScore = campaigns.length ? Math.round((activeCampaignCount / campaigns.length) * 100) : 0;

  return (
    <div className="nc-page digital-page">
      <div className="nc-hero">
        <div className="nc-hero-copy">
          <div className="nc-badge">
            <Megaphone size={14} />
            <span>Netcradus Digital Media</span>
          </div>
          <h1 className="nc-hero-title">
            Welcome, <span className="nc-gradient-text">{userName}</span>
          </h1>
          <p className="nc-role-line">
            Role: <strong>{formatRoleLabel(userRole)}</strong>
          </p>
          <div className="nc-attendance-brief">
            <p className="nc-attendance-kicker">
              <Clock3 size={14} />
              Attendance System
            </p>
            <h2 className="nc-attendance-heading">Attendance system live for your shift</h2>
            <p className="nc-attendance-copy">
              Use the live panel on the right for work time, punch status, and break controls during the day.
            </p>
          </div>
          <p className="nc-hero-note">
            Monitor live campaign activity, channel mix, and your newest media pushes from one focused dashboard.
          </p>
        </div>

        <div className="nc-hero-actions">
          <AttendanceWidget />
        </div>
      </div>

      <div className="nc-grid digital-metrics">
        {metrics.map((metric) => (
          <div key={metric.key} className="nc-card">
            <div className="digital-metric-head">
              <div className="digital-metric-icon">{metric.icon}</div>
              <div className="nc-card-title">{metric.label}</div>
            </div>
            <div className="nc-card-value">{loading ? "--" : metric.value}</div>
            <div className="digital-metric-meta">{metric.meta}</div>
          </div>
        ))}
      </div>

      <div className="digital-analytics-grid">
        <div className="nc-card digital-insight-card">
          <div className="digital-analytics-head">
            <div>
              <p className="digital-kicker">Activity Analysis</p>
              <h3>Campaign Live Pulse</h3>
            </div>
            <span className="nc-status nc-status--ok">Real time</span>
          </div>
          <div className="digital-gauge-shell">
            <div
              className="digital-gauge-ring"
              style={{ "--gauge-fill": `${liveActivityScore}%` }}
            >
              <div className="digital-gauge-center">
                <strong>{liveActivityScore}%</strong>
                <span>Active</span>
              </div>
            </div>
          </div>
          <div className="digital-gauge-legend">
            <span><i className="digital-dot digital-dot--active" /> Active Users</span>
            <span><i className="digital-dot digital-dot--idle" /> Inactive Users</span>
          </div>
          <p className="digital-gauge-copy">
            {activeCampaignCount} of {campaigns.length} campaigns are actively running across your live channels.
          </p>
        </div>

        <div className="nc-card digital-chart-card">
          <div className="digital-analytics-head">
            <div>
              <p className="digital-kicker">Channel Mix</p>
              <h3>Campaigns by Channel</h3>
            </div>
            <span className="nc-status nc-status--pending">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={channelChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="#ff8a00" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="nc-card digital-chart-card">
          <div className="digital-analytics-head">
            <div>
              <p className="digital-kicker">Status Share</p>
              <h3>Campaign Status Split</h3>
            </div>
            <span className="nc-status nc-status--ok">Synced</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={94}
                paddingAngle={4}
              >
                {statusChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="nc-card digital-chart-card">
          <div className="digital-analytics-head">
            <div>
              <p className="digital-kicker">Launch Trend</p>
              <h3>Recent Campaign Starts</h3>
            </div>
            <span className="nc-status">6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={launchTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.14)" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="launches"
                stroke="#ff4f9a"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ff8a00" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* <div className="digital-highlights">
        {recentCampaigns.map((campaign) => (
          <div key={campaign._id} className="digital-highlight-card nc-card">
            <div className="digital-highlight-top">
              <div>
                <div className="digital-platform-title">{campaign.name}</div>
                <div className="digital-platform-meta">
                  <RadioTower size={13} />
                  <span>{campaign.channel || "General"}</span>
                </div>
              </div>
              <span className={getCampaignStatusClass(campaign.status)}>{campaign.status}</span>
            </div>
            <div className="digital-highlight-dates">
              <span>Start: {formatDate(campaign.startDate)}</span>
              <span>End: {formatDate(campaign.endDate)}</span>
            </div>
          </div>
        ))}

        {!loading && !recentCampaigns.length && (
          <div className="digital-highlight-card nc-card">
            <div className="digital-platform-title">No Campaigns Yet</div>
            <div className="digital-platform-meta">Create a campaign to see live activity here.</div>
          </div>
        )}
      </div> */}

      <div className="nc-panel nc-section">
        <div className="digital-table-head">
          <h2 className="digital-table-title">Recent Campaigns</h2>
          <button className="nc-btn nc-btn--primary" onClick={() => navigate("/campaigns")}>
            <Megaphone size={16} />
            View Campaigns
          </button>
        </div>

        <div className="nc-table-wrap">
          <table className="nc-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Channel</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.length ? (
                recentCampaigns.map((campaign) => (
                  <tr key={campaign._id}>
                    <td>{campaign.name}</td>
                    <td>{campaign.channel || "--"}</td>
                    <td>{formatDate(campaign.startDate)}</td>
                    <td>{formatDate(campaign.endDate)}</td>
                    <td>
                      <span className={getCampaignStatusClass(campaign.status)}>{campaign.status}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No campaigns found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DigitalMediaDashboard;
