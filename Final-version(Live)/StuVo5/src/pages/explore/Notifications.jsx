import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeToNotifications } from "../../firebase/db";
import "../../styles/notifications.css";

/* ── Icon mapping by notification type ─────────────────── */
const ICON_MAP = {
  notice:     "bx bx-bell",
  event:      "bx bx-calendar-event",
  bus:        "bx bx-bus",
  attendance: "bx bx-calendar-check",
  placement:  "bx bx-briefcase-alt-2",
  chat:       "bx bx-message-rounded-dots",
  system:     "bx bx-info-circle",
};

const getIcon = (type) => ICON_MAP[type] || ICON_MAP.notice;

/* ── Time formatting helpers ───────────────────────────── */
const isToday = (d) => {
  const now = new Date();
  return d.getDate() === now.getDate() &&
         d.getMonth() === now.getMonth() &&
         d.getFullYear() === now.getFullYear();
};

const isYesterday = (d) => {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.getDate() === y.getDate() &&
         d.getMonth() === y.getMonth() &&
         d.getFullYear() === y.getFullYear();
};

const isThisWeek = (d) => {
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  return d >= weekAgo && !isToday(d) && !isYesterday(d);
};

const formatTime = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (d) =>
  d.toLocaleDateString([], { day: "numeric", month: "short" });

/* ── Group notifications by date bucket ────────────────── */
function groupNotifications(list) {
  const groups = { Today: [], Yesterday: [], "This Week": [], Earlier: [] };

  list.forEach((n) => {
    const d = n.createdAt?.toDate?.() || new Date(n.createdAt);
    if (isToday(d)) groups.Today.push(n);
    else if (isYesterday(d)) groups.Yesterday.push(n);
    else if (isThisWeek(d)) groups["This Week"].push(n);
    else groups.Earlier.push(n);
  });

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

/* ══════════════════════════════════════════════════════════
   Notifications Page
   ══════════════════════════════════════════════════════════ */
const NOTIF_DEST = {
  notice:     { path: "/explore", scrollTo: "notices" },
  event:      { path: "/explore", scrollTo: "events" },
  bus:        { path: "/bus",     scrollTo: null },
  attendance: { path: "/explore", scrollTo: null },
  placement:  { path: "/explore", scrollTo: "placements" },
  system:     { path: "/explore", scrollTo: null },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToNotifications(60, (data) => {
      setNotifications(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const grouped = groupNotifications(notifications);

  return (
    <div className="notif-page">
      {/* Header */}
      <div className="notif-page-header">
        <button className="notif-back-btn" onClick={() => navigate(-1)}>
          <i className="bx bx-arrow-back" />
        </button>
        <h1 className="notif-page-title">Notifications</h1>
      </div>

      {/* Content */}
      <div className="notif-page-body">
        {loading ? (
          <div className="notif-loading">
            {[...Array(6)].map((_, i) => (
              <div className="notif-skeleton" key={i}>
                <div className="notif-skel-icon" />
                <div className="notif-skel-text">
                  <div className="notif-skel-line w60" />
                  <div className="notif-skel-line w90" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <i className="bx bx-bell-off" />
            <p>No notifications yet</p>
            <span>When you get notifications, they'll show up here</span>
          </div>
        ) : (
          grouped.map(([label, items]) => (
            <div className="notif-group" key={label}>
              <div className="notif-group-label">{label}</div>
              {items.map((n) => {
                const d = n.createdAt?.toDate?.() || new Date(n.createdAt);
                return (
                  <div
                    className="notif-row"
                    key={n.id}
                    onClick={() => {
                      const dest = NOTIF_DEST[n.type] || NOTIF_DEST.notice;
                      navigate(dest.path, dest.scrollTo ? { state: { scrollTo: dest.scrollTo } } : undefined);
                    }}
                  >
                    {n.type === "event" && n.imageUrl ? (
                      <div className="notif-row-thumb">
                        <img src={n.imageUrl} alt="" />
                      </div>
                    ) : (
                      <div className={`notif-row-icon type-${n.type || "notice"}`}>
                        <i className={getIcon(n.type)} />
                      </div>
                    )}
                    <div className="notif-row-content">
                      <strong>{n.title}</strong>
                      <p>{n.body}</p>
                    </div>
                    <span className="notif-row-time">
                      {isToday(d) ? formatTime(d) : formatDate(d)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}