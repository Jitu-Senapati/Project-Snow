import { useState, useEffect, useRef, useCallback } from "react";
import "boxicons/css/boxicons.min.css";
import "../../styles/Admin-explorer.css";

/* ─── Initial Data ──────────────────────────────────────── */
const INITIAL_EVENTS = [
  {
    id: 0,
    img: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400&h=600&fit=crop",
    badge: "Featured",
    badgeType: "default",
    date: "Fri, 15 Mar, 10:00 AM",
    title: "Annual Tech Fest 2024 - Innovation Unleashed",
    location: "Main Auditorium",
  },
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=400&h=600&fit=crop",
    badge: "Register before 10 Mar",
    badgeType: "promo",
    date: "Mon, 18 Mar, 9:00 AM",
    title: "Google Campus Placement Drive",
    location: "Seminar Hall B",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=600&fit=crop",
    badge: null,
    badgeType: null,
    date: "Sat, 23 Mar, 6:00 PM",
    title: "Spring Cultural Fest - Rhythm 2024",
    location: "Open Air Theatre",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=600&fit=crop",
    badge: "Certificate Included",
    badgeType: "promo",
    date: "Wed, 27 Mar, 2:00 PM",
    title: "AI & Machine Learning Workshop",
    location: "Computer Lab 3",
  },
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1540747913346-19378d7f5d39?w=400&h=600&fit=crop",
    badge: null,
    badgeType: null,
    date: "Fri, 29 Mar, 8:00 AM",
    title: "Inter-College Cricket Tournament",
    location: "Sports Ground",
  },
  {
    id: 5,
    img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=600&fit=crop",
    badge: "24 Hrs",
    badgeType: "default",
    date: "Sat, 6 Apr, 10:00 AM",
    title: "CodeFest Hackathon 2024",
    location: "Innovation Lab",
  },
  {
    id: 6,
    img: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=600&fit=crop",
    badge: "Annual",
    badgeType: "default",
    date: "Sun, 14 Apr, 11:00 AM",
    title: "Convocation Ceremony 2024",
    location: "Convention Centre",
  },
];

const INITIAL_NOTICES = [
  {
    id: 0,
    title: "Exam Schedule Released",
    body: "End semester exams start from April 15th. Check your hall tickets.",
    time: "2 hours ago",
  },
  {
    id: 1,
    title: "Campus WiFi Maintenance",
    body: "WiFi will be unavailable in Block A on March 10th, 10 AM – 2 PM.",
    time: "5 hours ago",
  },
  {
    id: 2,
    title: "Holiday Announcement",
    body: "College will remain closed on March 25th for Holi festival.",
    time: "1 day ago",
  },
];

const BROWSE_ITEMS = [
  { icon: "bx-calendar-event", label: "Events" },
  { icon: "bx-book-open", label: "Courses" },
  { icon: "bx-trophy", label: "Sports" },
  { icon: "bx-group", label: "Clubs" },
  { icon: "bx-briefcase", label: "Placements" },
  { icon: "bx-building", label: "Facilities" },
  { icon: "bx-bus", label: "Transport" },
  { icon: "bx-food-menu", label: "Cafeteria" },
  { icon: "bx-library", label: "Library" },
];

const NAV_ITEMS = [
  { id: "home", icon: "bx-compass", label: "Explorer", isMore: false },
  { id: "bus", icon: "bx-bus", label: "Bus", isMore: false },
  {
    id: "more",
    icon: "bx-dots-horizontal-rounded",
    label: "More",
    isMore: true,
  },
  { id: "chat", icon: "bx-message-rounded-dots", label: "Chat", isMore: false },
  { id: "profile", icon: "bx-user-circle", label: "Profile", isMore: false },
];

