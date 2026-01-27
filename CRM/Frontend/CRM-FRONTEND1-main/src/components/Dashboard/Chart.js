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
  Filler // ✅ Import Filler plugin
} from "chart.js";

// ✅ Register required components including Filler
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
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "#ff5e57",
        pointBackgroundColor: "#ff5e57",
        borderWidth: 2,
        fill: true, // ✅ Now this works without warning
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
          color: "#ffffff",
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
        grid: { color: "#333" },
      },
      y: {
        ticks: { color: "#ccc" },
        grid: { color: "#333" },
      },
    },
  };

  return <Line data={data} options={options} />;
}

export default Chart;
