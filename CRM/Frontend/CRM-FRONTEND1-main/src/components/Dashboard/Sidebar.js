// import React from "react";
// import { Link } from "react-router-dom";
// import {
//   FaHome, FaUser, FaPhone, FaChartLine, FaFileAlt, FaUsers, FaBuilding,
//   FaHandshake, FaTasks, FaCalendarAlt, FaPhoneSquareAlt, FaBox, FaFileInvoice,
//   FaClipboardList, FaTruck, FaEnvelopeOpenText, FaBullhorn, FaUserTie, FaBook,
//   FaBriefcase, FaBookOpen, FaFile, FaChartBar, FaMapMarkerAlt, FaComments,
//   FaCogs, FaProjectDiagram, FaTools, FaUserFriends
// } from "react-icons/fa";
// import "../Dashboard.css";

// function Sidebar() {
//   return (
//     <div className="sidebar">
//       <h2 className="logo">NETCRADUS</h2>
//       <ul>
//         <li><Link to="/dashboard"><FaHome /> Home</Link></li>
//         <li><Link to="/leads"><FaUser /> Leads</Link></li>
//         <li><Link to="/contacts"><FaPhone /> Contacts</Link></li>
//         <li><Link to="/accounts"><FaBuilding /> Accounts</Link></li>
//         <li><Link to="/deals"><FaHandshake /> Deals</Link></li>
//         <li><Link to="/tasks"><FaTasks /> Tasks</Link></li>
//         <li><Link to="/meetings"><FaCalendarAlt /> Meetings</Link></li>
//         <li><Link to="/calls"><FaPhoneSquareAlt /> Calls</Link></li>
//         <li><Link to="/products"><FaBox /> Products</Link></li>
//         <li><Link to="/quotes"><FaFileInvoice /> Quotes</Link></li>
//         <li><Link to="/sales-orders"><FaClipboardList /> Sales Orders</Link></li>
//         <li><Link to="/purchase-orders"><FaTruck /> Purchase Orders</Link></li>
//         <li><Link to="/invoices"><FaFileAlt /> Invoices</Link></li>
//         <li><Link to="/sales-inbox"><FaEnvelopeOpenText /> SalesInbox</Link></li>
//         <li><Link to="/campaigns"><FaBullhorn /> Campaigns</Link></li>
//         <li><Link to="/vendors"><FaUserTie /> Vendors</Link></li>
//         <li><Link to="/price-books"><FaBook /> Price Books</Link></li>
//         <li><Link to="/cases"><FaBriefcase /> Cases</Link></li>
//         <li><Link to="/solutions"><FaBookOpen /> Solutions</Link></li>
//         <li><Link to="/documents"><FaFile /> Documents</Link></li>
//         <li><Link to="/forecasts"><FaChartBar /> Forecasts</Link></li>
//         <li><Link to="/visits"><FaMapMarkerAlt /> Visits</Link></li>
//         <li><Link to="/social"><FaComments /> Social</Link></li>
//         <li><Link to="/services"><FaCogs /> Services</Link></li>
//         <li><Link to="/projects"><FaProjectDiagram /> Projects</Link></li>
//         <li><Link to="/ct"><FaTools /> CT</Link></li>
//         <li><Link to="/crm-teamspace"><FaUserFriends /> CRM Teamspace</Link></li>
//       </ul>
//     </div>
//   );
// }

// export default Sidebar;




// import React from "react";
// import { FaHome, FaUser, FaPhone, FaChartLine, FaFileAlt } from "react-icons/fa";
// import { Link } from "react-router-dom"; // ✅ Import Link for routing
// import "../Dashboard.css";

// function Sidebar() {
//   return (
//     <div className="sidebar">
//       <h2 className="logo">NETCRADUS</h2>
//       <ul>
//         <li>
//           <Link to="/dashboard" style={linkStyle}><FaHome /> Dashboard</Link>
//         </li>
//         <li>
//           <Link to="/leads" style={linkStyle}><FaUser /> Leads</Link>
//         </li>
//         <li>
//           <Link to="/contacts" style={linkStyle}><FaPhone /> Contacts</Link>
//         </li>
//         <li>
//           <Link to="/sales" style={linkStyle}><FaChartLine /> Sales</Link>
//         </li>
//         <li>
//           <Link to="/reports" style={linkStyle}><FaFileAlt /> Reports</Link>
//         </li>
//       </ul>
//     </div>
//   );
// }

