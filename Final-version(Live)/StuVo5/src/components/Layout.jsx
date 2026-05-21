import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import "../styles/explore.css";
import "../styles/notifications.css";
import { signOutUser } from "../firebase/auth";
import { removeFcmToken } from "../firebase/db";
import { subscribeToNotifications } from "../firebase/db";
import { getDeviceKey } from "../firebase/messaging";
import { useAuth } from "../context/AuthContext";
import SearchExplore from "../pages/explore/Search";
import NotificationPrompt from "./NotificationPrompt";

const NAV_ITEMS = [
  { id: "explorer", icon: "bx-compass", label: "Explorer", path: "/explore", isMore: false },
  { id: "bus", icon: "bx-bus", label: "Bus", path: "/bus", isMore: false },
  { id: "more", icon: "bx-dots-horizontal-rounded", label: "More", isMore: true },
  { id: "chat", icon: "bx-message-rounded-dots", label: "Chat", path: "/chats", isMore: false },
  { id: "profile", icon: "bx-user-circle", label: "Profile", path: "/profile", isMore: false },
];

const BROWSE_ITEMS = [
  { icon: "bx-book-open", label: "Syllabus", path: "/syllabus", name: "Syllabus" },
  { icon: "bx-calendar-check", label: "Attendance", path: "/attendance", name: "Attendance" },
  { icon: "bx-food-menu", label: "Cafeteria", path: "/cafeteria", name: "Cafeteria" },
  { icon: "bx-briefcase", label: "Placements", path: "/placements", name: "Placements" },
  { icon: "bx-user-voice", label: "Faculty", path: "/faculty", name: "Faculty" },
  { icon: "bx-library", label: "Library", path: "/library", name: "Library" },
  { icon: "bx-search-alt-2", label: "Lost & Found", path: "/lost-found", name: "Lost & Found" },
  { icon: "bx-message-error", label: "Raise Complaint", path: "/complaint", name: "Raise Complaint" },
  { icon: "bx-donate-heart", label: "Support Us", path: "/support-us", name: "Support Us" },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin } = useAuth();

  const [openPanel, setOpenPanel] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutToast, setLogoutToast] = useState(false);
  const menuButtonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [panelNotifs, setPanelNotifs] = useState([]);
  const [allNotifs, setAllNotifs] = useState([]);
  const [notifsLoaded, setNotifsLoaded] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState(
    () => Number(localStorage.getItem("stuvo5_notif_last_seen") || 0)
  );

  // ── Suppress Android autofill bar on all text inputs globally ──
  useEffect(() => {
    const suppress = (e) => {
      const el = e.target;
      if (el.tagName === "INPUT" && !el.dataset.keepAutofill) {
        const t = el.type;
        if (t === "text" || t === "search" || t === "" || !t) {
          el.setAttribute("autocomplete", "off");
        }
      }
    };
    document.addEventListener("focusin", suppress, true);
    return () => document.removeEventListener("focusin", suppress, true);
  }, []);

  // ── Subscribe to latest notifications for the dropdown ──
  useEffect(() => {
    const unsub = subscribeToNotifications(7, (data) => {
      setAllNotifs(data);
      setPanelNotifs(data.slice(0, 5));
      setNotifsLoaded(true);
    });
    return unsub;
  }, []);

  // Install prompt — show banner after delay + use globally captured prompt
  useEffect(() => {
    // Hide forever if already running as installed PWA
    if (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone) {
      return;
    }

    // Respect 7-day dismissal
    const dismissedAt = parseInt(localStorage.getItem("stuvo5_install_dismissed_at") || "0", 10);
    const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    const isDismissed = dismissedAt && daysSince < 7;

    if (!isDismissed) {
      // Pick up any prompt already captured by main.jsx
      if (window.__stuvo5InstallPrompt) setDeferredPrompt(window.__stuvo5InstallPrompt);

      const t = setTimeout(() => setBannerVisible(true), 600);

      // If the install event fires AFTER mount, update state
      const onAvailable = () => setDeferredPrompt(window.__stuvo5InstallPrompt);
      const onInstalled = () => {
        setBannerVisible(false);
        setDeferredPrompt(null);
        localStorage.removeItem("stuvo5_install_dismissed_at");
      };

      window.addEventListener("stuvo5:installAvailable", onAvailable);
      window.addEventListener("stuvo5:installed", onInstalled);
      return () => {
        clearTimeout(t);
        window.removeEventListener("stuvo5:installAvailable", onAvailable);
        window.removeEventListener("stuvo5:installed", onInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    // Best case — browser supports native install prompt (Chrome/Edge desktop + Android)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setBannerVisible(false);
      if (outcome !== "accepted") {
        localStorage.setItem("stuvo5_install_dismissed_at", String(Date.now()));
      }
      return;
    }
    // Fallback for iOS Safari, Firefox, and others that don't fire beforeinstallprompt
    alert("To install STUVO5:\n\n• Chrome/Edge: click ⊕ in address bar\n• Chrome Android: tap ⋮ → Add to Home Screen\n• Safari iPhone: tap Share ↑ → Add to Home Screen");
    setBannerVisible(false);
    localStorage.setItem("stuvo5_install_dismissed_at", String(Date.now()));
  };

  const handleInstallDismiss = () => {
    localStorage.setItem("stuvo5_install_dismissed_at", String(Date.now()));
    setBannerVisible(false);
  };

  useEffect(() => {
    const handler = () => setOpenPanel(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (openPanel === "menu" && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
  }, [openPanel]);

  // Close search overlay on route change
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  const togglePanel = (name, e) => {
    e.stopPropagation();
    setSearchOpen(false);
    setOpenPanel((p) => {
      const opening = p !== name;
      if (name === "notif" && opening) {
        const now = Date.now();
        localStorage.setItem("stuvo5_notif_last_seen", String(now));
        setLastSeenAt(now);
      }
      return opening ? name : null;
    });
  };

  const handleNavClick = (item) => {
    if (item.isMore) {
      setExplorerOpen((prev) => !prev);
    } else {
      setExplorerOpen(false);
      navigate(item.path);
    }
  };

  const handleBrowseCardClick = (item) => {
    setExplorerOpen(false);
    if (item.path) navigate(item.path, { state: { name: item.name } });
  };

  const handleLogoutClick = () => { setOpenPanel(null); setLogoutConfirmOpen(true); };

  const handleLogoutConfirm = async () => {
    setLogoutConfirmOpen(false);
    setLogoutToast(true);
    const uid = currentUser?.uid;
    const deviceKey = getDeviceKey(); // screen-based physical device ID
    setTimeout(async () => {
      try {
        if (uid && deviceKey) {
          await removeFcmToken(uid, deviceKey);
          localStorage.removeItem("stuvo5_fcm_token");
        }
      } catch (err) {
        console.error("FCM cleanup on logout:", err);
      }
      await signOutUser();
      setLogoutToast(false);
      navigate("/login");
    }, 2000);
  };

  const handleLogoutCancel = () => setLogoutConfirmOpen(false);

  const isNavActive = (item) => {
    if (explorerOpen) return item.isMore;
    if (item.isMore) return false;
    if (item.id === "explorer") {
      return location.pathname === "/explore" || location.pathname === "/admin-explore";
    }
    if (item.id === "chat") {
      return location.pathname.startsWith("/chat");
    }
    return location.pathname === item.path;
  };

  const isNotifOpen = openPanel === "notif";
  const isMenuOpen = openPanel === "menu";

  return (
    <div className="main-app">
      {/* HEADER */}
      <div className="app-header">
        <div className="app-logo">
          STUVO5
          {isAdmin && (
            <span className="admin-badge">Admin</span>
          )}
        </div>

        <div className="header-icons">
          {/* Search */}
          <span
            className={`hdr-icon-wrap${searchOpen ? " hdr-icon-wrap--open" : ""}`}
            onClick={() => { setSearchOpen((p) => !p); setOpenPanel(null); }}
          >
            <i className="bx bx-search hdr-icon hdr-icon--default" />
            <i className="bx bx-x hdr-icon hdr-icon--close" />
          </span>

          {/* Bell */}
          <span
            className={`hdr-icon-wrap${isNotifOpen ? " hdr-icon-wrap--open" : ""}`}
            onClick={(e) => togglePanel("notif", e)}
          >
            <i className="bx bx-bell hdr-icon hdr-icon--default" />
            <i className="bx bx-x hdr-icon hdr-icon--close" />
            {(() => {
              const count = allNotifs.filter((n) => {
                const ts = n.createdAt?.toMillis?.() ?? (n.createdAt?.seconds * 1000) ?? 0;
                return ts > lastSeenAt;
              }).length;
              if (count === 0 || isNotifOpen) return null;
              return <span className="notif-badge">{count > 9 ? "9+" : count}</span>;
            })()}
          </span>

          {/* Menu */}
          <span
            ref={menuButtonRef}
            className={`hdr-icon-wrap${isMenuOpen ? " hdr-icon-wrap--open" : ""}`}
            onClick={(e) => togglePanel("menu", e)}
          >
            <i className="bx bx-menu hdr-icon hdr-icon--default" />
            <i className="bx bx-x hdr-icon hdr-icon--close" />
          </span>
        </div>

        {/* Notification panel */}
        <div className={`notification-panel${isNotifOpen ? " active" : ""}`} onClick={(e) => e.stopPropagation()}>
          <div className="notif-panel-header">Notifications</div>
          <div className="notif-panel-list">
            {!notifsLoaded ? (
              <div className="notif-panel-empty">
                <i className="bx bx-loader-alt bx-spin" />
                <span>Loading…</span>
              </div>
            ) : panelNotifs.length === 0 ? (
              <div className="notif-panel-empty">
                <i className="bx bx-bell-off" />
                <span>No notifications yet</span>
              </div>
            ) : (
              (() => {
                // ── Shared destination map ───────────────────────────
                const NOTIF_DEST = {
                  notice:         { path: "/explore", scrollTo: "notices" },
                  event:          { path: "/explore", scrollTo: "events" },
                  event_reminder: { path: "/explore", scrollTo: "events" },
                  bus:        { path: "/bus",     scrollTo: null },
                  attendance: { path: "/explore", scrollTo: null },
                  placement:  { path: "/explore", scrollTo: "placements" },
                  system:     { path: "/explore", scrollTo: null },
                };
                const iconMap = {
                  notice: "bx-bell", event: "bx-calendar-event", event_reminder: "bx-bookmark-alt", bus: "bx-bus",
                  attendance: "bx-calendar-check", placement: "bx-briefcase-alt-2", system: "bx-info-circle",
                };

                // ── Group by date bucket ──────────────────────────────
                const now = new Date();
                const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const startOfYesterday = new Date(startOfToday - 86400000);
                const startOfWeek = new Date(startOfToday - 6 * 86400000);

                const buckets = {};
                panelNotifs.forEach((n) => {
                  const d = n.createdAt?.toDate?.() || new Date(n.createdAt);
                  const label = d >= startOfToday ? "Today"
                    : d >= startOfYesterday ? "Yesterday"
                    : d >= startOfWeek ? "This Week"
                    : "Earlier";
                  if (!buckets[label]) buckets[label] = [];
                  buckets[label].push(n);
                });
                const ORDER = ["Today", "Yesterday", "This Week", "Earlier"];
                const groups = ORDER.filter((l) => buckets[l]);

                return groups.map((label) => (
                  <div key={label}>
                    <div className="notif-panel-group-label">{label}</div>
                    {buckets[label].map((n) => {
                      const d = n.createdAt?.toDate?.() || new Date(n.createdAt);
                      const diff = Date.now() - d.getTime();
                      const mins = Math.floor(diff / 60000);
                      const hrs  = Math.floor(diff / 3600000);
                      const days = Math.floor(diff / 86400000);
                      const ago  = mins < 1 ? "now" : mins < 60 ? `${mins}m` : hrs < 24 ? `${hrs}h` : `${days}d`;
                      const dest = NOTIF_DEST[n.type] || NOTIF_DEST.notice;
                      return (
                        <div
                          className="notif-panel-item"
                          key={n.id}
                          onClick={() => {
                            setOpenPanel(null);
                            navigate(dest.path, dest.scrollTo ? { state: { scrollTo: dest.scrollTo } } : undefined);
                          }}
                        >
                          {(n.type === "event" || n.type === "event_reminder") && n.imageUrl ? (
                            <div className="notif-panel-thumb">
                              <img src={n.imageUrl} alt="" />
                            </div>
                          ) : (
                            <div className="notif-panel-icon">
                              <i className={`bx ${iconMap[n.type] || "bx-bell"}`} />
                            </div>
                          )}
                          <div className="notif-panel-text">
                            <strong>{n.title}</strong>
                            <p>{n.body}</p>
                          </div>
                          <span className="notif-panel-time">{ago}</span>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()
            )}
          </div>
          <div
            className="notif-panel-footer"
            onClick={() => { setOpenPanel(null); navigate("/notifications"); }}
          >
            View all notifications
          </div>
        </div>

        {/* Menu panel */}
        <div
          className={`menu-panel${isMenuOpen ? " active" : ""}`}
          onClick={(e) => e.stopPropagation()}
          style={window.innerWidth <= 480 ? { position: "fixed", top: `${menuPosition.top}px`, right: `${menuPosition.right}px`, left: "auto", width: "180px" } : {}}
        >
          <div className="menu-item" onClick={() => { setOpenPanel(null); navigate("/settings"); }}>
            <i className="bx bx-cog" /><span>Settings</span>
          </div>
          <div className="menu-item">
            <i className="bx bx-help-circle" /><span>Help</span>
          </div>
          <div className="menu-item logout" onClick={handleLogoutClick}>
            <i className="bx bx-log-out" /><span>Logout</span>
          </div>
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className={`page-content active${explorerOpen || searchOpen ? " content-blurred" : ""}`}>
        <Outlet />
      <NotificationPrompt />
      </div>

      {/* INSTALL BANNER */}
      {bannerVisible && (
        <div className="install-banner-wrap">
          <span className="install-text">Install this site as an app</span>
          <button className="install-btn" onClick={handleInstallClick}>Install</button>
          <button className="install-close" onClick={handleInstallDismiss}><i className="bx bx-x" /></button>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-item${isNavActive(item) ? " active" : ""}`}
            onClick={() => handleNavClick(item)}
          >
            <div className="nav-icon-wrap">
              {item.isMore ? (
                <i
                  className={`bx ${explorerOpen ? "bx-x" : "bx-dots-horizontal-rounded"}`}
                  style={{ display: "inline-block", transition: "transform 0.25s ease", transform: explorerOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                />
              ) : (
                <i className={`bx ${item.icon}`} />
              )}
            </div>
            <span>{item.isMore ? (explorerOpen ? "Close" : "More") : item.label}</span>
          </div>
        ))}
      </div>

      {/* MORE SHEET */}
      <div className={`explorer-overlay${explorerOpen ? " active" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setExplorerOpen(false); }}>
        <div className="explorer-sheet">
          <div className="explorer-sheet-header">
            <h2 className="browse-title">BROWSE BY</h2>
          </div>
          <div className="browse-grid">
            {BROWSE_ITEMS.map((item, i) => (
              <div className="browse-card" key={i} onClick={() => handleBrowseCardClick(item)}>
                <i className={`bx ${item.icon}`} /><span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SEARCH OVERLAY */}
      <div
        className={`search-overlay${searchOpen ? " search-overlay--open" : ""}`}
        onClick={() => setSearchOpen(false)}
      >
        <div className="search-overlay-box" onClick={(e) => e.stopPropagation()}>
          <SearchExplore onClose={() => setSearchOpen(false)} />
        </div>
      </div>

      {/* LOGOUT MODAL */}
      {logoutConfirmOpen && (
        <div className="layout-modal-overlay" onClick={handleLogoutCancel}>
          <div className="layout-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="layout-confirm-icon"><i className="bx bx-log-out" /></div>
            <h3>Logout?</h3>
            <p>Are you sure you want to logout from STUVO5?</p>
            <div className="layout-confirm-actions">
              <button className="layout-cancel-btn" onClick={handleLogoutCancel}>Cancel</button>
              <button className="layout-logout-btn" onClick={handleLogoutConfirm}>Yes, Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT TOAST */}
      {logoutToast && (
        <div className="layout-toast">
          <i className="bx bx-check-circle" />
          <span>Logged out successfully!</span>
        </div>
      )}
    </div>
  );
}