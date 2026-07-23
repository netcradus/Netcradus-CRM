import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, Sparkles } from "lucide-react";
import { apiUrl } from "../config/api";
import "./Login.css";

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(apiUrl(`/api/auth/reset-password/${token}`), { password });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      <div className="lp-bg">
        <div className="lp-bg-grid" />
        <div className="lp-bg-glow" />
      </div>

      <div className="lp-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="lp-card" style={{ maxWidth: '480px', minHeight: 'auto' }}>
          <div className="lp-card-shine" />
          
          <div className="lp-card-top">
            <div className="lp-badge">
              <div className="lp-badge-dot" />
              <span>Security Action</span>
            </div>
          </div>

          <div className="lp-brand-copy" style={{ marginBottom: 'var(--space-8)' }}>
            <h1 className="lp-title">Set New Password</h1>
            <p className="lp-tagline">Create a strong, unique password for your account security.</p>
          </div>

          <form onSubmit={handleReset} className="lp-form">
            <div className="lp-field">
              <label className="lp-label">New Password</label>
              <div className="lp-input-wrap">
                <Lock className="lp-icon" size={18} />
                <input
                  className="lp-input lp-input-pr"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label">Confirm Password</label>
              <div className="lp-input-wrap">
                <Lock className="lp-icon" size={18} />
                <input
                  className="lp-input"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <div className="lp-error">{error}</div>}
            {message && (
              <div className="lp-error" style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#bbf7d0' }}>
                {message}
                <div style={{ marginTop: 'var(--space-2)' }}>
                  <Link to="/login" style={{ color: 'white', fontWeight: 'bold', textDecoration: 'underline' }}>Login Now</Link>
                </div>
              </div>
            )}

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? <div className="lp-spinner" /> : (
                <>
                  <Sparkles size={18} />
                  <span>Update Password</span>
                </>
              )}
            </button>

            {!message && (
              <Link to="/login" className="lp-back">
                <ArrowLeft size={16} />
                <span>Cancel & Return</span>
              </Link>
            )}
          </form>

          <div className="lp-copy">
            <div className="lp-secure-pill" style={{ display: 'inline-flex', marginTop: 'var(--space-6)' }}>
              <ShieldCheck size={14} />
              <span>Secure password encryption active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
