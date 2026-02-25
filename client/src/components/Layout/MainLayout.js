// // src/components/Layout/MainLayout.js

// import React from "react";
// import Sidebar from "../Sidebar"; // Adjust the path if needed
// import "./MainLayout.css"; // Optional: for layout styling

// const MainLayout = ({ children }) => {
//   return (
//     <div className="dashboard-container">
//       <Sidebar />
//       <div className="dashboard">
//         {children}
//       </div>
//     </div>
//   );
// };

// export default MainLayout;




// src/components/Layout/Layout.js

import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Dashboard/Sidebar"; // ✅ Fixed path
import "./MainLayout.css";

const MainLayout = () => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
