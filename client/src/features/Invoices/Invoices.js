import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FaReceipt } from "react-icons/fa";
import "./Invoices.css";
import { apiUrl } from "../../config/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const Invoices = () => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const canGenerateExpenseInvoices = ["admin", "super_user"].includes(userRole);
  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    customer: "",
    amount: "",
    dueDate: "",
    status: "Unpaid",
  });
  const [expenseInvoiceForm, setExpenseInvoiceForm] = useState({
    expenseKey: "",
    dueDate: "",
    status: "Unpaid",
  });

  const headers = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/api/invoices"), headers);
      setInvoices(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  }, [headers]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/api/expenses"), headers);
      setExpenses(res.data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  }, [headers]);

  // Fetch invoices on component mount
  useEffect(() => {
    fetchInvoices();
    if (canGenerateExpenseInvoices) {
      fetchExpenses();
    }
  }, [canGenerateExpenseInvoices, fetchExpenses, fetchInvoices]);

  const expenseGroups = useMemo(() => {
    const grouped = new Map();

    expenses.forEach((expense) => {
      const normalizedTitle = String(expense.title || "").trim().toLowerCase();
      if (!normalizedTitle) return;

      if (!grouped.has(normalizedTitle)) {
        grouped.set(normalizedTitle, {
          key: normalizedTitle,
          title: expense.title,
          quantity: 0,
          totalAmount: 0,
          latestDate: expense.date,
        });
      }

      const group = grouped.get(normalizedTitle);
      const quantity = Number(expense.quantity) || 1;
      const unitAmount = Number(expense.amount) || 0;

      group.quantity += quantity;
      group.totalAmount += unitAmount * quantity;

      if (!group.latestDate || new Date(expense.date) > new Date(group.latestDate)) {
        group.latestDate = expense.date;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [expenses]);

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

  const toggleExpenseModal = () => {
    setIsExpenseModalOpen((prev) => !prev);
    setExpenseInvoiceForm({
      expenseKey: "",
      dueDate: "",
      status: "Unpaid",
    });
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
        const res = await axios.put(apiUrl(`/api/invoices/${editingInvoice._id}`), invoiceForm, headers);
        setInvoices(invoices.map((inv) => (inv._id === editingInvoice._id ? res.data : inv)));
      } else {
        // Add new invoice
        const res = await axios.post(apiUrl("/api/invoices"), invoiceForm, headers);
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
      await axios.delete(apiUrl(`/api/invoices/${id}`), headers);
      setInvoices(invoices.filter((inv) => inv._id !== id));
    } catch (err) {
      console.error("Error deleting invoice:", err);
    }
  };

  const handleGenerateExpenseInvoice = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(apiUrl("/api/invoices/generate-from-expense"), {
        expenseKey: expenseInvoiceForm.expenseKey,
        dueDate: expenseInvoiceForm.dueDate,
        status: expenseInvoiceForm.status,
      }, headers);
      setInvoices((prev) => [...prev, res.data]);
      toggleExpenseModal();
      fetchInvoices();
    } catch (err) {
      console.error("Error generating expense invoice:", err);
    }
  };

  return (
    <div className="invoices-container">
      <h2 className="invoices-title"><FaReceipt /> Client Invoices</h2>

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
      <td data-label="ID">{index + 1}</td>
      <td data-label="Customer">{invoice.customer}</td>
      <td data-label="Amount">₹{invoice.amount}</td>
      <td data-label="Due Date">
        {new Date(invoice.dueDate).toLocaleDateString()}
      </td>
     <td data-label="Status">
  <span className={invoice.status === "Paid" ? "paid" : "unpaid"}>
    {invoice.status}
  </span>
</td>
      <td data-label="Actions" className="action-buttons">
        <button className="edit-btn" onClick={() => toggleModal(invoice)}>
          Edit
        </button>
        <button
          className="delete-btn"
          onClick={() => handleDeleteInvoice(invoice._id)}
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>

      <div className="button-wrapper invoice-actions-row">
        <button className="add-invoice-btn" onClick={() => toggleModal()}>+ Add New Invoice</button>
        {canGenerateExpenseInvoices && (
          <button className="add-invoice-btn secondary-invoice-btn" onClick={toggleExpenseModal}>
            Generate From Expenses
          </button>
        )}
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

      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Generate Expense Invoice</h3>
            <form onSubmit={handleGenerateExpenseInvoice} className="invoice-form">
              <label>
                Expense Group:
                <select
                  value={expenseInvoiceForm.expenseKey}
                  onChange={(e) =>
                    setExpenseInvoiceForm((prev) => ({ ...prev, expenseKey: e.target.value }))
                  }
                  required
                >
                  <option value="">Select expense group</option>
                  {expenseGroups.map((expense) => (
                    <option key={expense.key} value={expense.key}>
                      {expense.title} - {expense.quantity} qty - {formatCurrency(expense.totalAmount)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Due Date:
                <input
                  type="date"
                  value={expenseInvoiceForm.dueDate}
                  onChange={(e) =>
                    setExpenseInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Status:
                <select
                  value={expenseInvoiceForm.status}
                  onChange={(e) =>
                    setExpenseInvoiceForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </label>

              {expenseInvoiceForm.expenseKey && (
                <div className="expense-invoice-preview">
                  {(() => {
                    const selectedExpense = expenseGroups.find((item) => item.key === expenseInvoiceForm.expenseKey);
                    if (!selectedExpense) return null;

                    return (
                      <>
                        <p><strong>Invoice For:</strong> Expense Invoice - {selectedExpense.title}</p>
                        <p><strong>Total Quantity:</strong> {selectedExpense.quantity}</p>
                        <p><strong>Invoice Amount:</strong> {formatCurrency(selectedExpense.totalAmount)}</p>
                      </>
                    );
                  })()}
                </div>
              )}

              <div className="form-buttons">
                <button type="submit" className="save-btn">Generate</button>
                <button type="button" className="cancel-btn" onClick={toggleExpenseModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
