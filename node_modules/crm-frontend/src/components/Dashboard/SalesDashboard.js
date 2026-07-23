// // import React, { useEffect, useState } from "react";
// // import {
// //   TrendingUp,
// //   Search,
// //   Plus,
// //   Download,
// // } from "lucide-react";
// // import {
// //   LineChart, Line, XAxis, YAxis, Tooltip,
// //   BarChart, Bar, CartesianGrid,
// //   ResponsiveContainer
// // } from "recharts";
// // import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
// // import { apiUrl } from "../../config/api";

// // const API = apiUrl("/api/deals");

// // const formatRoleLabel = (value = "") =>
// //   value === "admin"
// //     ? "Administrator"
// //     : String(value)
// //         .replace(/_/g, " ")
// //         .replace(/\b\w/g, (char) => char.toUpperCase());

// // const SalesDashboard = ({ preview }) => {
// //   const [deals, setDeals] = useState([]);
// //   const [search, setSearch] = useState("");
// //   const [filter, setFilter] = useState("");
// //   const [showModal, setShowModal] = useState(false);

// //   const [newDeal, setNewDeal] = useState({
// //     name: "",
// //     value: "",
// //     status: "In Progress",
// //     assignedTo: "",
// //   });
// //   const userName = localStorage.getItem("userName") || "User";
// //   const userRole = localStorage.getItem("userRole") || "sales";

// //   const fetchDeals = async () => {
// //     try {
// //       const res = await fetch(API);
// //       const data = await res.json();
// //       setDeals(Array.isArray(data) ? data : []);
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchDeals();
// //     const interval = setInterval(fetchDeals, 30000);
// //     return () => clearInterval(interval);
// //   }, []);

// //   const handleAddDeal = async (e) => {
// //     e.preventDefault();
// //     try {
// //       await fetch(API, {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json" },
// //         body: JSON.stringify(newDeal),
// //       });
// //       fetchDeals();
// //       setShowModal(false);
// //       setNewDeal({ name: "", value: "", status: "In Progress", assignedTo: "" });
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   };

// //   const filteredDeals = deals.filter((d) => {
// //     const matchesStatus = filter ? d.status?.toLowerCase() === filter.toLowerCase() : true;
// //     const matchesSearch = search ? d.name?.toLowerCase().includes(search.toLowerCase()) : true;
// //     return matchesStatus && matchesSearch;
// //   });

// //   const revenueTrend = deals.map((d, index) => ({
// //     name: d.name?.substring(0, 10) || `Deal ${index + 1}`,
// //     revenue: Number(d.value || 0),
// //   }));

// //   const dealsOverTime = deals.map((d, index) => ({
// //     name: d.name?.substring(0, 10) || `Deal ${index + 1}`,
// //     count: 1,
// //   }));

// //   return (
// //     <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
// //       <div className="page-header">
// //         <div className="page-header-left">
// //           <h1 className="title">Sales Dashboard</h1>
// //           <p className="subtitle">Pipeline overview and deal management.</p>
// //         </div>
// //         <div className="page-header-right" style={{ display: 'flex', gap: 'var(--space-3)' }}>
// //           <button className="btn btn-outline" onClick={() => {
// //              const csv = deals.map(d => `${d.name},${d.value},${d.status}`).join("\n");
// //              const blob = new Blob([csv], { type: "text/csv" });
// //              const url = window.URL.createObjectURL(blob);
// //              const a = document.createElement("a");
// //              a.href = url; a.download = "deals.csv"; a.click();
// //           }}>
// //             <Download size={16} /> Export
// //           </button>
// //           <button className="btn btn-primary" onClick={() => setShowModal(true)}>
// //             <Plus size={16} /> Add Deal
// //           </button>
// //         </div>
// //       </div>

// //       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
// //         <div className="nc-stat-card">
// //           <span className="metric-label">Open Deals</span>
// //           <span className="metric-value">{deals.filter(d => d.status === "In Progress").length}</span>
// //         </div>
// //         <div className="nc-stat-card">
// //           <span className="metric-label">Pipeline Value</span>
// //           <span className="metric-value">₹ {deals.reduce((acc, d) => acc + Number(d.value || 0), 0).toLocaleString()}</span>
// //         </div>
// //         <div className="nc-stat-card">
// //           <span className="metric-label">Deals Won</span>
// //           <span className="metric-value" style={{ color: 'var(--color-success)' }}>{deals.filter(d => d.status === "Won").length}</span>
// //         </div>
// //       </div>

// //       <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
// //         <div className="nc-card">
// //           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
// //             <h3 style={{ fontSize: 'var(--text-base)' }}>Revenue Trend</h3>
// //           </div>
// //           <ResponsiveContainer width="100%" height={260}>
// //             <LineChart data={revenueTrend}>
// //               <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
// //               <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
// //               <YAxis axisLine={false} tickLine={false} fontSize={10} />
// //               <Tooltip />
// //               <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} dot={{r: 3}} />
// //             </LineChart>
// //           </ResponsiveContainer>
// //         </div>
// //         <div className="nc-card">
// //           <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Sales Activity</h3>
// //           <ResponsiveContainer width="100%" height={260}>
// //             <BarChart data={dealsOverTime}>
// //               <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
// //               <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
// //               <YAxis axisLine={false} tickLine={false} fontSize={10} />
// //               <Tooltip />
// //               <Bar dataKey="count" fill="var(--color-accent-muted)" stroke="var(--color-accent)" radius={[2, 2, 0, 0]} />
// //             </BarChart>
// //           </ResponsiveContainer>
// //         </div>
// //       </div>

// //       <div className="nc-card">
// //         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
// //           <h3 style={{ fontSize: 'var(--text-base)' }}>Pipeline Deals</h3>
// //           <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
// //             <div className="form-field" style={{ marginBottom: 0 }}>
// //               <input 
// //                 className="form-input" 
// //                 placeholder="Search..." 
// //                 value={search} 
// //                 onChange={(e) => setSearch(e.target.value)} 
// //                 style={{ height: '32px', width: '160px' }}
// //               />
// //             </div>
// //             <select className="form-select" onChange={(e) => setFilter(e.target.value)} style={{ height: '32px', width: '130px' }}>
// //               <option value="">All Statuses</option>
// //               <option value="In Progress">In Progress</option>
// //               <option value="Won">Won</option>
// //               <option value="Lost">Lost</option>
// //             </select>
// //           </div>
// //         </div>

// //         <table className="nc-table">
// //           <thead>
// //             <tr>
// //               <th>Deal Name</th>
// //               <th>Value</th>
// //               <th>Status</th>
// //               <th>Assigned To</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {filteredDeals.map((deal) => (
// //               <tr key={deal._id}>
// //                 <td>{deal.name}</td>
// //                 <td>₹ {Number(deal.value || 0).toLocaleString()}</td>
// //                 <td>
// //                   <span className={`badge badge-${deal.status?.toLowerCase() === 'won' ? 'success' : deal.status?.toLowerCase() === 'lost' ? 'error' : 'warning'}`}>
// //                     {deal.status}
// //                   </span>
// //                 </td>
// //                 <td>{deal.assignedTo || '--'}</td>
// //               </tr>
// //             ))}
// //             {filteredDeals.length === 0 && (
// //               <tr>
// //                 <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
// //                   No deals found matching your criteria.
// //                 </td>
// //               </tr>
// //             )}
// //           </tbody>
// //         </table>
// //       </div>

// //       <div className="nc-card" style={{ marginTop: 'var(--space-6)' }}>
// //         <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Shift Status</h3>
// //         <AttendanceWidget />
// //       </div>

