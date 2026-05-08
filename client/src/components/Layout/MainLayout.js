import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Dashboard/Sidebar";
import Topbar from "../Topbar/Topbar";
import ChatLauncher from "../Chat/ChatLauncher";

const MainLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <Topbar />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
      <ChatLauncher />
    </div>
  );
};

export default MainLayout;
