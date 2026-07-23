import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Dashboard/Sidebar";
import Topbar from "../Topbar/Topbar";
import ChatLauncher from "../Chat/ChatLauncher";
import OnboardingBanner from "../../features/Onboarding/OnboardingBanner";

const MainLayout = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarExpanded(false);
      } else {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 768) {
      setIsMobileSidebarOpen((current) => !current);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar
        isExpanded={isSidebarExpanded}
        isMobileOpen={isMobileSidebarOpen}
        onToggleExpanded={() => setIsSidebarExpanded((current) => !current)}
        onSetExpanded={setIsSidebarExpanded}
        onHoverExpanded={() => {
          if (window.innerWidth > 768) {
            setIsSidebarExpanded(true);
          }
        }}
        onHoverCollapsed={() => {
          if (window.innerWidth > 768) {
            setIsSidebarExpanded(false);
          }
        }}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      {isMobileSidebarOpen && <button className="sidebar-backdrop" onClick={() => setIsMobileSidebarOpen(false)} aria-label="Close navigation" />}
      <div className={`dashboard-main ${isSidebarExpanded ? "is-sidebar-expanded" : ""}`}>
        <Topbar
          onToggleSidebar={handleToggleSidebar}
          isSidebarExpanded={isSidebarExpanded}
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