// //       {showModal && (
// //         <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
// //           <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '400px' }}>
// //             <div className="nc-modal-header">
// //               <h3>Add New Deal</h3>
// //             </div>
// //             <form onSubmit={handleAddDeal} className="form">
// //               <div className="form-field">
// //                 <label className="form-label">Deal Name</label>
// //                 <input className="form-input" value={newDeal.name} onChange={e => setNewDeal({...newDeal, name: e.target.value})} required />
// //               </div>
// //               <div className="form-field">
// //                 <label className="form-label">Value (₹)</label>
// //                 <input className="form-input" type="number" value={newDeal.value} onChange={e => setNewDeal({...newDeal, value: e.target.value})} required />
// //               </div>
// //               <div className="form-field">
// //                 <label className="form-label">Assigned To</label>
// //                 <input className="form-input" value={newDeal.assignedTo} onChange={e => setNewDeal({...newDeal, assignedTo: e.target.value})} required />
// //               </div>
// //               <div className="form-field">
// //                 <label className="form-label">Status</label>
// //                 <select className="form-select" value={newDeal.status} onChange={e => setNewDeal({...newDeal, status: e.target.value})}>
// //                   <option>In Progress</option>
// //                   <option>Won</option>
// //                   <option>Lost</option>
// //                 </select>
// //               </div>
// //               <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
// //                 <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Deal</button>
// //                 <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
// //               </div>
// //             </form>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // export default SalesDashboard;









// import React, { useEffect, useState } from "react";
// import {
//   TrendingUp,
//   Search,
//   Plus,
//   Download,
//   CheckCircle,
//   XCircle,
//   MessageSquare,
//   Video,
//   Bell,
//   X,
//   ChevronRight,
//   User,
//   Building2,
//   DollarSign,
//   Calendar,
//   Link2,
//   Clock,
//   Send,
//   AlertCircle,
// } from "lucide-react";
// import {
//   LineChart, Line, XAxis, YAxis, Tooltip,
//   BarChart, Bar, CartesianGrid,
//   ResponsiveContainer
// } from "recharts";
// import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
// import { apiUrl } from "../../config/api";

// const API = apiUrl("/api/deals");

// /* ─── helpers ─────────────────────────────────────────────── */
// const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

// const statusColor = (s = "") => {
//   if (s === "Won") return "success";
//   if (s === "Lost") return "error";
//   return "warning";
// };

// const isClosed = (deal) => deal?.status === "Won" || deal?.status === "Lost";

// /* ─── tiny sub-components ─────────────────────────────────── */
// const Field = ({ label, value }) => (
//   <div style={{ marginBottom: "var(--space-3)" }}>
//     <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 2 }}>{label}</span>
//     <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{value || "—"}</span>
//   </div>
// );

// const SectionHeader = ({ icon: Icon, title }) => (
//   <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "var(--space-3)" }}>
//     <Icon size={15} style={{ color: "var(--color-accent)" }} />
//     <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>{title}</h4>
//   </div>
// );

// const EmptyState = ({ text }) => (
//   <p style={{ margin: 0, padding: "var(--space-3)", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", background: "var(--color-bg-muted)", borderRadius: 6 }}>{text}</p>
// );

// /* ─── TABS ─────────────────────────────────────────────────── */
// const TABS = ["Overview", "Comments", "Meetings", "Reminders"];

// const TabBar = ({ active, onChange, disabled }) => (
//   <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "var(--space-5)" }}>
//     {TABS.map((t) => (
//       <button
//         key={t}
//         onClick={() => !disabled && onChange(t)}
//         style={{
//           background: "none",
//           border: "none",
//           padding: "10px 16px",
//           fontSize: "var(--text-sm)",
//           fontWeight: active === t ? 600 : 400,
//           color: active === t ? "var(--color-accent)" : disabled && t !== "Overview" ? "var(--color-text-muted)" : "var(--color-text)",
//           borderBottom: active === t ? "2px solid var(--color-accent)" : "2px solid transparent",
//           cursor: disabled && t !== "Overview" ? "not-allowed" : "pointer",
//           marginBottom: -1,
//           opacity: disabled && t !== "Overview" ? 0.45 : 1,
//           transition: "color .15s",
//         }}
//       >
//         {t}
//       </button>
//     ))}
//   </div>
// );

// /* ─── MAIN COMPONENT ───────────────────────────────────────── */
// const SalesDashboard = ({ preview }) => {
//   const [deals, setDeals] = useState([]);
//   const [search, setSearch] = useState("");
//   const [filter, setFilter] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [selectedDeal, setSelectedDeal] = useState(null);
//   const [activeTab, setActiveTab] = useState("Overview");

//   const [commentText, setCommentText] = useState("");
//   const [meetingForm, setMeetingForm] = useState({ title: "", meetingLink: "", meetingTime: "", discussion: "", nextAction: "" });
//   const [reminderForm, setReminderForm] = useState({ title: "", remindAt: "" });

//   const [newDeal, setNewDeal] = useState({
//     name: "", clientName: "", clientPhone: "", clientEmail: "",
//     companyName: "", businessUrl: "", description: "", value: "",
//     expectedCloseDate: "", initialComment: "", meetingLink: "",
//     meetingTime: "", meetingDiscussion: "", reminderDate: "", reminderNote: "",
//   });

//   const getHeaders = () => ({
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
//   });