// const linkStyle = {
//   color: "white",
//   textDecoration: "none",
//   display: "flex",
//   alignItems: "center",
//   gap: "10px",
// };

// export default Sidebar; 





// import React from "react";
// import { Link } from "react-router-dom";
// import {
//   FaHome, FaUser, FaPhone, FaChartLine, FaFileAlt, FaUsers, FaBuilding,
//   FaHandshake, FaTasks, FaCalendarAlt, FaPhoneSquareAlt, FaBox, FaFileInvoice,
//   FaClipboardList, FaTruck, FaEnvelopeOpenText, FaBullhorn, FaUserTie, FaBook,
//   FaBriefcase, FaBookOpen, FaFile, FaChartBar, FaMapMarkerAlt, FaComments,
//   FaCogs, FaProjectDiagram, FaTools, FaUserFriends
// } 
// from "react-icons/fa";
// import "../sidebar.css"

// function Sidebar() {
//   return (
//     <div className="sidebar">
//       <h2 className="logo">NETCRADUS</h2>
//       <ul>
//         <li><Link to="/dashboard" style={linkStyle}><FaHome /> Home</Link></li>
//         <li><Link to="/leads" style={linkStyle}><FaUser /> Leads</Link></li>
//         <li><Link to="/contacts" style={linkStyle}><FaPhone /> Contacts</Link></li>
//         <li><Link to="/accounts" style={linkStyle}><FaBuilding /> Accounts</Link></li>
//         <li><Link to="/deals" style={linkStyle}><FaHandshake /> Deals</Link></li>
//         <li><Link to="/tasks" style={linkStyle}><FaTasks /> Tasks</Link></li>
//         <li><Link to="/meetings" style={linkStyle}><FaCalendarAlt /> Meetings</Link></li>
//         <li><Link to="/calls" style={linkStyle}><FaPhoneSquareAlt /> Calls</Link></li>
//         <li><Link to="/products" style={linkStyle}><FaBox /> Products</Link></li>
//         <li><Link to="/quotes" style={linkStyle}><FaFileInvoice /> Quotes</Link></li>
//         <li><Link to="/sales-orders" style={linkStyle}><FaClipboardList /> Sales Orders</Link></li>
//         <li><Link to="/purchase-orders" style={linkStyle}><FaTruck /> Purchase Orders</Link></li>
//         <li><Link to="/invoices" style={linkStyle}><FaFileAlt /> Invoices</Link></li>
//         <li><Link to="/sales-inbox" style={linkStyle}><FaEnvelopeOpenText /> SalesInbox</Link></li>
//         <li><Link to="/campaigns" style={linkStyle}><FaBullhorn /> Campaigns</Link></li>
//         <li><Link to="/vendors" style={linkStyle}><FaUserTie /> Vendors</Link></li>
//         <li><Link to="/price-books" style={linkStyle}><FaBook /> Price Books</Link></li>
//         <li><Link to="/cases" style={linkStyle}><FaBriefcase /> Cases</Link></li>
//         <li><Link to="/solutions" style={linkStyle}><FaBookOpen /> Solutions</Link></li>
//         <li><Link to="/documents" style={linkStyle}><FaFile /> Documents</Link></li>
//         <li><Link to="/forecasts" style={linkStyle}><FaChartBar /> Forecasts</Link></li>
//         <li><Link to="/visits" style={linkStyle}><FaMapMarkerAlt /> Visits</Link></li>
//         <li><Link to="/social" style={linkStyle}><FaComments /> Social</Link></li>
//         <li><Link to="/services" style={linkStyle}><FaCogs /> Services</Link></li>
//         <li><Link to="/projects" style={linkStyle}><FaProjectDiagram /> Projects</Link></li>
//         <li><Link to="/ct" style={linkStyle}><FaTools /> CT</Link></li>
//         <li><Link to="/crm-teamspace" style={linkStyle}><FaUserFriends /> CRM Teamspace</Link></li>
//       </ul>
//     </div>
//   );
// }

