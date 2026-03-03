import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import { apiUrl } from "../config/api";
import "./Login.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Security Policy States
  const [securityAction, setSecurityAction] = useState(null);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [timeLeft, setTimeLeft] = useState(300);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (securityAction && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && securityAction) {
      setError("OTP expired. Please log in again.");
      setSecurityAction(null);
    }
    return () => clearInterval(timer);
  }, [securityAction, timeLeft]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(apiUrl("/api/auth/login"), form);
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      navigate("/welcome");
    } catch (err) {
      if (err.response?.status === 403 && err.response.data.action) {
        setSecurityAction(err.response.data.action);
        setUserId(err.response.data.userId);
        setTimeLeft(300);
      } else {
        setError(err.response?.data?.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      {/* Cosmic Background Layer */}
      <div className="background-glow" />
      
      {/* Right-side Dashboard Illustration */}
      <div className="illustration-container">
        <img 
          src="/heroimg2.png" 
          alt="Dashboard Preview" 
          className="hero-image" 
        />
      </div>

      <div className="content-wrapper">
        {/* Header Section */}
        <div className="header-section">
          <div className="logo-row">
            <img src="/sidebar-logo.jpeg" alt="Netcradus" className="logoimg" />
            <img src="/netcradus.png" alt="Netcradus Text" className="logo-text" /> 
          </div>
          <h1 className="main-heading">
            Welcome to <br />
            <span className="gradient-heading">Netcradus CRM!</span>
          </h1>
          <p className="sub-heading">Please log in to access your CRM dashboard.</p>
        </div>

        {/* The "Glass" Login Card */}
        <div className="login-card">
          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-box">
                <FaEnvelope className="field-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="field-input"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-box">
                <FaLock className="field-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="field-input"
                />
                <div 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="eye-toggle"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              <div 
                className="forgot-link" 
                onClick={() => navigate("/forgot-password")}
              >
                Forgot Password?
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="submit-btn"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>
        </div>

        <div className="copyright">
          © 2024 Netcradus. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default Login;