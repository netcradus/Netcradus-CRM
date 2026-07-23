import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

function Chart() {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr"],
    datasets: [
      {
        label: "Sales",
        data: [1200, 1900, 3000, 2500],
        backgroundColor: "rgba(54, 162, 235, 0.2)", // subtle blue fill
        borderColor: "rgba(54, 162, 235, 1)", // solid blue line
        pointBackgroundColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          color: "#ffffff", // white text for professional dark theme
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        ticks: { color: "#ccc" },
        grid: { color: "#444" }, // slightly darker grid
      },
      y: {
        ticks: { color: "#ccc" },
        grid: { color: "#444" },
      },
    },
  };

  return <Line data={data} options={options} />;
}

export default Chart;