import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { dmApi, getMonthBounds, sameDay, truncate } from "./api";

const getCalendarDays = (monthDate) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstGridDay = new Date(firstDay);
  firstGridDay.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + index);
    return date;
  });
};

const ContentCalendarPage = () => {
  const [monthDate, setMonthDate] = useState(new Date());
  const [campaigns, setCampaigns] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeDay, setActiveDay] = useState(null);

  const loadCalendar = async (date) => {
    const { start, end } = getMonthBounds(date);
    const [campaignsRes, postsRes] = await Promise.all([
      dmApi.get("/api/campaigns", { params: { from: start.toISOString(), to: end.toISOString() } }),
      dmApi.get("/api/social/posts", { params: { from: start.toISOString(), to: end.toISOString() } }),
    ]);

    setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
    setPosts(Array.isArray(postsRes.data) ? postsRes.data : []);
  };

  useEffect(() => {
    loadCalendar(monthDate);
  }, [monthDate]);

  const days = useMemo(() => getCalendarDays(monthDate), [monthDate]);

  const itemsForDay = (date) => {
    const campaignItems = campaigns.flatMap((campaign) => {
      const start = new Date(campaign.startDate);
      const end = new Date(campaign.endDate);
      if (date < new Date(start.setHours(0, 0, 0, 0)) || date > new Date(end.setHours(23, 59, 59, 999))) {
        return [];
      }

      let variant = "Running";
      if (sameDay(campaign.startDate, date)) {
        variant = "Starts";
      } else if (sameDay(campaign.endDate, date)) {
        variant = "Ends";
      }

      return [{
        type: "campaign",
        title: campaign.name,
        subtitle: `${variant} · ${campaign.channel || "General"}`,
      }];
    });

    const postItems = posts
      .filter((post) => post.scheduledAt && sameDay(post.scheduledAt, date))
      .map((post) => ({
        type: "post",
        title: truncate(post.content, 36),
        subtitle: `${(post.platforms || []).join(", ")} · ${new Date(post.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
      }));

    return [...campaignItems, ...postItems];
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Content Calendar</h1>
          <p className="subtitle">Monthly campaign and scheduled-post visibility across the marketing schedule.</p>
        </div>
        <div className="page-header-right" style={{ display: "flex", gap: "var(--space-2)" }}>
          <button className="btn btn-ghost" onClick={() => setMonthDate(new Date())}>Today</button>
          <button className="btn btn-ghost" onClick={() => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
            <ChevronLeft size={14} />
          </button>
          <button className="btn btn-ghost" onClick={() => setMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="nc-card">
        <div style={{ fontWeight: "var(--font-semibold)", marginBottom: "var(--space-4)" }}>
          {monthDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} style={{ padding: "var(--space-2)", fontSize: "12px", color: "var(--color-text-muted)" }}>{day}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "var(--space-2)" }}>
          {days.map((date) => {
            const items = itemsForDay(date);
            const isCurrentMonth = date.getMonth() === monthDate.getMonth();

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => setActiveDay(date)}
                style={{
                  minHeight: "124px",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  background: isCurrentMonth ? "var(--color-bg-secondary)" : "var(--color-bg-tertiary)",
                  padding: "var(--space-3)",
                  textAlign: "left",
                  display: "grid",
                  alignContent: "start",
                  gap: "6px",
                }}
              >
                <div style={{ fontWeight: "var(--font-semibold)", opacity: isCurrentMonth ? 1 : 0.55 }}>{date.getDate()}</div>
                {items.slice(0, 4).map((item, index) => (
                  <div
                    key={`${item.type}-${index}`}
                    style={{
                      fontSize: "10px",
                      padding: "4px 6px",
                      borderRadius: "999px",
                      background: item.type === "campaign" ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)",
                      color: item.type === "campaign" ? "var(--color-accent)" : "var(--color-success)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.subtitle}
                  </div>
                ))}
                {items.length > 4 && (
                  <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>+{items.length - 4} more</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeDay && (
        <div className="nc-modal-overlay" onClick={() => setActiveDay(null)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "min(720px, 92vw)" }}>
            <div className="nc-modal-header">
              <h3>{activeDay.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</h3>
            </div>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              {itemsForDay(activeDay).map((item, index) => (
                <div key={`${item.type}-${index}`} style={{ padding: "var(--space-4)", borderRadius: "var(--radius-lg)", background: "var(--color-bg-secondary)" }}>
                  <div style={{ fontWeight: "var(--font-semibold)", marginBottom: "4px" }}>{item.title}</div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{item.subtitle}</div>
                </div>
              ))}
              {itemsForDay(activeDay).length === 0 && (
                <div style={{ color: "var(--color-text-muted)" }}>No campaigns or scheduled posts on this day.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentCalendarPage;
