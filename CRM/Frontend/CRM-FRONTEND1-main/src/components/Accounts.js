// import React, { useState, useEffect } from "react";
// import "./Accounts.css";

// function Accounts() {
//   const [accounts, setAccounts] = useState([]);
//   const [search, setSearch] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [newAccount, setNewAccount] = useState({
//     accountName: "",
//     accountOwner: "",
//     industry: "",
//     email: "",
//     phone: "",
//   });

//   // Fetch accounts from backend
//   useEffect(() => {
//     fetchAccounts();
//   }, []);

//   const fetchAccounts = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/api/accounts");
//       if (!res.ok) throw new Error("Failed to fetch accounts");
//       const data = await res.json();
//       setAccounts(data);
//     } catch (err) {
//       console.error("Error fetching accounts:", err);
//       setAccounts([]);
//     }
//   };

//   // Handle modal open
//   const handleAddClick = () => {
//     setShowModal(true);
//   };

//   // Handle input changes
//   const handleInputChange = (e) => {
//     setNewAccount({ ...newAccount, [e.target.name]: e.target.value });
//   };

//   // Handle form submit
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await fetch("http://localhost:5000/api/accounts", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newAccount),
//       });
//       if (!res.ok) throw new Error("Failed to add account");
//       const data = await res.json();
//       setAccounts([...accounts, data]); // add new account to table
//       setShowModal(false);
//       setNewAccount({
//         accountName: "",
//         accountOwner: "",
//         industry: "",
//         email: "",
//         phone: "",
//       });
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   // Filter accounts based on search
//   const filteredAccounts = accounts.filter((account) =>
//     account.accountName.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="accounts-container">
//       <h2 className="accounts-heading">Accounts</h2>

//       {/* Actions */}
//       <div className="accounts-actions">
//         <button className="btn-primary" onClick={handleAddClick}>
//           Add Account
//         </button>
//         <input
//           className="search-bar"
//           type="text"
//           placeholder="Search Accounts"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />
//       </div>

//       {/* Account Types */}
//       <div className="account-types">
//         <div className="type">Client</div>
//         <div className="type partner">Partner</div>
//         <div className="type inactive">Inactive</div>
//       </div>

//       {/* Accounts Table */}
//       <div className="accounts-table">
//         <table>
//           <thead>
//             <tr>
//               <th>Account Name</th>
//               <th>Owner</th>
//               <th>Industry</th>
//               <th>Email</th>
//               <th>Phone</th>
//               <th>Last Updated</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredAccounts.length > 0 ? (
//               filteredAccounts.map((account) => (
//                 <tr key={account._id}>
//                   <td>{account.accountName}</td>
//                   <td>{account.accountOwner}</td>
//                   <td>{account.industry}</td>
//                   <td>{account.email || "N/A"}</td>
//                   <td>{account.phone || "N/A"}</td>
//                   <td>
//                     {account.updatedAt
//                       ? new Date(account.updatedAt).toLocaleDateString()
//                       : "N/A"}
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="6" style={{ textAlign: "center" }}>
//                   No accounts found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="modal-backdrop">
//           <div className="modal">
//             <h3>Add New Account</h3>
//             <form onSubmit={handleSubmit}>
//               <input
//                 type="text"
//                 name="accountName"
//                 placeholder="Account Name"
//                 value={newAccount.accountName}
//                 onChange={handleInputChange}
//                 required
//               />
//               <input
//                 type="text"
//                 name="accountOwner"
//                 placeholder="Account Owner"
//                 value={newAccount.accountOwner}
//                 onChange={handleInputChange}
//                 required
//               />
//               <input
//                 type="text"
//                 name="industry"
//                 placeholder="Industry"
//                 value={newAccount.industry}
//                 onChange={handleInputChange}
//               />
//               <input
//                 type="email"
//                 name="email"
//                 placeholder="Email"
//                 value={newAccount.email}
//                 onChange={handleInputChange}
//               />
//               <input
//                 type="text"
//                 name="phone"
//                 placeholder="Phone"
//                 value={newAccount.phone}
//                 onChange={handleInputChange}
//               />
//               <div className="modal-buttons">
//                 <button type="submit" className="btn-primary">
//                   Save
//                 </button>
//                 <button type="button" onClick={() => setShowModal(false)}>
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

