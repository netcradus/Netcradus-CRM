import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Receipt, Plus, Pencil, Trash2 } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { parseISO } from "date-fns";
import { apiUrl } from "../../config/api";

const EXPENSE_API = apiUrl("/api/expenses");

const defaultExpenseForm = {
  title: "",
  amount: "",
  quantity: 1,
  category: "Misc",
  date: "",
  notes: "",
};

const formatCurrency = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(v) || 0);
const normalizeTitle = (v = "") => v.trim().toLowerCase();
const getLineTotal = (e) => (Number(e.amount) || 0) * (Number(e.quantity) || 1);

function ExpensesPage() {
  const token = localStorage.getItem("token");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expenseForm, setExpenseForm] = useState(defaultExpenseForm);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const requestConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(EXPENSE_API, requestConfig);
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setError("Failed to load expenses"); }
    finally { setLoading(false); }
  }, [requestConfig]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const grandTotal = useMemo(() => expenses.reduce((sum, e) => sum + getLineTotal(e), 0), [expenses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${EXPENSE_API}/${editingId}`, expenseForm, requestConfig);
      } else {
        await axios.post(EXPENSE_API, expenseForm, requestConfig);
      }
      fetchExpenses();
      setShowModal(false);
      setExpenseForm(defaultExpenseForm);
      setEditingId(null);
    } catch (err) { setError("Failed to save expense"); }
  };

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Expense Management</h1>
          <p className="subtitle">Track office expenses, salaries and travel costs.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setExpenseForm(defaultExpenseForm); setShowModal(true); }}>
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="nc-stat-card">
          <span className="metric-label">Total Spend</span>
          <span className="metric-value">{formatCurrency(grandTotal)}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Entries</span>
          <span className="metric-value">{expenses.length}</span>
        </div>
        <div className="nc-stat-card">
          <span className="metric-label">Avg. Expense</span>
          <span className="metric-value">{formatCurrency(expenses.length ? grandTotal / expenses.length : 0)}</span>
        </div>
      </div>

      <div className="nc-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-base)' }}>Expense Entries</h3>
        </div>
        <table className="nc-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit Amount</th>
              <th>Total</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => (
              <tr key={e._id}>
                <td>
                   <div style={{ fontWeight: 'var(--font-semibold)' }}>{e.title}</div>
                   {e.notes && <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{e.notes}</div>}
                </td>
                <td><span className="badge badge-ghost">{e.category}</span></td>
                <td>{e.quantity || 1}</td>
                <td>{formatCurrency(e.amount)}</td>
                <td style={{ fontWeight: 'var(--font-bold)' }}>{formatCurrency(getLineTotal(e))}</td>
                <td>{e.date ? formatInTimeZone(parseISO(e.date), "Asia/Kolkata", "dd/MM/yyyy") : "—"}</td>
                <td>
                   <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-ghost" onClick={() => {
                        setEditingId(e._id);
                        setExpenseForm({
                          ...e,
                          date: e.date ? e.date.substring(0, 10) : ""
                        });
                        setShowModal(true);
                      }}><Pencil size={14} /></button>
                      <button className="btn btn-ghost" style={{ color: 'var(--color-error)' }} onClick={async () => {
                        if(window.confirm("Delete expense?")) {
                          await axios.delete(`${EXPENSE_API}/${e._id}`, requestConfig);
                          fetchExpenses();
                        }
                      }}><Trash2 size={14} /></button>
                   </div>
                </td>
              </tr>
            ))}
            {expenses.length === 0 && !loading && (
              <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>No expenses recorded</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
            <div className="nc-modal-header">
              <h3>{editingId ? "Edit Expense" : "Add Expense"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="form">
              <div className="form-field">
                <label className="form-label">Expense Title</label>
                <input className="form-input" required value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-field">
                  <label className="form-label">Unit Amount (₹)</label>
                  <input className="form-input" type="number" step="0.01" required value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
                </div>
                <div className="form-field">
                  <label className="form-label">Quantity</label>
                  <input className="form-input" type="number" min="1" required value={expenseForm.quantity} onChange={e => setExpenseForm({...expenseForm, quantity: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-field">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                    <option>Travel</option><option>Food</option><option>Salary</option><option>Office</option><option>Misc</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" required value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
                </div>
              </div>
              <div className="form-field">
                <label className="form-label">Notes (Optional)</label>
                <textarea className="form-input" rows={2} value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Expense</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExpensesPage;