// const linkStyle = {
//   color: "white",
//   textDecoration: "none",
//   display: "flex",
//   alignItems: "center",
//   gap: "10px",
// };

// export default Sidebar;


// import React from "react";
// import { Link } from "react-router-dom";
// import {
//   FaHome, FaUser, FaPhone, FaChartLine, FaFileAlt, FaUsers, FaBuilding,
//   FaHandshake, FaTasks, FaCalendarAlt, FaPhoneSquareAlt, FaBox, FaFileInvoice,
//   FaClipboardList, FaTruck, FaEnvelopeOpenText, FaBullhorn, FaUserTie, FaBook,
//   FaBriefcase, FaBookOpen, FaFile, FaChartBar, FaMapMarkerAlt, FaComments,
//   FaCogs, FaProjectDiagram, FaTools, FaUserFriends
// } from "react-icons/fa";

// import "./Sidebar.css"; // ✅ Corrected CSS path

// function Sidebar() {
//   return (
//     <div className="sidebar">
//       <h2 className="logo">NETCRADUS</h2>
//       <ul>
//         <li><Link to="/dashboard" style={linkStyle}><FaHome /> Home</Link></li>
//         <li><Link to="/leads" style={linkStyle}><FaUser /> Leads</Link></li>
//         <li><Link to="/contacts" style={linkStyle}><FaPhone /> Contacts</Link></li>
//         <li><Link to="/accounts" style={linkStyle}><FaBuilding /> Accounts</Link></li>
//         <li><Link to="/deals" style={linkStyle}><FaHandshake /> Deals</Link></li>
//         <li><Link to="/tasks" style={linkStyle}><FaTasks /> Tasks</Link></li>
//         <li><Link to="/meetings" style={linkStyle}><FaCalendarAlt /> Meetings</Link></li>
//         <li><Link to="/calls" style={linkStyle}><FaPhoneSquareAlt /> Calls</Link></li>
//         <li><Link to="/products" style={linkStyle}><FaBox /> Products</Link></li>
//         <li><Link to="/quotes" style={linkStyle}><FaFileInvoice /> Quotes</Link></li>
//         <li><Link to="/sales-orders" style={linkStyle}><FaClipboardList /> Sales Orders</Link></li>
//         <li><Link to="/purchase-orders" style={linkStyle}><FaTruck /> Purchase Orders</Link></li>
//         <li><Link to="/invoices" style={linkStyle}><FaFileAlt /> Invoices</Link></li>
//         <li><Link to="/sales-inbox" style={linkStyle}><FaEnvelopeOpenText /> SalesInbox</Link></li>
//         <li><Link to="/campaigns" style={linkStyle}><FaBullhorn /> Campaigns</Link></li>
//         <li><Link to="/vendors" style={linkStyle}><FaUserTie /> Vendors</Link></li>
//         <li><Link to="/price-books" style={linkStyle}><FaBook /> Price Books</Link></li>
//         <li><Link to="/cases" style={linkStyle}><FaBriefcase /> Cases</Link></li>
//         <li><Link to="/solutions" style={linkStyle}><FaBookOpen /> Solutions</Link></li>
//         <li><Link to="/documents" style={linkStyle}><FaFile /> Documents</Link></li>
//         <li><Link to="/forecasts" style={linkStyle}><FaChartBar /> Forecasts</Link></li>
//         <li><Link to="/visits" style={linkStyle}><FaMapMarkerAlt /> Visits</Link></li>
//         <li><Link to="/social" style={linkStyle}><FaComments /> Social</Link></li>
//         <li><Link to="/services" style={linkStyle}><FaCogs /> Services</Link></li>
//         <li><Link to="/projects" style={linkStyle}><FaProjectDiagram /> Projects</Link></li>
//         <li><Link to="/ct" style={linkStyle}><FaTools /> CT</Link></li>
//         <li><Link to="/crm-teamspaces" style={linkStyle}><FaUserFriends /> CRM Teamspaces</Link></li>
//       </ul>
//     </div>
//   );
// }

