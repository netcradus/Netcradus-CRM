import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";


import { ChatProvider } from "./context/ChatContext";
import ErrorBoundary from "./components/ErrorBoundary";

/* ========== Pages (Eager - needed for initial load/auth) ========== */
import Login from "./Pages/Login";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";

/* ========== Layout ========== */
import MainLayout from "./components/Layout/MainLayout";

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
const Cases                    = lazy(() => import("./features/Cases/Cases"));
const Deals                    = lazy(() => import("./features/Deals/Deals"));
const Documents                = lazy(() => import("./features/Documents/Documents"));
const Forecasts                = lazy(() => import("./features/Forecasts/Forecasts"));
const Tasks                    = lazy(() => import("./features/Tasks/Tasks"));
const Accounts                 = lazy(() => import("./features/Accounts/Accounts"));
const Meetings                 = lazy(() => import("./features/Meetings/Meetings"));
const Products                 = lazy(() => import("./features/Products/Products"));
const Projects                 = lazy(() => import("./features/Projects/Projects"));
const ProjectDetailPage        = lazy(() => import("./features/Projects/ProjectDetailPage"));
const ProjectFormPage          = lazy(() => import("./features/Projects/ProjectFormPage"));
const ShowcasePage             = lazy(() => import("./features/Projects/ShowcasePage"));
const Quotes                   = lazy(() => import("./features/Quotes/Quotes"));
const Social                   = lazy(() => import("./features/Social/Social"));
const Services                 = lazy(() => import("./features/Services/Services"));
const Vendors                  = lazy(() => import("./features/Vendors/Vendors"));
const Sales                    = lazy(() => import("./features/Sales/Sales"));
const SalesOrders              = lazy(() => import("./features/SalesOrders/SalesOrders"));
const CRMTeamspaces            = lazy(() => import("./features/CRMTeamspaces/CRMTeamspaces"));
const PurchaseOrders           = lazy(() => import("./features/PurchaseOrders/PurchaseOrders"));
const Visits                   = lazy(() => import("./features/Visits/Visits"));
const Invoices                 = lazy(() => import("./features/Invoices/Invoices"));
const SalesInbox               = lazy(() => import("./features/SalesInbox/SalesInbox"));
const Campaigns                = lazy(() => import("./features/Campaigns/Campaigns"));
const PriceBooks               = lazy(() => import("./features/PriceBooks/PriceBooks"));
const Solutions                = lazy(() => import("./features/Solutions/Solutions"));
const CT                       = lazy(() => import("./features/CT/CT"));

const AttendancePage           = lazy(() => import("./features/Attendance/AttendancePage"));
const LeavePage                = lazy(() => import("./features/Attendance/LeavePage"));
const HolidaysPage             = lazy(() => import("./features/Attendance/HolidaysPage"));
const AttendanceReportsPage    = lazy(() => import("./features/Attendance/AttendanceReportsPage"));
const AdminAttendanceDashboard = lazy(() => import("./features/Attendance/AdminAttendanceDashboard"));

const TicketsPage              = lazy(() => import("./features/Tickets/TicketsPage"));
const ExpensesPage             = lazy(() => import("./features/Expenses/ExpensesPage"));
const EmployeeProfilesPage     = lazy(() => import("./features/EmployeeProfiles/EmployeeProfilesPage"));
const MyProfilePage            = lazy(() => import("./features/MyProfile/MyProfilePage"));
const InterviewsPage           = lazy(() => import("./features/Interviews/InterviewsPage"));
const StorageAdminPage         = lazy(() => import("./features/Documents/admin/StorageAdminPage"));
const ManagementHub            = lazy(() => import("./features/Management/ManagementHub"));
const PasswordManager          = lazy(() => import("./features/PasswordManager/PasswordManager"));

/* ========== Protected Wrapper ========== */
function ProtectedLayout() {
  const rawToken = localStorage.getItem("token");
  const rawRole = localStorage.getItem("userRole");
  
  const token = (rawToken && rawToken !== "null" && rawToken !== "undefined") ? rawToken : null;
  const userRole = (rawRole && rawRole !== "null" && rawRole !== "undefined") ? String(rawRole).trim().toLowerCase() : null;
  
  if (!token || !userRole) {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    return <Navigate to="/login" replace />;
  }

  return (
    <ChatProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </ChatProvider>
  );
}

