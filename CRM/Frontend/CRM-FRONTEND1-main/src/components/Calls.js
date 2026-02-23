// import React, { useState, useEffect } from "react";
// import "./Calls.css";

// function Calls() {
//   const [calls, setCalls] = useState([]);
//   const [search, setSearch] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [newCall, setNewCall] = useState({
//     callerName: "",
//     callType: "Inbound",
//     status: "Connected",
//     time: new Date().toISOString(),
//   });

//   // Fetch calls from backend
//   useEffect(() => {
//     const fetchCalls = async () => {
//       try {
//         const res = await fetch("http://localhost:5000/api/calls");
//         if (!res.ok) throw new Error("Failed to fetch calls");
//         const data = await res.json();
//         setCalls(data);
//       } catch (err) {
//         console.error("Error fetching calls:", err);
//         setCalls([]);
//       }
//     };
//     fetchCalls();
//   }, []);

//   // Filter calls
//   const filteredCalls = calls.filter((call) =>
//     call.callerName.toLowerCase().includes(search.toLowerCase())
//   );

//   // Modal controls
//   const openModal = () => setShowModal(true);
//   const closeModal = () => setShowModal(false);

//   // Handle input changes
//   const handleChange = (e) => {
//     setNewCall({ ...newCall, [e.target.name]: e.target.value });
//   };

//   // Submit new call
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await fetch("http://localhost:5000/api/calls", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newCall),
//       });

//       if (!res.ok) throw new Error("Failed to save call");
//       const savedCall = await res.json();

//       setCalls([savedCall, ...calls]);
//       setNewCall({
//         callerName: "",
//         callType: "Inbound",
//         status: "Connected",
//         time: new Date().toISOString(),
//       });
//       closeModal();
//     } catch (err) {
//       console.error("Error saving call:", err);
//     }
//   };

//   return (
//     <div className="calls-container">
//       <h2 className="calls-heading">Calls</h2>

//       {/* Actions */}
//       <div className="calls-actions">
//         <button className="btn-primary" onClick={openModal}>
//           Log New Call
//         </button>
//         <input
//           className="search-bar"
//           type="text"
//           placeholder="Search Calls"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       {/* Call Types */}
//       <div className="call-types">
//         <div className="type inbound">Inbound</div>
//         <div className="type outgoing">Outgoing</div>
//         <div className="type missed">Missed</div>
//       </div>

//       {/* Calls Table */}
//       <div className="calls-table">
//         <table>
//           <thead>
//             <tr>
//               <th>Caller</th>
//               <th>Time</th>
//               <th>Type</th>
//               <th>Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredCalls.length > 0 ? (
//               filteredCalls.map((call) => (
//                 <tr key={call._id}>
//                   <td>{call.callerName}</td>
//                   <td>
//                     {call.time ? new Date(call.time).toLocaleString() : "N/A"}
//                   </td>
//                   <td>{call.callType}</td>
//                   <td>
//                     <span className={`badge ${call.status.toLowerCase()}`}>
//                       {call.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="4" style={{ textAlign: "center" }}>
//                   No calls found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <h3>Log New Call</h3>
//             <form onSubmit={handleSubmit}>
//               <input
//                 type="text"
//                 name="callerName"
//                 placeholder="Caller Name"
//                 value={newCall.callerName}
//                 onChange={handleChange}
//                 required
//               />
//               <select
//                 name="callType"
//                 value={newCall.callType}
//                 onChange={handleChange}
//               >
//                 <option>Inbound</option>
//                 <option>Outgoing</option>
//                 <option>Missed</option>
//               </select>
//               <select
//                 name="status"
//                 value={newCall.status}
//                 onChange={handleChange}
//               >
//                 <option>Connected</option>
//                 <option>Missed</option>
//               </select>
//               <div className="modal-buttons">
//                 <button type="submit" className="btn-primary">
//                   Save Call
//                 </button>
//                 <button
//                   type="button"
//                   onClick={closeModal}
//                   className="btn-cancel"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default Calls;



import React, { useState } from "react";
import { FaPhone } from "react-icons/fa";
import "./Calls.css";

function Calls() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="calls-container">
      <div className="calls-header">
        <h2 className="calls-heading"><FaPhone /> Calls</h2>
      </div>

      <div className="calls-actions">
        <button className="btn-primary" onClick={openModal}>+ Add Call</button>
        <div className="calls-filters">
          <input className="search-bar" type="text" placeholder="Search Calls" />
          <select className="filter-dropdown">
            <option value="all">All</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Calls Table */}
      <table className="calls-table">
        <thead>
          <tr>
            <th>Caller</th>
            <th>Recipient</th>
            <th>Date</th>
            <th>Status</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
          
          </tr>
          <tr>
           
          </tr>
        </tbody>
      </table>

      {/* Add Call Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Schedule a Call</h3>
            <form>
              <label>Caller</label>
              <input type="text" placeholder="Enter caller name" />

              <label>Recipient</label>
              <input type="text" placeholder="Enter recipient name" />

              <label>Date</label>
              <input type="date" />

              <label>Status</label>
              <select>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="missed">Missed</option>
              </select>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">Save</button>
                <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calls;
