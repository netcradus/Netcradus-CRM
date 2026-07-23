import React, { useState } from 'react';
import { Users, Plus, Search, ChevronRight, MessageSquare, Send, UserPlus, CheckCircle2, Clock } from 'lucide-react';

const CRMTeamspaces = () => {
  const [teamMembers] = useState([
    { id: 1, name: "Raghav Sharma", role: "Administrator", status: "Online" },
    { id: 2, name: "Anjali Gupta", role: "Sales Manager", status: "Away" },
  ]);

  const [tasks] = useState([
    { id: 1, title: "Q3 Strategy Planning", assignedTo: "Raghav Sharma", status: "In Progress" },
    { id: 2, title: "Lead Cleanup", assignedTo: "Anjali Gupta", status: "Completed" },
  ]);

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>Collaboration</span><ChevronRight size={10} /><span>Teamspaces</span>
           </div>
           <h1 className="title">Team Collaboration</h1>
           <p className="subtitle">Real-time workspace for team coordination and shared goal tracking.</p>
        </div>
        <div className="page-header-right">
           <button className="btn btn-primary"><UserPlus size={16} /> Invite Member</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-8)' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            <section>
               <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><Users size={18} /> Active Team Members</h2>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                  {teamMembers.map(member => (
                    <div key={member.id} className="nc-card nc-card--interactive" style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                       <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'var(--font-bold)', color: 'var(--color-accent)' }}>{member.name.charAt(0)}</div>
                       <div>
                          <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{member.name}</div>
                          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{member.role}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            <section>
               <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><CheckCircle2 size={18} /> Shared Tasks</h2>
               <div className="nc-card">
                  <table className="nc-table">
                     <thead>
                        <tr><th>Task</th><th>Owner</th><th>Status</th></tr>
                     </thead>
                     <tbody>
                        {tasks.map(task => (
                          <tr key={task.id}>
                             <td style={{ fontWeight: 'var(--font-medium)' }}>{task.title}</td>
                             <td style={{ fontSize: 'var(--text-xs)' }}>{task.assignedTo}</td>
                             <td><span className={`badge badge-${task.status === 'Completed' ? 'success' : 'warning'}`}>{task.status}</span></td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </section>
         </div>

         <aside>
            <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><MessageSquare size={18} /> Channel Chat</h2>
            <Collaboration />
         </aside>
      </div>
    </div>
  );
};

const Collaboration = () => {
  const [messages, setMessages] = useState([
    { id: 1, user: "Anjali Gupta", text: "Has anyone reviewed the Q3 plan yet?", time: "10:15 AM" },
    { id: 2, user: "Raghav Sharma", text: "I'm on it. Looking good so far.", time: "10:20 AM" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    setMessages([...messages, { id: Date.now(), user: "You", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput("");
  };

  return (
    <div className="nc-card" style={{ height: '500px', display: 'flex', flexDirection: 'column', padding: 'var(--space-4)' }}>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ alignSelf: msg.user === 'You' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                <span>{msg.user}</span><span>{msg.time}</span>
             </div>
             <div style={{ background: msg.user === 'You' ? 'var(--color-accent)' : 'var(--color-bg-elevated)', color: msg.user === 'You' ? '#fff' : 'var(--color-text-primary)', padding: 'var(--space-2) var(--space-3)', borderRadius: '12px', fontSize: 'var(--text-sm)', border: msg.user === 'You' ? 'none' : '1px solid var(--color-border)' }}>
                {msg.text}
             </div>
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <input className="form-input" style={{ height: '36px' }} placeholder="Send a message..." value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit" className="btn btn-primary" style={{ width: '36px', height: '36px', padding: 0 }}><Send size={14} /></button>
      </form>
    </div>
  );
};

export default CRMTeamspaces;
