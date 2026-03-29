import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import "../styles/explore.css";
import { signOutUser } from "../firebase/auth";

const NAV_ITEMS = [
  { id: "explorer", icon: "bx-compass", label: "Explorer", path: "/explore", isMore: false },
  { id: "bus", icon: "bx-bus", label: "Bus", path: "/bus", isMore: false },
  { id: "more", icon: "bx-dots-horizontal-rounded", label: "More", isMore: true },
  { id: "chat", icon: "bx-message-rounded-dots", label: "Chat", path: "/chat", isMore: false },
  { id: "profile", icon: "bx-user-circle", label: "Profile", path: "/profile", isMore: false },
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

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openPanel, setOpenPanel] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutToast, setLogoutToast] = useState(false);
  const menuButtonRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("installBannerShown");
    if (alreadyShown) return;
    const t = setTimeout(() => {
      setBannerVisible(true);
      sessionStorage.setItem("installBannerShown", "true");
    }, 600);
    return () => clearTimeout(t);
  }, []);

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

  const togglePanel = (name, e) => { e.stopPropagation(); setOpenPanel((p) => (p === name ? null : name)); };
  const handleNavClick = (item) => { if (item.isMore) setExplorerOpen(true); else navigate(item.path); };
  const handleLogoutClick = () => { setOpenPanel(null); setLogoutConfirmOpen(true); };

  const handleLogoutConfirm = async () => {
    setLogoutConfirmOpen(false);
    setLogoutToast(true);
    setTimeout(async () => {
      sessionStorage.removeItem("installBannerShown"); // ← add this
      await signOutUser();
      setLogoutToast(false);
      navigate("/login");
    }, 2000);
  };

  const handleLogoutCancel = () => setLogoutConfirmOpen(false);

  return (
    <div className="main-app">
      {/* HEADER */}
      <div className="app-header">
        <div className="app-logo">STUVO5</div>
        <div className="header-icons">
          <i className="bx bx-bell" onClick={(e) => togglePanel("notif", e)} />
          <i ref={menuButtonRef} className="bx bx-menu" onClick={(e) => togglePanel("menu", e)} />
        </div>

        <div className={`notification-panel${openPanel === "notif" ? " active" : ""}`} onClick={(e) => e.stopPropagation()}>
          {[
            { icon: "bx-bus", title: "Bus #101", body: "Arriving in 5 minutes" },
            { icon: "bx-calendar", title: "New Event", body: "Tech Fest starts tomorrow" },
            { icon: "bx-book", title: "Attendance Updated", body: "Your attendance has been updated" },
          ].map((n, i) => (
            <div className="notification-item" key={i}>
              <i className={`bx ${n.icon}`} />
              <div className="notif-text"><strong>{n.title}</strong><p>{n.body}</p></div>
            </div>
          ))}
          <div className="notification-footer">View all notifications</div>
        </div>

        <div
          className={`menu-panel${openPanel === "menu" ? " active" : ""}`}
          onClick={(e) => e.stopPropagation()}
          style={window.innerWidth <= 480 ? { position: "fixed", top: `${menuPosition.top}px`, right: `${menuPosition.right}px`, left: "auto", width: "180px" } : {}}
        >
          {[
            { icon: "bx-cog", label: "Settings" },
            { icon: "bx-message-dots", label: "Feedback" },
            { icon: "bx-help-circle", label: "Help" },
          ].map((m, i) => (
            <div className="menu-item" key={i}><i className={`bx ${m.icon}`} /><span>{m.label}</span></div>
          ))}
          <div className="menu-item logout" onClick={handleLogoutClick}>
            <i className="bx bx-log-out" /><span>Logout</span>
          </div>
        </div>
      </div>

      {/* PAGE CONTENT */}
      <div className="page-content active">
        <Outlet />
      </div>

      {/* INSTALL BANNER */}
      {bannerVisible && (
        <div className="install-banner-wrap">
          <span className="install-text">Install this site as an app</span>
          <button className="install-btn" onClick={() => { alert("To install STUVO5:\n\n• Chrome/Edge: click ⊕ in address bar\n• Chrome Android: tap ⋮ → Add to Home Screen\n• Safari iPhone: tap Share ↑ → Add to Home Screen"); setBannerVisible(false); }}>Install</button>
          <button className="install-close" onClick={() => setBannerVisible(false)}><i className="bx bx-x" /></button>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <div key={item.id}
            className={`nav-item${item.isMore ? explorerOpen ? " active" : "" : location.pathname === item.path ? " active" : ""}`}
            onClick={() => handleNavClick(item)}
          >
            <div className="nav-icon-wrap"><i className={`bx ${item.icon}`} /></div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* MORE SHEET */}
      <div className={`explorer-overlay${explorerOpen ? " active" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) setExplorerOpen(false); }}>
        <div className="explorer-sheet">
          <div className="explorer-sheet-header">
            <h2 className="browse-title">BROWSE BY</h2>
            <i className="bx bx-x explorer-close" onClick={() => setExplorerOpen(false)} />
          </div>
          <div className="browse-grid">
            {BROWSE_ITEMS.map((item, i) => (
              <div className="browse-card" key={i}><i className={`bx ${item.icon}`} /><span>{item.label}</span></div>
            ))}
          </div>
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