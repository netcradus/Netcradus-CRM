import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Paperclip, Send, X } from "lucide-react";
import { apiUrl } from "../../config/api";

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, "");
}

function ComposeWindow({ draft, mode, onClose, onSend, onReply, sending, uploadAttachment }) {
  const token = localStorage.getItem("token");
  const [contacts, setContacts] = useState([]);
  const [showBcc, setShowBcc] = useState(false);
  const [form, setForm] = useState({
    toAddress: "",
    ccAddress: "",
    bccAddress: "",
    subject: "",
    content: "",
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const { data } = await axios.get(apiUrl("/api/contacts"), {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setContacts(Array.isArray(data) ? data : data.contacts || []);
      } catch {
        setContacts([]);
      }
    };

    loadContacts();
  }, [token]);

  useEffect(() => {
    if (!draft) return;

    if (mode === "reply") {
      setForm({
        toAddress: draft.fromAddress || "",
        ccAddress: "",
        bccAddress: "",
        subject: draft.subject?.startsWith("Re:") ? draft.subject : `Re: ${draft.subject || ""}`,
        content: `<p></p><br /><blockquote>${draft.htmlBody || stripHtml(draft.textBody || "")}</blockquote>`,
      });
      return;
    }

    if (mode === "forward") {
      setForm({
        toAddress: "",
        ccAddress: "",
        bccAddress: "",
        subject: draft.subject?.startsWith("Fwd:") ? draft.subject : `Fwd: ${draft.subject || ""}`,
        content: `<p></p><hr /><blockquote>${draft.htmlBody || stripHtml(draft.textBody || "")}</blockquote>`,
      });
    }
  }, [draft, mode]);

  const contactSuggestions = useMemo(() => {
    const searchValue = form.toAddress.toLowerCase();
    if (!searchValue || searchValue.includes("@")) return [];
    return contacts.filter((contact) => {
      const haystack = `${contact.name || ""} ${contact.email || ""}`.toLowerCase();
      return haystack.includes(searchValue);
    }).slice(0, 5);
  }, [contacts, form.toAddress]);

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      const uploadState = {
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        attachmentId: null,
      };
      setAttachments((current) => [...current, uploadState]);

      const result = await uploadAttachment(file, (progressEvent) => {
        const progress = progressEvent.total
          ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
          : 0;
        setAttachments((current) =>
          current.map((item) => (item.fileName === file.name ? { ...item, progress } : item))
        );
      });

      setAttachments((current) =>
        current.map((item) =>
          item.fileName === file.name
            ? { ...item, progress: 100, attachmentId: result.attachmentId }
            : item
        )
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      attachmentIds: attachments.map((attachment) => attachment.attachmentId).filter(Boolean),
    };

    if (mode === "reply" && draft?.messageId) {
      await onReply(draft.messageId, payload);
    } else {
      await onSend(payload);
    }
    onClose();
  };

  return (
    <div className="mail-modal">
      <div className="mail-modal__backdrop" onClick={onClose} />
      <div className="mail-modal__panel">
        <div className="mail-modal__header">
          <h2>{mode === "reply" ? "Reply" : mode === "forward" ? "Forward" : "Compose Email"}</h2>
          <button type="button" className="mail-button mail-button--ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form className="mail-compose" onSubmit={handleSubmit}>
          <label className="mail-label">To</label>
          <input
            className="mail-input"
            list="mail-contact-suggestions"
            value={form.toAddress}
            onChange={(event) => setForm((current) => ({ ...current, toAddress: event.target.value }))}
            required
          />
          <datalist id="mail-contact-suggestions">
            {contactSuggestions.map((contact) => (
              <option key={contact._id || contact.email} value={contact.email}>
                {contact.name}
              </option>
            ))}
          </datalist>

          <label className="mail-label">Cc</label>
          <input
            className="mail-input"
            value={form.ccAddress}
            onChange={(event) => setForm((current) => ({ ...current, ccAddress: event.target.value }))}
          />

          <button type="button" className="mail-button mail-button--ghost mail-button--inline" onClick={() => setShowBcc((current) => !current)}>
            {showBcc ? "Hide Bcc" : "Show Bcc"}
          </button>

          {showBcc ? (
            <>
              <label className="mail-label">Bcc</label>
              <input
                className="mail-input"
                value={form.bccAddress}
                onChange={(event) => setForm((current) => ({ ...current, bccAddress: event.target.value }))}
              />
            </>
          ) : null}

          <label className="mail-label">Subject</label>
          <input
            className="mail-input"
            value={form.subject}
            onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
            required
          />

          <label className="mail-label">Body</label>
          <textarea
            className="mail-textarea mail-textarea--compose"
            value={stripHtml(form.content)}
            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
            required
          />

          <label className="mail-label">Attachments</label>
          <label className="mail-upload">
            <Paperclip size={16} />
            <span>Upload files</span>
            <input type="file" multiple onChange={handleFileChange} />
          </label>

          {attachments.length ? (
            <div className="mail-upload-list">
              {attachments.map((attachment) => (
                <div key={`${attachment.fileName}-${attachment.fileSize}`} className="mail-upload-item">
                  <span>{attachment.fileName}</span>
                  <span>{attachment.progress}%</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mail-compose__footer">
            <button type="button" className="mail-button mail-button--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="mail-button mail-button--primary" disabled={sending}>
              <Send size={16} />
              {sending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ComposeWindow;
