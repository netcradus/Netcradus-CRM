import React, { useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";
import { AGREEMENT_SECTIONS, NDA_SECTIONS } from "./agreementContent";

const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");

function OnboardingStep2({ record, onSuccess }) {
  const [form, setForm] = useState({
    agreementEmployeeName: record?.agreementEmployeeName || record?.fullNameAsPerAadhaar || "",
    agreementRole: record?.agreementRole || record?.designation || "",
    agreementEmploymentType: record?.agreementEmploymentType || "Full Time",
    agreementDate: record?.agreementDate ? String(record.agreementDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
    agreementSignature: "",
    accepted: false,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const signatureMatches = useMemo(
    () =>
      normalizeName(form.agreementSignature).toLowerCase() ===
      normalizeName(form.agreementEmployeeName).toLowerCase(),
    [form.agreementEmployeeName, form.agreementSignature]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (normalizeName(form.agreementEmployeeName).length < 3) {
      nextErrors.agreementEmployeeName = "Enter your full name.";
    }

    if (!form.agreementRole.trim()) {
      nextErrors.agreementRole = "Role is required.";
    }

    if (!form.agreementDate) {
      nextErrors.agreementDate = "Date is required.";
    }

    if (!["Internship", "Full Time"].includes(form.agreementEmploymentType)) {
      nextErrors.agreementEmploymentType = "Select a valid employment type.";
    }

    if (!signatureMatches) {
      nextErrors.agreementSignature = "Typed signature must match the full name entered above.";
    }

    if (!form.accepted) {
      nextErrors.accepted = "You must accept the agreement before continuing.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);
      const response = await axios.post(
        apiUrl("/api/onboarding/step2"),
        {
          agreementEmployeeName: form.agreementEmployeeName,
          agreementRole: form.agreementRole,
          agreementEmploymentType: form.agreementEmploymentType,
          agreementDate: form.agreementDate,
          agreementSignature: form.agreementSignature,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      onSuccess?.(response.data);
    } catch (error) {
      setErrors(
        error.response?.data?.errors || {
          form: error.response?.data?.message || "Unable to complete onboarding.",
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="onboarding-form" onSubmit={handleSubmit}>
      <section className="onboarding-panel">
        <h2>Employment Agreement and NDA</h2>
        <div className="onboarding-agreement-preview">
          {AGREEMENT_SECTIONS.map((section) => (
            <div key={section.title} className="onboarding-agreement-section">
              <h3>{section.title}</h3>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}
          {NDA_SECTIONS.map((section) => (
            <div key={section.title} className="onboarding-agreement-section">
              <h3>{section.title}</h3>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="onboarding-panel">
        <h2>Agreement Details</h2>
        <div className="onboarding-grid onboarding-grid--two">
          <div className="form-field">
            <label className="form-label">Full Name*</label>
            <input className="form-input" name="agreementEmployeeName" value={form.agreementEmployeeName} onChange={handleChange} />
            {errors.agreementEmployeeName && <div className="onboarding-error">{errors.agreementEmployeeName}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">Role / Position*</label>
            <input className="form-input" name="agreementRole" value={form.agreementRole} onChange={handleChange} />
            {errors.agreementRole && <div className="onboarding-error">{errors.agreementRole}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">Employment Type*</label>
            <select className="form-input" name="agreementEmploymentType" value={form.agreementEmploymentType} onChange={handleChange}>
              <option value="Internship">Internship</option>
              <option value="Full Time">Full Time</option>
            </select>
            {errors.agreementEmploymentType && <div className="onboarding-error">{errors.agreementEmploymentType}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">Date*</label>
            <input className="form-input" type="date" name="agreementDate" value={form.agreementDate} onChange={handleChange} />
            {errors.agreementDate && <div className="onboarding-error">{errors.agreementDate}</div>}
          </div>
        </div>
      </section>

      <section className="onboarding-panel">
        <h2>Digital Signature</h2>
        <div className="onboarding-declaration">
          By typing your full name below, you are digitally signing this Employment Agreement and NDA. This constitutes a legally binding signature under the Information Technology Act, 2000, India.
        </div>
        <div className="form-field">
          <label className="form-label">Type your full name exactly as entered above</label>
          <input className="form-input" name="agreementSignature" value={form.agreementSignature} onChange={handleChange} />
          <div className="onboarding-helper">Must match the Full Name you entered above</div>
          {errors.agreementSignature && <div className="onboarding-error">{errors.agreementSignature}</div>}
        </div>
        <label className="onboarding-checkbox">
          <input type="checkbox" name="accepted" checked={form.accepted} onChange={handleChange} />
          <span>I have read and understood the entire Employment Agreement and Non-Disclosure Agreement above. I agree to be bound by all terms and conditions.</span>
        </label>
        {errors.accepted && <div className="onboarding-error">{errors.accepted}</div>}
      </section>

      {errors.form && <div className="onboarding-error onboarding-error--block">{errors.form}</div>}

      <div className="onboarding-actions">
        <div className="onboarding-progress-copy">
          {submitting ? "Sending your documents. This may take a moment." : "Review the agreement carefully before signing."}
        </div>
        <button type="submit" className="btn btn-primary onboarding-submit" disabled={submitting || !form.accepted || !signatureMatches}>
          {submitting ? "Submitting..." : "Sign & Complete Onboarding"}
        </button>
      </div>
    </form>
  );
}

export default OnboardingStep2;
