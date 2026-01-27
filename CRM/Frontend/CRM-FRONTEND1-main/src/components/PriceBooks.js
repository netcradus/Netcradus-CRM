// import React, { useState } from "react";
// import "./PriceBooks.css";

// const PriceBooks = () => {
//   const [priceBooks, setPriceBooks] = useState([
//     {
//       id: 1,
//       name: "Standard Book",
//       currency: "USD",
//       type: "Retail",
//       products: "Product A, Product B",
//       effectiveDate: "2025-08-01",
//       expiryDate: "2026-01-01",
//       status: "Active",
//       version: "v1.0",
//     },
//     {
//       id: 2,
//       name: "Wholesale India",
//       currency: "INR",
//       type: "Wholesale",
//       products: "Product C, Product D",
//       effectiveDate: "2025-08-01",
//       expiryDate: "2025-12-31",
//       status: "Inactive",
//       version: "v2.1",
//     },
//   ]);

//   const [showModal, setShowModal] = useState(false);
//   const [newBook, setNewBook] = useState({
//     name: "",
//     currency: "",
//     type: "",
//     products: "",
//     effectiveDate: "",
//     expiryDate: "",
//     status: "Active",
//     version: "v1.0",
//   });

//   // ✅ Date Formatter
//   const formatDate = (dateString) => {
//     const options = { year: "numeric", month: "short", day: "numeric" };
//     return new Date(dateString).toLocaleDateString(undefined, options);
//   };

//   // ✅ Delete handler
//   const handleDelete = (id) => {
//     const confirmDelete = window.confirm(
//       "Are you sure you want to delete this price book?"
//     );
//     if (confirmDelete) {
//       setPriceBooks(priceBooks.filter((book) => book.id !== id));
//     }
//   };

//   // ✅ Edit handler
//   const handleEdit = (id) => {
//     const book = priceBooks.find((b) => b.id === id);
//     alert(`Editing "${book.name}" coming soon.`);
//   };

//   // ✅ Add New Price Book
//   const handleAddBook = (e) => {
//     e.preventDefault();
//     const newEntry = { ...newBook, id: Date.now() };
//     setPriceBooks([...priceBooks, newEntry]);
//     setNewBook({
//       name: "",
//       currency: "",
//       type: "",
//       products: "",
//       effectiveDate: "",
//       expiryDate: "",
//       status: "Active",
//       version: "v1.0",
//     });
//     setShowModal(false);
//   };

//   return (
//     <div className="pricebooks-container">
//       {/* Header */}
//       <div className="pricebooks-header">
//         <h2>📚 Price Books</h2>
//         <button className="btn-add" onClick={() => setShowModal(true)}>
//           + Add New Price Book
//         </button>
//       </div>

//       {/* Table */}
//       <div className="pricebooks-table-wrapper">
//         <table className="pricebooks-table">
//           <thead>
//             <tr>
//               <th>Name</th>
//               <th>Currency</th>
//               <th>Type</th>
//               <th>Associated Products</th>
//               <th>Effective Date</th>
//               <th>Expiry Date</th>
//               <th>Status</th>
//               <th>Version</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {priceBooks.length > 0 ? (
//               priceBooks.map((book) => (
//                 <tr key={book.id}>
//                   <td>{book.name}</td>
//                   <td>{book.currency}</td>
//                   <td>{book.type}</td>
//                   <td>{book.products}</td>
//                   <td>{formatDate(book.effectiveDate)}</td>
//                   <td>{formatDate(book.expiryDate)}</td>
//                   <td>
//                     <span
//                       className={`status-badge ${
//                         book.status.toLowerCase() === "active"
//                           ? "active"
//                           : "inactive"
//                       }`}
//                     >
//                       {book.status}
//                     </span>
//                   </td>
//                   <td>{book.version}</td>
//                   <td className="actions">
//                     <button
//                       className="edit-btn"
//                       onClick={() => handleEdit(book.id)}
//                       title="Edit"
//                     >
//                       ✏️
//                     </button>
//                     <button
//                       className="delete-btn"
//                       onClick={() => handleDelete(book.id)}
//                       title="Delete"
//                     >
//                       🗑️
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
//                   No Price Books Available
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* ✅ Modal Popup */}
//       {showModal && (
//         <div className="modal-overlay">
//           <div className="modal-content">
//             <h3>Add New Price Book</h3>
//             <form onSubmit={handleAddBook} className="modal-form">
//               <input
//                 type="text"
//                 placeholder="Name"
//                 value={newBook.name}
//                 onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
//                 required
//               />
//               <input
//                 type="text"
//                 placeholder="Currency (e.g. USD)"
//                 value={newBook.currency}
//                 onChange={(e) =>
//                   setNewBook({ ...newBook, currency: e.target.value })
//                 }
//                 required
//               />
//               <input
//                 type="text"
//                 placeholder="Type (e.g. Retail, Wholesale)"
//                 value={newBook.type}
//                 onChange={(e) =>
//                   setNewBook({ ...newBook, type: e.target.value })
//                 }
//                 required
//               />
//               <input
//                 type="text"
//                 placeholder="Associated Products"
//                 value={newBook.products}
//                 onChange={(e) =>
//                   setNewBook({ ...newBook, products: e.target.value })
//                 }
//                 required
//               />
//               <label>
//                 Effective Date:
//                 <input
//                   type="date"
//                   value={newBook.effectiveDate}
//                   onChange={(e) =>
//                     setNewBook({ ...newBook, effectiveDate: e.target.value })
//                   }
//                   required
//                 />
//               </label>
//               <label>
//                 Expiry Date:
//                 <input
//                   type="date"
//                   value={newBook.expiryDate}
//                   onChange={(e) =>
//                     setNewBook({ ...newBook, expiryDate: e.target.value })
//                   }
//                   required
//                 />
//               </label>
//               <select
//                 value={newBook.status}
//                 onChange={(e) =>
//                   setNewBook({ ...newBook, status: e.target.value })
//                 }
//               >
//                 <option value="Active">Active</option>
//                 <option value="Inactive">Inactive</option>
//               </select>
//               <input
//                 type="text"
//                 placeholder="Version (e.g. v1.0)"
//                 value={newBook.version}
//                 onChange={(e) =>
//                   setNewBook({ ...newBook, version: e.target.value })
//                 }
//                 required
//               />
//               <div className="modal-actions">
//                 <button type="submit" className="btn-add">
//                   Save
//                 </button>
//                 <button
//                   type="button"
//                   className="btn-cancel"
//                   onClick={() => setShowModal(false)}
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
// };


