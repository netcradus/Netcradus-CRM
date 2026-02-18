import React, { useState } from "react";
import { FaSearch, FaBars, FaTimes } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome, FaUser, FaPhone, FaFileAlt, FaBuilding,
  FaHandshake, FaTasks, FaCalendarAlt, FaPhoneSquareAlt, FaBox, FaFileInvoice,
  FaClipboardList, FaTruck, FaEnvelopeOpenText, FaBullhorn, FaUserTie, FaBook,
  FaBriefcase, FaBookOpen, FaFile, FaChartBar, FaMapMarkerAlt, FaComments,
  FaCogs, FaProjectDiagram, FaTools, FaUserFriends
} from "react-icons/fa";
import "./Sidebar.css";

function Sidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();  // ✅ Tracks current route for active state

  const userRole = localStorage.getItem("userRole");

  const adminMenuItems = [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
    { label: "User Management", path: "/admin-dashboard", icon: <FaUserTie /> },
    { label: "Leads", path: "/leads", icon: <FaUser /> },
    { label: "Contacts", path: "/contacts", icon: <FaPhone /> },
    { label: "Accounts", path: "/accounts", icon: <FaBuilding /> },
    { label: "Deals", path: "/deals", icon: <FaHandshake /> },
    { label: "Tasks", path: "/tasks", icon: <FaTasks /> },
    { label: "Meetings", path: "/meetings", icon: <FaCalendarAlt /> },
    { label: "Calls", path: "/calls", icon: <FaPhoneSquareAlt /> },
    { label: "Products", path: "/products", icon: <FaBox /> },
    { label: "Quotes", path: "/quotes", icon: <FaFileInvoice /> },
    { label: "Sales Orders", path: "/sales-orders", icon: <FaClipboardList /> },
    { label: "Purchase Orders", path: "/purchase-orders", icon: <FaTruck /> },
    { label: "Invoices", path: "/invoices", icon: <FaFileAlt /> },
    { label: "SalesInbox", path: "/sales-inbox", icon: <FaEnvelopeOpenText /> },
    { label: "Campaigns", path: "/campaigns", icon: <FaBullhorn /> },
    { label: "Vendors", path: "/vendors", icon: <FaUserTie /> },
    { label: "Price Books", path: "/price-books", icon: <FaBook /> },
    { label: "Cases", path: "/cases", icon: <FaBriefcase /> },
    { label: "Solutions", path: "/solutions", icon: <FaBookOpen /> },
    { label: "Documents", path: "/documents", icon: <FaFile /> },
    { label: "Forecasts", path: "/forecasts", icon: <FaChartBar /> },
    { label: "Visits", path: "/visits", icon: <FaMapMarkerAlt /> },
    { label: "Social", path: "/social", icon: <FaComments /> },
    { label: "Services", path: "/services", icon: <FaCogs /> },
    { label: "Projects", path: "/projects", icon: <FaProjectDiagram /> },
    { label: "CT", path: "/ct", icon: <FaTools /> },
    { label: "CRM Teamspaces", path: "/crm-teamspaces", icon: <FaUserFriends /> }
  ];

  const userMenuItems = [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
    { label: "Leads", path: "/leads", icon: <FaUser /> },
    { label: "Contacts", path: "/contacts", icon: <FaPhone /> },
    { label: "Deals", path: "/deals", icon: <FaHandshake /> },
    { label: "Tasks", path: "/tasks", icon: <FaTasks /> },
    { label: "Calls", path: "/calls", icon: <FaPhoneSquareAlt /> },
  ];

  const menuItems = userRole === "admin" ? adminMenuItems : userMenuItems;

  const filteredMenu = [...menuItems]
    .filter(item => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => searchTerm ? a.label.localeCompare(b.label) : 0);

  return (
  <>
    {/* Floating button shown ONLY when sidebar is closed */}
    {!isOpen && (
      <button
        className="sidebar-toggle-btn btn-outside"
        onClick={() => setIsOpen(true)}
        title="Expand sidebar"
      >
        <FaBars />
      </button>
    )}

    <div className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}>

      {/* ✅ Toggle button INSIDE sidebar at top-left */}
      <div className="sidebar-header">
        <button
          className="sidebar-toggle-btn-inner"
          onClick={() => setIsOpen(!isOpen)}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <FaTimes /> : <FaBars />}
        </button>

        {isOpen && (
          <div className="logo-container">
            <img src="/NETCRADUS logo2.png" alt="Netcradus Logo" className="logo-image" />
          </div>
        )}
      </div>

      {isOpen && (
        <>
          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <nav>
            <ul>
              {filteredMenu.length > 0 ? (
                filteredMenu.map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={index} className={isActive ? "active" : ""}>
                      <Link to={item.path}>
                        {item.icon}
                        <span className="nav-label">{item.label}</span>
                      </Link>
                    </li>
                  );
                })
              ) : (
                <li className="no-result">No results found</li>
              )}
            </ul>
          </nav>
        </>
      )}
    </div>
  </>
);
}

export default Sidebar;