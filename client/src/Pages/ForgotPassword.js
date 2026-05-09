import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { apiUrl } from "../config/api";
import "./Login.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(apiUrl("/api/auth/forgot-password"), { email });
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
              <span>Password Recovery</span>
            </div>
          </div>

          <div className="lp-brand-copy" style={{ marginBottom: 'var(--space-8)' }}>
            <h1 className="lp-title">Reset Access</h1>
            <p className="lp-tagline">Enter your email to receive a secure password reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="lp-form">
            <div className="lp-field">
              <label className="lp-label">Email Address</label>
              <div className="lp-input-wrap">
                <Mail className="lp-icon" size={18} />
                <input
                  className="lp-input"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <div className="lp-error">{error}</div>}
            {message && <div className="lp-error" style={{ background: 'rgba(34, 197, 94, 0.2)', borderColor: 'rgba(34, 197, 94, 0.4)', color: '#bbf7d0' }}>{message}</div>}

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? <div className="lp-spinner" /> : (
                <>
                  <Sparkles size={18} />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>

            <Link to="/login" className="lp-back">
              <ArrowLeft size={16} />
              <span>Back to Login</span>
            </Link>
          </form>

          <div className="lp-copy">
            <div className="lp-secure-pill" style={{ display: 'inline-flex', marginTop: 'var(--space-6)' }}>
              <ShieldCheck size={14} />
              <span>Secure encrypted recovery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