import React, { useState } from "react";
import "./PriceBooks.css";

const PriceBooks = () => {
  const [priceBooks, setPriceBooks] = useState([
    {
      id: 1,
      name: "Standard Book",
      currency: "USD",
      type: "Retail",
      products: "Product A, Product B",
      effectiveDate: "2025-08-01",
      expiryDate: "2026-01-01",
      status: "Active",
      version: "v1.0",
    },
    {
      id: 2,
      name: "Wholesale India",
      currency: "INR",
      type: "Wholesale",
      products: "Product C, Product D",
      effectiveDate: "2025-08-01",
      expiryDate: "2025-12-31",
      status: "Inactive",
      version: "v2.1",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newBook, setNewBook] = useState({
    name: "",
    currency: "",
    type: "",
    products: "",
    effectiveDate: "",
    expiryDate: "",
    status: "Active",
    version: "v1.0",
  });

  // ✅ Date Formatter
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // ✅ Delete handler
  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this price book?"
    );
    if (confirmDelete) {
      setPriceBooks(priceBooks.filter((book) => book.id !== id));
    }
  };

  // ✅ Edit handler
  const handleEdit = (id) => {
    const book = priceBooks.find((b) => b.id === id);
    alert(`Editing "${book.name}" coming soon.`);
  };

  // ✅ Add New Price Book
  const handleAddBook = (e) => {
    e.preventDefault();
    const newEntry = { ...newBook, id: Date.now() };
    setPriceBooks([...priceBooks, newEntry]);
    setNewBook({
      name: "",
      currency: "",
      type: "",
      products: "",
      effectiveDate: "",
      expiryDate: "",
      status: "Active",
      version: "v1.0",
    });
    setShowModal(false);
  };

  return (
    <div className="pricebooks-container">
      {/* Header */}
      <div className="pricebooks-header">
        <h2>📚 Price Books</h2>
        <button className="btn-add" onClick={() => setShowModal(true)}>
          + Add New Price Book
        </button>
      </div>

      {/* Table */}
      <div className="pricebooks-table-wrapper">
        <table className="pricebooks-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Currency</th>
              <th>Type</th>
              <th>Associated Products</th>
              <th>Effective Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Version</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {priceBooks.length > 0 ? (
              priceBooks.map((book) => (
                <tr key={book.id}>
                  <td>{book.name}</td>
                  <td>{book.currency}</td>
                  <td>{book.type}</td>
                  <td>{book.products}</td>
                  <td>{formatDate(book.effectiveDate)}</td>
                  <td>{formatDate(book.expiryDate)}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        book.status.toLowerCase() === "active"
                          ? "active"
                          : "inactive"
                      }`}
                    >
                      {book.status}
                    </span>
                  </td>
                  <td>{book.version}</td>
                  <td className="actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(book.id)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(book.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                  No Price Books Available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Modal Popup */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Price Book</h3>
            <form onSubmit={handleAddBook} className="modal-form">
              <input
                type="text"
                placeholder="Name"
                value={newBook.name}
                onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Currency (e.g. USD)"
                value={newBook.currency}
                onChange={(e) =>
                  setNewBook({ ...newBook, currency: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Type (e.g. Retail, Wholesale)"
                value={newBook.type}
                onChange={(e) =>
                  setNewBook({ ...newBook, type: e.target.value })
                }
                required
              />
              <input
                type="text"
                placeholder="Associated Products"
                value={newBook.products}
                onChange={(e) =>
                  setNewBook({ ...newBook, products: e.target.value })
                }
                required
              />
              <label>
                Effective Date:
                <input
                  type="date"
                  value={newBook.effectiveDate}
                  onChange={(e) =>
                    setNewBook({ ...newBook, effectiveDate: e.target.value })
                  }
                  required
                />
              </label>
              <label>
                Expiry Date:
                <input
                  type="date"
                  value={newBook.expiryDate}
                  onChange={(e) =>
                    setNewBook({ ...newBook, expiryDate: e.target.value })
                  }
                  required
                />
              </label>
              <select
                value={newBook.status}
                onChange={(e) =>
                  setNewBook({ ...newBook, status: e.target.value })
                }
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <input
                type="text"
                placeholder="Version (e.g. v1.0)"
                value={newBook.version}
                onChange={(e) =>
                  setNewBook({ ...newBook, version: e.target.value })
                }
                required
              />
              <div className="modal-actions">
                <button type="submit" className="btn-add">
                  Save
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowModal(false)}
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
};

export default PriceBooks;
