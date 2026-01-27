// // import React, { useState } from 'react';
// // import './WelcomeForm.css';
// // import { useNavigate } from 'react-router-dom';

// // function WelcomeForm() {
// //   const [company, setCompany] = useState('');
// //   const [phone, setPhone] = useState('');
// //   const [employeeCount, setEmployeeCount] = useState('');
// //   const navigate = useNavigate();

// //   const handleSubmit = (e) => {
// //     e.preventDefault();

// //     if (!company.trim()) {
// //       alert('Company name is required');
// //       return;
// //     }

// //     // ✅ Save info temporarily (you can later post to backend)
// //     localStorage.setItem('companyInfo', JSON.stringify({
// //       company,
// //       phone,
// //       employeeCount,
// //     }));

// //     localStorage.setItem('profileStep1Complete', 'true');

// //     // 👉 Move to next profile step
// //     navigate('/dashboard');
// //   };

// //   return (
// //     <div className="welcome-container">
// //       <form className="welcome-form" onSubmit={handleSubmit}>
// //         <h2>Welcome 👋</h2>
// //         <p className="subheading">Let’s set up your company info</p>

// //         <input
// //           type="text"
// //           placeholder="Company Name"
// //           value={company}
// //           onChange={(e) => setCompany(e.target.value)}
// //           required
// //         />

// //         <input
// //           type="text"
// //           placeholder="Phone Number"
// //           value={phone}
// //           onChange={(e) => setPhone(e.target.value)}
// //         />

// //         <input
// //           type="number"
// //           placeholder="Employee Count"
// //           value={employeeCount}
// //           onChange={(e) => setEmployeeCount(e.target.value)}
// //         />

// //         <div className="checkbox-row">
// //           <input type="checkbox" defaultChecked /> Load Sample Data
// //         </div>

// //         <button type="submit">Get Started</button>
// //       </form>
// //     </div>
// //   );
// // }

// // export default WelcomeForm;




// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./WelcomeForm.css";

// function WelcomeForm() {
//   const navigate = useNavigate();
//   const [name, setName] = useState("");
//   const [designation, setDesignation] = useState("");
//   const [department, setDepartment] = useState("");
//   const [company, setCompany] = useState("");
//   const [phone, setPhone] = useState("");
//   const [employeeCount, setEmployeeCount] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!name || !designation || !department || !company || !phone || !employeeCount) {
//       alert("Please fill in all fields.");
//       return;
//     }

//     // Optionally store data or send to backend
//     navigate("/dashboard");
//   };

//   const handleSampleData = () => {
//     setName("Nandini Sharma");
//     setDesignation("Software Developer");
//     setDepartment("Engineering");
//     setCompany("Netcradus Technologies");
//     setPhone("9876543210");
//     setEmployeeCount("50");
//   };

//   return (
//     <div className="welcome-container">
//       <div className="welcome-card">
//         <h2>Welcome 👋</h2>
//         <p>Let’s set up your company info</p>

//         <form onSubmit={handleSubmit}>
//           <label>Full Name</label>
//           <input
//             type="text"
//             placeholder="Enter your full name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//           />

//           <label>Designation</label>
//           <input
//             type="text"
//             placeholder="Enter your designation"
//             value={designation}
//             onChange={(e) => setDesignation(e.target.value)}
//           />

//           <label>Department</label>
//           <input
//             type="text"
//             placeholder="Enter your department"
//             value={department}
//             onChange={(e) => setDepartment(e.target.value)}
//           />

//           <label>Company Name</label>
//           <input
//             type="text"
//             placeholder="Enter your company name"
//             value={company}
//             onChange={(e) => setCompany(e.target.value)}
//           />

//           <label>Phone Number</label>
//           <input
//             type="tel"
//             placeholder="Enter phone number"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//           />

//           <label>Employee Count</label>
//           <input
//             type="number"
//             placeholder="Enter number of employees"
//             value={employeeCount}
//             onChange={(e) => setEmployeeCount(e.target.value)}
//           />

          
//           <div className="checkbox-row">
//             <input
//               type="checkbox"
//               id="sample"
//               checked={loadSample}
//               onChange={() => setLoadSample(!loadSample)}
//             />
//             <label htmlFor="sample">Load Sample Data</label>
//           </div>

