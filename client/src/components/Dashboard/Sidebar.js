import React, { useState, useMemo, useEffect } from "react";
import {
  Home, Users, Briefcase, Ticket, Layout, Layers, Monitor, CircleDollarSign, 
  FileText, Receipt, FileEdit, ShoppingCart, Package, Book, Database, Target, 
  Contact, Building, Coins, TrendingUp, Megaphone, Globe, LayoutGrid, BarChart3, 
  Calendar, ListChecks, MapPin, Phone, Lightbulb, FolderOpen, Truck, Box, 
  BarChart, UserCheck, Clock, Umbrella, Plane, Users2, User, MessageSquare, 
  HardDrive, ShieldCheck, Smartphone, Key, LogOut, ChevronDown, ChevronRight
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = (localStorage.getItem("userRole") || "").trim().toLowerCase();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  const role = userRole || "user";

  const onLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handleSubmenuToggle = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const targetPath = item.path || item.submenu?.[0]?.path;

    if (targetPath && location.pathname !== targetPath) {
      navigate(targetPath);
    }

    if (!isHovered) {
      setIsHovered(true);
      setOpenSubmenu(item.label);
      return;
    }

    setOpenSubmenu((prev) => (prev === item.label ? null : item.label));
  };

  const menuItems = useMemo(() => {
    const items = [];
    items.push({ label: "Home", icon: <Home size={20} />, path: "/dashboard" });

    if (role === "admin" || role === "super_user") {
      items.push({ label: "User Management", icon: <Users size={20} />, path: "/user-management" });
      items.push({ label: "Employee Profiles", icon: <Briefcase size={20} />, path: "/employee-profiles" });
      items.push({ label: "Support Tickets", icon: <Ticket size={20} />, path: "/tickets" });
    }

    items.push({
      label: "Projects",
      path: "/projects",
      icon: <Layout size={20} />,
      submenu: [
        { label: "Projects", path: "/projects", icon: <Layers size={18} /> },
        { label: "Showcase", path: "/showcase", icon: <Monitor size={18} /> },
      ]
    });

    items.push({
      label: "Finance",
      path: "/invoices",
      icon: <CircleDollarSign size={20} />,
      submenu: [
        { label: "Invoices", path: "/invoices", icon: <FileText size={18} /> },
        { label: "Expenses", path: "/expenses", icon: <Receipt size={18} /> },
        { label: "Quotes", path: "/quotes", icon: <FileEdit size={18} /> },
        { label: "Sales Orders", path: "/sales-orders", icon: <ShoppingCart size={18} /> },
        { label: "Purchase Orders", path: "/purchase-orders", icon: <Package size={18} /> },
        { label: "Price Books", path: "/price-books", icon: <Book size={18} /> },
      ]
    });

    items.push({
      label: "CRM",
      path: "/leads",
      icon: <Database size={20} />,
      submenu: [
        { label: "Leads", path: "/leads", icon: <Target size={18} /> },
        { label: "Contacts", path: "/contacts", icon: <Contact size={18} /> },
        { label: "Accounts", path: "/accounts", icon: <Building size={18} /> },
        { label: "Deals", path: "/deals", icon: <Coins size={18} /> },
      ]
    });

    items.push({
      label: "Sales & Marketing",
      path: "/campaigns",
      icon: <TrendingUp size={20} />,
      submenu: [
        { label: "Campaigns", path: "/campaigns", icon: <Megaphone size={18} /> },
        { label: "Social", path: "/social", icon: <Globe size={18} /> },
      ]
    });

    items.push({
      label: "Management",
      path: "/management/business/overview",
      icon: <LayoutGrid size={20} />,
      submenu: [
        { label: "Overview", path: "/management/business/overview", icon: <BarChart3 size={18} /> },
        { label: "Meetings", path: "/meetings", icon: <Calendar size={18} /> },
        { label: "Tasks", path: "/tasks", icon: <ListChecks size={18} /> },
        { label: "Visits", path: "/visits", icon: <MapPin size={18} /> },
        { label: "Calls", path: "/calls", icon: <Phone size={18} /> },
        { label: "Solutions", path: "/solutions", icon: <Lightbulb size={18} /> },
        { label: "Cases", path: "/cases", icon: <FolderOpen size={18} /> },
        { label: "Vendors", path: "/vendors", icon: <Truck size={18} /> },
        { label: "Products", path: "/products", icon: <Box size={18} /> },
        { label: "Forecasts", path: "/forecasts", icon: <BarChart size={18} /> },
      ]
    });

    items.push({
      label: "HR & Attendance",
      path: "/attendance",
      icon: <UserCheck size={20} />,
      submenu: [
        { label: "Attendance", path: "/attendance", icon: <Clock size={18} /> },
        { label: "Holidays", path: "/holidays", icon: <Umbrella size={18} /> },
        { label: "Leaves", path: "/leave", icon: <Plane size={18} /> },
        { label: "Interviews", path: "/interviews", icon: <Users2 size={18} /> },
      ]
    });

    items.push({
      label: "Personal",
      path: "/messages",
      icon: <User size={20} />,
      submenu: [
        { label: "Messages", path: "/messages", icon: <MessageSquare size={18} /> },
        { label: "My Drive", path: "/documents", icon: <HardDrive size={18} /> },
      ]
    });

    items.push({
      label: "Security",
      path: "/admin/devices",
      icon: <ShieldCheck size={20} />,
      submenu: [
        { label: "Device Security", path: "/admin/devices", icon: <Smartphone size={18} /> },
        { label: "Storage Admin", path: "/admin/storage", icon: <Database size={18} /> },
      ]
    });

    items.push({ label: "Password Manager", icon: <Key size={20} />, path: "/password-manager" });

    return items;
  }, [role]);

  useEffect(() => {
    const activeParent = menuItems.find((item) =>
      item.submenu?.some((sub) => location.pathname.startsWith(sub.path))
    );
    if (activeParent) {
      setOpenSubmenu(activeParent.label);
    }
  }, [location.pathname, menuItems]);

  return (
    <nav 
      className={`sidebar ${isHovered ? "is-expanded" : "is-collapsed"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setOpenSubmenu(null);
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
          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isSubmenuOpen = openSubmenu === item.label;
          const isParentActive = hasSubmenu && item.submenu.some((sub) => location.pathname.startsWith(sub.path));

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
                {isSubmenuOpen && isHovered && (
                  <div className="sidebar-submenu">
                    {item.submenu.map((sub) => (
                      <NavLink 
                        key={sub.path} 
                        to={sub.path} 
                        className={({ isActive }) => `sidebar-submenu-item ${isActive ? "is-active" : ""}`}
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
