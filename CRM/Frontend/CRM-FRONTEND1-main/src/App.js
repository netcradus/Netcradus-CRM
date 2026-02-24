import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

/* ========== Pages ========== */
import Login from "./Pages/Login";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";

/* ========== Layout ========== */
import MainLayout from "./components/Layout/MainLayout";

/* ========== Dashboards ========== */
import Dashboard from "./components/Dashboard/Dashboard";
import AdminDashboard from "./components/Dashboard/AdminDashboard";
import SupportDashboard from "./components/Dashboard/SupportDashboard";
import SalesDashboard from "./components/Dashboard/SalesDashboard";
import HRDashboard from "./components/Dashboard/HRDashboard";
import TechDashboard from "./components/Dashboard/TechDashboard";

/* ========== Modules ========== */
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
import CRMTeamspaces from "./components/CRMTeamspaces";
import PurchaseOrders from "./components/PurchaseOrders";
import Visits from "./components/Visits";
import Invoices from "./components/Invoices";
import SalesInbox from "./components/SalesInbox";
import Campaigns from "./components/Campaigns";
import PriceBooks from "./components/PriceBooks";
import Solutions from "./components/Solutions";
import CT from "./components/CT";
import UserManagement from "./components/Dashboard/UserManagement";

/* ========== Protected Wrapper ========== */
function ProtectedLayout() {
  const token = localStorage.getItem("token");
  return token ? <MainLayout /> : <Navigate to="/login" replace />;
}

/* ========== Role Route Helper ========== */
function RoleRoute({ roleNeeded, children }) {
  const role = localStorage.getItem("userRole");
  if (role !== roleNeeded) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>

        {/* ================= PUBLIC ================= */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ================= PROTECTED ================= */}
        <Route element={<ProtectedLayout />}>

          {/* ---- Dashboards ---- */}
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/admin-dashboard" element={
            <RoleRoute roleNeeded="admin">
              <Dashboard />
            </RoleRoute>
          } />

          <Route
            path="/user-management"
            element={
              <RoleRoute roleNeeded="admin">
                <UserManagement />
              </RoleRoute>
            }
          />

          <Route path="/support-dashboard" element={
            <RoleRoute roleNeeded="support">
            <Dashboard />
            </RoleRoute>
          } />

          <Route path="/sales-dashboard" element={
            <RoleRoute roleNeeded="sales">
             <Dashboard />
            </RoleRoute>
          } />

          <Route path="/hr-dashboard" element={
            <RoleRoute roleNeeded="hr">
             <Dashboard />
            </RoleRoute>
          } />

          <Route path="/tech-dashboard" element={
            <RoleRoute roleNeeded="it">
            <Dashboard />
            </RoleRoute>
          } />

          {/* ---- All Other Modules ---- */}
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

        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