//   const fetchDeals = async () => {
//     try {
//       const res = await fetch(API, { headers: getHeaders() });
//       const result = await res.json();
//       const list = Array.isArray(result?.data) ? result.data : [];
//       setDeals(list);
//       if (selectedDeal) {
//         const updated = list.find((d) => d._id === selectedDeal._id);
//         if (updated) setSelectedDeal(updated);
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   useEffect(() => {
//     fetchDeals();
//     const id = setInterval(fetchDeals, 30000);
//     return () => clearInterval(id);
//   }, [selectedDeal?._id]);

//   const openDeal = (deal) => { setSelectedDeal(deal); setActiveTab("Overview"); };
//   const closeDeal = () => setSelectedDeal(null);

//   const handleAddDeal = async (e) => {
//     e.preventDefault();
//     try {
//       await fetch(API, { method: "POST", headers: getHeaders(), body: JSON.stringify(newDeal) });
//       fetchDeals();
//       setShowModal(false);
//       setNewDeal({ name: "", clientName: "", clientPhone: "", clientEmail: "", companyName: "", businessUrl: "", description: "", value: "", expectedCloseDate: "", initialComment: "", meetingLink: "", meetingTime: "", meetingDiscussion: "", reminderDate: "", reminderNote: "" });
//     } catch (err) { console.error(err); }
//   };

//   const handleStatusChange = async (id, status) => {
//     try {
//       await fetch(`${API}/${id}/${status}`, { method: "PATCH", headers: getHeaders() });
//       fetchDeals();
//     } catch (err) { console.error(err); }
//   };

//   const handleAddComment = async (e) => {
//     e.preventDefault();
//     if (!commentText.trim()) return;
//     try {
//       await fetch(`${API}/${selectedDeal._id}/comments`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ comment: commentText }) });
//       setCommentText("");
//       fetchDeals();
//     } catch (err) { console.error(err); }
//   };

//   const handleAddMeeting = async (e) => {
//     e.preventDefault();
//     try {
//       await fetch(`${API}/${selectedDeal._id}/meetings`, { method: "POST", headers: getHeaders(), body: JSON.stringify(meetingForm) });
//       setMeetingForm({ title: "", meetingLink: "", meetingTime: "", discussion: "", nextAction: "" });
//       fetchDeals();
//     } catch (err) { console.error(err); }
//   };

//   const handleAddReminder = async (e) => {
//     e.preventDefault();
//     try {
//       await fetch(`${API}/${selectedDeal._id}/reminders`, { method: "POST", headers: getHeaders(), body: JSON.stringify(reminderForm) });
//       setReminderForm({ title: "", remindAt: "" });
//       fetchDeals();
//     } catch (err) { console.error(err); }
//   };

//   const filteredDeals = deals.filter((d) => {
//     const ms = filter ? d.status?.toLowerCase() === filter.toLowerCase() : true;
//     const mq = search ? d.name?.toLowerCase().includes(search.toLowerCase()) : true;
//     return ms && mq;
//   });

//   const openDealsCount = deals.filter((d) => !isClosed(d)).length;
//   const totalPipelineValue = deals.reduce((a, d) => a + Number(d.value || 0), 0);
//   const wonDealsCount = deals.filter((d) => d.status === "Won").length;

//   const revenueTrend = deals.filter((d) => d.status === "Won").map((d, i) => ({
//     name: d.name?.substring(0, 10) || `Deal ${i + 1}`,
//     revenue: Number(d.value || 0),
//   }));

//   const dealsOverTime = deals.map((d, i) => ({
//     name: d.name?.substring(0, 10) || `Deal ${i + 1}`,
//     count: 1,
//   }));

//   /* ── input style shorthand ── */
//   const inp = { height: 36, fontSize: "var(--text-sm)" };
//   const sm = { height: 30, fontSize: 12 };

//   return (
//     <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>

//       {/* ── Header ── */}
//       <div className="page-header">
//         <div className="page-header-left">
//           <h1 className="title">Sales Dashboard</h1>
//           <p className="subtitle">Pipeline overview and deal management.</p>
//         </div>
//         <div className="page-header-right" style={{ display: "flex", gap: "var(--space-3)" }}>
//           <button className="btn btn-outline" onClick={() => {
//             const csv = deals.map((d) => `${d.name},${d.value},${d.status}`).join("\n");
//             const blob = new Blob([csv], { type: "text/csv" });
//             const url = window.URL.createObjectURL(blob);
//             const a = document.createElement("a"); a.href = url; a.download = "deals.csv"; a.click();
//           }}>
//             <Download size={16} /> Export
//           </button>
//           <button className="btn btn-primary" onClick={() => setShowModal(true)}>
//             <Plus size={16} /> Add Deal
//           </button>
//         </div>
//       </div>

//       {/* ── Stat cards ── */}
//       <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--space-5)", marginBottom: "var(--space-8)" }}>
//         {[
//           { label: "Open Deals", value: openDealsCount },
//           { label: "Pipeline Value", value: `₹ ${fmt(totalPipelineValue)}` },
//           { label: "Deals Won", value: wonDealsCount, accent: true },
//         ].map(({ label, value, accent }) => (
//           <div key={label} className="nc-stat-card">
//             <span className="metric-label">{label}</span>
//             <span className="metric-value" style={accent ? { color: "var(--color-success)" } : {}}>{value}</span>
//           </div>
//         ))}
//       </div>

//       {/* ── Charts ── */}
//       <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
//         <div className="nc-card">
//           <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-4)" }}>Revenue Trend (Won Deals)</h3>
//           <ResponsiveContainer width="100%" height={240}>
//             {revenueTrend.length > 0 ? (
//               <LineChart data={revenueTrend}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
//                 <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
//                 <YAxis axisLine={false} tickLine={false} fontSize={10} />
//                 <Tooltip />
//                 <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
//               </LineChart>
//             ) : (
//               <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No won deals yet</div>
//             )}
//           </ResponsiveContainer>
//         </div>
//         <div className="nc-card">
//           <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-4)" }}>Sales Activity</h3>
//           <ResponsiveContainer width="100%" height={240}>
//             <BarChart data={dealsOverTime}>
//               <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
//               <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
//               <YAxis axisLine={false} tickLine={false} fontSize={10} />
//               <Tooltip />
//               <Bar dataKey="count" fill="var(--color-accent-muted)" stroke="var(--color-accent)" radius={[3, 3, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* ── Pipeline table ── */}
//       <div className="nc-card">
//         <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
//           <h3 style={{ fontSize: "var(--text-base)" }}>Pipeline Deals</h3>
//           <div style={{ display: "flex", gap: "var(--space-2)" }}>
//             <div className="form-field" style={{ marginBottom: 0 }}>
//               <input className="form-input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ height: 32, width: 160 }} />
//             </div>
//             <select className="form-select" onChange={(e) => setFilter(e.target.value)} style={{ height: 32, width: 150 }}>
//               <option value="">All Statuses</option>
//               {["New", "Contacted", "Meeting Scheduled", "Proposal Sent", "Negotiation", "Pending", "Won", "Lost"].map((s) => (
//                 <option key={s} value={s}>{s}</option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <table className="nc-table">
//           <thead>
//             <tr>
//               <th>Deal Name</th><th>Value</th><th>Status</th><th>Assigned To</th><th style={{ textAlign: "right" }}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredDeals.map((deal) => (
//               <tr key={deal._id} onClick={() => openDeal(deal)} style={{ cursor: "pointer" }}>
//                 <td><strong>{deal.name}</strong></td>
//                 <td>₹ {fmt(deal.value)}</td>
//                 <td>
//                   <span className={`badge badge-${statusColor(deal.status)}`}>{deal.status}</span>
//                 </td>
//                 <td>{deal.assignedTo?.name || "—"}</td>
//                 <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
//                   {!isClosed(deal) ? (
//                     <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
//                       <button className="btn btn-xs btn-success" style={{ padding: "2px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }} onClick={() => handleStatusChange(deal._id, "won")}>
//                         <CheckCircle size={12} /> Won
//                       </button>
//                       <button className="btn btn-xs btn-error" style={{ padding: "2px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }} onClick={() => handleStatusChange(deal._id, "lost")}>
//                         <XCircle size={12} /> Lost
//                       </button>
//                     </div>
//                   ) : (
//                     <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Closed</span>
//                   )}
//                 </td>
//               </tr>
//             ))}
//             {filteredDeals.length === 0 && (
//               <tr><td colSpan={5} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No deals found.</td></tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* ── Attendance ── */}
//       <div className="nc-card" style={{ marginTop: "var(--space-6)" }}>
//         <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Shift Status</h3>
//         <AttendanceWidget />
//       </div>

//       {/* ════════════════════════════════════════
//           ADD DEAL MODAL
//       ════════════════════════════════════════ */}
//       {showModal && (
//         <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
//           <div
//             className="nc-modal-content"
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               width: 640,
//               maxHeight: "90vh",
//               display: "flex",
//               flexDirection: "column",
//               borderRadius: 12,
//               overflow: "hidden",
//             }}
//           >
//             {/* sticky header */}
//             <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
//               <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Add New Deal</h3>
//               <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowModal(false)}><X size={18} /></button>
//             </div>

//             {/* scrollable body */}
//             <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
//               <form id="add-deal-form" onSubmit={handleAddDeal}>

//                 {/* Section: Deal Details */}
//                 <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-text-muted)" }}>Deal Details</p>
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Deal Name *</label>
//                     <input className="form-input" style={inp} value={newDeal.name} onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })} required />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Deal Value (₹)</label>
//                     <input className="form-input" style={inp} type="number" value={newDeal.value} onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Expected Close Date</label>
//                     <input className="form-input" style={inp} type="date" value={newDeal.expectedCloseDate} onChange={(e) => setNewDeal({ ...newDeal, expectedCloseDate: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Description</label>
//                     <textarea className="form-input" rows={2} value={newDeal.description} onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })} />
//                   </div>
//                 </div>

//                 {/* Section: Client Info */}
//                 <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-text-muted)" }}>Client Info</p>
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Client Name *</label>
//                     <input className="form-input" style={inp} value={newDeal.clientName} onChange={(e) => setNewDeal({ ...newDeal, clientName: e.target.value })} required />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Phone *</label>
//                     <input className="form-input" style={inp} value={newDeal.clientPhone} onChange={(e) => setNewDeal({ ...newDeal, clientPhone: e.target.value })} required />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Email</label>
//                     <input className="form-input" style={inp} type="email" value={newDeal.clientEmail} onChange={(e) => setNewDeal({ ...newDeal, clientEmail: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Company</label>
//                     <input className="form-input" style={inp} value={newDeal.companyName} onChange={(e) => setNewDeal({ ...newDeal, companyName: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Business URL</label>
//                     <input className="form-input" style={inp} value={newDeal.businessUrl} onChange={(e) => setNewDeal({ ...newDeal, businessUrl: e.target.value })} />
//                   </div>
//                 </div>

//                 {/* Section: Initial Logs */}
//                 <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-text-muted)" }}>Initial Logs (optional)</p>
//                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Initial Comment</label>
//                     <input className="form-input" style={inp} value={newDeal.initialComment} onChange={(e) => setNewDeal({ ...newDeal, initialComment: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Meeting Link</label>
//                     <input className="form-input" style={inp} value={newDeal.meetingLink} onChange={(e) => setNewDeal({ ...newDeal, meetingLink: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Meeting Time</label>
//                     <input className="form-input" style={inp} type="datetime-local" value={newDeal.meetingTime} onChange={(e) => setNewDeal({ ...newDeal, meetingTime: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                     <label className="form-label">Meeting Discussion</label>
//                     <input className="form-input" style={inp} value={newDeal.meetingDiscussion} onChange={(e) => setNewDeal({ ...newDeal, meetingDiscussion: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Reminder Date</label>
//                     <input className="form-input" style={inp} type="datetime-local" value={newDeal.reminderDate} onChange={(e) => setNewDeal({ ...newDeal, reminderDate: e.target.value })} />
//                   </div>
//                   <div className="form-field" style={{ marginBottom: 0 }}>
//                     <label className="form-label">Reminder Note</label>
//                     <input className="form-input" style={inp} value={newDeal.reminderNote} onChange={(e) => setNewDeal({ ...newDeal, reminderNote: e.target.value })} />
//                   </div>
//                 </div>
//               </form>
//             </div>

//             {/* sticky footer */}
//             <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
//               <button form="add-deal-form" type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Deal</button>
//               <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ════════════════════════════════════════
//           DEAL DETAILS MODAL  (tabbed)
//       ════════════════════════════════════════ */}
//       {selectedDeal && (
//         <div className="nc-modal-overlay" onClick={closeDeal}>
//           <div
//             className="nc-modal-content"
//             onClick={(e) => e.stopPropagation()}
//             style={{
//               width: 780,
//               maxHeight: "92vh",
//               display: "flex",
//               flexDirection: "column",
//               borderRadius: 12,
//               overflow: "hidden",
//             }}
//           >
//             {/* sticky header */}
//             <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
//               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
//                 <div>
//                   <h2 style={{ margin: "0 0 4px", fontSize: "var(--text-lg)", fontWeight: 700 }}>{selectedDeal.name}</h2>
//                   <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                     <span className={`badge badge-${statusColor(selectedDeal.status)}`}>{selectedDeal.status}</span>
//                     <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>₹ {fmt(selectedDeal.value)}</span>
//                     {selectedDeal.dealClosedAt && (
//                       <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
//                         · Closed {new Date(selectedDeal.dealClosedAt).toLocaleDateString()}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//                 <button className="btn btn-ghost" style={{ padding: 4 }} onClick={closeDeal}><X size={18} /></button>
//               </div>
//               <TabBar active={activeTab} onChange={setActiveTab} disabled={isClosed(selectedDeal)} />
//             </div>

//             {/* scrollable body */}
//             <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>

//               {/* ── OVERVIEW TAB ── */}
//               {activeTab === "Overview" && (
//                 <div>
//                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
//                     <div>
//                       <SectionHeader icon={User} title="Client" />
//                       <Field label="Name" value={selectedDeal.clientName} />
//                       <Field label="Phone" value={selectedDeal.clientPhone} />
//                       <Field label="Email" value={selectedDeal.clientEmail} />
//                     </div>
//                     <div>
//                       <SectionHeader icon={Building2} title="Company" />
//                       <Field label="Company" value={selectedDeal.companyName} />
//                       <Field label="Website" value={selectedDeal.businessUrl ? (
//                         <a href={selectedDeal.businessUrl} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>{selectedDeal.businessUrl}</a>
//                       ) : null} />
//                     </div>
//                     <div>
//                       <SectionHeader icon={DollarSign} title="Deal" />
//                       <Field label="Value" value={`₹ ${fmt(selectedDeal.value)}`} />
//                       <Field label="Assigned To" value={selectedDeal.assignedTo?.name} />
//                       <Field label="Expected Close" value={selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString() : null} />
//                     </div>
//                   </div>

//                   {selectedDeal.description && (
//                     <div style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "12px 14px" }}>
//                       <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{selectedDeal.description}</p>
//                     </div>
//                   )}

//                   {/* quick stats */}
//                   <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-5)" }}>
//                     {[
//                       { icon: MessageSquare, label: "Comments", count: selectedDeal.comments?.length ?? 0 },
//                       { icon: Video, label: "Meetings", count: selectedDeal.meetings?.length ?? 0 },
//                       { icon: Bell, label: "Reminders", count: selectedDeal.reminders?.length ?? 0 },
//                     ].map(({ icon: Icon, label, count }) => (
//                       <div
//                         key={label}
//                         onClick={() => !isClosed(selectedDeal) && setActiveTab(label)}
//                         style={{
//                           flex: 1,
//                           display: "flex",
//                           alignItems: "center",
//                           gap: 10,
//                           background: "var(--color-bg-muted)",
//                           borderRadius: 8,
//                           padding: "10px 14px",
//                           cursor: isClosed(selectedDeal) ? "default" : "pointer",
//                           border: "1px solid transparent",
//                           transition: "border .15s",
//                         }}
//                         onMouseEnter={(e) => !isClosed(selectedDeal) && (e.currentTarget.style.border = "1px solid var(--color-accent)")}
//                         onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid transparent")}
//                       >
//                         <Icon size={16} style={{ color: "var(--color-accent)" }} />
//                         <div>
//                           <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{count}</div>
//                           <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{label}</div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   {isClosed(selectedDeal) && (
//                     <div style={{ marginTop: "var(--space-5)", display: "flex", alignItems: "center", gap: 8, background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px" }}>
//                       <AlertCircle size={15} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
//                       <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
//                         This deal is closed. Comments, Meetings, and Reminders are read-only and cannot be added.
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* ── COMMENTS TAB ── */}
//               {activeTab === "Comments" && (
//                 <div>
//                   <div style={{ marginBottom: "var(--space-4)" }}>
//                     {selectedDeal.comments?.length ? (
//                       <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//                         {selectedDeal.comments.map((c, i) => (
//                           <div key={i} style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px" }}>
//                             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
//                               <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>{c.author || "User"}</span>
//                               {c.createdAt && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{new Date(c.createdAt).toLocaleString()}</span>}
//                             </div>
//                             <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>{c.comment}</p>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <EmptyState text="No comments yet. Add the first note below." />
//                     )}
//                   </div>

//                   <form onSubmit={handleAddComment} style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
//                     <input
//                       className="form-input"
//                       style={{ flex: 1, height: 38 }}
//                       placeholder="Write a note…"
//                       value={commentText}
//                       onChange={(e) => setCommentText(e.target.value)}
//                     />
//                     <button className="btn btn-primary" style={{ padding: "0 16px", height: 38, display: "flex", alignItems: "center", gap: 6 }}>
//                       <Send size={14} /> Send
//                     </button>
//                   </form>
//                 </div>
//               )}

//               {/* ── MEETINGS TAB ── */}
//               {activeTab === "Meetings" && (
//                 <div>
//                   {/* existing meetings */}
//                   {selectedDeal.meetings?.length ? (
//                     <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "var(--space-5)" }}>
//                       {selectedDeal.meetings.map((m, i) => (
//                         <div key={i} style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 14px" }}>
//                           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
//                             <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{m.title}</span>
//                             <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
//                               <Clock size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
//                               {new Date(m.meetingTime).toLocaleString()}
//                             </span>
//                           </div>
//                           {m.meetingLink && (
//                             <a href={m.meetingLink} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", display: "flex", alignItems: "center", gap: 3, marginBottom: 4 }}>
//                               <Link2 size={11} /> {m.meetingLink}
//                             </a>
//                           )}
//                           {m.discussion && <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{m.discussion}</p>}
//                           {m.nextAction && <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text)" }}>→ {m.nextAction}</p>}
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <EmptyState text="No meetings logged yet." />
//                   )}

//                   {/* add meeting form */}
//                   <div style={{ marginTop: "var(--space-5)", padding: "16px", background: "var(--color-bg-muted)", borderRadius: 10, border: "1px dashed var(--color-border)" }}>
//                     <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-text-muted)" }}>Log New Meeting</p>
//                     <form onSubmit={handleAddMeeting}>
//                       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
//                         <div className="form-field" style={{ marginBottom: 0 }}>
//                           <label className="form-label">Title *</label>
//                           <input className="form-input" style={sm} placeholder="e.g. Discovery Call" value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} required />
//                         </div>
//                         <div className="form-field" style={{ marginBottom: 0 }}>
//                           <label className="form-label">Date & Time *</label>
//                           <input className="form-input" style={sm} type="datetime-local" value={meetingForm.meetingTime} onChange={(e) => setMeetingForm({ ...meetingForm, meetingTime: e.target.value })} required />
//                         </div>
//                         <div className="form-field" style={{ marginBottom: 0 }}>
//                           <label className="form-label">Meeting Link</label>
//                           <input className="form-input" style={sm} placeholder="https://meet.google.com/…" value={meetingForm.meetingLink} onChange={(e) => setMeetingForm({ ...meetingForm, meetingLink: e.target.value })} />
//                         </div>
//                         <div className="form-field" style={{ marginBottom: 0 }}>
//                           <label className="form-label">Next Action</label>
//                           <input className="form-input" style={sm} placeholder="What happens next?" value={meetingForm.nextAction} onChange={(e) => setMeetingForm({ ...meetingForm, nextAction: e.target.value })} />
//                         </div>
//                         <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
//                           <label className="form-label">Discussion Notes</label>
//                           <textarea className="form-input" rows={2} style={{ fontSize: 12, resize: "vertical" }} placeholder="What was discussed?" value={meetingForm.discussion} onChange={(e) => setMeetingForm({ ...meetingForm, discussion: e.target.value })} />
//                         </div>
//                         <button type="submit" className="btn btn-primary" style={{ gridColumn: "span 2", height: 34 }}>
//                           Add Meeting
//                         </button>
//                       </div>
//                     </form>
//                   </div>
//                 </div>
//               )}

//               {/* ── REMINDERS TAB ── */}
//               {activeTab === "Reminders" && (
//                 <div>
//                   {selectedDeal.reminders?.length ? (
//                     <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "var(--space-5)" }}>
//                       {selectedDeal.reminders.map((r, i) => (
//                         <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--color-border)", borderRadius: 8, padding: "10px 14px" }}>
//                           <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
//                             <Bell size={14} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
//                             <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{r.title}</span>
//                           </div>
//                           <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
//                             {new Date(r.remindAt).toLocaleString()}
//                           </span>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <EmptyState text="No reminders set yet." />
//                   )}

//                   {/* add reminder form */}
//                   <div style={{ marginTop: "var(--space-5)", padding: "16px", background: "var(--color-bg-muted)", borderRadius: 10, border: "1px dashed var(--color-border)" }}>
//                     <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--color-text-muted)" }}>Set New Reminder</p>
//                     <form onSubmit={handleAddReminder}>
//                       <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
//                         <div className="form-field" style={{ marginBottom: 0 }}>
//                           <label className="form-label">Reason *</label>
//                           <input className="form-input" style={sm} placeholder="e.g. Follow up on proposal" value={reminderForm.title} onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })} required />
//                         </div>
//                         <div className="form-field" style={{ marginBottom: 0 }}>
//                           <label className="form-label">Remind At *</label>
//                           <input className="form-input" style={sm} type="datetime-local" value={reminderForm.remindAt} onChange={(e) => setReminderForm({ ...reminderForm, remindAt: e.target.value })} required />
//                         </div>
//                         <button type="submit" className="btn btn-primary" style={{ gridColumn: "span 2", height: 34 }}>
//                           Set Reminder
//                         </button>
//                       </div>
//                     </form>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* sticky footer */}
//             <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
//               <button className="btn btn-ghost" onClick={closeDeal}>Close</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SalesDashboard;


import React, { useEffect, useRef, useState } from "react";
import {
  Plus, Download, CheckCircle, XCircle,
  MessageSquare, Video, Bell, X,
  User, Building2, DollarSign, Link2,
  Clock, Send, AlertCircle, Lock,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  BarChart, Bar, CartesianGrid, ResponsiveContainer,
} from "recharts";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import { apiUrl } from "../../config/api";

const API = apiUrl("/api/deals");

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const statusColor = (s = "") => s === "Won" ? "success" : s === "Lost" ? "error" : "warning";
const isClosed = (deal) => deal?.status === "Won" || deal?.status === "Lost";

/* ─── small shared components ──────────────────────────────── */
const Field = ({ label, value }) => (
  <div style={{ marginBottom: "var(--space-3)" }}>
    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 2 }}>{label}</span>
    <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>{value || "—"}</span>
  </div>
);

