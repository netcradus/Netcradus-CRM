import React, { useState } from "react";
import "./Tasks.css";

function Tasks() {
  const [tasks, setTasks] = useState([
    { id: 1, name: "Follow-up Call", assignedTo: "John", status: "Pending", dueDate: "2025-08-01" },
    { id: 2, name: "Demo Meeting", assignedTo: "Sourabh", status: "Completed", dueDate: "2025-07-28" },
    { id: 3, name: "Product Demo", assignedTo: "Diya", status: "In Progress", dueDate: "2025-07-28" },
  ]);

  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTask, setNewTask] = useState({
    name: "",
    assignedTo: "",
    status: "Pending",
    dueDate: "",
  });

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (filter === "All") return true;
    return task.status === filter;
  });

  // Delete task
  const deleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // Handle input change
  const handleChange = (e) => {
    setNewTask({ ...newTask, [e.target.name]: e.target.value });
  };

  // Save or Update task
  const saveTask = () => {
    if (!newTask.name || !newTask.assignedTo || !newTask.dueDate) {
      alert("Please fill all required fields!");
      return;
    }

    if (editingTaskId) {
      // update existing task
      setTasks(
        tasks.map((task) =>
          task.id === editingTaskId ? { ...newTask, id: editingTaskId } : task
        )
      );
    } else {
      // add new task
      setTasks([...tasks, { ...newTask, id: Date.now() }]);
    }

    setNewTask({ name: "", assignedTo: "", status: "Pending", dueDate: "" });
    setEditingTaskId(null);
    setShowForm(false);
  };

  // Edit Task
  const editTask = (task) => {
    setNewTask(task);
    setEditingTaskId(task.id);
    setShowForm(true);
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["Task Name,Assigned To,Status,Due Date"];
    const rows = tasks.map(
      (task) => `${task.name},${task.assignedTo},${task.status},${task.dueDate}`
    );
    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.csv";
    a.click();
  };

  return (
    <div className="tasks-container">
      <h2 className="tasks-heading">Tasks</h2>

      {/* Actions Section */}
      <div className="tasks-actions">
        <button className="btn-primary" onClick={() => setShowForm(true)}>
          + Create Task
        </button>
        <input className="search-bar" type="text" placeholder="🔍 Search Tasks" />
        <button className="btn-secondary" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="task-filters">
        {["All", "Pending", "In Progress", "Completed"].map((status) => (
          <div
            key={status}
            className={`filter ${filter === status ? "active" : ""}`}
            onClick={() => setFilter(status)}
          >
            {status}
          </div>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="tasks-table">
        <table>
          <thead>
            <tr>
              <th>Task Name</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.name}</td>
                  <td>{task.assignedTo}</td>
                  <td>
                    <span className={`badge ${task.status.toLowerCase().replace(" ", "-")}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>{task.dueDate}</td>
                  <td>
                    <button className="btn-edit" onClick={() => editTask(task)}>✏ Edit</button>
                    <button className="btn-delete" onClick={() => deleteTask(task.id)}>🗑 Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: "center" }}>
                  No tasks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create/Edit Task */}
      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingTaskId ? "Edit Task" : "Create New Task"}</h3>
            <input
              type="text"
              name="name"
              placeholder="Task Name"
              value={newTask.name}
              onChange={handleChange}
            />
            <input
              type="text"
              name="assignedTo"
              placeholder="Assigned To"
              value={newTask.assignedTo}
              onChange={handleChange}
            />
            <select name="status" value={newTask.status} onChange={handleChange}>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <input
              type="date"
              name="dueDate"
              value={newTask.dueDate}
              onChange={handleChange}
            />
            <div className="modal-actions">
              <button className="btn-primary" onClick={saveTask}>
                {editingTaskId ? "Update" : "Save"}
              </button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
