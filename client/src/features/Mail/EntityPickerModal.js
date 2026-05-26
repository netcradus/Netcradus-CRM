import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { apiUrl } from "../../config/api";

const TAB_CONFIG = {
  lead: { label: "Leads", endpoint: "/api/leads" },
  contact: { label: "Contacts", endpoint: "/api/contacts" },
  deal: { label: "Deals", endpoint: "/api/deals" },
  account: { label: "Accounts", endpoint: "/api/accounts" },
};

function getEntityLabel(entityType, item) {
  if (entityType === "lead") return item.name || item.email || item.company;
  if (entityType === "contact") return item.name || item.email;
  if (entityType === "deal") return item.name;
  if (entityType === "account") return item.accountName;
  return item.name || item.email || item._id;
}

function EntityPickerModal({ currentLink, onClose, onLink, onUnlink }) {
  const token = localStorage.getItem("token");
  const [activeTab, setActiveTab] = useState("lead");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const loadItems = async () => {
      const { data } = await axios.get(apiUrl(TAB_CONFIG[activeTab].endpoint), {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      if (Array.isArray(data)) {
        setItems(data);
        return;
      }
      setItems(data.leads || data.contacts || data.deals || data.accounts || []);
    };

    loadItems().catch(() => setItems([]));
  }, [activeTab, token]);

  const filteredItems = useMemo(() => {
    const needle = search.toLowerCase();
    if (!needle) return items;
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(needle));
  }, [items, search]);

  return (
    <div className="mail-modal">
      <div className="mail-modal__backdrop" onClick={onClose} />
      <div className="mail-modal__panel mail-modal__panel--entity">
        <div className="mail-modal__header">
          <h2>Link to CRM Entity</h2>
          <button type="button" className="mail-button mail-button--ghost" onClick={onClose}>
            Close
          </button>
        </div>

        {currentLink?.entityType ? (
          <div className="mail-linked-entity mail-linked-entity--compact">
            Currently linked to {currentLink.entityType} {currentLink.entityId}
            <button type="button" className="mail-button mail-button--ghost" onClick={onUnlink}>
              Unlink
            </button>
          </div>
        ) : null}

        <div className="mail-tabs">
          {Object.entries(TAB_CONFIG).map(([key, config]) => (
            <button
              key={key}
              type="button"
              className={`mail-tab ${activeTab === key ? "is-active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {config.label}
            </button>
          ))}
        </div>

        <div style={{ padding: "0 20px 20px" }}>
          <input
            className="mail-input"
            placeholder={`Search ${TAB_CONFIG[activeTab].label.toLowerCase()}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="mail-entity-list" style={{ padding: "0 20px 20px" }}>
          {filteredItems.map((item) => (
            <button
              key={item._id}
              type="button"
              className="mail-entity-item"
              onClick={() => onLink(activeTab, item._id)}
            >
              <span>{getEntityLabel(activeTab, item)}</span>
              <span className="mail-muted">{item.email || item.company || item.accountName || item.status || item.value || item._id}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EntityPickerModal;
