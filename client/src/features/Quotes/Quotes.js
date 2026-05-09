import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FileText, Plus, Search, ChevronRight, Download, Pencil, Trash2 } from "lucide-react";
import { apiUrl } from "../../config/api";

const emptyQuote = { client: "", amount: "", status: "Sent" };

function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyQuote);
  const [editingId, setEditingId] = useState(null);

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await axios.get(apiUrl("/api/quotes"));
      setQuotes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const filteredQuotes = useMemo(() => {
    const needle = search.toLowerCase();
    return quotes.filter((quote) =>
      `${quote.client} ${quote.status}`.toLowerCase().includes(needle)
    );
  }, [quotes, search]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      amount: Number(form.amount) || 0,
    };

    try {
      if (editingId) {
        await axios.put(apiUrl(`/api/quotes/${editingId}`), payload);
      } else {
        await axios.post(apiUrl("/api/quotes"), payload);
      }
      setForm(emptyQuote);
      setEditingId(null);
      setShowModal(false);
      fetchQuotes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quote?")) return;

    try {
      await axios.delete(apiUrl(`/api/quotes/${id}`));
      fetchQuotes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: "var(--space-6)" }}>
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "10px", color: "var(--color-text-muted)", marginBottom: "var(--space-1)" }}>
            <span>Sales</span><ChevronRight size={10} /><span>Quotes</span>
          </div>
          <h1 className="title">Quotations</h1>
          <p className="subtitle">Create and manage client quotations and proposals.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setForm(emptyQuote); setShowModal(true); }}><Plus size={16} /> New Quote</button>
        </div>
      </div>

      <div className="nc-card" style={{ marginBottom: "var(--space-6)", padding: "var(--space-4)" }}>
        <div style={{ position: "relative", maxWidth: "320px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: "36px" }} placeholder="Search quotes..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </div>

      <div className="nc-card">
        <table className="nc-table">
          <thead>
            <tr><th>Client</th><th>Amount</th><th>Status</th><th>Date Sent</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filteredQuotes.map((quote) => (
              <tr key={quote._id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--color-bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <FileText size={14} color="var(--color-accent)" />
                    </div>
                    <span style={{ fontWeight: "var(--font-semibold)" }}>{quote.client}</span>
                  </div>
                </td>
                <td style={{ fontWeight: "var(--font-bold)" }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(quote.amount) || 0)}</td>
                <td><span className={`badge badge-${quote.status === "Accepted" ? "success" : quote.status === "Rejected" ? "error" : "warning"}`}>{quote.status}</span></td>
                <td style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{quote.dateSent ? new Date(quote.dateSent).toLocaleDateString("en-GB") : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)" }} onClick={() => { setEditingId(quote._id); setForm({ client: quote.client || "", amount: quote.amount || "", status: quote.status || "Sent" }); setShowModal(true); }}><Pencil size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)" }}><Download size={14} /></button>
                    <button className="btn btn-ghost" style={{ padding: "var(--space-1)", color: "var(--color-error)" }} onClick={() => handleDelete(quote._id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredQuotes.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>No quotes found. Start by creating a new one.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="nc-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="nc-modal-content" onClick={(event) => event.stopPropagation()} style={{ width: "400px" }}>
            <div className="nc-modal-header"><h3>{editingId ? "Edit Quotation" : "New Quotation"}</h3></div>
            <form className="form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label">Client Name</label>
                <input className="form-input" required value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Proposed Amount</label>
                <input className="form-input" type="number" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Quote</button>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Quotes;
