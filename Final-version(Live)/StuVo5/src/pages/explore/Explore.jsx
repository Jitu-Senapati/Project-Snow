import { useState, useEffect, useRef, useCallback } from "react";
import "boxicons/css/boxicons.min.css";
import "../../styles/explore.css";

/* ─── Data ─────────────────────────────────────────────── */
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

/* ─── Skeleton ───────────────────────────────────────────── */
function ExplorerSkeleton() {
  return (
    <div className="explorer-skeleton">
      <div className="skeleton-section-header">
        <div className="skeleton-line" />
        <div className="skeleton-title-block" />
        <div className="skeleton-line" />
      </div>
      <div className="skeleton-carousel">
        <div className="skeleton-card skeleton-card-side" />
        <div className="skeleton-card skeleton-card-main">
          <div className="skeleton-card-img" />
          <div className="skeleton-card-info">
            <div className="skeleton-text skeleton-text-sm" />
            <div className="skeleton-text skeleton-text-lg" />
            <div className="skeleton-text skeleton-text-md" />
          </div>
        </div>
        <div className="skeleton-card skeleton-card-side" />
      </div>
      <div className="skeleton-dots">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`skeleton-dot${i === 2 ? " active" : ""}`} />
        ))}
      </div>
      <div className="skeleton-section-header" style={{ marginTop: 32 }}>
        <div className="skeleton-line" />
        <div className="skeleton-title-block" />
        <div className="skeleton-line" />
      </div>
      <div className="skeleton-notices">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-notice-item">
            <div className="skeleton-text skeleton-text-lg" />
            <div className="skeleton-text skeleton-text-md" />
            <div className="skeleton-text skeleton-text-sm" />
          </div>
        ))}
      </div>
      <div className="skeleton-quick-access" />
    </div>
  );
}

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

  useEffect(() => {
    const apply = () => setTx(calcTx(current));
    // Fire multiple times to ensure correct position after layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(apply);
      });
    });
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

/* ─── Explorer Content (separate component so carousel mounts fresh) ── */
function ExplorerContent() {
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

  const toggleBookmark = (id, e) => {
    e.stopPropagation();
    setSavedCards((p) => ({ ...p, [id]: !p[id] }));
  };
  const handleImgLoad = (id) => setLoadedImgs((p) => ({ ...p, [id]: true }));

  return (
    <>
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
    </>
  );
}

/* ─── Main Export ────────────────────────────────────────── */
export default function Explorer() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  /* Key trick: when loading switches to false, ExplorerContent
     mounts as a brand new component with fresh refs and correct
     layout dimensions — no glitch possible */
  if (loading) return <ExplorerSkeleton />;
  return <ExplorerContent />;
}
