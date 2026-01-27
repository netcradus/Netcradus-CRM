import React from "react";
import "./Sales.css";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Sales = () => {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Monthly Sales",
        data: [12000, 15000, 14000, 18000, 17000, 21000, 25000],
        fill: false,
        borderColor: "#ff4b2b",
        tension: 0.4,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: "#ddd",
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#ccc",
        },
        grid: {
          color: "#222",
        },
      },
      y: {
        ticks: {
          color: "#ccc",
        },
        grid: {
          color: "#222",
        },
      },
    },
  };

  return (
    <div className="sales-container">
      <h1 className="sales-title">Welcome, Sales 👑</h1>
      <div className="sales-overview">
        <div className="card lead-card">
          <h3>Leads Contacted</h3>
          <p>1,204</p>
        </div>
        <div className="card deal-card">
          <h3>Deals Closed</h3>
          <p>321</p>
        </div>
        <div className="card revenue-card">
          <h3>Revenue</h3>
          <p>$85,900</p>
        </div>
      </div>

      <div className="sales-chart">
        <Line data={data} options={options} />
      </div>

      <div className="sales-tasks">
        <h2>Today's Tasks</h2>
        <ul>
          <li>Follow up with 5 potential leads</li>
          <li>Prepare Q3 forecast report</li>
          <li>Call back client - ZoomConnect</li>
        </ul>
      </div>
    </div>
  );
};

export default Sales;
