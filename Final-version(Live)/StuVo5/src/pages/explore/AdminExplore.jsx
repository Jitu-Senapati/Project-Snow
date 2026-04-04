import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import "boxicons/css/boxicons.min.css";
import "../../styles/AdminExplore.css";
import { subscribeToEvents, subscribeToNotices, saveEvents, saveNotices, toggleBookmark } from "../../firebase/db";
import { useAuth } from "../../context/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/config";

/* ─── Time helpers ──────────────────────────────────────── */
export function timeAgo(isoString) {
  if (!isoString) return "Just now";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const pad = (n) => String(n).padStart(2, "0");

function buildISO(date, h, m, ap) {
  if (!date) return "";
  const d = new Date(date);
  let hours = h % 12;
  if (ap === "PM") hours += 12;
  d.setHours(hours, m, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDisplay(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ═══════════════════════════════════════════════════════════
   TIME SPINNER
═══════════════════════════════════════════════════════════ */
function TimeSpinner({ value, min, max, step, onChange }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef(null);

  const wrap = (v) => { if (v < min) return max - (min - v - 1); if (v > max) return min + (v - max - 1); return v; };
  const inc = () => onChange(wrap(value + step));
  const dec = () => onChange(wrap(value - step));
  const handleWheel = (e) => { e.preventDefault(); if (e.deltaY < 0) inc(); else dec(); };
  const startEdit = () => { setRaw(pad(value)); setEditing(true); setTimeout(() => inputRef.current?.select(), 0); };
  const commitEdit = () => { const n = parseInt(raw, 10); if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n))); setEditing(false); };
  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); commitEdit(); }
    if (e.key === "Escape") setEditing(false);
    if (e.key === "ArrowUp") { e.preventDefault(); inc(); }
    if (e.key === "ArrowDown") { e.preventDefault(); dec(); }
  };

  return (
    <div className="dtp-spinner" onWheel={handleWheel}>
      <button className="dtp-spin-btn" onClick={inc} tabIndex={-1}><i className="bx bx-chevron-up" /></button>
      {editing ? (
        <input ref={inputRef} className="dtp-spin-input" value={raw} onChange={(e) => setRaw(e.target.value)} onBlur={commitEdit} onKeyDown={handleKey} maxLength={2} />
      ) : (
        <span className="dtp-spin-val" onClick={startEdit} title="Click to type">{pad(value)}</span>
      )}
      <button className="dtp-spin-btn" onClick={dec} tabIndex={-1}><i className="bx bx-chevron-down" /></button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CALENDAR PANEL
═══════════════════════════════════════════════════════════ */
function CalendarPanel({ value, onConfirm, onClose }) {
  const initDate = value ? new Date(value) : null;
  const [viewYear, setViewYear] = useState(() => (initDate || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (initDate || new Date()).getMonth());
  const [selected, setSelected] = useState(initDate);
  const [hour, setHour] = useState(() => initDate ? initDate.getHours() % 12 || 12 : 10);
  const [minute, setMinute] = useState(() => initDate ? initDate.getMinutes() : 0);
  const [ampm, setAmpm] = useState(() => initDate ? (initDate.getHours() >= 12 ? "PM" : "AM") : "AM");
  const [yearEdit, setYearEdit] = useState(false);
  const [yearRaw, setYearRaw] = useState("");
  const yearInputRef = useRef(null);

  const openYearEdit = () => { setYearRaw(String(viewYear)); setYearEdit(true); setTimeout(() => yearInputRef.current?.select(), 0); };
  const commitYear = () => { const y = parseInt(yearRaw, 10); if (!isNaN(y) && y > 1900 && y < 2200) setViewYear(y); setYearEdit(false); };
  const yearKey = (e) => { if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); commitYear(); } if (e.key === "Escape") setYearEdit(false); };
  const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear((y) => y - 1)) : setViewMonth((m) => m - 1);
  const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear((y) => y + 1)) : setViewMonth((m) => m + 1);
  const selectDay = (day) => setSelected(new Date(viewYear, viewMonth, day));
  const toggleAmpm = () => setAmpm((ap) => ap === "AM" ? "PM" : "AM");
  const handleConfirm = () => { if (!selected) return; onConfirm(buildISO(selected, hour, minute, ampm)); };

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date();
  const preview = selected ? formatDisplay(buildISO(selected, hour, minute, ampm)) : null;

  return (
    <div className="dtp-popup-card" onClick={(e) => e.stopPropagation()}>
      <div className="dtp-popup-header">
        <span className="dtp-popup-title"><i className="bx bx-calendar" /> Pick Date &amp; Time</span>
        <button className="dtp-popup-close" onClick={onClose}><i className="bx bx-x" /></button>
      </div>
      <div className="dtp-cal">
        <div className="dtp-nav-row">
          <button className="dtp-nav" onClick={() => setViewYear((y) => y - 1)}><i className="bx bx-chevron-left" /></button>
          {yearEdit ? (
            <input ref={yearInputRef} className="dtp-year-input" value={yearRaw} onChange={(e) => setYearRaw(e.target.value)} onBlur={commitYear} onKeyDown={yearKey} maxLength={4} />
          ) : (
            <button className="dtp-year-btn" onClick={openYearEdit} title="Click to edit year">{viewYear}</button>
          )}
          <button className="dtp-nav" onClick={() => setViewYear((y) => y + 1)}><i className="bx bx-chevron-right" /></button>
        </div>
        <div className="dtp-nav-row dtp-month-row">
          <button className="dtp-nav" onClick={prevMonth}><i className="bx bx-chevron-left" /></button>
          <span className="dtp-month-label">{MONTHS[viewMonth]}</span>
          <button className="dtp-nav" onClick={nextMonth}><i className="bx bx-chevron-right" /></button>
        </div>
        <div className="dtp-day-names">{DAYS_SHORT.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="dtp-grid">
          {Array.from({ length: firstDay }).map((_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(viewYear, viewMonth, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selected && date.toDateString() === selected.toDateString();
            return (
              <button key={day} onClick={() => selectDay(day)} className={["dtp-day", isToday ? "dtp-today" : "", isSelected ? "dtp-selected" : ""].filter(Boolean).join(" ")}>{day}</button>
            );
          })}
        </div>
      </div>
      <div className="dtp-divider" />
      <div className="dtp-time-row">
        <div className="dtp-time-label"><i className="bx bx-time-five" /><span>Time</span></div>
        <div className="dtp-time-controls">
          <TimeSpinner value={hour} min={1} max={12} step={1} onChange={setHour} />
          <span className="dtp-colon">:</span>
          <TimeSpinner value={minute} min={0} max={59} step={5} onChange={setMinute} />
          <button className="dtp-ampm" onClick={toggleAmpm}>{ampm}</button>
        </div>
      </div>
      <div className="dtp-popup-footer">
        {preview && <span className="dtp-preview-text"><i className="bx bx-calendar-check" /> {preview}</span>}
        <div className="dtp-footer-actions">
          <button className="dtp-cancel-btn" onClick={onClose}>Cancel</button>
          <button className="dtp-confirm-btn" onClick={handleConfirm} disabled={!selected}><i className="bx bx-check" /> Confirm</button>
        </div>
      </div>
    </div>
  );
}

function DateTimePicker({ value, onChange, currentLabel }) {
  const [open, setOpen] = useState(false);
  const handleConfirm = (iso) => { onChange(iso); setOpen(false); };
  return (
    <>
      <button className="dtp-trigger" onClick={() => setOpen(true)}>
        <i className="bx bx-calendar dtp-trigger-icon" />
        <span className={value ? "dtp-trigger-val" : "dtp-trigger-placeholder"}>{value ? formatDisplay(value) : "Select date & time…"}</span>
        <i className="bx bx-calendar-edit dtp-trigger-caret" />
      </button>
      {!value && currentLabel && <span className="ef-current-val"><i className="bx bx-time" /> Current: {currentLabel}</span>}
      {open && createPortal(
        <div className="dtp-overlay" onClick={() => setOpen(false)}>
          <CalendarPanel key={value || "empty"} value={value} onConfirm={handleConfirm} onClose={() => setOpen(false)} />
        </div>,
        document.body
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   CONFIRM DIALOG
═══════════════════════════════════════════════════════════ */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <div className="confirm-icon"><i className="bx bx-error-circle" /></div>
        <p className="confirm-msg">{message}</p>
        <div className="confirm-actions">
          <button className="ef-cancel" onClick={onCancel}>Cancel</button>
          <button className="confirm-ok" onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   IMAGE UPLOAD FIELD — uploads to Firebase Storage
═══════════════════════════════════════════════════════════ */
function ImageUploadField({ value, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1200; // max width/height
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
      };
      img.src = url;
    });
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const storageRef = ref(storage, `eventImages/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, compressed);
      const url = await getDownloadURL(storageRef);
      onChange(url);
    } catch (err) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="img-upload-wrap">
      {value && !value.startsWith("data:") && (
        <div className="img-upload-preview"><img src={value} alt="preview" /></div>
      )}
      <button type="button" className="img-upload-btn" onClick={() => fileRef.current.click()} disabled={uploading}>
        <i className="bx bx-image-add" />
        {uploading ? "Uploading…" : value ? "Change Image" : "Upload Image"}
      </button>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   EDIT EVENTS PAGE
═══════════════════════════════════════════════════════════ */
function EditEventsPage({ events, onSave, onBack }) {
  const [draft, setDraft] = useState(events);
  const [updating, setUpdating] = useState(null);
  const [updateForm, setUpdateForm] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", date: "", dateRaw: "", location: "", badge: "", img: "" });
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const confirmDelete = () => { setDraft((p) => p.filter((e) => e.id !== confirmId)); setConfirmId(null); };
  const handleDeleteClick = (id) => { if (draft.length <= 1) { showToast("You must have at least 1 event."); return; } setConfirmId(id); };

  const openUpdate = (ev) => {
    setAddingNew(false);
    setUpdating(ev.id);
    setUpdateForm({ title: ev.title, date: ev.date, dateRaw: "", location: ev.location, badge: ev.badge || "", img: ev.img });
  };
  const saveUpdate = () => {
    setDraft((p) => p.map((e) => e.id === updating ? { ...e, ...updateForm, badge: updateForm.badge || null } : e));
    setUpdating(null);
  };

  const handleAdd = () => {
    if (!newForm.title.trim() || !newForm.dateRaw) { showToast("Title and Date are required."); return; }
    setDraft((p) => [...p, {
      id: Date.now().toString(),
      img: newForm.img || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=600&fit=crop",
      badge: newForm.badge || null,
      badgeType: newForm.badge ? "default" : null,
      date: newForm.date,
      title: newForm.title,
      location: newForm.location.trim() || "NA",
    }]);
    setNewForm({ title: "", date: "", dateRaw: "", location: "", badge: "", img: "" });
    setAddingNew(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(draft, events); onBack(); }
    catch (err) { showToast("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  const sheetOpen = updating !== null || addingNew;

  return createPortal(
    <div className="edit-overlay">
      <div className="edit-page">
        {confirmId !== null && <ConfirmDialog message="Are you sure you want to delete this event? This cannot be undone." onConfirm={confirmDelete} onCancel={() => setConfirmId(null)} />}
        {toast && <div className="edit-toast"><i className="bx bx-error-circle" /> {toast}</div>}

        <div className="edit-page-header">
          <button className="edit-back-btn" onClick={onBack}><i className="bx bx-arrow-back" /></button>
          <span className="edit-page-title">Edit Events</span>
          <button className="edit-save-btn" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>

        <div className="edit-page-content">
          {draft.map((ev) => (
            <div className="edit-event-row" key={ev.id}>
              <div className="edit-event-thumb"><img src={ev.img} alt={ev.title} /></div>
              <div className="edit-event-info">
                <div className="edit-event-title">
                  {ev.serial && <span className="edit-serial">#{ev.serial}</span>} {ev.title}
                </div>
                <div className="edit-event-date">{ev.date}</div>
                <div className="edit-event-loc"><i className="bx bx-map" /> {ev.location}</div>
              </div>
              <div className="edit-event-actions">
                <button className="edit-update-btn" onClick={() => openUpdate(ev)}><i className="bx bx-edit" /> Update</button>
                <button className="edit-delete-btn" onClick={() => handleDeleteClick(ev.id)}><i className="bx bx-trash" /> Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="edit-page-footer">
          <button className="add-new-btn" onClick={() => { setUpdating(null); setNewForm({ title: "", date: "", dateRaw: "", location: "", badge: "", img: "" }); setAddingNew(true); }}>
            <i className="bx bx-plus" /> Add New Event
          </button>
        </div>

        <div className={`form-sheet-backdrop${sheetOpen ? " active" : ""}`} onClick={() => { setUpdating(null); setAddingNew(false); }} />
        <div className={`form-sheet${sheetOpen ? " active" : ""}`}>
          <div className="form-sheet-handle" />
          {updating !== null && !addingNew && (
            <>
              <div className="form-sheet-title"><i className="bx bx-edit-alt" /> Update Event</div>
              {[{ key: "title", label: "Title" }, { key: "location", label: "Location" }, { key: "badge", label: "Badge Text" }].map((f) => (
                <div className="ef-field" key={f.key}>
                  <label className="ef-label">{f.label}</label>
                  <input className="ef-input" value={updateForm[f.key] || ""} onChange={(e) => setUpdateForm((v) => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="ef-field">
                <label className="ef-label">Date &amp; Time</label>
                <DateTimePicker key={`upd-${updating}`} value={updateForm.dateRaw || ""} currentLabel={updateForm.date && !updateForm.dateRaw ? updateForm.date : null}
                  onChange={(raw) => setUpdateForm((v) => ({ ...v, dateRaw: raw, date: formatDisplay(raw) }))} />
              </div>
              <div className="ef-field">
                <label className="ef-label">Image</label>
                <ImageUploadField value={updateForm.img} onChange={(val) => setUpdateForm((v) => ({ ...v, img: val }))} />
              </div>
              <div className="ef-actions">
                <button className="ef-cancel" onClick={() => setUpdating(null)}>Cancel</button>
                <button className="ef-save" onClick={saveUpdate}>Apply</button>
              </div>
            </>
          )}
          {addingNew && (
            <>
              <div className="form-sheet-title"><i className="bx bx-plus-circle" /> New Event</div>
              {[{ key: "title", label: "Title *" }, { key: "location", label: "Location" }, { key: "badge", label: "Badge Text" }].map((f) => (
                <div className="ef-field" key={f.key}>
                  <label className="ef-label">{f.label}</label>
                  <input className="ef-input" value={newForm[f.key] || ""} onChange={(e) => setNewForm((v) => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div className="ef-field">
                <label className="ef-label">Date &amp; Time *</label>
                <DateTimePicker key="new-event" value={newForm.dateRaw || ""} onChange={(raw) => setNewForm((v) => ({ ...v, dateRaw: raw, date: formatDisplay(raw) }))} />
              </div>
              <div className="ef-field">
                <label className="ef-label">Image</label>
                <ImageUploadField value={newForm.img} onChange={(val) => setNewForm((v) => ({ ...v, img: val }))} />
              </div>
              <div className="ef-actions">
                <button className="ef-cancel" onClick={() => setAddingNew(false)}>Cancel</button>
                <button className="ef-save" onClick={handleAdd}>Add Event</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   EDIT NOTICES PAGE
═══════════════════════════════════════════════════════════ */
function EditNoticesPage({ notices, onSave, onBack }) {
  const [draft, setDraft] = useState(notices);
  const [updating, setUpdating] = useState(null);
  const [updateForm, setUpdateForm] = useState({});
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", body: "" });
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const confirmDelete = () => { setDraft((p) => p.filter((n) => n.id !== confirmId)); setConfirmId(null); };
  const handleDeleteClick = (id) => { if (draft.length <= 1) { showToast("You must have at least 1 notice."); return; } setConfirmId(id); };

  const openUpdate = (n) => {
    setAddingNew(false);
    setUpdating(n.id);
    setUpdateForm({ title: n.title, body: n.body });
  };
  const saveUpdate = () => {
    setDraft((p) => p.map((n) => n.id === updating ? {
      ...n,
      ...updateForm,
      updatedAt: new Date().toISOString(), // ← stamp the update time
    } : n));
    setUpdating(null);
  };

  const handleAdd = () => {
    if (!newForm.title.trim()) { showToast("Title is required."); return; }
    setDraft((p) => [...p, {
      id: Date.now().toString(),
      title: newForm.title,
      body: newForm.body,
      createdAt: new Date().toISOString(),
    }]);
    setNewForm({ title: "", body: "" });
    setAddingNew(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(draft, notices); onBack(); }
    catch (err) { showToast("Failed to save. Please try again."); }
    finally { setSaving(false); }
  };

  const sheetOpen = updating !== null || addingNew;

  return createPortal(
    <div className="edit-overlay">
      <div className="edit-page">
        {confirmId !== null && <ConfirmDialog message="Are you sure you want to delete this notice? This cannot be undone." onConfirm={confirmDelete} onCancel={() => setConfirmId(null)} />}
        {toast && <div className="edit-toast"><i className="bx bx-error-circle" /> {toast}</div>}

        <div className="edit-page-header">
          <button className="edit-back-btn" onClick={onBack}><i className="bx bx-arrow-back" /></button>
          <span className="edit-page-title">Edit Notices</span>
          <button className="edit-save-btn" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>

        <div className="edit-page-content">
          {draft.map((n) => (
            <div className="edit-notice-row" key={n.id}>
              <div className="edit-notice-info">
                <div className="edit-notice-title">
                  {n.serial && <span className="edit-serial">#{n.serial}</span>} {n.title}
                </div>
                <div className="edit-notice-body">{n.body}</div>
                <div className="edit-notice-time">{timeAgo(n.createdAt)}</div>
              </div>
              <div className="edit-event-actions">
                <button className="edit-update-btn" onClick={() => openUpdate(n)}><i className="bx bx-edit" /> Update</button>
                <button className="edit-delete-btn" onClick={() => handleDeleteClick(n.id)}><i className="bx bx-trash" /> Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="edit-page-footer">
          <button className="add-new-btn" onClick={() => { setUpdating(null); setNewForm({ title: "", body: "" }); setAddingNew(true); }}>
            <i className="bx bx-plus" /> Add New Notice
          </button>
        </div>

        <div className={`form-sheet-backdrop${sheetOpen ? " active" : ""}`} onClick={() => { setUpdating(null); setAddingNew(false); }} />
        <div className={`form-sheet${sheetOpen ? " active" : ""}`}>
          <div className="form-sheet-handle" />
          {updating !== null && !addingNew && (
            <>
              <div className="form-sheet-title"><i className="bx bx-edit-alt" /> Update Notice</div>
              <div className="ef-field">
                <label className="ef-label">Title</label>
                <input className="ef-input" value={updateForm.title || ""} onChange={(e) => setUpdateForm((v) => ({ ...v, title: e.target.value }))} />
              </div>
              <div className="ef-field">
                <label className="ef-label">Body</label>
                <textarea className="ef-input ef-textarea" rows={3} value={updateForm.body || ""} onChange={(e) => setUpdateForm((v) => ({ ...v, body: e.target.value }))} />
              </div>
              <div className="ef-actions">
                <button className="ef-cancel" onClick={() => setUpdating(null)}>Cancel</button>
                <button className="ef-save" onClick={saveUpdate}>Apply</button>
              </div>
            </>
          )}
          {addingNew && (
            <>
              <div className="form-sheet-title"><i className="bx bx-plus-circle" /> New Notice</div>
              <div className="ef-field">
                <label className="ef-label">Title *</label>
                <input className="ef-input" value={newForm.title || ""} onChange={(e) => setNewForm((v) => ({ ...v, title: e.target.value }))} />
              </div>
              <div className="ef-field">
                <label className="ef-label">Body</label>
                <textarea className="ef-input ef-textarea" rows={3} value={newForm.body || ""} onChange={(e) => setNewForm((v) => ({ ...v, body: e.target.value }))} />
              </div>
              <div className="ef-actions">
                <button className="ef-cancel" onClick={() => setAddingNew(false)}>Cancel</button>
                <button className="ef-save" onClick={handleAdd}>Add Notice</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ═══════════════════════════════════════════════════════════
   CAROUSEL HOOK
═══════════════════════════════════════════════════════════ */
function useCarousel(total) {
  const [current, setCurrent] = useState(Math.floor(total / 2));
  const [tx, setTx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const carouselRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef({ startX: 0, delta: 0, baseTx: 0, t0: 0 });

  const cardW = useCallback(() => { const c = trackRef.current?.querySelector(".event-card"); return c ? c.offsetWidth : 340; }, []);
  const gapPx = useCallback(() => { if (!trackRef.current) return 16; return parseInt(getComputedStyle(trackRef.current).gap) || 16; }, []);
  const calcTx = useCallback((i) => { const vw = carouselRef.current?.clientWidth || window.innerWidth; const cw = cardW(), step = cw + gapPx(); return vw / 2 - (i * step + cw / 2); }, [cardW, gapPx]);
  const goTo = useCallback((idx) => { if (idx < 0 || idx >= total) return; setCurrent(idx); setTx(calcTx(idx)); }, [total, calcTx]);

  useEffect(() => { if (current >= total) setCurrent(Math.max(0, total - 1)); }, [total, current]);
  useEffect(() => { const apply = () => setTx(calcTx(current)); requestAnimationFrame(() => requestAnimationFrame(apply)); window.addEventListener("resize", apply); return () => window.removeEventListener("resize", apply); }, [current, calcTx]);
  useEffect(() => { const h = (e) => { if (e.key === "ArrowLeft") goTo(current - 1); if (e.key === "ArrowRight") goTo(current + 1); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [current, goTo]);

  const onDragStart = useCallback((x) => { dragRef.current = { startX: x, delta: 0, baseTx: calcTx(current), t0: Date.now() }; setDragging(true); }, [calcTx, current]);
  const onDragMove = useCallback((x) => { if (!dragging) return; let d = x - dragRef.current.startX; dragRef.current.delta = d; if ((current === 0 && d > 0) || (current === total - 1 && d < 0)) d *= 0.2; setTx(dragRef.current.baseTx + d); }, [dragging, current, total]);
  const onDragEnd = useCallback(() => {
    if (!dragging) return; setDragging(false);
    const { delta, t0 } = dragRef.current;
    const elapsed = Date.now() - t0 || 1, velocity = Math.abs(delta) / elapsed, threshold = cardW() / 4;
    const isFlick = velocity > 0.35 && Math.abs(delta) > 25;
    if ((delta < -threshold || (isFlick && delta < 0)) && current < total - 1) goTo(current + 1);
    else if ((delta > threshold || (isFlick && delta > 0)) && current > 0) goTo(current - 1);
    else goTo(current);
  }, [dragging, current, total, cardW, goTo]);
  const dragDelta = useCallback(() => dragRef.current.delta, []);

  return { current, tx, dragging, goTo, carouselRef, trackRef, onDragStart, onDragMove, onDragEnd, dragDelta };
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminExplorer() {
  const { currentUser, userProfile } = useAuth();
  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [loadedImgs, setLoadedImgs] = useState({});
  const [pendingBookmark, setPendingBookmark] = useState(null);
  const [page, setPage] = useState(null);

  const userBookmarks = userProfile?.bookmarkedEvents || [];

  useEffect(() => {
    const unsub = subscribeToEvents((data) => { setEvents(data); setLoadingEvents(false); });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = subscribeToNotices((data) => { setNotices(data); setLoadingNotices(false); });
    return unsub;
  }, []);

  const total = events.length;
  const { current, tx, dragging, goTo, carouselRef, trackRef, onDragStart, onDragMove, onDragEnd, dragDelta } = useCarousel(total);

  useEffect(() => {
    const move = (e) => onDragMove(e.clientX);
    const up = () => onDragEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("mouseleave", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); window.removeEventListener("mouseleave", up); };
  }, [onDragMove, onDragEnd]);

  const handleBookmark = async (ev, e) => {
    e.stopPropagation();
    if (!ev.serial || pendingBookmark === ev.serial) return;
    const isBookmarked = userBookmarks.includes(ev.serial);
    setPendingBookmark(ev.serial);
    try {
      await toggleBookmark(currentUser.uid, ev.serial, ev.id, isBookmarked);
    } catch (err) {
      console.error("Bookmark error:", err);
    } finally {
      setPendingBookmark(null);
    }
  };

  const handleImgLoad = (id) => setLoadedImgs((p) => ({ ...p, [id]: true }));

  return (
    <>
      {page === "editEvents" && (
        <EditEventsPage events={events} onSave={saveEvents} onBack={() => setPage(null)} />
      )}
      {page === "editNotices" && (
        <EditNoticesPage notices={notices} onSave={saveNotices} onBack={() => setPage(null)} />
      )}

      {/* SPOTLIGHT */}
      <div className="spotlight-section">
        <div className="section-header admin-section-header">
          <div className="header-line" />
          <h2 className="section-title">Events</h2>
          <div className="admin-header-right">
            <div className="header-line" />
            <button className="edit-corner-btn" onClick={() => setPage("editEvents")}><i className="bx bx-edit" /><span>Edit</span></button>
          </div>
        </div>
        {loadingEvents ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>Loading events…</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>No events yet. Click Edit to add one.</div>
        ) : (
          <>
            <div className="events-carousel" ref={carouselRef}>
              <div ref={trackRef} className={`events-track${dragging ? " is-dragging" : ""}`}
                style={{ transform: `translateX(${tx}px)`, transition: dragging ? "none" : "transform 0.42s cubic-bezier(0.4,0,0.2,1)" }}
                onMouseDown={(e) => { onDragStart(e.clientX); e.preventDefault(); }}
                onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
                onTouchEnd={onDragEnd} onTouchCancel={onDragEnd}
                onClick={(e) => { if (Math.abs(dragDelta()) > 8) { e.stopPropagation(); e.preventDefault(); } }}
              >
                {events.map((ev, i) => (
                  <div key={ev.id} className={`event-card${i === current ? " active" : ""}`}>
                    <div className="event-image">
                      <img src={ev.img} alt={ev.title} className={loadedImgs[ev.id] ? "loaded" : ""} onLoad={() => handleImgLoad(ev.id)} onError={() => handleImgLoad(ev.id)} draggable={false} />
                      <div className="event-overlay" />
                      {ev.badge && <div className={`event-badge${ev.badgeType === "promo" ? " promo" : ""}`}>{ev.badge}</div>}
                    </div>
                    <div className="event-info">
                      <div className="event-date">
                        {ev.date}
                        {ev.dateRaw && new Date(ev.dateRaw).getFullYear() !== new Date().getFullYear() && (
                          <span style={{ opacity: 0.7, marginLeft: 6, fontSize: "0.85em" }}>
                            ({new Date(ev.dateRaw).getFullYear()})
                          </span>
                        )}
                      </div>                      <h3 className="event-title">{ev.title}</h3>
                      {ev.location && ev.location !== "NA" && (
                        <div className="event-location">
                          <i className="bx bx-map" />
                          <span>{ev.location}</span>
                        </div>
                      )}
                      <button
                        className={`bookmark-btn${ev.serial && userBookmarks.includes(ev.serial) ? " saved" : ""}`}
                        onClick={(e) => handleBookmark(ev, e)}
                        disabled={pendingBookmark === ev.serial}
                      >
                        <i className={`bx ${pendingBookmark === ev.serial ? "bx-loader-alt" : ev.serial && userBookmarks.includes(ev.serial) ? "bxs-bookmark" : "bx-bookmark"}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="carousel-controls">
              <button className="carousel-arrow" onClick={() => goTo(current - 1)} disabled={current === 0}><i className="bx bx-chevron-left" /></button>
              <div className="carousel-dots">
                {events.map((_, i) => <span key={i} className={`dot${i === current ? " active" : ""}`} onClick={() => goTo(i)} />)}
              </div>
              <button className="carousel-arrow" onClick={() => goTo(current + 1)} disabled={current === total - 1}><i className="bx bx-chevron-right" /></button>
            </div>
          </>
        )}
      </div>

      {/* NOTICES */}
      <div className="notices-section">
        <div className="section-header admin-section-header admin-notices-header">
          <div className="header-line" />
          <h2 className="section-title">Notices</h2>
          <div className="admin-header-right">
            <div className="header-line" />
            <button className="edit-corner-btn" onClick={() => setPage("editNotices")}><i className="bx bx-edit" /><span>Edit</span></button>
          </div>
        </div>
        {loadingNotices ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>Loading notices…</div>
        ) : notices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>No notices yet. Click Edit to add one.</div>
        ) : (
          <div className="notices-list">
            {notices.map((n) => (
              <div className="notice-item" key={n.id}>
                <div className="notice-content">
                  <h4>{n.title}</h4>
                  <p>{n.body}</p>
                  <span className="notice-time">
                    {n.updatedAt
                      ? `${timeAgo(n.createdAt)} (Updated ${timeAgo(n.updatedAt)})`
                      : timeAgo(n.createdAt)
                    }
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK ACCESS */}
      <h2 className="section-heading">Quick Access</h2>
      <div className="bus-card">
        <h3 style={{ color: "#a78bfa", marginBottom: 10 }}>Admin Panel 👋</h3>
        <p style={{ color: "#aaa" }}>Manage events, notices, and college content from here.</p>
      </div>
    </>
  );
}