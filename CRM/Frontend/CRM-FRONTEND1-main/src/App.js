// // import React from "react";
// // import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// // // Pages
// // import Login from "./Pages/Login";
// // import Register from "./Pages/Register";
// // import ForgotPassword from "./Pages/ForgotPassword"; // <-- Added

// // // Dashboards
// // import Dashboard from "./components/Dashboard/Dashboard";
// // import AdminDashboard from "./components/Dashboard/AdminDashboard";
// // import SupportDashboard from "./components/Dashboard/SupportDashboard";
// // import SalesDashboard from "./components/Dashboard/SalesDashboard";

// // // Onboarding
// // import WelcomeForm from "./components/WelcomeForm/WelcomeForm";
// // import ProfileSetup from "./components/WelcomeForm/ProfileSetup";

// // // CRM Modules
// // import Contacts from "./components/Contacts";

// // function App() {
// //   const token = localStorage.getItem("token");
// //   const step1 = localStorage.getItem("profileStep1Complete") === "true";
// //   const step2 = localStorage.getItem("profileComplete") === "true";
// //   const role = localStorage.getItem("userRole");

// //   return (
// //     <Router>
// //       <Routes>
// //         {/* Default Route */}
// //         <Route
// //           path="/"
// //           element={
// //             !token ? (
// //               <Navigate to="/login" />
// //             ) : !step1 ? (
// //               <Navigate to="/welcome" />
// //             ) : !step2 ? (
// //               <Navigate to="/profile-setup" />
// //             ) : (
// //               <Navigate to="/dashboard" />
// //             )
// //           }
// //         />

// //         {/* Public Routes */}
// //         <Route path="/login" element={<Login />} />
// //         <Route path="/register" element={<Register />} />
// //         <Route path="/forgot-password" element={<ForgotPassword />} /> {/* <-- Added */}

// //         {/* Onboarding Routes */}
// //         <Route
// //           path="/welcome"
// //           element={
// //             token && !step1 ? (
// //               <WelcomeForm />
// //             ) : token && step1 && !step2 ? (
// //               <Navigate to="/profile-setup" />
// //             ) : (
// //               <Navigate to="/dashboard" />
// //             )
// //           }
// //         />
// //         <Route
// //           path="/profile-setup"
// //           element={
// //             token && step1 && !step2 ? (
// //               <ProfileSetup />
// //             ) : (
// //               <Navigate to="/dashboard" />
// //             )
// //           }
// //         />

// //         {/* Dashboards */}
// //         <Route path="/dashboard" element={<Dashboard />} />
// //         {role === "admin" && (
// //           <Route path="/admin-dashboard" element={<AdminDashboard />} />
// //         )}
// //         {role === "support" && (
// //           <Route path="/support-dashboard" element={<SupportDashboard />} />
// //         )}
// //         {role === "sales" && (
// //           <Route path="/sales-dashboard" element={<SalesDashboard />} />
// //         )}

// //         {/* CRM Modules */}
// //         <Route path="/contacts" element={<Contacts />} />

// //         {/* Fallback */}
// //         <Route path="*" element={<Navigate to="/" />} />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;



// // import React from "react";
// // import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// // import Login from "./Pages/Login";
// // import Register from "./Pages/Register";

// // import Dashboard from "./components/Dashboard/Dashboard";
// // import AdminDashboard from "./components/Dashboard/AdminDashboard";
// // import SupportDashboard from "./components/Dashboard/SupportDashboard";
// // import SalesDashboard from "./components/Dashboard/SalesDashboard";

// // import Contacts from "./components/Contacts";
// // import Sales from "./components/Sales";
// // import Reports from "./components/Reports";

// // import WelcomeForm from "./components/WelcomeForm/WelcomeForm";
// // import Leads from "./components/Leads";


// // function App() {
// //   const token = localStorage.getItem("token");
// //   const role = localStorage.getItem("userRole");
// //   const isLoggedIn = !!token;
// //   const isProfileComplete = localStorage.getItem("profileComplete") === "true";

