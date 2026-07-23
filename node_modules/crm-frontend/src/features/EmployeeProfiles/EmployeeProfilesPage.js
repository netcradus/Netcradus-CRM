import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { User, Briefcase, Mail, Phone, MapPin, Plus, Save, Download, FileText, Search } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyForm = {
  name: "", email: "", department: "", designation: "", status: "Employee",
  joiningDate: "", leavingDate: "", salary: "", contactNumber: "", address: "",
  emergencyContactName: "", emergencyContactNumber: "", personalEmail: "",
  employeeStatus: "Active",
  employmentType: "Full Time",
  probationEndDate: "",
  noticePeriodDays: 0,
  offeredSalary: "",
  reportsTo: "",
  aadhaarNumber: "",
  panNumber: "",
  uanNumber: "",
  esicNumber: "",
  dob: "",
  bloodGroup: "",
  profilePhoto: "",
  bankDetails: {
    paymentMode: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    upiId: "",
    accountType: "",
  },
  confirmAccountNumber: "",
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

const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

function EmployeeProfilesPage() {
  const token = localStorage.getItem("token");
  const [profiles, setProfiles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [activeTab, setActiveTab] = useState("Personal");
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

  const activeManagerOptions = useMemo(() => {
    return profiles.filter(p => {
      if (!p.linkedUser?._id) return false;
      if (p.linkedUser._id === selectedUserId) return false;
      return p.employeeStatus === "Active" || p.isActive !== false;
    });
  }, [profiles, selectedUserId]);

  useEffect(() => {
    if (selectedProfile) {
      setForm({
        ...selectedProfile,
        employeeId: selectedProfile.employeeId || "",
        joiningDate: toDateInput(selectedProfile.joiningDate),
        leavingDate: toDateInput(selectedProfile.leavingDate),
        salary: selectedProfile.salary ?? "",
        employeeStatus: selectedProfile.employeeStatus || "Active",
        employmentType: selectedProfile.employmentType || "Full Time",
        probationEndDate: toDateInput(selectedProfile.probationEndDate),
        noticePeriodDays: selectedProfile.noticePeriodDays ?? 0,
        offeredSalary: selectedProfile.offeredSalary ?? "",
        reportsTo: selectedProfile.reportsTo || "",
        aadhaarNumber: selectedProfile.aadhaarNumber || "",
        panNumber: selectedProfile.panNumber || "",
        uanNumber: selectedProfile.uanNumber || "",
        esicNumber: selectedProfile.esicNumber || "",
        dob: toDateInput(selectedProfile.dob),
        bloodGroup: selectedProfile.bloodGroup || "",
        profilePhoto: selectedProfile.profilePhoto || "",
        bankDetails: {
          paymentMode: selectedProfile.bankDetails?.paymentMode || "",
          bankName: selectedProfile.bankDetails?.bankName || "",
          accountHolderName: selectedProfile.bankDetails?.accountHolderName || "",
          accountNumber: selectedProfile.bankDetails?.accountNumber || "",
          ifscCode: selectedProfile.bankDetails?.ifscCode || "",
          branchName: selectedProfile.bankDetails?.branchName || "",
          upiId: selectedProfile.bankDetails?.upiId || "",
          accountType: selectedProfile.bankDetails?.accountType || "",
        },
        confirmAccountNumber: selectedProfile.bankDetails?.accountNumber || "",
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

  const userRole = (localStorage.getItem("userRole") || "").trim().toLowerCase();
  const canVerifyDocuments = ["super_user", "hr"].includes(userRole);

  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState("");
  const [userStorage, setUserStorage] = useState(null);

  const [uploadType, setUploadType] = useState("Resume");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const directReports = useMemo(() => {
    if (!selectedUserId) return [];
    return profiles.filter(p => p.reportsTo && String(p.reportsTo) === String(selectedUserId));
  }, [profiles, selectedUserId]);

  const currentManager = useMemo(() => {
    if (!form.reportsTo) return null;
    return profiles.find(p => p.linkedUser?._id === form.reportsTo) || null;
  }, [profiles, form.reportsTo]);

  const fetchEmployeeDocuments = useCallback(async (userId) => {
    if (!userId) return;
    setDocsLoading(true);
    setDocsError("");
    try {
      const storageRes = await axios.get(apiUrl(`/api/documents/storage?userId=${userId}`), { headers });
      if (storageRes.data?.success) {
        setUserStorage(storageRes.data.data);
      }
      const docsRes = await axios.get(apiUrl(`/api/documents/files?userId=${userId}&limit=100`), { headers });
      if (docsRes.data?.success) {
        setDocuments(docsRes.data.data);
      }
    } catch (err) {
      setDocsError(err.response?.data?.message || "Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (selectedUserId) {
      fetchEmployeeDocuments(selectedUserId);
    } else {
      setDocuments([]);
      setUserStorage(null);
    }
  }, [selectedUserId, fetchEmployeeDocuments]);

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    const folder = userStorage?.subFolders?.find(f => f.name === 'contracts') || 
                   userStorage?.subFolders?.find(f => f.name === 'general') ||
                   userStorage?.subFolders?.[0];

    if (!folder) {
      setUploadError("Unable to resolve upload folder. Ensure storage is provisioned for this user.");
      return;
    }

    setUploadingDoc(true);
    setUploadError("");
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("folderId", folder.driveFolderId);
    formData.append("userId", selectedUserId);
    formData.append("documentType", uploadType);
    formData.append("notes", uploadNotes);

    try {
      await axios.post(apiUrl("/api/documents/upload"), formData, {
        headers: {
          ...headers,
          "Content-Type": "multipart/form-data"
        }
      });
      setUploadNotes("");
      setUploadFile(null);
      const fileInput = document.getElementById("doc-file-input");
      if (fileInput) fileInput.value = "";
      fetchEmployeeDocuments(selectedUserId);
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size exceeds 2 MB limit.");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG or WEBP files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    setError("");
    setMessage("");
    setSaving(true);

    try {
      await axios.post(
        apiUrl(`/api/contacts/profiles/${selectedUserId}/photo`),
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage("Profile photo updated successfully");
      fetchProfiles();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload photo");
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm("Are you sure you want to remove this profile photo?")) return;

    setError("");
    setMessage("");
    setSaving(true);

    try {
      await axios.delete(apiUrl(`/api/contacts/profiles/${selectedUserId}/photo`), { headers });
      setMessage("Profile photo removed successfully");
      fetchProfiles();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove photo");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyDocument = async (documentId, status) => {
    try {
      await axios.patch(apiUrl(`/api/documents/${documentId}/verify`), { status }, { headers });
      fetchEmployeeDocuments(selectedUserId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(apiUrl(`/api/documents/${documentId}`), { headers });
      fetchEmployeeDocuments(selectedUserId);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete document");
    }
  };

  const handleDownloadDocument = (documentId) => {
    window.open(apiUrl(`/api/documents/download/${documentId}?token=${localStorage.getItem("token") || ""}`), "_blank");
  };

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

  const validateForm = (form) => {
    // 1. Joining Date
    if (form.joiningDate) {
      const now = new Date();
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      if (new Date(form.joiningDate) > todayEnd) {
        return "Joining Date cannot be in the future.";
      }
    }

    // 2. Relieving Date
    if (form.leavingDate) {
      if (!form.joiningDate) {
        return "Joining Date is required before setting a Relieving Date.";
      }
      if (new Date(form.leavingDate) < new Date(form.joiningDate)) {
        return "Relieving Date cannot be before Joining Date.";
      }
    }

    // 3. Probation End Date
    if (form.probationEndDate) {
      if (!form.joiningDate) {
        return "Joining Date is required before setting a Probation End Date.";
      }
      if (new Date(form.probationEndDate) < new Date(form.joiningDate)) {
        return "Probation End Date cannot be before Joining Date.";
      }
    }

    // 4. Employee Status checks
    if (form.employeeStatus === "Ex Employee" || form.employeeStatus === "Terminated") {
      if (!form.leavingDate) {
        return "Relieving Date is required when status is Ex Employee or Terminated.";
      }
    } else if (form.employeeStatus === "Notice Period") {
      if (form.noticePeriodDays === undefined || form.noticePeriodDays === "" || isNaN(Number(form.noticePeriodDays)) || Number(form.noticePeriodDays) < 0) {
        return "Notice Period Days is required when status is Notice Period.";
      }
    }

    // 5. Notice Period Days
    if (form.noticePeriodDays !== undefined && form.noticePeriodDays !== "") {
      const npDays = Number(form.noticePeriodDays);
      if (isNaN(npDays) || !Number.isInteger(npDays) || npDays < 0 || npDays > 365) {
        return "Notice Period Days must be an integer between 0 and 365.";
      }
    }

    // 6. Offered Salary
    if (form.offeredSalary !== undefined && form.offeredSalary !== "" && form.offeredSalary !== "********") {
      const sal = Number(form.offeredSalary);
      if (isNaN(sal) || sal < 0) {
        return "Offered Salary cannot be negative.";
      }
    }

    // 7. Current Salary
    if (form.salary !== undefined && form.salary !== "" && form.salary !== "********") {
      const sal = Number(form.salary);
      if (isNaN(sal) || sal < 0) {
        return "Current Salary cannot be negative.";
      }
    }

    // 8. Aadhaar Validation
    if (form.aadhaarNumber && !form.aadhaarNumber.includes("X") && !form.aadhaarNumber.includes("*")) {
      const cleanAadhaar = String(form.aadhaarNumber).replace(/\s/g, "");
      if (!/^[0-9]{12}$/.test(cleanAadhaar)) {
        return "Aadhaar Number must contain exactly 12 digits.";
      }
    }

    // 9. PAN Validation
    if (form.panNumber && !form.panNumber.includes("X") && !form.panNumber.includes("*")) {
      const cleanPan = String(form.panNumber).trim().toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(cleanPan)) {
        return "Enter a valid PAN number, for example ABCDE1234F.";
      }
    }

    // 10. UAN Validation
    if (form.uanNumber && !form.uanNumber.includes("X") && !form.uanNumber.includes("*")) {
      const cleanUan = String(form.uanNumber).trim();
      if (!/^[0-9]{12}$/.test(cleanUan)) {
        return "UAN Number must contain exactly 12 digits.";
      }
    }

    // 11. ESIC Validation
    if (form.esicNumber && !form.esicNumber.includes("X") && !form.esicNumber.includes("*")) {
      const cleanEsic = String(form.esicNumber).trim();
      if (!/^[0-9]{10,17}$/.test(cleanEsic)) {
        return "ESIC Number must contain between 10 and 17 digits.";
      }
    }

    // 12. Reporting Manager (reportsTo)
    if (form.reportsTo && selectedUserId) {
      if (String(form.reportsTo) === String(selectedUserId)) {
        return "Employee cannot report to themselves.";
      }
    }

    // 13. Bank Details Validation
    if (form.bankDetails) {
      const acc = String(form.bankDetails.accountNumber || "").trim();
      const conf = String(form.confirmAccountNumber || "").trim();
      if (acc && !acc.includes("X") && !acc.includes("*")) {
        if (!/^[0-9]{9,18}$/.test(acc)) {
          return "Bank Account Number must contain between 9 and 18 digits.";
        }
        if (acc !== conf) {
          return "Confirm Account Number must match Account Number.";
        }
      }
      const ifsc = String(form.bankDetails.ifscCode || "").trim().toUpperCase();
      if (ifsc) {
        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
          return "Enter a valid IFSC code (e.g. SBIN0001234).";
        }
      }
    }

    return null;
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const valError = validateForm(form);
    if (valError) {
      setError(valError);
      return;
    }

    const ecError = validateEmergencyContact(form.emergencyContact);
    if (ecError) {
      setError(ecError);
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      const maskedFields = ["salary", "offeredSalary", "contactNumber", "address", "aadhaarNumber", "panNumber", "uanNumber", "esicNumber"];
      maskedFields.forEach(field => {
        if (payload[field] !== undefined) {
          const valStr = String(payload[field]);
          if (valStr.includes("*") || valStr.includes("X") || valStr.includes("x")) {
            delete payload[field];
          }
        }
      });

      // Strip frontend-only field
      delete payload.confirmAccountNumber;

      if (payload.bankDetails) {
        const accNum = String(payload.bankDetails.accountNumber || "");
        if (accNum.includes("X") || accNum.includes("*") || accNum.includes("x")) {
          delete payload.bankDetails.accountNumber;
        }
      }

      await axios.put(apiUrl(`/api/contacts/profiles/${selectedUserId}`), payload, { headers });
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


              {/* Sticky Header with Tabs and Save Button */}
              <div style={{
                position: 'sticky',
                top: '20px',
                zIndex: 100,
                background: 'var(--color-bg)',
                padding: 'var(--space-3) 0',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-4)',
                flexWrap: 'nowrap',
                marginBottom: 'var(--space-4)'
              }}>
                {/* Tabs Selector */}
                <div style={{
                  display: 'flex',
                  gap: 'var(--space-2)',
                  overflowX: 'auto',
                  whiteSpace: 'nowrap',
                  paddingBottom: '4px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}>
                  {["Personal", "Employment", "Banking", "Documents", "Payroll"].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      className="btn"
                      style={{
                        background: activeTab === tab ? 'var(--color-accent)' : 'var(--color-bg-alt)',
                        color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                        border: '1px solid',
                        borderColor: activeTab === tab ? 'var(--color-accent)' : 'var(--color-border)',
                        padding: 'var(--space-2) var(--space-4)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-semibold)',
                        borderRadius: 'var(--border-radius)',
                        cursor: 'pointer'
                      }}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Save Changes Button (Sticky and visible at all times) */}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={onUpdate}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    flexShrink: 0
                  }}
                >
                  <Save size={16} style={{ marginRight: '8px' }} /> {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {/* Success / Error Messages */}
              {error && (
                <div className="badge badge-error" style={{ marginBottom: "var(--space-4)", padding: "var(--space-2) var(--space-4)", width: "100%", display: "block", textAlign: "left" }}>
                  {error}
                </div>
              )}
              {message && (
                <div className="badge badge-success" style={{ marginBottom: "var(--space-4)", padding: "var(--space-2) var(--space-4)", width: "100%", display: "block", textAlign: "left" }}>
                  {message}
                </div>
              )}

              {/* Conditional Tab Rendering */}
              {activeTab !== "Documents" && (
                <form className="nc-card form" onSubmit={onUpdate}>
                  {activeTab === "Personal" && (
                    <>
                      <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-4)' }}>Personal Details</h3>

                      {/* Profile Photo Section */}
                      <div className="profile-photo-section" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
                        {form.profilePhoto ? (
                          <div style={{ position: 'relative', width: '96px', height: '96px' }}>
                            <img
                              src={`${apiUrl(form.profilePhoto)}?token=${localStorage.getItem("token") || ""}`}
                              alt={form.name}
                              style={{
                                width: '96px',
                                height: '96px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '2px solid var(--color-border)'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div
                              style={{
                                display: 'none',
                                width: '96px',
                                height: '96px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-bg-alt, #2a2a2a)',
                                color: 'var(--color-text-primary, #ffffff)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '32px',
                                fontWeight: 'var(--font-bold, 700)',
                                border: '2px solid var(--color-border)'
                              }}
                            >
                              {getInitials(form.name)}
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              width: '96px',
                              height: '96px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--color-bg-alt, #2a2a2a)',
                              color: 'var(--color-text-primary, #ffffff)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '32px',
                              fontWeight: 'var(--font-bold, 700)',
                              border: '2px solid var(--color-border)'
                            }}
                          >
                            {getInitials(form.name)}
                          </div>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
                              onClick={() => document.getElementById('avatar-upload-input').click()}
                            >
                              {form.profilePhoto ? "Change Photo" : "Upload Photo"}
                            </button>
                            {form.profilePhoto && (
                              <button
                                type="button"
                                className="btn btn-ghost btn-danger"
                                style={{ padding: '6px 12px', fontSize: 'var(--text-xs)', border: '1px solid var(--color-danger, #ef4444)', color: 'var(--color-danger, #ef4444)', borderRadius: 'var(--border-radius-sm)' }}
                                onClick={handleRemovePhoto}
                              >
                                Remove Photo
                              </button>
                            )}
                          </div>
                          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted, #888888)' }}>
                            JPG, PNG or WEBP. Max 2 MB.
                          </span>
                          <input
                            id="avatar-upload-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            style={{ display: 'none' }}
                            onChange={handlePhotoUpload}
                          />
                        </div>
                      </div>

                      <h4 style={{ marginBottom: 'var(--space-3)' }}>Basic Details</h4>
                      <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
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
                          <label className="form-label">Date of Birth</label>
                          <input className="form-input" type="date" value={form.dob || ""} onChange={e => setForm({ ...form, dob: e.target.value })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Blood Group</label>
                          <select className="form-select" value={form.bloodGroup || ""} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
                            <option value="">Select Blood Group</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
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
                    </>
                  )}

                  {activeTab === "Employment" && (
                    <>
                      <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-4)' }}>Employment Information</h3>
                      <h4 style={{ marginBottom: 'var(--space-3)' }}>Employment Details</h4>
                      <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-field">
                          <label className="form-label">Employee Status</label>
                          <select className="form-select" value={form.employeeStatus || "Active"} onChange={e => setForm({ ...form, employeeStatus: e.target.value })}>
                            <option value="Active">Active</option>
                            <option value="Notice Period">Notice Period</option>
                            <option value="Ex Employee">Ex Employee</option>
                            <option value="Terminated">Terminated</option>
                            <option value="Suspended">Suspended</option>
                            <option value="On Leave">On Leave</option>
                          </select>
                        </div>
                        <div className="form-field">
                          <label className="form-label">Employment Type</label>
                          <select className="form-select" value={form.employmentType || "Full Time"} onChange={e => setForm({ ...form, employmentType: e.target.value })}>
                            <option value="Full Time">Full Time</option>
                            <option value="Part Time">Part Time</option>
                            <option value="Contract">Contract</option>
                            <option value="Consultant">Consultant</option>
                            <option value="Paid Intern">Paid Intern</option>
                            <option value="Unpaid Intern">Unpaid Intern</option>
                            <option value="Trainee">Trainee</option>
                            <option value="Probation">Probation</option>
                          </select>
                        </div>
                        <div className="form-field">
                          <label className="form-label">Joining Date</label>
                          <input className="form-input" type="date" value={form.joiningDate || ""} onChange={e => setForm({ ...form, joiningDate: e.target.value })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Relieving Date (Optional)</label>
                          <input className="form-input" type="date" value={form.leavingDate || ""} onChange={e => setForm({ ...form, leavingDate: e.target.value })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Probation End Date (Optional)</label>
                          <input className="form-input" type="date" value={form.probationEndDate || ""} onChange={e => setForm({ ...form, probationEndDate: e.target.value })} />
                        </div>
                        {form.employeeStatus === "Notice Period" && (
                          <div className="form-field">
                            <label className="form-label">Notice Period Days</label>
                            <input className="form-input" type="number" min="0" max="365" step="1" value={form.noticePeriodDays || 0} onChange={e => setForm({ ...form, noticePeriodDays: e.target.value })} />
                          </div>
                        )}
                        <div className="form-field">
                          <label className="form-label">Reporting Manager</label>
                          <select className="form-select" value={form.reportsTo || ""} onChange={e => setForm({ ...form, reportsTo: e.target.value })}>
                            <option value="">No Reporting Manager</option>
                            {activeManagerOptions.map(m => (
                              <option key={m.linkedUser?._id} value={m.linkedUser?._id}>
                                {m.name} ({m.designation || "Employee"})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                        <h4 style={{ marginBottom: 'var(--space-3)' }}>Government Details</h4>
                        <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                          <div className="form-field">
                            <label className="form-label">Aadhaar Number</label>
                            <input className="form-input" type="text" inputMode="numeric" maxLength={12} placeholder={form.aadhaarNumber && form.aadhaarNumber.includes("X") ? form.aadhaarNumber : "Enter 12-digit Aadhaar"} value={form.aadhaarNumber || ""} onChange={e => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, "") })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">PAN Number</label>
                            <input className="form-input" type="text" maxLength={10} placeholder={form.panNumber && form.panNumber.includes("X") ? form.panNumber : "Enter PAN (ABCDE1234F)"} value={form.panNumber || ""} onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">UAN Number</label>
                            <input className="form-input" type="text" inputMode="numeric" maxLength={12} placeholder={form.uanNumber && form.uanNumber.includes("X") ? form.uanNumber : "Enter 12-digit UAN"} value={form.uanNumber || ""} onChange={e => setForm({ ...form, uanNumber: e.target.value.replace(/\D/g, "") })} />
                          </div>
                          <div className="form-field">
                            <label className="form-label">ESIC Number</label>
                            <input className="form-input" type="text" inputMode="numeric" maxLength={17} placeholder={form.esicNumber && form.esicNumber.includes("X") ? form.esicNumber : "Enter 10-17 digit ESIC"} value={form.esicNumber || ""} onChange={e => setForm({ ...form, esicNumber: e.target.value.replace(/\D/g, "") })} />
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                        <h4 style={{ marginBottom: 'var(--space-3)' }}>Reporting Hierarchy</h4>
                        <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                          <div className="form-field">
                            <label className="form-label">Current Manager Summary</label>
                            <div className="form-input" style={{ background: 'var(--color-bg-alt)', opacity: 0.85, height: 'auto', minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                              {currentManager ? (
                                <span>{currentManager.name} ({currentManager.designation || "N/A"} - {currentManager.department || "N/A"})</span>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)' }}>No Reporting Manager</span>
                              )}
                            </div>
                          </div>
                          <div className="form-field" style={{ gridColumn: 'span 2' }}>
                            <label className="form-label">Direct Reports ({directReports.length})</label>
                            <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--border-radius)', padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '150px', overflowY: 'auto' }}>
                              {directReports.length > 0 ? (
                                directReports.map(rep => (
                                  <div key={rep._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-border-soft)', paddingBottom: '4px' }}>
                                    <span style={{ fontWeight: 'var(--font-semibold)' }}>{rep.name}</span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>{rep.designation} • {rep.department}</span>
                                  </div>
                                ))
                              ) : (
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>No direct reports.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "Banking" && (
                    <>
                      <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-4)' }}>Banking Information</h3>
                      <h4 style={{ marginBottom: 'var(--space-3)' }}>Bank Details</h4>
                      <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-field">
                          <label className="form-label">Payment Mode</label>
                          <select className="form-select" value={form.bankDetails?.paymentMode || ""} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, paymentMode: e.target.value } })}>
                            <option value="">Select Mode</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                            <option value="UPI">UPI</option>
                          </select>
                        </div>
                        <div className="form-field">
                          <label className="form-label">Bank Name</label>
                          <input className="form-input" placeholder="e.g. State Bank of India" value={form.bankDetails?.bankName || ""} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Account Holder Name</label>
                          <input className="form-input" placeholder="e.g. John Doe" value={form.bankDetails?.accountHolderName || ""} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, accountHolderName: e.target.value } })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Account Number</label>
                          <input className="form-input" type="text" maxLength={18} placeholder={form.bankDetails?.accountNumber && form.bankDetails.accountNumber.includes("X") ? form.bankDetails.accountNumber : "Enter Account Number"} value={form.bankDetails?.accountNumber || ""} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value.replace(/\D/g, "") } })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Confirm Account Number</label>
                          <input className="form-input" type="text" maxLength={18} placeholder="Confirm Account Number" value={form.confirmAccountNumber || ""} onChange={e => setForm({ ...form, confirmAccountNumber: e.target.value.replace(/\D/g, "") })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">IFSC Code</label>
                          <input className="form-input" placeholder="e.g. SBIN0001234" value={form.bankDetails?.ifscCode || ""} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, ifscCode: e.target.value.toUpperCase() } })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Branch Name</label>
                          <input className="form-input" placeholder="e.g. Mumbai Main Branch" value={form.bankDetails?.branchName || ""} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, branchName: e.target.value } })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">UPI ID (Optional)</label>
                          <input className="form-input" placeholder="e.g. name@upi" value={form.bankDetails?.upiId || ""} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, upiId: e.target.value } })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Account Type</label>
                          <select className="form-select" value={form.bankDetails?.accountType || ""} onChange={e => setForm({ ...form, bankDetails: { ...form.bankDetails, accountType: e.target.value } })}>
                            <option value="">Select Account Type</option>
                            <option value="Savings">Savings</option>
                            <option value="Current">Current</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === "Payroll" && (
                    <>
                      <h3 style={{ fontSize: 'var(--text-md)', marginBottom: 'var(--space-4)' }}>Salary Information</h3>
                      <h4 style={{ marginBottom: 'var(--space-3)' }}>Salary Details</h4>
                      <div className="employee-profile-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-field">
                          <label className="form-label">Offered Salary (Annual CTC - ₹)</label>
                          <input className="form-input" type="number" min="0" step="0.01" value={form.offeredSalary || ""} onChange={e => setForm({ ...form, offeredSalary: e.target.value })} />
                        </div>
                        <div className="form-field">
                          <label className="form-label">Current Salary (Annual CTC - ₹)</label>
                          <input className="form-input" type="number" min="0" step="0.01" value={form.salary || ""} onChange={e => setForm({ ...form, salary: e.target.value })} />
                        </div>
                      </div>
                    </>
                  )}
                </form>
              )}

              {activeTab === "Documents" && (
                <div className="nc-card" style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--text-lg)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>Employee Documents</h3>
                  <form onSubmit={handleUploadDocument} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', background: 'var(--color-bg-alt)', padding: 'var(--space-4)', borderRadius: 'var(--border-radius)' }}>
                    <div className="form-field">
                      <label className="form-label">Document Type</label>
                      <select className="form-select" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                        <option value="Resume">Resume</option>
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="UAN Document">UAN Document</option>
                        <option value="ESIC Document">ESIC Document</option>
                        <option value="Offer Letter">Offer Letter</option>
                        <option value="Experience Letter">Experience Letter</option>
                        <option value="Joining Letter">Joining Letter</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="form-label">Choose File</label>
                      <input id="doc-file-input" type="file" className="form-input" onChange={e => setUploadFile(e.target.files[0])} />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">Optional Notes</label>
                      <input className="form-input" placeholder="Add any comments or notes here..." value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} />
                    </div>
                    <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                      <button type="submit" className="btn btn-primary" disabled={uploadingDoc}>
                        {uploadingDoc ? "Uploading..." : "Upload Document"}
                      </button>
                    </div>
                    {uploadError && (
                      <div className="badge badge-error" style={{ gridColumn: 'span 2', textAlign: 'left', display: 'block', padding: 'var(--space-2)' }}>
                        {uploadError}
                      </div>
                    )}
                  </form>

                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <h4 style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>Uploaded Documents</h4>
                    {docsLoading ? (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)', textAlign: 'center' }}>
                        Loading documents...
                      </div>
                    ) : docsError ? (
                      <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)', textAlign: 'center' }}>
                        {docsError}
                      </div>
                    ) : documents.length === 0 ? (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-4)', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: 'var(--border-radius)' }}>
                        No documents uploaded yet.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                        {documents.map(doc => (
                          <div key={doc._id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)', padding: 'var(--space-3)', background: 'var(--color-bg-alt)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong style={{ fontSize: 'var(--text-sm)' }}>{doc.documentType || "Other"}</strong>
                                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
                                  ({doc.originalName})
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                <span className={`badge ${
                                  doc.status === 'Verified' ? 'badge-success' :
                                  doc.status === 'Rejected' ? 'badge-error' : 'badge-warning'
                                }`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                  {doc.status || 'Pending'}
                                </span>
                              </div>
                            </div>

                            {doc.notes && (
                              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', margin: '4px 0' }}>
                                <strong>Notes:</strong> {doc.notes}
                              </p>
                            )}

                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                              Uploaded on: {new Date(doc.uploadedAt).toLocaleDateString("en-IN")} at {new Date(doc.uploadedAt).toLocaleTimeString("en-IN")}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)', borderTop: '1px solid var(--color-border-soft)', paddingTop: 'var(--space-2)' }}>
                              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }} onClick={() => handleDownloadDocument(doc._id)}>
                                  Download
                                </button>
                                <button type="button" className="btn btn-ghost btn-danger" style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }} onClick={() => handleDeleteDocument(doc._id)}>
                                  Delete
                                </button>
                              </div>

                              {canVerifyDocuments && doc.status === 'Pending' && (
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                  <button type="button" className="btn btn-success" style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }} onClick={() => handleVerifyDocument(doc._id, 'Verified')}>
                                    Verify
                                  </button>
                                  <button type="button" className="btn btn-danger" style={{ padding: '4px 8px', fontSize: 'var(--text-xs)' }} onClick={() => handleVerifyDocument(doc._id, 'Rejected')}>
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "Payroll" && (
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
            )}
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
