import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaChevronDown, FaBars, FaTimes } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome, FaUser, FaPhone, FaFileAlt, FaBuilding,
  FaHandshake, FaTasks, FaCalendarAlt, FaPhoneSquareAlt, FaBox, FaFileInvoice,
  FaClipboardList, FaTruck, FaEnvelopeOpenText, FaBullhorn, FaUserTie, FaBook,
  FaBriefcase, FaBookOpen, FaFile, FaChartBar, FaMapMarkerAlt, FaComments,
  FaCogs, FaProjectDiagram, FaTools, FaUserFriends, FaSignOutAlt, FaLayerGroup
} from "react-icons/fa";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";

// ─── Menu config ─────────────────────────────────────────────────────────────
const roleMenus = {
  admin: [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
    { label: "User Management", path: "/user-management", icon: <FaUserFriends /> },
    {
      label: "CRM",
      icon: <FaLayerGroup />,
      children: [
        { label: "Leads", path: "/leads", icon: <FaUser /> },
        { label: "Contacts", path: "/contacts", icon: <FaPhone /> },
        { label: "Accounts", path: "/accounts", icon: <FaBuilding /> },
        { label: "Deals", path: "/deals", icon: <FaHandshake /> },
        { label: "Tasks", path: "/tasks", icon: <FaTasks /> },
        { label: "Meetings", path: "/meetings", icon: <FaCalendarAlt /> },
        { label: "Calls", path: "/calls", icon: <FaPhoneSquareAlt /> },
      ],
    },
    {
      label: "Sales",
      icon: <FaChartBar />,
      children: [
        { label: "Products", path: "/products", icon: <FaBox /> },
        { label: "Quotes", path: "/quotes", icon: <FaFileInvoice /> },
        { label: "Sales Orders", path: "/sales-orders", icon: <FaClipboardList /> },
        { label: "Purchase Orders", path: "/purchase-orders", icon: <FaTruck /> },
        { label: "Invoices", path: "/invoices", icon: <FaFileAlt /> },
        { label: "Sales Inbox", path: "/sales-inbox", icon: <FaEnvelopeOpenText /> },
        { label: "Price Books", path: "/price-books", icon: <FaBook /> },
        { label: "Vendors", path: "/vendors", icon: <FaUserTie /> },
      ],
    },
    {
      label: "Marketing",
      icon: <FaBullhorn />,
      children: [
        { label: "Campaigns", path: "/campaigns", icon: <FaBullhorn /> },
        { label: "Social", path: "/social", icon: <FaComments /> },
        { label: "Visits", path: "/visits", icon: <FaMapMarkerAlt /> },
      ],
    },
    {
      label: "Support",
      icon: <FaBriefcase />,
      children: [
        { label: "Cases", path: "/cases", icon: <FaBriefcase /> },
        { label: "Solutions", path: "/solutions", icon: <FaBookOpen /> },
        { label: "Documents", path: "/documents", icon: <FaFile /> },
        { label: "Forecasts", path: "/forecasts", icon: <FaChartBar /> },
      ],
    },
    {
      label: "Operations",
      icon: <FaCogs />,
      children: [
        { label: "Services", path: "/services", icon: <FaCogs /> },
        { label: "Projects", path: "/projects", icon: <FaProjectDiagram /> },
        { label: "CT", path: "/ct", icon: <FaTools /> },
        { label: "CRM Teamspaces", path: "/crm-teamspaces", icon: <FaUserFriends /> },
        { label: "Reports", path: "/reports", icon: <FaChartBar /> },
      ],
    },
  ],

  user: [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
    { label: "Leads", path: "/leads", icon: <FaUser /> },
    { label: "Contacts", path: "/contacts", icon: <FaPhone /> },
    { label: "Deals", path: "/deals", icon: <FaHandshake /> },
    { label: "Tasks", path: "/tasks", icon: <FaTasks /> },
    { label: "Calls", path: "/calls", icon: <FaPhoneSquareAlt /> },
  ],

  support: [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
    { label: "Cases", path: "/cases", icon: <FaBriefcase /> },
    { label: "Solutions", path: "/solutions", icon: <FaBookOpen /> },
    { label: "Contacts", path: "/contacts", icon: <FaPhone /> },
    { label: "Reports", path: "/reports", icon: <FaChartBar /> },
  ],

  sales: [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
    { label: "Leads", path: "/leads", icon: <FaUser /> },
    { label: "Deals", path: "/deals", icon: <FaHandshake /> },
    { label: "Accounts", path: "/accounts", icon: <FaBuilding /> },
    { label: "Quotes", path: "/quotes", icon: <FaFileInvoice /> },
    { label: "Sales Orders", path: "/sales-orders", icon: <FaClipboardList /> },
    { label: "Reports", path: "/reports", icon: <FaChartBar /> },
  ],

  hr: [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
    { label: "Employees", path: "/contacts", icon: <FaUserTie /> },
    { label: "Tasks", path: "/tasks", icon: <FaTasks /> },
    { label: "Meetings", path: "/meetings", icon: <FaCalendarAlt /> },
    { label: "Reports", path: "/reports", icon: <FaChartBar /> },
  ],

  it: [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
    {
      label: "IT Management",
      icon: <FaCogs />,
      children: [
        { label: "Projects", path: "/projects", icon: <FaProjectDiagram /> },
        { label: "CT", path: "/ct", icon: <FaTools /> },
        { label: "CRM Teamspaces", path: "/crm-teamspaces", icon: <FaUserFriends /> },
      ],
    },
  ],

  digital_media: [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
    {
      label: "Campaigns",
      icon: <FaBullhorn />,
      children: [
        { label: "Campaigns", path: "/campaigns", icon: <FaBullhorn /> },
        { label: "Social", path: "/social", icon: <FaComments /> },
        { label: "Visits", path: "/visits", icon: <FaMapMarkerAlt /> },
        { label: "Reports", path: "/reports", icon: <FaChartBar /> },
      ],
    },
  ],
};