let nextId = 100; // for generating new event/notice ids

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
          <button className="ef-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="confirm-ok" onClick={onConfirm}>
            Yes, Delete
          </button>
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
    reader.onload = (ev) => onChange(ev.target.result); // base64 data URL
    reader.readAsDataURL(file);
  };

  return (
    <div className="img-upload-wrap">
      {value && (
        <div className="img-upload-preview">
          <img src={value} alt="preview" />
        </div>
      )}
      <button
        type="button"
        className="img-upload-btn"
        onClick={() => fileRef.current.click()}
      >
        <i className="bx bx-image-add" />
        {value ? "Change Image" : "Upload Image"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
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
  const [newForm, setNewForm] = useState({
    title: "",
    date: "",
    location: "",
    badge: "",
    img: "",
  });
  const [confirmId, setConfirmId] = useState(null); // id pending delete confirm
  const [toast, setToast] = useState(null); // warning message

  const isOdd = draft.length % 2 !== 0;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  /* Delete — ask confirm first */
  const handleDeleteClick = (id) => {
    if (draft.length <= 1) {
      showToast("You must have at least 1 event.");
      return;
    }
    setConfirmId(id);
  };

  const confirmDelete = () => {
    const updated = draft.filter((e) => e.id !== confirmId);
    setConfirmId(null);
    if (updated.length % 2 === 0) {
      showToast(
        `⚠️ You now have ${updated.length} events (even). Add or remove one more to keep it odd before saving.`,
      );
    }
    setDraft(updated);
  };

  /* Update */
  const openUpdate = (ev) => {
    setUpdating(ev.id);
    setUpdateForm({
      title: ev.title,
      date: ev.date,
      location: ev.location,
      badge: ev.badge || "",
      img: ev.img,
    });
  };
  const saveUpdate = () => {
    setDraft((prev) =>
      prev.map((e) =>
        e.id === updating
          ? { ...e, ...updateForm, badge: updateForm.badge || null }
          : e,
      ),
    );
    setUpdating(null);
  };

  /* Add */
  const handleAdd = () => {
    if (!newForm.title.trim() || !newForm.date.trim()) {
      showToast("Title and Date are required.");
      return;
    }
    const updated = [
      ...draft,
      {
        id: nextId++,
        img:
          newForm.img ||
          "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=600&fit=crop",
        badge: newForm.badge || null,
        badgeType: newForm.badge ? "default" : null,
        date: newForm.date,
        title: newForm.title,
        location: newForm.location,
      },
    ];
    if (updated.length % 2 === 0) {
      showToast(
        `⚠️ You now have ${updated.length} events (even). Add or remove one more to keep it odd before saving.`,
      );
    }
    setDraft(updated);
    setNewForm({ title: "", date: "", location: "", badge: "", img: "" });
    setAddingNew(false);
  };

  /* Save — block if even */
  const handleSave = () => {
    if (draft.length % 2 === 0) {
      showToast(
        "⚠️ Cannot save — you have an even number of events. Add or remove one more.",
      );
      return;
    }
    onSave(draft);
    onBack();
  };

  return (
    <div className="edit-page">
      {/* Confirm dialog */}
      {confirmId !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this event? This cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Toast warning */}
      {toast && (
        <div className="edit-toast">
          <i className="bx bx-error-circle" /> {toast}
        </div>
      )}

      {/* Header */}
      <div className="edit-page-header">
        <button className="edit-back-btn" onClick={onBack}>
          <i className="bx bx-arrow-back" />
        </button>
        <span className="edit-page-title">Edit Events</span>
        <button className="edit-save-btn" onClick={handleSave}>
          Save
        </button>
      </div>

      {/* Event list */}
      <div className="edit-page-content">
        <p className={`edit-hint${isOdd ? "" : " edit-hint-warn"}`}>
          <i className={`bx ${isOdd ? "bx-info-circle" : "bx-error-circle"}`} />
          Events must be an <strong>odd number</strong>. Currently:{" "}
          <strong>{draft.length}</strong>
          {!isOdd && " ← fix before saving"}
        </p>

        {draft.map((ev) => (
          <div className="edit-event-row" key={ev.id}>
            <div className="edit-event-thumb">
              <img src={ev.img} alt={ev.title} />
            </div>
            <div className="edit-event-info">
              <div className="edit-event-title">{ev.title}</div>
              <div className="edit-event-date">{ev.date}</div>
              <div className="edit-event-loc">
                <i className="bx bx-map" /> {ev.location}
              </div>
            </div>
            <div className="edit-event-actions">
              <button
                className="edit-update-btn"
                onClick={() => openUpdate(ev)}
              >
                <i className="bx bx-edit" /> Update
              </button>
              <button
                className="edit-delete-btn"
                onClick={() => handleDeleteClick(ev.id)}
              >
                <i className="bx bx-trash" /> Delete
              </button>
            </div>
          </div>
        ))}

        {/* Update inline form */}
        {updating !== null && (
          <div className="edit-inline-form">
            <div className="edit-inline-form-title">
              <i className="bx bx-edit-alt" /> Updating Event
            </div>
            {[
              { key: "title", label: "Title" },
              { key: "date", label: "Date & Time" },
              { key: "location", label: "Location" },
              { key: "badge", label: "Badge Text" },
            ].map((f) => (
              <div className="ef-field" key={f.key}>
                <label className="ef-label">{f.label}</label>
                <input
                  className="ef-input"
                  value={updateForm[f.key]}
                  onChange={(e) =>
                    setUpdateForm((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="ef-field">
              <label className="ef-label">Image</label>
              <ImageUploadField
                value={updateForm.img}
                onChange={(val) => setUpdateForm((v) => ({ ...v, img: val }))}
              />
            </div>
            <div className="ef-actions">
              <button className="ef-cancel" onClick={() => setUpdating(null)}>
                Cancel
              </button>
              <button className="ef-save" onClick={saveUpdate}>
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Add new event form */}
        {addingNew && (
          <div className="edit-inline-form">
            <div className="edit-inline-form-title">
              <i className="bx bx-plus-circle" /> New Event
            </div>
            {[
              { key: "title", label: "Title *" },
              { key: "date", label: "Date & Time *" },
              { key: "location", label: "Location" },
              { key: "badge", label: "Badge Text" },
            ].map((f) => (
              <div className="ef-field" key={f.key}>
                <label className="ef-label">{f.label}</label>
                <input
                  className="ef-input"
                  value={newForm[f.key]}
                  onChange={(e) =>
                    setNewForm((v) => ({ ...v, [f.key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div className="ef-field">
              <label className="ef-label">Image</label>
              <ImageUploadField
                value={newForm.img}
                onChange={(val) => setNewForm((v) => ({ ...v, img: val }))}
              />
            </div>
            <div className="ef-actions">
              <button className="ef-cancel" onClick={() => setAddingNew(false)}>
                Cancel
              </button>
              <button className="ef-save" onClick={handleAdd}>
                Add Event
              </button>
            </div>
          </div>
        )}
      </div>

      {!addingNew && (
        <div className="edit-page-footer">
          <button className="add-new-btn" onClick={() => setAddingNew(true)}>
            <i className="bx bx-plus" /> Add New Event
          </button>
        </div>
      )}
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

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleDeleteClick = (id) => {
    if (draft.length <= 1) {
      showToast("You must have at least 1 notice.");
      return;
    }
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
    setDraft((prev) =>
      prev.map((n) => (n.id === updating ? { ...n, ...updateForm } : n)),
    );
    setUpdating(null);
  };

  const handleAdd = () => {
    if (!newForm.title.trim()) {
      showToast("Title is required.");
      return;
    }
    setDraft((prev) => [
      ...prev,
      {
        id: nextId++,
        title: newForm.title,
        body: newForm.body,
        time: newForm.time || "Just now",
      },
    ]);
    setNewForm({ title: "", body: "", time: "" });
    setAddingNew(false);
  };

  return (
    <div className="edit-page">
      {confirmId !== null && (
        <ConfirmDialog
          message="Are you sure you want to delete this notice? This cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {toast && (
        <div className="edit-toast">
          <i className="bx bx-error-circle" /> {toast}
        </div>
      )}

      <div className="edit-page-header">
        <button className="edit-back-btn" onClick={onBack}>
          <i className="bx bx-arrow-back" />
        </button>
        <span className="edit-page-title">Edit Notices</span>
        <button
          className="edit-save-btn"
          onClick={() => {
            onSave(draft);
            onBack();
          }}
        >
          Save
        </button>
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
              <button className="edit-update-btn" onClick={() => openUpdate(n)}>
                <i className="bx bx-edit" /> Update
              </button>
              <button
                className="edit-delete-btn"
                onClick={() => handleDeleteClick(n.id)}
              >
                <i className="bx bx-trash" /> Delete
              </button>
            </div>
          </div>
        ))}

        {updating !== null && (
          <div className="edit-inline-form">
            <div className="edit-inline-form-title">
              <i className="bx bx-edit-alt" /> Updating Notice
            </div>
            {[
              { key: "title", label: "Title" },
              { key: "body", label: "Body", multiline: true },
              { key: "time", label: "Time" },
            ].map((f) => (
              <div className="ef-field" key={f.key}>
                <label className="ef-label">{f.label}</label>
                {f.multiline ? (
                  <textarea
                    className="ef-input ef-textarea"
                    rows={3}
                    value={updateForm[f.key]}
                    onChange={(e) =>
                      setUpdateForm((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    className="ef-input"
                    value={updateForm[f.key]}
                    onChange={(e) =>
                      setUpdateForm((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
            <div className="ef-actions">
              <button className="ef-cancel" onClick={() => setUpdating(null)}>
                Cancel
              </button>
              <button className="ef-save" onClick={saveUpdate}>
                Apply
              </button>
            </div>
          </div>
        )}

        {addingNew && (
          <div className="edit-inline-form">
            <div className="edit-inline-form-title">
              <i className="bx bx-plus-circle" /> New Notice
            </div>
            {[
              { key: "title", label: "Title *" },
              { key: "body", label: "Body", multiline: true },
              { key: "time", label: "Time" },
            ].map((f) => (
              <div className="ef-field" key={f.key}>
                <label className="ef-label">{f.label}</label>
                {f.multiline ? (
                  <textarea
                    className="ef-input ef-textarea"
                    rows={3}
                    value={newForm[f.key]}
                    onChange={(e) =>
                      setNewForm((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                  />
                ) : (
                  <input
                    className="ef-input"
                    value={newForm[f.key]}
                    onChange={(e) =>
                      setNewForm((v) => ({ ...v, [f.key]: e.target.value }))
                    }
                  />
                )}
              </div>
            ))}
            <div className="ef-actions">
              <button className="ef-cancel" onClick={() => setAddingNew(false)}>
                Cancel
              </button>
              <button className="ef-save" onClick={handleAdd}>
                Add Notice
              </button>
            </div>
          </div>
        )}
      </div>

      {!addingNew && (
        <div className="edit-page-footer">
          <button className="add-new-btn" onClick={() => setAddingNew(true)}>
            <i className="bx bx-plus" /> Add New Notice
          </button>
        </div>
      )}
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

  const cardW = useCallback(() => {
    const card = trackRef.current?.querySelector(".event-card");
    return card ? card.offsetWidth : 340;
  }, []);

  const gapPx = useCallback(() => {
    if (!trackRef.current) return 16;
    return parseInt(getComputedStyle(trackRef.current).gap) || 16;
  }, []);

  const calcTx = useCallback(
    (i) => {
      const vw = carouselRef.current?.clientWidth || window.innerWidth;
      const cw = cardW(),
        step = cw + gapPx();
      return vw / 2 - (i * step + cw / 2);
    },
    [cardW, gapPx],
  );

  const goTo = useCallback(
    (idx) => {
      if (idx < 0 || idx >= total) return;
      setCurrent(idx);
      setTx(calcTx(idx));
    },
    [total, calcTx],
  );

  // clamp current if total shrinks
  useEffect(() => {
    if (current >= total) setCurrent(Math.max(0, total - 1));
  }, [total, current]);

  useEffect(() => {
    const apply = () => setTx(calcTx(current));
    requestAnimationFrame(() => requestAnimationFrame(apply));
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [current, calcTx]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") goTo(current - 1);
      if (e.key === "ArrowRight") goTo(current + 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [current, goTo]);

  const onDragStart = useCallback(
    (x) => {
      dragRef.current = {
        startX: x,
        delta: 0,
        baseTx: calcTx(current),
        t0: Date.now(),
      };
      setDragging(true);
    },
    [calcTx, current],
  );

  const onDragMove = useCallback(
    (x) => {
      if (!dragging) return;
      let d = x - dragRef.current.startX;
      dragRef.current.delta = d;
      if ((current === 0 && d > 0) || (current === total - 1 && d < 0))
        d *= 0.2;
      setTx(dragRef.current.baseTx + d);
    },
    [dragging, current, total],
  );

  const onDragEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const { delta, t0 } = dragRef.current;
    const elapsed = Date.now() - t0 || 1;
    const velocity = Math.abs(delta) / elapsed;
    const threshold = cardW() / 4;
    const isFlick = velocity > 0.35 && Math.abs(delta) > 25;
    if ((delta < -threshold || (isFlick && delta < 0)) && current < total - 1)
      goTo(current + 1);
    else if ((delta > threshold || (isFlick && delta > 0)) && current > 0)
      goTo(current - 1);
    else goTo(current);
  }, [dragging, current, total, cardW, goTo]);

  const dragDelta = useCallback(() => dragRef.current.delta, []);

  return {
    current,
    tx,
    dragging,
    goTo,
    carouselRef,
    trackRef,
    onDragStart,
    onDragMove,
    onDragEnd,
    dragDelta,
  };
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function Explorer() {
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [notices, setNotices] = useState(INITIAL_NOTICES);
  const [activeNav, setActiveNav] = useState("home");
  const [openPanel, setOpenPanel] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [savedCards, setSavedCards] = useState({});
  const [loadedImgs, setLoadedImgs] = useState({});
  // 'home' | 'editEvents' | 'editNotices'
  const [page, setPage] = useState("home");

  const total = events.length % 2 === 0 ? events.length - 1 : events.length;
  const evList = events.slice(0, total);

  const {
    current,
    tx,
    dragging,
    goTo,
    carouselRef,
    trackRef,
    onDragStart,
    onDragMove,
    onDragEnd,
    dragDelta,
  } = useCarousel(total);

  useEffect(() => {
    const t = setTimeout(() => setBannerVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = () => setOpenPanel(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

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

  const togglePanel = (name, e) => {
    e.stopPropagation();
    setOpenPanel((p) => (p === name ? null : name));
  };
  const toggleBookmark = (id, e) => {
    e.stopPropagation();
    setSavedCards((p) => ({ ...p, [id]: !p[id] }));
  };
  const handleImgLoad = (id) => setLoadedImgs((p) => ({ ...p, [id]: true }));
  const handleNavClick = (item) => {
    if (item.isMore) setExplorerOpen(true);
    else setActiveNav(item.id);
  };

  /* ── Render edit pages ── */
  if (page === "editEvents") {
    return (
      <EditEventsPage
        events={events}
        onSave={(updated) => setEvents(updated)}
        onBack={() => setPage("home")}
      />
    );
  }

  if (page === "editNotices") {
    return (
      <EditNoticesPage
        notices={notices}
        onSave={(updated) => setNotices(updated)}
        onBack={() => setPage("home")}
      />
    );
  }

  /* ── Main home page ── */
  return (
    <div className={`main-app${bannerVisible ? " banner-visible" : ""}`}>
      {/* ══ HEADER ══ */}
      <div className="app-header">
        <div className="app-logo">STUVO5</div>
        <div className="header-icons">
          <i className="bx bx-bell" onClick={(e) => togglePanel("notif", e)} />
          <i className="bx bx-menu" onClick={(e) => togglePanel("menu", e)} />
        </div>

        {/* Notification panel */}
        <div
          className={`notification-panel${openPanel === "notif" ? " active" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            {
              icon: "bx-bus",
              title: "Bus #101",
              body: "Arriving in 5 minutes",
            },
            {
              icon: "bx-calendar",
              title: "New Event",
              body: "Tech Fest starts tomorrow",
            },
            {
              icon: "bx-book",
              title: "Attendance Updated",
              body: "Your attendance has been updated",
            },
          ].map((n, i) => (
            <div className="notification-item" key={i}>
              <i className={`bx ${n.icon}`} />
              <div className="notif-text">
                <strong>{n.title}</strong>
                <p>{n.body}</p>
              </div>
            </div>
          ))}
          <div className="notification-footer">View all notifications</div>
        </div>

        {/* Menu panel */}
        <div
          className={`menu-panel${openPanel === "menu" ? " active" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { icon: "bx-cog", label: "Settings" },
            { icon: "bx-message-dots", label: "Feedback" },
            { icon: "bx-help-circle", label: "Help" },
          ].map((m, i) => (
            <div className="menu-item" key={i}>
              <i className={`bx ${m.icon}`} />
              <span>{m.label}</span>
            </div>
          ))}
          <div className="menu-item logout">
            <i className="bx bx-log-out" />
            <span>Logout</span>
          </div>
        </div>
      </div>

      {/* ══ HOME PAGE ══ */}
      <div className="page-content active">
        {/* IN THE SPOTLIGHT */}
        <div className="spotlight-section">
          <div className="section-header">
            <div className="header-line" />
            <div className="section-title-row">
              <h2 className="section-title">In The Spotlight</h2>
              <button
                className="edit-section-btn"
                onClick={() => setPage("editEvents")}
              >
                <i className="bx bx-edit" /> Edit
              </button>
            </div>
            <div className="header-line" />
          </div>

          <div className="events-carousel" ref={carouselRef}>
            <div
              ref={trackRef}
              className={`events-track${dragging ? " is-dragging" : ""}`}
              style={{
                transform: `translateX(${tx}px)`,
                transition: dragging
                  ? "none"
                  : "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
              }}
              onMouseDown={(e) => {
                onDragStart(e.clientX);
                e.preventDefault();
              }}
              onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
              onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
              onTouchEnd={onDragEnd}
              onTouchCancel={onDragEnd}
              onClick={(e) => {
                if (Math.abs(dragDelta()) > 8) {
                  e.stopPropagation();
                  e.preventDefault();
                }
              }}
            >
              {evList.map((ev, i) => (
                <div
                  key={ev.id}
                  className={`event-card${i === current ? " active" : ""}`}
                >
                  <div className="event-image">
                    <img
                      src={ev.img}
                      alt={ev.title}
                      className={loadedImgs[ev.id] ? "loaded" : ""}
                      onLoad={() => handleImgLoad(ev.id)}
                      onError={() => handleImgLoad(ev.id)}
                      draggable={false}
                    />
                    <div className="event-overlay" />
                    {ev.badge && (
                      <div
                        className={`event-badge${ev.badgeType === "promo" ? " promo" : ""}`}
                      >
                        {ev.badge}
                      </div>
                    )}
                  </div>
                  <div className="event-info">
                    <div className="event-date">{ev.date}</div>
                    <h3 className="event-title">{ev.title}</h3>
                    <div className="event-location">
                      <i className="bx bx-map" />
                      <span>{ev.location}</span>
                    </div>
                    <button
                      className={`bookmark-btn${savedCards[ev.id] ? " saved" : ""}`}
                      onClick={(e) => toggleBookmark(ev.id, e)}
                    >
                      <i
                        className={`bx ${savedCards[ev.id] ? "bxs-bookmark" : "bx-bookmark"}`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="carousel-controls">
            <button
              className="carousel-arrow"
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
            >
              <i className="bx bx-chevron-left" />
            </button>
            <div className="carousel-dots">
              {evList.map((_, i) => (
                <span
                  key={i}
                  className={`dot${i === current ? " active" : ""}`}
                  onClick={() => goTo(i)}
                />
              ))}
            </div>
            <button
              className="carousel-arrow"
              onClick={() => goTo(current + 1)}
              disabled={current === total - 1}
            >
              <i className="bx bx-chevron-right" />
            </button>
          </div>
        </div>

        {/* NOTICES */}
        <div className="notices-section">
          <div className="section-header">
            <div className="header-line" />
            <div className="section-title-row">
              <h2 className="section-title">Notices</h2>
              <button
                className="edit-section-btn"
                onClick={() => setPage("editNotices")}
              >
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
          <h3 style={{ color: "#a78bfa", marginBottom: 10 }}>
            Welcome to STUVO5 👋
          </h3>
          <p style={{ color: "#aaa" }}>
            Track buses, explore events, chat, and manage your profile.
          </p>
        </div>
      </div>

      {/* ══ INSTALL BANNER ══ */}
      <div className="install-banner">
        <span className="install-text">Install this site as an app</span>
        <button
          className="install-btn"
          onClick={() => {
            alert(
              "To install STUVO5:\n\n• Chrome/Edge desktop: click ⊕ in address bar\n• Chrome Android: tap ⋮ → Add to Home Screen\n• Safari iPhone: tap Share ↑ → Add to Home Screen",
            );
            setBannerVisible(false);
          }}
        >
          Install
        </button>
        <button
          className="install-close"
          onClick={() => setBannerVisible(false)}
        >
          <i className="bx bx-x" />
        </button>
      </div>

      {/* ══ BOTTOM NAV ══ */}
      <div className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-item${item.isMore ? (explorerOpen ? " active" : "") : activeNav === item.id ? " active" : ""}`}
            onClick={() => handleNavClick(item)}
          >
            <div className="nav-icon-wrap">
              <i className={`bx ${item.icon}`} />
            </div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ══ EXPLORER SHEET ══ */}
      <div
        className={`explorer-overlay${explorerOpen ? " active" : ""}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setExplorerOpen(false);
        }}
      >
        <div className="explorer-sheet">
          <div className="explorer-sheet-header">
            <h2 className="browse-title">BROWSE BY</h2>
            <i
              className="bx bx-x explorer-close"
              onClick={() => setExplorerOpen(false)}
            />
          </div>
          <div className="browse-grid">
            {BROWSE_ITEMS.map((item, i) => (
              <div className="browse-card" key={i}>
                <i className={`bx ${item.icon}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
