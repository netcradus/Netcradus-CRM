import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileSetup.css"; // make sure this path is correct

function ProfileSetup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    designation: "",
    department: "",
    photo: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("profileComplete", "true");
    navigate("/dashboard");
  };

  return (
    <div className="profile-container">
      <form className="profile-form" onSubmit={handleSubmit}>
        <h2>Let’s complete your profile 🚀</h2>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Your Name"
            required
          />
        </div>

        <div className="form-group">
          <label>Designation</label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            placeholder="e.g., Software Engineer"
            required
          />
        </div>

        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="e.g., Sales, Support"
            required
          />
        </div>

        <div className="form-group">
          <label>Upload Profile Photo</label>
          <input
            type="file"
            name="photo"
            onChange={handleChange}
            accept="image/*"
          />
        </div>

        <button type="submit">Continue to Dashboard</button>
      </form>
    </div>
  );
}

export default ProfileSetup;
