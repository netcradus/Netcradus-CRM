import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Home, Users, Briefcase, Ticket, Layout, Layers, Monitor, CircleDollarSign,
  FileText, Receipt, FileEdit, ShoppingCart, Package, Book, Database, Target,
  Contact, Building, Coins, TrendingUp, Megaphone, Globe, LayoutGrid, BarChart3,
  Calendar, ListChecks, MapPin, Phone, Lightbulb, FolderOpen, Truck, Box,
  BarChart, UserCheck, Clock, Umbrella, Plane, Users2, User, MessageSquare,
  HardDrive, ShieldCheck, Smartphone, Key, LogOut, ChevronDown, ChevronRight, Network
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ACCESS_GROUPS, canAccess } from "../../config/access";
import useOnboarding from "../../features/Onboarding/useOnboarding";

const Sidebar = ({ isExpanded, isMobileOpen, onToggleExpanded, onSetExpanded, onHoverExpanded, onHoverCollapsed, onCloseMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  useOnboarding();
  const userRole = (localStorage.getItem("userRole") || "").trim().toLowerCase();
  const [openSubmenu, setOpenSubmenu] = useState(null);

  const role = userRole || "user";
  const isDesktopCollapsed = !isExpanded && !isMobileOpen;

  const onLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const guardNavigation = useCallback(() => false, []);

  const canShowNavItem = useCallback((item) => {
    const hiddenForRoles = item.hiddenForRoles || [];
    return !hiddenForRoles.includes(role) && (!item.roles || canAccess(role, item.roles));
  }, [role]);

  const getItemTargetPath = (item) => {
    const visibleSubmenu = item.submenu?.filter(canShowNavItem) || [];
    if (visibleSubmenu.length) {
      return visibleSubmenu[0].path;
    }
    return item.path || null;
  };

  const handleSubmenuToggle = (e, item) => {
    if (guardNavigation(e)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const targetPath = getItemTargetPath(item);

    if (isDesktopCollapsed) {
      onToggleExpanded?.();
      setOpenSubmenu(item.label);
      return;
    }

    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath);
    }

    setOpenSubmenu((prev) => (prev === item.label ? null : item.label));
  };

  const handleLeafNavigation = () => {
    if (window.innerWidth <= 768) {
      onCloseMobile?.();
    }
  };

  const menuItems = useMemo(() => {
    const items = [];
    items.push({ label: "Home", icon: <Home size={20} />, path: "/dashboard", roles: ACCESS_GROUPS.all });

    if (canAccess(role, ACCESS_GROUPS.userAdmin)) {
      items.push({ label: "User Management", icon: <Users size={20} />, path: "/user-management", roles: ACCESS_GROUPS.userAdmin });
      items.push({ label: "Employee Hierarchy", icon: <Network size={20} />, path: "/organization-chart", roles: ACCESS_GROUPS.userAdmin });
    }

    if (canAccess(role, ACCESS_GROUPS.peopleOps)) {
      items.push({ label: "Employee Profiles", icon: <Briefcase size={20} />, path: "/employee-profiles", roles: ACCESS_GROUPS.peopleOps });
    }

    if (canAccess(role, ACCESS_GROUPS.tickets)) {
      items.push({ label: "Support Tickets", icon: <Ticket size={20} />, path: "/tickets", roles: ACCESS_GROUPS.tickets });
    }

    items.push({ label: "Tasks", icon: <ListChecks size={20} />, path: "/tasks", roles: ACCESS_GROUPS.tasks });

    if (canAccess(role, ACCESS_GROUPS.projects)) items.push({
      label: "Projects",
      path: "/projects",
      icon: <Layout size={20} />,
      roles: ACCESS_GROUPS.projects,
      submenu: [
        { label: "Projects", path: "/projects", icon: <Layers size={18} />, roles: ACCESS_GROUPS.projects },
        { label: "Showcase", path: "/showcase", icon: <Monitor size={18} />, roles: ACCESS_GROUPS.security },
      ]
    });

    if (canAccess(role, ACCESS_GROUPS.financeBusiness)) items.push({
      label: "Finance",
      path: "/invoices",
      icon: <CircleDollarSign size={20} />,
      roles: ACCESS_GROUPS.financeBusiness,
      submenu: [
        { label: "Invoices", path: "/invoices", icon: <FileText size={18} />, roles: ACCESS_GROUPS.financeAdmin },
        { label: "Expenses", path: "/expenses", icon: <Receipt size={18} />, roles: ACCESS_GROUPS.financeAdmin },
        { label: "Quotes", path: "/quotes", icon: <FileEdit size={18} />, roles: ACCESS_GROUPS.quotes },
        { label: "Sales Orders", path: "/sales-orders", icon: <ShoppingCart size={18} />, roles: ACCESS_GROUPS.financeBusiness },
        { label: "Purchase Orders", path: "/purchase-orders", icon: <Package size={18} />, roles: ACCESS_GROUPS.purchaseOrders },
        { label: "Price Books", path: "/price-books", icon: <Book size={18} />, roles: ACCESS_GROUPS.priceBooks },
      ]
    });

    if (canAccess(role, [...ACCESS_GROUPS.crmLeads, ...ACCESS_GROUPS.crmAccounts, ...ACCESS_GROUPS.crmContacts, ...ACCESS_GROUPS.crmDeals, ...ACCESS_GROUPS.meetings])) items.push({
      label: "CRM",
      path: "/leads",
      icon: <Database size={20} />,
      roles: [...ACCESS_GROUPS.crmLeads, ...ACCESS_GROUPS.crmAccounts, ...ACCESS_GROUPS.crmContacts, ...ACCESS_GROUPS.crmDeals, ...ACCESS_GROUPS.meetings],
      submenu: [
        { label: "Leads", path: "/leads", icon: <Target size={18} />, roles: ACCESS_GROUPS.crmLeads },
        { label: "Meetings", path: "/meetings", icon: <Calendar size={18} />, roles: ACCESS_GROUPS.meetings },
        { label: "Contacts", path: "/contacts", icon: <Contact size={18} />, roles: ACCESS_GROUPS.crmContacts },
        { label: "Accounts", path: "/accounts", icon: <Building size={18} />, roles: ACCESS_GROUPS.crmAccounts },
        { label: "Deals", path: "/deals", icon: <Coins size={18} />, roles: ACCESS_GROUPS.crmDeals },
      ]
    });

    if (canAccess(role, ACCESS_GROUPS.marketing)) items.push({
      label: "Sales & Marketing",
      path: "/campaigns",
      icon: <TrendingUp size={20} />,
      roles: ACCESS_GROUPS.marketing,
        submenu: [
        { label: "Campaigns", path: "/campaigns", icon: <Megaphone size={18} />, roles: ACCESS_GROUPS.marketing },
        { label: "Content Calendar", path: "/content-calendar", icon: <Calendar size={18} />, roles: ACCESS_GROUPS.marketing },
        { label: "Media Library", path: "/media-library", icon: <HardDrive size={18} />, roles: ACCESS_GROUPS.marketing },
        { label: "Audience", path: "/audience", icon: <Users2 size={18} />, roles: ACCESS_GROUPS.marketing },
        { label: "Budget Overview", path: "/budget-overview", icon: <BarChart size={18} />, roles: ACCESS_GROUPS.marketing },
        { label: "Approvals", path: "/approvals", icon: <FileText size={18} />, roles: ACCESS_GROUPS.marketing },
        { label: "Social Media Manager", path: "/social", icon: <Globe size={18} />, roles: ACCESS_GROUPS.marketing },
        { label: "Unified Inbox", path: "/social-inbox", icon: <MessageSquare size={18} />, roles: ACCESS_GROUPS.marketing },
      ]
    });

    if (canAccess(role, ACCESS_GROUPS.management)) items.push({
      label: "Management",
      path: "/management/business/overview",
      icon: <LayoutGrid size={20} />,
      roles: ACCESS_GROUPS.management,
      submenu: [
        { label: "Overview", path: "/management/business/overview", icon: <BarChart3 size={18} />, roles: ACCESS_GROUPS.management },
        { label: "Meetings", path: "/meetings", icon: <Calendar size={18} />, roles: ACCESS_GROUPS.meetings },
        { label: "Visits", path: "/visits", icon: <MapPin size={18} />, roles: ACCESS_GROUPS.visits },
        { label: "Calls", path: "/calls", icon: <Phone size={18} />, roles: ACCESS_GROUPS.calls },
        { label: "Solutions", path: "/solutions", icon: <Lightbulb size={18} />, roles: ACCESS_GROUPS.solutions },
        { label: "Cases", path: "/cases", icon: <FolderOpen size={18} />, roles: ACCESS_GROUPS.cases },
        { label: "Vendors", path: "/vendors", icon: <Truck size={18} />, roles: ACCESS_GROUPS.vendors },
        { label: "Products", path: "/products", icon: <Box size={18} />, roles: ACCESS_GROUPS.products },
        { label: "Forecasts", path: "/forecasts", icon: <BarChart size={18} />, roles: ACCESS_GROUPS.forecasts },
      ]
    });

    if (canAccess(role, ACCESS_GROUPS.personal)) items.push({
      label: "HR & Attendance",
      path: "/attendance",
      icon: <UserCheck size={20} />,
      roles: ACCESS_GROUPS.personal,
      submenu: [
        { label: "Attendance", path: "/attendance", icon: <Clock size={18} />, roles: ACCESS_GROUPS.personal, hiddenForRoles: ["super_user"] },
        { label: "Team Attendance", path: "/admin/attendance", icon: <UserCheck size={18} />, roles: ACCESS_GROUPS.attendanceAdmin },
        { label: "Attendance Reports", path: "/attendance-reports", icon: <BarChart3 size={18} />, roles: ACCESS_GROUPS.attendanceAdmin },
        { label: "Holidays", path: "/holidays", icon: <Umbrella size={18} />, roles: ACCESS_GROUPS.peopleOps },
        { label: "Leaves", path: "/leave", icon: <Plane size={18} />, roles: ACCESS_GROUPS.personal },
        { label: "Interviews", path: "/interviews", icon: <Users2 size={18} />, roles: ACCESS_GROUPS.peopleOps },
      ]
    });

    if (canAccess(role, ACCESS_GROUPS.personal)) items.push({
      label: "Personal",
      path: "/messages",
      icon: <User size={20} />,
      roles: ACCESS_GROUPS.personal,
      submenu: [
        { label: "Messages", path: "/messages", icon: <MessageSquare size={18} />, roles: ACCESS_GROUPS.personal },
        { label: "My Drive", path: "/documents", icon: <HardDrive size={18} />, roles: ACCESS_GROUPS.personal },
      ]
    });

    if (canAccess(role, ACCESS_GROUPS.security)) items.push({
      label: "Security",
      path: "/admin/devices",
      icon: <ShieldCheck size={20} />,
      roles: ACCESS_GROUPS.security,
      submenu: [
        { label: "Device Security", path: "/admin/devices", icon: <Smartphone size={18} />, roles: ACCESS_GROUPS.security },
        { label: "Storage Admin", path: "/admin/storage", icon: <Database size={18} />, roles: ACCESS_GROUPS.security },
      ]
    });

    if (canAccess(role, ACCESS_GROUPS.security)) {
      items.push({ label: "Password Manager", icon: <Key size={20} />, path: "/password-manager", roles: ACCESS_GROUPS.security });
    }

    return items;
  }, [role]);

  useEffect(() => {
    const activeParent = menuItems.find((item) =>
      item.submenu?.filter(canShowNavItem).some((sub) => location.pathname.startsWith(sub.path))
    );
    if (activeParent) {
      setOpenSubmenu(activeParent.label);
    }
  }, [location.pathname, menuItems, canShowNavItem]);

  return (
    <nav 
      className={`sidebar ${isExpanded ? "is-expanded" : "is-collapsed"} ${isMobileOpen ? "is-mobile-open" : ""}`}
      onMouseEnter={onHoverExpanded}
      onMouseLeave={() => {
        if (window.innerWidth > 768) {
          setOpenSubmenu(null);
          onHoverCollapsed?.();
        }
      }}
    >
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span className="sidebar-brand-text">Netcradus</span>
      </div>

      <div className="sidebar-menu">
        {menuItems.map((item) => {
          const visibleSubmenu = item.submenu?.filter(canShowNavItem) || [];
          const hasSubmenu = visibleSubmenu.length > 0;
          const isSubmenuOpen = openSubmenu === item.label;
          const isParentActive = hasSubmenu && visibleSubmenu.some((sub) => location.pathname.startsWith(sub.path));

          if (hasSubmenu) {
            return (
              <div key={item.label} className={`sidebar-item-group ${isSubmenuOpen ? "is-open" : ""}`}>
                <button 
                  className={`sidebar-item ${isParentActive ? "is-parent-active" : ""}`}
                  onClick={(e) => handleSubmenuToggle(e, item)}
                >
                  <div className="sidebar-item-icon">{item.icon}</div>
                  <span className="sidebar-item-text">{item.label}</span>
                  <div className="sidebar-item-caret">
                    {isSubmenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </div>
                </button>
                {isSubmenuOpen && (isExpanded || isMobileOpen) && (
                  <div className="sidebar-submenu">
                    {visibleSubmenu.map((sub) => (
                      <NavLink 
                        key={sub.path} 
                        to={sub.path} 
                        className={({ isActive }) => `sidebar-submenu-item ${isActive ? "is-active" : ""}`}
                        onClick={(event) => {
                          if (guardNavigation(event)) {
                            return;
                          }
                          handleLeafNavigation();
                        }}
                      >
                        <div className="sidebar-submenu-icon">{sub.icon}</div>
                        <span className="sidebar-submenu-text">{sub.label}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({ isActive }) => `sidebar-item ${isActive ? "is-active" : ""}`}
              onClick={(event) => {
                if (guardNavigation(event)) {
                  return;
                }
                handleLeafNavigation();
              }}
            >
              <div className="sidebar-item-icon">{item.icon}</div>
              <span className="sidebar-item-text">{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <button className="sidebar-item sidebar-logout" onClick={onLogout}>
          <div className="sidebar-item-icon"><LogOut size={20} /></div>
          <span className="sidebar-item-text">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
