import React, { useState } from "react";
import { FaPhone } from "react-icons/fa";
import "./CT.css";

const initialCalls = [
  
    
];

function CT() {
  const [calls, setCalls] = useState(initialCalls);

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this call record?")) {
      setCalls(calls.filter((call) => call.id !== id));
    }
  };

  const handleMarkCompleted = (id) => {
    setCalls(
      calls.map((call) =>
        call.id === id ? { ...call, status: "Completed" } : call
      )
    );
  };

  const handleCallBack = (phone) => {
    alert(`Initiating call to ${phone}...`);
  };

  return (
    <div className="ct-container">
      <h2 className="ct-title"><FaPhone /> Call Tracking</h2>
      <div className="ct-table-wrapper">
        <table className="ct-table">
          <thead>
            <tr>
              <th>Caller</th>
              <th>Phone</th>
              <th>Date & Time</th>
              <th>Status</th>
              <th>Notes</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
         <tbody>
  {calls.map((call) => (
    <tr key={call.id}>
      <td data-label="Caller">{call.caller}</td>
      <td data-label="Phone">{call.phone}</td>
      <td data-label="Date & Time">{call.date}</td>
      <td data-label="Status">
        <span
          className={`status-tag ${
            call.status.toLowerCase() === "completed"
              ? "connected"
              : call.status.toLowerCase() === "follow-up"
              ? "voicemail"
              : "missed"
          }`}
        >
          {call.status}
        </span>
      </td>
      <td data-label="Notes">{call.notes}</td>
      <td data-label="Actions" className="actions-cell">
        <button
          className="btn btn-call"
          onClick={() => handleCallBack(call.phone)}
        >
          📞
        </button>

        {call.status !== "Completed" && (
          <button
            className="btn btn-complete"
            onClick={() => handleMarkCompleted(call.id)}
          >
            ✔️
          </button>
        )}

        <button
          className="btn btn-delete"
          onClick={() => handleDelete(call.id)}
        >
          🗑️
        </button>
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    </div>
  );
}

export default CT;
