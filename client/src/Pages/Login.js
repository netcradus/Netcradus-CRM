// import React, { useState } from "react";
// import axios from "axios";

// function Login() {
//   const [form, setForm] = useState({ email: "", password: "" });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/login", form);
//       alert("Login successful!");
//       localStorage.setItem("token", res.data.token);
//       console.log("User:", res.data.user);
//     } catch (err) {
//       alert(err.response?.data?.message || "Login failed");
//     }
//   };

//   return (
//     <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#0f0f0f" }}>
//       <form onSubmit={handleLogin} style={{ background: "#141414", padding: "40px", borderRadius: "10px", textAlign: "center", width: "320px" }}>
//         {/* ✅ LOGO IMAGE HERE */}
//         <img src="/logo.png" alt="Netcradus Logo" style={{ height: "80px", marginBottom: "20px" }} />

//         <h2 style={{ color: "#ff5e00", marginBottom: "20px" }}>Login</h2>

//         <input
//           type="email"
//           name="email"
//           placeholder="Email"
//           onChange={handleChange}
//           required
//           style={{
//             width: "100%",
//             padding: "10px",
//             marginBottom: "15px",
//             background: "#222",
//             color: "#fff",
//             border: "1px solid #444",
//             borderRadius: "6px",
//           }}
//         />

//         <input
//           type="password"
//           name="password"
//           placeholder="Password"
//           onChange={handleChange}
//           required
//           style={{
//             width: "100%",
//             padding: "10px",
//             marginBottom: "15px",
//             background: "#222",
//             color: "#fff",
//             border: "1px solid #444",
//             borderRadius: "6px",
//           }}
//         />

//         <button
//           type="submit"
//           style={{
//             width: "100%",
//             padding: "12px",
//             background: "linear-gradient(to right, #ff6a00, #ff007a)",
//             border: "none",
//             color: "#fff",
//             fontWeight: "bold",
//             borderRadius: "6px",
//             cursor: "pointer",
//           }}
//         >
//           Log in
//         </button>
//       </form>
//     </div>
//   );
// }

// export default Login;





//purchase the url 
//security check first concern 
//sem tool  medical education 


// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// function Login() {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/login", form);
//       alert("Login successful!");
//       localStorage.setItem("token", res.data.token);
//       navigate("/dashboard");
//     } catch (err) {
//       alert(err.response?.data?.message || "Login failed");
//     }
//   };

//   return (
//     <div
//       style={{
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         height: "100vh",
//         background: "#0f0f0f",
//       }}
//     >
//       <form
//         onSubmit={handleLogin}
//         style={{
//           background: "#141414",
//           padding: "40px",
//           borderRadius: "10px",
//           textAlign: "center",
//           width: "320px",
//         }}
//       >
//         <img src="/logo.png" alt="Netcradus Logo" style={{ height: "80px", marginBottom: "20px" }} />

//         <h2 style={{ color: "#ff5e00", marginBottom: "20px" }}>Login</h2>

//         <input
//           type="email"
//           name="email"
//           placeholder="Email"
//           onChange={handleChange}
//           required
//           style={{
//             width: "100%",
//             padding: "10px",
//             marginBottom: "15px",
//             background: "#222",
//             color: "#fff",
//             border: "1px solid #444",
//             borderRadius: "6px",
//           }}
//         />

//         <input
//           type="password"
//           name="password"
//           placeholder="Password"
//           onChange={handleChange}
//           required
//           style={{
//             width: "100%",
//             padding: "10px",
//             marginBottom: "15px",
//             background: "#222",
//             color: "#fff",
//             border: "1px solid #444",
//             borderRadius: "6px",
//           }}
//         />

//         <button
//           type="submit"
//           style={{
//             width: "100%",
//             padding: "12px",
//             background: "linear-gradient(to right, #ff6a00, #ff007a)",
//             border: "none",
//             color: "#fff",
//             fontWeight: "bold",
//             borderRadius: "6px",
//             cursor: "pointer",
//           }}
//         >
//           Log in
//         </button>
//       </form>
//     </div>
//   );
// }

// export default Login;



// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// function Login() {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/login", form);
//       const { token, user } = res.data;
//           console.log("User object from backend:", user); // 👈 Yahi line add karo
//       // Save to localStorage
//       localStorage.setItem("token", token);
//       localStorage.setItem("userRole", user.role);
//       localStorage.setItem("profileComplete", user.profileComplete ? "true" : "false");

//       alert("Login successful!");