// const linkStyle = {
//   color: "white",
//   textDecoration: "none",
//   display: "flex",
//   alignItems: "center",
//   gap: "10px",
// };

// export default Sidebar;



// import React from "react";
// import { Link } from "react-router-dom";
// import {
//   FaHome, FaUser, FaPhone, FaFileAlt, FaBuilding,
//   FaHandshake, FaTasks, FaCalendarAlt, FaPhoneSquareAlt, FaBox, FaFileInvoice,
//   FaClipboardList, FaTruck, FaEnvelopeOpenText, FaBullhorn, FaUserTie, FaBook,
//   FaBriefcase, FaBookOpen, FaFile, FaChartBar, FaMapMarkerAlt, FaComments,
//   FaCogs, FaProjectDiagram, FaTools, FaUserFriends
// } from "react-icons/fa";

// import "./Sidebar.css";

// function Sidebar() {
//   return (
//     <div className="sidebar">
//       <img src="/images/netcradus-logo.png" alt="NC Logo" className="logo-image" />

//       <h2 className="logo">NETCRADUS</h2>
//       <nav>
//         <ul>
//           <li><Link to="/dashboard" style={linkStyle}><FaHome /> Home</Link></li>
//           <li><Link to="/leads" style={linkStyle}><FaUser /> Leads</Link></li>
//           <li><Link to="/contacts" style={linkStyle}><FaPhone /> Contacts</Link></li>
//           <li><Link to="/accounts" style={linkStyle}><FaBuilding /> Accounts</Link></li>
//           <li><Link to="/deals" style={linkStyle}><FaHandshake /> Deals</Link></li>
//           <li><Link to="/tasks" style={linkStyle}><FaTasks /> Tasks</Link></li>
//           <li><Link to="/meetings" style={linkStyle}><FaCalendarAlt /> Meetings</Link></li>
//           <li><Link to="/calls" style={linkStyle}><FaPhoneSquareAlt /> Calls</Link></li>
//           <li><Link to="/products" style={linkStyle}><FaBox /> Products</Link></li>
//           <li><Link to="/quotes" style={linkStyle}><FaFileInvoice /> Quotes</Link></li>
//           <li><Link to="/sales-orders" style={linkStyle}><FaClipboardList /> Sales Orders</Link></li>
//           <li><Link to="/purchase-orders" style={linkStyle}><FaTruck /> Purchase Orders</Link></li>
//           <li><Link to="/invoices" style={linkStyle}><FaFileAlt /> Invoices</Link></li>
//           <li><Link to="/sales-inbox" style={linkStyle}><FaEnvelopeOpenText /> SalesInbox</Link></li>
//           <li><Link to="/campaigns" style={linkStyle}><FaBullhorn /> Campaigns</Link></li>
//           <li><Link to="/vendors" style={linkStyle}><FaUserTie /> Vendors</Link></li>
//           <li><Link to="/price-books" style={linkStyle}><FaBook /> Price Books</Link></li>
//           <li><Link to="/cases" style={linkStyle}><FaBriefcase /> Cases</Link></li>
//           <li><Link to="/solutions" style={linkStyle}><FaBookOpen /> Solutions</Link></li>
//           <li><Link to="/documents" style={linkStyle}><FaFile /> Documents</Link></li>
//           <li><Link to="/forecasts" style={linkStyle}><FaChartBar /> Forecasts</Link></li>
//           <li><Link to="/visits" style={linkStyle}><FaMapMarkerAlt /> Visits</Link></li>
//           <li><Link to="/social" style={linkStyle}><FaComments /> Social</Link></li>
//           <li><Link to="/services" style={linkStyle}><FaCogs /> Services</Link></li>
//           <li><Link to="/projects" style={linkStyle}><FaProjectDiagram /> Projects</Link></li>
//           <li><Link to="/ct" style={linkStyle}><FaTools /> CT</Link></li>
//           <li><Link to="/crm-teamspaces" style={linkStyle}><FaUserFriends /> CRM Teamspaces</Link></li>
//         </ul>
//       </nav>
//     </div>
//   );
// }

