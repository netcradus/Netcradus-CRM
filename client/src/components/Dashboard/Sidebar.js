import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Search,
  ChevronDown,
  Menu,
  X,
  Home,
  Users,
  Phone,
  FileText,
  Building2,
  Handshake,
  CheckSquare2,
  CalendarClock,
  PhoneCall,
  Boxes,
  Receipt,
  ClipboardList,
  Truck,
  Inbox,
  BookOpen,
  BriefcaseBusiness,
  BarChart3,
  MapPin,
  MessageCircle,
  Settings2,
  Workflow,
  Wrench,
  UserCircle2,
  Layers3,
  Shield,
  Database,
  FileLock,
  Clock,
  CalendarDays,
  UmbrellaOff,
  FileBarChart2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";
import { useNavigate } from "react-router-dom";

// ─── Menu config ─────────────────────────────────────────────────────────────
const roleMenus = {
  super_user: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "User Management", path: "/user-management", icon: <Users size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "CRM",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Leads", path: "/leads", icon: <Users size={16} /> },
        { label: "Contacts", path: "/contacts", icon: <Phone size={16} /> },
        { label: "Accounts", path: "/accounts", icon: <Building2 size={16} /> },
        { label: "Deals", path: "/deals", icon: <Handshake size={16} /> },
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
        { label: "Client Meetings", path: "/meetings", icon: <CalendarClock size={16} /> },
      ],
    },
    {
      label: "Sales & Marketing",
      icon: <BarChart3 size={18} />,
      children: [
        { label: "Sales Orders", path: "/sales-orders", icon: <ClipboardList size={16} /> },
        { label: "Visits", path: "/visits", icon: <MapPin size={16} /> },
      ],
    },
    {
      label: "HR & Attendance",
      icon: <Clock size={18} />,
      children: [
        { label: "Team Dashboard", path: "/admin/attendance", icon: <BarChart3 size={16} />, badge: true },
        { label: "Attendance Reports", path: "/attendance-reports", icon: <FileBarChart2 size={16} /> },
        { label: "Leave Requests", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
      ],
    },
    {
      label: "Security",
      icon: <Shield size={18} />,
      children: [
        { label: "Device Security", path: "/admin/devices", icon: <FileLock size={18} /> },
      ],
    },
  ],

  admin: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "CRM",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Leads", path: "/leads", icon: <Users size={16} /> },
        { label: "Contacts", path: "/contacts", icon: <Phone size={16} /> },
        { label: "Accounts", path: "/accounts", icon: <Building2 size={16} /> },
        { label: "Deals", path: "/deals", icon: <Handshake size={16} /> },
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
      ],
    },
    {
      label: "HR & Attendance",
      icon: <Clock size={18} />,
      children: [
        // { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "Team Dashboard", path: "/admin/attendance", icon: <BarChart3 size={16} />, badge: true },
        { label: "Leave Requests", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },

      ],
    },
  ],

  management: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "My CRM",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Leads", path: "/leads", icon: <Users size={16} /> },
        { label: "Contacts", path: "/contacts", icon: <Phone size={16} /> },
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
      ],
    },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
                { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },

      ],
    },
  ],

  sales: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "Sales Workspace",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Leads", path: "/leads", icon: <Users size={16} /> },
        { label: "Contacts", path: "/contacts", icon: <Phone size={16} /> },
        { label: "Deals", path: "/deals", icon: <Handshake size={16} /> },
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
        { label: "Meetings", path: "/meetings", icon: <CalendarClock size={16} /> },
        { label: "Visits", path: "/visits", icon: <MapPin size={16} /> },
      ],
    },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },

      ],
    },
  ],

  support: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "Support Workspace",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Contacts", path: "/contacts", icon: <Phone size={16} /> },
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
        // { label: "Calls", path: "/calls", icon: <Phone size={16} /> },
        { label: "Cases", path: "/cases", icon: <Handshake size={16} /> },
      ],
    },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
                { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },

      ],
    },
  ],

  hr: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "HR Workspace",
      icon: <Clock size={18} />,
      children: [
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "Team Dashboard", path: "/admin/attendance", icon: <BarChart3 size={16} />, badge: true },
        { label: "Attendance Reports", path: "/attendance-reports", icon: <FileBarChart2 size={16} /> },
        { label: "Leave Requests", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
      ],
    },
  ],

  it: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "IT Workspace",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
        { label: "Projects", path: "/projects", icon: <CalendarClock size={16} /> },
        { label: "Documents", path: "/documents", icon: <Phone size={16} /> },
      ],
    },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
                { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },

      ],
    },
  ],

  digital_media: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "Media Workspace",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
        { label: "Campaigns", path: "/campaigns", icon: <BarChart3 size={16} /> },
        { label: "Social", path: "/social", icon: <MessageCircle size={16} /> },
        { label: "Reports", path: "/reports", icon: <FileBarChart2 size={16} /> },
      ],
    },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },

      ],
    },
  ],
};

// ─── NavGroup — dropdown opens BELOW the button ───────────────────────────────
function NavGroup({ item, isHovered, location, isMobileOpen, onLinkClick, pendingCount }) {
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
        <span className="nav-icon">
          {item.icon}
          {!isHovered && !isMobileOpen && item.children.some(c => c.badge) && pendingCount > 0 && (
            <span className="sidebar-badge-dot" />
          )}
        </span>
        {(isHovered || isMobileOpen) && (
          <>
            <span className="nav-label">{item.label}</span>
            <span className={`nav-chevron ${open ? "rotated" : ""}`}>
              <ChevronDown size={14} />
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
                    {child.badge && pendingCount > 0 && (
                      <span className="sidebar-badge">{pendingCount}</span>
                    )}
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
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    const role = localStorage.getItem("userRole");
    if (!["super_user", "admin", "hr"].includes(role)) return;
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/attendance/admin/pending-actions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const count = (data.data?.pendingLeaves?.length || 0) + (data.data?.pendingRegularizations?.length || 0);
      setPendingCount(count);
    } catch (e) {
      console.error("Failed to fetch pending counts", e);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 300000); // 5 mins
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

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
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("passwordExpiryWarning");
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
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
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
              <Search size={14} />
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
                    pendingCount={pendingCount}
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
            <span className="logout-icon">
              ⏏
            </span>
            {(isHovered || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
