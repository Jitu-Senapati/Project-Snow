import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import "../styles/explore.css";
import { signOutUser } from "../firebase/auth";
import { useAuth } from "../context/AuthContext";
import SearchExplore from "../pages/explore/Search";

const NAV_ITEMS = [
  { id: "explorer", icon: "bx-compass", label: "Explorer", path: "/explore", isMore: false },
  { id: "bus", icon: "bx-bus", label: "Bus", path: "/bus", isMore: false },
  { id: "more", icon: "bx-dots-horizontal-rounded", label: "More", isMore: true },
  { id: "chat", icon: "bx-message-rounded-dots", label: "Chat", path: "/chats", isMore: false },
  { id: "profile", icon: "bx-user-circle", label: "Profile", path: "/profile", isMore: false },
];

const BROWSE_ITEMS = [
  { icon: "bx-donate-heart", label: "Support Us", path: "/support-us", name: "Support Us" },
  { icon: "bx-book-open", label: "Syllabus", path: "/syllabus", name: "Syllabus" },
  { icon: "bx-message-error", label: "Raise Complaint", path: "/complaint", name: "Raise Complaint" },
  { icon: "bx-group", label: "Clubs", path: "/clubs", name: "Clubs" },
  { icon: "bx-briefcase", label: "Placements", path: "/placements", name: "Placements" },
  { icon: "bx-building", label: "Facilities", path: "/facilities", name: "Facilities" },
  { icon: "bx-bus", label: "Transport", path: "/transport", name: "Transport" },
  { icon: "bx-food-menu", label: "Cafeteria", path: "/cafeteria", name: "Cafeteria" },
  { icon: "bx-library", label: "Library", path: "/library", name: "Library" },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const [openPanel, setOpenPanel] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  // Close search overlay on route change
  useEffect(() => {
    setSearchOpen(false);
  }, [location.pathname]);

  const togglePanel = (name, e) => {
    e.stopPropagation();
    setSearchOpen(false);
    setOpenPanel((p) => (p === name ? null : name));
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
    setTimeout(async () => {
      sessionStorage.removeItem("installBannerShown");
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
          {isAdmin && location.pathname === "/admin-explore" && (
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
      </div>

      {/* INSTALL BANNER */}
      {bannerVisible && (
        <div className="install-banner-wrap">
          <span className="install-text">Install this site as an app</span>
          <button className="install-btn" onClick={() => { alert("To install STUVO5:\n\n• Chrome/Edge: click \u2295 in address bar\n• Chrome Android: tap \u22EE \u2192 Add to Home Screen\n• Safari iPhone: tap Share \u2191 \u2192 Add to Home Screen"); setBannerVisible(false); }}>Install</button>
          <button className="install-close" onClick={() => setBannerVisible(false)}><i className="bx bx-x" /></button>
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