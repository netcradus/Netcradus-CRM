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
  Receipt,
  ClipboardList,
  BriefcaseBusiness,
  BarChart3,
  MapPin,
  MessageCircle,
  UserCircle2,
  Layers3,
  Shield,
  Database,
  FileLock,
  Clock,
  CalendarDays,
  UmbrellaOff,
  FileBarChart2,
  HardDrive,
  FolderKanban,
  Presentation,
  LogOut,
  ShoppingCart,
  PackagePlus,
  KeyRound,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { apiUrl } from "../../config/api";
import "./Sidebar.css";

const managementMenu = {
  label: "Management",
  icon: <BriefcaseBusiness size={18} />,
  children: [
    {
      label: "Business",
      icon: <BriefcaseBusiness size={16} />,
      children: [
        { label: "Client Information", path: "/management/business/clients", icon: <Users size={16} /> },
        { label: "Tender", path: "/management/business/tenders", icon: <FileText size={16} /> },
        { label: "Other Business", path: "/management/business/overview", icon: <BarChart3 size={16} /> },
      ],
    },
    {
      label: "Day to Day",
      icon: <ClipboardList size={16} />,
      children: [
        { label: "Purchases Done", path: "/management/day-to-day/purchases", icon: <ShoppingCart size={16} /> },
        { label: "Items to Purchase", path: "/management/day-to-day/purchase-items", icon: <PackagePlus size={16} /> },
        { label: "Invoices", path: "/management/day-to-day/invoices", icon: <Receipt size={16} /> },
      ],
    },
  ],
};