// const linkStyle = {
//   color: "white",
//   textDecoration: "none",
//   display: "flex",
//   alignItems: "center",
//   gap: "10px",
// };

// export default Sidebar;



import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";

import { Link } from "react-router-dom";
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
  const menuItems = [
    { label: "Home", path: "/dashboard", icon: <FaHome /> },
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

  const filteredMenu = [...menuItems]
    .filter(item =>
      item.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      searchTerm ? a.label.localeCompare(b.label) : 0
    );

  return (
    <div className="sidebar">

      <div className="logo-container">

        {/* <img src="/New%20LOGOPNG.png" alt="Netcradus Logo" className="logo-image" /> */}
        <img src="/NETCRADUS logo2.png" alt="Netcradus Logo" className="logo-image" />



      </div>
      {/* ✅ SEARCH BAR HERE */}
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
            filteredMenu.map((item, index) => (
              <li key={index}>
                <Link to={item.path} style={linkStyle}>
                  {item.icon}
                  {item.label}
                </Link>
              </li>
              // <li><Link to="/dashboard" style={linkStyle}><FaHome /> Home</Link></li>
              //  <li><Link to="/leads" style={linkStyle}><FaUser /> Leads</Link></li> 
              //  <li><Link to="/contacts" style={linkStyle}><FaPhone /> Contacts</Link></li> 
              //  <li><Link to="/accounts" style={linkStyle}><FaBuilding /> Accounts</Link></li> 
              //  <li><Link to="/deals" style={linkStyle}><FaHandshake /> Deals</Link></li>
              //   <li><Link to="/tasks" style={linkStyle}><FaTasks /> Tasks</Link></li>
              //   <li><Link to="/meetings" style={linkStyle}><FaCalendarAlt /> Meetings</Link></li> 
              //    <li><Link to="/calls" style={linkStyle}><FaPhoneSquareAlt /> Calls</Link></li> 
              //    <li><Link to="/products" style={linkStyle}><FaBox /> Products</Link></li> 
              //    <li><Link to="/quotes" style={linkStyle}><FaFileInvoice /> Quotes</Link></li>
              //     <li><Link to="/sales-orders" style={linkStyle}><FaClipboardList /> Sales Orders</Link></li>
              //      <li><Link to="/purchase-orders" style={linkStyle}><FaTruck /> Purchase Orders</Link></li> 
              //      <li><Link to="/invoices" style={linkStyle}><FaFileAlt /> Invoices</Link></li>
              //       <li><Link to="/sales-inbox" style={linkStyle}><FaEnvelopeOpenText /> SalesInbox</Link></li> 
              //       <li><Link to="/campaigns" style={linkStyle}><FaBullhorn /> Campaigns</Link></li>
              //        <li><Link to="/vendors" style={linkStyle}><FaUserTie /> Vendors</Link></li>
              //         <li><Link to="/price-books" style={linkStyle}><FaBook /> Price Books</Link></li> 
              //         <li><Link to="/cases" style={linkStyle}><FaBriefcase /> Cases</Link></li> 
              //         <li><Link to="/solutions" style={linkStyle}><FaBookOpen /> Solutions</Link></li>
              //          <li><Link to="/documents" style={linkStyle}><FaFile /> Documents</Link></li>
              //           <li><Link to="/forecasts" style={linkStyle}><FaChartBar /> Forecasts</Link></li>
              //            <li><Link to="/visits" style={linkStyle}><FaMapMarkerAlt /> Visits</Link></li> 
              //            <li><Link to="/social" style={linkStyle}><FaComments /> Social</Link></li> 
              //            <li><Link to="/services" style={linkStyle}><FaCogs /> Services</Link></li> 
              //            <li><Link to="/projects" style={linkStyle}><FaProjectDiagram /> Projects</Link></li>
              //             <li><Link to="/ct" style={linkStyle}><FaTools /> CT</Link></li>
              //              <li><Link to="/crm-teamspaces" style={linkStyle}><FaUserFriends /> CRM Teamspaces</Link></li>
            ))
          ) : (
            <li className="no-result">No results found</li>
          )}
        </ul>
      </nav>
    </div>
  );
}

const linkStyle = {
  color: "white",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

export default Sidebar;
