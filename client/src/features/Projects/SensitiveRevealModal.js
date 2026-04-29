import { useState } from "react";
import { X } from "lucide-react";
import { projectApi } from "./projectApi";

export default function SensitiveRevealModal({
  open,
  onClose,
  onVerified,
  title = "Confirm Password",
  submitLabel = "Continue",
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await projectApi.verifyPassword(password);
      if (data.verified) {
        onVerified(password);
        setPassword("");
      }
    } catch (err) {
      const status = err.response?.status;
      setError(status === 429 ? "Too many attempts. Try again after 15 minutes." : "Password verification failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="portfolio-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="portfolio-modal" onSubmit={submit}>
        <div className="portfolio-modal-head">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>
        <label>
          CRM password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
        </label>
        {error && <p className="portfolio-form-error">{error}</p>}
        <div className="portfolio-modal-actions">
          <button type="button" className="portfolio-secondary-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="portfolio-primary-btn" disabled={saving}>{saving ? "Verifying..." : submitLabel}</button>
        </div>
      </form>
    </div>
  );
}