const roleMenus = {
  super_user: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "User Management", path: "/user-management", icon: <Users size={18} /> },
    { label: "Employee Profiles", path: "/employee-profiles", icon: <Users size={16} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "Projects",
      icon: <FolderKanban size={18} />,
      children: [
        { label: "Projects", path: "/projects", icon: <FolderKanban size={16} /> },
        { label: "Showcase", path: "/showcase", icon: <Presentation size={16} /> },
      ],
    },
    {
      label: "Finance",
      icon: <Receipt size={18} />,
      children: [
        { label: "Expenses", path: "/expenses", icon: <Receipt size={16} /> },
        { label: "Invoices", path: "/invoices", icon: <FileText size={16} /> },
      ],
    },
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
    managementMenu,
    {
      label: "HR & Attendance",
      icon: <Clock size={18} />,
      children: [
        { label: "Team Dashboard", path: "/admin/attendance", icon: <BarChart3 size={16} />, badge: true },
        { label: "Attendance Reports", path: "/attendance-reports", icon: <FileBarChart2 size={16} /> },
        { label: "Leave Requests", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
        { label: "Interviews", path: "/interviews", icon: <CalendarClock size={16} /> },
      ],
    },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "Messages", path: "/messages", icon: <MessageCircle size={18} /> },
        { label: "My Drive", path: "/documents", icon: <HardDrive size={18} /> },
        { label: "Showcase", path: "/showcase", icon: <Presentation size={16} /> },
      ],
    },
    {
      label: "Security",
      icon: <Shield size={18} />,
      children: [
        { label: "Device Security", path: "/admin/devices", icon: <FileLock size={18} /> },
        { label: "Storage Admin", path: "/admin/storage", icon: <Database size={16} /> },
      ],
    },
    { label: "Password Manager", path: "/password-manager", icon: <KeyRound size={18} /> },
  ],
  admin: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "My Profile", path: "/my-profile", icon: <UserCircle2 size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "Finance",
      icon: <Receipt size={18} />,
      children: [
        { label: "Expenses", path: "/expenses", icon: <Receipt size={16} /> },
        { label: "Invoices", path: "/invoices", icon: <FileText size={16} /> },
      ],
    },
    {
      label: "CRM",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Leads", path: "/leads", icon: <Users size={16} /> },
        { label: "Accounts", path: "/accounts", icon: <Building2 size={16} /> },
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
      ],
    },
    {
      label: "HR & Attendance",
      icon: <Clock size={18} />,
      children: [
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "Leave Requests", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
      ],
    },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "Messages", path: "/messages", icon: <MessageCircle size={18} /> },
        { label: "My Drive", path: "/documents", icon: <HardDrive size={18} /> },
      ],
    },
  ],
  management: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "My Profile", path: "/my-profile", icon: <UserCircle2 size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    managementMenu,
    { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "Messages", path: "/messages", icon: <MessageCircle size={18} /> },
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
      ],
    },
    { label: "My Drive", path: "/documents", icon: <HardDrive size={18} /> },
  ],
  sales: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "My Profile", path: "/my-profile", icon: <UserCircle2 size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "Sales Workspace",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Leads", path: "/leads", icon: <Users size={16} /> },
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
        { label: "Messages", path: "/messages", icon: <MessageCircle size={18} /> },
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
      ],
    },
    { label: "My Drive", path: "/documents", icon: <HardDrive size={18} /> },
    { label: "Showcase", path: "/showcase", icon: <Presentation size={18} /> },
  ],
  support: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "My Profile", path: "/my-profile", icon: <UserCircle2 size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "Support Workspace",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
        { label: "Cases", path: "/cases", icon: <Handshake size={16} /> },
      ],
    },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "Messages", path: "/messages", icon: <MessageCircle size={18} /> },
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
      ],
    },
    { label: "My Drive", path: "/documents", icon: <HardDrive size={18} /> },
  ],
  hr: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "HR Workspace",
      icon: <Clock size={18} />,
      children: [
        { label: "Messages", path: "/messages", icon: <MessageCircle size={18} /> },
        { label: "Employee Profiles", path: "/employee-profiles", icon: <Users size={16} /> },
        { label: "Interviews", path: "/interviews", icon: <CalendarClock size={16} /> },
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "Team Dashboard", path: "/admin/attendance", icon: <BarChart3 size={16} />, badge: true },
        { label: "Attendance Reports", path: "/attendance-reports", icon: <FileBarChart2 size={16} /> },
        { label: "Leave Requests", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
      ],
    },
    { label: "Contacts", path: "/contacts", icon: <Phone size={16} /> },
    { label: "My Drive", path: "/documents", icon: <HardDrive size={18} /> },
  ],
  it: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "My Profile", path: "/my-profile", icon: <UserCircle2 size={18} /> },
    { label: "Support Tickets", path: "/tickets", icon: <MessageCircle size={18} /> },
    {
      label: "IT Workspace",
      icon: <Layers3 size={18} />,
      children: [
        { label: "Tasks", path: "/tasks", icon: <CheckSquare2 size={16} /> },
        { label: "Documents", path: "/documents", icon: <Phone size={16} /> },
      ],
    },
    {
      label: "Personal",
      icon: <Clock size={18} />,
      children: [
        { label: "Messages", path: "/messages", icon: <MessageCircle size={18} /> },
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
      ],
    },
    { label: "My Drive", path: "/documents", icon: <HardDrive size={18} /> },
  ],
  digital_media: [
    { label: "Home", path: "/dashboard", icon: <Home size={18} /> },
    { label: "My Profile", path: "/my-profile", icon: <UserCircle2 size={18} /> },
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
        { label: "Messages", path: "/messages", icon: <MessageCircle size={18} /> },
        { label: "My Attendance", path: "/attendance", icon: <Clock size={16} /> },
        { label: "My Leave", path: "/leave", icon: <UmbrellaOff size={16} /> },
        { label: "Holiday Calendar", path: "/holidays", icon: <CalendarDays size={16} /> },
      ],
    },
    { label: "My Drive", path: "/documents", icon: <HardDrive size={18} /> },
  ],
};

const isItemActive = (item, pathname) => {
  if (item.path && pathname === item.path) return true;
  return Array.isArray(item.children) && item.children.some((child) => isItemActive(child, pathname));
};

const flattenMenuItems = (items = []) =>
  items.flatMap((item) => (item.children ? flattenMenuItems(item.children) : item.path ? [item] : []));