const SectionHeader = ({ icon: Icon, title }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "var(--space-3)" }}>
    <Icon size={15} style={{ color: "var(--color-accent)" }} />
    <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>{title}</h4>
  </div>
);

const EmptyState = ({ text }) => (
  <p style={{ margin: 0, padding: "12px 14px", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", background: "var(--color-bg-muted)", borderRadius: 8 }}>{text}</p>
);

const ReadOnlyBanner = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--color-bg-muted)", border: "1px solid var(--color-border)", borderRadius: 8, padding: "10px 14px", marginBottom: "var(--space-4)" }}>
    <Lock size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
      This deal is <strong>closed</strong>. Records are read-only — no new entries can be added.
    </p>
  </div>
);

/* ─── TABS ─────────────────────────────────────────────────── */
const TABS = ["Overview", "Comments", "Meetings", "Reminders"];

const TabBar = ({ active, onChange }) => (
  <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "var(--space-5)" }}>
    {TABS.map((t) => (
      <button
        key={t}
        onClick={() => onChange(t)}
        style={{
          background: "none", border: "none",
          padding: "10px 16px",
          fontSize: "var(--text-sm)",
          fontWeight: active === t ? 600 : 400,
          color: active === t ? "var(--color-accent)" : "var(--color-text)",
          borderBottom: active === t ? "2px solid var(--color-accent)" : "2px solid transparent",
          cursor: "pointer",
          marginBottom: -1,
          transition: "color .15s",
        }}
      >{t}</button>
    ))}
  </div>
);