//                        <button type="submit" className="start-btn">
//             Get Started
//           </button>

//         </form>
//       </div>
//     </div>
//   );
// }

// export default WelcomeForm;






// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import "./WelcomeForm.css";

// function WelcomeForm() {
//   const navigate = useNavigate();
//   const [name, setName] = useState("");
//   const [designation, setDesignation] = useState("");
//   const [department, setDepartment] = useState("");
//   const [company, setCompany] = useState("");
//   const [phone, setPhone] = useState("");
//   const [employeeCount, setEmployeeCount] = useState("");
//   const [loadSample, setLoadSample] = useState(false);

//   useEffect(() => {
//     if (loadSample) {
//       setName("Nandini Sharma");
//       setDesignation("Software Developer");
//       setDepartment("Engineering");
//       setCompany("Netcradus Technologies");
//       setPhone("9876543210");
//       setEmployeeCount("50");
//     } else {
//       setName("");
//       setDesignation("");
//       setDepartment("");
//       setCompany("");
//       setPhone("");
//       setEmployeeCount("");
//     }
//   }, [loadSample]);

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!name || !designation || !department || !company || !phone || !employeeCount) {
//       alert("Please fill in all fields.");
//       return;
//     }

//     // You can send this data to backend if needed
//     navigate("/dashboard");
//   };

//   return (
//     <div className="welcome-container">
//       <div className="welcome-card">
//         <h2>Welcome 👋</h2>
//         <p>Let’s set up your company info</p>

//         <form onSubmit={handleSubmit}>
//           <label>Full Name</label>
//           <input
//             type="text"
//             placeholder="Enter your full name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//           />

//           <label>Designation</label>
//           <input
//             type="text"
//             placeholder="Enter your designation"
//             value={designation}
//             onChange={(e) => setDesignation(e.target.value)}
//           />

//           <label>Department</label>
//           <input
//             type="text"
//             placeholder="Enter your department"
//             value={department}
//             onChange={(e) => setDepartment(e.target.value)}
//           />

//           <label>Company Name</label>
//           <input
//             type="text"
//             placeholder="Enter your company name"
//             value={company}
//             onChange={(e) => setCompany(e.target.value)}
//           />

//           <label>Phone Number</label>
//           <input
//             type="tel"
//             placeholder="Enter phone number"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//           />

//           <label>Employee Count</label>
//           <input
//             type="number"
//             placeholder="Enter number of employees"
//             value={employeeCount}
//             onChange={(e) => setEmployeeCount(e.target.value)}
//           />

//           <div className="checkbox-row">
//             <input
//               type="checkbox"
//               id="sample"
//               checked={loadSample}
//               onChange={() => setLoadSample(!loadSample)}
//             />
//             <label htmlFor="sample">Load Sample Data</label>
//           </div>

//           <button type="submit" className="start-btn">
//             Get Started
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default WelcomeForm;


// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./WelcomeForm.css";

// function WelcomeForm() {
//   const navigate = useNavigate();

//   const [fullName, setFullName] = useState("");
//   const [designation, setDesignation] = useState("");
//   const [department, setDepartment] = useState("");
//   const [company, setCompany] = useState("");
//   const [loadSample, setLoadSample] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!fullName || !designation || !department || !company) {
//       alert("Please fill in all fields");
//       return;
//     }

//     // You can store this data in localStorage or send it to backend here
//     console.log({
//       fullName,
//       designation,
//       department,
//       company,
//       loadSample,
//     });

//     navigate("/dashboard");
//   };

//   return (
//     <div className="welcome-container">
//       <div className="welcome-box">
//         <h2>Welcome 👋</h2>
//         <p className="subtitle">Let’s set up your company info</p>

//         <form onSubmit={handleSubmit} className="welcome-form">
//           <label>Full Name</label>
//           <input
//             type="text"
//             placeholder="Enter your full name"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//           />

//           <label>Designation</label>
//           <input
//             type="text"
//             placeholder="Enter your designation"
//             value={designation}
//             onChange={(e) => setDesignation(e.target.value)}
//           />

//           <label>Department</label>
//           <input
//             type="text"
//             placeholder="Enter your department"
//             value={department}
//             onChange={(e) => setDepartment(e.target.value)}
//           />

//           <label>Company Name</label>
//           <input
//             type="text"
//             placeholder="Enter your company name"
//             value={company}
//             onChange={(e) => setCompany(e.target.value)}
//           />

//           <div className="sample-checkbox">
//             <input
//               type="checkbox"
//               id="sample"
//               checked={loadSample}
//               onChange={() => setLoadSample(!loadSample)}
//             />
//             <label htmlFor="sample">Load Sample Data</label>
//           </div>

//           <button type="submit" className="get-started-btn">Get Started</button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default WelcomeForm;


// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./WelcomeForm.css";

// function WelcomeForm() {
//   const navigate = useNavigate();

//   const [fullName, setFullName] = useState("");
//   const [designation, setDesignation] = useState("");
//   const [department, setDepartment] = useState("");
//   const [email, setEmail] = useState(""); // ✅ Added missing state
//   const [loadSample, setLoadSample] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!fullName || !designation || !department  || !email) {
//       alert("Please fill in all fields");
//       return;
//     }

//     // Save or process the data here
//     console.log({
//       fullName,
//       designation,
//       department,
//       email,
//       loadSample,
//     });

//     navigate("/dashboard"); // Navigate to dashboard
//   };

//   return (
//     <div className="welcome-container">
//       <div className="welcome-box">
//         <h2>👋 Welcome!</h2>
//         <p className="subtitle">Let’s get your company set up</p>

//         <form onSubmit={handleSubmit} className="welcome-form">
//           <label>Full Name</label>
//           <input
//             type="text"
//             placeholder="e.g., Nandini Sharma"
//             value={fullName}
//             onChange={(e) => setFullName(e.target.value)}
//           />

//           <label>Designation</label>
//           <input
//             type="text"
//             placeholder="e.g., Software Developer"
//             value={designation}
//             onChange={(e) => setDesignation(e.target.value)}
//           />

//           <label>Department</label>
//           <input
//             type="text"
//             placeholder="e.g., Engineering / Sales"
//             value={department}
//             onChange={(e) => setDepartment(e.target.value)}
//           />

//           <label>Email</label>
//           <input
//             type="email"
//             placeholder="e.g., user@example.com"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//           />

//           <div className="sample-checkbox">
//             <input
//               type="checkbox"
//               id="sample"
//               checked={loadSample}
//               onChange={() => setLoadSample(!loadSample)}
//             />
//             <label htmlFor="sample">Load sample company data</label>
//           </div>

//           <button type="submit" className="get-started-btn">
//             Get Started
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default WelcomeForm;





import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WelcomeForm.css";

function WelcomeForm() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [loadSample, setLoadSample] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fullName || !designation || !department || !email) {
      alert("Please fill in all fields");
      return;
    }

    // Optional: Log submitted data
    console.log({
      fullName,
      designation,
      department,
      email,
      loadSample,
    });

    // ✅ Mark profile as complete
    localStorage.setItem("profileComplete", "true");

    // ✅ Navigate to dashboard
    window.location.href = "/dashboard";
  };

  return (
    <div className="welcome-container">
      <div className="welcome-box">
        <h2>👋 Welcome!</h2>
        <p className="subtitle">Let’s get your company set up</p>

        <form onSubmit={handleSubmit} className="welcome-form">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="e.g., Nandini Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <label>Designation</label>
          <input
            type="text"
            placeholder="e.g., Software Developer"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
          />

          <label>Department</label>
          <input
            type="text"
            placeholder="e.g., Engineering / Sales"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />

          <label>Email</label>
          <input
            type="email"
            placeholder="e.g., user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="sample-checkbox">
            <input
              type="checkbox"
              id="sample"
              checked={loadSample}
              onChange={() => setLoadSample(!loadSample)}
            />
            <label htmlFor="sample">Load sample company data</label>
          </div>

          <button type="submit" className="get-started-btn">
            Get Started
          </button>
        </form>
      </div>
    </div>
  );
}

export default WelcomeForm;
