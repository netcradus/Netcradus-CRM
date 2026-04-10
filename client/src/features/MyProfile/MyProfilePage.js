import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import "./MyProfilePage.css";

const emptyForm = {
  contactNumber: "",
  address: "",
  emergencyContactName: "",
  emergencyContactNumber: "",
  personalEmail: "",
};

const formatRole = (role = "") =>
  role === "admin"
    ? "Administrator"
    : String(role || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

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
      const { data } = await axios.get(apiUrl("/api/contacts/profiles/me"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(data);
      setForm({
        contactNumber: data.contactNumber || "",
        address: data.address || "",
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactNumber: data.emergencyContactNumber || "",
        personalEmail: data.personalEmail || "",
      });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load your profile");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const { data } = await axios.put(apiUrl("/api/contacts/profiles/me"), form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(data.message || "Profile updated");
      setError("");
      setProfile(data.profile);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save your profile");
      setMessage("");
    } finally {
      setSaving(false);
    }
  };

  const onDownloadSalarySlip = async (index, filename) => {
    try {
      const response = await axios.get(
        apiUrl(`/api/contacts/${profile?._id}/salary-slips/${index}/download`),
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || `salary-slip-${index + 1}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to download your salary slip");
    }
  };

  return (
    <div className="my-profile-page">
      <div className="my-profile-shell">
        <div className="my-profile-header">
          <div>
            <p className="my-profile-kicker">Personal Workspace</p>
            <h1>My Profile</h1>
            <p className="my-profile-copy">
              Keep your personal contact details up to date for HR and internal records.
            </p>
          </div>
        </div>

        {error && <div className="my-profile-alert error">{error}</div>}
        {message && <div className="my-profile-alert success">{message}</div>}

        {loading ? (
          <div className="my-profile-card">Loading your profile...</div>
        ) : (
          <div className="my-profile-grid">
            <section className="my-profile-card profile-summary">
              <h2>Account Summary</h2>
              <div className="summary-row">
                <span>Name</span>
                <strong>{profile?.name || "-"}</strong>
              </div>
              <div className="summary-row">
                <span>Work Email</span>
                <strong>{profile?.email || "-"}</strong>
              </div>
              <div className="summary-row">
                <span>Role</span>
                <strong>{formatRole(profile?.linkedUser?.role)}</strong>
              </div>
              <div className="summary-row">
                <span>Department</span>
                <strong>{profile?.department || "General"}</strong>
              </div>
              <div className="summary-progress">
                <div className="summary-progress-head">
                  <span>Profile readiness</span>
                  <strong>
                    {
                      [
                        form.contactNumber,
                        form.personalEmail,
                        form.address,
                        form.emergencyContactName,
                        form.emergencyContactNumber,
                      ].filter(Boolean).length
                    }
                    /5
                  </strong>
                </div>
                <div className="summary-progress-bar">
                  <span
                    style={{
                      width: `${
                        ([
                          form.contactNumber,
                          form.personalEmail,
                          form.address,
                          form.emergencyContactName,
                          form.emergencyContactNumber,
                        ].filter(Boolean).length /
                          5) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </section>

            <form className="my-profile-card my-profile-form" onSubmit={onSubmit}>
              <p className="my-profile-intro">
                Complete your profile so HR can always reach you with the right personal and
                emergency contact details.
              </p>
              <h2>Personal Details</h2>
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
              <label className="full-width">
                Address
                <textarea name="address" value={form.address} onChange={onChange} rows="5" />
              </label>
              <button type="submit" className="my-profile-save" disabled={saving}>
                {saving ? "Saving..." : "Save My Details"}
              </button>
            </form>
          </div>
        )}

        {!loading && (
          <section className="my-profile-card my-salary-slips">
            <div className="my-salary-slips-head">
              <div>
                <h2>My Salary Slips</h2>
                <p className="my-profile-copy">
                  Download the salary slips generated for your account.
                </p>
              </div>
            </div>
            <div className="my-salary-slips-list">
              {profile?.salarySlips?.length ? (
                profile.salarySlips.map((slip, index) => (
                  <div key={`${slip.filename}-${index}`} className="my-salary-slip-item">
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
                      className="my-salary-slip-download"
                      onClick={() => onDownloadSalarySlip(index, slip.filename)}
                    >
                      Download Slip
                    </button>
                  </div>
                ))
              ) : (
                <p className="my-profile-copy">No salary slips are available yet.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default MyProfilePage;
