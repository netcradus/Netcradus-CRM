import React, { useEffect, useRef } from "react";
import { Link2, Paperclip, RefreshCw } from "lucide-react";

function formatMessageTime(value) {
  const date = new Date(value);
  const today = new Date();
  const isSameDay = date.toDateString() === today.toDateString();
  return isSameDay
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function MessageList({
  folderLabel,
  loading,
  loadingMore,
  messages,
  selectedMessageId,
  hasMore,
  onRefresh,
  onLoadMore,
  onSelectMessage,
}) {
  const listRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    if (!hasMore || loading || loadingMore || !loadMoreRef.current || !listRef.current) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: listRef.current,
        rootMargin: "0px 0px 160px 0px",
        threshold: 0.1,
      }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, onLoadMore]);

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

      <div ref={listRef} className="mail-message-list">
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
        {hasMore ? <div ref={loadMoreRef} className="mail-list__sentinel" aria-hidden="true" /> : null}
        {loadingMore ? <div className="mail-list__footer">Loading more messages...</div> : null}
      </div>
    </div>
  );
}

export default MessageList;
