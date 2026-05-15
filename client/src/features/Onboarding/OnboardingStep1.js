import React, { useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";

const initialForm = {
  fullNameAsPerAadhaar: "",
  employeeId: "",
  department: "",
  designation: "",
  dateOfJoining: "",
  officialEmail: "",
  mobileNumber: "",
  aadhaarNumber: "",
  nameOnAadhaar: "",
  dateOfBirth: "",
  currentAddress: "",
  personalEmail: "",
  selfAttestationSignature: "",
};

const normalizeName = (value = "") => value.trim().replace(/\s+/g, " ");
const formatFileSize = (size = 0) => `${(size / (1024 * 1024)).toFixed(2)} MB`;

function OnboardingStep1({ initialData, onSuccess }) {
  const [form, setForm] = useState({ ...initialForm, ...initialData });
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState({
    aadhaarCopy: null,
    photo: null,
    addressProof: null,
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const declarationName = useMemo(
    () => form.fullNameAsPerAadhaar.trim() || "________________",
    [form.fullNameAsPerAadhaar]
  );

  const validate = () => {
    const nextErrors = {};
    const normalizedFullName = normalizeName(form.fullNameAsPerAadhaar);
    const normalizedSignature = normalizeName(form.selfAttestationSignature);
    const personalEmail = form.personalEmail.trim().toLowerCase();
    const officialEmail = form.officialEmail.trim().toLowerCase();

    if (!normalizedFullName || !/^[A-Za-z ]+$/.test(normalizedFullName)) {
      nextErrors.fullNameAsPerAadhaar = "Enter a valid full name using letters and spaces only.";
    }

    if (!/^[6-9]\d{9}$/.test(form.mobileNumber.trim())) {
      nextErrors.mobileNumber = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!/^\d{12}$/.test(form.aadhaarNumber.trim())) {
      nextErrors.aadhaarNumber = "Aadhaar number must be exactly 12 digits.";
    }

    if (!normalizeName(form.nameOnAadhaar)) {
      nextErrors.nameOnAadhaar = "Name on Aadhaar is required.";
    }

    if (!form.dateOfBirth) {
      nextErrors.dateOfBirth = "Date of birth is required.";
    }

    if (!form.currentAddress.trim()) {
      nextErrors.currentAddress = "Current residential address is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalEmail)) {
      nextErrors.personalEmail = "Enter a valid personal email address.";
    } else if (personalEmail.endsWith("@netcradus.com")) {
      nextErrors.personalEmail = "Use your personal email, not your work email.";
    } else if (officialEmail && officialEmail === personalEmail) {
      nextErrors.personalEmail = "Personal email must be different from your work email.";
    }

    if (!normalizedSignature) {
      nextErrors.selfAttestationSignature = "Typed signature is required.";
    } else if (normalizedSignature.toLowerCase() !== normalizedFullName.toLowerCase()) {
      nextErrors.selfAttestationSignature = "Typed signature must match your full name as per Aadhaar.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleFileChange = (name, file) => {
    setFiles((current) => ({ ...current, [name]: file || null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    Object.entries(files).forEach(([key, file]) => {
      if (file) {
        payload.append(key, file);
      }
    });

    try {
      setSubmitting(true);
      setUploadProgress(0);
      await axios.post(apiUrl("/api/onboarding/step1"), payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          }
        },
      });
      onSuccess?.(form);
    } catch (error) {
      setErrors(
        error.response?.data?.errors || {
          form: error.response?.data?.message || "Unable to save onboarding details.",
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="onboarding-form" onSubmit={handleSubmit}>
      <section className="onboarding-panel">
        <h2>Employee Information</h2>
        <div className="onboarding-grid onboarding-grid--two">
          <div className="form-field">
            <label className="form-label">Full Name (as per Aadhaar)*</label>
            <input className="form-input" name="fullNameAsPerAadhaar" value={form.fullNameAsPerAadhaar} onChange={handleChange} />
            {errors.fullNameAsPerAadhaar && <div className="onboarding-error">{errors.fullNameAsPerAadhaar}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">Employee ID</label>
            <input className="form-input" name="employeeId" value={form.employeeId} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label className="form-label">Department</label>
            <input className="form-input" name="department" value={form.department} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label className="form-label">Designation</label>
            <input className="form-input" name="designation" value={form.designation} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label className="form-label">Date of Joining</label>
            <input className="form-input" type="date" name="dateOfJoining" value={form.dateOfJoining} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label className="form-label">Official Email Address</label>
            <input className="form-input" type="email" name="officialEmail" value={form.officialEmail} onChange={handleChange} />
          </div>
          <div className="form-field">
            <label className="form-label">Mobile Number*</label>
            <input className="form-input" name="mobileNumber" maxLength={10} value={form.mobileNumber} onChange={handleChange} />
            {errors.mobileNumber && <div className="onboarding-error">{errors.mobileNumber}</div>}
          </div>
        </div>
      </section>

      <section className="onboarding-panel">
        <h2>Identity Verification</h2>
        <div className="onboarding-grid onboarding-grid--two">
          <div className="form-field">
            <label className="form-label">Aadhaar Number*</label>
            <input className="form-input" name="aadhaarNumber" maxLength={12} value={form.aadhaarNumber} onChange={handleChange} />
            <div className="onboarding-helper">Enter 12-digit Aadhaar number</div>
            {errors.aadhaarNumber && <div className="onboarding-error">{errors.aadhaarNumber}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">Name on Aadhaar*</label>
            <input className="form-input" name="nameOnAadhaar" value={form.nameOnAadhaar} onChange={handleChange} />
            {errors.nameOnAadhaar && <div className="onboarding-error">{errors.nameOnAadhaar}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">Date of Birth*</label>
            <input className="form-input" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
            {errors.dateOfBirth && <div className="onboarding-error">{errors.dateOfBirth}</div>}
          </div>
        </div>
        <div className="form-field">
          <label className="form-label">Current Residential Address*</label>
          <textarea className="form-input" rows={4} name="currentAddress" value={form.currentAddress} onChange={handleChange} />
          {errors.currentAddress && <div className="onboarding-error">{errors.currentAddress}</div>}
        </div>
      </section>

      <section className="onboarding-panel">
        <h2>Personal Email</h2>
        <div className="form-field">
          <label className="form-label">Personal Email Address*</label>
          <input className="form-input" type="email" name="personalEmail" value={form.personalEmail} onChange={handleChange} />
          <div className="onboarding-helper">We will send a copy of your agreement here. Use your personal email, not your work email.</div>
          {errors.personalEmail && <div className="onboarding-error">{errors.personalEmail}</div>}
        </div>
      </section>

      <section className="onboarding-panel">
        <h2>Document Upload</h2>
        <div className="onboarding-grid onboarding-grid--three">
          <div className="form-field">
            <label className="form-label">Aadhaar Card Copy</label>
            <input className="form-input" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={(event) => handleFileChange("aadhaarCopy", event.target.files?.[0])} />
            {files.aadhaarCopy && <div className="onboarding-file-meta">{files.aadhaarCopy.name} • {formatFileSize(files.aadhaarCopy.size)}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">Passport Size Photograph</label>
            <input className="form-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => handleFileChange("photo", event.target.files?.[0])} />
            {files.photo && <div className="onboarding-file-meta">{files.photo.name} • {formatFileSize(files.photo.size)}</div>}
          </div>
          <div className="form-field">
            <label className="form-label">Address Proof</label>
            <input className="form-input" type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={(event) => handleFileChange("addressProof", event.target.files?.[0])} />
            {files.addressProof && <div className="onboarding-file-meta">{files.addressProof.name} • {formatFileSize(files.addressProof.size)}</div>}
          </div>
        </div>
        <div className="onboarding-helper">Documents are stored securely and shared only with HR.</div>
      </section>

      <section className="onboarding-panel">
        <h2>Self-Attestation Declaration</h2>
        <div className="onboarding-declaration">
          I, {declarationName}, hereby declare that the information provided by me is true and correct to the best of my knowledge and belief. I understand that providing false or misleading information may result in disciplinary action, including termination of employment.
        </div>
        <div className="form-field">
          <label className="form-label">Type your full name to sign this declaration</label>
          <input className="form-input" name="selfAttestationSignature" value={form.selfAttestationSignature} onChange={handleChange} />
          <div className="onboarding-helper">Your typed name constitutes your digital signature under the IT Act, 2000</div>
          {errors.selfAttestationSignature && <div className="onboarding-error">{errors.selfAttestationSignature}</div>}
        </div>
      </section>

      {errors.form && <div className="onboarding-error onboarding-error--block">{errors.form}</div>}

      <div className="onboarding-actions">
        <div className="onboarding-progress-copy">
          {submitting
            ? `Uploading documents and saving your verification details${uploadProgress ? ` (${uploadProgress}%)` : ""}.`
            : "Save your identity details to continue to the agreement."}
        </div>
        <button type="submit" className="btn btn-primary onboarding-submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save & Continue to Agreement"}
        </button>
      </div>
    </form>
  );
}

export default OnboardingStep1;
