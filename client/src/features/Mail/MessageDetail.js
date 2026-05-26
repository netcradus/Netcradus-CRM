import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { Download, Forward, Link2, Reply, Trash2, Unlink2 } from "lucide-react";
import { apiUrl } from "../../config/api";
import EntityPickerModal from "./EntityPickerModal";

function MessageDetail({ loading, message, onDelete, onReply, onForward, onLink, onUnlink, onUpdateNote }) {
  const [note, setNote] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setNote(message?.crmNote || "");
  }, [message?.crmNote]);

  const sanitizedHtml = useMemo(() => {
    const rawHtml = message?.htmlBody || "";
    return DOMPurify.sanitize(rawHtml, {
      FORBID_TAGS: ["script", "iframe"],
      FORBID_ATTR: ["onerror", "onclick", "onload", "style"],
    });
  }, [message?.htmlBody]);

  if (!message && !loading) {
    return <div className="mail-empty mail-empty--detail">Select an email to view its details.</div>;
  }

  if (loading) {
    return <div className="mail-empty mail-empty--detail">Loading email...</div>;
  }

  const authToken = localStorage.getItem("token");

  return (
    <div className="mail-detail">
      <div className="mail-detail__header">
        <div>
          <h2 className="mail-detail__subject">{message.subject || "(No subject)"}</h2>
          <div className="mail-detail__meta">
            <span><strong>From:</strong> {message.fromAddress}</span>
            <span><strong>To:</strong> {(message.toAddresses || []).join(", ") || "-"}</span>
            {message.ccAddresses?.length ? <span><strong>Cc:</strong> {message.ccAddresses.join(", ")}</span> : null}
            <span><strong>Date:</strong> {new Date(message.receivedTime).toLocaleString()}</span>
          </div>
        </div>
        <div className="mail-detail__actions">
          <button type="button" className="mail-button mail-button--ghost" onClick={() => onReply(message)}>
            <Reply size={16} />
            Reply
          </button>
          <button type="button" className="mail-button mail-button--ghost" onClick={() => onForward(message)}>
            <Forward size={16} />
            Forward
          </button>
          <button type="button" className="mail-button mail-button--ghost" onClick={() => onDelete(message.messageId)}>
            <Trash2 size={16} />
            Delete
          </button>
          <button type="button" className="mail-button mail-button--ghost" onClick={() => setPickerOpen(true)}>
            <Link2 size={16} />
            Link to CRM
          </button>
        </div>
      </div>

      <div className="mail-detail__body" dangerouslySetInnerHTML={{ __html: sanitizedHtml || "<p>No email content available.</p>" }} />

      {message.attachments?.length ? (
        <div className="mail-detail__section">
          <h3>Attachments</h3>
          <div className="mail-attachment-list">
            {message.attachments.map((attachment) => (
              <div key={attachment.attachmentId} className="mail-attachment-item">
                <div>
                  <div className="mail-attachment-item__name">{attachment.fileName}</div>
                  <div className="mail-attachment-item__size">{Math.max(attachment.size / 1024, 1).toFixed(1)} KB</div>
                </div>
                <a
                  className="mail-button mail-button--ghost"
                  href={`${apiUrl(`/api/mail/attachments/${message.messageId}/${attachment.attachmentId}`)}?token=${encodeURIComponent(authToken || "")}`}
                >
                  <Download size={16} />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mail-detail__section">
        <div className="mail-detail__section-header">
          <h3>CRM Context</h3>
          {message.linkedEntityType ? (
            <button type="button" className="mail-button mail-button--ghost" onClick={() => onUnlink(message.messageId)}>
              <Unlink2 size={16} />
              Unlink
            </button>
          ) : null}
        </div>
        {message.linkedEntityType ? (
          <div className="mail-linked-entity">
            Linked to {message.linkedEntityType} {message.linkedEntityId}
          </div>
        ) : (
          <div className="mail-muted">This email is not linked to any CRM entity.</div>
        )}
        <label className="mail-label" htmlFor="crm-note">CRM Note</label>
        <textarea
          id="crm-note"
          className="mail-textarea"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          onBlur={() => onUpdateNote(message.messageId, note)}
          placeholder="Add internal CRM context for this thread."
          maxLength={1000}
        />
      </div>

      {pickerOpen ? (
        <EntityPickerModal
          currentLink={{
            entityType: message.linkedEntityType,
            entityId: message.linkedEntityId,
          }}
          onClose={() => setPickerOpen(false)}
          onLink={async (entityType, entityId) => {
            await onLink(message.messageId, entityType, entityId);
            setPickerOpen(false);
          }}
          onUnlink={async () => {
            await onUnlink(message.messageId);
            setPickerOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

export default MessageDetail;
