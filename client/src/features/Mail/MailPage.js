import React, { useEffect, useMemo, useState } from "react";
import { MailPlus } from "lucide-react";
import { useMail } from "../../hooks/useMail";
import FolderSidebar from "./FolderSidebar";
import MessageList from "./MessageList";
import MessageDetail from "./MessageDetail";
import ComposeWindow from "./ComposeWindow";
import SearchBar from "./SearchBar";
import NotZohoConnected from "./NotZohoConnected";
import "./mail.css";

const DEFAULT_FOLDER_NAME = "Inbox";

function MailPage() {
  const mail = useMail();
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [composeState, setComposeState] = useState({ open: false, mode: "compose", draft: null });

  const activeMessages = mail.searchQuery ? mail.searchResults : mail.messages;
  const selectedFolderId = selectedFolder?.folderId || null;

  const selectedFolderLabel = useMemo(() => {
    if (mail.searchQuery) {
      return `Search: ${mail.searchQuery}`;
    }
    return selectedFolder?.name || DEFAULT_FOLDER_NAME;
  }, [mail.searchQuery, selectedFolder]);

  useEffect(() => {
    if (!mail.folders.length || selectedFolder) return;
    const inboxFolder = mail.folders.find((folder) => String(folder.name || "").toLowerCase().includes("inbox"));
    setSelectedFolder(inboxFolder || mail.folders[0]);
  }, [mail.folders, selectedFolder]);

  useEffect(() => {
    if (selectedFolderId && !mail.searchQuery) {
      mail.fetchMessages(selectedFolderId, { start: 0, limit: 20 });
    }
  }, [mail, mail.searchQuery, selectedFolderId]);

  if (mail.notConnected) {
    return <NotZohoConnected />;
  }

  return (
    <div className="mail-page">
      <div className="mail-page__topbar">
        <div>
          <h1 className="mail-page__title">Mail</h1>
          <p className="mail-page__subtitle">Zoho Mail inbox, search, replies, and CRM linking in one workspace.</p>
        </div>
        <div className="mail-page__actions">
          <SearchBar onSearch={mail.search} onClear={mail.clearSearch} searching={mail.searching} />
          <button type="button" className="mail-button mail-button--primary" onClick={() => setComposeState({ open: true, mode: "compose", draft: null })}>
            <MailPlus size={16} />
            Compose
          </button>
        </div>
      </div>

      {mail.mailNotice ? (
        <div className="mail-toast">
          New email from {mail.mailNotice.fromAddress || "Unknown sender"}
        </div>
      ) : null}

      <div className="mail-layout">
        <FolderSidebar
          folders={mail.folders}
          loading={mail.loadingFolders}
          selectedFolderId={selectedFolderId}
          unreadCount={mail.unreadCount}
          onSelectFolder={(folder) => {
            mail.clearSearch();
            setSelectedFolder(folder);
          }}
        />

        <MessageList
          folderLabel={selectedFolderLabel}
          loading={mail.loadingMessages || mail.searching}
          messages={activeMessages}
          selectedMessageId={mail.selectedMessageId}
          hasMore={!mail.searchQuery && mail.hasMore}
          onRefresh={() => (mail.searchQuery ? mail.search(mail.searchQuery) : mail.fetchMessages(selectedFolderId, { start: 0, limit: 20 }))}
          onLoadMore={() => mail.loadMore(selectedFolderId)}
          onSelectMessage={(message) => mail.fetchMessage(message.messageId, message.folderId)}
        />

        <div className="mail-panel mail-panel--detail">
          <MessageDetail
            loading={mail.loadingMessage}
            message={mail.selectedMessage}
            onDelete={async (messageId) => {
              await mail.deleteEmail(messageId);
            }}
            onReply={(message) => setComposeState({ open: true, mode: "reply", draft: message })}
            onForward={(message) => setComposeState({ open: true, mode: "forward", draft: message })}
            onLink={mail.linkToEntity}
            onUnlink={mail.unlinkFromEntity}
            onUpdateNote={mail.updateNote}
          />
        </div>
      </div>

      {composeState.open ? (
        <ComposeWindow
          draft={composeState.draft}
          mode={composeState.mode}
          onClose={() => setComposeState({ open: false, mode: "compose", draft: null })}
          onSend={mail.sendEmail}
          onReply={mail.replyToEmail}
          sending={mail.sending}
          uploadAttachment={mail.uploadAttachment}
        />
      ) : null}
    </div>
  );
}

export default MailPage;
