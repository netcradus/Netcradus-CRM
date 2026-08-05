import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../Dashboard/Sidebar";
import Topbar from "../Topbar/Topbar";
import ChatLauncher from "../Chat/ChatLauncher";
import OnboardingBanner from "../../features/Onboarding/OnboardingBanner";

const MainLayout = () => {
  const location = useLocation();
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setIsManuallyExpanded(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleSidebar = () => {
    setIsMobileSidebarOpen((current) => !current);
  };

  const isSidebarExpanded = isManuallyExpanded;

  return (
    <div className="dashboard-layout">
      <Sidebar
        isExpanded={isSidebarExpanded}
        onSetExpanded={setIsManuallyExpanded}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      {isMobileSidebarOpen && <button className="sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} aria-label="Close navigation" />}
      <div className={`dashboard-main ${isSidebarExpanded ? "is-sidebar-expanded" : ""}`}>
        <Topbar
          onToggleSidebar={handleToggleSidebar}
        />
        <OnboardingBanner />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
      <ChatLauncher />
    </div>
  );
};

export default MainLayout;
