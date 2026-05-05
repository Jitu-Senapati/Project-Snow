import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { subscribeToPlacements, savePlacements } from "../../firebase/db";
import "../../styles/placements.css";

const TABS = [
  { key: "all",      label: "All",      icon: "bx-grid-alt" },
  { key: "upcoming", label: "Upcoming", icon: "bx-calendar" },
  { key: "ongoing",  label: "Ongoing",  icon: "bx-building-house" },
  { key: "finished", label: "Finished", icon: "bx-check-circle" },
];

const STATUS_CONFIG = {
  ongoing:  { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  label: "Ongoing" },
  upcoming: { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  label: "Upcoming" },
  finished: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", label: "Finished" },
};

const EMPTY_FORM = { name: "", role: "", date: "", status: "", link: "" };

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};

export default function Placements() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Admin-only state
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Subscribe to Firestore
  useEffect(() => {
    const unsub = subscribeToPlacements((items) => {
      setData(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  const visible = activeTab === "all" ? data : data.filter((d) => d.status === activeTab);

  // ── Admin handlers ──
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setError("");
    setModal(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      role: item.role,
      date: item.date,
      status: item.status,
      link: item.link || "",
    });
    setEditId(item.id);
    setError("");
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    setError("");
  };

  const handleSave = async () => {
    const errors = [];
    if (!form.name.trim()) errors.push("Company name");
    if (!form.status.trim()) errors.push("Status");
    if (errors.length) { setError(`${errors.join(" & ")} required`); return; }
    setError("");
    setSaving(true);
    try {
      let updated;
      if (editId) {
        updated = data.map((item) =>
          item.id === editId ? { ...item, ...form } : item
        );
      } else {
        updated = [...data, { id: Date.now().toString(), ...form }];
      }
      await savePlacements(updated);
      closeModal();
    } catch (err) {
      console.error("Save placement error:", err);
      setError("Failed to save — check Firestore rules");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const updated = data.filter((item) => item.id !== deleteTarget.id);
    try {
      await savePlacements(updated);
    } catch (err) {
      console.error("Delete placement error:", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="pl-root">
        <div className="pl-header">
          <span className="pl-title">Placements</span>
        </div>
        <div className="pl-empty">
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 32 }} />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-root">
      {/* Header */}
      <div className="pl-header">
        <span className="pl-title">Placements</span>
        {isAdmin && (
          <span className="pl-admin-badge">
            <i className="bx bx-shield-alt-2" />
            Admin
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="pl-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`pl-tab${activeTab === tab.key ? " pl-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`bx ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="pl-list-section">
        <div className="pl-list-header">
          <span className="pl-list-title">
            {TABS.find((t) => t.key === activeTab)?.label} Companies
          </span>
          <span className="pl-count-badge">{visible.length}</span>
        </div>

        {visible.length === 0 ? (
          <div className="pl-empty">
            <i className="bx bx-inbox" />
            <span>No companies here yet</span>
          </div>
        ) : (
          <div className="pl-cards">
            {visible.map((item) => {
              const st = STATUS_CONFIG[item.status];
              return (
                <div key={item.id} className="pl-card">
                  <div className="pl-company-badge">
                    <i className="bx bx-buildings" />
                    <span>{item.name.slice(0, 3).toUpperCase()}</span>
                  </div>

                  <div className="pl-card-info">
                    <div className="pl-card-top">
                      <div className="pl-card-left">
                        <span className="pl-company-name">{item.name}</span>
                        {item.role && (
                          <div className="pl-card-role">
                            <i className="bx bx-briefcase" />
                            {item.role}
                          </div>
                        )}
                        <div className="pl-card-meta">
                          <i className="bx bx-calendar" />
                          {formatDate(item.date)}
                        </div>
                      </div>
                      <div className="pl-card-right">
                        <span className="pl-status" style={{ color: st.color, background: st.bg }}>
                          {st.label}
                        </span>
                        {!isAdmin && item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pl-register-btn"
                          >
                            <i className="bx bx-link-external" />
                            Register
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Admin: Show link text */}
                    {isAdmin && item.link && (
                      <div className="pl-card-link">
                        <i className="bx bx-link" />
                        <span className="pl-link-text">{item.link}</span>
                      </div>
                    )}
                  </div>

                  {/* Admin: Edit/Delete buttons */}
                  {isAdmin && (
                    <div className="pl-card-actions">
                      <button
                        className="pl-action-btn pl-action-btn--edit"
                        onClick={() => openEdit(item)}
                      >
                        <i className="bx bx-edit" />
                      </button>
                      <button
                        className="pl-action-btn pl-action-btn--del"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <i className="bx bx-trash" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Admin: Add button */}
        {isAdmin && (
          <button className="pl-add-btn" onClick={openAdd}>
            <i className="bx bx-plus" />
            Add Company
          </button>
        )}
      </div>

      {/* Admin: Add/Edit modal */}
      {isAdmin && modal && (
        <div className="pl-modal-overlay" onClick={closeModal}>
          <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pl-modal-header">
              <span className="pl-modal-title">
                {editId ? "Edit Company" : "Add Company"}
              </span>
              <button className="pl-modal-close" onClick={closeModal}>
                <i className="bx bx-x" />
              </button>
            </div>
            <div className="pl-modal-body">
              <div className="pl-field">
                <label className="pl-label">Company Name *</label>
                <input
                  className="pl-input"
                  placeholder="e.g. Google"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="pl-field">
                <label className="pl-label">Role</label>
                <input
                  className="pl-input"
                  placeholder="e.g. Software Engineer"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                />
              </div>
              <div className="pl-field">
                <label className="pl-label">Date</label>
                <input
                  className="pl-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="pl-field">
                <label className="pl-label">Status *</label>
                <select
                  className="pl-input pl-select"
                  value={form.status}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="" disabled>Select status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div className="pl-field">
                <label className="pl-label">Registration Link</label>
                <input
                  className="pl-input"
                  placeholder="https://company.com/apply"
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                />
              </div>
            </div>
            {error && (
              <div style={{ padding: "0 18px 4px", color: "#f87171", fontSize: 12, fontWeight: 500 }}>
                {error}
              </div>
            )}
            <div className="pl-modal-footer">
              <button className="pl-btn pl-btn--cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="pl-btn pl-btn--save"
                onClick={handleSave}
                disabled={saving}
              >
                <i className={`bx ${saving ? "bx-loader-alt bx-spin" : "bx-check"}`} />
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="pl-confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="pl-confirm-box" onClick={(e) => e.stopPropagation()}>
            <p className="pl-confirm-title">Remove Company?</p>
            <p className="pl-confirm-msg">
              You want to remove <strong>{deleteTarget.name}</strong> from placements?
            </p>
            <div className="pl-confirm-actions">
              <button className="pl-confirm-btn pl-confirm-btn--cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="pl-confirm-btn pl-confirm-btn--remove" onClick={handleDelete}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}