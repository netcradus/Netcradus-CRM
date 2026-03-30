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

  const EXPENSE_API = "http://localhost:5000/api/expenses";

const [expenses, setExpenses] = useState([]);
const [showExpenseModal, setShowExpenseModal] = useState(false);

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
  setShowExpenseModal(false);

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
        {/* ===== EXPENSE MANAGEMENT ===== */}
<section className="admin-card">
  <h3>Expense Management</h3>

  <button
    className="admin-form button"
    style={{ marginBottom: "15px" }}
    onClick={() => setShowExpenseModal(true)}
  >
    + Add Expense
  </button>

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
        {expenses.length > 0 ? (
          expenses.map((e) => (
            <tr key={e._id}>
              <td data-label="Title">{e.title}</td>

              <td data-label="Amount">₹ {e.amount}</td>

              <td data-label="Category">{e.category}</td>

              <td data-label="Date">
                {e.date
                  ? new Date(e.date).toLocaleDateString()
                  : "-"}
              </td>

              <td data-label="Actions">
                <button
                  className="btn-delete"
                  onClick={() => handleDeleteExpense(e._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="5" className="admin-muted">
              No expenses found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</section>

{/* ===== EXPENSE MODAL ===== */}
{showExpenseModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <div className="modal-header">
        <h4>Add Expense</h4>
      </div>

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

        <div className="modal-footer">
          <button type="submit" className="btn-save">
            Save
          </button>

          <button
            type="button"
            className="btn-cancel"
            onClick={() => setShowExpenseModal(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default UserManagement;