function RoleRoute({ roles, children, redirectTo = "/dashboard" }) {
  const role = String(localStorage.getItem("userRole") || "").trim().toLowerCase();
  const normalizedRoles = Array.isArray(roles)
    ? roles.map((item) => String(item).trim().toLowerCase())
    : [String(roles).trim().toLowerCase()];
  
  const allowed = normalizedRoles.includes(role);
  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

function UnauthorizedPage() {
  return (
    <div className="nc-page">
      <div className="nc-panel nc-section">
        <h1 className="nc-hero-title">403 Unauthorized</h1>
        <p className="nc-hero-subtitle">You do not have permission to open this page.</p>
      </div>
    </div>
  );
}

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<div className="loading-fallback">Loading...</div>}>
          <Routes>
            {/* ================= PUBLIC ================= */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* ================= PROTECTED ================= */}
            <Route element={<ProtectedLayout />}>
              <Route path="/welcome" element={<WelcomeAnimation />} />
              <Route path="/dashboard" element={<Dashboard />} />
              
              <Route path="/user-management" element={
                <RoleRoute roles="super_user">
                  <UserManagement />
                </RoleRoute>
              } />

              <Route path="/admin/devices" element={
                <RoleRoute roles="super_user">
                  <AdminDevices />
                </RoleRoute>
              } />

              <Route path="/expenses" element={
                <RoleRoute roles={["super_user", "admin"]}>
                  <ExpensesPage />
                </RoleRoute>
              } />

              <Route
                path="/messages"
                element={
                  <div className="dashboard-container chat-page-shell">
                    <ChatPanel />
                  </div>
                }
              />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/my-profile" element={<MyProfilePage />} />
              
              <Route path="/employee-profiles" element={
                <RoleRoute roles={["super_user", "hr"]}>
                  <EmployeeProfilesPage />
                </RoleRoute>
              } />

              <Route path="/interviews" element={
                <RoleRoute roles={["super_user", "hr"]}>
                  <InterviewsPage />
                </RoleRoute>
              } />

              {/* ---- Modules ---- */}
              <Route path="/leads" element={<Leads />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calls" element={<Calls />} />
              <Route path="/cases" element={<Cases />} />
              <Route path="/contacts" element={<Contacts />} />

              {/* Management Hub Routes */}
              <Route path="/management" element={
                <RoleRoute roles={["super_user", "management"]}>
                  <Navigate to="/management/business/overview" replace />
                </RoleRoute>
              } />
              <Route path="/management/business/clients" element={
                <RoleRoute roles={["super_user", "management"]}>
                  <ManagementHub />
                </RoleRoute>
              } />
              <Route path="/management/business/tenders" element={
                <RoleRoute roles={["super_user", "management"]}>
                  <ManagementHub />
                </RoleRoute>
              } />
              <Route path="/management/business/overview" element={
                <RoleRoute roles={["super_user", "management"]}>
                  <ManagementHub />
                </RoleRoute>
              } />
              <Route path="/management/day-to-day/purchases" element={
                <RoleRoute roles={["super_user", "management"]}>
                  <ManagementHub />
                </RoleRoute>
              } />
              <Route path="/management/day-to-day/purchase-items" element={
                <RoleRoute roles={["super_user", "management"]}>
                  <ManagementHub />
                </RoleRoute>
              } />
              <Route path="/management/day-to-day/invoices" element={
                <RoleRoute roles={["super_user", "management"]}>
                  <ManagementHub />
                </RoleRoute>
              } />

              <Route path="/sales" element={<Sales />} />
              <Route path="/sales-orders" element={<SalesOrders />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/forecasts" element={<Forecasts />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/products" element={<Products />} />
              
              {/* Projects */}
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/new" element={<ProjectFormPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/projects/:id/edit" element={<ProjectFormPage />} />
              
              <Route path="/showcase" element={
                <RoleRoute roles="super_user" redirectTo="/unauthorized">
                  <ShowcasePage />
                </RoleRoute>
              } />

              <Route path="/quotes" element={<Quotes />} />
              <Route path="/social" element={<Social />} />
              <Route path="/services" element={<Services />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/crm-teamspaces" element={<CRMTeamspaces />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/visits" element={<Visits />} />
              <Route path="/solutions" element={<Solutions />} />
              
              <Route path="/invoices" element={
                <RoleRoute roles={["super_user", "admin"]}>
                  <Invoices />
                </RoleRoute>
              } />

              <Route path="/sales-inbox" element={<SalesInbox />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/price-books" element={<PriceBooks />} />
              <Route path="/ct" element={<CT />} />

              {/* Attendance */}
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/admin/attendance" element={
                <RoleRoute roles={["super_user", "admin", "hr"]}>
                  <AdminAttendanceDashboard />
                </RoleRoute>
              } />
              <Route path="/leave" element={<LeavePage />} />
              <Route path="/holidays" element={<HolidaysPage />} />
              <Route path="/attendance-reports" element={<AttendanceReportsPage />} />

              <Route path="/admin/storage" element={
                <RoleRoute roles="super_user">
                  <StorageAdminPage />
                </RoleRoute>
              } />

              <Route path="/password-manager" element={
                <RoleRoute roles="super_user">
                  <PasswordManager />
                </RoleRoute>
              } />
            </Route>

            {/* ================= FALLBACK ================= */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
