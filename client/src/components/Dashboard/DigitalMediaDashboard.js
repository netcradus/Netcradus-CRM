import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarClock,
  Globe,
  Mail,
  Megaphone,
  Plus,
  Wallet,
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
import { dmApi, formatCurrency, formatDate, getWeekDates, sameDay, truncate } from "../../features/DigitalMedia/api";

const DIGITAL_CHART_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981"];

function DigitalMediaDashboard() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [posts, setPosts] = useState([]);
  const [inboxItems, setInboxItems] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [campaignsRes, postsRes, inboxRes] = await Promise.all([
          dmApi.get("/api/campaigns"),
          dmApi.get("/api/social/posts"),
          dmApi.get("/api/social/inbox"),
        ]);

        setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
        setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
        setInboxItems(Array.isArray(inboxRes.data) ? inboxRes.data : []);
      } catch (error) {
        setCampaigns([]);
        setPosts([]);
        setInboxItems([]);
      }
    };

    loadDashboard();
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const activeCampaigns = campaigns.filter((campaign) => campaign.status === "Active");
    const uniqueChannels = new Set(campaigns.map((campaign) => campaign.channel).filter(Boolean));
    const endingSoon = campaigns.filter((campaign) => {
      if (!campaign.endDate) return false;
      const diffMs = new Date(campaign.endDate).getTime() - Date.now();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    });
    const scheduledPosts = posts.filter((post) => post.status === "scheduled");
    const pendingApprovals = campaigns.filter((campaign) => campaign.approvalStatus === "pending_review").length
      + posts.filter((post) => post.approvalStatus === "pending_review").length;
    const activeThisMonth = campaigns.filter((campaign) => {
      const startDate = new Date(campaign.startDate);
      const endDate = new Date(campaign.endDate);
      return startDate <= now && endDate >= now;
    });
    const spentThisMonth = activeThisMonth.reduce((sum, campaign) => sum + (Number(campaign.budgetSpent) || 0), 0);
    const newInboxMessages = inboxItems.filter((item) => item.status === "new").length;

    return [
      { label: "Total Campaigns", value: campaigns.length, icon: <Megaphone size={18} /> },
      { label: "Active Now", value: activeCampaigns.length, icon: <Globe size={18} /> },
      { label: "Live Channels", value: uniqueChannels.size, icon: <Globe size={18} /> },
      { label: "Ending Soon", value: endingSoon.length, icon: <CalendarClock size={18} />, color: "var(--color-warning)" },
      { label: "Scheduled Posts", value: scheduledPosts.length, icon: <Mail size={18} /> },
      { label: "Pending Approvals", value: pendingApprovals, icon: <Mail size={18} />, color: "var(--color-warning)" },
      { label: "Budget Spent This Month", value: formatCurrency(spentThisMonth), icon: <Wallet size={18} /> },
      { label: "New Inbox Messages", value: newInboxMessages, icon: <Mail size={18} />, color: "var(--color-error)" },
    ];
  }, [campaigns, posts, inboxItems]);

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
      name,
      value,
      color: DIGITAL_CHART_COLORS[index % DIGITAL_CHART_COLORS.length],
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

  const weeklyDates = useMemo(() => getWeekDates(new Date()), []);

  const weeklyItems = useMemo(() => {
    return weeklyDates.map((date) => {
      const dayCampaigns = campaigns.filter((campaign) => {
        const start = new Date(campaign.startDate);
        const end = new Date(campaign.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
      });
      const dayPosts = posts.filter((post) => post.scheduledAt && sameDay(post.scheduledAt, date));
      return { date, dayCampaigns, dayPosts };
    });
  }, [campaigns, posts, weeklyDates]);

  const budgetHealth = useMemo(() => {
    const allocated = campaigns.reduce((sum, campaign) => sum + (Number(campaign.budgetAllocated) || 0), 0);
    const spent = campaigns.reduce((sum, campaign) => sum + (Number(campaign.budgetSpent) || 0), 0);
    return {
      allocated,
      spent,
      percentage: allocated > 0 ? Math.round((spent / allocated) * 100) : 0,
    };
  }, [campaigns]);

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Digital Media Dashboard</h1>
          <p className="subtitle">Campaign performance, scheduling visibility, and channel activity overview.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => navigate("/campaigns")}>
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-6)", marginBottom: "var(--space-8)" }}>
        {metrics.map((metric, index) => (
          <div key={index} className="nc-stat-card">
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value" style={{ color: metric.color }}>{metric.value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Channel Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={channelChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip cursor={{ fill: "var(--color-bg-hover)" }} />
              <Bar dataKey="total" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Campaign Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                {statusChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-4)", justifyContent: "center" }}>
            {statusChartData.map((item, index) => (
              <div key={index} style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", fontSize: "11px" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: item.color }} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="nc-card">
          <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Recent Launch Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={launchTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="launches" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Active Shift</h3>
          <AttendanceWidget />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="nc-card" onClick={() => navigate("/content-calendar")} style={{ cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h3 style={{ fontSize: "var(--text-base)" }}>This Week</h3>
            <span className="badge badge-neutral">Open Calendar</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "var(--space-2)" }}>
            {weeklyItems.map((day) => (
              <div key={day.date.toISOString()} style={{ padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-secondary)", minHeight: 120 }}>
                <div style={{ fontWeight: "var(--font-semibold)", marginBottom: "var(--space-2)" }}>
                  {day.date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })}
                </div>
                <div style={{ display: "grid", gap: "6px" }}>
                  {day.dayCampaigns.slice(0, 2).map((campaign) => (
                    <div key={campaign._id} style={{ fontSize: "10px", padding: "4px 6px", borderRadius: 999, background: "rgba(59,130,246,0.15)", color: "var(--color-accent)" }}>
                      {truncate(campaign.name, 22)}
                    </div>
                  ))}
                  {day.dayPosts.slice(0, 2).map((post) => (
                    <div key={post._id} style={{ fontSize: "10px", padding: "4px 6px", borderRadius: 999, background: "rgba(16,185,129,0.15)", color: "var(--color-success)" }}>
                      {truncate(post.content, 22)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="nc-card">
          <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Budget Health</h3>
          <div style={{ fontSize: "28px", fontWeight: "var(--font-bold)", marginBottom: "var(--space-2)" }}>{budgetHealth.percentage}%</div>
          <div style={{ color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
            {formatCurrency(budgetHealth.spent)} spent of {formatCurrency(budgetHealth.allocated)}
          </div>
          <div style={{ height: 12, borderRadius: 999, background: "var(--color-bg-tertiary)", overflow: "hidden", marginBottom: "var(--space-4)" }}>
            <div
              style={{
                width: `${Math.min(budgetHealth.percentage, 100)}%`,
                height: "100%",
                background: budgetHealth.percentage > 100 ? "var(--color-error)" : budgetHealth.percentage > 90 ? "var(--color-warning)" : "var(--color-success)",
              }}
            />
          </div>
          <button className="btn btn-ghost" onClick={() => navigate("/budget-overview")}>Open Budget Overview</button>
        </div>
      </div>

      <div className="nc-card">
        <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Recent Activity</h3>
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
            {campaigns.slice(0, 5).map((campaign) => (
              <tr key={campaign._id}>
                <td>{campaign.name}</td>
                <td>{campaign.channel || "--"}</td>
                <td>{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</td>
                <td>
                  <span className={`badge ${campaign.status?.toLowerCase() === "active" ? "badge-success" : "badge-warning"}`}>
                    {campaign.status}
                  </span>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && <tr><td colSpan="4" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No campaigns found</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DigitalMediaDashboard;
