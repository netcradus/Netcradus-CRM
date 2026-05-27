import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Edit, Eye, KeyRound, ShieldOff } from "lucide-react";
import { partnerApi, StatusBadge } from "./partnerApi";

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    // Super Admin loads every partner plus all partner-owned vendor/project records.
    Promise.all([
      partnerApi.adminPartners(),
      partnerApi.vendors(),
      partnerApi.projects(),
    ])
      .then(([partnerRes, vendorRes, projectRes]) => {
        setPartners(partnerRes.data.partners || []);
        setVendors(vendorRes.data.vendors || []);
        setProjects(projectRes.data.projects || []);
      })
      .catch(() => {
        setPartners([]);
        setVendors([]);
        setProjects([]);
      });
  }, []);

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Partners</h1>
          <p className="subtitle">External partner accounts and their submitted work.</p>
        </div>
      </div>
      <div className="nc-card">
        <table className="nc-table">
          <thead><tr><th>Partner Name</th><th>Email</th><th>Total Vendors</th><th>Active Projects</th><th>Status</th><th>Date Created</th><th>Actions</th></tr></thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner._id}>
                <td>{partner.name}</td>
                <td>{partner.email}</td>
                <td>{partner.totalVendors || 0}</td>
                <td>{partner.activeProjects || 0}</td>
                <td><span className={`badge badge-${partner.isDisabled ? "warning" : "success"}`}>{partner.isDisabled ? "Suspended" : "Active"}</span></td>
                <td>{partner.createdAt ? new Date(partner.createdAt).toLocaleDateString("en-GB") : "-"}</td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <Link className="btn btn-ghost" to={`/admin/partners/${partner._id}`} title="View"><Eye size={14} /></Link>
                    <Link className="btn btn-ghost" to="/user-management" title="Edit"><Edit size={14} /></Link>
                    <Link className="btn btn-ghost" to="/user-management" title="Suspend"><ShieldOff size={14} /></Link>
                    <Link className="btn btn-ghost" to="/user-management" title="Reset Password"><KeyRound size={14} /></Link>
                  </div>
                </td>
              </tr>
            ))}
            {!partners.length && <tr><td colSpan="7" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No partners found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="page-header" style={{ marginTop: "var(--space-8)" }}>
        <div className="page-header-left">
          <h2 className="title" style={{ fontSize: "var(--text-xl)" }}>Partner Vendors</h2>
          <p className="subtitle">All vendors created by partner accounts.</p>
        </div>
      </div>
      <div className="nc-card">
        <table className="nc-table">
          <thead><tr><th>Vendor Name</th><th>Partner</th><th>Contact</th><th>Email</th><th>Phone</th><th>Country</th><th>Status</th></tr></thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor._id}>
                <td>{vendor.name}</td>
                <td>{vendor.partnerId?.name || vendor.partnerId?.email || "-"}</td>
                <td>{vendor.contactPerson || "-"}</td>
                <td>{vendor.email}</td>
                <td>{vendor.phone || "-"}</td>
                <td>{vendor.country || "-"}</td>
                <td><span className={`badge badge-${vendor.status === "Active" ? "success" : "warning"}`}>{vendor.status}</span></td>
              </tr>
            ))}
            {!vendors.length && <tr><td colSpan="7" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No partner vendors found.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="page-header" style={{ marginTop: "var(--space-8)" }}>
        <div className="page-header-left">
          <h2 className="title" style={{ fontSize: "var(--text-xl)" }}>Partner Projects</h2>
          <p className="subtitle">All projects submitted by partner accounts.</p>
        </div>
      </div>
      <div className="nc-card">
        <table className="nc-table">
          <thead><tr><th>Project</th><th>Partner</th><th>Vendor</th><th>Service</th><th>Status</th><th>Priority</th><th>Deadline</th></tr></thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project._id}>
                <td>{project.name}</td>
                <td>{project.partnerId?.name || project.partnerId?.email || "-"}</td>
                <td>{project.vendorId?.name || "-"}</td>
                <td>{project.serviceType || "-"}</td>
                <td><StatusBadge status={project.status} /></td>
                <td>{project.priority || "-"}</td>
                <td>{project.deadline ? new Date(project.deadline).toLocaleDateString("en-GB") : "-"}</td>
              </tr>
            ))}
            {!projects.length && <tr><td colSpan="7" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No partner projects found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
