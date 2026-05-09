import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Clock, Coffee, LogIn, LogOut, PlayCircle, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";

import { apiUrl } from "../../config/api";

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

const formatSeconds = (seconds = 0) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safeSeconds / 3600);
  const m = Math.floor((safeSeconds % 3600) / 60);
  const s = safeSeconds % 60;
  return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
};

const formatMinutesSummary = (minutes = 0) => {
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
};

export default function AttendanceWidget() {
  const userRole = String(localStorage.getItem("userRole")).toLowerCase();
  const isAdmin = ["super_user", "hr", "admin"].includes(userRole);
  const [snapshot, setSnapshot] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(Date.now());

  const fetchData = useCallback(async () => {
    try {
      if (isAdmin) {
        const { data } = await axios.get(apiUrl("/api/attendance/admin/today-snapshot"), { headers: getHeaders() });
        setSnapshot(data.data);
      } else {
        const { data } = await axios.get(apiUrl("/api/attendance/current-status"), { headers: getHeaders() });
        setStatusData(data.data);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const inv = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(inv);
  }, []);

  const liveMetrics = useMemo(() => {
    if (!statusData?.record) return { workSeconds: 0, breakSeconds: 0 };
    const srvMs = statusData.serverTime ? new Date(statusData.serverTime).getTime() : Date.now();
    const dSec = Math.max(0, Math.floor((tick - srvMs) / 1000));
    const isWork = statusData.record.punchIn && !statusData.record.punchOut && !statusData.record.isOnBreak;
    const isBreak = statusData.record.isOnBreak;
    return {
      workSeconds: isWork ? (statusData.elapsedWorkSeconds || 0) + dSec : (statusData.elapsedWorkSeconds || 0),
      breakSeconds: isBreak ? (statusData.ongoingBreakDurationSeconds || 0) + dSec : 0
    };
  }, [statusData, tick]);

  if (loading) return <div className="nc-card" style={{ padding: 'var(--space-4)', opacity: 0.5 }}>Loading...</div>;

  if (isAdmin) {
    return (
      <div className="nc-card nc-card--interactive" style={{ padding: 'var(--space-4)' }} onClick={() => window.location.href = "/admin/attendance"}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Clock size={16} color="var(--color-accent)" />
              <h4 style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Team Pulse</h4>
           </div>
           <span className="badge badge-success" style={{ fontSize: '9px' }}>Live</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
           <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Present</span>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)' }}>{snapshot?.presentCount || 0}</span>
           </div>
           <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Late</span>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--color-warning)' }}>{snapshot?.lateCount || 0}</span>
           </div>
        </div>
      </div>
    );
  }

  const isPunchedIn = statusData?.record?.punchIn && !statusData?.record?.punchOut;

  return (
    <div className="nc-card" style={{ padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
         <h4 style={{ margin: 0, fontSize: 'var(--text-sm)' }}>My Attendance</h4>
         <span className={`badge ${isPunchedIn ? 'badge-success' : 'badge-neutral'}`}>{isPunchedIn ? 'Active' : 'Offline'}</span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
         <div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Shift Duration</span>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', fontFamily: 'var(--font-heading)' }}>{formatSeconds(liveMetrics.workSeconds)}</div>
         </div>

         {statusData?.record?.isOnBreak && (
           <div style={{ padding: 'var(--space-2)', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-warning-soft)' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-warning)' }}>Break: {formatSeconds(liveMetrics.breakSeconds)}</span>
           </div>
         )}

         <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            {!isPunchedIn ? (
              <button className="btn btn-primary" style={{ flex: 1, height: '36px' }} onClick={() => window.location.href = "/attendance"}><LogIn size={14} /> Punch In</button>
            ) : (
              <button className="btn btn-ghost" style={{ flex: 1, height: '36px' }} onClick={() => window.location.href = "/attendance"}>Control <ChevronRight size={14} /></button>
            )}
         </div>
      </div>
    </div>
  );
}
