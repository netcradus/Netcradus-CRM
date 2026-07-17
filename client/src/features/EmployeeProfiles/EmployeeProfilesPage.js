import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { User, Briefcase, Mail, Phone, MapPin, Plus, Save, Download, FileText, Search } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyForm = {
  name: "", email: "", department: "", designation: "", status: "Employee",
  joiningDate: "", leavingDate: "", salary: "", contactNumber: "", address: "",
  emergencyContactName: "", emergencyContactNumber: "", personalEmail: "",
  emergencyContact: {
    name: "",
    relationship: "Father",
    contactNumber: "",
    alternateContactNumber: "",
    address: "",
    notes: "",
  }
};

const emptySalarySlipForm = {
  month: "",
  year: new Date().getFullYear(),
  payDate: new Date().toISOString().slice(0, 10),
  department: "",
  basicSalary: "",
  hra: "",
  dearnessAllowance: "",
  specialAllowance: "",
  otherEarnings: "",
  // Sales specific
  travelAllowance: "",
  salesIncentive: "",
  commission: "",
  commissionRate: "",
  monthlyTarget: "",
  achievedSales: "",
  targetAchievementBonus: "",
  clientAcquisitionBonus: "",
  // IT specific
  conveyance: "",
  technicalAllowance: "",
  internetAllowance: "",
  wfhAllowance: "",
  nightShiftAllowance: "",
  onCallAllowance: "",
  overtimePay: "",
  projectCompletionBonus: "",
  // Shared
  performanceBonus: "",
  // Deductions
  professionalTax: "",
  otherDeductions: "",
  // Attendance
  workingDays: "",
  paidDays: "",
  lopDays: "",
  // Payment
  paymentMode: "",
  bankAccountLast4: "",
  notes: "",
};

