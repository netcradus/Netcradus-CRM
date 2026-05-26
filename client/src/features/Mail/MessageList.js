import React from "react";
import { Link2, Paperclip, RefreshCw } from "lucide-react";

function formatMessageTime(value) {
  const date = new Date(value);
  const today = new Date();
  const isSameDay = date.toDateString() === today.toDateString();
  return isSameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function MessageList({ folderLabel, loading, messages, selectedMessageId, hasMore, onRefresh, onLoadMore, onSelectMessage }) {
  return (
    <div className="mail-panel mail-panel--list">
      <div className="mail-panel__header mail-panel__header--between">
        <div>
          <div className="mail-list__heading">{folderLabel}</div>
          <div className="mail-list__count">{messages.length} messages</div>
        </div>
        <button type="button" className="mail-button mail-button--ghost" onClick={onRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="mail-message-list">
        {loading && !messages.length ? <div className="mail-empty">Loading messages...</div> : null}
        {!loading && !messages.length ? <div className="mail-empty">No messages found.</div> : null}
        {messages.map((message) => (
          <button
            key={message.messageId}
            type="button"
            className={`mail-message-row ${selectedMessageId === message.messageId ? "is-selected" : ""} ${message.isRead ? "" : "is-unread"}`}
            onClick={() => onSelectMessage(message)}
          >
            <div className="mail-message-row__top">
              <span className="mail-message-row__from">{message.fromAddress || "Unknown sender"}</span>
              <span className="mail-message-row__time">{formatMessageTime(message.receivedTime)}</span>
            </div>
            <div className="mail-message-row__subject">{message.subject || "(No subject)"}</div>
            <div className="mail-message-row__snippet">{message.summary || "No preview available."}</div>
            <div className="mail-message-row__meta">
              {message.hasAttachment ? <Paperclip size={14} /> : null}
              {message.linkedEntityType ? (
                <span className="mail-inline-badge">
                  <Link2 size={12} />
                  {message.linkedEntityType}
                </span>
              ) : null}
            </div>
          </button>
        ))}
      </div>

      {hasMore ? (
        <div className="mail-list__footer">
          <button type="button" className="mail-button mail-button--ghost" onClick={onLoadMore}>
            Load more
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default MessageList;