// //   return (
// //     <Router>
// //       <Routes>
// //         <Route path="/" element={<Navigate to="/login" />} />
// //         <Route path="/login" element={<Login />} />
// //         <Route path="/register" element={<Register />} />

// //         <Route
// //           path="/welcome"
// //           element={
// //             isLoggedIn && !isProfileComplete ? (
// //               <WelcomeForm />
// //             ) : (
// //               <Navigate to="/dashboard" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/admin-dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete && role === "admin" ? (
// //               <AdminDashboard />
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/support-dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete && role === "support" ? (
// //               <SupportDashboard />
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/sales-dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete && role === "sales" ? (
// //               <SalesDashboard />
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <Dashboard />
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />
// //           <Route
// //   path="/leads"
// //   element={
// //     isLoggedIn && isProfileComplete ? (
// //       <Leads />
// //     ) : (
// //       <Navigate to="/welcome" />
// //     )
// //   }
// // />


// //         <Route
// //           path="/contacts"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <Contacts />
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/sales"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <Sales />
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/reports"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <Reports />
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;




// // import React from "react";
// // import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// // import Login from "./Pages/Login";
// // import Register from "./Pages/Register";

// // import Dashboard from "./components/Dashboard/Dashboard";
// // import AdminDashboard from "./components/Dashboard/AdminDashboard";
// // import SupportDashboard from "./components/Dashboard/SupportDashboard";
// // import SalesDashboard from "./components/Dashboard/SalesDashboard";

// // import Contacts from "./components/Contacts";
// // import Sales from "./components/Sales";
// // import Reports from "./components/Reports";
// // import WelcomeForm from "./components/WelcomeForm/WelcomeForm";
// // import Leads from "./components/Leads";

// // import Layout from "./components/Layout/MainLayout";

// // function App() {
// //   const token = localStorage.getItem("token");
// //   const role = localStorage.getItem("userRole");
// //   const isLoggedIn = !!token;
// //   const isProfileComplete = localStorage.getItem("profileComplete") === "true";

// //   return (
// //     <Router>
// //       <Routes>
// //         <Route path="/" element={<Navigate to="/login" />} />
// //         <Route path="/login" element={<Login />} />
// //         <Route path="/register" element={<Register />} />

// //         <Route
// //           path="/welcome"
// //           element={
// //             isLoggedIn && !isProfileComplete ? (
// //               <WelcomeForm />
// //             ) : (
// //               <Navigate to="/dashboard" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/admin-dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete && role === "admin" ? (
// //               <Layout><AdminDashboard /></Layout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/support-dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete && role === "support" ? (
// //               <Layout><SupportDashboard /></Layout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/sales-dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete && role === "sales" ? (
// //               <Layout><SalesDashboard /></Layout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <Layout><Dashboard /></Layout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/leads"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <Layout><Leads /></Layout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/contacts"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <Layout><Contacts /></Layout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/sales"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <Layout><Sales /></Layout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/reports"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <Layout><Reports /></Layout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;


// // import React from "react";
// // import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// // import Login from "./Pages/Login";
// // import Register from "./Pages/Register";

// // import Dashboard from "./components/Dashboard/Dashboard";
// // import AdminDashboard from "./components/Dashboard/AdminDashboard";
// // import SupportDashboard from "./components/Dashboard/SupportDashboard";
// // import SalesDashboard from "./components/Dashboard/SalesDashboard";

// // import Contacts from "./components/Contacts";
// // import Sales from "./components/Sales";
// // import Reports from "./components/Reports";
// // import WelcomeForm from "./components/WelcomeForm/WelcomeForm";
// // import Leads from "./components/Leads";

// // import MainLayout from "./components/Layout/MainLayout";

// // function App() {
// //   const token = localStorage.getItem("token");
// //   const role = localStorage.getItem("userRole");
// //   const isLoggedIn = !!token;
// //   const isProfileComplete = localStorage.getItem("profileComplete") === "true";

// //   return (
// //     <Router>
// //       <Routes>
// //         <Route path="/" element={<Navigate to="/login" />} />
// //         <Route path="/login" element={<Login />} />
// //         <Route path="/register" element={<Register />} />

// //         <Route
// //           path="/welcome"
// //           element={
// //             isLoggedIn && !isProfileComplete ? (
// //               <WelcomeForm />
// //             ) : (
// //               <Navigate to="/dashboard" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/admin-dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete && role === "admin" ? (
// //               <MainLayout><AdminDashboard /></MainLayout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/support-dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete && role === "support" ? (
// //               <MainLayout><SupportDashboard /></MainLayout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/sales-dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete && role === "sales" ? (
// //               <MainLayout><SalesDashboard /></MainLayout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/dashboard"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <MainLayout><Dashboard /></MainLayout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/leads"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <MainLayout><Leads /></MainLayout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/contacts"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <MainLayout><Contacts /></MainLayout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/sales"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <MainLayout><Sales /></MainLayout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />

// //         <Route
// //           path="/reports"
// //           element={
// //             isLoggedIn && isProfileComplete ? (
// //               <MainLayout><Reports /></MainLayout>
// //             ) : (
// //               <Navigate to="/welcome" />
// //             )
// //           }
// //         />
// //       </Routes>
// //     </Router>
// //   );
// // }

// // export default App;


// import React from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// import Login from "./Pages/Login";
// import Register from "./Pages/Register";
// import WelcomeForm from "./components/WelcomeForm/WelcomeForm";

// import Dashboard from "./components/Dashboard/Dashboard";
// import AdminDashboard from "./components/Dashboard/AdminDashboard";
// import SupportDashboard from "./components/Dashboard/SupportDashboard";
// import SalesDashboard from "./components/Dashboard/SalesDashboard";

// import Contacts from "./components/Contacts";
// import Reports from "./components/Reports";
// import Leads from "./components/Leads"
// import Calls from "./components/Calls";
// import Cases from "./components/Cases";
// import Deals from "./components/Deals";
// import Tasks from "./components/Tasks";
// import Accounts from "./components/Accounts";
// import Meetings from "./components/Meetings";
// import Products from "./components/Products";
// import Projects from "./components/Projects";
// import Quotes from "./components/Quotes";
// import Social from "./components/Social";
// import Vendors from "./components/Vendors";
// import Sales from "./components/Sales";
// import SalesOrders from "./components/SalesOrders";
// import CRMTeamspaces from './components/CRMTeamspaces';


// import MainLayout from "./components/Layout/MainLayout";


// function App() {
//   const token = localStorage.getItem("token");
//   const role = localStorage.getItem("userRole");
//   const isLoggedIn = !!token;
//   const isProfileComplete = localStorage.getItem("profileComplete") === "true";

//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Navigate to="/login" />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />

//         <Route
//           path="/welcome"
//           element={
//             isLoggedIn && !isProfileComplete ? (
//               <WelcomeForm />
//             ) : (
//               <Navigate to="/dashboard" />
//             )
//           }
//         />

//         {isLoggedIn && isProfileComplete && (
//           <Route element={<MainLayout />}>
//             <Route path="/dashboard" element={<Dashboard />} />
//             <Route path="/admin-dashboard" element={role === "admin" ? <AdminDashboard /> : <Navigate to="/dashboard" />} />
//             <Route path="/support-dashboard" element={role === "support" ? <SupportDashboard /> : <Navigate to="/dashboard" />} />
//             <Route path="/sales-dashboard" element={role === "sales" ? <SalesDashboard /> : <Navigate to="/dashboard" />} />
//             <Route path="/leads" element={<Leads />} />
//             <Route path="/accounts" element={<Accounts />} />  
//             <Route path="/tasks" element={<Tasks />} />
//             <Route path="/Calls" element={<Calls />} />
//             <Route path="/Cases" element={<Cases />} />
//             <Route path="/contacts" element={<Contacts />} />
//             <Route path="/sales" element={<Sales />} />
//             <Route path="/salesOrders" element={<SalesOrders/>} />
//             <Route path="/reports" element={<Reports />} />
//             <Route path="/deals" element={<Deals />} />
//             <Route path="/meetings" element={<Meetings />} />
//             <Route path="/products" element={<Products />} />
//             <Route path="/projects" element={<Projects />} />
//             <Route path="/quotes" element={<Quotes />} />
//             <Route path="/social" element={<Social />} />
//             <Route path="/vendors" element={<Vendors />} />
//             <Route path="/CRMTeamspaces" element={<CRMTeamspaces />} />
            
//           </Route>
//         )}
//       </Routes>
//     </Router>
//   );
// }

// export default App;






import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import WelcomeForm from "./components/WelcomeForm/WelcomeForm";

import Dashboard from "./components/Dashboard/Dashboard";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import SupportDashboard from "./components/Dashboard/SupportDashboard";
import SalesDashboard from "./components/Dashboard/SalesDashboard";
import HRDashboard from './components/Dashboard/HRDashboard';

import Contacts from "./components/Contacts";
import Reports from "./components/Reports";
import Leads from "./components/Leads";
import Calls from "./components/Calls";
import Cases from "./components/Cases";
import Deals from "./components/Deals";
import Documents from "./components/Documents";
import Forecasts from "./components/Forecasts";
import Tasks from "./components/Tasks";
import Accounts from "./components/Accounts";
import Meetings from "./components/Meetings";
import Products from "./components/Products";
import Projects from "./components/Projects";
import Quotes from "./components/Quotes";
import Social from "./components/Social";
import Services from "./components/Services";
import Vendors from "./components/Vendors";
import Sales from "./components/Sales";
import SalesOrders from "./components/SalesOrders";
import CRMTeamspaces from './components/CRMTeamspaces';
import PurchaseOrders from './components/PurchaseOrders';
import Visits from './components/Visits';
import Invoices from "./components/Invoices";
import SalesInbox from "./components/SalesInbox";
import Campaigns from "./components/Campaigns";
import PriceBooks from "./components/PriceBooks";
import Solutions from './components/Solutions';
import CT from './components/CT';

import MainLayout from "./components/Layout/MainLayout";

import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import TechDashboard from './components/Dashboard/TechDashboard';


function App() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");
  const isLoggedIn = !!token;
  const isProfileComplete = localStorage.getItem("profileComplete") === "true";

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/welcome"
          element={
            isLoggedIn && !isProfileComplete ? (
              <WelcomeForm />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />

        {isLoggedIn && isProfileComplete ? (
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/admin-dashboard"
              element={role === "admin" ? <AdminDashboard /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/support-dashboard"
              element={role === "support" ? <SupportDashboard /> : <Navigate to="/dashboard" />}
            />
            <Route
              path="/sales-dashboard"
              element={role === "sales" ? <SalesDashboard /> : <Navigate to="/dashboard" />}
            />
             <Route
              path="/hr-dashboard"
               element={role === "hr" ? <HRDashboard /> : <Navigate to="/dashboard" />}
            />

             <Route
              path="/tech-dashboard"
              element={role === "tech" ? <TechDashboard /> : <Navigate to="/dashboard" />}
             />

            <Route path="/leads" element={<Leads />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calls" element={<Calls />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/sales-orders" element={<SalesOrders />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/forecasts" element={<Forecasts />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/products" element={<Products />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/social" element={<Social />} />
            <Route path="/services" element={<Services />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/crm-teamspaces" element={<CRMTeamspaces />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/visits" element={<Visits />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/sales-inbox" element={<SalesInbox />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/price-books" element={<PriceBooks />} />
            <Route path="/ct" element={<CT />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;