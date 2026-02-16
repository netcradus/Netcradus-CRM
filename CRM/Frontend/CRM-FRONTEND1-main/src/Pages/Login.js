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



import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user starts typing
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      const { token, user } = res.data;
      console.log("User object from backend:", user);

      localStorage.setItem("token", token);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("profileComplete", user.profileComplete ? "true" : "false");

      if (!user.profileComplete) {
        navigate("/welcome");
      } else {
        // Redirect based on user role
        if (user.role === "admin") navigate("/admin-dashboard");
        else if (user.role === "support") navigate("/support-dashboard");
        else if (user.role === "sales") navigate("/sales-dashboard");
        else navigate("/dashboard");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMsg);
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleLogin} style={formStyle}>
        <img src="/logo2.png" alt="Netcradus Logo" style={{ height: "100px", marginBottom: "20px" }} />
        {/* <h2 style={{ color: "#ff5e00", marginBottom: "20px" }}>Login</h2> */}
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

        {/* Error Message Display */}
        {error && (
          <div style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: "6px",
            padding: "12px",
            marginBottom: "20px",
            color: "#991b1b",
            fontSize: "14px"
          }}>
            <p style={{ margin: "0", fontWeight: "600" }}>Error</p>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px" }}>{error}</p>
          </div>
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          value={form.email}
          required
          disabled={loading}
          style={inputStyle}
        />

        {/* <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
          style={inputStyle}
        /> */}

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

        {/* Forgot Password Link */}
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

        <p style={{ marginTop: "15px", color: "#ccc", opacity: loading ? 0.5 : 1 }}>
          Don't have an account?{" "}
          <span
            onClick={() => !loading && navigate("/register")}
            style={{ 
              color: "#ff5e00", 
              cursor: loading ? "not-allowed" : "pointer", 
              textDecoration: "underline",
              opacity: loading ? 0.5 : 1
            }}
          >
            Register
          </span>
        </p>
      </form>
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
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  background: "#222",
  color: "#fff",
  border: "1px solid #444",
  borderRadius: "6px",
  opacity: 1,
  cursor: "inherit"
};

const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: "linear-gradient(to right, #ff6a00, #ff007a)",
  border: "none",
  color: "#fff",
  fontWeight: "bold",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "opacity 0.2s",
};

export default Login;
