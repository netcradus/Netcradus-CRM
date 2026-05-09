import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { User, Mail, Phone, MapPin, ShieldAlert, Download, ChevronRight, CheckCircle2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyForm = { contactNumber: "", address: "", emergencyContactName: "", emergencyContactNumber: "", personalEmail: "" };

const formatRole = (role = "") =>
  role === "admin" ? "Administrator" : String(role || "").replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());

function MyProfilePage() {
  const token = localStorage.getItem("token");
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(apiUrl("/api/contacts/profiles/me"), { headers: { Authorization: `Bearer ${token}` } });
      setProfile(data);
      setForm({
        contactNumber: data.contactNumber || "",
        address: data.address || "",
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactNumber: data.emergencyContactNumber || "",
        personalEmail: data.personalEmail || "",
      });
    } catch (err) { setError("Unable to load profile"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.put(apiUrl("/api/contacts/profiles/me"), form, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Profile updated successfully");
      setProfile(data.profile);
    } catch (err) { setError("Failed to update profile"); }
    finally { setSaving(false); }
  };

  const onDownloadSalarySlip = async (slipId, filename) => {
    try {
      const response = await axios.get(apiUrl(`/api/contacts/salary-slips/${slipId}/download`), { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `salary-slip.pdf`;
      link.click();
    } catch (err) { alert("Download failed"); }
  };

  if (loading) return <div style={{ padding: 'var(--space-10)', textAlign: 'center' }}>Loading profile...</div>;

  const readiness = [form.contactNumber, form.personalEmail, form.address, form.emergencyContactName, form.emergencyContactNumber].filter(Boolean).length;

  return (
    <div className="dashboard-container" style={{ padding: 'var(--space-6)' }}>
      <div className="page-header">
        <div className="page-header-left">
           <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: '10px', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
              <span>User</span><ChevronRight size={10} /><span>My Profile</span>
           </div>
           <h1 className="title">My Profile</h1>
           <p className="subtitle">Manage your personal information and view payroll history.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-6)' }}>
         <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div className="nc-card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
               <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-bg-elevated)', margin: '0 auto var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-accent)' }}>
                  {profile?.name?.[0]}
               </div>
               <h3 style={{ marginBottom: 'var(--space-1)' }}>{profile?.name}</h3>
               <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>{formatRole(profile?.linkedUser?.role)}</p>
               <div className="badge badge-info">{profile?.department || "General"}</div>
               
               <div style={{ marginTop: 'var(--space-6)', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: '11px' }}>
                     <span color="var(--color-text-muted)">Profile Readiness</span>
                     <span style={{ fontWeight: 'var(--font-bold)' }}>{readiness * 20}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--color-bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                     <div style={{ width: `${readiness * 20}%`, height: '100%', background: 'var(--color-accent)', transition: 'width 0.3s ease' }} />
                  </div>
               </div>
            </div>

            <div className="nc-card" style={{ padding: 'var(--space-6)' }}>
               <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>Salary Slips</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {profile?.salarySlips?.map((slip, i) => (
                    <div key={i} className="nc-card nc-card--interactive" style={{ padding: 'var(--space-3)', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                             <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{slip.month} {slip.year}</span>
                             <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Net: ₹{Number(slip.netPay || 0).toLocaleString()}</span>
                          </div>
                          <button className="btn btn-ghost" style={{ padding: 'var(--space-1)' }} onClick={() => onDownloadSalarySlip(slip._id, slip.filename)}><Download size={14} /></button>
                       </div>
                    </div>
                  ))}
                  {(!profile?.salarySlips || profile.salarySlips.length === 0) && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center' }}>No slips available.</p>}
               </div>
            </div>
         </div>

         <div className="nc-card" style={{ padding: 'var(--space-8)' }}>
            <h3 style={{ marginBottom: 'var(--space-6)' }}>Personal Details</h3>
            <form className="form" onSubmit={onSubmit}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                  <div className="form-field">
                     <label className="form-label">Work Email</label>
                     <input className="form-input" disabled value={profile?.email || ""} />
                  </div>
                  <div className="form-field">
                     <label className="form-label">Personal Email</label>
                     <input className="form-input" type="email" value={form.personalEmail} onChange={e => setForm({...form, personalEmail: e.target.value})} />
                  </div>
                  <div className="form-field">
                     <label className="form-label">Contact Number</label>
                     <input className="form-input" value={form.contactNumber} onChange={e => setForm({...form, contactNumber: e.target.value})} />
                  </div>
                  <div className="form-field" />
                  <div className="form-field">
                     <label className="form-label">Emergency Contact Name</label>
                     <input className="form-input" value={form.emergencyContactName} onChange={e => setForm({...form, emergencyContactName: e.target.value})} />
                  </div>
                  <div className="form-field">
                     <label className="form-label">Emergency Contact Number</label>
                     <input className="form-input" value={form.emergencyContactNumber} onChange={e => setForm({...form, emergencyContactNumber: e.target.value})} />
                  </div>
               </div>
               <div className="form-field" style={{ marginTop: 'var(--space-4)' }}>
                  <label className="form-label">Permanent Address</label>
                  <textarea className="form-input" rows={4} value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
               </div>
               
               <div style={{ marginTop: 'var(--space-8)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-6)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Update Profile"}</button>
               </div>
            </form>
         </div>
      </div>
    </div>
  );
}

export default MyProfilePage;
