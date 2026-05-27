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
import { ACCESS_GROUPS, canAccess, normalizeRole } from "./config/access";
import { OnboardingProvider } from "./features/Onboarding/OnboardingProvider";
import useOnboarding from "./features/Onboarding/useOnboarding";

/* ========== Lazy Modules ========== */
const WelcomeAnimation         = lazy(() => import("./Pages/WelcomeAnimation"));
const AdminDevices             = lazy(() => import("./Pages/AdminDevices"));
const OrgHierarchyPage         = lazy(() => import("./Pages/OrgHierarchyPage"));
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
const MeetingsPage             = lazy(() => import("./features/Meetings/MeetingsPage"));
const Products                 = lazy(() => import("./features/Products/Products"));
const Projects                 = lazy(() => import("./features/Projects/Projects"));
const ProjectDetailPage        = lazy(() => import("./features/Projects/ProjectDetailPage"));
const ProjectFormPage          = lazy(() => import("./features/Projects/ProjectFormPage"));
const ShowcasePage             = lazy(() => import("./features/Projects/ShowcasePage"));
const Quotes                   = lazy(() => import("./features/Quotes/Quotes"));
const Social                   = lazy(() => import("./features/Social/Social"));
const ContentCalendarPage      = lazy(() => import("./features/DigitalMedia/ContentCalendarPage"));
const MediaLibraryPage         = lazy(() => import("./features/DigitalMedia/MediaLibraryPage"));
const AudiencePage             = lazy(() => import("./features/DigitalMedia/AudiencePage"));
const BudgetOverviewPage       = lazy(() => import("./features/DigitalMedia/BudgetOverviewPage"));
const ApprovalsPage            = lazy(() => import("./features/DigitalMedia/ApprovalsPage"));
const UnifiedInboxPage         = lazy(() => import("./features/DigitalMedia/UnifiedInboxPage"));
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
const OnboardingPage           = lazy(() => import("./features/Onboarding/OnboardingPage"));
const MailPage                 = lazy(() => import("./features/Mail/MailPage"));
const ZohoSettingsPanel        = lazy(() => import("./features/Mail/ZohoSettingsPanel"));
const PartnerDashboard         = lazy(() => import("./features/Partner/PartnerDashboard"));
const PartnerVendors           = lazy(() => import("./features/Partner/PartnerVendors"));
const PartnerProjects          = lazy(() => import("./features/Partner/PartnerProjects"));
const PartnerProjectDetail     = lazy(() => import("./features/Partner/PartnerProjectDetail"));
const AdminPartners            = lazy(() => import("./features/Partner/AdminPartners"));
const AdminPartnerDetail       = lazy(() => import("./features/Partner/AdminPartnerDetail"));

/* ========== Protected Wrapper ========== */
function ProtectedApp() {
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
    <OnboardingProvider>
      <Outlet />
    </OnboardingProvider>
  );
}

function ProtectedLayout() {
  useOnboarding();

  return (
    <ChatProvider>
      <MainLayout />
    </ChatProvider>
  );
}

