import React from "react";
import { FaMapMarkerAlt } from "react-icons/fa";
import "./Visits.css";

const visitsData = [
  {
    id: "2002",
    client: "Ankit Verma",
    date: "2025-07-30",
    time: "2:00 PM",
    status: "Scheduled",
    notes: "Initial consultation call.",
  },
  {
    id: "2003",
    client: "Riya Malhotra",
    date: "2025-07-31",
    time: "11:00 AM",
    status: "Cancelled",
    notes: "Client postponed meeting.",
  },
];

function Visits() {
  const totalVisits = visitsData.length;
  const completed = visitsData.filter((v) => v.status === "Completed").length;
  const scheduled = visitsData.filter((v) => v.status === "Scheduled").length;
  const cancelled = visitsData.filter((v) => v.status === "Cancelled").length;

  return (
    <div className="visits-container">
      <h2 className="visits-heading"><FaMapMarkerAlt /> Client Visits</h2>

      <div className="visits-summary">
        <div className="summary-card total">
          <h4>Total Visits</h4>
          <p>{totalVisits}</p>
        </div>
        <div className="summary-card completed">
          <h4>Completed</h4>
          <p>{completed}</p>
        </div>
        <div className="summary-card scheduled">
          <h4>Scheduled</h4>
          <p>{scheduled}</p>
        </div>
        <div className="summary-card cancelled">
          <h4>Cancelled</h4>
          <p>{cancelled}</p>
        </div>
      </div>

     <div className="visits-table-wrapper">
  <table className="visits-table">
        <thead>
          <tr>
            <th>Visit ID</th>
            <th>Client</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Action</th>
          </tr>
        </thead>
       <tbody>
  {visitsData.map((visit) => (
    <tr key={visit.id}>
      <td data-label="Visit ID">{visit.id}</td>
      <td data-label="Client">{visit.client}</td>
      <td data-label="Date">{visit.date}</td>
      <td data-label="Time">{visit.time}</td>
      <td data-label="Status">
        <span className={`status-badge ${visit.status.toLowerCase()}`}>
          {visit.status}
        </span>
      </td>
      <td data-label="Notes">{visit.notes}</td>
      <td data-label="Action">
        <button className="btn-primary">View</button>
        <button className="btn-secondary">Reschedule</button>
      </td>
    </tr>
  ))}
</tbody>
      </table>
      </div>
    </div>
  );
}

export default Visits;
