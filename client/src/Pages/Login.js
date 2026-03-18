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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [deviceId, setDeviceId] = useState(null);

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
      // Collect fingerprint data
      const fingerprintData = {
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      };

      const res = await axios.post(apiUrl("/api/auth/login"), { ...form, fingerprintData });
      const { token, user, passwordExpiryWarning } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      if (passwordExpiryWarning) {
        localStorage.setItem("passwordExpiryWarning", "true");
      } else {
        localStorage.removeItem("passwordExpiryWarning");
      }
      navigate("/welcome");
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.action) {
        setSecurityAction(data.action);
        setUserId(data.userId);
        if (data.deviceId) setDeviceId(data.deviceId);

        // Admin device OTP has shorter expiry (5 mins)
        setTimeLeft(data.action === "REQUIRE_ADMIN_DEVICE_VERIFICATION" ? 300 : 600);
      } else if (data?.action === "DEVICE_LIMIT_REACHED") {
        setError(data.message);
      } else if (data?.action === "SHOW_FORGOT_PASSWORD_LINK") {
        setError(
          <span>
            {data.message}{" "}
            <button
              type="button"
              className="inline-link-btn"
              onClick={handleRequestForgotPassword}
            >
              Need to reset your password?
            </button>
          </span>
        );
      } else {
        setError(data?.message || "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestForgotPassword = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(apiUrl("/api/auth/password/forgot-request"), { email: form.email });
      setSecurityAction("FORGOT_PASSWORD");
      setUserId(res.data.userId);
      setTimeLeft(600);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (securityAction === "FORCE_PASSWORD_CHANGE" || securityAction === "FORGOT_PASSWORD") {
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        return;
      }
    }

    try {
      let endpoint = "/api/auth/otp/verify-security";
      const payload = { userId, otp };

      if (securityAction === "FORCE_PASSWORD_CHANGE") {
        endpoint = "/api/auth/otp/verify-password";
        payload.newPassword = newPassword;
      } else if (securityAction === "FORGOT_PASSWORD") {
        endpoint = "/api/auth/password/forgot-reset";
        payload.newPassword = newPassword;
      } else if (securityAction === "REQUIRE_ADMIN_DEVICE_VERIFICATION") {
        endpoint = "/api/auth/otp/verify-admin-device";
        payload.deviceId = deviceId;
      }

      const res = await axios.post(apiUrl(endpoint), payload);

      if (securityAction === "FORGOT_PASSWORD") {
        setSecurityAction(null);
        setError("Password reset successful. Please login with your new password.");
      } else {
        const { token, user } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("userRole", user.role);
        setSecurityAction(null);
        navigate("/welcome");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <button 
        className="explore-acis-btn" 
        onClick={() => window.open(process.env.REACT_APP_EXPLORE_ACIS_LINK, "_blank")}
      >
        Explore ACIS
      </button>
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
          {!securityAction ? (
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

              </div>
 <div className="forgot-link" onClick={handleRequestForgotPassword}>
                  Forgot Password?
                </div>
              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          ) : (
            <div className="security-flow">
              <h2 className="security-title">
                {securityAction === "FORCE_PASSWORD_CHANGE" ? "Update Password" :
                  securityAction === "FORGOT_PASSWORD" ? "Reset Password" :
                    securityAction === "REQUIRE_ADMIN_DEVICE_VERIFICATION" ? "Device Verification" : "Security Verification"}
              </h2>
              <p className="security-subtitle">
                {securityAction === "FORCE_PASSWORD_CHANGE"
                  ? "Your password has expired. Please verify the OTP sent to your IT admin and set a new password."
                  : securityAction === "FORGOT_PASSWORD"
                    ? "Enter the OTP sent to your email to reset your password."
                    : securityAction === "REQUIRE_ADMIN_DEVICE_VERIFICATION"
                      ? "New or untrusted device detected. Please enter the OTP sent to your Admin Email."
                      : "Weekly security check required. Please enter the OTP sent to your IT admin."}
              </p>

              <form onSubmit={handleVerifyOTP} className="login-form">
                {error && <div className="error-message">{error}</div>}

                <div className="input-group">
                  <label className="input-label">OTP Code</label>
                  <div className="input-box">
                    <FaLock className="field-icon" />
                    <input
                      type="text"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      className="field-input"
                      maxLength="6"
                    />
                  </div>
                  <div className="timer-display">
                    Expires in: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                {(securityAction === "FORCE_PASSWORD_CHANGE" || securityAction === "FORGOT_PASSWORD") && (
                  <>
                    <div className="input-group">
                      <label className="input-label">New Password</label>
                      <div className="input-box">
                        <FaLock className="field-icon" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="New Password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="field-input"
                        />
                        <div
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="eye-toggle"
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                      </div>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Confirm New Password</label>
                      <div className="input-box">
                        <FaLock className="field-icon" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="field-input"
                        />
                        <div
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="eye-toggle"
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn"
                >
                  {loading ? "Verifying..." : "Confirm & Continue"}
                </button>

                <div className="cancel-security" onClick={() => setSecurityAction(null)}>
                  Back to Login
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="copyright">
          © 2024 Netcradus. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export default Login;