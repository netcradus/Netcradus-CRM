import React, { useMemo, useState } from "react";
import { useZohoAdmin } from "../../hooks/useZohoAdmin";
import "./mail.css";

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function ZohoSettingsPanel() {
  const { connectionStatus, loadingStatus, initiateConnect, disconnect, linkedAccounts, linkAccount, unlinkAccount, users } = useZohoAdmin();
  const [form, setForm] = useState({ userId: "", zohoEmail: "" });
  const [feedback, setFeedback] = useState("");

  const unlinkedUsers = useMemo(
    () => users.filter((user) => !user.zohoConnected),
    [users]
  );

  return (
    <div className="mail-page">
      <div className="mail-page__topbar">
        <div>
          <h1 className="mail-page__title">Zoho Mail Settings</h1>
          <p className="mail-page__subtitle">Connect the organization once, then map CRM users to their Zoho mailboxes.</p>
        </div>
        <div className="mail-page__actions">
          <button type="button" className="mail-button mail-button--primary" onClick={initiateConnect}>
            Connect Zoho Organization
          </button>
          <button
            type="button"
            className="mail-button mail-button--ghost"
            onClick={async () => {
              if (window.confirm("Disconnect Zoho Mail for the organization?")) {
                const result = await disconnect();
                setFeedback(result.success ? "Zoho Mail disconnected." : result.message);
              }
            }}
          >
            Disconnect
          </button>
        </div>
      </div>

      {feedback ? <div className="mail-feedback">{feedback}</div> : null}

      <div className="mail-settings-grid">
        <div className="mail-panel">
          <div className="mail-panel__header">Connection Status</div>
          {loadingStatus ? <div className="mail-empty">Loading status...</div> : null}
          {!loadingStatus ? (
            <div className="mail-settings-status">
              <div><strong>Status:</strong> {connectionStatus?.connected ? "Connected" : "Disconnected"}</div>
              <div><strong>Connected By:</strong> {connectionStatus?.connectedBy?.name || "-"}</div>
              <div><strong>Connected At:</strong> {formatDate(connectionStatus?.connectedAt)}</div>
              <div><strong>Last Token Refresh:</strong> {formatDate(connectionStatus?.lastRefreshedAt)}</div>
              <div><strong>Scopes:</strong> {connectionStatus?.scope || "-"}</div>
            </div>
          ) : null}
        </div>

        <div className="mail-panel">
          <div className="mail-panel__header">Link Account</div>
          <form
            className="mail-settings-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const result = await linkAccount(form.userId, form.zohoEmail);
              if (!result.success) {
                setFeedback(result.message);
                return;
              }
              setForm({ userId: "", zohoEmail: "" });
              setFeedback("Mailbox linked successfully.");
            }}
          >
            <label className="mail-label">User</label>
            <select
              className="mail-input"
              value={form.userId}
              onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}
              required
            >
              <option value="">Select user</option>
              {unlinkedUsers.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>

            <label className="mail-label">Zoho Email</label>
            <input
              className="mail-input"
              type="email"
              value={form.zohoEmail}
              onChange={(event) => setForm((current) => ({ ...current, zohoEmail: event.target.value }))}
              required
            />

            <button type="submit" className="mail-button mail-button--primary">
              Link Account
            </button>
          </form>
        </div>
      </div>

      <div className="mail-panel">
        <div className="mail-panel__header">Linked Accounts</div>
        <div className="mail-settings-table">
          <table className="nc-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Zoho Email</th>
                <th>Linked At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {linkedAccounts.map((account) => (
                <tr key={account._id}>
                  <td>{account.userId?.name || "-"}</td>
                  <td>{account.zohoEmail}</td>
                  <td>{formatDate(account.linkedAt)}</td>
                  <td>
                    <button type="button" className="mail-button mail-button--ghost" onClick={() => unlinkAccount(account.userId?._id || account.userId)}>
                      Unlink
                    </button>
                  </td>
                </tr>
              ))}
              {!linkedAccounts.length ? (
                <tr>
                  <td colSpan="4" className="mail-empty">No linked accounts yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ZohoSettingsPanel;