const stripShowcaseForRole = (items = [], userRole) =>
  items
    .map((item) => {
      if (item.path === "/showcase" && userRole !== "super_user") return null;
      if (!Array.isArray(item.children)) return item;
      const children = stripShowcaseForRole(item.children, userRole).filter(Boolean);
      if (!children.length && !item.path) return null;
      return { ...item, children };
    })
    .filter(Boolean);

const mapMenuForProjectsAccess = (items = [], userRole) => {
  const filtered = stripShowcaseForRole(items, userRole);
  const hasProjectsLink = flattenMenuItems(filtered).some((item) => item.path === "/projects");
  if (hasProjectsLink) return filtered;

  return [...filtered, { label: "Projects", path: "/projects", icon: <FolderKanban size={18} /> }];
};

function DropdownNode({ item, location, onLeafClick, getBadgeValue, depth = 0 }) {
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const isActive = isItemActive(item, location.pathname);
  const [open, setOpen] = useState(isActive);
  const badgeValue = getBadgeValue(item);

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  if (!hasChildren) {
    return (
      <Link to={item.path} className={`dropdown-link ${isActive ? "active" : ""}`} onClick={onLeafClick}>
        <span className="nav-icon">{item.icon}</span>
        <span>{item.label}</span>
        {badgeValue > 0 && <span className="sidebar-badge">{badgeValue}</span>}
      </Link>
    );
  }

  return (
    <div className={`dropdown-node dropdown-depth-${depth}`}>
      <button
        type="button"
        className={`dropdown-toggle ${isActive ? "active" : ""} ${open ? "open" : ""}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="dropdown-toggle-main">
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </span>
        <span className={`nav-chevron ${open ? "rotated" : ""}`}>
          <ChevronDown size={14} />
        </span>
      </button>
      <div className={`dropdown-children ${open ? "open" : ""}`}>
        <div className="dropdown-children-inner">
          {item.children.map((child, index) => (
            <DropdownNode
              key={`${item.label}-${index}`}
              item={child}
              location={location}
              onLeafClick={onLeafClick}
              getBadgeValue={getBadgeValue}
              depth={depth + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NavGroup({ item, isHovered, isMobileOpen, location, onLinkClick, getBadgeValue }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isChildActive = isItemActive(item, location.pathname);
  const hasVisibleBadge = flattenMenuItems(item.children || []).some((child) => getBadgeValue(child) > 0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isHovered && !isMobileOpen) setOpen(false);
  }, [isHovered, isMobileOpen]);

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  return (
    <li className="nav-group" ref={ref}>
      <button
        className={`nav-group-btn ${isChildActive ? "group-active" : ""} ${open ? "group-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        title={!isHovered && !isMobileOpen ? item.label : undefined}
      >
        <span className="nav-icon">
          {item.icon}
          {!isHovered && !isMobileOpen && hasVisibleBadge && <span className="sidebar-badge-dot" />}
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

      {open && (
        <div className="nav-dropdown">
          <div className="dropdown-header">{item.label}</div>
          <div className="dropdown-tree">
            {item.children.map((child, index) => (
              <DropdownNode
                key={`${item.label}-${index}`}
                item={child}
                location={location}
                onLeafClick={() => {
                  setOpen(false);
                  onLinkClick();
                }}
                getBadgeValue={getBadgeValue}
              />
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

function Sidebar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [managementCounts, setManagementCounts] = useState({
    purchasesThisPeriod: 0,
    pendingPurchaseItems: 0,
    outstandingInvoices: 0,
  });
  const navigate = useNavigate();
  const location = useLocation();

  const fetchPendingCount = useCallback(async () => {
    const role = localStorage.getItem("userRole");
    if (!["super_user", "admin", "hr"].includes(role)) return;
    try {
      const { data } = await axios.get(apiUrl("/api/attendance/admin/pending-actions"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const count = (data.data?.pendingLeaves?.length || 0) + (data.data?.pendingRegularizations?.length || 0);
      setPendingCount(count);
    } catch (error) {
      console.error("Failed to fetch pending counts", error);
    }
  }, []);

  const fetchManagementCounts = useCallback(async () => {
    const role = localStorage.getItem("userRole");
    if (!["super_user", "management"].includes(role)) return;
    try {
      const { data } = await axios.get(apiUrl("/api/management/sidebar-summary"), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setManagementCounts({
        purchasesThisPeriod: Number(data.purchasesThisPeriod || 0),
        pendingPurchaseItems: Number(data.pendingPurchaseItems || 0),
        outstandingInvoices: Number(data.outstandingInvoices || 0),
      });
    } catch (error) {
      console.error("Failed to fetch management counts", error);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    fetchManagementCounts();
    const interval = setInterval(() => {
      fetchPendingCount();
      fetchManagementCounts();
    }, 300000);
    return () => clearInterval(interval);
  }, [fetchPendingCount, fetchManagementCounts]);

  const userRole = localStorage.getItem("userRole");
  const menuItems = mapMenuForProjectsAccess(roleMenus[userRole] || [], userRole);

  const getBadgeValue = useCallback(
    (item) => {
      if (item.badge) return pendingCount;
      if (item.badgeKey) return Number(managementCounts[item.badgeKey] || 0);
      return 0;
    },
    [managementCounts, pendingCount]
  );

  const filteredMenu = searchTerm
    ? flattenMenuItems(menuItems).filter((item) => item.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("passwordExpiryWarning");
    navigate("/login");
  };

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobileOpen]);

  return (
    <>
      <button
        className={`mobile-hamburger ${isMobileOpen ? "active" : ""}`}
        onClick={() => setIsMobileOpen((current) => !current)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {isMobileOpen && <div className="mobile-overlay" onClick={() => setIsMobileOpen(false)} />}

      <div
        className={`sidebar ${isHovered ? "expanded" : "collapsed"} ${isMobileOpen ? "mobile-open" : ""}`}
        onMouseEnter={() => window.innerWidth > 768 && setIsHovered(true)}
        onMouseLeave={() => window.innerWidth > 768 && setIsHovered(false)}
      >
        <div className="sidebar-logo">
          <img src="/sidebar-logo.jpeg" alt="Company Logo" className="logo-img" />
          {(isHovered || isMobileOpen) && (
            <span className="company-name">
              <img src="/netcradus.png" alt="Company Logo" />
            </span>
          )}
        </div>

        {(isHovered || isMobileOpen) && (
          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          <ul>
            {filteredMenu
              ? filteredMenu.map((item, index) => (
                  <li key={`${item.label}-${index}`}>
                    <Link to={item.path} className={`nav-link ${location.pathname === item.path ? "active" : ""}`}>
                      <span className="nav-icon">{item.icon}</span>
                      {(isHovered || isMobileOpen) && <span>{item.label}</span>}
                      {(isHovered || isMobileOpen) && getBadgeValue(item) > 0 && (
                        <span className="sidebar-badge">{getBadgeValue(item)}</span>
                      )}
                    </Link>
                  </li>
                ))
              : menuItems.map((item, index) =>
                  item.children ? (
                    <NavGroup
                      key={`${item.label}-${index}`}
                      item={item}
                      isHovered={isHovered}
                      isMobileOpen={isMobileOpen}
                      location={location}
                      onLinkClick={() => setIsMobileOpen(false)}
                      getBadgeValue={getBadgeValue}
                    />
                  ) : (
                    <li key={`${item.label}-${index}`}>
                      <Link
                        to={item.path}
                        className={`nav-link ${location.pathname === item.path ? "active" : ""}`}
                        title={!isHovered && !isMobileOpen ? item.label : undefined}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        {(isHovered || isMobileOpen) && <span>{item.label}</span>}
                      </Link>
                    </li>
                  )
                )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="logout-icon">
              <LogOut size={18} />
            </span>
            {(isHovered || isMobileOpen) && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
