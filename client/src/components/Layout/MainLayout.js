import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Dashboard/Sidebar";
import Topbar from "../Topbar/Topbar";
import ChatLauncher from "../Chat/ChatLauncher";
import "./MainLayout.css";

const MainLayout = () => {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-shell">
          <Outlet />
        </div>
      </div>
      <ChatLauncher />
    </div>
  );
};

export default MainLayout;