//       if (!user.profileComplete) {
//         navigate("/welcome"); // If profile not complete, redirect to welcome
//       } else {
//         // Redirect based on user role
//         if (user.role === "admin") navigate("/admin-dashboard");
//         else if (user.role === "support") navigate("/support-dashboard");
//         else if (user.role === "sales") navigate("/sales-dashboard");
//         else navigate("/dashboard");
//       }
//     } catch (err) {
//       console.log(err);
//       alert(err.response?.data?.message || "Login failed");
//     }
//   };

//   return (
//     <div style={containerStyle}>
//       <form onSubmit={handleLogin} style={formStyle}>
//         <img src="/logo.png" alt="Netcradus Logo" style={{ height: "80px", marginBottom: "20px" }} />
//         <h2 style={{ color: "#ff5e00", marginBottom: "20px" }}>Login</h2>

//         <input
//           type="email"
//           name="email"
//           placeholder="Email"
//           onChange={handleChange}
//           required
//           style={inputStyle}
//         />
//         <input
//           type="password"
//           name="password"
//           placeholder="Password"
//           onChange={handleChange}
//           required
//           style={inputStyle}
//         />
//         <button type="submit" style={buttonStyle}>
//           Log in
//         </button>

//         <p style={{ marginTop: "15px", color: "#ccc" }}>
//           Don’t have an account?{" "}
//           <span
//             onClick={() => navigate("/register")}
//             style={{ color: "#ff5e00", cursor: "pointer", textDecoration: "underline" }}
//           >
//             Register
//           </span>
//         </p>
//       </form>
//     </div>
//   );
// }

// const containerStyle = {
//   display: "flex",
//   justifyContent: "center",
//   alignItems: "center",
//   height: "100vh",
//   background: "#0f0f0f",
// };

// const formStyle = {
//   background: "#141414",
//   padding: "40px",
//   borderRadius: "10px",
//   textAlign: "center",
//   width: "320px",
// };

// const inputStyle = {
//   width: "100%",
//   padding: "10px",
//   marginBottom: "15px",
//   background: "#222",
//   color: "#fff",
//   border: "1px solid #444",
//   borderRadius: "6px",
// };

// const buttonStyle = {
//   width: "100%",
//   padding: "12px",
//   background: "linear-gradient(to right, #ff6a00, #ff007a)",
//   border: "none",
//   color: "#fff",
//   fontWeight: "bold",
//   borderRadius: "6px",
//   cursor: "pointer",
// };

// export default Login;



