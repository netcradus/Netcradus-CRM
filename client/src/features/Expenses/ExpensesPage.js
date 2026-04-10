import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Receipt } from "lucide-react";
import { apiUrl } from "../../config/api";
import "./ExpensesPage.css";

const EXPENSE_API = apiUrl("/api/expenses");

const defaultExpenseForm = {
  title: "",
  amount: "",
  quantity: 1,
  category: "Misc",
  date: "",
  notes: "",
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const normalizeTitle = (value = "") => value.trim().toLowerCase();
const getLineTotal = (expense) => (Number(expense.amount) || 0) * (Number(expense.quantity) || 1);
const formatAdminDisplay = (value = "") =>
  String(value).trim().toLowerCase() === "admin" ? "Administrator" : value;

function ExpensesPage() {
  const token = localStorage.getItem("token");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [expenseForm, setExpenseForm] = useState(defaultExpenseForm);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [editForm, setEditForm] = useState(defaultExpenseForm);

  const requestConfig = useMemo(
    () => ({
      headers: { Authorization: `Bearer ${token}` },
    }),
    [token]
  );

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(EXPENSE_API, requestConfig);
      setExpenses(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [requestConfig]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const groupedTotals = useMemo(() => {
    const groups = new Map();

    expenses.forEach((expense) => {
      const normalized = normalizeTitle(expense.title);
      if (!normalized) return;

      if (!groups.has(normalized)) {
        groups.set(normalized, {
          key: normalized,
          title: expense.title.trim(),
          totalAmount: 0,
          totalQuantity: 0,
          entryCount: 0,
          category: expense.category || "Misc",
        });
      }

      const group = groups.get(normalized);
      group.totalAmount += getLineTotal(expense);
      group.totalQuantity += Number(expense.quantity) || 1;
      group.entryCount += 1;
    });

    return Array.from(groups.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [expenses]);

  const grandTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + getLineTotal(expense), 0),
    [expenses]
  );

  const resetMessages = () => {
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    resetMessages();

    try {
      await axios.post(EXPENSE_API, expenseForm, requestConfig);
      setExpenseForm(defaultExpenseForm);
      setSuccess("Expense added successfully");
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add expense");
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    resetMessages();

    try {
      await axios.delete(`${EXPENSE_API}/${id}`, requestConfig);
      setSuccess("Expense deleted successfully");
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete expense");
    }
  };

  const handleUpdateExpense = async (id) => {
    resetMessages();

    try {
      await axios.put(`${EXPENSE_API}/${id}`, editForm, requestConfig);
      setEditExpenseId(null);
      setSuccess("Expense updated successfully");
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update expense");
    }
  };

  return (
    <div className="expenses-page">
      <div className="expenses-hero">
        <div>
          <h1 className="expenses-title">
            <Receipt size={24} />
            Expenses
          </h1>
          <p className="expenses-subtitle">
            Add expenses, manage entries, and view total spend by item.
          </p>
        </div>

        <div className="expenses-total-card">
          <span className="expenses-total-label">Grand Total</span>
          <strong>{formatCurrency(grandTotal)}</strong>
        </div>
      </div>

      {error && <div className="expenses-alert expenses-alert-error">{error}</div>}
      {success && <div className="expenses-alert expenses-alert-success">{success}</div>}

      <div className="expenses-layout">
        <section className="expenses-card">
          <h2>Add Expense</h2>

          <form onSubmit={handleAddExpense} className="expenses-form">
            <input
              placeholder="Expense title"
              value={expenseForm.title}
              onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
              required
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              required
            />

            <input
              type="number"
              min="1"
              step="1"
              placeholder="Quantity"
              value={expenseForm.quantity}
              onChange={(e) => setExpenseForm({ ...expenseForm, quantity: e.target.value })}
              required
            />

            <select
              value={expenseForm.category}
              onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
            >
              <option>Travel</option>
              <option>Food</option>
              <option>Salary</option>
              <option>Office</option>
              <option>Misc</option>
            </select>

            <input
              type="date"
              value={expenseForm.date}
              onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
              required
            />

            <textarea
              placeholder="Notes (optional)"
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
              rows="4"
            />

            <button type="submit">Add Expense</button>
          </form>
        </section>

        <section className="expenses-card">
          <div className="expenses-card-header">
            <h2>Expense Totals</h2>
            <span>{groupedTotals.length} grouped items</span>
          </div>

          <div className="expenses-table-wrap expenses-table-wrap--summary">
            <table className="expenses-table expenses-table--summary">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Entries</th>
                  <th>Quantity</th>
                  <th>Category</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {groupedTotals.length ? (
                  groupedTotals.map((item) => (
                    <tr key={item.key}>
                      <td data-label="Title"><span className="expenses-cell-value">{item.title}</span></td>
                      <td data-label="Entries"><span className="expenses-cell-value">{item.entryCount}</span></td>
                      <td data-label="Quantity"><span className="expenses-cell-value">{item.totalQuantity}</span></td>
                      <td data-label="Category"><span className="expenses-cell-value">{item.category}</span></td>
                      <td data-label="Total"><span className="expenses-cell-value">{formatCurrency(item.totalAmount)}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="expenses-empty">
                      No grouped totals yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="expenses-card">
        <div className="expenses-card-header">
          <h2>All Expense Entries</h2>
          <span>{loading ? "Loading..." : `${expenses.length} entries`}</span>
        </div>

        <div className="expenses-table-wrap expenses-table-wrap--entries expenses-desktop-only">
          <table className="expenses-table expenses-table--entries">
            <thead>
              <tr>
                <th>Title</th>
                <th>Unit Amount</th>
                <th>Quantity</th>
                <th>Line Total</th>
                <th>Category</th>
                <th>Date</th>
                <th>Added By</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && expenses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="expenses-empty">
                    No expenses found.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td data-label="Title">
                      {editExpenseId === expense._id ? (
                        <input
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        />
                      ) : (
                        <span className="expenses-cell-value">{expense.title}</span>
                      )}
                    </td>
                    <td data-label="Amount">
                      {editExpenseId === expense._id ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        />
                      ) : (
                        <span className="expenses-cell-value">{formatCurrency(expense.amount)}</span>
                      )}
                    </td>
                    <td data-label="Quantity">
                      {editExpenseId === expense._id ? (
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                        />
                      ) : (
                        <span className="expenses-cell-value">{expense.quantity || 1}</span>
                      )}
                    </td>
                    <td data-label="Line Total"><span className="expenses-cell-value">{formatCurrency(getLineTotal(expense))}</span></td>
                    <td data-label="Category">
                      {editExpenseId === expense._id ? (
                        <select
                          value={editForm.category}
                          onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        >
                          <option>Travel</option>
                          <option>Food</option>
                          <option>Salary</option>
                          <option>Office</option>
                          <option>Misc</option>
                        </select>
                      ) : (
                        <span className="expenses-cell-value">{expense.category}</span>
                      )}
                    </td>
                    <td data-label="Date">
                      {editExpenseId === expense._id ? (
                        <input
                          type="date"
                          value={editForm.date?.substring(0, 10) || ""}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        />
                      ) : (
                        <span className="expenses-cell-value">{new Date(expense.date).toLocaleDateString()}</span>
                      )}
                    </td>
                    <td data-label="Added By"><span className="expenses-cell-value">{formatAdminDisplay(expense.createdBy?.name || "Unknown")}</span></td>
                    <td data-label="Notes">
                      {editExpenseId === expense._id ? (
                        <textarea
                          rows="2"
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        />
                      ) : (
                        <span className="expenses-cell-value">{expense.notes || "-"}</span>
                      )}
                    </td>
                    <td data-label="Actions" className="expenses-actions">
                      {editExpenseId === expense._id ? (
                        <>
                          <button className="btn-save" onClick={() => handleUpdateExpense(expense._id)}>
                            Save
                          </button>
                          <button className="btn-cancel" onClick={() => setEditExpenseId(null)}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-edit"
                            onClick={() => {
                              setEditExpenseId(expense._id);
                              setEditForm({
                                title: expense.title,
                                amount: expense.amount,
                                quantity: expense.quantity || 1,
                                category: expense.category,
                                date: expense.date,
                                notes: expense.notes || "",
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button className="btn-delete" onClick={() => handleDeleteExpense(expense._id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="expenses-mobile-list expenses-mobile-only">
          {!loading && expenses.length === 0 ? (
            <div className="expenses-mobile-empty">No expenses found.</div>
          ) : (
            expenses.map((expense) => (
              <article key={expense._id} className="expenses-mobile-card">
                <div className="expenses-mobile-row">
                  <span className="expenses-mobile-label">Title</span>
                  <div className="expenses-mobile-value">
                    {editExpenseId === expense._id ? (
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    ) : (
                      expense.title
                    )}
                  </div>
                </div>

                <div className="expenses-mobile-row">
                  <span className="expenses-mobile-label">Unit Amount</span>
                  <div className="expenses-mobile-value">
                    {editExpenseId === expense._id ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      />
                    ) : (
                      formatCurrency(expense.amount)
                    )}
                  </div>
                </div>

                <div className="expenses-mobile-row">
                  <span className="expenses-mobile-label">Quantity</span>
                  <div className="expenses-mobile-value">
                    {editExpenseId === expense._id ? (
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                      />
                    ) : (
                      expense.quantity || 1
                    )}
                  </div>
                </div>

                <div className="expenses-mobile-row">
                  <span className="expenses-mobile-label">Line Total</span>
                  <div className="expenses-mobile-value">{formatCurrency(getLineTotal(expense))}</div>
                </div>

                <div className="expenses-mobile-row">
                  <span className="expenses-mobile-label">Category</span>
                  <div className="expenses-mobile-value">
                    {editExpenseId === expense._id ? (
                      <select
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      >
                        <option>Travel</option>
                        <option>Food</option>
                        <option>Salary</option>
                        <option>Office</option>
                        <option>Misc</option>
                      </select>
                    ) : (
                      expense.category
                    )}
                  </div>
                </div>

                <div className="expenses-mobile-row">
                  <span className="expenses-mobile-label">Date</span>
                  <div className="expenses-mobile-value">
                    {editExpenseId === expense._id ? (
                      <input
                        type="date"
                        value={editForm.date?.substring(0, 10) || ""}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      />
                    ) : (
                      new Date(expense.date).toLocaleDateString()
                    )}
                  </div>
                </div>

                <div className="expenses-mobile-row">
                  <span className="expenses-mobile-label">Added By</span>
                  <div className="expenses-mobile-value">{formatAdminDisplay(expense.createdBy?.name || "Unknown")}</div>
                </div>

                <div className="expenses-mobile-row">
                  <span className="expenses-mobile-label">Notes</span>
                  <div className="expenses-mobile-value">
                    {editExpenseId === expense._id ? (
                      <textarea
                        rows="2"
                        value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      />
                    ) : (
                      expense.notes || "-"
                    )}
                  </div>
                </div>

                <div className="expenses-mobile-row expenses-mobile-row--actions">
                  <span className="expenses-mobile-label">Actions</span>
                  <div className="expenses-actions expenses-mobile-actions">
                    {editExpenseId === expense._id ? (
                      <>
                        <button className="btn-save" onClick={() => handleUpdateExpense(expense._id)}>
                          Save
                        </button>
                        <button className="btn-cancel" onClick={() => setEditExpenseId(null)}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn-edit"
                          onClick={() => {
                            setEditExpenseId(expense._id);
                            setEditForm({
                              title: expense.title,
                              amount: expense.amount,
                              quantity: expense.quantity || 1,
                              category: expense.category,
                              date: expense.date,
                              notes: expense.notes || "",
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button className="btn-delete" onClick={() => handleDeleteExpense(expense._id)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default ExpensesPage;