// export default Accounts;






import React, { useState, useEffect } from "react";
import "./Accounts.css";
import { apiUrl } from "../config/api";

function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({
    accountName: "",
    accountOwner: "",
    industry: "",
    email: "",
    phone: "",
  });

  // Fetch accounts from backend
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(apiUrl("/api/accounts"));
      if (!res.ok) throw new Error("Failed to fetch accounts");
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error(err);
      setAccounts([]);
    }
  };

  // Open modal for add or edit
  const handleAddClick = () => {
    setEditingAccount(null);
    setNewAccount({
      accountName: "",
      accountOwner: "",
      industry: "",
      email: "",
      phone: "",
    });
    setShowModal(true);
  };

  const handleEditClick = (account) => {
    setEditingAccount(account);
    setNewAccount({
      accountName: account.accountName,
      accountOwner: account.accountOwner,
      industry: account.industry,
      email: account.email,
      phone: account.phone,
    });
    setShowModal(true);
  };

  // Delete account
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?")) return;
    try {
      const res = await fetch(apiUrl(`/api/accounts/${id}`), {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete account");
      setAccounts(accounts.filter((acc) => acc._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    setNewAccount({ ...newAccount, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingAccount
        ? apiUrl(`/api/accounts/${editingAccount._id}`)
        : apiUrl("/api/accounts");
      const method = editingAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      if (!res.ok) throw new Error("Failed to save account");
      const data = await res.json();

      if (editingAccount) {
        setAccounts(accounts.map((acc) => (acc._id === data._id ? data : acc)));
      } else {
        setAccounts([...accounts, data]);
      }

      setShowModal(false);
      setEditingAccount(null);
      setNewAccount({
        accountName: "",
        accountOwner: "",
        industry: "",
        email: "",
        phone: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Filter accounts based on search
  const filteredAccounts = accounts.filter((account) =>
    account.accountName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="accounts-container">
      <h2 className="accounts-heading">Accounts</h2>

      {/* Actions */}
      <div className="accounts-actions">
        <button className="btn-primary" onClick={handleAddClick}>
          Add Account
        </button>
        <input
          className="search-bar"
          type="text"
          placeholder="Search Accounts"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Account Types */}
      <div className="account-types">
        <div className="type">Client</div>
        <div className="type partner">Partner</div>
        <div className="type inactive">Inactive</div>
      </div>

      {/* Accounts Table */}
      <div className="accounts-table">
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Owner</th>
              <th>Industry</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Last Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((account) => (
                <tr key={account._id}>
                  <td>{account.accountName}</td>
                  <td>{account.accountOwner}</td>
                  <td>{account.industry}</td>
                  <td>{account.email || "N/A"}</td>
                  <td>{account.phone || "N/A"}</td>
                  <td>
                    {account.updatedAt
                      ? new Date(account.updatedAt).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    <button
                      className="btn-primary"
                      style={{ marginRight: "5px" }}
                      onClick={() => handleEditClick(account)}
                    >
                      Edit
                    </button>
                    <button
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#ff3333",
                        color: "#fff",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleDelete(account._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No accounts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{editingAccount ? "Edit Account" : "Add New Account"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="accountName"
                placeholder="Account Name"
                value={newAccount.accountName}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="accountOwner"
                placeholder="Account Owner"
                value={newAccount.accountOwner}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="industry"
                placeholder="Industry"
                value={newAccount.industry}
                onChange={handleInputChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={newAccount.email}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="phone"
                placeholder="Phone"
                value={newAccount.phone}
                onChange={handleInputChange}
              />
              <div className="modal-buttons">
                <button type="submit" className="btn-primary">
                  {editingAccount ? "Update" : "Save"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}>
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

export default Accounts;
