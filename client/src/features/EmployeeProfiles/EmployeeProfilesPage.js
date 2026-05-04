import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import "./EmployeeProfilesPage.css";

const emptyForm = {
  name: "",
  email: "",
  department: "",
  designation: "",
  status: "Employee",
  joiningDate: "",
  leavingDate: "",
  salary: "",
  contactNumber: "",
  address: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  personalEmail: "",
};

const emptySalarySlipForm = {
  month: "",
  year: new Date().getFullYear(),
  payDate: new Date().toISOString().slice(0, 10),
  basicSalary: "",
  hra: "",
  conveyance: "",
  bonus: "",
  specialAllowance: "",
  providentFund: "",
  professionalTax: "",
  otherDeductions: "",
  notes: "",
};

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");
const formatRole = (role = "") =>
  role === "admin"
    ? "Administrator"
    : String(role || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

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

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  const hydrateForm = useCallback((profile) => {
    if (!profile) {
      setForm(emptyForm);
      return;
    }

    setForm({
      name: profile.name || "",
      email: profile.email || "",
      department: profile.department || "",
      designation: profile.designation || "",
      status: profile.status || "Employee",
      joiningDate: toDateInput(profile.joiningDate),
      leavingDate: toDateInput(profile.leavingDate),
      salary: profile.salary ?? "",
      contactNumber: profile.contactNumber || "",
      address: profile.address || "",
      emergencyContactName: profile.emergencyContactName || "",
      emergencyContactNumber: profile.emergencyContactNumber || "",
      personalEmail: profile.personalEmail || "",
    });
  }, []);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(apiUrl("/api/contacts/profiles"), { headers });
      setProfiles(data);
      const nextSelectedId = selectedUserId || data[0]?.linkedUser?._id || "";
      setSelectedUserId(nextSelectedId);
      hydrateForm(data.find((profile) => profile.linkedUser?._id === nextSelectedId) || data[0] || null);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load employee profiles");
    } finally {
      setLoading(false);
    }
  }, [headers, hydrateForm, selectedUserId]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const filteredProfiles = profiles.filter((profile) =>
    `${profile.name || ""} ${profile.email || ""} ${profile.department || ""} ${profile.designation || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedProfile =
    profiles.find((profile) => profile.linkedUser?._id === selectedUserId) || null;

  useEffect(() => {
    hydrateForm(selectedProfile);
  }, [hydrateForm, selectedProfile]);

  useEffect(() => {
    setSalarySlipForm({
      ...emptySalarySlipForm,
      basicSalary: selectedProfile?.salary ?? "",
    });
  }, [selectedProfile]);

  const onSelectProfile = (profile) => {
    setSelectedUserId(profile.linkedUser?._id || "");
    setMessage("");
    setError("");
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSalarySlipChange = (event) => {
    const { name, value } = event.target;
    setSalarySlipForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!selectedProfile?.linkedUser?._id) return;

    try {
      setSaving(true);
      const payload = {
        ...form,
        leavingDate: form.leavingDate || null,
        salary: form.salary === "" ? null : Number(form.salary),
      };

      const { data } = await axios.put(
        apiUrl(`/api/contacts/profiles/${selectedProfile.linkedUser._id}`),
        payload,
        { headers }
      );

      setMessage(data.message || "Employee profile updated");
      setError("");
      await fetchProfiles();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update employee profile");
      setMessage("");
    } finally {
      setSaving(false);
    }
  };

  const onGenerateSalarySlip = async (event) => {
    event.preventDefault();
    if (!selectedProfile?.linkedUser?._id) return;

    try {
      setSaving(true);
      const { data } = await axios.post(
        apiUrl(`/api/contacts/profiles/${selectedProfile.linkedUser._id}/salary-slips`),
        salarySlipForm,
        { headers }
      );
      setMessage(data.message || "Salary slip generated");
      setError("");
      await fetchProfiles();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate salary slip");
      setMessage("");
    } finally {
      setSaving(false);
    }
  };

  const onDownloadSalarySlip = async (contactId, slipId, filename) => {
    try {
      const response = await axios.get(
        apiUrl(`/api/contacts/salary-slips/${slipId}/download`),
        {
          headers,
          responseType: "blob",
        }
      );

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || `salary-slip.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to download salary slip");
    }
  };

  return (
    <div className="employee-profiles-page">
      <div className="employee-profiles-hero">
        <div>
          <p className="employee-profiles-kicker">HR Workspace</p>
          <h1>Employee Profiles</h1>
          <p className="employee-profiles-subtitle">
            Manage employee information from one live profile record.
          </p>
        </div>
        <div className="employee-hero-stats">
          <div className="employee-hero-stat">
            <span>Total Profiles</span>
            <strong>{profiles.length}</strong>
          </div>
          <div className="employee-hero-stat">
            <span>Departments</span>
            <strong>{new Set(profiles.map((profile) => profile.department || "General")).size}</strong>
          </div>
        </div>
      </div>

      {error && <div className="profile-alert error">{error}</div>}
      {message && <div className="profile-alert success">{message}</div>}

      <div className="employee-profiles-layout">
        <aside className="employee-sidebar-card">
          <div className="employee-sidebar-head">
            <h2>Employees</h2>
            <span>{profiles.length} total</span>
          </div>
          <input
            className="employee-search"
            type="text"
            placeholder="Search employees"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="employee-list">
            {loading ? (
              <p className="employee-empty">Loading profiles...</p>
            ) : filteredProfiles.length ? (
              filteredProfiles.map((profile) => (
                <button
                  key={profile._id}
                  type="button"
                  className={`employee-list-item ${
                    profile.linkedUser?._id === selectedUserId ? "active" : ""
                  }`}
                  onClick={() => onSelectProfile(profile)}
                >
                  <div className="employee-list-accent" />
                  <strong>{profile.name || "Unnamed User"}</strong>
                  <span>{profile.email}</span>
                  <small>
                    {formatRole(profile.linkedUser?.role)} • {profile.department || "General"}
                  </small>
                </button>
              ))
            ) : (
              <p className="employee-empty">No employees matched your search.</p>
            )}
          </div>
        </aside>

        <section className="employee-form-card">
          {selectedProfile ? (
            <div className="employee-profile-form">
              <div className="employee-form-head">
                <div>
                  <h2>{selectedProfile.name || "Employee Profile"}</h2>
                  <p>
                    Role: {formatRole(selectedProfile.linkedUser?.role)} | User ID:{" "}
                    {selectedProfile.linkedUser?._id}
                  </p>
                </div>
                <button type="button" className="profile-save-button" disabled={saving} onClick={onSubmit}>
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>

              <div className="employee-profile-banner">
                <div className="employee-profile-banner-item">
                  <span>Role</span>
                  <strong>{formatRole(selectedProfile.linkedUser?.role)}</strong>
                </div>
                <div className="employee-profile-banner-item">
                  <span>Status</span>
                  <strong>{form.status || "Employee"}</strong>
                </div>
                <div className="employee-profile-banner-item">
                  <span>Salary</span>
                  <strong>{form.salary ? `Rs. ${form.salary}` : "Not set"}</strong>
                </div>
              </div>

              <div className="employee-form-grid">
                <label>
                  Full Name
                  <input name="name" value={form.name} onChange={onChange} required />
                </label>
                <label>
                  Work Email
                  <input name="email" type="email" value={form.email} onChange={onChange} required />
                </label>
                <label>
                  Department
                  <input name="department" value={form.department} onChange={onChange} />
                </label>
                <label>
                  Designation
                  <input name="designation" value={form.designation} onChange={onChange} />
                </label>
                <label>
                  Status
                  <select name="status" value={form.status} onChange={onChange}>
                    <option value="Employee">Employee</option>
                    <option value="Ex-Employee">Ex-Employee</option>
                    <option value="Lead">Lead</option>
                    <option value="Customer">Customer</option>
                  </select>
                </label>
                <label>
                  Salary
                  <input name="salary" type="number" min="0" value={form.salary} onChange={onChange} />
                </label>
                <label>
                  Joining Date
                  <input name="joiningDate" type="date" value={form.joiningDate} onChange={onChange} />
                </label>
                <label>
                  Leaving Date
                  <input name="leavingDate" type="date" value={form.leavingDate} onChange={onChange} />
                </label>
                <label>
                  Contact Number
                  <input name="contactNumber" value={form.contactNumber} onChange={onChange} />
                </label>
                <label>
                  Personal Email
                  <input
                    name="personalEmail"
                    type="email"
                    value={form.personalEmail}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Emergency Contact Name
                  <input
                    name="emergencyContactName"
                    value={form.emergencyContactName}
                    onChange={onChange}
                  />
                </label>
                <label>
                  Emergency Contact Number
                  <input
                    name="emergencyContactNumber"
                    value={form.emergencyContactNumber}
                    onChange={onChange}
                  />
                </label>
                <label className="full-span">
                  Address
                  <textarea name="address" value={form.address} onChange={onChange} rows="4" />
                </label>
              </div>

              <div className="salary-slip-section">
                <div className="salary-slip-section-head">
                  <div>
                    <h3>Generate Salary Slip</h3>
                    <p>
                      Add earnings and deductions like provident fund, conveyance, HRA, and
                      professional tax.
                    </p>
                  </div>
                </div>

                <div className="salary-slip-panel">
                  <div className="salary-slip-grid">
                    <label>
                      Month
                      <input name="month" value={salarySlipForm.month} onChange={onSalarySlipChange} required />
                    </label>
                    <label>
                      Year
                      <input name="year" type="number" value={salarySlipForm.year} onChange={onSalarySlipChange} required />
                    </label>
                    <label>
                      Pay Date
                      <input name="payDate" type="date" value={salarySlipForm.payDate} onChange={onSalarySlipChange} />
                    </label>
                    <label>
                      Basic Salary
                      <input name="basicSalary" type="number" value={salarySlipForm.basicSalary} onChange={onSalarySlipChange} />
                    </label>
                    <label>
                      HRA
                      <input name="hra" type="number" value={salarySlipForm.hra} onChange={onSalarySlipChange} />
                    </label>
                    <label>
                      Conveyance
                      <input name="conveyance" type="number" value={salarySlipForm.conveyance} onChange={onSalarySlipChange} />
                    </label>
                    <label>
                      Bonus
                      <input name="bonus" type="number" value={salarySlipForm.bonus} onChange={onSalarySlipChange} />
                    </label>
                    <label>
                      Special Allowance
                      <input name="specialAllowance" type="number" value={salarySlipForm.specialAllowance} onChange={onSalarySlipChange} />
                    </label>
                    <label>
                      Provident Fund
                      <input name="providentFund" type="number" value={salarySlipForm.providentFund} onChange={onSalarySlipChange} />
                    </label>
                    <label>
                      Professional Tax
                      <input name="professionalTax" type="number" value={salarySlipForm.professionalTax} onChange={onSalarySlipChange} />
                    </label>
                    <label>
                      Other Deductions
                      <input name="otherDeductions" type="number" value={salarySlipForm.otherDeductions} onChange={onSalarySlipChange} />
                    </label>
                    <label className="full-span">
                      Notes
                      <textarea name="notes" rows="3" value={salarySlipForm.notes} onChange={onSalarySlipChange} />
                    </label>
                    <button type="button" className="profile-save-button" disabled={saving} onClick={onGenerateSalarySlip}>
                      {saving ? "Generating..." : "Generate Salary Slip"}
                    </button>
                  </div>

                  <div className="salary-slip-list">
                    <h4>Generated Salary Slips</h4>
                    {selectedProfile.salarySlips?.length ? (
                      selectedProfile.salarySlips.map((slip, index) => (
                        <div key={`${slip.filename}-${index}`} className="salary-slip-item">
                          <div>
                            <strong>
                              {slip.month || "Month"} {slip.year || ""}
                            </strong>
                            <span>
                              Gross Pay: Rs. {Number(slip.grossPay || 0).toLocaleString("en-IN")}
                            </span>
                            <span>
                              Net Pay: Rs. {Number(slip.netPay || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="salary-download-button"
                            onClick={() =>
                              onDownloadSalarySlip(selectedProfile._id, slip._id, slip.filename)
                            }
                          >
                            Download
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="employee-empty">No salary slips generated yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="employee-empty-state">Select an employee to manage the profile.</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default EmployeeProfilesPage;
