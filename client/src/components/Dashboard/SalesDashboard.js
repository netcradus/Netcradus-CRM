import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Search,
  Plus,
  Download,
  Clock3,
  BadgeDollarSign,
  CircleDashed,
  BriefcaseBusiness,
} from "lucide-react";
import AttendanceWidget from "../../features/Attendance/AttendanceWidget";
import "./SalesDashboard.css";
import { apiUrl } from "../../config/api";


const API =apiUrl("/api/deals");

const formatRoleLabel = (value = "") =>
  value === "admin"
    ? "Administrator"
    : String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const SalesDashboard = ({ preview }) => {
  const [deals, setDeals] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [newDeal, setNewDeal] = useState({
    name: "",
    value: "",
    status: "In Progress",
    assignedTo: "",
  });
  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "sales";

  // 🔥 FETCH DEALS
  const fetchDeals = async () => {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setDeals(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // 🔥 ADD DEAL
 const handleAddDeal = async (e) => {
  e.preventDefault();

  try {
    await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newDeal),
    });

    fetchDeals();
    setShowModal(false);

    setNewDeal({
      name: "",
      value: "",
      status: "In Progress",
      assignedTo: "",
    });
  } catch (err) {
    console.error(err);
  }
};

  // 🔥 FILTER
 const filteredDeals = deals.filter((d) => {
  const matchesStatus = filter
    ? d.status?.toLowerCase() === filter.toLowerCase()
    : true;

  return matchesStatus;
});
  // 🔥 RECENT 3 DEALS
  const recentDeals = filteredDeals.slice(0, 3);

  // 🔥 METRICS
  const openDeals = deals.filter((d) => d.status === "open").length;

  const wonDeals = deals.filter((d) => d.status === "won");

  const revenue = wonDeals.reduce(
    (acc, d) => acc + Number(d.value || 0),
    0
  );

  const conversionRate = deals.length
    ? ((wonDeals.length / deals.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="sales-dashboard">
      {/* HERO */}
      <div className="sales-hero">
        <div className="sales-hero-copy">
          <div className="sales-badge">
            <TrendingUp size={14} />
            <span>SALES DASHBOARD</span>
          </div>

          <h1 className="sales-title">
            Welcome, <span>{userName}</span>
          </h1>

          <p className="sales-subtitle">
            Role: <strong>{formatRoleLabel(userRole)}</strong>
          </p>

          <div className="nc-attendance-brief">
            <p className="nc-attendance-kicker">
              <Clock3 size={14} />
              Attendance System
            </p>
            <h2 className="nc-attendance-heading">Attendance system live for your shift</h2>
            <p className="nc-attendance-copy">
              Your work timer, punch status, and break controls are available in the live panel on the right.
            </p>
          </div>
        </div>

        <div className="sales-hero-status">
          <AttendanceWidget />
        </div>
      </div>

      {/* CONTROLS */}
      <div className="sales-controls glass-panel">
        <div className="sales-search-wrap">
          <Search size={16} className="sales-search-icon" />
          <input
            className="sales-search"
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

     <select
  className="sales-select"
  onChange={(e) => setFilter(e.target.value)}
>
  <option value="">All Statuses</option>
  <option value="In Progress">In Progress</option>
  <option value="Won">Won</option>
  <option value="Lost">Lost</option>
</select>

        <button
          className="btn-primary sales-btn-primary"
          onClick={() => setShowModal(true)}
        >
          <Plus size={16} />
          Add Deal
        </button>

        <button
          className="btn-outline"
          onClick={() => {
            const csv = deals
              .map(
                (d) =>
                  `${d.name},${d.client},${d.value},${d.status}`
              )
              .join("\n");

            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = "deals.csv";
            a.click();
          }}
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* METRICS */}
      <div className="sales-metrics">
        <div className="metric-card gradient-orange">
          <div className="metric-icon metric-orange">
            <CircleDashed size={22} />
          </div>
          <div>
            <div className="metric-label">Open Deals</div>
            <div className="metric-value">{openDeals}</div>
          </div>
        </div>

        <div className="metric-card gradient-coral">
          <div className="metric-icon metric-coral">
            <BadgeDollarSign size={22} />
          </div>
          <div>
            <div className="metric-label">Revenue</div>
            <div className="metric-value">₹ {revenue}</div>
          </div>
        </div>

        <div className="metric-card gradient-pink">
          <div className="metric-icon metric-pink">
            <BriefcaseBusiness size={22} />
          </div>
          <div>
            <div className="metric-label">Conversion Rate</div>
            <div className="metric-value">{conversionRate}%</div>
          </div>
        </div>
      </div>

      {/* RECENT DEALS */}
    <div className="sales-list net-panel">
  <div className="section-header">
    <h3>Recent Deals</h3>
  </div>

  <div className="sales-table">
    <table>
      <thead>
        <tr>
          <th>Deal Name</th>
          <th>Value</th>
          <th>Status</th>
                  </tr>
      </thead>

    <tbody>
  {recentDeals.map((deal) => (
    <tr key={deal._id}>
      <td>{deal.name}</td>

      <td>₹ {deal.value}</td>

      <td>
        <span
          className={`status ${deal.status
            .toLowerCase()
            .replace(" ", "-")}`}
        >
          {deal.status}
        </span>
      </td>
    </tr>
  ))}
</tbody>
    </table>
  </div>
</div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Deal</h3>

           <form onSubmit={handleAddDeal}>
  <input
    placeholder="Deal Name"
    value={newDeal.name}
    onChange={(e) =>
      setNewDeal({ ...newDeal, name: e.target.value })
    }
    required
  />

  <input
    placeholder="Value"
    type="number"
    value={newDeal.value}
    onChange={(e) =>
      setNewDeal({ ...newDeal, value: e.target.value })
    }
    required
  />

  <input
    placeholder="Assigned To"
    value={newDeal.assignedTo}
    onChange={(e) =>
      setNewDeal({ ...newDeal, assignedTo: e.target.value })
    }
    required
  />

  <select
    value={newDeal.status}
    onChange={(e) =>
      setNewDeal({ ...newDeal, status: e.target.value })
    }
  >
    <option>In Progress</option>
    <option>Won</option>
    <option>Lost</option>
  </select>

  <div className="modal-buttons">
    <button className="btn-primary">Save</button>
    <button
      type="button"
      className="btn-secondary"
      onClick={() => setShowModal(false)}
    >
      Cancel
    </button>
  </div>
</form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