/* ─── MAIN COMPONENT ───────────────────────────────────────── */
const SalesDashboard = ({ preview }) => {
  const [deals, setDeals]               = useState([]);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState("");
  const [showModal, setShowModal]       = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [activeTab, setActiveTab]       = useState("Overview");

  const [commentText,  setCommentText]  = useState("");
  const [meetingForm,  setMeetingForm]  = useState({ title: "", meetingLink: "", meetingTime: "", discussion: "", nextAction: "" });
  const [reminderForm, setReminderForm] = useState({ title: "", remindAt: "" });

  const [newDeal, setNewDeal] = useState({
    name: "", clientName: "", clientPhone: "", clientEmail: "",
    companyName: "", businessUrl: "", description: "", value: "",
    expectedCloseDate: "", initialComment: "", meetingLink: "",
    meetingTime: "", meetingDiscussion: "", reminderDate: "", reminderNote: "",
  });

  // keep a ref to selectedDeal so fetchDeals closure always has latest value
  const selectedDealRef = useRef(selectedDeal);
  useEffect(() => { selectedDealRef.current = selectedDeal; }, [selectedDeal]);

  const getToken = () => localStorage.getItem("token") || "";

  const getHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const fetchDeals = async () => {
    const token = getToken();
    if (!token) return; // bail silently — retry logic below will re-attempt

    try {
      const res    = await fetch(API, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      if (res.status === 401) return; // token expired or invalid, don't crash
      const result = await res.json();
      const list   = Array.isArray(result?.data) ? result.data : [];
      setDeals(list);
      const current = selectedDealRef.current;
      if (current) {
        const updated = list.find((d) => d._id === current._id);
        if (updated) setSelectedDeal(updated);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    // Production race fix: token may not be in localStorage the instant
    // this component mounts (WelcomeAnimation delay). Poll until token is
    // ready, then start the normal fetch + interval cycle.
    let intervalId = null;

    const start = () => {
      fetchDeals();
      intervalId = setInterval(fetchDeals, 30000);
    };

    const token = getToken();
    if (token) {
      start();
    } else {
      // retry every 200ms until token appears (max ~3s)
      let attempts = 0;
      const waitForToken = setInterval(() => {
        attempts++;
        if (getToken()) {
          clearInterval(waitForToken);
          start();
        } else if (attempts >= 15) {
          clearInterval(waitForToken); // give up after 3s
        }
      }, 200);
      return () => { clearInterval(waitForToken); clearInterval(intervalId); };
    }

    return () => clearInterval(intervalId);
  }, [selectedDeal?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDeal  = (deal) => { setSelectedDeal(deal); setActiveTab("Overview"); };
  const closeDeal = ()     => setSelectedDeal(null);

  const handleAddDeal = async (e) => {
    e.preventDefault();
    try {
      await fetch(API, { method: "POST", headers: getHeaders(), body: JSON.stringify(newDeal) });
      fetchDeals();
      setShowModal(false);
      setNewDeal({ name: "", clientName: "", clientPhone: "", clientEmail: "", companyName: "", businessUrl: "", description: "", value: "", expectedCloseDate: "", initialComment: "", meetingLink: "", meetingTime: "", meetingDiscussion: "", reminderDate: "", reminderNote: "" });
    } catch (err) { console.error(err); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await fetch(`${API}/${id}/${status}`, { method: "PATCH", headers: getHeaders() });
      fetchDeals();
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await fetch(`${API}/${selectedDeal._id}/comments`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ comment: commentText }) });
      setCommentText("");
      fetchDeals();
    } catch (err) { console.error(err); }
  };

  const handleAddMeeting = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/${selectedDeal._id}/meetings`, { method: "POST", headers: getHeaders(), body: JSON.stringify(meetingForm) });
      setMeetingForm({ title: "", meetingLink: "", meetingTime: "", discussion: "", nextAction: "" });
      fetchDeals();
    } catch (err) { console.error(err); }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API}/${selectedDeal._id}/reminders`, { method: "POST", headers: getHeaders(), body: JSON.stringify(reminderForm) });
      setReminderForm({ title: "", remindAt: "" });
      fetchDeals();
    } catch (err) { console.error(err); }
  };

  const filteredDeals = deals.filter((d) => {
    const ms = filter ? d.status?.toLowerCase() === filter.toLowerCase() : true;
    const mq = search ? d.name?.toLowerCase().includes(search.toLowerCase()) : true;
    return ms && mq;
  });

  const openDealsCount      = deals.filter((d) => !isClosed(d)).length;
  const totalPipelineValue  = deals.reduce((a, d) => a + Number(d.value || 0), 0);
  const wonDealsCount       = deals.filter((d) => d.status === "Won").length;

  const revenueTrend  = deals.filter((d) => d.status === "Won").map((d, i) => ({ name: d.name?.substring(0, 10) || `Deal ${i+1}`, revenue: Number(d.value || 0) }));
  const dealsOverTime = deals.map((d, i) => ({ name: d.name?.substring(0, 10) || `Deal ${i+1}`, count: 1 }));

  /* ── input style helpers ── */
  const inp = { height: 36, fontSize: "var(--text-sm)" };
  const sm  = { height: 30, fontSize: 12 };

  /* ── safe url helper ── */
  const safeUrl = (url) => {
    if (!url) return null;
    try {
      const u = url.startsWith("http") ? url : `https://${url}`;
      new URL(u);
      return u;
    } catch { return null; }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Sales Dashboard</h1>
          <p className="subtitle">Pipeline overview and deal management.</p>
        </div>
        <div className="page-header-right" style={{ display: "flex", gap: "var(--space-3)" }}>
          <button className="btn btn-outline" onClick={() => {
            const csv  = deals.map((d) => `${d.name},${d.value},${d.status}`).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url  = window.URL.createObjectURL(blob);
            const a    = document.createElement("a"); a.href = url; a.download = "deals.csv"; a.click();
          }}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Deal
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--space-5)", marginBottom: "var(--space-8)" }}>
        {[
          { label: "Open Deals",     value: openDealsCount },
          { label: "Pipeline Value", value: `₹ ${fmt(totalPipelineValue)}` },
          { label: "Deals Won",      value: wonDealsCount, accent: true },
        ].map(({ label, value, accent }) => (
          <div key={label} className="nc-stat-card">
            <span className="metric-label">{label}</span>
            <span className="metric-value" style={accent ? { color: "var(--color-success)" } : {}}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="nc-card">
          <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-4)" }}>Revenue Trend (Won Deals)</h3>
          <ResponsiveContainer width="100%" height={240}>
            {revenueTrend.length > 0 ? (
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No won deals yet</div>
            )}
          </ResponsiveContainer>
        </div>
        <div className="nc-card">
          <h3 style={{ fontSize: "var(--text-base)", marginBottom: "var(--space-4)" }}>Sales Activity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dealsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} />
              <YAxis axisLine={false} tickLine={false} fontSize={10} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-accent-muted)" stroke="var(--color-accent)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Pipeline Table ── */}
      <div className="nc-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h3 style={{ fontSize: "var(--text-base)" }}>Pipeline Deals</h3>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <input className="form-input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ height: 32, width: 160 }} />
            </div>
            <select className="form-select" onChange={(e) => setFilter(e.target.value)} style={{ height: 32, width: 150 }}>
              <option value="">All Statuses</option>
              {["New","Contacted","Meeting Scheduled","Proposal Sent","Negotiation","Pending","Won","Lost"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <table className="nc-table">
          <thead>
            <tr>
              <th>Deal Name</th><th>Value</th><th>Status</th><th>Assigned To</th><th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDeals.map((deal) => (
              <tr key={deal._id} onClick={() => openDeal(deal)} style={{ cursor: "pointer" }}>
                <td><strong>{deal.name}</strong></td>
                <td>₹ {fmt(deal.value)}</td>
                <td><span className={`badge badge-${statusColor(deal.status)}`}>{deal.status}</span></td>
                <td>{deal.assignedTo?.name || "—"}</td>
                <td style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                  {!isClosed(deal) ? (
                    <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end" }}>
                      <button className="btn btn-xs btn-success" style={{ padding: "2px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }} onClick={() => handleStatusChange(deal._id, "won")}>
                        <CheckCircle size={12} /> Won
                      </button>
                      <button className="btn btn-xs btn-error" style={{ padding: "2px 8px", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }} onClick={() => handleStatusChange(deal._id, "lost")}>
                        <XCircle size={12} /> Lost
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Closed</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredDeals.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No deals found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Attendance ── */}
      <div className="nc-card" style={{ marginTop: "var(--space-6)" }}>
        <h3 style={{ marginBottom: "var(--space-4)", fontSize: "var(--text-base)" }}>Shift Status</h3>
        <AttendanceWidget />
      </div>

      {/* ════════════════════════════════════════
          ADD DEAL MODAL
      ════════════════════════════════════════ */}
      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 640, maxHeight: "90vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>

            {/* header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)" }}>Add New Deal</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            {/* scrollable body */}
            <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>
              <form id="add-deal-form" onSubmit={handleAddDeal}>

                <p style={sectionLabel}>Deal Details</p>
                <div style={grid2}>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Deal Name *</label>
                    <input className="form-input" style={inp} value={newDeal.name} onChange={(e) => setNewDeal({ ...newDeal, name: e.target.value })} required />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Deal Value (₹)</label>
                    <input className="form-input" style={inp} type="number" value={newDeal.value} onChange={(e) => setNewDeal({ ...newDeal, value: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Expected Close Date</label>
                    <input className="form-input" style={inp} type="date" value={newDeal.expectedCloseDate} onChange={(e) => setNewDeal({ ...newDeal, expectedCloseDate: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Description</label>
                    <textarea className="form-input" rows={2} value={newDeal.description} onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })} />
                  </div>
                </div>

                <p style={{ ...sectionLabel, marginTop: "var(--space-5)" }}>Client Info</p>
                <div style={grid2}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Client Name *</label>
                    <input className="form-input" style={inp} value={newDeal.clientName} onChange={(e) => setNewDeal({ ...newDeal, clientName: e.target.value })} required />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Phone *</label>
                    <input className="form-input" style={inp} value={newDeal.clientPhone} onChange={(e) => setNewDeal({ ...newDeal, clientPhone: e.target.value })} required />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Email</label>
                    <input className="form-input" style={inp} type="email" value={newDeal.clientEmail} onChange={(e) => setNewDeal({ ...newDeal, clientEmail: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Company</label>
                    <input className="form-input" style={inp} value={newDeal.companyName} onChange={(e) => setNewDeal({ ...newDeal, companyName: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Business URL</label>
                    <input className="form-input" style={inp} value={newDeal.businessUrl} onChange={(e) => setNewDeal({ ...newDeal, businessUrl: e.target.value })} />
                  </div>
                </div>

                <p style={{ ...sectionLabel, marginTop: "var(--space-5)" }}>Initial Logs (optional)</p>
                <div style={grid2}>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Initial Comment</label>
                    <input className="form-input" style={inp} value={newDeal.initialComment} onChange={(e) => setNewDeal({ ...newDeal, initialComment: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Meeting Link</label>
                    <input className="form-input" style={inp} value={newDeal.meetingLink} onChange={(e) => setNewDeal({ ...newDeal, meetingLink: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Meeting Time</label>
                    <input className="form-input" style={inp} type="datetime-local" value={newDeal.meetingTime} onChange={(e) => setNewDeal({ ...newDeal, meetingTime: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                    <label className="form-label">Meeting Discussion</label>
                    <input className="form-input" style={inp} value={newDeal.meetingDiscussion} onChange={(e) => setNewDeal({ ...newDeal, meetingDiscussion: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Reminder Date</label>
                    <input className="form-input" style={inp} type="datetime-local" value={newDeal.reminderDate} onChange={(e) => setNewDeal({ ...newDeal, reminderDate: e.target.value })} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="form-label">Reminder Note</label>
                    <input className="form-input" style={inp} value={newDeal.reminderNote} onChange={(e) => setNewDeal({ ...newDeal, reminderNote: e.target.value })} />
                  </div>
                </div>
              </form>
            </div>

            {/* footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
              <button form="add-deal-form" type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Deal</button>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          DEAL DETAILS MODAL  — tabbed, read-only safe
      ════════════════════════════════════════ */}
      {selectedDeal && (() => {
        const closed = isClosed(selectedDeal);
        return (
          <div className="nc-modal-overlay" onClick={closeDeal}>
            <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 780, maxHeight: "92vh", display: "flex", flexDirection: "column", borderRadius: 12, overflow: "hidden" }}>

              {/* sticky header */}
              <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <h2 style={{ margin: "0 0 6px", fontSize: "var(--text-lg)", fontWeight: 700 }}>{selectedDeal.name}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span className={`badge badge-${statusColor(selectedDeal.status)}`}>{selectedDeal.status}</span>
                      {!closed && <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>₹ {fmt(selectedDeal.value)}</span>}
                      {selectedDeal.dealClosedAt && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          · Closed {new Date(selectedDeal.dealClosedAt).toLocaleDateString()}
                        </span>
                      )}
                      {closed && (
                        <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", background: "var(--color-bg-muted)", padding: "2px 7px", borderRadius: 10 }}>
                          <Lock size={10} /> Read-only
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="btn btn-ghost" style={{ padding: 4 }} onClick={closeDeal}><X size={18} /></button>
                </div>
                {/* All 4 tabs always visible and clickable — closed deals can still VIEW all tabs */}
                <TabBar active={activeTab} onChange={setActiveTab} />
              </div>

              {/* scrollable body */}
              <div style={{ overflowY: "auto", padding: "20px 24px", flex: 1 }}>

                {/* ══ OVERVIEW TAB ══ */}
                {activeTab === "Overview" && (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
                      <div>
                        <SectionHeader icon={User} title="Client" />
                        <Field label="Name"  value={selectedDeal.clientName} />
                        <Field label="Phone" value={selectedDeal.clientPhone} />
                        <Field label="Email" value={selectedDeal.clientEmail} />
                      </div>
                      <div>
                        <SectionHeader icon={Building2} title="Company" />
                        <Field label="Company" value={selectedDeal.companyName} />
                        <div style={{ marginBottom: "var(--space-3)" }}>
                          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block", marginBottom: 2 }}>Website</span>
                          {safeUrl(selectedDeal.businessUrl) ? (
                            <a href={safeUrl(selectedDeal.businessUrl)} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent)", display: "flex", alignItems: "center", gap: 4, wordBreak: "break-all" }}>
                              <Link2 size={12} />{selectedDeal.businessUrl}
                            </a>
                          ) : (
                            <span style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>—</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <SectionHeader icon={DollarSign} title="Deal" />
                        {!closed && <Field label="Value" value={`₹ ${fmt(selectedDeal.value)}`} />}
                        <Field label="Assigned To"   value={selectedDeal.assignedTo?.name} />
                        <Field label="Expected Close" value={selectedDeal.expectedCloseDate ? new Date(selectedDeal.expectedCloseDate).toLocaleDateString() : null} />
                      </div>
                    </div>

                    {selectedDeal.description && (
                      <div style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "12px 14px", marginBottom: "var(--space-5)" }}>
                        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{selectedDeal.description}</p>
                      </div>
                    )}

                    {/* clickable stat cards → jump to tab */}
                    <div style={{ display: "flex", gap: "var(--space-4)" }}>
                      {[
                        { icon: MessageSquare, label: "Comments",  tab: "Comments",  count: selectedDeal.comments?.length  ?? 0 },
                        { icon: Video,         label: "Meetings",  tab: "Meetings",  count: selectedDeal.meetings?.length  ?? 0 },
                        { icon: Bell,          label: "Reminders", tab: "Reminders", count: selectedDeal.reminders?.length ?? 0 },
                      ].map(({ icon: Icon, label, tab, count }) => (
                        <div
                          key={label}
                          onClick={() => setActiveTab(tab)}
                          style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px", cursor: "pointer", border: "1px solid transparent", transition: "border .15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid var(--color-accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid transparent")}
                        >
                          <Icon size={16} style={{ color: "var(--color-accent)" }} />
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{count}</div>
                            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ══ COMMENTS TAB ══ */}
                {activeTab === "Comments" && (
                  <div>
                    {closed && <ReadOnlyBanner />}

                    {/* existing comments — always visible */}
                    {selectedDeal.comments?.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "var(--space-4)" }}>
                        {selectedDeal.comments.map((c, i) => (
                          <div key={i} style={{ background: "var(--color-bg-muted)", borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>{c.author || "User"}</span>
                              {c.createdAt && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{new Date(c.createdAt).toLocaleString()}</span>}
                            </div>
                            <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>{c.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="No comments yet." />
                    )}

                    {/* add form — only for open deals */}
                    {!closed && (
                      <form onSubmit={handleAddComment} style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
                        <input className="form-input" style={{ flex: 1, height: 38 }} placeholder="Write a note…" value={commentText} onChange={(e) => setCommentText(e.target.value)} />
                        <button className="btn btn-primary" style={{ padding: "0 16px", height: 38, display: "flex", alignItems: "center", gap: 6 }}>
                          <Send size={14} /> Send
                        </button>
                      </form>
                    )}
                  </div>
                )}

                {/* ══ MEETINGS TAB ══ */}
                {activeTab === "Meetings" && (
                  <div>
                    {closed && <ReadOnlyBanner />}

                    {/* existing meetings — always visible */}
                    {selectedDeal.meetings?.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: "var(--space-5)" }}>
                        {selectedDeal.meetings.map((m, i) => (
                          <div key={i} style={{ border: "1px solid var(--color-border)", borderRadius: 8, padding: "12px 14px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{m.title}</span>
                              {m.meetingTime && (
                                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                  <Clock size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                                  {new Date(m.meetingTime).toLocaleString()}
                                </span>
                              )}
                            </div>
                            {m.meetingLink && (
                              <a href={safeUrl(m.meetingLink) || "#"} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-xs)", color: "var(--color-accent)", display: "flex", alignItems: "center", gap: 3, marginBottom: 4, wordBreak: "break-all" }}>
                                <Link2 size={11} /> {m.meetingLink}
                              </a>
                            )}
                            {m.discussion  && <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{m.discussion}</p>}
                            {m.nextAction  && <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)" }}>→ {m.nextAction}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="No meetings logged yet." />
                    )}

                    {/* add form — only for open deals */}
                    {!closed && (
                      <div style={{ marginTop: "var(--space-5)", padding: 16, background: "var(--color-bg-muted)", borderRadius: 10, border: "1px dashed var(--color-border)" }}>
                        <p style={sectionLabel}>Log New Meeting</p>
                        <form onSubmit={handleAddMeeting}>
                          <div style={grid2}>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                              <label className="form-label">Title *</label>
                              <input className="form-input" style={sm} placeholder="e.g. Discovery Call" value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} required />
                            </div>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                              <label className="form-label">Date & Time *</label>
                              <input className="form-input" style={sm} type="datetime-local" value={meetingForm.meetingTime} onChange={(e) => setMeetingForm({ ...meetingForm, meetingTime: e.target.value })} required />
                            </div>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                              <label className="form-label">Meeting Link</label>
                              <input className="form-input" style={sm} placeholder="https://meet.google.com/…" value={meetingForm.meetingLink} onChange={(e) => setMeetingForm({ ...meetingForm, meetingLink: e.target.value })} />
                            </div>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                              <label className="form-label">Next Action</label>
                              <input className="form-input" style={sm} placeholder="What happens next?" value={meetingForm.nextAction} onChange={(e) => setMeetingForm({ ...meetingForm, nextAction: e.target.value })} />
                            </div>
                            <div className="form-field" style={{ gridColumn: "span 2", marginBottom: 0 }}>
                              <label className="form-label">Discussion Notes</label>
                              <textarea className="form-input" rows={2} style={{ fontSize: 12, resize: "vertical" }} placeholder="What was discussed?" value={meetingForm.discussion} onChange={(e) => setMeetingForm({ ...meetingForm, discussion: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ gridColumn: "span 2", height: 34 }}>Add Meeting</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ REMINDERS TAB ══ */}
                {activeTab === "Reminders" && (
                  <div>
                    {closed && <ReadOnlyBanner />}

                    {/* existing reminders — always visible */}
                    {selectedDeal.reminders?.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "var(--space-5)" }}>
                        {selectedDeal.reminders.map((r, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid var(--color-border)", borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Bell size={14} style={{ color: "var(--color-accent)", flexShrink: 0 }} />
                              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{r.title}</span>
                            </div>
                            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                              {new Date(r.remindAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text="No reminders set yet." />
                    )}

                    {/* add form — only for open deals */}
                    {!closed && (
                      <div style={{ marginTop: "var(--space-5)", padding: 16, background: "var(--color-bg-muted)", borderRadius: 10, border: "1px dashed var(--color-border)" }}>
                        <p style={sectionLabel}>Set New Reminder</p>
                        <form onSubmit={handleAddReminder}>
                          <div style={grid2}>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                              <label className="form-label">Reason *</label>
                              <input className="form-input" style={sm} placeholder="e.g. Follow up on proposal" value={reminderForm.title} onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })} required />
                            </div>
                            <div className="form-field" style={{ marginBottom: 0 }}>
                              <label className="form-label">Remind At *</label>
                              <input className="form-input" style={sm} type="datetime-local" value={reminderForm.remindAt} onChange={(e) => setReminderForm({ ...reminderForm, remindAt: e.target.value })} required />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ gridColumn: "span 2", height: 34 }}>Set Reminder</button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* sticky footer */}
              <div style={{ padding: "14px 24px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
                <button className="btn btn-ghost" onClick={closeDeal}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

/* ── style constants (defined after component to keep JSX clean) ── */
const sectionLabel = {
  margin: "0 0 12px",
  fontSize: "var(--text-xs)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".06em",
  color: "var(--color-text-muted)",
};

const grid2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "var(--space-3)",
  marginBottom: "var(--space-2)",
};

export default SalesDashboard;