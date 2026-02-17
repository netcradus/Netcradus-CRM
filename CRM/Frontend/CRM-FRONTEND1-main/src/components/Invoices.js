import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Invoices.css";
import { apiUrl } from "../config/api";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    customer: "",
    amount: "",
    dueDate: "",
    status: "Unpaid",
  });

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await axios.get(apiUrl("/api/invoices"));
      setInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  // Open modal for add or edit
  const toggleModal = (invoice = null) => {
    setIsModalOpen(!isModalOpen);
    if (invoice) {
      setEditingInvoice(invoice);
      setInvoiceForm({
        customer: invoice.customer,
        amount: invoice.amount,
        dueDate: invoice.dueDate.split("T")[0],
        status: invoice.status,
      });
    } else {
      setEditingInvoice(null);
      setInvoiceForm({ customer: "", amount: "", dueDate: "", status: "Unpaid" });
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoiceForm((prev) => ({ ...prev, [name]: value }));
  };

  // Add or update invoice
  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    try {
      if (editingInvoice) {
        // Update existing invoice
        const res = await axios.put(apiUrl(`/api/invoices/${editingInvoice._id}`), invoiceForm);
        setInvoices(invoices.map((inv) => (inv._id === editingInvoice._id ? res.data : inv)));
      } else {
        // Add new invoice
        const res = await axios.post(apiUrl("/api/invoices"), invoiceForm);
        setInvoices([...invoices, res.data]);
      }
      toggleModal();
    } catch (err) {
      console.error("Error saving invoice:", err);
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await axios.delete(apiUrl(`/api/invoices/${id}`));
      setInvoices(invoices.filter((inv) => inv._id !== id));
    } catch (err) {
      console.error("Error deleting invoice:", err);
    }
  };

  return (
    <div className="invoices-container">
      <h2 className="invoices-title">Client Invoices</h2>

      <div className="invoice-table-wrapper">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice, index) => (
              <tr key={invoice._id}>
                <td>{index + 1}</td>
                <td>{invoice.customer}</td>
                <td>{invoice.amount}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td className={invoice.status === "Paid" ? "paid" : "unpaid"}>
                  {invoice.status}
                </td>
                <td>
                  <button className="edit-btn" onClick={() => toggleModal(invoice)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDeleteInvoice(invoice._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="button-wrapper">
        <button className="add-invoice-btn" onClick={() => toggleModal()}>+ Add New Invoice</button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{editingInvoice ? "Edit Invoice" : "Add New Invoice"}</h3>
            <form onSubmit={handleSaveInvoice} className="invoice-form">
              <label>
                Customer:
                <input type="text" name="customer" value={invoiceForm.customer} onChange={handleChange} required />
              </label>
              <label>
                Amount:
                <input type="text" name="amount" value={invoiceForm.amount} onChange={handleChange} required />
              </label>
              <label>
                Due Date:
                <input type="date" name="dueDate" value={invoiceForm.dueDate} onChange={handleChange} required />
              </label>
              <label>
                Status:
                <select name="status" value={invoiceForm.status} onChange={handleChange}>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </label>
              <div className="form-buttons">
                <button type="submit" className="save-btn">Save</button>
                <button type="button" className="cancel-btn" onClick={() => toggleModal()}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
