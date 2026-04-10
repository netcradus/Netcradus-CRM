import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "./Contacts.css";
import { apiUrl } from "../../config/api";
import { FaLock, FaLockOpen, FaPhone, FaRegFilePdf } from "react-icons/fa";

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showReAuthModal, setShowReAuthModal] = useState(false);
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [sensitiveData, setSensitiveData] = useState(null);
  const [reAuthToken, setReAuthToken] = useState(null);
  const [reAuthError, setReAuthError] = useState("");

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
    leaves: 0,
  });

  const userRole = String(localStorage.getItem("userRole") || "")
    .trim()
    .toLowerCase();
  const canUnlockSensitive = ["super_user", "admin", "hr"].includes(userRole);
  const canAddContact = userRole === "admin";

  const getInitials = (name = "NA") =>
    String(name)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");

  const fetchContacts = async () => {
    try {
      const res = await fetch(apiUrl("/api/contacts"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
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
    setReAuthError("");
    try {
      const res = await fetch(apiUrl("/api/auth/verify-password-reauth"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ password: reAuthPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setReAuthToken(data.reAuthToken);
        setShowReAuthModal(false);
        setReAuthPassword("");
        fetchSensitiveData(selectedContactId, data.reAuthToken);
      } else {
        setReAuthError(data.message || "Invalid password");
      }
    } catch (err) {
      console.error(err);
      setReAuthError("Verification failed. Please try again.");
    }
  };

  const fetchSensitiveData = async (contactId, token) => {
    try {
      const res = await fetch(apiUrl(`/api/contacts/${contactId}/sensitive`), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "X-ReAuth-Token": token,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSensitiveData(data);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data.triggerReAuth) {
        setSensitiveData(null);
        setSelectedContactId(contactId);
        setShowReAuthModal(true);
        setReAuthError(data.message || "Please verify your password to continue.");
        return;
      }
      setReAuthError(data.message || "Unable to unlock sensitive details.");
    } catch (err) {
      console.error(err);
      setReAuthError("Unable to unlock sensitive details.");
    }
  };

  const openReAuth = (contactId) => {
    if (!canUnlockSensitive) return;

    if (sensitiveData && sensitiveData._id === contactId) {
      setSensitiveData(null);
      setSelectedContactId(null);
      return;
    }

    setSelectedContactId(contactId);
    setReAuthError("");

    if (reAuthToken) {
      fetchSensitiveData(contactId, reAuthToken);
      return;
    }

    setShowReAuthModal(true);
  };

  const filteredContacts = contacts.filter((contact) =>
    `${contact.name || ""} ${contact.email || ""} ${contact.department || ""} ${contact.designation || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl("/api/contacts"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newContact),
      });
      if (res.ok) {
        fetchContacts();
        setShowModal(false);
        setNewContact({
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
          leaves: 0,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const downloadSalarySlip = async (contactId, index, filename) => {
    try {
      const res = await fetch(apiUrl(`/api/contacts/${contactId}/salary-slips/${index}/download`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setReAuthError(data.message || "Unable to download salary slip.");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `salary-slip-${index + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setReAuthError("Unable to download salary slip.");
    }
  };

  const closeSensitiveModal = () => {
    setSensitiveData(null);
    setSelectedContactId(null);
  };

  return (
    <div className="contacts-container">
      <div className="contacts-header-flex">
        <h2 className="contacts-heading">
          <FaPhone /> Contacts Management
        </h2>
        {canAddContact && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            Add Employee/Contact
          </button>
        )}
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
              <th>Department</th>
              <th>Designation</th>
              <th>Status</th>
              <th>Joining Date</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <tr key={contact._id} className={!contact.isActive ? "inactive-row" : ""}>
                  <td data-label="Name">
                    <div className="name-cell">
                      <div className="contact-avatar">{getInitials(contact.name)}</div>
                      <div className="contact-meta">
                        <strong>{contact.name}</strong>
                        <span className="contact-email">{contact.email}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Department">
                    <span className="table-chip">{contact.department || "N/A"}</span>
                  </td>
                  <td data-label="Designation">
                    <span className="table-subtle">{contact.designation || "N/A"}</span>
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${String(contact.status || "").toLowerCase()}`}>
                      {contact.status || "Employee"}
                    </span>
                    {!contact.isActive && (
                      <span className="badge ex-employee">Former Employee</span>
                    )}
                  </td>
                  <td data-label="Joining Date">
                    <span className="table-subtle">
                      {contact.joiningDate
                        ? new Date(contact.joiningDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </td>
                  <td data-label="Details">
                    <button
                      className="btn-icon"
                      onClick={() => openReAuth(contact._id)}
                      disabled={!canUnlockSensitive}
                      title={
                        canUnlockSensitive
                          ? "Unlock sensitive details"
                          : "Only HR and super users can unlock details"
                      }
                    >
                      {sensitiveData && sensitiveData._id === contact._id ? (
                        <FaLockOpen color="#10b981" />
                      ) : (
                        <FaLock />
                      )}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-state-cell">
                  No employees found for this search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sensitiveData &&
        createPortal(
        <div className="sensitive-data-panel" onClick={closeSensitiveModal}>
          <div className="panel-content" onClick={(event) => event.stopPropagation()}>
            <div className="panel-head">
              <div>
                <p className="panel-kicker">Sensitive Employee Details</p>
                <h3>{sensitiveData.name}</h3>
                <p className="panel-subtitle">
                  {sensitiveData.department || "General"} •{" "}
                  {sensitiveData.designation || "Employee"}
                </p>
              </div>
              <button className="btn-cancel" onClick={closeSensitiveModal}>
                Close
              </button>
            </div>

            <div className="grid-2 sensitive-grid">
              <div className="detail-card">
                <span className="detail-label">Salary</span>
                <strong className="detail-value">Rs. {sensitiveData.salary ?? "N/A"}</strong>
              </div>
              <div className="detail-card">
                <span className="detail-label">Leaves</span>
                <strong className="detail-value">
                  {sensitiveData.leaveToday?.isOnLeave
                    ? `${sensitiveData.leaveToday.leaveType} Today`
                    : sensitiveData.leaves ?? 0}
                </strong>
              </div>
              <div className="detail-card">
                <span className="detail-label">Leaving Date</span>
                <strong className="detail-value">
                  {sensitiveData.leavingDate
                    ? new Date(sensitiveData.leavingDate).toLocaleDateString()
                    : "Active Employee"}
                </strong>
              </div>
              <div className="detail-card">
                <span className="detail-label">Contact Number</span>
                <strong className="detail-value">
                  {sensitiveData.contactNumber || "N/A"}
                </strong>
              </div>
              <div className="detail-card detail-card-wide">
                <span className="detail-label">Address</span>
                <strong className="detail-value detail-text">
                  {sensitiveData.address || "N/A"}
                </strong>
              </div>
            </div>

            <div className="slips-section">
              <h4>Salary Slips</h4>
              <p className="panel-subtitle">
                Private files visible after password verification.
              </p>
            </div>
            <div className="slips-list">
              {sensitiveData.salarySlips?.map((slip, i) => (
                <div key={i} className="slip-item">
                  <div className="slip-item-copy">
                    <span>
                      <FaRegFilePdf /> {slip.filename}
                    </span>
                    <small className="table-subtle">
                      {slip.uploadedAt
                        ? new Date(slip.uploadedAt).toLocaleDateString()
                        : "Private file"}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary btn-secondary-sm"
                    onClick={() => downloadSalarySlip(sensitiveData._id, i, slip.filename)}
                  >
                    Download
                  </button>
                </div>
              ))}
              {(!sensitiveData.salarySlips || sensitiveData.salarySlips.length === 0) && (
                <p>No slips uploaded</p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {showReAuthModal &&
        createPortal(
          <div className="contacts-modal-overlay">
            <div className="contacts-modal-card">
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
                {reAuthError && <p className="error-message">{reAuthError}</p>}
                <div className="modal-buttons">
                  <button type="submit" className="btn-primary">
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReAuthModal(false);
                      setReAuthError("");
                      setReAuthPassword("");
                    }}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {showModal && (
        <div className="contacts-modal-overlay">
          <div className="contacts-modal-card contacts-modal-card-wide">
            <h3>Add New Employee / Contact</h3>
            <form onSubmit={handleSubmit} className="grid-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={newContact.status}
                  onChange={(e) => setNewContact({ ...newContact, status: e.target.value })}
                >
                  <option>Prospect</option>
                  <option>Lead</option>
                  <option>Customer</option>
                  <option>Employee</option>
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  value={newContact.department}
                  onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Designation</label>
                <input
                  type="text"
                  value={newContact.designation}
                  onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Joining Date</label>
                <input
                  type="date"
                  value={newContact.joiningDate}
                  onChange={(e) => setNewContact({ ...newContact, joiningDate: e.target.value })}
                />
              </div>

              <div className="full-width-buttons">
                <button type="submit" className="btn-primary">
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contacts;
