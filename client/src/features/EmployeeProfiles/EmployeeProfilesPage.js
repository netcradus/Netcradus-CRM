import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { User, Briefcase, Mail, Phone, MapPin, Plus, Save, Download, FileText, Search } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyForm = {
  name: "", email: "", department: "", designation: "", status: "Employee",
  joiningDate: "", leavingDate: "", salary: "", contactNumber: "", address: "",
  emergencyContactName: "", emergencyContactNumber: "", personalEmail: "",
};

const emptySalarySlipForm = {
  month: "", year: new Date().getFullYear(), payDate: new Date().toISOString().slice(0, 10),
  basicSalary: "", hra: "", conveyance: "", bonus: "", specialAllowance: "",
  providentFund: "", professionalTax: "", otherDeductions: "", notes: "",
};

const toDateInput = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
const formatRole = (r = "") => r === "admin" ? "Administrator" : String(r||"").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

function EmployeeProfilesPage() {
  const token = localStorage.getItem("token");
  const [profiles, setProfiles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [salarySlipForm, setSalarySlipForm] = useState(emptySalarySlipForm);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(apiUrl("/api/contacts/profiles"), { headers });
      setProfiles(data);
      if (data.length && !selectedUserId) {
        setSelectedUserId(data[0].linkedUser?._id);
      }
    } catch (err) { setError("Failed to load profiles"); }
    finally { setLoading(false); }
  }, [headers, selectedUserId]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const selectedProfile = profiles.find(p => p.linkedUser?._id === selectedUserId) || null;

  useEffect(() => {
    if (selectedProfile) {
      setForm({
        ...selectedProfile,
        joiningDate: toDateInput(selectedProfile.joiningDate),
        leavingDate: toDateInput(selectedProfile.leavingDate),
        salary: selectedProfile.salary ?? "",
      });
      setSalarySlipForm({ ...emptySalarySlipForm, basicSalary: selectedProfile.salary ?? "" });
    }
  }, [selectedProfile]);

  const onUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(apiUrl(`/api/contacts/profiles/${selectedUserId}`), form, { headers });
      setMessage("Profile updated successfully");
      fetchProfiles();
    } catch (err) { setError("Failed to update profile"); }
    finally { setSaving(false); }
  };

  const generateSalarySlip = async () => {
    if (!selectedUserId) return;

    try {
      await axios.post(apiUrl(`/api/contacts/profiles/${selectedUserId}/salary-slips`), salarySlipForm, { headers });
      setMessage("Salary slip generated successfully");
      fetchProfiles();
    } catch (err) {
      setError("Failed to generate salary slip");
    }
  };

  const downloadSalarySlip = async (slipId, filename = "salary-slip.pdf") => {
    try {
      const response = await axios.get(apiUrl(`/api/contacts/salary-slips/${slipId}/download`), {
        headers,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download salary slip");
    }
  };

  const filteredProfiles = profiles.filter(p => (p.name||"").toLowerCase().includes(search.toLowerCase()) || (p.email||"").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="title">Employee Profiles</h1>
          <p className="subtitle">Central directory for staff records and payroll.</p>
        </div>
      </div>

      <div className="employee-profiles-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-6)' }}>
        <div className="nc-card" style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-4)' }}>
           <div className="form-field" style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: '36px' }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
           </div>
           <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {filteredProfiles.map(p => (
                <button key={p._id} className={`btn btn-ghost`} style={{ 
                    justifyContent: 'flex-start', textAlign: 'left', padding: 'var(--space-3)', 
                    background: selectedUserId === p.linkedUser?._id ? 'var(--color-accent-muted)' : 'transparent',
                    border: '1px solid', borderColor: selectedUserId === p.linkedUser?._id ? 'var(--color-accent-soft)' : 'transparent'
                  }} onClick={() => setSelectedUserId(p.linkedUser?._id)}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'var(--font-semibold)', color: 'var(--color-text-primary)' }}>{p.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{p.designation} • {p.department}</span>
                  </div>
                </button>
              ))}
           </div>
        </div>

        <div className="employee-profiles-detail-pane" style={{ overflowY: 'auto', paddingRight: 'var(--space-2)' }}>
          {selectedProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <form className="nc-card form" onSubmit={onUpdate}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)' }}>Personal Information</h3>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
                
                <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-field">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Work Email</label>
                    <input className="form-input" value={form.email || ""} readOnly style={{ opacity: 0.7 }} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={form.department || ""} onChange={e => setForm({...form, department: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Designation</label>
                    <input className="form-input" value={form.designation || ""} onChange={e => setForm({...form, designation: e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status || "Employee"} onChange={e => setForm({...form, status: e.target.value})}>
                       <option value="Employee">Employee</option><option value="Ex-Employee">Ex-Employee</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Salary (₹)</label>
                    <input className="form-input" type="number" value={form.salary || ""} onChange={e => setForm({...form, salary: e.target.value})} />
                  </div>
                </div>
                
                <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                  <h4 style={{ marginBottom: 'var(--space-3)' }}>Contact Details</h4>
                  <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={form.contactNumber || ""} onChange={e => setForm({...form, contactNumber: e.target.value})} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Personal Email</label>
                      <input className="form-input" value={form.personalEmail || ""} onChange={e => setForm({...form, personalEmail: e.target.value})} />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Address</label>
                      <textarea className="form-input" rows={2} value={form.address || ""} onChange={e => setForm({...form, address: e.target.value})} />
                    </div>
                  </div>
                </div>
              </form>

              <div className="nc-card">
                <h3 style={{ marginBottom: 'var(--space-4)' }}>Payroll & Salary Slips</h3>
                <div className="employee-profile-payroll-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                  <div className="form">
                    <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>Generate New Slip</h4>
                    <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                      <div className="form-field">
                        <label className="form-label">Month</label>
                        <input className="form-input" placeholder="e.g. May" value={salarySlipForm.month || ""} onChange={e => setSalarySlipForm({...salarySlipForm, month: e.target.value})} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Year</label>
                        <input className="form-input" type="number" value={salarySlipForm.year || ""} onChange={e => setSalarySlipForm({...salarySlipForm, year: e.target.value})} />
                      </div>
                    </div>
                    <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={generateSalarySlip}>Generate Slip</button>
                  </div>
                  
                  <div>
                    <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>History</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {selectedProfile.salarySlips?.length ? selectedProfile.salarySlips.map((s, i) => (
                        <div key={i} className="nc-card" style={{ padding: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-surface)' }}>
                          <div>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>{s.month} {s.year}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Net: ₹{s.netPay?.toLocaleString('en-IN')}</div>
                          </div>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-2)' }} onClick={() => downloadSalarySlip(s._id, s.filename)}><Download size={14} /></button>
                        </div>
                      )) : <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>No slips generated yet.</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="nc-card" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
              Select an employee profile to view and manage details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeProfilesPage;