function RoleRoute({ roles, children, redirectTo = "/dashboard" }) {
  const role = normalizeRole(localStorage.getItem("userRole"));
  const normalizedRoles = Array.isArray(roles)
    ? roles.map(normalizeRole)
    : [normalizeRole(roles)];
  
  const allowed = canAccess(role, normalizedRoles);
  if (!allowed) {
    // Partners attempting employee/internal routes are returned to the partner dashboard.
    const partnerRedirect = role === "partner" ? "/partner/dashboard" : redirectTo;
    return <Navigate to={partnerRedirect} replace state={{ message: "This section is not available for Partner accounts." }} />;
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
            <Route element={<ProtectedApp />}>
              <Route path="/onboarding" element={<RoleRoute roles={ACCESS_GROUPS.personal}><OnboardingPage /></RoleRoute>} />
              <Route element={<ProtectedLayout />}>
              <Route path="/welcome" element={<WelcomeAnimation />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Partner panel routes are isolated from employee modules but available to admin/super admin for support. */}
              <Route path="/partner/dashboard" element={<RoleRoute roles={ACCESS_GROUPS.partner}><PartnerDashboard /></RoleRoute>} />
              <Route path="/partner/vendors" element={<RoleRoute roles={ACCESS_GROUPS.partner}><PartnerVendors /></RoleRoute>} />
              <Route path="/partner/projects" element={<RoleRoute roles={ACCESS_GROUPS.partner}><PartnerProjects /></RoleRoute>} />
              <Route path="/partner/projects/:id" element={<RoleRoute roles={ACCESS_GROUPS.partner}><PartnerProjectDetail /></RoleRoute>} />
              <Route path="/admin/partners" element={<RoleRoute roles={ACCESS_GROUPS.admin}><AdminPartners /></RoleRoute>} />
              <Route path="/admin/partners/:id" element={<RoleRoute roles={ACCESS_GROUPS.admin}><AdminPartnerDetail /></RoleRoute>} />
              
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

              <Route path="/organization-chart" element={
                <RoleRoute roles="super_user">
                  <OrgHierarchyPage />
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
              <Route path="/mail" element={<MailPage />} />
              <Route path="/tickets" element={<RoleRoute roles={ACCESS_GROUPS.tickets}><TicketsPage /></RoleRoute>} />
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
              <Route path="/leads" element={<RoleRoute roles={ACCESS_GROUPS.crmLeads}><Leads /></RoleRoute>} />
              <Route path="/accounts" element={<RoleRoute roles={ACCESS_GROUPS.crmAccounts}><Accounts /></RoleRoute>} />
              <Route path="/tasks" element={<RoleRoute roles={ACCESS_GROUPS.tasks}><Tasks /></RoleRoute>} />
              <Route path="/calls" element={<RoleRoute roles={ACCESS_GROUPS.calls}><Calls /></RoleRoute>} />
              <Route path="/cases" element={<RoleRoute roles={ACCESS_GROUPS.cases}><Cases /></RoleRoute>} />
              <Route path="/contacts" element={<RoleRoute roles={ACCESS_GROUPS.crmContacts}><Contacts /></RoleRoute>} />

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

              <Route path="/sales" element={<RoleRoute roles={ACCESS_GROUPS.financeBusiness}><Sales /></RoleRoute>} />
              <Route path="/sales-orders" element={<RoleRoute roles={ACCESS_GROUPS.financeBusiness}><SalesOrders /></RoleRoute>} />
              <Route path="/reports" element={<RoleRoute roles={ACCESS_GROUPS.reports}><Reports /></RoleRoute>} />
              <Route path="/deals" element={<RoleRoute roles={ACCESS_GROUPS.crmDeals}><Deals /></RoleRoute>} />
              <Route path="/documents" element={<RoleRoute roles={ACCESS_GROUPS.personal}><Documents /></RoleRoute>} />
              <Route path="/forecasts" element={<RoleRoute roles={ACCESS_GROUPS.forecasts}><Forecasts /></RoleRoute>} />
              <Route path="/meetings" element={<RoleRoute roles={ACCESS_GROUPS.meetings}><MeetingsPage /></RoleRoute>} />
              <Route path="/products" element={<RoleRoute roles={ACCESS_GROUPS.products}><Products /></RoleRoute>} />
              
              {/* Projects */}
              <Route path="/projects" element={<RoleRoute roles={ACCESS_GROUPS.projects}><Projects /></RoleRoute>} />
              <Route path="/projects/new" element={<RoleRoute roles={ACCESS_GROUPS.projects}><ProjectFormPage /></RoleRoute>} />
              <Route path="/projects/:id" element={<RoleRoute roles={ACCESS_GROUPS.projects}><ProjectDetailPage /></RoleRoute>} />
              <Route path="/projects/:id/edit" element={<RoleRoute roles={ACCESS_GROUPS.projects}><ProjectFormPage /></RoleRoute>} />
              
              <Route path="/showcase" element={
                <RoleRoute roles="super_user" redirectTo="/unauthorized">
                  <ShowcasePage />
                </RoleRoute>
              } />

              <Route path="/quotes" element={<RoleRoute roles={ACCESS_GROUPS.quotes}><Quotes /></RoleRoute>} />
              <Route path="/social" element={<RoleRoute roles={ACCESS_GROUPS.marketing}><Social /></RoleRoute>} />
              <Route path="/content-calendar" element={<RoleRoute roles={["super_user", "digital_media"]}><ContentCalendarPage /></RoleRoute>} />
              <Route path="/media-library" element={<RoleRoute roles={["super_user", "digital_media"]}><MediaLibraryPage /></RoleRoute>} />
              <Route path="/audience" element={<RoleRoute roles={["super_user", "digital_media"]}><AudiencePage /></RoleRoute>} />
              <Route path="/budget-overview" element={<RoleRoute roles={["super_user", "digital_media"]}><BudgetOverviewPage /></RoleRoute>} />
              <Route path="/approvals" element={<RoleRoute roles={["super_user", "digital_media", "admin", "hr"]}><ApprovalsPage /></RoleRoute>} />
              <Route path="/social-inbox" element={<RoleRoute roles={["super_user", "digital_media"]}><UnifiedInboxPage /></RoleRoute>} />
              <Route path="/services" element={<RoleRoute roles={ACCESS_GROUPS.marketing}><Services /></RoleRoute>} />
              <Route path="/vendors" element={<RoleRoute roles={ACCESS_GROUPS.vendors}><Vendors /></RoleRoute>} />
              <Route path="/crm-teamspaces" element={<RoleRoute roles={ACCESS_GROUPS.marketing}><CRMTeamspaces /></RoleRoute>} />
              <Route path="/purchase-orders" element={<RoleRoute roles={ACCESS_GROUPS.purchaseOrders}><PurchaseOrders /></RoleRoute>} />
              <Route path="/visits" element={<RoleRoute roles={ACCESS_GROUPS.visits}><Visits /></RoleRoute>} />
              <Route path="/solutions" element={<RoleRoute roles={ACCESS_GROUPS.solutions}><Solutions /></RoleRoute>} />
              
              <Route path="/invoices" element={
                <RoleRoute roles={["super_user", "admin"]}>
                  <Invoices />
                </RoleRoute>
              } />

              <Route path="/sales-inbox" element={<RoleRoute roles={ACCESS_GROUPS.marketing}><SalesInbox /></RoleRoute>} />
              <Route path="/campaigns" element={<RoleRoute roles={ACCESS_GROUPS.marketing}><Campaigns /></RoleRoute>} />
              <Route path="/price-books" element={<RoleRoute roles={ACCESS_GROUPS.priceBooks}><PriceBooks /></RoleRoute>} />
              <Route path="/ct" element={<RoleRoute roles={ACCESS_GROUPS.marketing}><CT /></RoleRoute>} />

              {/* Attendance */}
              <Route path="/attendance" element={
                <RoleRoute roles={ACCESS_GROUPS.attendance}>
                  {normalizeRole(localStorage.getItem("userRole")) === 'super_user' ? <AdminAttendanceDashboard /> : <AttendancePage />}
                </RoleRoute>
              } />
              <Route path="/admin/attendance" element={
                <RoleRoute roles={ACCESS_GROUPS.attendanceAdmin}>
                  <AdminAttendanceDashboard />
                </RoleRoute>
              } />
              <Route path="/leave" element={<RoleRoute roles={ACCESS_GROUPS.personal}><LeavePage /></RoleRoute>} />
              <Route path="/holidays" element={<RoleRoute roles={ACCESS_GROUPS.peopleOps}><HolidaysPage /></RoleRoute>} />
              <Route path="/attendance-reports" element={<RoleRoute roles={ACCESS_GROUPS.attendanceAdmin}><AttendanceReportsPage /></RoleRoute>} />

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
                <Route path="/settings/zoho" element={
                  <RoleRoute roles="super_user">
                    <ZohoSettingsPanel />
                  </RoleRoute>
                } />
              </Route>
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
