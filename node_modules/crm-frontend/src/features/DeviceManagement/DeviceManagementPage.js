import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { Plus, Edit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, Download, Upload, ChevronLeft, ChevronRight, X } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyForm = { number: "", product: "Computer", custom_product: "", product_type: "Monitor", custom_product_type: "", serial_number: "" };
const PRODUCT_OPTIONS = [
  "Computer",
  "Laptop",
  "Desktop",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Printer",
  "Scanner",
  "UPS",
  "Headphones",
  "Headset",
  "Webcam",
  "Microphone",
  "Speaker",
  "Projector",
  "Television",
  "IP Phone",
  "Mobile Phone",
  "Tablet",
  "Docking Station",
  "External Hard Drive",
  "SSD",
  "USB Flash Drive",
  "WiFi Router",
  "Network Switch",
  "Firewall",
  "Access Point",
  "Server",
  "CCTV Camera",
  "Biometric Device",
  "Barcode Scanner",
  "Label Printer",
  "POS Machine",
  "Power Adapter",
  "Extension Board",
  "Other"
];
const PRODUCT_TYPE_OPTIONS = [
  "Monitor",
  "Keyboard",
  "Mouse",
  "CPU",
  "UPS",
  "Charger",
  "Adapter",
  "Cable",
  "Battery",
  "Dock",
  "Receiver",
  "Camera",
  "Display",
  "Speaker",
  "Microphone",
  "Headphone",
  "Headset",
  "Remote",
  "SSD",
  "HDD",
  "RAM",
  "Graphics Card",
  "Motherboard",
  "Power Supply",
  "Other"
];

