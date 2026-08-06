import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Lock, Eye, EyeOff, ShieldAlert, Check } from "lucide-react";
import { apiUrl } from "../config/api";
import "./Login.css"; // Reuse the premium login portal styling

function ChangePasswordPage() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const { currentPassword, newPassword, confirmPassword } = form;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password.");
      setLoading(false);
      return;
    }

    // Password strength check
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (newPassword.length < 8 || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setError("Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(apiUrl("/api/auth/change-password"), form, { headers });

      if (response.data && response.data.success) {
        setSuccess("Password changed successfully! Redirecting...");
        
        // Save new JWT and session state
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("userRole", response.data.user.role);
        localStorage.setItem("userName", response.data.user.name);
        localStorage.setItem("userEmail", response.data.user.email);
        localStorage.setItem("skipOnboarding", response.data.user.skipOnboarding ? "true" : "false");
        localStorage.setItem("passwordChangeRequired", "false");

        setTimeout(() => {
          navigate("/welcome");
        }, 1500);
      }
    } catch (err) {
      console.error("Password update failed:", err);
      setError(err.response?.data?.message || "Failed to change password. Please verify current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      {/* Background decorations matching the main portal */}
      <div className="lp-bg">
        <div className="lp-bg-grid" />
        <div className="lp-bg-glow" style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(232, 66, 10, 0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none"
        }} />
      </div>

      <div className="lp-card-wrapper" style={{ width: "100%", maxWidth: "450px", padding: "20px", zIndex: 10 }}>
        <div className="lp-card" style={{ padding: "40px" }}>
          
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 className="lp-title" style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-0.5px" }}>
              Secure Password Change
            </h1>
            <p className="lp-tagline" style={{ marginTop: "8px", fontSize: "14px" }}>
              Update your password to secure your Netcradus CRM account.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Current Password */}
            <div className="lp-field-container">
              <label className="lp-label">Current Password</label>
              <div className="lp-input-wrapper">
                <Lock className="lp-input-icon" size={16} />
                <input
                  type={showCurrent ? "text" : "password"}
                  name="currentPassword"
                  placeholder="Enter current password"
                  value={form.currentPassword}
                  onChange={handleChange}
                  className="lp-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="lp-eye-btn"
                  tabIndex="-1"
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="lp-field-container">
              <label className="lp-label">New Password</label>
              <div className="lp-input-wrapper">
                <Lock className="lp-input-icon" size={16} />
                <input
                  type={showNew ? "text" : "password"}
                  name="newPassword"
                  placeholder="Enter new password"
                  value={form.newPassword}
                  onChange={handleChange}
                  className="lp-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="lp-eye-btn"
                  tabIndex="-1"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="lp-field-container">
              <label className="lp-label">Confirm New Password</label>
              <div className="lp-input-wrapper">
                <Lock className="lp-input-icon" size={16} />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm new password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="lp-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="lp-eye-btn"
                  tabIndex="-1"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error / Success Notices */}
            {error && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(234, 67, 53, 0.1)",
                border: "1px solid var(--color-error, #ea4335)",
                color: "var(--color-error, #ea4335)",
                fontSize: "13px"
              }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderRadius: "8px",
                backgroundColor: "rgba(52, 168, 83, 0.1)",
                border: "1px solid var(--color-success, #34a853)",
                color: "var(--color-success, #34a853)",
                fontSize: "13px"
              }}>
                <Check size={16} style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}

            {/* Password Policy Guidelines */}
            <div style={{
              fontSize: "11px",
              color: "var(--lp-muted)",
              lineHeight: "1.5",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--lp-border-soft)"
            }}>
              <strong style={{ display: "block", marginBottom: "4px", color: "var(--lp-text)" }}>Password Guidelines:</strong>
              • Minimum 8 characters<br />
              • At least 1 uppercase & 1 lowercase letter<br />
              • At least 1 number & 1 special character
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="lp-submit-btn"
              style={{
                width: "100%",
                height: "46px",
                borderRadius: "23px",
                border: "none",
                background: "linear-gradient(135deg, var(--lp-accent-1) 0%, var(--lp-accent-2) 50%, var(--lp-accent-3) 100%)",
                color: "#fff",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.9"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            {/* Logout Link */}
            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--lp-muted)",
                  fontSize: "13px",
                  fontWeight: "600",
                  textDecoration: "underline",
                  cursor: "pointer"
                }}
              >
                Sign out of CRM
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
