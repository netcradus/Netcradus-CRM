// import React from 'react';
// import Sidebar from '../../components/Dashboard/Sidebar';
// import "./CRMTeamspaces.css";


// const CRMTeamspaces = () => {
//   return (
//     <div className="crm-teamspaces-container">
//       <Sidebar />
//       <main className="crm-main-content">
//         <header className="crm-header">
//           <h1>CRM Teamspaces</h1>

//         </header>
//         <section className="crm-content-section">
//           <p>Yeh CRM Teamspace module hai jahan aap apni team se related kaam manage kar sakte hain.</p>
//           {/* Aap yahan team members, tasks, ya collaboration components add kar sakte hain */}
//         </section>
//       </main>
//     </div>
//   );
// };

// export default CRMTeamspaces;



import React, { useState } from 'react';
import { FaUsers } from 'react-icons/fa';
import Sidebar from '../../components/Dashboard/Sidebar';
import "./CRMTeamspaces.css";

const CRMTeamspaces = () => {
  // Sample team members
  const [teamMembers, setTeamMembers] = useState([

  ]);

  // Sample tasks
  const [tasks, setTasks] = useState([

  ]);

  return (
    <div className="crm-teamspaces-container">

      <main className="crm-main-content">
        <header className="crm-header">
          <h1 className="crm-teamspaces-heading"><FaUsers /> CRM Teamspaces</h1>
        </header>
        <section className="crm-content-section">

          {/* Team Members */}
          <div>
            <h2>Team Members</h2>
            <ul>
              {teamMembers.map(member => (
                <li key={member.id}>{member.name} - {member.role}</li>
              ))}
            </ul>
          </div>

          {/* Tasks */}
          <div>
            <h2>Tasks</h2>
            <ul>
              {tasks.map(task => (
                <li key={task.id}>
                  {task.title} - Assigned to: {task.assignedTo} - Status: {task.status}
                </li>
              ))}
            </ul>
          </div>

          {/* Collaboration (Simple message input example) */}
          <div>
            <h2>Collaboration</h2>
            <Collaboration />
          </div>

        </section>
      </main>
    </div>
  );
};

// Simple Collaboration component with message input
const Collaboration = () => {
  const [messages, setMessages] = useState([

  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { id: messages.length + 1, user: "You", text: input }]);
    setInput("");
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
        {messages.map(msg => (
          <p key={msg.id}><strong>{msg.user}:</strong> {msg.text}</p>
        ))}
      </div>
      <input
        type="text"
        placeholder="Type a message..."
        value={input}
        onChange={e => setInput(e.target.value)}
        style={{ width: "80%", padding: "8px", marginTop: "10px" }}
      />
      <button onClick={sendMessage} style={{ padding: "8px 12px", marginLeft: "8px" }}>Send</button>
    </div>
  );
};

export default CRMTeamspaces;
