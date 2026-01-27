// import React, { useState } from "react";
// import axios from "axios";

// function Register() {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     role: "sales", // default role
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/register", form);
//       alert(res.data.message);
//     } catch (err) {
//       alert(err.response?.data?.message || "Registration failed");
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit}>
//       <h2>Register</h2>
//       <input type="text" name="name" placeholder="Name" onChange={handleChange} required />
//       <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
//       <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
//       <select name="role" onChange={handleChange}>
//         <option value="sales">Sales</option>
//         <option value="admin">Admin</option>
//         <option value="support">Support</option>
//       </select>
//       <button type="submit">Register</button>
//     </form>
//   );
// }

// export default Register;



// import React, { useState } from "react";
// import axios from "axios";

// function Register() {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     role: "sales",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/register", form);
//       alert(res.data.message);
//     } catch (err) {
//       alert(err.response?.data?.message || "Registration failed");
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
//         onSubmit={handleSubmit}
//         style={{
//           background: "#141414",
//           padding: "40px",
//           borderRadius: "10px",
//           textAlign: "center",
//           width: "350px",
//         }}
//       >
//         <img src="/logo.png" alt="Netcradus Logo" style={{ height: "80px", marginBottom: "20px" }} />

//         <h2 style={{ color: "#ff5e00", marginBottom: "20px" }}>Register</h2>

//         <input
//           type="text"
//           name="name"
//           placeholder="Name"
//           onChange={handleChange}
//           required
//           style={inputStyle}
//         />

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

//         <select
//           name="role"
//           onChange={handleChange}
//           value={form.role}
//           style={{
//             ...inputStyle,
//             background: "#222",
//             color: "#fff",
//             border: "1px solid #444",
//           }}
//         >
//           <option value="sales">Sales</option>
//           <option value="admin">Admin</option>
//           <option value="support">Support</option>
//         </select>

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
//             marginTop: "10px",
//           }}
//         >
//           Register
//         </button>
//       </form>
//     </div>
//   );
// }

// const inputStyle = {
//   width: "100%",
//   padding: "10px",
//   marginBottom: "15px",
//   background: "#222",
//   color: "#fff",
//   border: "1px solid #444",
//   borderRadius: "6px",
// };

// export default Register;
    


// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// function Register() {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     role: "sales",
//   });

//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post("http://localhost:5000/api/auth/register", form);
//       alert("🎉 Registration successful!");
//       navigate("/login");
//     } catch (err) {
//       alert(err.response?.data?.message || "Registration failed!");
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <form onSubmit={handleSubmit} style={styles.form}>
//         <img src="/logo.png" alt="Netcradus Logo" style={styles.logo} />
//         <h2 style={styles.title}>Register</h2>

//         <input
//           type="text"
//           name="name"
//           placeholder="Name"
//           value={form.name}
//           onChange={handleChange}
//           required
//           style={styles.input}
//         />

//         <input
//           type="email"
//           name="email"
//           placeholder="Email"
//           value={form.email}
//           onChange={handleChange}
//           required
//           style={styles.input}
//         />

//         <input
//           type="password"
//           name="password"
//           placeholder="Password"
//           value={form.password}
//           onChange={handleChange}
//           required
//           style={styles.input}
//         />

//         <select
//           name="role"
//           value={form.role}
//           onChange={handleChange}
//           style={{ ...styles.input, ...styles.select }}
//         >
//           <option value="sales">Sales</option>
//           <option value="admin">Admin</option>
//           <option value="support">Support</option>
//         </select>

//         <button type="submit" style={styles.button}>Register</button>
//       </form>
//     </div>
//   );
// }

// // Style object for inline CSS
// const styles = {
//   container: {
//     display: "flex",
//     justifyContent: "center",
//     alignItems: "center",
//     height: "100vh",
//     background: "#0f0f0f",
//   },
//   form: {
//     background: "#141414",
//     padding: "40px",
//     borderRadius: "10px",
//     width: "350px",
//     textAlign: "center",
//     boxShadow: "0 0 10px rgba(255, 94, 0, 0.2)",
//   },
//   logo: {
//     height: "80px",
//     marginBottom: "20px",
//   },
//   title: {
//     color: "#ff5e00",
//     marginBottom: "20px",
//   },
//   input: {
//     width: "100%",
//     padding: "10px",
//     marginBottom: "15px",
//     background: "#222",
//     color: "#fff",
//     border: "1px solid #444",
//     borderRadius: "6px",
//   },
//   select: {
//     appearance: "none",
//     WebkitAppearance: "none",
//     MozAppearance: "none",
//   },
//   button: {
//     width: "100%",
//     padding: "12px",
//     background: "linear-gradient(to right, #ff6a00, #ff007a)",
//     border: "none",
//     color: "#fff",
//     fontWeight: "bold",
//     borderRadius: "6px",
//     cursor: "pointer",
//     marginTop: "10px",
//   },
// };

// export default Register;


import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", form);
      alert("🎉 Registration successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed!");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <img src="/logo2.png" alt="Netcradus Logo" style={styles.logo} />
        <h2 style={styles.title}>Register</h2>

        <input
          type="text"
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={styles.input}
        />

        {/* <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={styles.input}
        /> */}

        <div style={{ position: "relative" }}>
  <input
    type={showPassword ? "text" : "password"}
    name="password"
    placeholder="Password"
    value={form.password}
    onChange={handleChange}
    required
    style={{ ...styles.input, paddingRight: "42px" }}
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

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          required
          style={{ ...styles.input, ...styles.select }}
        >
          <option value="">Select a role</option>
          <option value="sales">Sales</option>
          <option value="admin">Admin</option>
          <option value="support">Support</option>
          <option value="hr">HR</option>
          <option value="tech">Tech</option>
        </select>

        <button type="submit" style={styles.button}>Register</button>
          <p style={{ marginTop: "15px", color: "#ccc" }}>
         Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ color: "#ff5e00", cursor: "pointer", textDecoration: "underline" }}
          >
           Login
          </span>
        </p>
      </form>
    </div>
  );
}

// Style object for inline CSS
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#0f0f0f",
  },
  form: {
    background: "#141414",
    padding: "40px",
    borderRadius: "10px",
    width: "350px",
    textAlign: "center",
    boxShadow: "0 0 10px rgba(255, 94, 0, 0.2)",
  },
  logo: {
    height: "100px",
    marginBottom: "20px",
  },
  title: {
    // color: "#ff5e00",
    backgroundImage:
        "linear-gradient(90deg, #FF4F9A 30%, #FF8A3D 50%, #FFC83D 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      fontWeight: "700",
      fontSize: "28px",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "15px",
    background: "#222",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "6px",
  },
  select: {
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(to right, #ff6a00, #ff007a)",
    border: "none",
    color: "#fff",
    fontWeight: "bold",
    borderRadius: "6px",
    cursor: "pointer",
    marginTop: "10px",
  },
};

export default Register;
