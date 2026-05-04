import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import "./styles/global.css";
import { ChatProvider } from "./context/ChatContext";
import { jwtDecode } from "jwt-decode";
import ErrorBoundary from "./components/ErrorBoundary";

/* ========== Pages (eager — tiny, needed before auth) ========== */
import Login from "./Pages/Login";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";

/* ========== Layout ========== */
import MainLayout from "./components/Layout/MainLayout";

const getRoleFromToken = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token);
      if (decoded.role) return decoded.role;
    } catch (e) {
      // Ignore invalid token
    }
  }
  return localStorage.getItem("userRole");
};

/* ========== Lazy Modules ========== */
const WelcomeAnimation         = lazy(() => import("./Pages/WelcomeAnimation"));
const AdminDevices             = lazy(() => import("./Pages/AdminDevices"));
const Dashboard                = lazy(() => import("./components/Dashboard/Dashboard"));
const UserManagement           = lazy(() => import("./components/Dashboard/UserManagement"));
const ChatPanel                = lazy(() => import("./components/Chat/ChatPanel"));

const Contacts                 = lazy(() => import("./features/Contacts/Contacts"));
const Reports                  = lazy(() => import("./features/Reports/Reports"));
const Leads                    = lazy(() => import("./features/Leads/Leads"));
const Calls                    = lazy(() => import("./features/Calls/Calls"));
const Tasks                    = lazy(() => import("./features/Tasks/Tasks"));
const Deals                    = lazy(() => import("./features/Deals/Deals"));
const Accounts                 = lazy(() => import("./features/Accounts/Accounts"));
const Campaigns                = lazy(() => import("./features/Campaigns/Campaigns"));
const Invoices                 = lazy(() => import("./features/Invoices/Invoices"));
const Quotes                   = lazy(() => import("./features/Quotes/Quotes"));
const SalesOrders              = lazy(() => import("./features/SalesOrders/SalesOrders"));
const PurchaseOrders           = lazy(() => import("./features/PurchaseOrders/PurchaseOrders"));
const PriceBooks               = lazy(() => import("./features/PriceBooks/PriceBooks"));
const Vendors                  = lazy(() => import("./features/Vendors/Vendors"));
const Products                 = lazy(() => import("./features/Products/Products"));
const Cases                    = lazy(() => import("./features/Cases/Cases"));
const Solutions                = lazy(() => import("./features/Solutions/Solutions"));
const Forecasts                = lazy(() => import("./features/Forecasts/Forecasts"));
const Visits                   = lazy(() => import("./features/Visits/Visits"));
const SalesInbox               = lazy(() => import("./features/SalesInbox/SalesInbox"));
const AttendanceWidget         = lazy(() => import("./features/Attendance/AttendanceWidget"));
const AdminAttendanceDashboard = lazy(() => import("./features/Attendance/AdminAttendanceDashboard"));
const CRMTeamspaces            = lazy(() => import("./features/CRMTeamspaces/CRMTeamspaces"));
const ManagementHub            = lazy(() => import("./features/Management/ManagementHub"));

const App = () => {
  const userRole = getRoleFromToken();

  return (
    <ErrorBoundary>
      <ChatProvider>
        <Router>
          <Suspense fallback={<div className="loading-fallback">Loading...</div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              <Route
                path="/*"
                element={
                  userRole ? (
                    <MainLayout userRole={userRole}>
                      <Routes>
                        <Route path="/" element={<WelcomeAnimation />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/user-management" element={<UserManagement />} />
                        <Route path="/contacts" element={<Contacts />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/leads" element={<Leads />} />
                        <Route path="/calls" element={<Calls />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/deals" element={<Deals />} />
                        <Route path="/accounts" element={<Accounts />} />
                        <Route path="/campaigns" element={<Campaigns />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/quotes" element={<Quotes />} />
                        <Route path="/sales-orders" element={<SalesOrders />} />
                        <Route path="/purchase-orders" element={<PurchaseOrders />} />
                        <Route path="/price-books" element={<PriceBooks />} />
                        <Route path="/vendors" element={<Vendors />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/cases" element={<Cases />} />
                        <Route path="/solutions" element={<Solutions />} />
                        <Route path="/forecasts" element={<Forecasts />} />
                        <Route path="/visits" element={<Visits />} />
                        <Route path="/sales-inbox" element={<SalesInbox />} />
                        <Route path="/attendance" element={<AttendanceWidget />} />
                        <Route path="/admin-attendance" element={<AdminAttendanceDashboard />} />
                        <Route path="/crm-teamspaces" element={<CRMTeamspaces />} />
                        <Route path="/management-hub" element={<ManagementHub />} />
                        <Route path="/admin-devices" element={<AdminDevices />} />
                      </Routes>
                      <ChatPanel />
                    </MainLayout>
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </ChatProvider>
    </ErrorBoundary>
  );
};

export default App;
