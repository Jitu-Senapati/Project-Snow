import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import "../../styles/Settings.css";
import { useAuth } from "../../context/AuthContext";
import { updateUserSettings } from "../../firebase/db";

// ─── Sub-pages ───────────────────────────────────────────
function AccountCenter({ onBack }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    currentPwd: "",
    newPwd: "",
    confirmPwd: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="st-subpage">
      <div className="st-subpage-header">
        <button className="st-back-btn" onClick={onBack}>
          <i className="bx bx-arrow-back" />
        </button>
        <div>
          <h2 className="st-subpage-title">Account Center</h2>
          <p className="st-subpage-sub">Manage your account details</p>
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">CHANGE EMAIL</p>
        <div className="st-card">
          <input
            className="st-input"
            placeholder="New email address"
            type="email"
            value={form.email}
            onChange={set("email")}
          />
          <button className="st-save-btn">Update Email</button>
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">CHANGE PHONE</p>
        <div className="st-card">
          <input
            className="st-input"
            placeholder="New phone number"
            type="tel"
            value={form.phone}
            onChange={set("phone")}
          />
          <button className="st-save-btn">Update Phone</button>
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">CHANGE PASSWORD</p>
        <div className="st-card st-card-gap">
          <input
            className="st-input"
            placeholder="Current password"
            type="password"
            value={form.currentPwd}
            onChange={set("currentPwd")}
          />
          <input
            className="st-input"
            placeholder="New password"
            type="password"
            value={form.newPwd}
            onChange={set("newPwd")}
          />
          <input
            className="st-input"
            placeholder="Confirm password"
            type="password"
            value={form.confirmPwd}
            onChange={set("confirmPwd")}
          />
          <button className="st-save-btn">Update Password</button>
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">DANGER ZONE</p>
        <div className="st-card">
          <div className="st-danger-row">
            <div>
              <p className="st-danger-title">Delete Account</p>
              <p className="st-danger-desc">
                Permanently delete your account and all data. This cannot be
                undone.
              </p>
            </div>
            <button
              className="st-delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="st-modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <div className="st-modal-icon st-modal-icon--red">
              <i className="bx bx-trash" />
            </div>
            <h3>Delete Account?</h3>
            <p>
              All your data will be permanently erased. This action cannot be
              reversed.
            </p>
            <div className="st-modal-actions">
              <button
                className="st-modal-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="st-modal-confirm st-modal-confirm--red">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationSettings({ onBack }) {
  const [toggles, setToggles] = useState({
    bus: true,
    events: true,
    attendance: true,
    complaints: true,
    chat: true,
    notices: false,
    promotions: false,
  });
  const toggle = (k) => setToggles((t) => ({ ...t, [k]: !t[k] }));

  const items = [
    {
      key: "bus",
      icon: "bx-bus",
      label: "Bus Alerts",
      desc: "Live bus arrival & departure updates",
    },
    {
      key: "events",
      icon: "bx-calendar-event",
      label: "Events",
      desc: "College events and fest announcements",
    },
    {
      key: "attendance",
      icon: "bx-check-square",
      label: "Attendance",
      desc: "Attendance updates from faculty",
    },
    {
      key: "complaints",
      icon: "bx-message-error",
      label: "Complaint Updates",
      desc: "Status changes on your complaints",
    },
    {
      key: "chat",
      icon: "bx-message-rounded-dots",
      label: "Chat Messages",
      desc: "New messages from peers",
    },
    {
      key: "notices",
      icon: "bx-bell",
      label: "Notices",
      desc: "Official notices from administration",
    },
    {
      key: "promotions",
      icon: "bx-gift",
      label: "Promotions",
      desc: "Offers and promotional content",
    },
  ];

  return (
    <div className="st-subpage">
      <div className="st-subpage-header">
        <button className="st-back-btn" onClick={onBack}>
          <i className="bx bx-arrow-back" />
        </button>
        <div
          className="st-subpage-icon"
          style={{
            background: "rgba(56,189,248,0.1)",
            border: "1px solid rgba(56,189,248,0.3)",
          }}
        >
          <i className="bx bx-bell" style={{ color: "#38bdf8" }} />
        </div>
        <div>
          <h2 className="st-subpage-title">Notifications</h2>
          <p className="st-subpage-sub">Control what you get notified about</p>
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">NOTIFICATION PREFERENCES</p>
        <div className="st-card st-card-list">
          {items.map((item, i) => (
            <div
              key={item.key}
              className={`st-toggle-row${i < items.length - 1 ? " st-toggle-row--border" : ""}`}
              onClick={() => toggle(item.key)}
            >
              <div className="st-toggle-icon">
                <i className={`bx ${item.icon}`} />
              </div>
              <div className="st-toggle-text">
                <span className="st-toggle-label">{item.label}</span>
                <span className="st-toggle-desc">{item.desc}</span>
              </div>
              <div
                className={`st-switch${toggles[item.key] ? " st-switch--on" : ""}`}
              >
                <div className="st-switch-knob" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockedProfiles({ onBack }) {
  const [blocked, setBlocked] = useState([
    { id: 1, name: "Rohan Sharma", branch: "CSE • 3rd Year", avatar: "RS" },
    { id: 2, name: "Priya Mehta", branch: "ECE • 2nd Year", avatar: "PM" },
    { id: 3, name: "Arjun Verma", branch: "MECH • 4th Year", avatar: "AV" },
  ]);
  const [unblockId, setUnblockId] = useState(null);

  const confirmUnblock = () => {
    setBlocked((b) => b.filter((p) => p.id !== unblockId));
    setUnblockId(null);
  };

  return (
    <div className="st-subpage">
      <div className="st-subpage-header">
        <button className="st-back-btn" onClick={onBack}>
          <i className="bx bx-arrow-back" />
        </button>
        <div
          className="st-subpage-icon"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <i className="bx bx-block" style={{ color: "#ef4444" }} />
        </div>
        <div>
          <h2 className="st-subpage-title">Blocked Profiles</h2>
          <p className="st-subpage-sub">
            {blocked.length} blocked {blocked.length === 1 ? "user" : "users"}
          </p>
        </div>
      </div>

      <div className="st-section">
        {blocked.length === 0 ? (
          <div className="st-empty">
            <i className="bx bx-user-check" />
            <p>No blocked profiles</p>
            <span>Users you block will appear here</span>
          </div>
        ) : (
          <div className="st-card st-card-list">
            {blocked.map((user, i) => (
              <div
                key={user.id}
                className={`st-blocked-row${i < blocked.length - 1 ? " st-toggle-row--border" : ""}`}
              >
                <div className="st-avatar">{user.avatar}</div>
                <div className="st-blocked-info">
                  <span className="st-blocked-name">{user.name}</span>
                  <span className="st-blocked-branch">{user.branch}</span>
                </div>
                <button
                  className="st-unblock-btn"
                  onClick={() => setUnblockId(user.id)}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {unblockId && (
        <div className="st-modal-overlay" onClick={() => setUnblockId(null)}>
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <div
              className="st-modal-icon"
              style={{
                background: "rgba(167,139,250,0.1)",
                border: "1px solid rgba(167,139,250,0.3)",
              }}
            >
              <i className="bx bx-user-check" style={{ color: "#a78bfa" }} />
            </div>
            <h3>Unblock User?</h3>
            <p>
              They will be able to see your profile and interact with you again.
            </p>
            <div className="st-modal-actions">
              <button
                className="st-modal-cancel"
                onClick={() => setUnblockId(null)}
              >
                Cancel
              </button>
              <button className="st-modal-confirm" onClick={confirmUnblock}>
                Yes, Unblock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ArchiveDownload({ onBack }) {
  const [requested, setRequested] = useState(false);

  return (
    <div className="st-subpage">
      <div className="st-subpage-header">
        <button className="st-back-btn" onClick={onBack}>
          <i className="bx bx-arrow-back" />
        </button>
        <div
          className="st-subpage-icon"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          <i className="bx bx-archive" style={{ color: "#22c55e" }} />
        </div>
        <div>
          <h2 className="st-subpage-title">Archive & Download</h2>
          <p className="st-subpage-sub">Manage your data</p>
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">YOUR DATA</p>
        <div className="st-card st-card-gap">
          <div className="st-info-row">
            <i className="bx bx-data" />
            <div>
              <p className="st-info-title">Download Your Data</p>
              <p className="st-info-desc">
                Get a copy of all your STUVO5 data including profile, posts,
                complaints, and activity.
              </p>
            </div>
          </div>
          {requested ? (
            <div className="st-success-msg">
              <i className="bx bx-check-circle" />
              <span>
                Request received! We'll email you the download link within 24
                hours.
              </span>
            </div>
          ) : (
            <button
              className="st-save-btn st-save-btn--green"
              onClick={() => setRequested(true)}
            >
              <i className="bx bx-download" /> Request Data Download
            </button>
          )}
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">ARCHIVED POSTS</p>
        <div className="st-card">
          <div className="st-empty st-empty--sm">
            <i className="bx bx-archive-in" />
            <p>No archived posts</p>
            <span>Posts you archive will appear here</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackPage({ onBack }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [category, setCategory] = useState(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: "bug", icon: "bx-bug", label: "Bug Report" },
    { id: "feature", icon: "bx-bulb", label: "Feature Request" },
    { id: "ui", icon: "bx-palette", label: "UI/UX" },
    { id: "general", icon: "bx-comment-dots", label: "General" },
  ];

  const handleSubmit = () => {
    if (!rating || !category || message.trim().length < 10) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="st-subpage">
        <div className="st-subpage-header">
          <button className="st-back-btn" onClick={onBack}>
            <i className="bx bx-arrow-back" />
          </button>
          <div
            className="st-subpage-icon"
            style={{
              background: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.3)",
            }}
          >
            <i
              className="bx bx-message-square-dots"
              style={{ color: "#a78bfa" }}
            />
          </div>
          <div>
            <h2 className="st-subpage-title">Feedback</h2>
            <p className="st-subpage-sub">Share your thoughts</p>
          </div>
        </div>
        <div className="st-feedback-success">
          <div className="st-feedback-success-icon">
            <i className="bx bx-heart" />
          </div>
          <h3>Thank you!</h3>
          <p>
            Your feedback helps us make STUVO5 better for everyone. We genuinely
            appreciate it!
          </p>
          <button
            className="st-save-btn"
            onClick={() => {
              setSubmitted(false);
              setRating(0);
              setCategory(null);
              setMessage("");
            }}
          >
            Send More Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="st-subpage">
      <div className="st-subpage-header">
        <button className="st-back-btn" onClick={onBack}>
          <i className="bx bx-arrow-back" />
        </button>
        <div
          className="st-subpage-icon"
          style={{
            background: "rgba(167,139,250,0.1)",
            border: "1px solid rgba(167,139,250,0.3)",
          }}
        >
          <i
            className="bx bx-message-square-dots"
            style={{ color: "#a78bfa" }}
          />
        </div>
        <div>
          <h2 className="st-subpage-title">Feedback</h2>
          <p className="st-subpage-sub">Help us improve STUVO5</p>
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">HOW ARE WE DOING?</p>
        <div className="st-card" style={{ textAlign: "center" }}>
          <p className="st-stars-hint">Rate your experience</p>
          <div className="st-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <i
                key={s}
                className={`bx ${(hovered || rating) >= s ? "bxs-star" : "bx-star"} st-star`}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(s)}
              />
            ))}
          </div>
          {rating > 0 && (
            <p className="st-rating-label">
              {
                [
                  "",
                  "Terrible 😞",
                  "Not Good 😕",
                  "Okay 😐",
                  "Good 😊",
                  "Excellent! 🤩",
                ][rating]
              }
            </p>
          )}
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">CATEGORY</p>
        <div className="st-cat-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`st-cat-card${category === cat.id ? " st-cat-card--active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              <i className={`bx ${cat.icon}`} />
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">YOUR MESSAGE</p>
        <div className="st-card">
          <textarea
            className="st-textarea"
            placeholder="Tell us what you think — what's working, what's not, or what you'd love to see..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={1000}
          />
          <span className="st-char-count">{message.length}/1000</span>
        </div>
      </div>

      <div className="st-section">
        <button
          className={`st-save-btn st-save-btn--full${rating && category && message.trim().length >= 10 ? "" : " st-save-btn--disabled"}`}
          onClick={handleSubmit}
        >
          <i className="bx bx-send" /> Submit Feedback
        </button>
      </div>
    </div>
  );
}

function PrivacySettings({ onBack }) {
  const { currentUser, userProfile } = useAuth();
  const [isPrivate, setIsPrivate] = useState(userProfile?.isPrivate || false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleToggle = async () => {
    if (!currentUser || saving) return;
    setSaving(true);
    const next = !isPrivate;
    try {
      await updateUserSettings(currentUser.uid, { isPrivate: next });
      setIsPrivate(next);
      showToast(next ? "Account set to Private" : "Account set to Public");
    } catch (e) {
      showToast("Failed to update. Try again.");
    }
    setSaving(false);
  };

  return (
    <div className="st-subpage">
      <div className="st-subpage-header">
        <button className="st-back-btn" onClick={onBack}>
          <i className="bx bx-arrow-back" />
        </button>
        <div className="st-subpage-icon" style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)" }}>
          <i className="bx bx-lock-alt" style={{ color: "#a78bfa" }} />
        </div>
        <div>
          <h2 className="st-subpage-title">Privacy</h2>
          <p className="st-subpage-sub">Control who can see your profile</p>
        </div>
      </div>

      <div className="st-section">
        <p className="st-section-label">ACCOUNT VISIBILITY</p>
        <div className="st-card st-card-list">
          <div className="st-toggle-row" onClick={handleToggle}>
            <div className="st-toggle-icon">
              <i className={`bx ${isPrivate ? "bx-lock-alt" : "bx-globe"}`} />
            </div>
            <div className="st-toggle-text">
              <span className="st-toggle-label">Private Account</span>
              <span className="st-toggle-desc">
                {isPrivate
                  ? "Only approved followers can see your profile and posts"
                  : "Anyone can see your profile and follow you"}
              </span>
            </div>
            {saving ? (
              <i className="bx bx-loader-alt bx-spin" style={{ color: "#a78bfa", fontSize: 20 }} />
            ) : (
              <div className={`st-switch${isPrivate ? " st-switch--on" : ""}`}>
                <div className="st-switch-knob" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="st-section">
        <div className="st-card">
          <div className="st-info-row">
            <i className="bx bx-info-circle" style={{ color: "#a78bfa" }} />
            <div>
              <p className="st-info-title">What does private mean?</p>
              <p className="st-info-desc">
                When your account is private, people must send a follow request before they can see your profile. Existing followers are not affected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "#1a1a1a", border: "1px solid #333", borderRadius: 10, padding: "10px 18px", color: "#a78bfa", fontSize: 13, zIndex: 999, whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Main Settings page ───────────────────────────────────
const SETTINGS_MENU = [
  {
    id: "account",
    icon: "bx-user-circle",
    label: "Account Center",
    desc: "Email, phone, password & account deletion",
  },
  {
    id: "privacy",
    icon: "bx-lock-alt",
    label: "Privacy",
    desc: "Control who can see your profile and posts",
  },
  {
    id: "notifications",
    icon: "bx-bell",
    label: "Notifications",
    desc: "Choose what you get notified about",
  },
  {
    id: "blocked",
    icon: "bx-block",
    label: "Blocked Profiles",
    desc: "View and manage blocked users",
  },
  {
    id: "archive",
    icon: "bx-archive",
    label: "Archive & Download",
    desc: "Download your data or view archived posts",
  },
  {
    id: "feedback",
    icon: "bx-message-square-dots",
    label: "Feedback",
    desc: "Rate the app and suggest improvements",
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);

  if (active === "account")
    return <AccountCenter onBack={() => setActive(null)} />;
  if (active === "privacy")
    return <PrivacySettings onBack={() => setActive(null)} />;
  if (active === "notifications")
    return <NotificationSettings onBack={() => setActive(null)} />;
  if (active === "blocked")
    return <BlockedProfiles onBack={() => setActive(null)} />;
  if (active === "archive")
    return <ArchiveDownload onBack={() => setActive(null)} />;
  if (active === "feedback")
    return <FeedbackPage onBack={() => setActive(null)} />;

  return (
    <div className="st-wrapper">
      <div className="st-header">
        <button className="st-back-btn" onClick={() => navigate(-1)}>
          <i className="bx bx-arrow-back" />
        </button>
        <div>
          <h1 className="st-title">Settings</h1>
          <p className="st-subtitle">Manage your account & preferences</p>
        </div>
      </div>

      <div className="st-menu-list">
        {SETTINGS_MENU.map((item) => (
          <div
            key={item.id}
            className="st-menu-row"
            onClick={() => setActive(item.id)}
          >
            <i className={`bx ${item.icon} st-menu-icon-plain`} />
            <div className="st-menu-text">
              <span className="st-menu-label">{item.label}</span>
              <span className="st-menu-desc">{item.desc}</span>
            </div>
            <i className="bx bx-chevron-right st-menu-arrow" />
          </div>
        ))}
      </div>
    </div>
  );
}