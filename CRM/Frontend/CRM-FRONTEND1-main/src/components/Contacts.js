// import React from "react";
// import "./Contacts.css";

// function Contacts() {
//   return (
//     <div className="contacts-container">
//       <h2 className="contacts-heading">Contacts</h2>

//       <div className="contacts-actions">
//         <button className="btn-primary">Add Contact</button>
//         <input className="search-bar" type="text" placeholder="Search Contacts" />
//       </div>

//       <div className="contact-groups">
//         <div className="group">All</div>
//         <div className="group vip">VIP</div>
//         <div className="group inactive">Inactive</div>
//       </div>

//       <div className="contacts-table">
//         <table>
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>Email</th>
//               <th>Phone</th>
//               <th>Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             <tr>
//               <td>Aarav Mehta</td>
//               <td>aarav@example.com</td>
//               <td>9876543210</td>
//               <td><span className="badge active">Active</span></td>
//             </tr>
//             <tr>
//               <td>Neha Kapoor</td>
//               <td>neha@example.com</td>
//               <td>8765432109</td>
//               <td><span className="badge inactive">Inactive</span></td>
//             </tr>
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// export default Contacts;




import React, { useState, useEffect } from "react";
import "./Contacts.css";

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    email: "",
    status: "Prospect",
    lastInteraction: new Date().toISOString(),
  });

  // Fetch contacts from backend
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/contacts");
        if (!res.ok) throw new Error("Failed to fetch contacts");
        const data = await res.json();
        setContacts(data);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setContacts([]);
      }
    };
    fetchContacts();
  }, []);

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleChange = (e) => {
    setNewContact({ ...newContact, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });
      if (!res.ok) throw new Error("Failed to save contact");
      const savedContact = await res.json();
      setContacts([savedContact, ...contacts]);
      setNewContact({
        name: "",
        email: "",
        status: "Prospect",
        lastInteraction: new Date().toISOString(),
      });
      closeModal();
    } catch (err) {
      console.error("Error saving contact:", err);
    }
  };

  return (
    <div className="contacts-container">
      <h2 className="contacts-heading">Contacts</h2>

      {/* Actions */}
      <div className="contacts-actions">
        <button className="btn-primary" onClick={openModal}>
          Add Contact
        </button>
        <input
          className="search-bar"
          type="text"
          placeholder="Search Contacts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Contact Types */}
      <div className="contacts-types">
        <div className="type">Prospect</div>
        <div className="type lead">Lead</div>
        <div className="type customer">Customer</div>
      </div>

      {/* Contacts Table */}
      <div className="contacts-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Last Interaction</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.length > 0 ? (
              filteredContacts.map((contact) => (
                <tr key={contact._id}>
                  <td>{contact.name}</td>
                  <td>{contact.email}</td>
                  <td>
                    <span className={`badge ${contact.status.toLowerCase()}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td>
                    {contact.lastInteraction
                      ? new Date(contact.lastInteraction).toLocaleDateString()
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Contact</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Name"
                value={newContact.name}
                onChange={handleChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={newContact.email}
                onChange={handleChange}
                required
              />
              <select
                name="status"
                value={newContact.status}
                onChange={handleChange}
              >
                <option>Prospect</option>
                <option>Lead</option>
                <option>Customer</option>
              </select>
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  Save Contact
                </button>
                <button
                  type="button"
                  onClick={closeModal}
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
