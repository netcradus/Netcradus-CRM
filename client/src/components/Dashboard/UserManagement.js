import React, { useCallback, useEffect, useState } from "react";
import { FaUsersCog } from "react-icons/fa";
import axios from "axios";
import { apiUrl } from "../../config/api";
import "./UserManagement.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "sales",
  });

  const [pwdUserId, setPwdUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const token = localStorage.getItem("token");

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl("/api/auth/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
     fetchExpenses(); 
  }, [fetchUsers]);

  // Form Change
  const onChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) setError("");
    if (success) setSuccess("");
  };

  // Create User
  const onCreateUser = async (e) => {
    e.preventDefault();

    if (form.role.toLowerCase() === "admin") {
      setError("Creation of additional admin users is forbidden");
      return;
    }

    try {
      const res = await axios.post(
        apiUrl("/api/auth/users"),
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(res.data?.message || "User created successfully");

      // Reset form properly
      setForm({
        email: "",
        password: "",
        role: "sales",
      });

      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    }
  };

  // Delete User
  const onDeleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await axios.delete(apiUrl(`/api/auth/users/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("User deleted successfully");
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed");
    }
  };

  // Change Password
  const onChangePassword = async (id) => {
    if (!newPassword) {
      setError("New password required");
      return;
    }

    try {
      await axios.put(
        apiUrl(`/api/auth/users/${id}/password`),
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Password updated successfully");
      setPwdUserId(null);
      setNewPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    }
  };

  const EXPENSE_API = apiUrl("/api//expenses");

const [expenses, setExpenses] = useState([]);
const [editExpenseId, setEditExpenseId] = useState(null);
const [editForm, setEditForm] = useState({
  title: "",
  amount: "",
  category: "",
  date: "",
});

const [expenseForm, setExpenseForm] = useState({
  title: "",
  amount: "",
  category: "Misc",
  date: "",
});

const fetchExpenses = async () => {
  try {
    const res = await axios.get(EXPENSE_API);
    setExpenses(res.data);
  } catch (err) {
    console.error(err);
  }
};



const handleAddExpense = async (e) => {
  e.preventDefault();

  await axios.post(EXPENSE_API, expenseForm);

  fetchExpenses();

  setExpenseForm({
    title: "",
    amount: "",
    category: "Misc",
    date: "",
  });
};


const handleDeleteExpense = async (id) => {
  if (!window.confirm("Delete this expense?")) return;

  await axios.delete(`${EXPENSE_API}/${id}`);
  fetchExpenses();
};

const handleUpdateExpense = async (id) => {
  await axios.put(`${EXPENSE_API}/${id}`, editForm);

  setEditExpenseId(null);
  fetchExpenses();
};
  return (
    <div className="admin-panel">
      <h2 className="admin-panel-title">
        <FaUsersCog /> Admin User Management
      </h2>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}
      {success && <div className="admin-alert admin-alert-success">{success}</div>}

      <div className="admin-grid">

        {/* CREATE USER SECTION */}
        <section className="admin-card">
          <h3>Create New User</h3>
          <p className="admin-warning-note">
            <strong>Note:</strong> For security, only one primary Admin account is permitted.
          </p>

          <form onSubmit={onCreateUser} className="admin-form">
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="User Email"
              required
            />

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              placeholder="Password"
              required
            />

            <select
              name="role"
              value={form.role}
              onChange={onChange}
            >
              <option value="sales">Sales</option>
              {/* Admin option removed for security - system only supports one admin */}
              <option value="support">Support</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
              <option value="digital_media">Digital Media</option>
            </select>

            <button type="submit">Create User</button>
          </form>
        </section>

        {/* USERS TABLE */}
        <section className="admin-card">
          <h3>All Users</h3>

          {loading ? (
            <p className="admin-muted">Loading users...</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user._id}>
                        <td data-label="User ID">{user.userId || "-"}</td>

                        <td data-label="Email">{user.email}</td>

                        <td data-label="Role">
                          <span className={`role-badge role-${user.role}`}>
                            {user.role}
                          </span>
                        </td>

                        <td data-label="Created">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "-"}
                        </td>

                        <td data-label="Actions">
                          {user.role !== "admin" && (
                            <button
                              className="btn-delete"
                              onClick={() => onDeleteUser(user._id)}
                            >
                              Delete
                            </button>
                          )}

                          {pwdUserId === user._id ? (
                            <>
                              <input
                                type="password"
                                placeholder="New password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                              />

                              <button
                                className="btn-save"
                                onClick={() => onChangePassword(user._id)}
                              >
                                Save
                              </button>

                              <button
                                className="btn-cancel"
                                onClick={() => {
                                  setPwdUserId(null);
                                  setNewPassword("");
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              className="btn-edit"
                              onClick={() => setPwdUserId(user._id)}
                            >
                              Change Password
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="admin-muted">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>

              </table>
            </div>
          )}

          
        </section>

        {/* ===== CREATE EXPENSE ===== */}
<section className="admin-card">
  <h3>Create Expense</h3>

  <form onSubmit={handleAddExpense} className="admin-form">
    <input
      placeholder="Title"
      value={expenseForm.title}
      onChange={(e) =>
        setExpenseForm({ ...expenseForm, title: e.target.value })
      }
      required
    />

    <input
      type="number"
      placeholder="Amount"
      value={expenseForm.amount}
      onChange={(e) =>
        setExpenseForm({ ...expenseForm, amount: e.target.value })
      }
      required
    />

    <select
      value={expenseForm.category}
      onChange={(e) =>
        setExpenseForm({ ...expenseForm, category: e.target.value })
      }
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
      onChange={(e) =>
        setExpenseForm({ ...expenseForm, date: e.target.value })
      }
      required
    />

    <button type="submit">Add Expense</button>
  </form>
</section>
{/* ===== ALL EXPENSES ===== */}
<section className="admin-card">
  <h3>All Expenses</h3>

  <div className="admin-table-wrap">
    <table className="admin-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Amount</th>
          <th>Category</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>

     <tbody>
  {expenses.map((e) => (
    <tr key={e._id}>
      {/* TITLE */}
      <td data-label="Title">
        {editExpenseId === e._id ? (
          <input
            value={editForm.title}
            onChange={(ev) =>
              setEditForm({ ...editForm, title: ev.target.value })
            }
          />
        ) : (
          e.title
        )}
      </td>

      {/* AMOUNT */}
      <td data-label="Amount">
        {editExpenseId === e._id ? (
          <input
            type="number"
            value={editForm.amount}
            onChange={(ev) =>
              setEditForm({ ...editForm, amount: ev.target.value })
            }
          />
        ) : (
          `₹ ${e.amount}`
        )}
      </td>

      {/* CATEGORY */}
      <td data-label="Category">
        {editExpenseId === e._id ? (
          <select
            value={editForm.category}
            onChange={(ev) =>
              setEditForm({ ...editForm, category: ev.target.value })
            }
          >
            <option>Travel</option>
            <option>Food</option>
            <option>Salary</option>
            <option>Office</option>
            <option>Misc</option>
          </select>
        ) : (
          e.category
        )}
      </td>

      {/* DATE */}
      <td data-label="Date">
        {editExpenseId === e._id ? (
          <input
            type="date"
            value={editForm.date?.substring(0, 10)}
            onChange={(ev) =>
              setEditForm({ ...editForm, date: ev.target.value })
            }
          />
        ) : (
          new Date(e.date).toLocaleDateString()
        )}
      </td>

      {/* ACTIONS */}
      <td data-label="Actions">
        {editExpenseId === e._id ? (
          <>
            <button
              className="btn-save"
              onClick={() => handleUpdateExpense(e._id)}
            >
              Save
            </button>

            <button
              className="btn-cancel"
              onClick={() => setEditExpenseId(null)}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-edit"
              onClick={() => {
                setEditExpenseId(e._id);
                setEditForm({
                  title: e.title,
                  amount: e.amount,
                  category: e.category,
                  date: e.date,
                });
              }}
            >
              Edit
            </button>

            <button
              className="btn-delete"
              onClick={() => handleDeleteExpense(e._id)}
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  ))}
</tbody>
    </table>
  </div>
</section>
      </div>
    </div>
  );
};

export default UserManagement;