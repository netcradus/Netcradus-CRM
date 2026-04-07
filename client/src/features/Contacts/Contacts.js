import React, { useState, useEffect } from "react";
import "./Contacts.css";
import { apiUrl } from "../../config/api";
import { FaPhone, FaLock, FaLockOpen, FaRegFilePdf } from "react-icons/fa";

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [sensitiveData, setSensitiveData] = useState(null);
  const [reAuthToken, setReAuthToken] = useState(null);
  
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    status: "Prospect",
    department: "",
    designation: "",
    joiningDate: "",
    leavingDate: "",
    interviewSchedule: "",
    contactNumber: "",
    address: "",
    salary: "",
    leaves: 0
  });

  const userRole = localStorage.getItem("userRole");
  const isElevated = ["super_user", "admin"].includes(userRole);

  const fetchContacts = async () => {
    try {
      const res = await fetch(apiUrl("/api/contacts"), {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setContacts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleReAuth = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/auth/verify-password-reauth"), {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ password: reAuthPassword })
      });
      const data = await res.json();
      if (data.success) {
        setReAuthToken(data.reAuthToken);
        setShowReAuthModal(false);
        setReAuthPassword("");
        fetchSensitiveData(selectedContactId, data.reAuthToken);
      } else {
        alert("Invalid Password");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSensitiveData = async (contactId, token) => {
    try {
      const res = await fetch(apiUrl(`/api/contacts/${contactId}/sensitive`), {
        headers: { 
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "X-ReAuth-Token": token
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSensitiveData(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openReAuth = (contactId) => {
    setSelectedContactId(contactId);
    setShowReAuthModal(true);
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/contacts"), {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(newContact),
      });
      if (res.ok) {
        fetchContacts();
        setShowModal(false);
        setNewContact({ name: "", email: "", status: "Prospect", department: "", designation: "", joiningDate: "", leavingDate: "", interviewSchedule: "", contactNumber: "", address: "", salary: "", leaves: 0 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="contacts-container">
      <div className="contacts-header-flex">
        <h2 className="contacts-heading"><FaPhone /> Contacts Management</h2>
        {isElevated && <button className="btn-primary" onClick={() => setShowModal(true)}>Add Employee/Contact</button>}
      </div>

      <div className="contacts-actions">
        <input
          className="search-bar"
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="contacts-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Dept / Design.</th>
              <th>Status</th>
              <th>Joining Date</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map((contact) => (
              <tr key={contact._id} className={!contact.isActive ? "inactive-row" : ""}>
                <td>
                    <div className="name-cell">
                        <strong>{contact.name}</strong>
                        <span>{contact.email}</span>
                    </div>
                </td>
                <td>{contact.department || "N/A"} / {contact.designation || "N/A"}</td>
                <td>
                  <span className={`badge ${contact.status.toLowerCase()}`}>
                    {contact.status}
                  </span>
                  {!contact.isActive && <span className="badge ex-employee">Former Employee</span>}
                </td>
                <td>{contact.joiningDate ? new Date(contact.joiningDate).toLocaleDateString() : "N/A"}</td>
                <td>
                   <button className="btn-icon" onClick={() => openReAuth(contact._id)}>
                     {sensitiveData && sensitiveData._id === contact._id ? <FaLockOpen color="#10b981" /> : <FaLock />}
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sensitive Data Overlay (Shown after re-auth) */}
      {sensitiveData && (
          <div className="sensitive-data-panel">
              <div className="panel-content">
                  <h3>Sensitive Information: {sensitiveData.name}</h3>
                  <div className="grid-2">
                      <p><strong>Salary:</strong> ₹{sensitiveData.salary}</p>
                      <p><strong>Leaves:</strong> {sensitiveData.leaves}</p>
                      <p><strong>Contact:</strong> {sensitiveData.contactNumber}</p>
                      <p><strong>Address:</strong> {sensitiveData.address}</p>
                  </div>
                  <h4>Salary Slips</h4>
                  <div className="slips-list">
                      {sensitiveData.salarySlips?.map((slip, i) => (
                          <div key={i} className="slip-item"><FaRegFilePdf /> {slip.filename}</div>
                      ))}
                      {(!sensitiveData.salarySlips || sensitiveData.salarySlips.length === 0) && <p>No slips uploaded</p>}
                  </div>
                  <button className="btn-cancel" onClick={() => setSensitiveData(null)}>Close</button>
              </div>
          </div>
      )}

      {/* Re-Auth Modal */}
      {showReAuthModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Identity Verification Required</h3>
            <p>Please enter your password to unlock sensitive fields.</p>
            <form onSubmit={handleReAuth}>
              <input
                type="password"
                placeholder="Enter password"
                value={reAuthPassword}
                onChange={(e) => setReAuthPassword(e.target.value)}
                required
              />
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">Verify</button>
                <button type="button" onClick={() => setShowReAuthModal(false)} className="btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content wide">
            <h3>Add New Employee / Contact</h3>
            <form onSubmit={handleSubmit} className="grid-form">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})} required />
              </div>
              <div className="form-group">
                 <label>Status</label>
                 <select value={newContact.status} onChange={(e) => setNewContact({...newContact, status: e.target.value})}>
                    <option>Prospect</option><option>Lead</option><option>Customer</option><option>Employee</option>
                 </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <input type="text" value={newContact.department} onChange={(e) => setNewContact({...newContact, department: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input type="text" value={newContact.designation} onChange={(e) => setNewContact({...newContact, designation: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Joining Date</label>
                <input type="date" value={newContact.joiningDate} onChange={(e) => setNewContact({...newContact, joiningDate: e.target.value})} />
              </div>
              
              <div className="full-width-buttons">
                <button type="submit" className="btn-primary">Save Profile</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contacts;
