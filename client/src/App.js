import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import "./styles/global.css";
import { ChatProvider } from "./context/ChatContext";

/* ========== Pages ========== */
import Login from "./Pages/Login";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import WelcomeAnimation from "./Pages/WelcomeAnimation";
import AdminDevices from "./Pages/AdminDevices";

/* ========== Layout ========== */
import MainLayout from "./components/Layout/MainLayout";

/* ========== Dashboards ========== */
import Dashboard from "./components/Dashboard/Dashboard";

/* ========== Modules ========== */
import Contacts from "./features/Contacts/Contacts";
import Reports from "./features/Reports/Reports";
import Leads from "./features/Leads/Leads";
import Calls from "./features/Calls/Calls";
import Cases from "./features/Cases/Cases";
import Deals from "./features/Deals/Deals";
import Documents from "./features/Documents/Documents";
import Forecasts from "./features/Forecasts/Forecasts";
import Tasks from "./features/Tasks/Tasks";
import Accounts from "./features/Accounts/Accounts";
import Meetings from "./features/Meetings/Meetings";
import Products from "./features/Products/Products";
import Projects from "./features/Projects/Projects";
import ProjectDetailPage from "./features/Projects/ProjectDetailPage";
import ProjectFormPage from "./features/Projects/ProjectFormPage";
import ShowcasePage from "./features/Projects/ShowcasePage";
import Quotes from "./features/Quotes/Quotes";
import Social from "./features/Social/Social";
import Services from "./features/Services/Services";
import Vendors from "./features/Vendors/Vendors";
import Sales from "./features/Sales/Sales";
import SalesOrders from "./features/SalesOrders/SalesOrders";
import CRMTeamspaces from "./features/CRMTeamspaces/CRMTeamspaces";
import PurchaseOrders from "./features/PurchaseOrders/PurchaseOrders";
import Visits from "./features/Visits/Visits";
import Invoices from "./features/Invoices/Invoices";
import SalesInbox from "./features/SalesInbox/SalesInbox";
import Campaigns from "./features/Campaigns/Campaigns";
import PriceBooks from "./features/PriceBooks/PriceBooks";
import Solutions from "./features/Solutions/Solutions";
import CT from "./features/CT/CT";
import UserManagement from "./components/Dashboard/UserManagement";
import AttendancePage from "./features/Attendance/AttendancePage";
import LeavePage from "./features/Attendance/LeavePage";
import HolidaysPage from "./features/Attendance/HolidaysPage";
import AttendanceReportsPage from "./features/Attendance/AttendanceReportsPage";
import AdminAttendanceDashboard from "./features/Attendance/AdminAttendanceDashboard";
import TicketsPage from "./features/Tickets/TicketsPage";
import ExpensesPage from "./features/Expenses/ExpensesPage";
import EmployeeProfilesPage from "./features/EmployeeProfiles/EmployeeProfilesPage";
import MyProfilePage from "./features/MyProfile/MyProfilePage";
import InterviewsPage from "./features/Interviews/InterviewsPage";
import StorageAdminPage from "./features/Documents/admin/StorageAdminPage";
import ChatPanel from "./components/Chat/ChatPanel";

/* ========== Protected Wrapper ========== */
function ProtectedLayout() {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");
  return token && userRole ? (
    <ChatProvider>
      <MainLayout />
    </ChatProvider>
  ) : <Navigate to="/login" replace />;
}

function RoleRoute({ roles, children }) {
  const role = localStorage.getItem("userRole");
  const allowed = Array.isArray(roles) ? roles.includes(role) : role === roles;
  if (!allowed) {
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

          {/* ---- Welcome Animation ---- */}
          <Route path="/welcome" element={<WelcomeAnimation />} />

          {/* ---- Dashboards ---- */}
          <Route path="/dashboard" element={<Dashboard />} />

          <Route
            path="/user-management"
            element={
              <RoleRoute roles="super_user">
                <UserManagement />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/devices"
            element={
              <RoleRoute roles="super_user">
                <AdminDevices />
              </RoleRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <RoleRoute roles={["super_user", "admin"]}>
                <ExpensesPage />
              </RoleRoute>
            }
          />
          <Route path="/messages" element={<ChatPanel />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/my-profile" element={<MyProfilePage />} />
          <Route
            path="/employee-profiles"
            element={
              <RoleRoute roles={["super_user", "hr"]}>
                <EmployeeProfilesPage />
              </RoleRoute>
            }
          />
          <Route
            path="/interviews"
            element={
              <RoleRoute roles={["super_user", "hr"]}>
                <InterviewsPage />
              </RoleRoute>
            }
          />

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
          {/* My Drive — open to ALL authenticated roles */}
          <Route path="/documents" element={<Documents />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/products" element={<Products />} />
          <Route
            path="/projects"
            element={
              <RoleRoute roles="super_user">
                <Projects />
              </RoleRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <RoleRoute roles="super_user">
                <ProjectFormPage />
              </RoleRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <RoleRoute roles="super_user">
                <ProjectDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="/projects/:id/edit"
            element={
              <RoleRoute roles="super_user">
                <ProjectFormPage />
              </RoleRoute>
            }
          />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/social" element={<Social />} />
          <Route path="/services" element={<Services />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/crm-teamspaces" element={<CRMTeamspaces />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/visits" element={<Visits />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route
            path="/invoices"
            element={
              <RoleRoute roles={["super_user", "admin"]}>
                <Invoices />
              </RoleRoute>
            }
          />
          <Route path="/sales-inbox" element={<SalesInbox />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/price-books" element={<PriceBooks />} />
          <Route path="/ct" element={<CT />} />

          {/* ---- Attendance Module ---- */}
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/admin/attendance" element={
            <RoleRoute roles={["super_user", "admin", "hr"]}>
              <AdminAttendanceDashboard />
            </RoleRoute>
          } />
          <Route path="/leave" element={<LeavePage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
          <Route path="/attendance-reports" element={<AttendanceReportsPage />} />

          {/* ---- Storage Admin ---- */}
          <Route
            path="/admin/storage"
            element={
              <RoleRoute roles="super_user">
                <StorageAdminPage />
              </RoleRoute>
            }
          />

        </Route>

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
