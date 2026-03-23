import { useState, useEffect, useRef, useCallback } from "react";
import "boxicons/css/boxicons.min.css";
import "../../styles/adminExplore.css";

/* ─── Initial Data ──────────────────────────────────────── */
const INITIAL_EVENTS = [
  { id: 0, img: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400&h=600&fit=crop", badge: "Featured", badgeType: "default", date: "Fri, 15 Mar, 10:00 AM", title: "Annual Tech Fest 2024 - Innovation Unleashed", location: "Main Auditorium" },
  { id: 1, img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=600&fit=crop", badge: "Register before 10 Mar", badgeType: "promo", date: "Mon, 18 Mar, 9:00 AM", title: "Google Campus Placement Drive", location: "Seminar Hall B" },
  { id: 2, img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=600&fit=crop", badge: null, badgeType: null, date: "Sat, 23 Mar, 6:00 PM", title: "Spring Cultural Fest - Rhythm 2024", location: "Open Air Theatre" },
  { id: 3, img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=600&fit=crop", badge: "Certificate Included", badgeType: "promo", date: "Wed, 27 Mar, 2:00 PM", title: "AI & Machine Learning Workshop", location: "Computer Lab 3" },
  { id: 4, img: "https://images.unsplash.com/photo-1540747913346-19378d7f5d39?w=400&h=600&fit=crop", badge: null, badgeType: null, date: "Fri, 29 Mar, 8:00 AM", title: "Inter-College Cricket Tournament", location: "Sports Ground" },
  { id: 5, img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=600&fit=crop", badge: "24 Hrs", badgeType: "default", date: "Sat, 6 Apr, 10:00 AM", title: "CodeFest Hackathon 2024", location: "Innovation Lab" },
  { id: 6, img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=600&fit=crop", badge: "Annual", badgeType: "default", date: "Sun, 14 Apr, 11:00 AM", title: "Convocation Ceremony 2024", location: "Convention Centre" },
];

const INITIAL_NOTICES = [
  { id: 0, title: "Exam Schedule Released", body: "End semester exams start from April 15th. Check your hall tickets.", time: "2 hours ago" },
  { id: 1, title: "Campus WiFi Maintenance", body: "WiFi will be unavailable in Block A on March 10th, 10 AM – 2 PM.", time: "5 hours ago" },
  { id: 2, title: "Holiday Announcement", body: "College will remain closed on March 25th for Holi festival.", time: "1 day ago" },
];

let nextId = 100;

/* ═══════════════════════════════════════════════════════════
   CONFIRM DIALOG
═══════════════════════════════════════════════════════════ */
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <div className="confirm-icon">
          <i className="bx bx-error-circle" />
        </div>
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
   IMAGE UPLOAD FIELD
═══════════════════════════════════════════════════════════ */
function ImageUploadField({ value, onChange }) {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="img-upload-wrap">
      {value && (
        <div className="img-upload-preview">
          <img src={value} alt="preview" />
        </div>
      )}
      <button type="button" className="img-upload-btn" onClick={() => fileRef.current.click()}>
        <i className="bx bx-image-add" />
        {value ? "Change Image" : "Upload Image"}
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
  const [newForm, setNewForm] = useState({ title: "", date: "", location: "", badge: "", img: "" });
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleDeleteClick = (id) => {
    if (draft.length <= 1) { showToast("You must have at least 1 event."); return; }
    setConfirmId(id);
  };

  const confirmDelete = () => {
    setDraft((prev) => prev.filter((e) => e.id !== confirmId));
    setConfirmId(null);
  };

  const openUpdate = (ev) => {
    setUpdating(ev.id);
    setUpdateForm({ title: ev.title, date: ev.date, location: ev.location, badge: ev.badge || "", img: ev.img });
  };

  const saveUpdate = () => {
    setDraft((prev) => prev.map((e) => e.id === updating ? { ...e, ...updateForm, badge: updateForm.badge || null } : e));
    setUpdating(null);
  };

  const handleAdd = () => {
    if (!newForm.title.trim() || !newForm.date.trim()) { showToast("Title and Date are required."); return; }
    setDraft((prev) => [...prev, {
      id: nextId++,
      img: newForm.img || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=600&fit=crop",
      badge: newForm.badge || null,
      badgeType: newForm.badge ? "default" : null,
      date: newForm.date,
      title: newForm.title,
      location: newForm.location,
    }]);
    setNewForm({ title: "", date: "", location: "", badge: "", img: "" });
    setAddingNew(false);
  };

  const sheetOpen = updating !== null || addingNew;

  return (
    <div className="edit-overlay">
      <div className="edit-page">
        {confirmId !== null && (
          <ConfirmDialog
            message="Are you sure you want to delete this event? This cannot be undone."
            onConfirm={confirmDelete}
            onCancel={() => setConfirmId(null)}
          />
        )}
        {toast && <div className="edit-toast"><i className="bx bx-error-circle" /> {toast}</div>}

        <div className="edit-page-header">
          <button className="edit-back-btn" onClick={onBack}><i className="bx bx-arrow-back" /></button>
          <span className="edit-page-title">Edit Events</span>
          <button className="edit-save-btn" onClick={() => { onSave(draft); onBack(); }}>Save</button>
        </div>

        <div className="edit-page-content">
          {draft.map((ev) => (
            <div className="edit-event-row" key={ev.id}>
              <div className="edit-event-thumb"><img src={ev.img} alt={ev.title} /></div>
              <div className="edit-event-info">
                <div className="edit-event-title">{ev.title}</div>
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
          <button className="add-new-btn" onClick={() => { setAddingNew(true); setUpdating(null); }}>
            <i className="bx bx-plus" /> Add New Event
          </button>
        </div>

        <div className={`form-sheet-backdrop${sheetOpen ? " active" : ""}`} onClick={() => { setUpdating(null); setAddingNew(false); }} />
        <div className={`form-sheet${sheetOpen ? " active" : ""}`}>
          <div className="form-sheet-handle" />
          {updating !== null && (
            <>
              <div className="form-sheet-title"><i className="bx bx-edit-alt" /> Update Event</div>
              {[{ key: "title", label: "Title" }, { key: "date", label: "Date & Time" }, { key: "location", label: "Location" }, { key: "badge", label: "Badge Text" }].map((f) => (
                <div className="ef-field" key={f.key}>
                  <label className="ef-label">{f.label}</label>
                  <input className="ef-input" value={updateForm[f.key]} onChange={(e) => setUpdateForm((v) => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
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
              {[{ key: "title", label: "Title *" }, { key: "date", label: "Date & Time *" }, { key: "location", label: "Location" }, { key: "badge", label: "Badge Text" }].map((f) => (
                <div className="ef-field" key={f.key}>
                  <label className="ef-label">{f.label}</label>
                  <input className="ef-input" value={newForm[f.key]} onChange={(e) => setNewForm((v) => ({ ...v, [f.key]: e.target.value }))} />
                </div>
              ))}
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
    </div>
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
  const [newForm, setNewForm] = useState({ title: "", body: "", time: "" });
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const handleDeleteClick = (id) => {
    if (draft.length <= 1) { showToast("You must have at least 1 notice."); return; }
    setConfirmId(id);
  };

  const confirmDelete = () => {
    setDraft((prev) => prev.filter((n) => n.id !== confirmId));
    setConfirmId(null);
  };

  const openUpdate = (n) => {
    setUpdating(n.id);
    setUpdateForm({ title: n.title, body: n.body, time: n.time });
  };

  const saveUpdate = () => {
    setDraft((prev) => prev.map((n) => n.id === updating ? { ...n, ...updateForm } : n));
    setUpdating(null);
  };

  const handleAdd = () => {
    if (!newForm.title.trim()) { showToast("Title is required."); return; }
    setDraft((prev) => [...prev, { id: nextId++, title: newForm.title, body: newForm.body, time: newForm.time || "Just now" }]);
    setNewForm({ title: "", body: "", time: "" });
    setAddingNew(false);
  };

  const sheetOpen = updating !== null || addingNew;

  return (
    <div className="edit-overlay">
      <div className="edit-page">
        {confirmId !== null && (
          <ConfirmDialog
            message="Are you sure you want to delete this notice? This cannot be undone."
            onConfirm={confirmDelete}
            onCancel={() => setConfirmId(null)}
          />
        )}
        {toast && <div className="edit-toast"><i className="bx bx-error-circle" /> {toast}</div>}

        <div className="edit-page-header">
          <button className="edit-back-btn" onClick={onBack}><i className="bx bx-arrow-back" /></button>
          <span className="edit-page-title">Edit Notices</span>
          <button className="edit-save-btn" onClick={() => { onSave(draft); onBack(); }}>Save</button>
        </div>

        <div className="edit-page-content">
          {draft.map((n) => (
            <div className="edit-notice-row" key={n.id}>
              <div className="edit-notice-info">
                <div className="edit-notice-title">{n.title}</div>
                <div className="edit-notice-body">{n.body}</div>
                <div className="edit-notice-time">{n.time}</div>
              </div>
              <div className="edit-event-actions">
                <button className="edit-update-btn" onClick={() => openUpdate(n)}><i className="bx bx-edit" /> Update</button>
                <button className="edit-delete-btn" onClick={() => handleDeleteClick(n.id)}><i className="bx bx-trash" /> Delete</button>
              </div>
            </div>
          ))}
        </div>

        <div className="edit-page-footer">
          <button className="add-new-btn" onClick={() => { setAddingNew(true); setUpdating(null); }}>
            <i className="bx bx-plus" /> Add New Notice
          </button>
        </div>

        <div className={`form-sheet-backdrop${sheetOpen ? " active" : ""}`} onClick={() => { setUpdating(null); setAddingNew(false); }} />
        <div className={`form-sheet${sheetOpen ? " active" : ""}`}>
          <div className="form-sheet-handle" />
          {updating !== null && (
            <>
              <div className="form-sheet-title"><i className="bx bx-edit-alt" /> Update Notice</div>
              {[{ key: "title", label: "Title" }, { key: "body", label: "Body", multiline: true }, { key: "time", label: "Time" }].map((f) => (
                <div className="ef-field" key={f.key}>
                  <label className="ef-label">{f.label}</label>
                  {f.multiline
                    ? <textarea className="ef-input ef-textarea" rows={3} value={updateForm[f.key]} onChange={(e) => setUpdateForm((v) => ({ ...v, [f.key]: e.target.value }))} />
                    : <input className="ef-input" value={updateForm[f.key]} onChange={(e) => setUpdateForm((v) => ({ ...v, [f.key]: e.target.value }))} />
                  }
                </div>
              ))}
              <div className="ef-actions">
                <button className="ef-cancel" onClick={() => setUpdating(null)}>Cancel</button>
                <button className="ef-save" onClick={saveUpdate}>Apply</button>
              </div>
            </>
          )}
          {addingNew && (
            <>
              <div className="form-sheet-title"><i className="bx bx-plus-circle" /> New Notice</div>
              {[{ key: "title", label: "Title *" }, { key: "body", label: "Body", multiline: true }, { key: "time", label: "Time" }].map((f) => (
                <div className="ef-field" key={f.key}>
                  <label className="ef-label">{f.label}</label>
                  {f.multiline
                    ? <textarea className="ef-input ef-textarea" rows={3} value={newForm[f.key]} onChange={(e) => setNewForm((v) => ({ ...v, [f.key]: e.target.value }))} />
                    : <input className="ef-input" value={newForm[f.key]} onChange={(e) => setNewForm((v) => ({ ...v, [f.key]: e.target.value }))} />
                  }
                </div>
              ))}
              <div className="ef-actions">
                <button className="ef-cancel" onClick={() => setAddingNew(false)}>Cancel</button>
                <button className="ef-save" onClick={handleAdd}>Add Notice</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
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

  const cardW = useCallback(() => { const card = trackRef.current?.querySelector(".event-card"); return card ? card.offsetWidth : 340; }, []);
  const gapPx = useCallback(() => { if (!trackRef.current) return 16; return parseInt(getComputedStyle(trackRef.current).gap) || 16; }, []);
  const calcTx = useCallback((i) => { const vw = carouselRef.current?.clientWidth || window.innerWidth; const cw = cardW(), step = cw + gapPx(); return vw / 2 - (i * step + cw / 2); }, [cardW, gapPx]);
  const goTo = useCallback((idx) => { if (idx < 0 || idx >= total) return; setCurrent(idx); setTx(calcTx(idx)); }, [total, calcTx]);

  useEffect(() => { if (current >= total) setCurrent(Math.max(0, total - 1)); }, [total, current]);
  useEffect(() => { const apply = () => setTx(calcTx(current)); requestAnimationFrame(() => requestAnimationFrame(apply)); window.addEventListener("resize", apply); return () => window.removeEventListener("resize", apply); }, [current, calcTx]);
  useEffect(() => { const handler = (e) => { if (e.key === "ArrowLeft") goTo(current - 1); if (e.key === "ArrowRight") goTo(current + 1); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [current, goTo]);

  const onDragStart = useCallback((x) => { dragRef.current = { startX: x, delta: 0, baseTx: calcTx(current), t0: Date.now() }; setDragging(true); }, [calcTx, current]);
  const onDragMove = useCallback((x) => { if (!dragging) return; let d = x - dragRef.current.startX; dragRef.current.delta = d; if ((current === 0 && d > 0) || (current === total - 1 && d < 0)) d *= 0.2; setTx(dragRef.current.baseTx + d); }, [dragging, current, total]);
  const onDragEnd = useCallback(() => { if (!dragging) return; setDragging(false); const { delta, t0 } = dragRef.current; const elapsed = Date.now() - t0 || 1; const velocity = Math.abs(delta) / elapsed; const threshold = cardW() / 4; const isFlick = velocity > 0.35 && Math.abs(delta) > 25; if ((delta < -threshold || (isFlick && delta < 0)) && current < total - 1) goTo(current + 1); else if ((delta > threshold || (isFlick && delta > 0)) && current > 0) goTo(current - 1); else goTo(current); }, [dragging, current, total, cardW, goTo]);
  const dragDelta = useCallback(() => dragRef.current.delta, []);

  return { current, tx, dragging, goTo, carouselRef, trackRef, onDragStart, onDragMove, onDragEnd, dragDelta };
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function AdminExplorer() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [savedCards, setSavedCards] = useState({});
  const [loadedImgs, setLoadedImgs] = useState({});
  const [page, setPage] = useState(null);

  const evList = events;
  const total = evList.length;

  const { current, tx, dragging, goTo, carouselRef, trackRef, onDragStart, onDragMove, onDragEnd, dragDelta } = useCarousel(total);

  useEffect(() => {
    const move = (e) => onDragMove(e.clientX);
    const up = () => onDragEnd();
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("mouseleave", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mouseleave", up);
    };
  }, [onDragMove, onDragEnd]);

  const toggleBookmark = (id, e) => { e.stopPropagation(); setSavedCards((p) => ({ ...p, [id]: !p[id] })); };
  const handleImgLoad = (id) => setLoadedImgs((p) => ({ ...p, [id]: true }));

  return (
    <>
      {page === "editEvents" && (
        <EditEventsPage events={events} onSave={(updated) => setEvents(updated)} onBack={() => setPage(null)} />
      )}
      {page === "editNotices" && (
        <EditNoticesPage notices={notices} onSave={(updated) => setNotices(updated)} onBack={() => setPage(null)} />
      )}

      {/* IN THE SPOTLIGHT */}
      <div className="spotlight-section">
        <div className="section-header">
          <div className="header-line" />
          <div className="section-title-row">
            <h2 className="section-title">In The Spotlight</h2>
            <button className="edit-section-btn" onClick={() => setPage("editEvents")}>
              <i className="bx bx-edit" /> Edit
            </button>
          </div>
          <div className="header-line" />
        </div>

        <div className="events-carousel" ref={carouselRef}>
          <div
            ref={trackRef}
            className={`events-track${dragging ? " is-dragging" : ""}`}
            style={{ transform: `translateX(${tx}px)`, transition: dragging ? "none" : "transform 0.42s cubic-bezier(0.4,0,0.2,1)" }}
            onMouseDown={(e) => { onDragStart(e.clientX); e.preventDefault(); }}
            onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
            onTouchEnd={onDragEnd}
            onTouchCancel={onDragEnd}
            onClick={(e) => { if (Math.abs(dragDelta()) > 8) { e.stopPropagation(); e.preventDefault(); } }}
          >
            {evList.map((ev, i) => (
              <div key={ev.id} className={`event-card${i === current ? " active" : ""}`}>
                <div className="event-image">
                  <img src={ev.img} alt={ev.title} className={loadedImgs[ev.id] ? "loaded" : ""} onLoad={() => handleImgLoad(ev.id)} onError={() => handleImgLoad(ev.id)} draggable={false} />
                  <div className="event-overlay" />
                  {ev.badge && <div className={`event-badge${ev.badgeType === "promo" ? " promo" : ""}`}>{ev.badge}</div>}
                </div>
                <div className="event-info">
                  <div className="event-date">{ev.date}</div>
                  <h3 className="event-title">{ev.title}</h3>
                  <div className="event-location"><i className="bx bx-map" /><span>{ev.location}</span></div>
                  <button className={`bookmark-btn${savedCards[ev.id] ? " saved" : ""}`} onClick={(e) => toggleBookmark(ev.id, e)}>
                    <i className={`bx ${savedCards[ev.id] ? "bxs-bookmark" : "bx-bookmark"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="carousel-controls">
          <button className="carousel-arrow" onClick={() => goTo(current - 1)} disabled={current === 0}><i className="bx bx-chevron-left" /></button>
          <div className="carousel-dots">
            {evList.map((_, i) => <span key={i} className={`dot${i === current ? " active" : ""}`} onClick={() => goTo(i)} />)}
          </div>
          <button className="carousel-arrow" onClick={() => goTo(current + 1)} disabled={current === total - 1}><i className="bx bx-chevron-right" /></button>
        </div>
      </div>

      {/* NOTICES */}
      <div className="notices-section">
        <div className="section-header">
          <div className="header-line" />
          <div className="section-title-row">
            <h2 className="section-title">Notices</h2>
            <button className="edit-section-btn" onClick={() => setPage("editNotices")}>
              <i className="bx bx-edit" /> Edit
            </button>
          </div>
          <div className="header-line" />
        </div>
        <div className="notices-list">
          {notices.map((n) => (
            <div className="notice-item" key={n.id}>
              <div className="notice-content">
                <h4>{n.title}</h4>
                <p>{n.body}</p>
                <span className="notice-time">{n.time}</span>
              </div>
            </div>
          ))}
        </div>
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