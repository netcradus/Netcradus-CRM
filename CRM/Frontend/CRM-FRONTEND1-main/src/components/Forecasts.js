import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaChartLine } from "react-icons/fa";
import "./Forecasts.css";
import { apiUrl } from "../config/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const Forecasts = () => {
  const [forecastData, setForecastData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    period: "",
    owner: "",
    target: "",
    forecast: "",
    achieved: "",
  });

  // Fetch data from backend
  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const res = await axios.get(apiUrl("/api/forecasts"));
        setForecastData(res.data);
      } catch (err) {
        console.error("Error fetching forecasts:", err);
      }
    };
    fetchForecasts();
  }, []);

  // Add forecast (POST request to backend)
  const handleAddForecast = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(apiUrl("/api/forecasts"), form);
      setForecastData([...forecastData, res.data]); // add new forecast from backend
      setForm({ period: "", owner: "", target: "", forecast: "", achieved: "" });
      setShowModal(false);
    } catch (err) {
      console.error("Error adding forecast:", err);
    }
  };

  // Calculate summary values
  const totalForecast = forecastData.reduce(
    (sum, f) => sum + parseInt(f.forecast || 0),
    0
  );
  const totalAchieved = forecastData.reduce(
    (sum, f) => sum + parseInt(f.achieved || 0),
    0
  );
  const totalTarget = forecastData.reduce(
    (sum, f) => sum + parseInt(f.target || 0),
    0
  );
  const remaining = totalTarget - totalAchieved;
  const percentage = totalTarget ? ((totalAchieved / totalTarget) * 100).toFixed(1) : 0;

  return (
    <div className="forecast-container">
      <h2 className="forecast-title"><FaChartLine /> Forecasts Overview</h2>

      {/* Summary Cards */}
      <div className="forecast-cards">
        <div className="forecast-card total">Total Forecast: ₹{totalForecast.toLocaleString("en-IN")}</div>
        <div className="forecast-card achieved">Achieved: ₹{totalAchieved.toLocaleString("en-IN")}</div>
        <div className="forecast-card remaining">Remaining: ₹{remaining.toLocaleString("en-IN")}</div>
        <div className="forecast-card percent">Target %: {percentage}%</div>
      </div>

      {/* Table */}
      <div className="forecast-table-wrapper">
        <table className="forecast-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Owner</th>
              <th>Target</th>
              <th>Forecast</th>
              <th>Achieved</th>
              <th>% to Target</th>
              <th>Gap</th>
            </tr>
          </thead>
          <tbody>
            {forecastData.map((item, index) => {
              const gap = item.target - item.achieved;
              const percent = item.target
                ? ((item.achieved / item.target) * 100).toFixed(1) + "%"
                : "0%";
              return (
                <tr key={index}>
                  <td>{item.period}</td>
                  <td>{item.owner}</td>
                  <td>₹{Number(item.target).toLocaleString("en-IN")}</td>
                  <td>₹{Number(item.forecast).toLocaleString("en-IN")}</td>
                  <td>₹{Number(item.achieved).toLocaleString("en-IN")}</td>
                  <td>{percent}</td>
                  <td>₹{gap.toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="forecast-charts">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="achieved" fill="#00cc88" />
            <Bar dataKey="target" fill="#ff4b2b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom-right button */}
      <button className="forecast-add-btn" onClick={() => setShowModal(true)}>
        + Set New Target
      </button>

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Set New Forecast</h3>
            <form onSubmit={handleAddForecast}>
              <input
                type="text"
                placeholder="Period (e.g., Q3 2025)"
                value={form.period}
                required
                onChange={(e) => setForm({ ...form, period: e.target.value })}
              />
              <input
                type="text"
                placeholder="Owner"
                value={form.owner}
                required
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
              />
              <input
                type="number"
                placeholder="Target (₹)"
                value={form.target}
                required
                onChange={(e) => setForm({ ...form, target: e.target.value })}
              />
              <input
                type="number"
                placeholder="Forecast (₹)"
                value={form.forecast}
                required
                onChange={(e) => setForm({ ...form, forecast: e.target.value })}
              />
              <input
                type="number"
                placeholder="Achieved (₹)"
                value={form.achieved}
                required
                onChange={(e) => setForm({ ...form, achieved: e.target.value })}
              />
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Add</button>
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecasts;