import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { apiUrl } from "../config/api";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Security Modal States
  const [securityAction, setSecurityAction] = useState(null); // 'REQUIRE_SECURITY_OTP' or 'FORCE_PASSWORD_CHANGE'
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins in seconds

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (securityAction && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && securityAction) {
      setError("OTP expired. Please log in again to request a new one.");
      setSecurityAction(null);
    }
    return () => clearInterval(timer);
  }, [securityAction, timeLeft]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
    setSuccessMsg("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await axios.post(apiUrl("/api/auth/login"), form);
      const { token, user, passwordExpiryWarning } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userName", user.name);

      if (passwordExpiryWarning) {
        // We could use a toast library here, but for now we'll pass state to dashboard or show briefly
        sessionStorage.setItem("passwordExpiryWarning", "true");
      }

      navigate("/welcome");

    } catch (err) {
      if (err.response && err.response.status === 403 && err.response.data.action) {
        // Blocked by Security Policies
        setSecurityAction(err.response.data.action);
        setUserId(err.response.data.userId);
        setTimeLeft(300); // reset 5 mins
        setError(""); // clear normal errors, modal handles it
      } else {
        const errorMsg = err.response?.data?.message || "Login failed. Please try again.";
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const submitOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res;
      if (securityAction === "REQUIRE_SECURITY_OTP") {
        res = await axios.post(apiUrl("/api/auth/otp/verify-security"), { userId, otp });
      } else if (securityAction === "FORCE_PASSWORD_CHANGE") {
        res = await axios.post(apiUrl("/api/auth/otp/verify-password"), { userId, otp, newPassword });
      }

      const { token, user } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userName", user.name);

      setSecurityAction(null);
      navigate("/welcome");

    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleLogin} style={formStyle}>
        <img src="/logo2.png" alt="Netcradus Logo" style={{ height: "100px", marginBottom: "20px" }} />
        <h2 style={{ marginBottom: "20px" }}>
          <span
            style={{
              display: "inline-block",
              backgroundImage:
                "linear-gradient(90deg, #FF4F9A 5%, #FF8A3D 50%, #FFC83D 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: "700",
              fontSize: "28px",
            }}
          >
            Login
          </span>
        </h2>

        {/* Error/Success Banners (Replaces native alerts) */}
        {error && !securityAction && (
          <div style={errorBannerStyle}>
            <p style={{ margin: "0", fontWeight: "600" }}>Error</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{error}</p>
          </div>
        )}

        {successMsg && (
          <div style={successBannerStyle}>
            <p style={{ margin: "0", fontWeight: "600" }}>Success</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{successMsg}</p>
          </div>
        )}

        {/* Main Login Form Fields - Hidden if Modal Active */}
        {!securityAction && (
          <>
            <input
              type="text"
              name="email"
              placeholder="Email or UserID"
              onChange={handleChange}
              value={form.email}
              required
              disabled={loading}
              style={inputStyle}
            />

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={handleChange}
                value={form.password}
                required
                disabled={loading}
                style={{ ...inputStyle, paddingRight: "42px" }}
              />

              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  cursor: "pointer",
                  color: "gray",
                  fontSize: "18px",
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <p
              style={{
                color: "#aaa",
                fontSize: "14px",
                marginBottom: "15px",
                cursor: "pointer",
                textAlign: "right",
                opacity: loading ? 0.5 : 1,
                pointerEvents: loading ? "none" : "auto"
              }}
              onClick={() => navigate("/forgot-password")}
            >
              Forgot your password?
            </p>

            <button type="submit" style={buttonStyle} disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </button>
          </>
        )}
      </form>

      {/* Security Modals Overlay */}
      {securityAction && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{ color: "#ff6a00", marginTop: 0 }}>
              {securityAction === "REQUIRE_SECURITY_OTP" ? "Security Verification" : "Mandatory Password Update"}
            </h3>

            <p style={{ fontSize: "14px", color: "#ccc", marginBottom: "20px" }}>
              {securityAction === "REQUIRE_SECURITY_OTP"
                ? "Your weekly security check is due. An OTP has been sent to your IT Administrator."
                : "Your password has expired (30 days). An OTP has been sent to your IT Administrator to authorize this change."}
            </p>

            {error && (
              <div style={errorBannerStyle}>
                <p style={{ margin: "0", fontSize: "13px" }}>{error}</p>
              </div>
            )}

            <form onSubmit={submitOTP}>
              {securityAction === "FORCE_PASSWORD_CHANGE" && (
                <div style={{ marginBottom: "15px", textAlign: "left" }}>
                  <label style={labelStyle}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                      style={{ ...inputStyle, marginBottom: "5px", paddingRight: "42px" }}
                    />
                    <span
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "gray" }}
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  <small style={{ color: "#888", fontSize: "11px" }}>Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char.</small>
                </div>
              )}

              <div style={{ marginBottom: "20px", textAlign: "left" }}>
                <label style={labelStyle}>6-Digit OTP Code</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  disabled={loading}
                  style={{ ...inputStyle, textAlign: "center", fontSize: "20px", letterSpacing: "5px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#aaa", marginTop: "5px" }}>
                  <span>Code sent via SMTP</span>
                  <span style={{ color: timeLeft <= 60 ? "#ff4444" : "#inherit" }}>
                    Expires in: {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setSecurityAction(null);
                    setError("");
                  }}
                  disabled={loading}
                  style={{ ...buttonStyle, background: "#333", flex: 1 }}
                >
                  Cancel
                </button>
                <button type="submit" style={{ ...buttonStyle, flex: 1 }} disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#0f0f0f",
};

const formStyle = {
  background: "#141414",
  padding: "40px",
  borderRadius: "10px",
  textAlign: "center",
  width: "320px",
  position: "relative",
  zIndex: 1
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  background: "#222",
  color: "#fff",
  border: "1px solid #444",
  borderRadius: "6px",
  boxSizing: "border-box", // Ensure padding doesn't widen the input
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "linear-gradient(90deg, #FF4F9A 5%, #FF8A3D 50%, #FFC83D 100%)",
  border: "none",
  color: "#fff",
  fontWeight: "bold",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "opacity 0.2s",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#ccc",
  fontSize: "13px",
  fontWeight: "bold"
};

const errorBannerStyle = {
  background: "#fee2e2",
  border: "1px solid #fca5a5",
  borderRadius: "6px",
  padding: "12px",
  marginBottom: "20px",
  color: "#991b1b",
  fontSize: "14px",
  textAlign: "left"
};

const successBannerStyle = {
  background: "#dcfce7",
  border: "1px solid #86efac",
  borderRadius: "6px",
  padding: "12px",
  marginBottom: "20px",
  color: "#166534",
  fontSize: "14px",
  textAlign: "left"
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0, left: 0, right: 0, bottom: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  background: "#1c1c1c",
  padding: "30px",
  borderRadius: "8px",
  width: "90%",
  maxWidth: "400px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
  textAlign: "center",
  border: "1px solid #333"
};

export default Login;
