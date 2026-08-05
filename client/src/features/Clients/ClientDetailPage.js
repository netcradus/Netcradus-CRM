import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  Building, ChevronRight, Calendar, Mail, Phone, MapPin, CreditCard, Clock, 
  User, Shield, Layers, HelpCircle, FileText, CheckCircle, MessageSquare, Plus, ArrowLeft, Eye,
  Edit, Trash2, Download, RefreshCw, X, Search, Filter
} from "lucide-react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { clientApi } from "./clientApi";

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Overview");
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState("");

  // Support Portal access states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submittingAccess, setSubmittingAccess] = useState(false);
  const [accessError, setAccessError] = useState("");
  const [ticketCommentText, setTicketCommentText] = useState("");

  const currentUserRole = String(localStorage.getItem("userRole") || "").trim().toLowerCase();

  const loadClientDetails = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await clientApi.get(id);
      if (res.data.success) {
        setData(res.data);
      } else {
        setError("Failed to load client details.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Client not found or access denied.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClientDetails();
  }, [loadClientDetails]);

  // Contracts states
  const [contracts, setContracts] = useState([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [errorContracts, setErrorContracts] = useState("");
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isContractEdit, setIsContractEdit] = useState(false);
  const [submittingContract, setSubmittingContract] = useState(false);
  const [contractError, setContractError] = useState("");
  const [contractForm, setContractForm] = useState({
    title: "",
    contractType: "Other",
    startDate: "",
    endDate: "",
    contractValue: "",
    currency: "INR",
    billingType: "Fixed",
    paymentTerms: "Net 30",
    autoRenew: false,
    noticePeriodDays: 30,
    description: "",
    terms: ""
  });

  // Invoices states
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [errorInvoices, setErrorInvoices] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showViewInvoiceModal, setShowViewInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceEdit, setIsInvoiceEdit] = useState(false);

  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const [invoiceForm, setInvoiceForm] = useState({
    projectId: "",
    contractId: "",
    issueDate: "",
    dueDate: "",
    currency: "INR",
    taxType: "Percentage",
    taxValue: 0,
    discountType: "Percentage",
    discountValue: 0,
    notes: "",
    terms: "",
    lineItems: [{ description: "", quantity: 1, rate: 0 }],
    paidAmount: 0,
    isDraft: false
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    referenceNumber: "",
    notes: ""
  });

  // Documents states
  const [documents, setDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [errorDocuments, setErrorDocuments] = useState("");
  const [showDocModal, setShowDocModal] = useState(false);
  const [isDocEdit, setIsDocEdit] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docForm, setDocForm] = useState({
    title: "",
    documentType: "Other",
    notes: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Filters
  const [contractFilter, setContractFilter] = useState({ search: "", status: "", type: "" });
  const [invoiceFilter, setInvoiceFilter] = useState({
    search: "",
    status: "",
    projectId: "",
    contractId: "",
    currency: "",
    issueDateStart: "",
    issueDateEnd: "",
    dueDateStart: "",
    dueDateEnd: ""
  });
  const [docFilter, setDocFilter] = useState({ search: "", type: "" });

  // Contacts & Projects Tab states
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [errorContacts, setErrorContacts] = useState("");
  const [showContactModal, setShowContactModal] = useState(false);
  const [isContactEdit, setIsContactEdit] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState("");
  
  const [contactForm, setContactForm] = useState({
    name: "",
    designation: "",
    department: "",
    email: "",
    phone: "",
    alternatePhone: "",
    preferredContactMethod: "Email",
    contactType: "Other",
    isPrimary: false,
    notes: ""
  });
  
  const [contactFilter, setContactFilter] = useState({
    search: "",
    type: "",
    status: ""
  });
  
  const [clientProjects, setClientProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [errorProjects, setErrorProjects] = useState("");
  
  const [projectFilter, setProjectFilter] = useState({
    search: "",
    status: "",
    managerId: ""
  });

  const [users, setUsers] = useState([]);

  // Contacts Support Access states
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);
  const [selectedContactSupport, setSelectedContactSupport] = useState(null);
  const [contactTempPassword, setContactTempPassword] = useState("");
  const [contactConfirmPassword, setContactConfirmPassword] = useState("");
  const [contactSupportError, setContactSupportError] = useState("");
  const [submittingContactSupport, setSubmittingContactSupport] = useState(false);

  const loadContracts = useCallback(async () => {
    setLoadingContracts(true);
    setErrorContracts("");
    try {
      const res = await axios.get(apiUrl(`/api/clients/${id}/contracts`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setContracts(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setErrorContracts(err.response?.data?.message || "Failed to load contracts.");
    } finally {
      setLoadingContracts(false);
    }
  }, [id]);

  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    setErrorInvoices("");
    try {
      const res = await axios.get(apiUrl(`/api/clients/${id}/invoices`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setErrorInvoices(err.response?.data?.message || "Failed to load invoices.");
    } finally {
      setLoadingInvoices(false);
    }
  }, [id]);

  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    setErrorDocuments("");
    try {
      const res = await axios.get(apiUrl(`/api/clients/${id}/documents`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setErrorDocuments(err.response?.data?.message || "Failed to load documents.");
    } finally {
      setLoadingDocuments(false);
    }
  }, [id]);

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    setErrorContacts("");
    try {
      const res = await clientApi.contacts(id);
      if (res.data.success) {
        setContacts(res.data.contacts);
      }
    } catch (err) {
      console.error(err);
      setErrorContacts(err.response?.data?.message || "Failed to load contacts.");
    } finally {
      setLoadingContacts(false);
    }
  }, [id]);

  const loadClientProjects = useCallback(async () => {
    setLoadingProjects(true);
    setErrorProjects("");
    try {
      const params = {};
      if (projectFilter.search) params.search = projectFilter.search;
      if (projectFilter.status) params.status = projectFilter.status;
      if (projectFilter.managerId) params.managerId = projectFilter.managerId;

      const res = await clientApi.projects(id, params);
      if (res.data.success) {
        setClientProjects(res.data.projects);
      }
    } catch (err) {
      console.error(err);
      setErrorProjects(err.response?.data?.message || "Failed to load projects.");
    } finally {
      setLoadingProjects(false);
    }
  }, [id, projectFilter.search, projectFilter.status, projectFilter.managerId]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await clientApi.users();
        setUsers(res.data.users || []);
      } catch (err) {
        console.error("Failed to load users list", err);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "Contracts") loadContracts();
    if (activeTab === "Invoices") loadInvoices();
    if (activeTab === "Documents") loadDocuments();
    if (activeTab === "Contacts") loadContacts();
    if (activeTab === "Projects") loadClientProjects();
  }, [activeTab, loadContracts, loadInvoices, loadDocuments, loadContacts, loadClientProjects]);

  const handleSaveContract = async (e) => {
    e.preventDefault();
    setSubmittingContract(true);
    setContractError("");
    try {
      const payload = { ...contractForm };
      let res;
      if (isContractEdit) {
        res = await axios.put(apiUrl(`/api/clients/${id}/contracts/${selectedContract._id}`), payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
      } else {
        res = await axios.post(apiUrl(`/api/clients/${id}/contracts`), payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
      }
      if (res.data.success) {
        setShowContractModal(false);
        loadContracts();
      }
    } catch (err) {
      console.error(err);
      setContractError(err.response?.data?.message || "Failed to save contract.");
    } finally {
      setSubmittingContract(false);
    }
  };

  const handleArchiveContract = async (contractId) => {
    if (!window.confirm("Are you sure you want to archive this contract?")) return;
    try {
      const res = await axios.patch(apiUrl(`/api/clients/${id}/contracts/${contractId}/archive`), {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        loadContracts();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to archive contract.");
    }
  };

  const handleDeleteContract = async (contractId) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this contract? This action cannot be undone.")) return;
    try {
      const res = await axios.delete(apiUrl(`/api/clients/${id}/contracts/${contractId}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        loadContracts();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete contract.");
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    setSubmittingContact(true);
    setContactError("");
    try {
      let res;
      if (isContactEdit) {
        res = await clientApi.updateContact(id, selectedContact._id, contactForm);
      } else {
        res = await clientApi.createContact(id, contactForm);
      }
      if (res.data.success) {
        setShowContactModal(false);
        loadContacts();
        loadClientDetails();
      }
    } catch (err) {
      console.error(err);
      setContactError(err.response?.data?.message || "Failed to save contact details.");
    } finally {
      setSubmittingContact(false);
    }
  };

  const handleMakeContactPrimary = async (contactId) => {
    try {
      const res = await clientApi.makeContactPrimary(id, contactId);
      if (res.data.success) {
        loadContacts();
        loadClientDetails();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to set contact as primary.");
    }
  };

  const handleToggleContactStatus = async (contact) => {
    const nextStatus = contact.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await clientApi.patchContactStatus(id, contact._id, nextStatus);
      if (res.data.success) {
        loadContacts();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to toggle status.");
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this contact record?")) return;
    try {
      const res = await clientApi.deleteContact(id, contactId);
      if (res.data.success) {
        loadContacts();
        loadClientDetails();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete contact.");
    }
  };

  const handleEnableContactSupport = async (e) => {
    e.preventDefault();
    if (contactTempPassword !== contactConfirmPassword) {
      setContactSupportError("Passwords do not match.");
      return;
    }
    if (contactTempPassword.length < 8) {
      setContactSupportError("Password must be at least 8 characters long.");
      return;
    }
    setSubmittingContactSupport(true);
    setContactSupportError("");
    try {
      const res = await clientApi.enableContactSupport(id, selectedContactSupport._id, {
        temporaryPassword: contactTempPassword
      });
      if (res.data.success) {
        setShowContactSupportModal(false);
        setContactTempPassword("");
        setContactConfirmPassword("");
        loadContacts();
        loadClientDetails();
      }
    } catch (err) {
      console.error(err);
      setContactSupportError(err.response?.data?.message || "Failed to enable support portal access.");
    } finally {
      setSubmittingContactSupport(false);
    }
  };

  const handleSuspendContactSupport = async (contactId) => {
    if (!window.confirm("Are you sure you want to suspend support portal access for this contact?")) return;
    try {
      const res = await clientApi.suspendContactSupport(id, contactId);
      if (res.data.success) {
        loadContacts();
        loadClientDetails();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to suspend support access.");
    }
  };

  const handleRenewContract = (contract) => {
    const prevEndDate = contract.endDate ? contract.endDate.split("T")[0] : "";
    let nextEndDate = "";
    if (prevEndDate) {
      const d = new Date(prevEndDate);
      d.setFullYear(d.getFullYear() + 1);
      nextEndDate = d.toISOString().split("T")[0];
    }
    setContractForm({
      title: `${contract.title} - Renewal`,
      contractType: contract.contractType,
      startDate: prevEndDate,
      endDate: nextEndDate,
      contractValue: contract.contractValue,
      currency: contract.currency,
      billingType: contract.billingType,
      paymentTerms: contract.paymentTerms,
      autoRenew: contract.autoRenew,
      noticePeriodDays: contract.noticePeriodDays,
      description: contract.description,
      terms: contract.terms
    });
    setContractError("");
    setIsContractEdit(false);
    setShowContractModal(true);
  };
  
  const handleSaveInvoice = async (e, shouldBeDraft = false) => {
    if (e) e.preventDefault();
    setSubmittingInvoice(true);
    setInvoiceError("");
    try {
      const payload = {
        projectId: invoiceForm.projectId || null,
        contractId: invoiceForm.contractId || null,
        issueDate: invoiceForm.issueDate || null,
        dueDate: invoiceForm.dueDate,
        currency: invoiceForm.currency,
        taxType: invoiceForm.taxType,
        taxValue: Number(invoiceForm.taxValue) || 0,
        discountType: invoiceForm.discountType,
        discountValue: Number(invoiceForm.discountValue) || 0,
        notes: invoiceForm.notes,
        terms: invoiceForm.terms,
        lineItems: invoiceForm.lineItems,
        paidAmount: Number(invoiceForm.paidAmount) || 0,
        status: shouldBeDraft ? "Draft" : "Sent"
      };

      let res;
      if (isInvoiceEdit) {
        res = await axios.put(apiUrl(`/api/clients/${id}/invoices/${selectedInvoice._id}`), payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
      } else {
        res = await axios.post(apiUrl(`/api/clients/${id}/invoices`), payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
      }
      if (res.data.success) {
        setShowInvoiceModal(false);
        loadInvoices();
      }
    } catch (err) {
      console.error(err);
      setInvoiceError(err.response?.data?.message || "Failed to save invoice.");
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmittingPayment(true);
    setPaymentError("");
    try {
      const res = await axios.post(apiUrl(`/api/clients/${id}/invoices/${selectedInvoice._id}/payment`), {
        amount: Number(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setShowPaymentModal(false);
        setPaymentForm({
          amount: "",
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod: "Bank Transfer",
          referenceNumber: "",
          notes: ""
        });
        loadInvoices();
      }
    } catch (err) {
      console.error(err);
      setPaymentError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleMarkSentInvoice = async (invoice) => {
    try {
      const res = await axios.patch(apiUrl(`/api/clients/${id}/invoices/${invoice._id}/status`), {
        status: "Sent"
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        loadInvoices();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to mark invoice as sent.");
    }
  };

  const handleCancelInvoice = async (invoice) => {
    if (!window.confirm("Are you sure you want to cancel this invoice?")) return;
    try {
      const res = await axios.patch(apiUrl(`/api/clients/${id}/invoices/${invoice._id}/status`), {
        status: "Cancelled"
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        loadInvoices();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to cancel invoice.");
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await axios.delete(apiUrl(`/api/clients/${id}/invoices/${invoiceId}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        loadInvoices();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete invoice.");
    }
  };
  const handleSaveDocMetadata = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(apiUrl(`/api/clients/${id}/documents/${selectedDoc._id}`), {
        title: docForm.title,
        documentType: docForm.documentType,
        notes: docForm.notes
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        setShowDocModal(false);
        loadDocuments();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update document details.");
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("documentType", docForm.documentType);
    formData.append("notes", docForm.notes);

    try {
      const res = await axios.post(apiUrl(`/api/clients/${id}/documents`), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (res.data.success) {
        setShowDocModal(false);
        setSelectedFile(null);
        loadDocuments();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to upload document.");
    }
  };

  const handleArchiveDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to archive this document?")) return;
    try {
      const res = await axios.patch(apiUrl(`/api/clients/${id}/documents/${docId}/archive`), {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        loadDocuments();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to archive document.");
    }
  };

  const handleDeleteDoc = async (docId) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this document? This action cannot be undone.")) return;
    try {
      const res = await axios.delete(apiUrl(`/api/clients/${id}/documents/${docId}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.data.success) {
        loadDocuments();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete document.");
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await clientApi.addNote(id, newNote.trim());
      if (res.data.success) {
        setNewNote("");
        // Reload details to show note and audits
        loadClientDetails();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save note.");
    } finally {
      setAddingNote(false);
    }
  };

  const handleEnableSupport = async (e) => {
    e.preventDefault();
    if (tempPassword !== confirmPassword) {
      setAccessError("Passwords do not match.");
      return;
    }
    if (tempPassword.length < 8) {
      setAccessError("Password must be at least 8 characters long.");
      return;
    }
    setSubmittingAccess(true);
    setAccessError("");
    try {
      await clientApi.enableSupport(client._id, {
        name: supportName,
        email: supportEmail,
        temporaryPassword: tempPassword,
      });
      setShowSupportModal(false);
      setSupportName("");
      setSupportEmail("");
      setTempPassword("");
      setConfirmPassword("");
      loadClientDetails();
    } catch (err) {
      console.error(err);
      setAccessError(err.response?.data?.message || "Failed to enable support portal access.");
    } finally {
      setSubmittingAccess(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (tempPassword !== confirmPassword) {
      setAccessError("Passwords do not match.");
      return;
    }
    if (tempPassword.length < 8) {
      setAccessError("Password must be at least 8 characters long.");
      return;
    }
    setSubmittingAccess(true);
    setAccessError("");
    try {
      const targetUser = client.supportUser?._id || client.supportUsers?.[0]?.user?._id;
      if (!targetUser) throw new Error("No support user linked.");
      await clientApi.resetSupportPassword(client._id, targetUser, {
        temporaryPassword: tempPassword,
        confirmPassword,
      });
      setShowResetModal(false);
      setTempPassword("");
      setConfirmPassword("");
      alert("Password reset successfully!");
      loadClientDetails();
    } catch (err) {
      console.error(err);
      setAccessError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setSubmittingAccess(false);
    }
  };

  const handleAddTicketComment = async (e) => {
    e.preventDefault();
    if (!ticketCommentText.trim()) return;
    try {
      await axios.post(
        apiUrl(`/api/tickets/${selectedTicket._id}/comment`),
        { message: ticketCommentText.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const updatedClientRes = await clientApi.get(client._id);
      setData(updatedClientRes.data);
      const updatedTicket = updatedClientRes.data.tickets?.find(t => t._id === selectedTicket._id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
      setTicketCommentText("");
    } catch (err) {
      console.error(err);
      alert("Failed to add comment.");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
        <div className="nc-loading" style={{ textAlign: "center", padding: "var(--space-10)" }}>Loading client profile details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
        <div style={{ textAlign: "center", padding: "var(--space-10)" }}>
          <div style={{ color: "var(--color-error)", marginBottom: "var(--space-4)", fontSize: "var(--text-lg)" }}>{error}</div>
          <button className="btn btn-primary" onClick={() => navigate("/clients")}>
            <ArrowLeft size={16} /> Back to Directory
          </button>
        </div>
      </div>
    );
  }

  const { client, projects, auditLogs, tickets = [] } = data;

  const tabs = ["Overview", "Contacts", "Projects", "Support", "Contracts", "Invoices", "Documents", "Notes", "Activity"];

  const formatCurrency = (amount, currency = "INR") => {
    const normalizedCurrency = String(currency || "INR")
      .trim()
      .toUpperCase()
      .replace(/\s*\(.*?\)\s*/g, "");

    const localeMap = {
      INR: "en-IN",
      USD: "en-US",
      EUR: "en-IE",
      GBP: "en-GB"
    };

    return new Intl.NumberFormat(localeMap[normalizedCurrency] || "en-US", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: 2
    }).format(Number(amount || 0));
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "VIP": return "badge-danger";
      case "High": return "badge-warning";
      case "Medium": return "badge-success";
      default: return "badge-neutral";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Active": return "badge-success";
      case "Prospect": return "badge-info";
      case "On Hold": return "badge-warning";
      case "Inactive": return "badge-neutral";
      default: return "badge-neutral";
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      {/* Breadcrumbs */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-4)" }}>
        <Link to="/clients" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Clients</Link>
        <ChevronRight size={10} />
        <span>{client.clientId}</span>
      </div>

      {/* Main Profile Header Banner */}
      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-6)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "12px", background: "var(--color-bg-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building size={28} color="var(--color-accent)" />
            </div>
            <div>
              <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--font-bold)", margin: "0 0 var(--space-1) 0" }}>{client.clientName}</h1>
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", flexWrap: "wrap" }}>
                <span className={`badge ${getStatusClass(client.status)}`}>{client.status}</span>
                <span className={`badge ${getPriorityClass(client.priority)}`}>{client.priority}</span>
                <span className="badge badge-neutral" style={{ fontSize: "10px" }}>{client.clientType}</span>
                <span className="badge badge-neutral" style={{ fontSize: "10px" }}>{client.industry || "General"}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-6)" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Total Contract Value</div>
              <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>{formatCurrency(client.contractValue, client.currency)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Billing Type</div>
              <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-semibold)" }}>{client.billingType}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Tab Switcher */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-bg-hover)", gap: "var(--space-6)", marginBottom: "var(--space-6)", overflowX: "auto" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "var(--space-2) 0",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid var(--color-accent)" : "2px solid transparent",
              color: activeTab === tab ? "var(--color-accent)" : "var(--color-text-secondary)",
              fontWeight: activeTab === tab ? "var(--font-semibold)" : "var(--font-medium)",
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="nc-tab-panel">
        
        {/* OVERVIEW TAB */}
        {activeTab === "Overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-6)" }}>
            {/* Business Contact Cards */}
            <div className="nc-card" style={{ padding: "var(--space-5)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-4)" }}>Basic & Contact Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Contact Person</span>
                  <span>{client.contactPersonName || "—"} ({client.contactPersonDesignation || "Designation Not Specified"})</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Primary Email</span>
                  <span>{client.primaryEmail}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Primary Phone</span>
                  <span>{client.primaryPhone || "—"}</span>
                </div>
                {client.alternatePhone && (
                  <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                    <span style={{ color: "var(--color-text-muted)" }}>Alternate Phone</span>
                    <span>{client.alternatePhone}</span>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Preferred Contact</span>
                  <span>{client.preferredContactMethod}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Website</span>
                  <span>{client.website ? <a href={client.website} target="_blank" rel="noreferrer" style={{ color: "var(--color-accent)" }}>{client.website}</a> : "—"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Company Size</span>
                  <span>{client.companySize} Employees</span>
                </div>
              </div>
            </div>

            {/* Address & Assignment Cards */}
            <div className="nc-card" style={{ padding: "var(--space-5)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-4)" }}>Address & Assignment</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Address</span>
                  <span>
                    {client.addressLine1 || "—"}
                    {client.addressLine2 && `, ${client.addressLine2}`}
                    {client.city && `, ${client.city}`}
                    {client.state && `, ${client.state}`}
                    {client.country && `, ${client.country}`}
                    {client.postalCode && ` - ${client.postalCode}`}
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)", borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-3)", marginTop: "var(--space-2)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Account Manager</span>
                  <span>{client.assignedAccountManager?.name || "Unassigned"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Sales Person</span>
                  <span>{client.assignedSalesPerson?.name || "Unassigned"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)", borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-3)", marginTop: "var(--space-2)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>GST Number</span>
                  <span>{client.gstNumber || "Not Registered / Provided"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>PAN Card No.</span>
                  <span>{client.panNumber || "Not Provided"}</span>
                </div>
              </div>
            </div>

            {/* Contract Dates & Support Portal */}
            <div className="nc-card" style={{ padding: "var(--space-5)" }}>
              <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-4)" }}>Contracts & Support Portal Access</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Start Date</span>
                  <span>{client.contractStartDate ? new Date(client.contractStartDate).toLocaleDateString("en-IN") : "—"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>End Date</span>
                  <span>{client.contractEndDate ? new Date(client.contractEndDate).toLocaleDateString("en-IN") : "—"}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Payment Terms</span>
                  <span>{client.paymentTerms}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Payment Status</span>
                  <span className="badge badge-neutral">{client.paymentStatus}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)", borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-3)", marginTop: "var(--space-2)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Portal Status</span>
                  <span>{client.supportPortalStatus}</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", fontSize: "var(--text-sm)" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>Support Access</span>
                  <span>{client.supportAccessEnabled ? "Enabled" : "Disabled (Phase 1)"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTACTS TAB */}
        {activeTab === "Contacts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", gap: "var(--space-3)", flex: 1, flexWrap: "wrap" }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ maxWidth: "300px" }}
                  placeholder="Search contacts by name or email..." 
                  value={contactFilter.search} 
                  onChange={e => setContactFilter({ ...contactFilter, search: e.target.value })} 
                />
                <select 
                  className="form-input" 
                  style={{ maxWidth: "200px" }}
                  value={contactFilter.type} 
                  onChange={e => setContactFilter({ ...contactFilter, type: e.target.value })}
                >
                  <option value="">All Contact Types</option>
                  <option value="Primary">Primary</option>
                  <option value="Billing">Billing</option>
                  <option value="Technical">Technical</option>
                  <option value="Support">Support</option>
                  <option value="Decision Maker">Decision Maker</option>
                  <option value="Other">Other</option>
                </select>
                <select 
                  className="form-input" 
                  style={{ maxWidth: "200px" }}
                  value={contactFilter.status} 
                  onChange={e => setContactFilter({ ...contactFilter, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {["super_user", "coo", "admin", "sales"].includes(currentUserRole) && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    setContactForm({
                      name: "",
                      designation: "",
                      department: "",
                      email: "",
                      phone: "",
                      alternatePhone: "",
                      preferredContactMethod: "Email",
                      contactType: "Other",
                      isPrimary: false,
                      notes: ""
                    });
                    setContactError("");
                    setIsContactEdit(false);
                    setShowContactModal(true);
                  }}
                >
                  <Plus size={16} /> Add Contact
                </button>
              )}
            </div>

            <div className="nc-card" style={{ padding: "var(--space-5)" }}>
              {loadingContacts ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
                  <div className="nc-loading">Loading client contacts...</div>
                </div>
              ) : errorContacts ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-error)" }}>
                  <div>{errorContacts}</div>
                  <button className="btn btn-ghost" style={{ marginTop: "8px" }} onClick={loadContacts}>Retry</button>
                </div>
              ) : contacts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
                  No contacts found for this client.
                </div>
              ) : (
                <table className="nc-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Department</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Preferred Method</th>
                      <th>Type</th>
                      <th>Support Access</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts
                      .filter(c => {
                        const matchesSearch = (c.name || "").toLowerCase().includes((contactFilter.search || "").toLowerCase()) || 
                                              (c.email || "").toLowerCase().includes((contactFilter.search || "").toLowerCase());
                        const matchesType = contactFilter.type ? c.contactType === contactFilter.type : true;
                        const matchesStatus = contactFilter.status ? c.status === contactFilter.status : true;
                        return matchesSearch && matchesType && matchesStatus;
                      })
                      .map(c => (
                        <tr key={c._id}>
                          <td>
                            <strong style={{ fontSize: "var(--text-sm)" }}>{c.name}</strong>
                            {c.isPrimary && <span className="badge badge-success" style={{ marginLeft: "6px", fontSize: "9px", padding: "1px 4px" }}>Primary</span>}
                          </td>
                          <td>{c.designation || "—"}</td>
                          <td>{c.department || "—"}</td>
                          <td>{c.email}</td>
                          <td>{c.phone}</td>
                          <td>{c.preferredContactMethod}</td>
                          <td><span className="badge badge-neutral">{c.contactType}</span></td>
                          <td>
                            {c.supportAccessEnabled ? (
                              <span className="badge badge-success" title={`Linked to Support Account`}>Enabled</span>
                            ) : c.linkedSupportUser ? (
                              <span className="badge badge-danger" title="Support user suspended">Suspended</span>
                            ) : (
                              <span className="badge badge-neutral">Disabled</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${c.status === "Active" ? "badge-success" : "badge-neutral"}`}>
                              {c.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "2px" }}>
                              {/* View / Notes Tooltip */}
                              {c.notes && (
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  style={{ padding: "6px", minWidth: "32px", minHeight: "32px" }}
                                  title={`Notes: ${c.notes}`}
                                  onClick={() => alert(`Contact Notes:\n\n${c.notes}`)}
                                >
                                  <HelpCircle size={14} />
                                </button>
                              )}
                              
                              {["super_user", "coo", "admin", "sales"].includes(currentUserRole) && (
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  style={{ padding: "6px", minWidth: "32px", minHeight: "32px" }}
                                  title="Edit Contact"
                                  onClick={() => {
                                    setSelectedContact(c);
                                    setContactForm({
                                      name: c.name,
                                      designation: c.designation || "",
                                      department: c.department || "",
                                      email: c.email,
                                      phone: c.phone,
                                      alternatePhone: c.alternatePhone || "",
                                      preferredContactMethod: c.preferredContactMethod || "Email",
                                      contactType: c.contactType || "Other",
                                      isPrimary: c.isPrimary,
                                      notes: c.notes || ""
                                    });
                                    setContactError("");
                                    setIsContactEdit(true);
                                    setShowContactModal(true);
                                  }}
                                >
                                  <Edit size={14} />
                                </button>
                              )}

                              {!c.isPrimary && ["super_user", "coo", "admin", "sales"].includes(currentUserRole) && (
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  style={{ padding: "6px", minWidth: "32px", minHeight: "32px", color: "var(--color-warning)" }}
                                  title="Mark as Primary Contact"
                                  onClick={() => handleMakeContactPrimary(c._id)}
                                >
                                  <CheckCircle size={14} />
                                </button>
                              )}

                              {/* Support Access Toggle */}
                              {["super_user", "coo", "admin"].includes(currentUserRole) && (
                                <>
                                  {!c.supportAccessEnabled ? (
                                    <button
                                      type="button"
                                      className="btn btn-ghost"
                                      style={{ padding: "6px", minWidth: "32px", minHeight: "32px", color: "var(--color-info)" }}
                                      title="Enable Support Portal Access"
                                      onClick={() => {
                                        setSelectedContactSupport(c);
                                        setContactTempPassword("");
                                        setContactConfirmPassword("");
                                        setContactSupportError("");
                                        setShowContactSupportModal(true);
                                      }}
                                    >
                                      <Shield size={14} />
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="btn btn-ghost"
                                      style={{ padding: "6px", minWidth: "32px", minHeight: "32px", color: "var(--color-error)" }}
                                      title="Suspend Support Portal Access"
                                      onClick={() => handleSuspendContactSupport(c._id)}
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </>
                              )}

                              {/* Toggle Status Active/Inactive */}
                              {["super_user", "coo", "admin", "sales"].includes(currentUserRole) && (
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  style={{ padding: "6px", minWidth: "32px", minHeight: "32px", color: c.status === "Active" ? "var(--color-text-secondary)" : "var(--color-success)" }}
                                  title={c.status === "Active" ? "Deactivate Contact" : "Activate Contact"}
                                  onClick={() => handleToggleContactStatus(c)}
                                >
                                  <Clock size={14} />
                                </button>
                              )}

                              {/* Delete Contact (Super User only) */}
                              {currentUserRole === "super_user" && (
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  style={{ padding: "6px", minWidth: "32px", minHeight: "32px", color: "var(--color-error)" }}
                                  title="Delete Contact"
                                  onClick={() => handleDeleteContact(c._id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "Projects" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--space-4)" }}>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Total Projects</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>{clientProjects.length}</div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Active</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-info)" }}>
                  {clientProjects.filter(p => ["ongoing", "in_progress", "testing"].includes(p.status)).length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Completed</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-success)" }}>
                  {clientProjects.filter(p => p.status === "completed").length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>On Hold</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-warning)" }}>
                  {clientProjects.filter(p => p.status === "on_hold").length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Overdue</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-error)" }}>
                  {clientProjects.filter(p => p.status !== "completed" && p.status !== "cancelled" && p.deadline && new Date(p.deadline) < new Date()).length}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", gap: "var(--space-3)", flex: 1, flexWrap: "wrap" }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ maxWidth: "300px" }}
                  placeholder="Search projects..." 
                  value={projectFilter.search} 
                  onChange={e => setProjectFilter({ ...projectFilter, search: e.target.value })} 
                />
                <select 
                  className="form-input" 
                  style={{ maxWidth: "200px" }}
                  value={projectFilter.status} 
                  onChange={e => setProjectFilter({ ...projectFilter, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="testing">Testing</option>
                  <option value="completed">Completed</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select 
                  className="form-input" 
                  style={{ maxWidth: "200px" }}
                  value={projectFilter.managerId} 
                  onChange={e => setProjectFilter({ ...projectFilter, managerId: e.target.value })}
                >
                  <option value="">All Project Managers</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>

              {["super_user", "coo", "admin", "sales"].includes(currentUserRole) && (
                <Link 
                  to={currentUserRole === "manager" ? `/manager/projects/new?clientId=${client?._id}` : `/projects/new?clientId=${client?._id}`}
                  className="btn btn-primary"
                >
                  <Plus size={16} /> Add Project
                </Link>
              )}
            </div>

            <div className="nc-card" style={{ padding: "var(--space-5)" }}>
              {loadingProjects ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)" }}>
                  <div className="nc-loading">Loading projects...</div>
                </div>
              ) : errorProjects ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-error)" }}>
                  <div>{errorProjects}</div>
                  <button className="btn btn-ghost" style={{ marginTop: "8px" }} onClick={loadClientProjects}>Retry</button>
                </div>
              ) : clientProjects.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>
                  No projects linked to this client yet.
                </div>
              ) : (
                <table className="nc-table">
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Project Manager</th>
                      <th>Budget</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>Deadline</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientProjects.map((p) => {
                      // Project Manager name
                      const pmName = p.assignedEngineer?.name || "Unassigned";

                      // Calculate simple progress percent based on status enum for visual representation
                      let progressPercent = 0;
                      if (p.status === "completed") progressPercent = 100;
                      else if (p.status === "maintenance") progressPercent = 100;
                      else if (p.status === "testing") progressPercent = 85;
                      else if (p.status === "in_progress" || p.status === "ongoing") progressPercent = 60;
                      else if (p.status === "approved") progressPercent = 20;
                      else if (p.status === "under_review") progressPercent = 10;
                      else if (p.status === "new") progressPercent = 5;

                      const progressColor = progressPercent === 100 ? "var(--color-success)" : progressPercent > 50 ? "var(--color-info)" : "var(--color-warning)";

                      return (
                        <tr key={p._id}>
                          <td>
                            <strong style={{ fontSize: "var(--text-sm)" }}>{p.name}</strong>
                            <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>
                              {p.tagline || p.serviceType || "Custom Project"}
                            </div>
                          </td>
                          <td>{pmName}</td>
                          <td>{p.expectedBudget ? formatCurrency(p.expectedBudget, client?.currency || "INR") : "—"}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <div style={{ flex: 1, height: "6px", borderRadius: "3px", backgroundColor: "var(--color-bg-hover)", overflow: "hidden" }}>
                                <div style={{ width: `${progressPercent}%`, height: "100%", backgroundColor: progressColor }} />
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: "var(--font-bold)" }}>{progressPercent}%</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-neutral" style={{ textTransform: "capitalize" }}>{p.status}</span>
                          </td>
                          <td>{p.startDate ? new Date(p.startDate).toLocaleDateString("en-IN") : "—"}</td>
                          <td>{p.deadline ? new Date(p.deadline).toLocaleDateString("en-IN") : "—"}</td>
                          <td>
                            <div style={{ display: "flex", gap: "var(--space-1)" }}>
                              <Link 
                                to={currentUserRole === "manager" ? `/manager/projects/${p._id}` : `/projects/${p._id}`} 
                                className="btn btn-ghost" 
                                style={{ padding: "6px", minWidth: "32px", minHeight: "32px" }}
                                title="View Project Details"
                              >
                                <Eye size={14} />
                              </Link>
                              {["super_user", "coo", "admin", "sales"].includes(currentUserRole) && (
                                <Link 
                                  to={currentUserRole === "manager" ? `/manager/projects/${p._id}/edit` : `/projects/${p._id}/edit`} 
                                  className="btn btn-ghost" 
                                  style={{ padding: "6px", minWidth: "32px", minHeight: "32px" }}
                                  title="Edit Project Details"
                                >
                                  <Edit size={14} />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* CONTRACTS TAB */}
        {activeTab === "Contracts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "var(--space-4)" }}>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Total Contracts</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>{contracts.length}</div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Active</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-success)" }}>
                  {contracts.filter(c => c.status === "Active").length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Expiring Soon</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-warning)" }}>
                  {contracts.filter(c => c.status === "Expiring Soon").length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Expired</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-error)" }}>
                  {contracts.filter(c => c.status === "Expired").length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Contract Value</div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)", wordBreak: "break-all" }}>
                  {(() => {
                    const vals = contracts.reduce((acc, c) => {
                      if (c.status !== "Terminated") acc[c.currency] = (acc[c.currency] || 0) + c.contractValue;
                      return acc;
                    }, {});
                    return Object.entries(vals).map(([curr, val]) => formatCurrency(val, curr)).join(" | ") || "—";
                  })()}
                </div>
              </div>
            </div>

            {/* Filter and Add Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", gap: "var(--space-3)", flex: 1 }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search contracts..." 
                  value={contractFilter.search} 
                  onChange={e => setContractFilter({ ...contractFilter, search: e.target.value })} 
                />
                <select 
                  className="form-input" 
                  value={contractFilter.status} 
                  onChange={e => setContractFilter({ ...contractFilter, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
                <select 
                  className="form-input" 
                  value={contractFilter.type} 
                  onChange={e => setContractFilter({ ...contractFilter, type: e.target.value })}
                >
                  <option value="">All Types</option>
                  <option value="Service Agreement">Service Agreement</option>
                  <option value="NDA">NDA</option>
                  <option value="SLA">SLA</option>
                  <option value="SOW">SOW</option>
                  <option value="AMC">AMC</option>
                  <option value="Subscription">Subscription</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              {["super_user", "coo", "admin", "sales"].includes(currentUserRole) && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    setContractForm({
                      title: "",
                      contractType: "Other",
                      startDate: "",
                      endDate: "",
                      contractValue: "",
                      currency: "INR",
                      billingType: "Fixed",
                      paymentTerms: "Net 30",
                      autoRenew: false,
                      noticePeriodDays: 30,
                      description: "",
                      terms: ""
                    });
                    setContractError("");
                    setIsContractEdit(false);
                    setShowContractModal(true);
                  }}
                >
                  <Plus size={16} /> Add Contract
                </button>
              )}
            </div>

            {/* Contracts List Table */}
            <div className="nc-card" style={{ padding: "var(--space-5)" }}>
              {loadingContracts ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading contracts...</div>
              ) : errorContracts ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-error)" }}>{errorContracts}</div>
              ) : contracts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No contracts found.</div>
              ) : (
                <table className="nc-table">
                  <thead>
                    <tr>
                      <th>Contract ID</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Value</th>
                      <th>Status</th>
                      <th>Auto Renew</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts
                      .filter(c => {
                        const matchesSearch = c.title.toLowerCase().includes(contractFilter.search.toLowerCase()) || c.contractId.toLowerCase().includes(contractFilter.search.toLowerCase());
                        const matchesStatus = contractFilter.status ? c.status === contractFilter.status : true;
                        const matchesType = contractFilter.type ? c.contractType === contractFilter.type : true;
                        return matchesSearch && matchesStatus && matchesType;
                      })
                      .map(c => (
                        <tr key={c._id}>
                          <td><span className="badge badge-neutral">{c.contractId}</span></td>
                          <td><strong style={{ fontSize: "var(--text-sm)" }}>{c.title}</strong></td>
                          <td>{c.contractType}</td>
                          <td>{new Date(c.startDate).toLocaleDateString("en-IN")}</td>
                          <td>{new Date(c.endDate).toLocaleDateString("en-IN")}</td>
                          <td>{formatCurrency(c.contractValue, c.currency)}</td>
                          <td>
                            <span className={`badge ${c.status === "Active" ? "badge-success" : c.status === "Expired" || c.status === "Terminated" ? "badge-danger" : c.status === "Expiring Soon" ? "badge-warning" : "badge-neutral"}`}>
                              {c.status}
                            </span>
                          </td>
                          <td>{c.autoRenew ? "Yes" : "No"}</td>
                          <td>
                            <div style={{ display: "flex", gap: "var(--space-1)" }}>
                              <button 
                                type="button" 
                                className="btn btn-ghost" 
                                style={{ padding: "4px" }}
                                onClick={() => {
                                  setSelectedContract(c);
                                  setContractForm({
                                    title: c.title,
                                    contractType: c.contractType,
                                    startDate: c.startDate ? c.startDate.split("T")[0] : "",
                                    endDate: c.endDate ? c.endDate.split("T")[0] : "",
                                    contractValue: c.contractValue,
                                    currency: c.currency,
                                    billingType: c.billingType,
                                    paymentTerms: c.paymentTerms,
                                    autoRenew: c.autoRenew,
                                    noticePeriodDays: c.noticePeriodDays,
                                    description: c.description || "",
                                    terms: c.terms || ""
                                  });
                                  setContractError("");
                                  setIsContractEdit(true);
                                  setShowContractModal(true);
                                }}
                              >
                                <Edit size={14} />
                              </button>
                              
                              {["super_user", "coo", "admin", "sales"].includes(currentUserRole) && (
                                <button 
                                  type="button" 
                                  className="btn btn-ghost" 
                                  style={{ padding: "4px" }}
                                  onClick={() => handleRenewContract(c)}
                                  title="Renew Contract"
                                >
                                  <RefreshCw size={14} />
                                </button>
                              )}

                              {["super_user", "coo", "admin"].includes(currentUserRole) && (
                                <button 
                                  type="button" 
                                  className="btn btn-ghost" 
                                  style={{ padding: "4px", color: "var(--color-error)" }}
                                  onClick={() => handleArchiveContract(c._id)}
                                  title="Archive Contract"
                                >
                                  <X size={14} />
                                </button>
                              )}

                              {currentUserRole === "super_user" && (
                                <button 
                                  type="button" 
                                  className="btn btn-ghost" 
                                  style={{ padding: "4px", color: "var(--color-error)" }}
                                  onClick={() => handleDeleteContract(c._id)}
                                  title="Delete Contract"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* INVOICES TAB */}
        {activeTab === "Invoices" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "var(--space-4)" }}>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Total Invoices</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>{invoices.length}</div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Draft</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)" }}>
                  {invoices.filter(i => (i.paymentStatus || i.status) === "Draft").length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Sent</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-info)" }}>
                  {invoices.filter(i => (i.paymentStatus || i.status) === "Sent").length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Overdue</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-error)" }}>
                  {invoices.filter(i => (i.paymentStatus || i.status) === "Overdue").length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Paid</div>
                <div style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", color: "var(--color-success)" }}>
                  {invoices.filter(i => (i.paymentStatus || i.status) === "Paid").length}
                </div>
              </div>
              <div className="nc-card" style={{ padding: "var(--space-4)", textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>Outstanding</div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-bold)", wordBreak: "break-all" }}>
                  {(() => {
                    const vals = invoices.reduce((acc, i) => {
                      const stat = i.paymentStatus || i.status;
                      if (stat !== "Cancelled" && stat !== "Paid") {
                        acc[i.currency] = (acc[i.currency] || 0) + (i.balanceAmount ?? i.total ?? i.amount);
                      }
                      return acc;
                    }, {});
                    return Object.entries(vals).map(([curr, val]) => formatCurrency(val, curr)).join(" | ") || "—";
                  })()}
                </div>
              </div>
            </div>

            {/* Detailed Filters panel */}
            <div className="nc-card" style={{ padding: "var(--space-4)" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>Invoice Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Search e.g. INV-001..." 
                    value={invoiceFilter.search} 
                    onChange={e => setInvoiceFilter({ ...invoiceFilter, search: e.target.value })} 
                  />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>Status</label>
                  <select 
                    className="form-input" 
                    value={invoiceFilter.status} 
                    onChange={e => setInvoiceFilter({ ...invoiceFilter, status: e.target.value })}
                  >
                    <option value="">All Statuses</option>
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>Project</label>
                  <select 
                    className="form-input" 
                    value={invoiceFilter.projectId} 
                    onChange={e => setInvoiceFilter({ ...invoiceFilter, projectId: e.target.value })}
                  >
                    <option value="">All Projects</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>Contract</label>
                  <select 
                    className="form-input" 
                    value={invoiceFilter.contractId} 
                    onChange={e => setInvoiceFilter({ ...invoiceFilter, contractId: e.target.value })}
                  >
                    <option value="">All Contracts</option>
                    {contracts.map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>Currency</label>
                  <select 
                    className="form-input" 
                    value={invoiceFilter.currency} 
                    onChange={e => setInvoiceFilter({ ...invoiceFilter, currency: e.target.value })}
                  >
                    <option value="">All Currencies</option>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)", alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>Issue Date Range</label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input 
                      type="date" 
                      className="form-input" 
                      style={{ padding: "4px" }}
                      value={invoiceFilter.issueDateStart} 
                      onChange={e => setInvoiceFilter({ ...invoiceFilter, issueDateStart: e.target.value })} 
                    />
                    <input 
                      type="date" 
                      className="form-input" 
                      style={{ padding: "4px" }}
                      value={invoiceFilter.issueDateEnd} 
                      onChange={e => setInvoiceFilter({ ...invoiceFilter, issueDateEnd: e.target.value })} 
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "var(--color-text-muted)", display: "block", marginBottom: "4px" }}>Due Date Range</label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <input 
                      type="date" 
                      className="form-input" 
                      style={{ padding: "4px" }}
                      value={invoiceFilter.dueDateStart} 
                      onChange={e => setInvoiceFilter({ ...invoiceFilter, dueDateStart: e.target.value })} 
                    />
                    <input 
                      type="date" 
                      className="form-input" 
                      style={{ padding: "4px" }}
                      value={invoiceFilter.dueDateEnd} 
                      onChange={e => setInvoiceFilter({ ...invoiceFilter, dueDateEnd: e.target.value })} 
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "var(--space-2)" }}>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    style={{ flex: 1 }}
                    onClick={() => setInvoiceFilter({
                      search: "",
                      status: "",
                      projectId: "",
                      contractId: "",
                      currency: "",
                      issueDateStart: "",
                      issueDateEnd: "",
                      dueDateStart: "",
                      dueDateEnd: ""
                    })}
                  >
                    Reset Filters
                  </button>
                  {["super_user", "coo", "admin", "finance"].includes(currentUserRole) && (
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                      onClick={() => {
                        setInvoiceForm({
                          projectId: "",
                          contractId: "",
                          issueDate: new Date().toISOString().split("T")[0],
                          dueDate: "",
                          currency: "INR",
                          taxType: "Percentage",
                          taxValue: 0,
                          discountType: "Percentage",
                          discountValue: 0,
                          notes: "",
                          terms: "",
                          lineItems: [{ description: "", quantity: 1, rate: 0 }],
                          paidAmount: 0,
                          isDraft: false
                        });
                        setInvoiceError("");
                        setIsInvoiceEdit(false);
                        setShowInvoiceModal(true);
                      }}
                    >
                      <Plus size={14} /> Create
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Invoices List Card */}
            <div className="nc-card" style={{ padding: "var(--space-5)" }}>
              {loadingInvoices ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading invoices...</div>
              ) : errorInvoices ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-error)" }}>{errorInvoices}</div>
              ) : invoices.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No invoices found.</div>
              ) : (
                <table className="nc-table">
                  <thead>
                    <tr>
                      <th>Invoice No.</th>
                      <th>Issue Date</th>
                      <th>Due Date</th>
                      <th>Project</th>
                      <th>Contract</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices
                      .filter(i => {
                        const stat = i.paymentStatus || i.status;
                        const matchesSearch = i.invoiceNumber ? i.invoiceNumber.toLowerCase().includes(invoiceFilter.search.toLowerCase()) : true;
                        const matchesStatus = invoiceFilter.status ? stat === invoiceFilter.status : true;
                        const matchesProject = invoiceFilter.projectId ? i.projectId === invoiceFilter.projectId : true;
                        const matchesContract = invoiceFilter.contractId ? i.contractId === invoiceFilter.contractId : true;
                        const matchesCurrency = invoiceFilter.currency ? i.currency === invoiceFilter.currency : true;
                        
                        let matchesIssueStart = true;
                        if (invoiceFilter.issueDateStart && i.issueDate) {
                          matchesIssueStart = new Date(i.issueDate) >= new Date(invoiceFilter.issueDateStart);
                        }
                        let matchesIssueEnd = true;
                        if (invoiceFilter.issueDateEnd && i.issueDate) {
                          matchesIssueEnd = new Date(i.issueDate) <= new Date(invoiceFilter.issueDateEnd + "T23:59:59");
                        }
                        let matchesDueStart = true;
                        if (invoiceFilter.dueDateStart && i.dueDate) {
                          matchesDueStart = new Date(i.dueDate) >= new Date(invoiceFilter.dueDateStart);
                        }
                        let matchesDueEnd = true;
                        if (invoiceFilter.dueDateEnd && i.dueDate) {
                          matchesDueEnd = new Date(i.dueDate) <= new Date(invoiceFilter.dueDateEnd + "T23:59:59");
                        }

                        return matchesSearch && matchesStatus && matchesProject && matchesContract && matchesCurrency &&
                               matchesIssueStart && matchesIssueEnd && matchesDueStart && matchesDueEnd;
                      })
                      .map(i => {
                        const stat = i.paymentStatus || i.status;
                        const projName = projects.find(p => p._id === i.projectId)?.name || "—";
                        const cntTitle = contracts.find(c => c._id === i.contractId)?.title || "—";
                        return (
                          <tr key={i._id}>
                            <td><span className="badge badge-neutral">{i.invoiceNumber || "Draft"}</span></td>
                            <td>{i.issueDate ? new Date(i.issueDate).toLocaleDateString("en-IN") : "—"}</td>
                            <td>{new Date(i.dueDate).toLocaleDateString("en-IN")}</td>
                            <td><span style={{ fontSize: "var(--text-sm)" }}>{projName}</span></td>
                            <td><span style={{ fontSize: "var(--text-sm)" }}>{cntTitle}</span></td>
                            <td>{formatCurrency(i.total || i.amount, i.currency)}</td>
                            <td>{formatCurrency(i.paidAmount || 0, i.currency)}</td>
                            <td>{formatCurrency(i.balanceAmount ?? (i.total || i.amount), i.currency)}</td>
                            <td>
                              <span className={`badge ${stat === "Paid" ? "badge-success" : stat === "Overdue" || stat === "Cancelled" ? "badge-danger" : stat === "Sent" ? "badge-info" : stat === "Partial" ? "badge-warning" : "badge-neutral"}`}>
                                {stat}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", gap: "var(--space-1)" }}>
                                <button 
                                  type="button" 
                                  className="btn btn-ghost" 
                                  style={{ padding: "4px" }}
                                  title="Preview Invoice"
                                  onClick={() => {
                                    setSelectedInvoice(i);
                                    setShowViewInvoiceModal(true);
                                  }}
                                >
                                  <Eye size={14} />
                                </button>

                                {stat !== "Cancelled" && (
                                  <button 
                                    type="button" 
                                    className="btn btn-ghost" 
                                    style={{ padding: "4px" }}
                                    title="Edit Invoice Details"
                                    onClick={() => {
                                      setSelectedInvoice(i);
                                      setInvoiceForm({
                                        projectId: i.projectId || "",
                                        contractId: i.contractId || "",
                                        issueDate: i.issueDate ? i.issueDate.split("T")[0] : "",
                                        dueDate: i.dueDate ? i.dueDate.split("T")[0] : "",
                                        currency: i.currency,
                                        taxType: i.taxType || "Percentage",
                                        taxValue: i.taxValue !== undefined ? i.taxValue : (i.tax || 0),
                                        discountType: i.discountType || "Percentage",
                                        discountValue: i.discountValue !== undefined ? i.discountValue : (i.discount || 0),
                                        notes: i.notes || "",
                                        terms: i.terms || "",
                                        lineItems: i.lineItems || [{ description: "", quantity: 1, rate: 0 }],
                                        paidAmount: i.paidAmount || 0,
                                        isDraft: stat === "Draft"
                                      });
                                      setInvoiceError("");
                                      setIsInvoiceEdit(true);
                                      setShowInvoiceModal(true);
                                    }}
                                  >
                                    <Edit size={14} />
                                  </button>
                                )}

                                <a 
                                  href={apiUrl(`/api/clients/${id}/invoices/${i._id}/pdf?token=${localStorage.getItem("token")}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-ghost"
                                  style={{ padding: "4px" }}
                                  title="Download PDF"
                                >
                                  <Download size={14} />
                                </a>

                                {["super_user", "coo", "admin", "finance"].includes(currentUserRole) && stat === "Draft" && (
                                  <button 
                                    type="button" 
                                    className="btn btn-ghost" 
                                    style={{ padding: "4px" }}
                                    onClick={() => handleMarkSentInvoice(i)}
                                    title="Mark Sent"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                )}

                                {["super_user", "coo", "admin", "finance"].includes(currentUserRole) && stat !== "Paid" && stat !== "Cancelled" && stat !== "Draft" && (
                                  <button 
                                    type="button" 
                                    className="btn btn-ghost" 
                                    style={{ padding: "4px" }}
                                    onClick={() => {
                                      setSelectedInvoice(i);
                                      setPaymentForm({
                                        amount: "",
                                        paymentDate: new Date().toISOString().split("T")[0],
                                        paymentMethod: "Bank Transfer",
                                        referenceNumber: "",
                                        notes: ""
                                      });
                                      setPaymentError("");
                                      setShowPaymentModal(true);
                                    }}
                                    title="Record Payment"
                                  >
                                    <CreditCard size={14} />
                                  </button>
                                )}

                                {["super_user", "coo", "admin", "finance"].includes(currentUserRole) && stat !== "Cancelled" && (
                                  <button 
                                    type="button" 
                                    className="btn btn-ghost" 
                                    style={{ padding: "4px", color: "var(--color-error)" }}
                                    onClick={() => handleCancelInvoice(i)}
                                    title="Cancel Invoice"
                                  >
                                    <X size={14} />
                                  </button>
                                )}

                                {currentUserRole === "super_user" && (
                                  <button 
                                    type="button" 
                                    className="btn btn-ghost" 
                                    style={{ padding: "4px", color: "var(--color-error)" }}
                                    onClick={() => handleDeleteInvoice(i._id)}
                                    title="Delete Invoice"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {activeTab === "Documents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {/* Filter and Upload Document Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", gap: "var(--space-3)", flex: 1 }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Search documents by title..." 
                  value={docFilter.search} 
                  onChange={e => setDocFilter({ ...docFilter, search: e.target.value })} 
                />
                <select 
                  className="form-input" 
                  value={docFilter.type} 
                  onChange={e => setDocFilter({ ...docFilter, type: e.target.value })}
                >
                  <option value="">All Document Types</option>
                  <option value="Contract">Contract</option>
                  <option value="NDA">NDA</option>
                  <option value="SLA">SLA</option>
                  <option value="SOW">SOW</option>
                  <option value="GST Certificate">GST Certificate</option>
                  <option value="PAN">PAN</option>
                  <option value="Registration Certificate">Registration Certificate</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Payment Proof">Payment Proof</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {["super_user", "coo", "admin", "sales", "finance"].includes(currentUserRole) && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => {
                    setDocForm({
                      title: "",
                      documentType: "Other",
                      notes: ""
                    });
                    setSelectedFile(null);
                    setIsDocEdit(false);
                    setShowDocModal(true);
                  }}
                >
                  <Plus size={16} /> Upload Document
                </button>
              )}
            </div>

            {/* Documents List Table */}
            <div className="nc-card" style={{ padding: "var(--space-5)" }}>
              {loadingDocuments ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)" }}>Loading documents...</div>
              ) : errorDocuments ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-error)" }}>{errorDocuments}</div>
              ) : documents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-muted)" }}>No documents found.</div>
              ) : (
                <table className="nc-table">
                  <thead>
                    <tr>
                      <th>Filename / Title</th>
                      <th>Category</th>
                      <th>Size</th>
                      <th>Uploaded By</th>
                      <th>Uploaded Date</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents
                      .filter(d => {
                        const matchesSearch = d.originalName.toLowerCase().includes(docFilter.search.toLowerCase());
                        const matchesType = docFilter.type ? d.documentType === docFilter.type : true;
                        return matchesSearch && matchesType;
                      })
                      .map(d => (
                        <tr key={d._id}>
                          <td>
                            <strong style={{ fontSize: "var(--text-sm)" }}>{d.originalName}</strong>
                            <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{d.safeName}</div>
                          </td>
                          <td><span className="badge badge-neutral">{d.documentType || "Other"}</span></td>
                          <td>{(d.fileSizeMB || 0).toFixed(2)} MB</td>
                          <td>{d.ownerId?.name || "Staff"}</td>
                          <td>{new Date(d.uploadedAt).toLocaleDateString("en-IN")}</td>
                          <td><span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{d.notes || "—"}</span></td>
                          <td>
                            <div style={{ display: "flex", gap: "var(--space-1)" }}>
                              <a 
                                href={apiUrl(`/api/documents/download/${d._id}?token=${localStorage.getItem("token")}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost"
                                style={{ padding: "4px" }}
                                title="Download File"
                              >
                                <Download size={14} />
                              </a>
                              
                              <button 
                                type="button" 
                                className="btn btn-ghost" 
                                style={{ padding: "4px" }}
                                onClick={() => {
                                  setSelectedDoc(d);
                                  setDocForm({
                                    title: d.originalName,
                                    documentType: d.documentType || "Other",
                                    notes: d.notes || ""
                                  });
                                  setIsDocEdit(true);
                                  setShowDocModal(true);
                                }}
                              >
                                <Edit size={14} />
                              </button>

                              {["super_user", "coo", "admin"].includes(currentUserRole) && (
                                <button 
                                  type="button" 
                                  className="btn btn-ghost" 
                                  style={{ padding: "4px", color: "var(--color-error)" }}
                                  onClick={() => handleArchiveDoc(d._id)}
                                  title="Archive File"
                                >
                                  <X size={14} />
                                </button>
                              )}

                              {currentUserRole === "super_user" && (
                                <button 
                                  type="button" 
                                  className="btn btn-ghost" 
                                  style={{ padding: "4px", color: "var(--color-error)" }}
                                  onClick={() => handleDeleteDoc(d._id)}
                                  title="Delete File"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "Notes" && (
          <div className="nc-card" style={{ padding: "var(--space-5)" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-4)" }}>Internal Client Notes</h3>

            {/* Note Input */}
            <form onSubmit={handleAddNote} style={{ marginBottom: "var(--space-6)" }}>
              <div className="form-field">
                <textarea
                  className="form-input"
                  rows={3}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record an interaction, update, or meeting notes about this client..."
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={addingNote} style={{ marginTop: "var(--space-2)" }}>
                {addingNote ? "Adding Note..." : "Save Internal Note"}
              </button>
            </form>

            {/* Note Log List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {client.notes && client.notes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                  No internal notes recorded yet.
                </div>
              ) : (
                [...client.notes].reverse().map((note) => (
                  <div key={note._id} style={{ padding: "var(--space-4)", backgroundColor: "var(--color-bg-hover)", borderRadius: "8px", borderLeft: "4px solid var(--color-accent)" }}>
                    <p style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-sm)" }}>{note.message}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-text-muted)" }}>
                      <span>Added by {note.createdBy?.name || note.createdBy?.email || "Internal User"}</span>
                      <span>{new Date(note.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ACTIVITY TIMELINE TAB */}
        {activeTab === "Activity" && (
          <div className="nc-card" style={{ padding: "var(--space-5)" }}>
            <h3 style={{ fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-4)" }}>Activity Timeline</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", position: "relative", paddingLeft: "var(--space-4)" }}>
              <div style={{ position: "absolute", left: "6px", top: "8px", bottom: "8px", width: "2px", backgroundColor: "var(--color-bg-hover)" }} />
              
              {auditLogs && auditLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--color-text-muted)" }}>
                  No activities recorded yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log._id} style={{ display: "flex", gap: "var(--space-4)", position: "relative" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--color-accent)", border: "2px solid var(--color-bg-surface)", zIndex: 1, marginTop: "4px" }} />
                    <div>
                      <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)" }}>
                        {log.action.replace(/_/g, " ")}
                      </div>
                      {log.details && log.details.from && log.details.to && (
                        <div style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>
                          Changed from "{log.details.from}" to "{log.details.to}"
                        </div>
                      )}
                      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                        Performed by {log.performedBy?.name || "Internal Staff"} | {new Date(log.timestamp).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === "Support" && (
          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            
            {/* Support Portal Access Card */}
            <div className="nc-card" style={{ padding: "var(--space-6)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-5)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-3)" }}>Support Portal Access</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-bg-hover)", paddingBottom: "var(--space-3)" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Portal Status</span>
                  <span className={`badge ${client.supportPortalStatus === "Active" ? "badge-success" : client.supportPortalStatus === "Suspended" ? "badge-danger" : "badge-neutral"}`}>
                    {client.supportPortalStatus || "Not Enabled"}
                  </span>
                </div>

                {client.supportPortalStatus && client.supportPortalStatus !== "Not Invited" ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-bg-hover)", paddingBottom: "var(--space-3)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Login Email</span>
                      <strong style={{ fontSize: "var(--text-sm)" }}>{client.supportUser?.email || (client.supportUsers && client.supportUsers[0]?.user?.email) || "—"}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-bg-hover)", paddingBottom: "var(--space-3)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Granted Date</span>
                      <span style={{ fontSize: "var(--text-sm)" }}>{client.supportAccessGrantedAt ? new Date(client.supportAccessGrantedAt).toLocaleDateString("en-IN") : "—"}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-bg-hover)", paddingBottom: "var(--space-3)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Granted By</span>
                      <span style={{ fontSize: "var(--text-sm)" }}>{client.supportAccessGrantedBy?.name || "Internal Staff"}</span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                      <button 
                        type="button" 
                        className="btn btn-ghost"
                        onClick={() => {
                          const emailText = client.supportUser?.email || client.supportUsers?.[0]?.user?.email;
                          if (emailText) {
                            navigator.clipboard.writeText(emailText);
                            alert("Login email copied to clipboard!");
                          }
                        }}
                      >
                        Copy Login Email
                      </button>

                      {["super_user", "coo", "admin"].includes(currentUserRole) && (
                        <>
                          <button 
                            type="button" 
                            className="btn btn-ghost" 
                            onClick={() => {
                              setTempPassword("");
                              setConfirmPassword("");
                              setAccessError("");
                              setShowResetModal(true);
                            }}
                          >
                            Reset Password
                          </button>
                          
                          {client.supportPortalStatus === "Active" ? (
                            <button 
                              type="button" 
                              className="btn btn-ghost" 
                              style={{ color: "var(--color-error)" }}
                              onClick={async () => {
                                const targetUser = client.supportUser?._id || client.supportUsers?.[0]?.user?._id;
                                if (targetUser) {
                                  if (window.confirm("Are you sure you want to suspend Support Portal access for this client?")) {
                                    try {
                                      await clientApi.suspendSupport(client._id, targetUser);
                                      loadClientDetails();
                                    } catch (err) {
                                      alert(err.response?.data?.message || "Failed to suspend access.");
                                    }
                                  }
                                }
                              }}
                            >
                              Suspend Access
                            </button>
                          ) : (
                            <button 
                              type="button" 
                              className="btn btn-ghost"
                              style={{ color: "var(--color-success)" }}
                              onClick={async () => {
                                const targetUser = client.supportUser?._id || client.supportUsers?.[0]?.user?._id;
                                if (targetUser) {
                                  try {
                                    await clientApi.reEnableSupport(client._id, targetUser);
                                    loadClientDetails();
                                  } catch (err) {
                                    alert(err.response?.data?.message || "Failed to re-enable access.");
                                  }
                                }
                              }}
                            >
                              Re-enable Access
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: "var(--space-6) 0" }}>
                    <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", margin: "0 0 var(--space-5) 0" }}>
                      Support portal access is not provisioned for this client yet.
                    </p>
                    {["super_user", "coo", "admin"].includes(currentUserRole) && (
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => {
                          setSupportName(client.contactPersonName || "");
                          setSupportEmail(client.primaryEmail || "");
                          setTempPassword("");
                          setConfirmPassword("");
                          setAccessError("");
                          setShowSupportModal(true);
                        }}
                      >
                        Enable Support Access
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enable Support Modal */}
        {showSupportModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ padding: "var(--space-6)", width: "100%", maxWidth: "480px", margin: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-4)" }}>Enable Support Access</h3>
              
              {accessError && (
                <div style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>{accessError}</div>
              )}

              <form onSubmit={handleEnableSupport}>
                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Contact Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={supportName} 
                    onChange={(e) => setSupportName(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Login Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={supportEmail} 
                    onChange={(e) => setSupportEmail(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Temporary Password</label>
                  <div style={{ position: "relative" }}>
                    <input 
                      type={passwordVisible ? "text" : "password"} 
                      className="form-input" 
                      value={tempPassword} 
                      onChange={(e) => setTempPassword(e.target.value)} 
                      required 
                    />
                    <button 
                      type="button" 
                      style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "10px", color: "var(--color-text-muted)" }}
                      onClick={() => setPasswordVisible(!passwordVisible)}
                    >
                      {passwordVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-6)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Confirm Password</label>
                  <input 
                    type={passwordVisible ? "text" : "password"} 
                    className="form-input" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowSupportModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingAccess}>
                    {submittingAccess ? "Enabling..." : "Enable Portal Access"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ padding: "var(--space-6)", width: "100%", maxWidth: "480px", margin: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-4)" }}>Reset Temporary Password</h3>
              
              {accessError && (
                <div style={{ color: "var(--color-error)", fontSize: "var(--text-sm)", marginBottom: "var(--space-4)" }}>{accessError}</div>
              )}

              <form onSubmit={handleResetPassword}>
                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Temporary Password</label>
                  <div style={{ position: "relative" }}>
                    <input 
                      type={passwordVisible ? "text" : "password"} 
                      className="form-input" 
                      value={tempPassword} 
                      onChange={(e) => setTempPassword(e.target.value)} 
                      required 
                    />
                    <button 
                      type="button" 
                      style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "10px", color: "var(--color-text-muted)" }}
                      onClick={() => setPasswordVisible(!passwordVisible)}
                    >
                      {passwordVisible ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-6)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Confirm Password</label>
                  <input 
                    type={passwordVisible ? "text" : "password"} 
                    className="form-input" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowResetModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingAccess}>
                    {submittingAccess ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Ticket Modal */}
        {selectedTicket && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ padding: "var(--space-6)", width: "100%", maxWidth: "640px", margin: "var(--space-4)", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                <div>
                  <span className="badge badge-neutral" style={{ fontWeight: "var(--font-semibold)", marginBottom: "4px" }}>{selectedTicket.ticketId}</span>
                  <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", margin: 0 }}>{selectedTicket.title}</h3>
                </div>
                <button type="button" className="btn btn-ghost" style={{ padding: "4px" }} onClick={() => setSelectedTicket(null)}>Close</button>
              </div>

              <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-4)", borderBottom: "1px solid var(--color-bg-hover)", paddingBottom: "var(--space-3)", fontSize: "var(--text-sm)" }}>
                <div><span style={{ color: "var(--color-text-muted)" }}>Category:</span> {selectedTicket.category}</div>
                <div><span style={{ color: "var(--color-text-muted)" }}>Priority:</span> <span style={{ textTransform: "capitalize" }}>{selectedTicket.priority}</span></div>
                <div><span style={{ color: "var(--color-text-muted)" }}>Status:</span> <span style={{ textTransform: "capitalize" }}>{selectedTicket.status}</span></div>
              </div>

              <div style={{ marginBottom: "var(--space-6)" }}>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", marginBottom: "4px" }}>Description</h4>
                <p style={{ fontSize: "var(--text-sm)", margin: 0, whiteSpace: "pre-wrap" }}>{selectedTicket.description}</p>
              </div>

              <div style={{ borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-4)" }}>
                <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", marginBottom: "var(--space-3)" }}>Comments & Updates</h4>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "200px", overflowY: "auto", marginBottom: "var(--space-4)", paddingRight: "4px" }}>
                  {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                    <div style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>No comments posted yet.</div>
                  ) : (
                    selectedTicket.comments.map((c, idx) => (
                      <div key={idx} style={{ padding: "8px", background: "var(--color-bg-hover)", borderRadius: "6px" }}>
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "2px" }}>
                          <strong>{c.senderRole === "client_support" ? "Client Contact" : "CRM Staff (" + c.senderRole + ")"}</strong>
                        </div>
                        <p style={{ fontSize: "var(--text-sm)", margin: 0 }}>{c.message}</p>
                        <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textAlign: "right", marginTop: "2px" }}>
                          {new Date(c.createdAt).toLocaleString("en-IN")}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {["super_user", "coo", "admin"].includes(currentUserRole) && (
                  <form onSubmit={handleAddTicketComment} style={{ display: "flex", gap: "var(--space-2)" }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Post a reply comment..." 
                      value={ticketCommentText}
                      onChange={(e) => setTicketCommentText(e.target.value)}
                      required 
                    />
                    <button type="submit" className="btn btn-primary">Send</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contracts Add/Edit Modal */}
        {showContractModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ width: "min(820px, calc(100vw - 32px))", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", padding: 0, margin: "var(--space-4)" }}>
              
              <form onSubmit={handleSaveContract} style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", margin: 0 }}>
                
                {/* Modal Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--color-bg-hover)", flexShrink: 0 }}>
                  <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", margin: 0 }}>
                    {isContractEdit ? "Contract Details" : "Create New Contract"}
                  </h3>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    style={{ padding: "4px" }} 
                    onClick={() => setShowContractModal(false)}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Modal Body */}
                <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  
                  {contractError && (
                    <div style={{ padding: "12px", backgroundColor: "rgba(220,53,69,0.1)", border: "1px solid var(--color-error)", borderRadius: "6px", color: "var(--color-error)", fontSize: "var(--text-sm)", display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontWeight: "bold" }}>Error:</span> {contractError}
                    </div>
                  )}

                  <div className="form-field">
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Contract Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={contractForm.title} 
                      onChange={e => setContractForm({ ...contractForm, title: e.target.value })} 
                      required 
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Contract Type</label>
                      <select 
                        className="form-input" 
                        value={contractForm.contractType} 
                        onChange={e => setContractForm({ ...contractForm, contractType: e.target.value })}
                      >
                        <option value="Service Agreement">Service Agreement</option>
                        <option value="NDA">NDA</option>
                        <option value="SLA">SLA</option>
                        <option value="SOW">SOW</option>
                        <option value="AMC">AMC</option>
                        <option value="Subscription">Subscription</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Billing Type</label>
                      <select 
                        className="form-input" 
                        value={contractForm.billingType} 
                        onChange={e => setContractForm({ ...contractForm, billingType: e.target.value })}
                      >
                        <option value="Fixed">Fixed</option>
                        <option value="Hourly">Hourly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Annual">Annual</option>
                        <option value="Milestone">Milestone</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Start Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={contractForm.startDate} 
                        onChange={e => setContractForm({ ...contractForm, startDate: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>End Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={contractForm.endDate} 
                        onChange={e => setContractForm({ ...contractForm, endDate: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Contract Value</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={contractForm.contractValue} 
                        onChange={e => setContractForm({ ...contractForm, contractValue: e.target.value })} 
                        required 
                        min="0"
                      />
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Currency</label>
                      <select 
                        className="form-input" 
                        value={contractForm.currency} 
                        onChange={e => setContractForm({ ...contractForm, currency: e.target.value })}
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Payment Terms</label>
                      <select 
                        className="form-input" 
                        value={contractForm.paymentTerms} 
                        onChange={e => setContractForm({ ...contractForm, paymentTerms: e.target.value })}
                      >
                        <option value="Net 7">Net 7</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 45">Net 45</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Notice Period (Days)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={contractForm.noticePeriodDays} 
                        onChange={e => setContractForm({ ...contractForm, noticePeriodDays: e.target.value })} 
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "var(--text-sm)", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={contractForm.autoRenew} 
                        onChange={e => setContractForm({ ...contractForm, autoRenew: e.target.checked })} 
                      />
                      Auto Renew Contract
                    </label>
                  </div>

                  <div className="form-field">
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Description</label>
                    <textarea 
                      className="form-input" 
                      rows={3} 
                      value={contractForm.description} 
                      onChange={e => setContractForm({ ...contractForm, description: e.target.value })} 
                    />
                  </div>

                  <div className="form-field">
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Terms & Conditions</label>
                    <textarea 
                      className="form-input" 
                      rows={3} 
                      value={contractForm.terms} 
                      onChange={e => setContractForm({ ...contractForm, terms: e.target.value })} 
                    />
                  </div>

                </div>

                {/* Modal Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", padding: "16px 24px", borderTop: "1px solid var(--color-bg-hover)", flexShrink: 0, background: "var(--color-bg-surface)" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowContractModal(false)}>Cancel</button>
                  {(!isContractEdit || ["super_user", "coo", "admin", "sales"].includes(currentUserRole)) && (
                    <button type="submit" className="btn btn-primary" disabled={submittingContract}>
                      {submittingContract ? (isContractEdit ? "Saving..." : "Creating...") : (isContractEdit ? "Save Changes" : "Create Contract")}
                    </button>
                  )}
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Invoice Add/Edit Modal */}
        {showInvoiceModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "720px", margin: "var(--space-4)", maxHeight: "90vh", overflow: "hidden" }}>
              {/* Sticky Header */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-bg-hover)", flexShrink: 0, background: "var(--color-bg-surface)" }}>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", margin: 0 }}>
                  {isInvoiceEdit ? `Edit Invoice - ${selectedInvoice?.invoiceNumber || "Draft"}` : "Create Client Invoice"}
                </h3>
              </div>

              {/* Scrollable Body */}
              <form 
                onSubmit={e => handleSaveInvoice(e, invoiceForm.isDraft)} 
                style={{ display: "flex", flexDirection: "column", overflow: "hidden", margin: 0 }}
              >
                <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                  {invoiceError && (
                    <div style={{ padding: "12px", marginBottom: "16px", backgroundColor: "#fee2e2", color: "var(--color-error)", borderRadius: "6px", fontSize: "var(--text-sm)" }}>
                      {invoiceError}
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Issue Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={invoiceForm.issueDate} 
                        onChange={e => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Due Date</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={invoiceForm.dueDate} 
                        onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Currency</label>
                      <select 
                        className="form-input" 
                        value={invoiceForm.currency} 
                        onChange={e => setInvoiceForm({ ...invoiceForm, currency: e.target.value })}
                        disabled={isInvoiceEdit}
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Associated Project (Optional)</label>
                      <select 
                        className="form-input" 
                        value={invoiceForm.projectId} 
                        onChange={e => setInvoiceForm({ ...invoiceForm, projectId: e.target.value })}
                      >
                        <option value="">None</option>
                        {projects.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Associated Contract (Optional)</label>
                      <select 
                        className="form-input" 
                        value={invoiceForm.contractId} 
                        onChange={e => setInvoiceForm({ ...invoiceForm, contractId: e.target.value })}
                      >
                        <option value="">None</option>
                        {contracts.map(c => (
                          <option key={c._id} value={c._id}>{c.title} ({c.contractId})</option>
                        ))}
                      </select>
                    </div>
                    {!isInvoiceEdit && (
                      <div className="form-field">
                        <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Initial Paid Amount</label>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          className="form-input" 
                          value={invoiceForm.paidAmount} 
                          onChange={e => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            const parts = val.split(".");
                            const finalVal = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
                            setInvoiceForm({ ...invoiceForm, paidAmount: finalVal });
                          }} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Line Items Builder */}
                  <div style={{ borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
                      <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", margin: 0 }}>
                        Line Items <span style={{ color: "var(--color-error)" }}>*</span>
                      </h4>
                      <button 
                        type="button" 
                        className="btn btn-ghost" 
                        style={{ padding: "4px 8px", fontSize: "11px" }}
                        onClick={() => {
                          const items = [...invoiceForm.lineItems, { description: "", quantity: 1, rate: 0 }];
                          setInvoiceForm({ ...invoiceForm, lineItems: items });
                        }}
                      >
                        + Add Item
                      </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {invoiceForm.lineItems.map((item, index) => (
                        <div key={index} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1fr 30px", gap: "8px", alignItems: "center" }}>
                          <input 
                            type="text" 
                            placeholder="Item description e.g. Monthly Retainer" 
                            className="form-input" 
                            value={item.description}
                            onChange={e => {
                              const items = [...invoiceForm.lineItems];
                              items[index].description = e.target.value;
                              setInvoiceForm({ ...invoiceForm, lineItems: items });
                            }}
                            required 
                          />
                          <input 
                            type="text" 
                            inputMode="numeric"
                            placeholder="Qty" 
                            className="form-input" 
                            value={item.quantity}
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              const items = [...invoiceForm.lineItems];
                              items[index].quantity = val;
                              setInvoiceForm({ ...invoiceForm, lineItems: items });
                            }}
                            required 
                          />
                          <input 
                            type="text" 
                            inputMode="decimal"
                            placeholder="Rate" 
                            className="form-input" 
                            value={item.rate}
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9.]/g, "");
                              const parts = val.split(".");
                              const finalVal = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
                              const items = [...invoiceForm.lineItems];
                              items[index].rate = finalVal;
                              setInvoiceForm({ ...invoiceForm, lineItems: items });
                            }}
                            required 
                          />
                          <div style={{ textAlign: "right", fontSize: "var(--text-sm)", fontWeight: "var(--font-semibold)", paddingRight: "4px" }}>
                            {formatCurrency((item.quantity || 1) * (item.rate || 0), invoiceForm.currency)}
                          </div>
                          <div>
                            {invoiceForm.lineItems.length > 1 && (
                              <button 
                                type="button" 
                                className="btn btn-ghost" 
                                style={{ color: "var(--color-error)", padding: "4px" }}
                                onClick={() => {
                                  const items = invoiceForm.lineItems.filter((_, idx) => idx !== index);
                                  setInvoiceForm({ ...invoiceForm, lineItems: items });
                                }}
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-4)", borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Tax Type</label>
                      <select 
                        className="form-input" 
                        value={invoiceForm.taxType} 
                        onChange={e => setInvoiceForm({ ...invoiceForm, taxType: e.target.value })}
                      >
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Tax Value</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        className="form-input" 
                        value={invoiceForm.taxValue} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          const parts = val.split(".");
                          const finalVal = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
                          setInvoiceForm({ ...invoiceForm, taxValue: finalVal });
                        }} 
                      />
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Discount Type</label>
                      <select 
                        className="form-input" 
                        value={invoiceForm.discountType} 
                        onChange={e => setInvoiceForm({ ...invoiceForm, discountType: e.target.value })}
                      >
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Fixed">Fixed Amount</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Discount Value</label>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        className="form-input" 
                        value={invoiceForm.discountValue} 
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          const parts = val.split(".");
                          const finalVal = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
                          setInvoiceForm({ ...invoiceForm, discountValue: finalVal });
                        }} 
                      />
                    </div>
                  </div>

                  {/* Summary Preview */}
                  <div style={{ textAlign: "right", fontSize: "var(--text-base)", fontWeight: "var(--font-bold)", marginBottom: "var(--space-4)", borderTop: "1px solid var(--color-bg-hover)", paddingTop: "var(--space-3)" }}>
                    {(() => {
                      const subtotal = invoiceForm.lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
                      let taxAmount = 0;
                      const tVal = Number(invoiceForm.taxValue) || 0;
                      if (invoiceForm.taxType === "Percentage") {
                        taxAmount = (subtotal * tVal) / 100;
                      } else {
                        taxAmount = tVal;
                      }
                      let discountAmount = 0;
                      const dVal = Number(invoiceForm.discountValue) || 0;
                      if (invoiceForm.discountType === "Percentage") {
                        discountAmount = (subtotal * dVal) / 100;
                      } else {
                        discountAmount = dVal;
                      }
                      const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);
                      const balance = Math.max(0, grandTotal - (Number(invoiceForm.paidAmount) || 0));

                      return (
                        <>
                          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                            Subtotal: {formatCurrency(subtotal, invoiceForm.currency)}
                          </div>
                          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                            Tax Amount: {formatCurrency(taxAmount, invoiceForm.currency)}
                          </div>
                          <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                            Discount Amount: {formatCurrency(discountAmount, invoiceForm.currency)}
                          </div>
                          <div style={{ fontSize: "var(--text-base)", color: "var(--color-text-primary)", marginTop: "4px" }}>
                            Grand Total: {formatCurrency(grandTotal, invoiceForm.currency)}
                          </div>
                          <div style={{ fontSize: "var(--text-base)", color: "var(--color-info)", marginTop: "4px" }}>
                            Remaining Balance: {formatCurrency(balance, invoiceForm.currency)}
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="form-field" style={{ marginBottom: "var(--space-3)" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Notes (Internal or Customer Remarks)</label>
                    <textarea 
                      className="form-input" 
                      rows={2} 
                      value={invoiceForm.notes} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} 
                    />
                  </div>

                  <div className="form-field" style={{ marginBottom: "var(--space-2)" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Terms & Conditions</label>
                    <textarea 
                      className="form-input" 
                      rows={2} 
                      value={invoiceForm.terms} 
                      onChange={e => setInvoiceForm({ ...invoiceForm, terms: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Sticky Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", padding: "16px 24px", borderTop: "1px solid var(--color-bg-hover)", flexShrink: 0, background: "var(--color-bg-surface)" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                  
                  {!isInvoiceEdit && (
                    <button 
                      type="button" 
                      className="btn btn-ghost" 
                      style={{ color: "var(--color-info)" }}
                      disabled={submittingInvoice}
                      onClick={() => handleSaveInvoice(null, true)}
                    >
                      {submittingInvoice ? "Processing..." : "Save Draft"}
                    </button>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={submittingInvoice}
                  >
                    {submittingInvoice ? "Saving..." : (isInvoiceEdit ? "Update Invoice" : "Create & Send")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Record Payment Modal */}
        {showPaymentModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ padding: "var(--space-6)", width: "100%", maxWidth: "440px", margin: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-4)" }}>Record Invoice Payment</h3>
              
              <form onSubmit={handleRecordPayment}>
                {paymentError && (
                  <div style={{ padding: "10px", marginBottom: "12px", backgroundColor: "#fee2e2", color: "var(--color-error)", borderRadius: "6px", fontSize: "var(--text-sm)" }}>
                    {paymentError}
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Invoice No:</span>
                  <strong style={{ fontSize: "var(--text-sm)" }}>{selectedInvoice?.invoiceNumber}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Remaining Balance:</span>
                  <strong style={{ fontSize: "var(--text-sm)" }}>{formatCurrency(selectedInvoice?.balanceAmount, selectedInvoice?.currency)}</strong>
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Payment Amount ({selectedInvoice?.currency}) <span style={{ color: "var(--color-error)" }}>*</span></label>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    className="form-input" 
                    value={paymentForm.amount} 
                    onChange={e => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      const parts = val.split(".");
                      const finalVal = parts[0] + (parts.length > 1 ? "." + parts.slice(1).join("") : "");
                      setPaymentForm({ ...paymentForm, amount: finalVal });
                    }} 
                    required 
                  />
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Payment Date <span style={{ color: "var(--color-error)" }}>*</span></label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={paymentForm.paymentDate} 
                    onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} 
                    required 
                  />
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Payment Method</label>
                  <select 
                    className="form-input" 
                    value={paymentForm.paymentMethod} 
                    onChange={e => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Reference Number / Txn ID</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. TXN982741"
                    value={paymentForm.referenceNumber} 
                    onChange={e => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} 
                  />
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-5)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Notes</label>
                  <textarea 
                    className="form-input" 
                    rows={2}
                    value={paymentForm.notes} 
                    onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} 
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingPayment}>
                    {submittingPayment ? "Recording..." : "Record Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Invoice Preview Modal */}
        {showViewInvoiceModal && selectedInvoice && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "800px", margin: "var(--space-4)", maxHeight: "90vh", overflow: "hidden" }}>
              
              {/* Header */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-bg-hover)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0, background: "var(--color-bg-surface)" }}>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", margin: 0 }}>
                  Invoice Details - {selectedInvoice.invoiceNumber || "Draft"}
                </h3>
                <button type="button" className="btn btn-ghost" style={{ padding: "6px" }} onClick={() => setShowViewInvoiceModal(false)}>
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Preview Body */}
              <div style={{ padding: "24px", overflowY: "auto", flex: 1, backgroundColor: "var(--color-bg-primary)" }}>
                <div style={{ backgroundColor: "var(--color-bg-surface)", padding: "32px", borderRadius: "8px", border: "1px solid var(--color-bg-hover)", color: "var(--color-text-primary)" }}>
                  
                  {/* Brand Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--color-info)", paddingBottom: "16px", marginBottom: "20px" }}>
                    <div>
                      <strong style={{ fontSize: "20px", color: "var(--color-info)" }}>NETCRADUS CRM</strong>
                      <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Enterprise Billing & Invoicing</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span className={`badge ${selectedInvoice.paymentStatus === "Paid" ? "badge-success" : selectedInvoice.paymentStatus === "Overdue" || selectedInvoice.paymentStatus === "Cancelled" ? "badge-danger" : "badge-info"}`}>
                        {selectedInvoice.paymentStatus || selectedInvoice.status}
                      </span>
                    </div>
                  </div>

                  {/* Metadata info */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px", fontSize: "var(--text-sm)" }}>
                    <div>
                      <strong style={{ color: "var(--color-text-muted)" }}>BILLED TO:</strong>
                      <div style={{ fontWeight: "bold", marginTop: "4px" }}>{client.clientName}</div>
                      <div>{client.primaryEmail}</div>
                      <div>{client.primaryPhone}</div>
                      <div style={{ whiteSpace: "pre-wrap", color: "var(--color-text-secondary)", marginTop: "4px" }}>{client.billingAddress}</div>
                    </div>
                    <div>
                      <strong style={{ color: "var(--color-text-muted)" }}>INVOICE DETAILS:</strong>
                      <div style={{ marginTop: "4px" }}>
                        Invoice No: <strong>{selectedInvoice.invoiceNumber || "Draft"}</strong>
                      </div>
                      <div>
                        Issue Date: {selectedInvoice.issueDate ? new Date(selectedInvoice.issueDate).toLocaleDateString("en-IN") : "—"}
                      </div>
                      <div>
                        Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString("en-IN")}
                      </div>
                      <div>
                        Project: {projects.find(p => p._id === selectedInvoice.projectId)?.name || "—"}
                      </div>
                      <div>
                        Contract: {contracts.find(c => c._id === selectedInvoice.contractId)?.title || "—"}
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <table className="nc-table" style={{ width: "100%", marginBottom: "20px" }}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style={{ textAlign: "center" }}>Quantity</th>
                        <th style={{ textAlign: "right" }}>Rate</th>
                        <th style={{ textAlign: "right" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedInvoice.lineItems || []).map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.description}</td>
                          <td style={{ textAlign: "center" }}>{item.quantity}</td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(item.rate, selectedInvoice.currency)}</td>
                          <td style={{ textAlign: "right" }}>{formatCurrency(item.amount, selectedInvoice.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals Grid */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                    <div style={{ width: "280px", fontSize: "var(--text-sm)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedInvoice.subtotal, selectedInvoice.currency)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "var(--color-text-secondary)" }}>
                        <span>Tax ({selectedInvoice.taxType === "Percentage" ? `${selectedInvoice.taxValue}%` : "Fixed"}):</span>
                        <span>{formatCurrency(selectedInvoice.taxAmount, selectedInvoice.currency)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "var(--color-text-secondary)" }}>
                        <span>Discount ({selectedInvoice.discountType === "Percentage" ? `${selectedInvoice.discountValue}%` : "Fixed"}):</span>
                        <span>{formatCurrency(selectedInvoice.discountAmount, selectedInvoice.currency)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: "bold", borderTop: "1px solid var(--color-bg-hover)", marginTop: "4px" }}>
                        <span>Grand Total:</span>
                        <span>{formatCurrency(selectedInvoice.total, selectedInvoice.currency)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "var(--color-success)" }}>
                        <span>Paid:</span>
                        <span>{formatCurrency(selectedInvoice.paidAmount, selectedInvoice.currency)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontWeight: "bold", color: "var(--color-error)", borderTop: "1px solid var(--color-bg-hover)", marginTop: "4px" }}>
                        <span>Balance Due:</span>
                        <span>{formatCurrency(selectedInvoice.balanceAmount, selectedInvoice.currency)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment History Tracker */}
                  {selectedInvoice.paymentHistory && selectedInvoice.paymentHistory.length > 0 && (
                    <div style={{ marginTop: "24px", borderTop: "1px solid var(--color-bg-hover)", paddingTop: "16px" }}>
                      <strong style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>PAYMENT TRANSACTION HISTORY:</strong>
                      <table className="nc-table" style={{ width: "100%", marginTop: "8px" }}>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Method</th>
                            <th>Reference No.</th>
                            <th>Notes</th>
                            <th style={{ textAlign: "right" }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoice.paymentHistory.map((h, idx) => (
                            <tr key={idx}>
                              <td>{new Date(h.paymentDate).toLocaleDateString("en-IN")}</td>
                              <td>{h.paymentMethod}</td>
                              <td>{h.referenceNumber || "—"}</td>
                              <td><span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{h.notes || "—"}</span></td>
                              <td style={{ textAlign: "right", fontWeight: "var(--font-semibold)" }}>{formatCurrency(h.amount, selectedInvoice.currency)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Notes / Terms */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px", borderTop: "1px solid var(--color-bg-hover)", paddingTop: "16px", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    <div>
                      <strong>Notes:</strong>
                      <p style={{ marginTop: "4px", margin: 0 }}>{selectedInvoice.notes || "No notes."}</p>
                    </div>
                    <div>
                      <strong>Terms & Conditions:</strong>
                      <p style={{ marginTop: "4px", margin: 0 }}>{selectedInvoice.terms || "Standard business payment terms apply."}</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-bg-hover)", display: "flex", justifyContent: "flex-end", flexShrink: 0, background: "var(--color-bg-surface)" }}>
                <a 
                  href={apiUrl(`/api/clients/${id}/invoices/${selectedInvoice._id}/pdf?token=${localStorage.getItem("token")}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ marginRight: "auto" }}
                >
                  <Download size={14} style={{ marginRight: "6px" }} /> Download PDF
                </a>
                <button type="button" className="btn btn-ghost" onClick={() => setShowViewInvoiceModal(false)}>Close</button>
              </div>

            </div>
          </div>
        )}

        {/* Documents Upload/Metadata Modal */}
        {showDocModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ padding: "var(--space-6)", width: "100%", maxWidth: "500px", margin: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-4)" }}>
                {isDocEdit ? "Edit Document Metadata" : "Upload Client Document"}
              </h3>

              <form onSubmit={isDocEdit ? handleSaveDocMetadata : handleUploadDoc}>
                {!isDocEdit && (
                  <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Select File</label>
                    <input 
                      type="file" 
                      className="form-input" 
                      onChange={e => setSelectedFile(e.target.files[0])} 
                      required 
                    />
                  </div>
                )}

                {isDocEdit && (
                  <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Document Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={docForm.title} 
                      onChange={e => setDocForm({ ...docForm, title: e.target.value })} 
                      required 
                    />
                  </div>
                )}

                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Document Category / Type</label>
                  <select 
                    className="form-input" 
                    value={docForm.documentType} 
                    onChange={e => setDocForm({ ...docForm, documentType: e.target.value })}
                  >
                    <option value="Contract">Contract</option>
                    <option value="NDA">NDA</option>
                    <option value="SLA">SLA</option>
                    <option value="SOW">SOW</option>
                    <option value="GST Certificate">GST Certificate</option>
                    <option value="PAN">PAN</option>
                    <option value="Registration Certificate">Registration Certificate</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Payment Proof">Payment Proof</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-6)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Notes / Remarks</label>
                  <textarea 
                    className="form-input" 
                    rows={3} 
                    value={docForm.notes} 
                    onChange={e => setDocForm({ ...docForm, notes: e.target.value })} 
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowDocModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    {isDocEdit ? "Save Details" : "Upload File"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add/Edit Contact Modal */}
        {showContactModal && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: "600px", margin: "var(--space-4)", maxHeight: "90vh", overflow: "hidden" }}>
              {/* Sticky Header */}
              <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-bg-hover)", flexShrink: 0, background: "var(--color-bg-surface)" }}>
                <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", margin: 0 }}>
                  {isContactEdit ? "Edit Stakeholder Contact" : "Add New Client Contact"}
                </h3>
              </div>

              {/* Scrollable Body */}
              <form onSubmit={handleSaveContact} style={{ display: "flex", flexDirection: "column", overflow: "hidden", margin: 0 }}>
                <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
                  {contactError && (
                    <div style={{ padding: "12px", marginBottom: "16px", backgroundColor: "#fee2e2", color: "var(--color-error)", borderRadius: "6px", fontSize: "var(--text-sm)" }}>
                      {contactError}
                    </div>
                  )}

                  <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Full Name <span style={{ color: "var(--color-error)" }}>*</span></label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={contactForm.name} 
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })} 
                      required 
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Designation</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. CTO, Operations lead"
                        value={contactForm.designation} 
                        onChange={e => setContactForm({ ...contactForm, designation: e.target.value })} 
                      />
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Department</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="e.g. IT, Procurement"
                        value={contactForm.department} 
                        onChange={e => setContactForm({ ...contactForm, department: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Email Address <span style={{ color: "var(--color-error)" }}>*</span></label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={contactForm.email} 
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })} 
                      required 
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Phone Number <span style={{ color: "var(--color-error)" }}>*</span></label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={contactForm.phone} 
                        onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Alternate Phone</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={contactForm.alternatePhone} 
                        onChange={e => setContactForm({ ...contactForm, alternatePhone: e.target.value })} 
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Preferred Contact Method</label>
                      <select 
                        className="form-input" 
                        value={contactForm.preferredContactMethod} 
                        onChange={e => setContactForm({ ...contactForm, preferredContactMethod: e.target.value })}
                      >
                        <option value="Email">Email</option>
                        <option value="Phone">Phone</option>
                        <option value="WhatsApp">WhatsApp</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Contact Type</label>
                      <select 
                        className="form-input" 
                        value={contactForm.contactType} 
                        onChange={e => setContactForm({ ...contactForm, contactType: e.target.value })}
                      >
                        <option value="Primary">Primary</option>
                        <option value="Billing">Billing</option>
                        <option value="Technical">Technical</option>
                        <option value="Support">Support</option>
                        <option value="Decision Maker">Decision Maker</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                    <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "var(--text-sm)", cursor: "pointer" }}>
                      <input 
                        type="checkbox" 
                        checked={contactForm.isPrimary} 
                        onChange={e => setContactForm({ ...contactForm, isPrimary: e.target.checked })} 
                      />
                      Set as Client Primary Contact
                    </label>
                  </div>

                  <div className="form-field">
                    <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Notes</label>
                    <textarea 
                      className="form-input" 
                      rows={3} 
                      placeholder="Stakeholder background, operational logs..."
                      value={contactForm.notes} 
                      onChange={e => setContactForm({ ...contactForm, notes: e.target.value })} 
                    />
                  </div>
                </div>

                {/* Sticky Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", padding: "16px 24px", borderTop: "1px solid var(--color-bg-hover)", flexShrink: 0, background: "var(--color-bg-surface)" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowContactModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingContact}>
                    {submittingContact ? "Saving..." : (isContactEdit ? "Save Details" : "Add Contact")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enable Contact Support Modal */}
        {showContactSupportModal && selectedContactSupport && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
            <div className="nc-card" style={{ padding: "var(--space-6)", width: "100%", maxWidth: "440px", margin: "var(--space-4)" }}>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: "var(--font-bold)", marginTop: 0, marginBottom: "var(--space-2)" }}>Enable Support Portal Access</h3>
              <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
                This will create a customer-facing support account for <strong>{selectedContactSupport.name}</strong> ({selectedContactSupport.email}).
              </p>

              <form onSubmit={handleEnableContactSupport}>
                {contactSupportError && (
                  <div style={{ padding: "10px", marginBottom: "12px", backgroundColor: "#fee2e2", color: "var(--color-error)", borderRadius: "6px", fontSize: "var(--text-sm)" }}>
                    {contactSupportError}
                  </div>
                )}

                <div className="form-field" style={{ marginBottom: "var(--space-4)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Temporary Password <span style={{ color: "var(--color-error)" }}>*</span></label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={contactTempPassword} 
                    onChange={e => setContactTempPassword(e.target.value)} 
                    required 
                    minLength={8}
                  />
                </div>

                <div className="form-field" style={{ marginBottom: "var(--space-6)" }}>
                  <label style={{ display: "block", marginBottom: "4px", fontSize: "var(--text-sm)" }}>Confirm Password <span style={{ color: "var(--color-error)" }}>*</span></label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={contactConfirmPassword} 
                    onChange={e => setContactConfirmPassword(e.target.value)} 
                    required 
                    minLength={8}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowContactSupportModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submittingContactSupport}>
                    {submittingContactSupport ? "Creating Account..." : "Enable Access"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
