import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Edit, Plus, Search, ChevronRight, Trash2, Zap } from "lucide-react";
import { apiUrl } from "../../config/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const defaultInvoiceForm = { customer: "", amount: "", dueDate: "", status: "Unpaid" };
const defaultExpenseInvoiceForm = { expenseKey: "", dueDate: "", status: "Unpaid" };

const normalizeExpenseTitle = (value = "") => String(value || "").trim().toLowerCase();

const Invoices = () => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  const canGenerateExpenseInvoices = ["admin", "super_user"].includes(userRole);

  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [invoiceForm, setInvoiceForm] = useState(defaultInvoiceForm);
  const [expenseInvoiceForm, setExpenseInvoiceForm] = useState(defaultExpenseInvoiceForm);

  const headers = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl("/api/invoices"), headers);
      setInvoices(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setError("Failed to load invoices.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/api/expenses"), headers);
      setExpenses(Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setExpenses([]);
    }
  }, [headers]);

  useEffect(() => {
    fetchInvoices();
    if (canGenerateExpenseInvoices) fetchExpenses();
  }, [canGenerateExpenseInvoices, fetchExpenses, fetchInvoices]);

  const groupedExpenses = useMemo(() => {
    const groups = new Map();

    expenses.forEach((expense) => {
      const key = normalizeExpenseTitle(expense.title);
      if (!key) return;

      const current = groups.get(key) || {
        key,
        title: expense.title,
        quantity: 0,
        amount: 0,
        entries: 0,
      };

      current.quantity += Number(expense.quantity) || 1;
      current.amount += (Number(expense.amount) || 0) * (Number(expense.quantity) || 1);
      current.entries += 1;
      groups.set(key, current);
    });

    return Array.from(groups.values()).sort((left, right) => right.amount - left.amount);
  }, [expenses]);

  const filteredInvoices = useMemo(() => {
    const needle = search.toLowerCase().trim();
    if (!needle) return invoices;

    return invoices.filter((invoice) => {
      const haystack = [
        invoice.customer,
        invoice.status,
        invoice.sourceTitle,
        invoice.sourceType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [invoices, search]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const resetInvoiceModal = () => {
    setEditingInvoice(null);
    setInvoiceForm(defaultInvoiceForm);
    setIsModalOpen(false);
  };

  const handleSaveInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    clearMessages();

    try {
      if (editingInvoice) {
        await axios.put(apiUrl(`/api/invoices/${editingInvoice._id}`), invoiceForm, headers);
        setSuccess("Invoice updated successfully.");
      } else {
        await axios.post(apiUrl("/api/invoices"), invoiceForm, headers);
        setSuccess("Invoice created successfully.");
      }

      resetInvoiceModal();
      await fetchInvoices();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateExpenseInvoice = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    clearMessages();

    try {
      await axios.post(apiUrl("/api/invoices/generate-from-expense"), expenseInvoiceForm, headers);
      setSuccess("Expense invoice created successfully.");
      setExpenseInvoiceForm(defaultExpenseInvoiceForm);
      setIsExpenseModalOpen(false);
      await fetchInvoices();
    } catch (err) {
      setError(err.response?.data?.message || "Could not generate invoice from expense.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!window.confirm("Delete invoice?")) return;
    clearMessages();

    try {
      await axios.delete(apiUrl(`/api/invoices/${id}`), headers);
      setSuccess("Invoice deleted successfully.");
      await fetchInvoices();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete invoice.");
    }
  };

  const totalAmount = useMemo(
    () => invoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0),
    [invoices]
  );

  const paidCount = useMemo(
    () => invoices.filter((invoice) => invoice.status === "Paid").length,
    [invoices]
  );

  const overdueCount = useMemo(
    () =>
      invoices.filter(
        (invoice) =>
          invoice.status !== "Paid" &&
          invoice.status !== "Cancelled" &&
          invoice.dueDate &&
          new Date(invoice.dueDate) < new Date()
      ).length,
    [invoices]
  );

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              fontSize: "10px",
              color: "var(--color-text-muted)",
              marginBottom: "var(--space-1)",
            }}
          >
            <span>Sales</span>
            <ChevronRight size={10} />
            <span>Invoices</span>
          </div>
          <h1 className="title">Client Invoices</h1>
          <p className="subtitle">Manage billing, payment tracking, and expense-based invoicing.</p>
        </div>
        <div className="page-header-right">
          {canGenerateExpenseInvoices && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                clearMessages();
                setExpenseInvoiceForm(defaultExpenseInvoiceForm);
                setIsExpenseModalOpen(true);
              }}
            >
              <Zap size={16} /> Invoice from Expense
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => {
              clearMessages();
              setEditingInvoice(null);
              setInvoiceForm(defaultInvoiceForm);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} /> New Invoice
          </button>
        </div>
      </div>

      {(error || success) && (
        <div
          className={`badge ${error ? "badge-error" : "badge-success"}`}
          style={{ marginBottom: "var(--space-4)", padding: "var(--space-3) var(--space-4)", width: "100%" }}
        >
          {error || success}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-6)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div className="nc-stat-card">
          <span className="metric-label">Invoices</span>
          <span className="metric-value">{invoices.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Total Value</span>
          <span className="metric-value">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Paid</span>
          <span className="metric-value" style={{ color: "var(--color-success)" }}>
            {paidCount}
          </span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Overdue</span>
          <span className="metric-value" style={{ color: overdueCount ? "var(--color-error)" : "inherit" }}>
            {overdueCount}
          </span>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
        <div style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            className="form-input"
            style={{ paddingLeft: "36px" }}
            placeholder="Search customer, status, source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="nc-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="nc-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "var(--space-10)" }}>
                    Loading invoices...
                  </td>
                </tr>
              ) : filteredInvoices.map((invoice, idx) => (
                <tr key={invoice._id}>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                      INV-{String(idx + 1).padStart(4, "0")}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: "var(--font-semibold)" }}>{invoice.customer}</div>
                    {invoice.sourceTitle ? (
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{invoice.sourceTitle}</div>
                    ) : null}
                  </td>
                  <td>{formatCurrency(invoice.amount)}</td>
                  <td>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</td>
                  <td>
                    <span
                      className={`badge ${
                        invoice.status === "Paid"
                          ? "badge-success"
                          : invoice.status === "Cancelled"
                            ? "badge-error"
                            : invoice.status === "Partially Paid"
                              ? "badge-info"
                              : "badge-warning"
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-ghost">
                      {invoice.sourceType === "expense" ? "Expense" : "Manual"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "var(--space-2)" }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "var(--space-1)" }}
                        onClick={() => {
                          clearMessages();
                          setEditingInvoice(invoice);
                          setInvoiceForm({
                            customer: invoice.customer || "",
                            amount: invoice.amount || "",
                            dueDate: invoice.dueDate?.substring(0, 10) || "",
                            status: invoice.status || "Unpaid",
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: "var(--space-1)", color: "var(--color-error)" }}
                        onClick={() => handleDeleteInvoice(invoice._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>
                    No invoices found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="nc-modal-overlay" onClick={resetInvoiceModal}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "420px" }}>
            <div className="nc-modal-header">
              <h3>{editingInvoice ? "Edit Invoice" : "Create Invoice"}</h3>
            </div>
            <form className="form" onSubmit={handleSaveInvoice}>
              <div className="form-field">
                <label className="form-label">Customer Name</label>
                <input
                  className="form-input"
                  required
                  value={invoiceForm.customer}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customer: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Amount (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Due Date</label>
                <input
                  className="form-input"
                  type="date"
                  required
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={invoiceForm.status}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Invoice"}
                </button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={resetInvoiceModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="nc-modal-overlay" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "460px" }}>
            <div className="nc-modal-header">
              <h3>Generate Invoice from Expense</h3>
            </div>
            <form className="form" onSubmit={handleGenerateExpenseInvoice}>
              <div className="form-field">
                <label className="form-label">Expense Group</label>
                <select
                  className="form-select"
                  required
                  value={expenseInvoiceForm.expenseKey}
                  onChange={(e) => setExpenseInvoiceForm({ ...expenseInvoiceForm, expenseKey: e.target.value })}
                >
                  <option value="">Select expense group</option>
                  {groupedExpenses.map((group) => (
                    <option key={group.key} value={group.key}>
                      {group.title} · {group.entries} entries · {formatCurrency(group.amount)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Due Date</label>
                <input
                  className="form-input"
                  type="date"
                  required
                  value={expenseInvoiceForm.dueDate}
                  onChange={(e) => setExpenseInvoiceForm({ ...expenseInvoiceForm, dueDate: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={expenseInvoiceForm.status}
                  onChange={(e) => setExpenseInvoiceForm({ ...expenseInvoiceForm, status: e.target.value })}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? "Generating..." : "Generate Invoice"}
                </button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setIsExpenseModalOpen(false)}>
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

export default Invoices;