// ─── NavGroup — dropdown opens BELOW the button ───────────────────────────────
function NavGroup({ item, isHovered, location, isMobileOpen, onLinkClick }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isChildActive = item.children?.some(c => location.pathname === c.path);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close when sidebar collapses
  useEffect(() => {
    if (!isHovered && !isMobileOpen) setOpen(false);
  }, [isHovered, isMobileOpen]);

  return (
    <li className="nav-group" ref={ref}>
      {/* Trigger button */}
      <button
        className={`nav-group-btn ${isChildActive ? "group-active" : ""} ${open ? "group-open" : ""}`}
        onClick={() => setOpen(o => !o)}
        title={!isHovered && !isMobileOpen ? item.label : undefined}
      >
        <span className="nav-icon">{item.icon}</span>
        {(isHovered || isMobileOpen) && (
          <>
            <span className="nav-label">{item.label}</span>
            <span className={`nav-chevron ${open ? "rotated" : ""}`}>
              <FaChevronDown />
            </span>
          </>
        )}
      </button>

      {/* Dropdown panel — rendered below the button */}
      {open && (
        <div className="nav-dropdown">
          <div className="dropdown-header">{item.label}</div>
          <ul>
            {item.children.map((child, i) => {
              const isActive = location.pathname === child.path;
              return (
                <li key={i}>
                  <Link
                    to={child.path}
                    className={`dropdown-link ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setOpen(false);
                      onLinkClick();
                    }}
                  >
                    <span className="nav-icon">{child.icon}</span>
                    <span>{child.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────
function Sidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = localStorage.getItem("userRole");
  const menuItems = roleMenus[userRole] || [];

  // Flatten all items for search
  const allItems = menuItems.flatMap(item =>
    item.children ? item.children : [item]
  );

  const filteredMenu = searchTerm
    ? allItems.filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : null;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileOpen]);

  const handleLinkClick = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Hamburger Toggle Button */}
      <button 
        className={`mobile-hamburger ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="mobile-overlay" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar ${isHovered ? "expanded" : "collapsed"} ${isMobileOpen ? "mobile-open" : ""}`}
        onMouseEnter={() => window.innerWidth > 768 && setIsHovered(true)}
        onMouseLeave={() => window.innerWidth > 768 && setIsHovered(false)}
      >
        {/* LOGO */}
        <div className="sidebar-logo">
          <img src="/sidebar-logo.jpeg" alt="Company Logo" className="logo-img" />
          {(isHovered || isMobileOpen) && (
            <span className="company-name">
              <img src="/netcradus.png" alt="Company Logo" />
            </span>
          )}
        </div>

        {/* SEARCH */}
        {(isHovered || isMobileOpen) && (
          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <FaSearch />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* NAV */}
        <nav className="sidebar-nav">
          <ul>
            {filteredMenu
              ? filteredMenu.map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                    onClick={handleLinkClick}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {(isHovered || isMobileOpen) && <span>{item.label}</span>}
                  </Link>
                </li>
              ))
              : menuItems.map((item, i) =>
                item.children ? (
                  <NavGroup
                    key={i}
                    item={item}
                    isHovered={isHovered}
                    isMobileOpen={isMobileOpen}
                    location={location}
                    onLinkClick={handleLinkClick}
                  />
                ) : (
                  <li key={i}>
                    <Link
                      to={item.path}
                      className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                      title={!isHovered && !isMobileOpen ? item.label : undefined}
                      onClick={handleLinkClick}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      {(isHovered || isMobileOpen) && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              )}
          </ul>
        </nav>

        {/* LOGOUT */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="logout-icon" />
            {(isHovered || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;