const toDateInput = (v) => v ? new Date(v).toISOString().slice(0, 10) : "";
const formatRole = (r = "") => r === "admin" ? "Administrator" : String(r || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

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
  const [salarySlips, setSalarySlips] = useState([]);
  const [salarySlipsLoading, setSalarySlipsLoading] = useState(false);
  const [salarySlipsError, setSalarySlipsError] = useState("");

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

  const fetchSalarySlips = useCallback(async (userId) => {
    if (!userId) return;
    setSalarySlipsLoading(true);
    setSalarySlipsError("");
    try {
      const { data } = await axios.get(apiUrl(`/api/contacts/${userId}/salary-slips`), { headers });
      // Response shape: { success: true, data: { salarySlips: [...] } }
      const slips = data?.data?.salarySlips ?? [];
      setSalarySlips(slips);
    } catch (err) {
      setSalarySlipsError("Unable to load salary slip history.");
      setSalarySlips([]);
    } finally {
      setSalarySlipsLoading(false);
    }
  }, [headers]);

  // Clear stale slips immediately when the employee changes, then fetch fresh ones
  useEffect(() => {
    setSalarySlips([]);
    setSalarySlipsError("");
    if (selectedUserId) {
      fetchSalarySlips(selectedUserId);
    }
  }, [selectedUserId, fetchSalarySlips]);

  const selectedProfile = profiles.find(p => p.linkedUser?._id === selectedUserId) || null;

  useEffect(() => {
    if (selectedProfile) {
      setForm({
        ...selectedProfile,
        employeeId: selectedProfile.employeeId || "",
        joiningDate: toDateInput(selectedProfile.joiningDate),
        leavingDate: toDateInput(selectedProfile.leavingDate),
        salary: selectedProfile.salary ?? "",
        emergencyContact: {
          name: selectedProfile.emergencyContact?.name || "",
          relationship: selectedProfile.emergencyContact?.relationship || "Father",
          contactNumber: selectedProfile.emergencyContact?.contactNumber || "",
          alternateContactNumber: selectedProfile.emergencyContact?.alternateContactNumber || "",
          address: selectedProfile.emergencyContact?.address || "",
          notes: selectedProfile.emergencyContact?.notes || "",
        }
      });
      setSalarySlipForm({ ...emptySalarySlipForm, basicSalary: selectedProfile.salary ?? "", department: selectedProfile.department || "" });
    }
  }, [selectedProfile]);

  const validateEmergencyContact = (ec) => {
    if (!ec) return "Emergency Contact Details are required.";

    const name = String(ec.name || "").trim();
    if (!name) return "Emergency contact name is required.";
    if (name.length < 2 || name.length > 100) {
      return "Emergency contact name must be between 2 and 100 characters.";
    }

    const relationship = String(ec.relationship || "").trim();
    const validRelations = ["Father", "Mother", "Brother", "Sister", "Spouse", "Friend", "Guardian", "Other"];
    if (!relationship) return "Relationship is required.";
    if (!validRelations.includes(relationship)) return "Invalid relationship.";

    const contactNumber = String(ec.contactNumber || "").trim();
    if (!contactNumber) return "Contact number is required.";
    if (!/^[0-9]{10}$/.test(contactNumber)) {
      return "Contact number must be exactly 10 digits.";
    }

    const alternateContactNumber = String(ec.alternateContactNumber || "").trim();
    if (!alternateContactNumber) return "Alternate contact number is required.";
    if (!/^[0-9]{10}$/.test(alternateContactNumber)) {
      return "Contact number must be exactly 10 digits.";
    }

    const address = String(ec.address || "").trim();
    if (!address) return "Emergency address is required.";
    if (address.length < 10 || address.length > 300) {
      return "Emergency address must be between 10 and 300 characters.";
    }

    const notes = String(ec.notes || "").trim();
    if (!notes) return "Notes are required.";
    if (notes.length < 5 || notes.length > 500) {
      return "Notes must be between 5 and 500 characters.";
    }

    return null;
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const ecError = validateEmergencyContact(form.emergencyContact);
    if (ecError) {
      setError(ecError);
      return;
    }

    setSaving(true);
    try {
      await axios.put(apiUrl(`/api/contacts/profiles/${selectedUserId}`), form, { headers });
      setMessage("Profile updated successfully");
      fetchProfiles();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to update profile");
    }
    finally { setSaving(false); }
  };

  const generateSalarySlip = async () => {
    if (!selectedUserId) return;
    setError("");
    setMessage("");

    const basicVal = Number(salarySlipForm.basicSalary);
    if (!salarySlipForm.month || !salarySlipForm.month.trim()) {
      setError("Month is required");
      return;
    }
    if (!salarySlipForm.year) {
      setError("Year is required");
      return;
    }
    if (!salarySlipForm.payDate) {
      setError("Pay Date is required");
      return;
    }
    if (isNaN(basicVal) || basicVal <= 0) {
      setError("Basic Salary is required and must be greater than 0");
      return;
    }

    // Working Days Validation
    const workingRaw = salarySlipForm.workingDays;
    const workingVal = Number(workingRaw);
    if (workingRaw === undefined || workingRaw === null || workingRaw === "" || isNaN(workingVal) || !Number.isInteger(workingVal) || workingVal < 1 || workingVal > 31) {
      setError("Working Days must be between 1 and 31.");
      return;
    }

    // Paid Days Validation
    const paidRaw = salarySlipForm.paidDays;
    const paidVal = Number(paidRaw);
    if (paidRaw === undefined || paidRaw === null || paidRaw === "" || isNaN(paidVal) || !Number.isInteger(paidVal) || paidVal <= 0) {
      setError("Paid Days must be greater than 0.");
      return;
    }
    if (paidVal > workingVal) {
      setError("Paid Days cannot exceed Working Days.");
      return;
    }

    // LWP/LOP Days Validation
    const lopDaysRaw = salarySlipForm.lopDays !== undefined && salarySlipForm.lopDays !== null && salarySlipForm.lopDays !== "" ? salarySlipForm.lopDays : 0;
    const lopDaysVal = Number(lopDaysRaw);
    if (isNaN(lopDaysVal) || !Number.isInteger(lopDaysVal) || lopDaysVal < 0) {
      setError("LWP/LOP Days cannot be negative.");
      return;
    }
    if (lopDaysVal > workingVal) {
      setError("LWP/LOP Days cannot exceed Working Days.");
      return;
    }

    // Combined validation
    if (paidVal + lopDaysVal > workingVal) {
      setError("Paid Days and LWP/LOP Days cannot exceed total Working Days.");
      return;
    }

    // Monetary values check (no negative values)
    const monetaryFields = [
      "basicSalary", "hra", "dearnessAllowance", "specialAllowance", "otherEarnings",
      "travelAllowance", "salesIncentive", "commission", "commissionRate",
      "monthlyTarget", "achievedSales", "targetAchievementBonus", "clientAcquisitionBonus",
      "conveyance", "technicalAllowance", "internetAllowance", "wfhAllowance",
      "nightShiftAllowance", "onCallAllowance", "overtimePay", "projectCompletionBonus",
      "performanceBonus", "professionalTax", "otherDeductions"
    ];
    for (const field of monetaryFields) {
      if (salarySlipForm[field] !== undefined && salarySlipForm[field] !== null && salarySlipForm[field] !== "") {
        const val = Number(salarySlipForm[field]);
        if (isNaN(val) || val < 0) {
          setError(`${field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())} cannot be negative`);
          return;
        }
      }
    }

    // Commission rate must be between 0 and 100
    const commRateVal = Number(salarySlipForm.commissionRate) || 0;
    if (commRateVal < 0 || commRateVal > 100) {
      setError("Commission rate must be between 0 and 100");
      return;
    }

    // Bank account last digits must contain exactly 4 digits when provided
    if (salarySlipForm.bankAccountLast4 && salarySlipForm.bankAccountLast4.trim()) {
      if (!/^[0-9]{4}$/.test(salarySlipForm.bankAccountLast4.trim())) {
        setError("Bank account last digits must contain exactly 4 digits");
        return;
      }
    }

    // Calculate net pay preview to validate it is non-negative
    const dept = selectedDepartment;
    const basic = basicVal;
    const hra = Number(salarySlipForm.hra) || 0;
    const dearness = Number(salarySlipForm.dearnessAllowance) || 0;
    const spec = Number(salarySlipForm.specialAllowance) || 0;
    const otherEarn = Number(salarySlipForm.otherEarnings) || 0;

    let gross = basic + hra + dearness + spec + otherEarn;

    if (dept === "sales") {
      const achSales = Number(salarySlipForm.achievedSales) || 0;
      const calculatedComm = achSales > 0 && commRateVal > 0
        ? parseFloat((achSales * commRateVal / 100).toFixed(2))
        : 0;
      const commission = salarySlipForm.commission !== ""
        ? (Number(salarySlipForm.commission) || 0)
        : calculatedComm;

      gross += (Number(salarySlipForm.travelAllowance) || 0) +
               (Number(salarySlipForm.salesIncentive) || 0) +
               commission +
               (Number(salarySlipForm.targetAchievementBonus) || 0) +
               (Number(salarySlipForm.clientAcquisitionBonus) || 0) +
               (Number(salarySlipForm.performanceBonus) || 0);
    } else if (dept === "it") {
      gross += (Number(salarySlipForm.conveyance) || 0) +
               (Number(salarySlipForm.technicalAllowance) || 0) +
               (Number(salarySlipForm.internetAllowance) || 0) +
               (Number(salarySlipForm.wfhAllowance) || 0) +
               (Number(salarySlipForm.nightShiftAllowance) || 0) +
               (Number(salarySlipForm.onCallAllowance) || 0) +
               (Number(salarySlipForm.overtimePay) || 0) +
               (Number(salarySlipForm.projectCompletionBonus) || 0) +
               (Number(salarySlipForm.performanceBonus) || 0);
    } else {
      gross += (Number(salarySlipForm.conveyance) || 0);
    }

    const profTax = Number(salarySlipForm.professionalTax) || 0;
    const otherDed = Number(salarySlipForm.otherDeductions) || 0;
    const lopDeduction = (workingVal > 0 && lopDaysVal > 0)
      ? parseFloat(((basic / workingVal) * lopDaysVal).toFixed(2))
      : 0;
    const totalDed = parseFloat((profTax + otherDed + lopDeduction).toFixed(2));
    const net = parseFloat((gross - totalDed).toFixed(2));

    if (net < 0) {
      setError("Net Pay cannot be negative");
      return;
    }

    try {
      await axios.post(
        apiUrl(`/api/contacts/profiles/${selectedUserId}/salary-slips`),
        { ...salarySlipForm, department: form.department || "" },
        { headers }
      );
      setMessage("Salary slip generated successfully");
      fetchProfiles();
      fetchSalarySlips(selectedUserId);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate salary slip");
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

  const selectedDepartment = String(
    selectedProfile?.department ||
    form?.department ||
    selectedProfile?.linkedUser?.department ||
    ""
  )
    .trim()
    .toLowerCase();

  const filteredProfiles = profiles.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.email || "").toLowerCase().includes(search.toLowerCase()));

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
                    <input className="form-input" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Work Email</label>
                    <input className="form-input" value={form.email || ""} readOnly style={{ opacity: 0.7 }} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Employee ID</label>
                    <input className="form-input" value={form.employeeId || selectedProfile?.employeeId || "N/A"} readOnly style={{ opacity: 0.7 }} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={form.department || ""} onChange={e => setForm({ ...form, department: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Designation</label>
                    <input className="form-input" value={form.designation || ""} onChange={e => setForm({ ...form, designation: e.target.value })} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status || "Employee"} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="Employee">Employee</option><option value="Ex-Employee">Ex-Employee</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="form-label">Salary (₹)</label>
                    <input className="form-input" type="number" value={form.salary || ""} onChange={e => setForm({ ...form, salary: e.target.value })} />
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                  <h4 style={{ marginBottom: 'var(--space-3)' }}>Contact Details</h4>
                  <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={form.contactNumber || ""} onChange={e => setForm({ ...form, contactNumber: e.target.value })} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Personal Email</label>
                      <input className="form-input" value={form.personalEmail || ""} onChange={e => setForm({ ...form, personalEmail: e.target.value })} />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Address</label>
                      <textarea className="form-input" rows={2} value={form.address || ""} onChange={e => setForm({ ...form, address: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                  <h4 style={{ marginBottom: 'var(--space-3)' }}>Emergency Contact Details</h4>
                  <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                    <div className="form-field">
                      <label className="form-label">Emergency Contact Name</label>
                      <input
                        className="form-input"
                        placeholder="Enter emergency contact name"
                        value={form.emergencyContact?.name || ""}
                        onChange={e => setForm({
                          ...form,
                          emergencyContact: { ...(form.emergencyContact || {}), name: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Relationship</label>
                      <select
                        className="form-select"
                        value={form.emergencyContact?.relationship || "Father"}
                        onChange={e => setForm({
                          ...form,
                          emergencyContact: { ...(form.emergencyContact || {}), relationship: e.target.value }
                        })}
                      >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Friend">Friend</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Contact Number</label>
                      <input
                        className="form-input"
                        type="tel"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="Enter emergency contact number"
                        value={form.emergencyContact?.contactNumber || ""}
                        onChange={e => setForm({
                          ...form,
                          emergencyContact: { ...(form.emergencyContact || {}), contactNumber: e.target.value.replace(/\D/g, '') }
                        })}
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Alternate Contact Number</label>
                      <input
                        className="form-input"
                        type="tel"
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="Enter alternate contact number"
                        value={form.emergencyContact?.alternateContactNumber || ""}
                        onChange={e => setForm({
                          ...form,
                          emergencyContact: { ...(form.emergencyContact || {}), alternateContactNumber: e.target.value.replace(/\D/g, '') }
                        })}
                      />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Address</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="Enter emergency contact address"
                        value={form.emergencyContact?.address || ""}
                        onChange={e => setForm({
                          ...form,
                          emergencyContact: { ...(form.emergencyContact || {}), address: e.target.value }
                        })}
                      />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="Additional information (medical conditions, availability, etc.)"
                        value={form.emergencyContact?.notes || ""}
                        onChange={e => setForm({
                          ...form,
                          emergencyContact: { ...(form.emergencyContact || {}), notes: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </form>

              <div className="nc-card">
                <h3 style={{ marginBottom: 'var(--space-4)' }}>Payroll & Salary Slips</h3>
                <div className="employee-profile-payroll-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                  <div className="form">
                    <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>Generate New Slip</h4>

                    {/* Period, Attendance & Payment */}
                    <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <div className="form-field">
                        <label className="form-label">Month</label>
                        <input className="form-input" placeholder="e.g. May" value={salarySlipForm.month || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, month: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Year</label>
                        <input className="form-input" type="number" value={salarySlipForm.year || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, year: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Pay Date</label>
                        <input className="form-input" type="date" value={salarySlipForm.payDate || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, payDate: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Payment Mode</label>
                        <select className="form-select" value={salarySlipForm.paymentMode || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, paymentMode: e.target.value })}>
                          <option value="">Select Mode</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                      <div className="form-field">
                        <label className="form-label">Working Days</label>
                        <input className="form-input" type="number" min="1" max="31" step="1" placeholder="e.g. 30" value={salarySlipForm.workingDays || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, workingDays: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Paid Days</label>
                        <input className="form-input" type="number" min="0" max="31" step="1" placeholder="e.g. 28" value={salarySlipForm.paidDays || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, paidDays: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">LWP / LOP Days (Leave Without Pay)</label>
                        <input className="form-input" type="number" min="0" max="31" step="1" placeholder="e.g. 2" value={salarySlipForm.lopDays || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, lopDays: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Bank Account Last 4 Digits</label>
                        <input className="form-input" maxLength={4} placeholder="e.g. 1234" value={salarySlipForm.bankAccountLast4 || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, bankAccountLast4: e.target.value.replace(/\D/g, '') })} />
                      </div>
                    </div>

                    {/* Earnings */}
                    <p style={{ fontSize: '10px', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>
                      Earnings ({form.department || "Other"} Department)
                    </p>
                    <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      {/* Common Earnings */}
                      <div className="form-field">
                        <label className="form-label">Basic Salary (₹)</label>
                        <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.basicSalary || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, basicSalary: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">HRA (₹)</label>
                        <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.hra || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, hra: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Dearness Allowance (DA) (₹)</label>
                        <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.dearnessAllowance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, dearnessAllowance: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Special Allowance (₹)</label>
                        <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.specialAllowance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, specialAllowance: e.target.value })} />
                      </div>
                      <div className="form-field">
                        <label className="form-label">Other Earnings (₹)</label>
                        <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.otherEarnings || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, otherEarnings: e.target.value })} />
                      </div>

                      {/* Sales Department Earnings */}
                      {selectedDepartment === "sales" && (
                        <>
                          <div className="form-field">
                            <label className="form-label">Travel Allowance (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.travelAllowance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, travelAllowance: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Sales Incentive (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.salesIncentive || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, salesIncentive: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Achieved Sales (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.achievedSales || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, achievedSales: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Commission Rate (%)</label>
                            <input className="form-input" type="number" min="0" max="100" step="any" placeholder="0" value={salarySlipForm.commissionRate || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, commissionRate: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Commission (₹) [Calculated / Override]</label>
                            <input
                              className="form-input"
                              type="number"
                              min="0"
                              step="any"
                              placeholder={
                                (Number(salarySlipForm.achievedSales) || 0) > 0 && (Number(salarySlipForm.commissionRate) || 0) > 0
                                  ? ((Number(salarySlipForm.achievedSales) * Number(salarySlipForm.commissionRate)) / 100).toFixed(2)
                                  : "0"
                              }
                              value={salarySlipForm.commission || ""}
                              onChange={e => setSalarySlipForm({ ...salarySlipForm, commission: e.target.value })}
                            />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Target Achievement Bonus (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.targetAchievementBonus || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, targetAchievementBonus: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Client Acquisition Bonus (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.clientAcquisitionBonus || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, clientAcquisitionBonus: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Performance Bonus (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.performanceBonus || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, performanceBonus: e.target.value })} />
                          </div>
                        </>
                      )}

                      {/* IT Department Earnings */}
                      {selectedDepartment === "it" && (
                        <>
                          <div className="form-field">
                            <label className="form-label">Conveyance (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.conveyance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, conveyance: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Technical Allowance (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.technicalAllowance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, technicalAllowance: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Internet Allowance (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.internetAllowance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, internetAllowance: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Work From Home Allowance (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.wfhAllowance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, wfhAllowance: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Night Shift Allowance (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.nightShiftAllowance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, nightShiftAllowance: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">On-call Allowance (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.onCallAllowance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, onCallAllowance: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Overtime Pay (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.overtimePay || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, overtimePay: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Project Completion Bonus (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.projectCompletionBonus || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, projectCompletionBonus: e.target.value })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">Performance Bonus (₹)</label>
                            <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.performanceBonus || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, performanceBonus: e.target.value })} />
                          </div>
                        </>
                      )}

                      {/* Other / Default Department Earnings */}
                      {selectedDepartment !== "sales" && selectedDepartment !== "it" && (
                        <div className="form-field">
                          <label className="form-label">Conveyance (₹)</label>
                          <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.conveyance || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, conveyance: e.target.value })} />
                        </div>
                      )}
                    </div>

                    {/* Deductions */}
                    <p style={{ fontSize: '10px', fontWeight: 'var(--font-semibold)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-2)' }}>Deductions</p>
                    <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                      <div className="form-field">
                        <label className="form-label">Professional Tax (₹)</label>
                        <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.professionalTax || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, professionalTax: e.target.value })} />
                      </div>
                      <div className="form-field" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">Other Deductions (₹)</label>
                        <input className="form-input" type="number" min="0" step="any" placeholder="0" value={salarySlipForm.otherDeductions || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, otherDeductions: e.target.value })} />
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="form-field" style={{ marginBottom: 'var(--space-3)' }}>
                      <label className="form-label">Notes</label>
                      <textarea className="form-input" rows={2} placeholder="Additional notes (optional)" value={salarySlipForm.notes || ""} onChange={e => setSalarySlipForm({ ...salarySlipForm, notes: e.target.value })} />
                    </div>

                    {/* Live Gross / Net preview */}
                    {(() => {
                      const dept = selectedDepartment;
                      const basic = Number(salarySlipForm.basicSalary) || 0;
                      const hra = Number(salarySlipForm.hra) || 0;
                      const dearness = Number(salarySlipForm.dearnessAllowance) || 0;
                      const spec = Number(salarySlipForm.specialAllowance) || 0;
                      const otherEarn = Number(salarySlipForm.otherEarnings) || 0;

                      let gross = basic + hra + dearness + spec + otherEarn;

                      if (dept === "sales") {
                        const achSales = Number(salarySlipForm.achievedSales) || 0;
                        const commRate = Number(salarySlipForm.commissionRate) || 0;
                        const calculatedComm = achSales > 0 && commRate > 0
                          ? parseFloat((achSales * commRate / 100).toFixed(2))
                          : 0;
                        const commission = salarySlipForm.commission !== ""
                          ? (Number(salarySlipForm.commission) || 0)
                          : calculatedComm;

                        gross += (Number(salarySlipForm.travelAllowance) || 0) +
                                 (Number(salarySlipForm.salesIncentive) || 0) +
                                 commission +
                                 (Number(salarySlipForm.targetAchievementBonus) || 0) +
                                 (Number(salarySlipForm.clientAcquisitionBonus) || 0) +
                                 (Number(salarySlipForm.performanceBonus) || 0);
                      } else if (dept === "it") {
                        gross += (Number(salarySlipForm.conveyance) || 0) +
                                 (Number(salarySlipForm.technicalAllowance) || 0) +
                                 (Number(salarySlipForm.internetAllowance) || 0) +
                                 (Number(salarySlipForm.wfhAllowance) || 0) +
                                 (Number(salarySlipForm.nightShiftAllowance) || 0) +
                                 (Number(salarySlipForm.onCallAllowance) || 0) +
                                 (Number(salarySlipForm.overtimePay) || 0) +
                                 (Number(salarySlipForm.projectCompletionBonus) || 0) +
                                 (Number(salarySlipForm.performanceBonus) || 0);
                      } else {
                        gross += (Number(salarySlipForm.conveyance) || 0);
                      }

                      const profTax = Number(salarySlipForm.professionalTax) || 0;
                      const otherDed = Number(salarySlipForm.otherDeductions) || 0;
                      
                      const workingDays = Number(salarySlipForm.workingDays) || 0;
                      const lopDays = Number(salarySlipForm.lopDays) || 0;
                      const lopDeduction = (workingDays > 0 && lopDays > 0)
                        ? parseFloat(((basic / workingDays) * lopDays).toFixed(2))
                        : 0;

                      const totalDed = parseFloat((profTax + otherDed + lopDeduction).toFixed(2));
                      const net = parseFloat((gross - totalDed).toFixed(2));
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', marginBottom: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Gross Pay</div>
                            <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>₹{gross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Net Pay</div>
                            <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)', color: net >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>₹{net.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        </div>
                      );
                    })()}

                    <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={generateSalarySlip}>Generate Slip</button>
                  </div>


                  <div>
                    <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>History</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {salarySlipsLoading ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>Loading salary slips...</p>
                      ) : salarySlipsError ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>{salarySlipsError}</p>
                      ) : salarySlips.length > 0 ? salarySlips.map((s, i) => (
                        <div key={s._id || i} className="nc-card" style={{ padding: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-surface)' }}>
                          <div>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)' }}>{s.month} {s.year}</div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Net: ₹{s.netPay?.toLocaleString('en-IN')}</div>
                          </div>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-2)' }} onClick={() => downloadSalarySlip(s._id, s.filename)}><Download size={14} /></button>
                        </div>
                      )) : (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>No slips generated yet.</p>
                      )}
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