function SearchableDropdown({ options, value, onChange, placeholder, hasSearch = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openDirection, setOpenDirection] = useState("down");
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0, width: 0 });
  const wrapperRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        const portalMenu = document.getElementById("dropdown-portal-menu");
        if (portalMenu && portalMenu.contains(event.target)) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const updatePosition = useCallback(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = 240;

      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setOpenDirection("up");
        setMenuCoords({
          top: rect.top - dropdownHeight - 4,
          left: rect.left,
          width: rect.width
        });
      } else {
        setOpenDirection("down");
        setMenuCoords({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width
        });
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const dropdownMenuElement = isOpen ? (
    <div
      id="dropdown-portal-menu"
      className="dropdown-menu"
      style={{
        position: "fixed",
        top: `${menuCoords.top}px`,
        left: `${menuCoords.left}px`,
        width: `${menuCoords.width}px`,
        maxHeight: "240px",
        overflowY: "auto",
        zIndex: 99999,
        background: "var(--color-bg-surface-strong, #1f1f1f)",
        border: "1px solid var(--color-border, #3a3a44)",
        borderRadius: "10px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {hasSearch && (
        <div style={{ padding: "8px", borderBottom: "1px solid var(--color-border)", position: "sticky", top: 0, background: "var(--color-bg-surface-strong, #1f1f1f)", zIndex: 10 }}>
          <input
            className="form-input"
            style={{ height: "30px", fontSize: "12px", padding: "0 8px", width: "100%", background: "var(--color-bg-surface, #262626)" }}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {filteredOptions.map((opt) => (
          <div
            key={opt}
            className="dropdown-option"
            onClick={() => {
              onChange(opt);
              setIsOpen(false);
            }}
            style={{
              padding: "10px 16px",
              cursor: "pointer",
              fontSize: "var(--text-sm)",
              color: opt === value ? "var(--color-accent, #ff6b00)" : "var(--color-text-primary, #ffffff)",
              background: opt === value ? "var(--color-bg-hover, #333333)" : "transparent",
              fontWeight: opt === value ? "var(--font-semibold)" : "normal",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => {
              if (opt !== value) e.currentTarget.style.background = "var(--color-bg-hover, #2a2a2a)";
            }}
            onMouseOut={(e) => {
              if (opt !== value) e.currentTarget.style.background = "transparent";
            }}
          >
            {opt}
          </div>
        ))}
        {filteredOptions.length === 0 && (
          <div style={{ padding: "10px 16px", color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
            No options found
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} className="dropdown-wrapper" style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="form-input"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
          border: isOpen ? "1px solid var(--color-accent, #ff6b00)" : "1px solid var(--color-border)",
          boxShadow: isOpen ? "0 0 0 2px rgba(255, 107, 0, 0.2)" : "none",
          borderRadius: "8px",
          height: "38px",
          padding: "0 12px",
          background: "var(--color-bg-surface, #262626)",
          color: "var(--color-text-primary, #ffffff)",
          fontSize: "var(--text-sm)"
        }}
      >
        <span>{value || placeholder}</span>
        <span style={{ fontSize: "10px", color: "var(--color-text-muted)", transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
      </div>
      {isOpen && createPortal(dropdownMenuElement, document.body)}
    </div>
  );
}

function DeviceManagementPage() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // Search, Pagination, Sorting
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(apiUrl("/api/device-management"), {
        headers,
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder
        }
      });
      if (res.data?.success) {
        setDevices(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load devices.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const payload = {
      number: form.number,
      product: form.product === "Other" ? form.custom_product.trim() : form.product,
      product_type: form.product_type === "Other" ? form.custom_product_type.trim() : form.product_type,
      serial_number: form.serial_number
    };

    // Front-end validations
    if (!payload.number.trim()) {
      setFormError("NUMBER is required.");
      return;
    }
    if (form.product === "Other" && !form.custom_product.trim()) {
      setFormError("Custom Product Name is required.");
      return;
    }
    if (form.product_type === "Other" && !form.custom_product_type.trim()) {
      setFormError("Custom Product Type is required.");
      return;
    }
    if (!payload.serial_number.trim()) {
      setFormError("SERIAL NUMBER is required.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(apiUrl(`/api/device-management/${editingId}`), payload, { headers });
      } else {
        await axios.post(apiUrl("/api/device-management"), payload, { headers });
      }
      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
      fetchDevices();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save device.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this device?")) return;
    setError("");
    try {
      await axios.delete(apiUrl(`/api/device-management/${id}`), { headers });
      fetchDevices();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete device.");
    }
  };

  const handleExport = async () => {
    try {
      const res = await axios.get(apiUrl("/api/device-management?limit=10000"), { headers });
      if (res.data?.success) {
        const allDevices = res.data.data;
        const csvHeaders = ["NUMBER", "PRODUCT", "PRODUCT TYPE", "SERIAL NUMBER"];
        const rows = allDevices.map(d => [
          `"${String(d.number).replace(/"/g, '""')}"`,
          `"${String(d.product).replace(/"/g, '""')}"`,
          `"${String(d.product_type).replace(/"/g, '""')}"`,
          `"${String(d.serial_number).replace(/"/g, '""')}"`
        ]);
        const csvContent = [csvHeaders.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "devices.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      setError("Failed to export devices.");
    }
  };

  const handleImportClick = () => {
    document.getElementById("csv-file-input").click();
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/);
      const devicesToImport = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const columns = line.split(",").map(col => col.replace(/^["']|["']$/g, "").trim());
        if (columns.length >= 4) {
          devicesToImport.push({
            number: columns[0],
            product: columns[1],
            product_type: columns[2],
            serial_number: columns[3]
          });
        }
      }

      if (devicesToImport.length === 0) {
        setError("No valid devices found in the selected file.");
        return;
      }

      let successCount = 0;
      let failMessages = [];

      for (const dev of devicesToImport) {
        try {
          await axios.post(apiUrl("/api/device-management"), dev, { headers });
          successCount++;
        } catch (err) {
          failMessages.push(`${dev.number}: ${err.response?.data?.message || err.message}`);
        }
      }

      let summary = `Import complete: ${successCount} devices imported.`;
      if (failMessages.length > 0) {
        summary += ` ${failMessages.length} failed. Details: \n` + failMessages.join("\n");
      }
      alert(summary);
      fetchDevices();
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset file input
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown size={12} style={{ marginLeft: "6px", color: "var(--color-text-muted)" }} />;
    return sortOrder === "asc"
      ? <ArrowUp size={12} style={{ marginLeft: "6px", color: "var(--color-accent)" }} />
      : <ArrowDown size={12} style={{ marginLeft: "6px", color: "var(--color-accent)" }} />;
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .nc-modal-content {
          max-height: 90vh !important;
          overflow: visible !important;
        }
        .nc-modal-body {
          max-height: calc(90vh - 140px) !important;
          overflow-y: auto !important;
        }
      `}} />
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Management</span><ChevronRight size={10} /><span>Device Management</span>
          </div>
          <h1 className="title">Device Management</h1>
          <p className="subtitle">Overview and details of all company devices and products.</p>
        </div>
        <div className="page-header-right" style={{ display: "flex", gap: "var(--space-3)", alignItems: "center" }}>
          <input
            type="file"
            id="csv-file-input"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleImport}
          />
          <button className="btn btn-ghost" onClick={handleImportClick} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Upload size={16} /> Import Excel
          </button>
          <button className="btn btn-ghost" onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Download size={16} /> Export Excel
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(emptyForm); setFormError(""); setShowModal(true); }} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> Add Device
          </button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            className="form-input"
            style={{ paddingLeft: "36px" }}
            placeholder="Search by Number or Serial Number..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {error && (
        <div className="badge badge-error" style={{ marginBottom: "var(--space-4)", padding: "var(--space-2) var(--space-4)", width: "100%" }}>
          {error}
        </div>
      )}

      <div className="nc-card">
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "var(--space-10)" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "3px solid rgba(255, 255, 255, 0.08)",
                borderTopColor: "var(--color-accent)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite"
              }}
            />
            <p style={{ marginTop: "var(--space-3)", color: "var(--color-text-muted)" }}>Loading devices...</p>
          </div>
        ) : (
          <>
            <table className="nc-table">
              <thead>
                <tr>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("number")}>
                    NUMBER {renderSortIcon("number")}
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("product")}>
                    PRODUCT {renderSortIcon("product")}
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("product_type")}>
                    PRODUCT TYPE {renderSortIcon("product_type")}
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("serial_number")}>
                    SERIAL NUMBER {renderSortIcon("serial_number")}
                  </th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: "var(--font-semibold)" }}>{d.number}</td>
                    <td><span className="badge badge-neutral">{d.product}</span></td>
                    <td><span className="badge badge-neutral">{d.product_type}</span></td>
                    <td>{d.serial_number}</td>
                    <td>
                      <div style={{ display: "flex", gap: "var(--space-2)" }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "var(--space-1)" }}
                          onClick={() => {
                            setEditingId(d._id);
                            const isPredefinedProd = PRODUCT_OPTIONS.slice(0, -1).includes(d.product);
                            const isPredefinedType = PRODUCT_TYPE_OPTIONS.slice(0, -1).includes(d.product_type);
                            setForm({
                              number: d.number,
                              product: isPredefinedProd ? d.product : "Other",
                              custom_product: isPredefinedProd ? "" : d.product,
                              product_type: isPredefinedType ? d.product_type : "Other",
                              custom_product_type: isPredefinedType ? "" : d.product_type,
                              serial_number: d.serial_number
                            });
                            setFormError("");
                            setShowModal(true);
                          }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: "var(--space-1)", color: "var(--color-error)" }}
                          onClick={() => handleDelete(d._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {devices.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-4)", borderTop: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                  Showing page {pagination.page} of {pagination.pages} (Total {pagination.total} records)
                </span>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button
                    className="btn btn-ghost"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    style={{ height: "32px", padding: "0 var(--space-2)" }}
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <button
                    className="btn btn-ghost"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                    style={{ height: "32px", padding: "0 var(--space-2)" }}
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(e) => e.stopPropagation()} style={{ width: "450px" }}>
            <div className="nc-modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>{editingId ? "Edit Device" : "Add Device"}</h3>
              <button className="btn btn-ghost" style={{ padding: 4 }} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="nc-modal-body">
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {formError && (
                  <div className="badge badge-error" style={{ padding: "var(--space-2) var(--space-3)" }}>
                    {formError}
                  </div>
                )}
                <div className="form-field">
                  <label className="form-label">NUMBER *</label>
                  <input
                    className="form-input"
                    required
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">PRODUCT *</label>
                  <SearchableDropdown
                    options={PRODUCT_OPTIONS}
                    value={form.product}
                    onChange={(val) => setForm({ ...form, product: val })}
                    placeholder="Select Product"
                    hasSearch={true}
                  />
                </div>
                {form.product === "Other" && (
                  <div className="form-field">
                    <label className="form-label">Custom Product Name *</label>
                    <input
                      className="form-input"
                      required
                      placeholder="Enter Product Name"
                      value={form.custom_product}
                      onChange={(e) => setForm({ ...form, custom_product: e.target.value })}
                    />
                  </div>
                )}
                <div className="form-field">
                  <label className="form-label">PRODUCT TYPE *</label>
                  <SearchableDropdown
                    options={PRODUCT_TYPE_OPTIONS}
                    value={form.product_type}
                    onChange={(val) => setForm({ ...form, product_type: val })}
                    placeholder="Select Product Type"
                    hasSearch={true}
                  />
                </div>
                {form.product_type === "Other" && (
                  <div className="form-field">
                    <label className="form-label">Custom Product Type *</label>
                    <input
                      className="form-input"
                      required
                      placeholder="Enter Product Type"
                      value={form.custom_product_type}
                      onChange={(e) => setForm({ ...form, custom_product_type: e.target.value })}
                    />
                  </div>
                )}
                <div className="form-field">
                  <label className="form-label">SERIAL NUMBER *</label>
                  <input
                    className="form-input"
                    required
                    value={form.serial_number}
                    onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    {editingId ? "Save Changes" : "Add Device"}
                  </button>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceManagementPage;
