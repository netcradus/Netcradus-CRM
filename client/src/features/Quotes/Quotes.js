import React, { useState } from "react";
import { FaFileAlt } from "react-icons/fa";
import "./Quotes.css";

function Quotes() {
  const [quotes, setQuotes] = useState([
   
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newQuote, setNewQuote] = useState({
    client: "",
    amount: "",
    status: "Draft",
    date: new Date().toISOString(),
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Open/Close Modal
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  // Handle form input changes
  const handleChange = (e) => {
    setNewQuote({ ...newQuote, [e.target.name]: e.target.value });
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!newQuote.client || !newQuote.amount) {
      setError("Please fill all required fields");
      setSuccess("");
      return;
    }

    const quoteToAdd = { ...newQuote, id: Date.now(), date: new Date().toISOString() };
    setQuotes([quoteToAdd, ...quotes]);
    setNewQuote({ client: "", amount: "", status: "Draft", date: new Date().toISOString() });

    setSuccess("Quote added successfully!");
    setError("");
    closeModal();
  };

  return (
    <div className="quotes-container">
      <h2 className="quotes-heading"><FaFileAlt /> Quotes Management</h2>

      {/* Success/Error Messages */}
      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="quotes-actions">
        <button className="btn-primary" onClick={openModal}>+ Add New Quote</button>
        <input className="search-bar" placeholder="Search quotes..." />
      </div>

      <div className="quotes-table">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date Sent</th>
            </tr>
          </thead>
    <tbody>
  {quotes.map((quote) => (
    <tr key={quote.id}>
      <td data-label="Client">{quote.client}</td>
      <td data-label="Amount">{quote.amount}</td>
      <td data-label="Status">
        <span className={`badge ${quote.status.toLowerCase().replace(" ", "-")}`}>
          {quote.status}
        </span>
      </td>
      <td data-label="Date Sent">
        {new Date(quote.date).toLocaleString()}
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Quote</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="client"
                placeholder="Client Name"
                value={newQuote.client}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="amount"
                placeholder="Amount"
                value={newQuote.amount}
                onChange={handleChange}
                required
              />
              <select name="status" value={newQuote.status} onChange={handleChange}>
                <option>Draft</option>
                <option>Sent</option>
                <option>Accepted</option>
                <option>Rejected</option>
              </select>

              <div className="modal-buttons">
                <button type="submit" className="btn-primary">Save Quote</button>
                <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quotes;
