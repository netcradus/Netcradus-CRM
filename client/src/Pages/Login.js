import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { apiUrl } from "../config/api";
import "./Login.css";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [securityAction, setSecurityAction] = useState(null);
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [deviceId, setDeviceId] = useState(null);
  const [greeting, setGreeting] = useState("");
  const navigate = useNavigate();

  const acisLink =
    process.env.REACT_APP_ACIS_LINK || "https://acis.netcradus.com/";

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6 || hour >= 19) setGreeting("Good night");
    else if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    let timer;

    if (securityAction && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((previous) => previous - 1), 1000);
    } else if (timeLeft === 0 && securityAction) {
      setError("OTP expired. Please log in again.");
      setSecurityAction(null);
    }

    return () => clearInterval(timer);
  }, [securityAction, timeLeft]);

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const fingerprintData = {
        platform: navigator.platform,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };

      const response = await axios.post(apiUrl("/api/auth/login"), {
        ...form,
        fingerprintData,
      });

      const { token, user, passwordExpiryWarning } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.id);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userName", user.name);

      if (passwordExpiryWarning) {
        localStorage.setItem("passwordExpiryWarning", "true");
      } else {
        localStorage.removeItem("passwordExpiryWarning");
      }

      navigate("/welcome");
    } catch (err) {
      const data = err.response?.data;

      if (err.response?.status === 403 && data?.action) {
        if (data.action === "DEVICE_LIMIT_REACHED") {
          setError(data.message);
          setSecurityAction(null);
        } else {
          setSecurityAction(data.action);
          setUserId(data.userId);
          if (data.deviceId) setDeviceId(data.deviceId);
          setTimeLeft(data.action === "REQUIRE_ADMIN_DEVICE_VERIFICATION" ? 300 : 600);
        }
      } else if (data?.action === "SHOW_FORGOT_PASSWORD_LINK") {
        setError(
          <span>
            {data.message}{" "}
            <button
              type="button"
              className="lp-inline-btn"
              onClick={handleRequestForgotPassword}
            >
              Reset password?
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
      const response = await axios.post(apiUrl("/api/auth/password/forgot-request"), {
        email: form.email,
      });

      setSecurityAction("FORGOT_PASSWORD");
      setUserId(response.data.userId);
      setTimeLeft(600);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request reset.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (
      (securityAction === "FORCE_PASSWORD_CHANGE" ||
        securityAction === "FORGOT_PASSWORD") &&
      newPassword !== confirmPassword
    ) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
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

      const response = await axios.post(apiUrl(endpoint), payload);

      if (securityAction === "FORGOT_PASSWORD") {
        setSecurityAction(null);
        setError("Password reset! Please login.");
      } else {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", response.data.user.id);
        localStorage.setItem("userRole", response.data.user.role);
        localStorage.setItem("userName", response.data.user.name);
        setSecurityAction(null);
        navigate("/welcome");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const timerDisplay = `${Math.floor(timeLeft / 60)}:${(timeLeft % 60)
    .toString()
    .padStart(2, "0")}`;

  const securityMeta = {
    FORCE_PASSWORD_CHANGE: {
      title: "Update Password",
      sub: "Your password expired. Verify the OTP and create a new password.",
      icon: <KeyRound size={22} />,
      showPw: true,
    },
    FORGOT_PASSWORD: {
      title: "Reset Password",
      sub: "Enter the OTP sent to your email to reset your password.",
      icon: <Mail size={22} />,
      showPw: true,
    },
    REQUIRE_ADMIN_DEVICE_VERIFICATION: {
      title: "Device Verification",
      sub: "A new device was detected. Enter the OTP sent to the admin email.",
      icon: <ShieldCheck size={22} />,
      showPw: false,
    },
    REQUIRE_SECURITY_OTP: {
      title: "Security Check",
      sub: "Enter the OTP shared for your weekly verification check.",
      icon: <ShieldCheck size={22} />,
      showPw: false,
    },
    default: {
      title: "Identity Verification",
      sub: "Please enter the OTP to continue.",
      icon: <ShieldCheck size={22} />,
      showPw: false,
    },
  };

  const meta = securityMeta[securityAction] || securityMeta.default;

  return (
    <div className="lp-root">
      <div className="lp-bg">
        <div className="lp-bg-grid" />
        <div className="lp-bg-rings" />
        <div className="lp-bg-dots" />
        <div className="lp-bg-glow lp-bg-glow-a" />
        <div className="lp-bg-glow lp-bg-glow-b" />
      </div>

      <div className="lp-shell">
        <section className="lp-brand-panel">
          <div>
            <div className="lp-brand-top">
              <div className="lp-logo-row">
                <img src="/sidebar-logo.jpeg" alt="Netcradus" className="lp-logo-img" />
                <img src="/netcradus.png" alt="Netcradus" className="lp-logo-text" />
              </div>
              <div className="lp-secure-mark">
                <ShieldCheck size={14} />
                <span>CRM Workspace</span>
              </div>
            </div>

            <div className="lp-brand-copy">
              <div className="lp-kicker">{greeting}</div>
              <h1 className="lp-display-title">
                Manage teams.
                <br />
                <span>Close deals faster.</span>
              </h1>
              <p className="lp-display-text">
                Netcradus CRM brings leads, attendance, follow-ups, and team visibility into
                one focused workspace for everyday operations.
              </p>
            </div>

            <div className="lp-brand-orbit">
              <div className="lp-orbit-grid" />
              <div className="lp-orbit-core">
                <div className="lp-orbit-ring lp-orbit-ring-a" />
                <div className="lp-orbit-ring lp-orbit-ring-b" />
                <div className="lp-orbit-badge">
                  <Sparkles size={34} />
                </div>
                <div className="lp-orbit-node lp-orbit-node-a">Leads</div>
                <div className="lp-orbit-node lp-orbit-node-b">Attendance</div>
                <div className="lp-orbit-node lp-orbit-node-c">Tasks</div>
              </div>
              <button
                type="button"
                className="lp-explore-btn"
                onClick={() => window.open(acisLink, "_blank", "noopener,noreferrer")}
              >
                Explore ACIS Platform
              </button>
            </div>
          </div>
        </section>

        <section className="lp-auth-panel">
          <div className="lp-card">
            <div className="lp-card-shine" />
            <div className="lp-card-glow" />

            <div className="lp-card-top">
              <div>
                <div className="lp-kicker">Secure access</div>
                <h2 className="lp-title">
                  {securityAction ? meta.title : "Welcome Back"}
                </h2>
                <p className="lp-tagline">
                  {securityAction
                    ? meta.sub
                    : "Sign in to continue into your Netcradus CRM workspace."}
                </p>
              </div>
              <div className="lp-secure-pill">
                <ShieldCheck size={14} />
                <span>Protected Login</span>
              </div>
            </div>

            {!securityAction ? (
              <form onSubmit={handleLogin} className="lp-form">
                {error && <div className="lp-error">{error}</div>}

                <div className="lp-field">
                  <label className="lp-label">Email Address</label>
                  <div className="lp-input-wrap">
                    <Mail size={16} className="lp-icon" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="lp-input"
                    />
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label">Password</label>
                  <div className="lp-input-wrap">
                    <Lock size={16} className="lp-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      className="lp-input lp-input-pr"
                    />
                    <button
                      type="button"
                      className="lp-eye"
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="lp-form-meta">
                  <div className="lp-badge">
                    <span className="lp-badge-dot" />
                    <span>OTP and device checks enabled</span>
                  </div>
                  <button
                    type="button"
                    className="lp-forgot lp-inline-btn"
                    onClick={handleRequestForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button type="submit" disabled={loading} className="lp-btn">
                  {loading && <span className="lp-spinner" />}
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            ) : (
              <div className="lp-security">
                <div className="lp-sec-icon-wrap">{meta.icon}</div>

                <form onSubmit={handleVerifyOTP} className="lp-form">
                  {error && <div className="lp-error">{error}</div>}

                  <div className="lp-field">
                    <label className="lp-label">OTP Code</label>
                    <div className="lp-input-wrap">
                      <ShieldCheck size={16} className="lp-icon" />
                      <input
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        required
                        maxLength="6"
                        className="lp-input"
                      />
                    </div>
                    <div className="lp-timer">Expires in: {timerDisplay}</div>
                  </div>

                  {meta.showPw && (
                    <>
                      <div className="lp-field">
                        <label className="lp-label">New Password</label>
                        <div className="lp-input-wrap">
                          <Lock size={16} className="lp-icon" />
                          <input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Create new password"
                            value={newPassword}
                            onChange={(event) => setNewPassword(event.target.value)}
                            required
                            className="lp-input lp-input-pr"
                          />
                          <button
                            type="button"
                            className="lp-eye"
                            onClick={() => setShowNewPassword((current) => !current)}
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="lp-field">
                        <label className="lp-label">Confirm Password</label>
                        <div className="lp-input-wrap">
                          <Lock size={16} className="lp-icon" />
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                            className="lp-input lp-input-pr"
                          />
                          <button
                            type="button"
                            className="lp-eye"
                            onClick={() => setShowConfirmPassword((current) => !current)}
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  <button type="submit" disabled={loading} className="lp-btn">
                    {loading && <span className="lp-spinner" />}
                    {loading ? "Verifying..." : "Confirm & Continue"}
                  </button>

                  <button
                    type="button"
                    className="lp-back"
                    onClick={() => setSecurityAction(null)}
                  >
                    <ArrowLeft size={14} /> Back to Login
                  </button>
                </form>
              </div>
            )}

            <p className="lp-copy">© 2026 Netcradus. All rights reserved.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
