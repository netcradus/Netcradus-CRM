// import React from "react";
// import Sidebar from "./Sidebar";
// import AdminDashboard from "./AdminDashboard";
// import SalesDashboard from "./SalesDashboard";
// import SupportDashboard from "./SupportDashboard";
// import "../Dashboard.css";

// function Dashboard() {
//   const userRole = localStorage.getItem("userRole");

//   const renderDashboard = () => {
//     switch (userRole) {
//       case "admin":
//         return <AdminDashboard />;
//       case "sales":
//         return <SalesDashboard />;
//       case "support":
//         return <SupportDashboard />;
//       default:
//         return <div className="dashboard">Default Dashboard for unknown roles.</div>;
//     }
//   };

//   return (
//     <div className="dashboard-container">
//       <Sidebar />
//       <div className="dashboard-content">
//         {renderDashboard()}
//       </div>
//     </div>
//   );
// }

// export default Dashboard;




// import React from "react";
// import Sidebar from "./Sidebar";
// import AdminDashboard from "./AdminDashboard";
// import SalesDashboard from "./SalesDashboard";
// import SupportDashboard from "./SupportDashboard";
// import "./Dashboard.css";

// function Dashboard() {
//   const userRole = localStorage.getItem("userRole");

//   const renderDashboard = () => {
//     switch (userRole) {
//       case "admin":
//         return <AdminDashboard />;
//       case "sales":
//         return <SalesDashboard />;
//       case "support":
//         return <SupportDashboard />;
//       default:
//         return (
//           <div className="role-fallback">
//             <p>Unknown role. Please contact admin.</p>
//           </div>
//         );
//     }
//   };

//   return (
//     <div className="dashboard-container">
//       <Sidebar />
//       <div className="dashboard-content">
//         {/* 👇 Role Specific Dashboard */}
//         {renderDashboard()}
//       </div>
//     </div>
//   );
// }

// export default Dashboard;


import React from "react";
import Sidebar from "./Sidebar";
import AdminDashboard from "./AdminDashboard";
import SalesDashboard from "./SalesDashboard";
import SupportDashboard from "./SupportDashboard";
import HRDashboard from "./HRDashboard";

import TechDashboard from "./TechDashboard";
import NotificationButton from "../NotificationButton";
import "./Dashboard.css";

function Dashboard() {
  const userRole = localStorage.getItem("userRole");

  const renderDashboard = () => {
    switch (userRole) {
      case "admin":
        return <AdminDashboard />;
      case "sales":
        return <SalesDashboard />;
      case "support":
        return <SupportDashboard />;
      case "hr":
        return <HRDashboard />;
      case "tech":
        return <TechDashboard />;
      default:
        return (
          <div className="role-fallback">
            <p>Unknown role. Please contact admin.</p>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">
     

      <div className="dashboard-content">
        <div className="dashboard-header">
          <NotificationButton />
        </div>

        {renderDashboard()}
      </div>
    </div>
  );
}

export default Dashboard;
