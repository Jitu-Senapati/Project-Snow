import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { signOutUser } from "../../firebase/auth";
import "boxicons/css/boxicons.min.css";
import "../../styles/Explore.css";

/* ─── Data ──────────────────────────────────────────────── */
const EVENTS = [
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

const NOTICES = [
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

// ✅ Fix 1: Correct nav order — Explorer, Bus, More, Chat, Profile
// "More" is now a proper nav item in the right position (index 2)
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

/* ─── Carousel Hook ─────────────────────────────────────── */
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
      const cw = cardW();
      const step = cw + gapPx();
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

  // init + resize
  useEffect(() => {
    const apply = () => setTx(calcTx(current));
    requestAnimationFrame(() => requestAnimationFrame(apply));
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [current, calcTx]);

  // keyboard
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

  // ✅ Fix 2: dragDelta wrapped in useCallback so it doesn't recreate every render
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

/* ─── Component ─────────────────────────────────────────── */
export default function Explorer() {
  // ✅ Fix 3: Removed unused useNavigate import and usage
  const [activeNav, setActiveNav] = useState("home");
  const [openPanel, setOpenPanel] = useState(null);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [savedCards, setSavedCards] = useState({});
  const [loadedImgs, setLoadedImgs] = useState({});

  const total = EVENTS.length % 2 === 0 ? EVENTS.length - 1 : EVENTS.length;
  const events = EVENTS.slice(0, total);

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

  // ✅ Fix 4: Added [onDragMove, onDragEnd] as deps so listeners are stable
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
    if (item.isMore) {
      setExplorerOpen(true);
    } else {
      setActiveNav(item.id);
    }
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOutUser();
    navigate("/login");
  };

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
          <div className="menu-item logout" onClick={handleLogout}>
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
            <h2 className="section-title">In The Spotlight</h2>
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
              {events.map((ev, i) => (
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
              {events.map((_, i) => (
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
            <h2 className="section-title">Notices</h2>
            <div className="header-line" />
          </div>
          <div className="notices-list">
            {NOTICES.map((n) => (
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
      {/* ✅ Fix 1: All nav items in one map, More is in correct middle position */}
      <div className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`nav-item${item.isMore
                ? explorerOpen
                  ? " active"
                  : ""
                : activeNav === item.id
                  ? " active"
                  : ""
              }`}
            onClick={() => handleNavClick(item)}
          >
            <div className="nav-icon-wrap">
              <i className={`bx ${item.icon}`} />
            </div>
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ══ EXPLORER / MORE SHEET ══ */}
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
