import { useState, useEffect, useRef, useCallback } from "react";
import "boxicons/css/boxicons.min.css";
import "../../styles/explore.css";
import { subscribeToEvents, subscribeToNotices, toggleBookmark } from "../../firebase/db";
import { useAuth } from "../../context/AuthContext";
import { timeAgo } from "./AdminExplore";

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

  const calcTx = useCallback((i) => {
    const vw = carouselRef.current?.clientWidth || window.innerWidth;
    const cw = cardW();
    const step = cw + gapPx();
    return vw / 2 - (i * step + cw / 2);
  }, [cardW, gapPx]);

  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= total) return;
    setCurrent(idx);
    setTx(calcTx(idx));
  }, [total, calcTx]);

  useEffect(() => {
    const apply = () => setTx(calcTx(current));
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(apply)));
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

  const onDragStart = useCallback((x) => {
    dragRef.current = { startX: x, delta: 0, baseTx: calcTx(current), t0: Date.now() };
    setDragging(true);
  }, [calcTx, current]);

  const onDragMove = useCallback((x) => {
    if (!dragging) return;
    let d = x - dragRef.current.startX;
    dragRef.current.delta = d;
    if ((current === 0 && d > 0) || (current === total - 1 && d < 0)) d *= 0.2;
    setTx(dragRef.current.baseTx + d);
  }, [dragging, current, total]);

  const onDragEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const { delta, t0 } = dragRef.current;
    const elapsed = Date.now() - t0 || 1;
    const velocity = Math.abs(delta) / elapsed;
    const threshold = cardW() / 4;
    const isFlick = velocity > 0.35 && Math.abs(delta) > 25;
    if ((delta < -threshold || (isFlick && delta < 0)) && current < total - 1) goTo(current + 1);
    else if ((delta > threshold || (isFlick && delta > 0)) && current > 0) goTo(current - 1);
    else goTo(current);
  }, [dragging, current, total, cardW, goTo]);

  const dragDelta = useCallback(() => dragRef.current.delta, []);

  return { current, tx, dragging, goTo, carouselRef, trackRef, onDragStart, onDragMove, onDragEnd, dragDelta };
}

/* ─── Explorer Content ───────────────────────────────────── */
function ExplorerContent({ events, notices, userBookmarks, uid }) {
  const [loadedImgs, setLoadedImgs] = useState({});
  const [pendingBookmark, setPendingBookmark] = useState(null);

  const total = events.length;
  const displayEvents = events;

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

  const handleBookmark = async (ev, e) => {
    e.stopPropagation();
    if (!ev.serial || pendingBookmark === ev.serial) return;
    const isBookmarked = userBookmarks.includes(ev.serial);
    setPendingBookmark(ev.serial);
    try {
      await toggleBookmark(uid, ev.serial, ev.id, isBookmarked);
    } catch (err) {
      console.error("Bookmark error:", err);
    } finally {
      setPendingBookmark(null);
    }
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

        {displayEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#888" }}>No events at the moment.</div>
        ) : (
          <>
            <div className="events-carousel" ref={carouselRef}>
              <div
                ref={trackRef}
                className={`events-track${dragging ? " is-dragging" : ""}`}
                style={{
                  transform: `translateX(${tx}px)`,
                  transition: dragging ? "none" : "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
                }}
                onMouseDown={(e) => { onDragStart(e.clientX); e.preventDefault(); }}
                onTouchStart={(e) => onDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => onDragMove(e.touches[0].clientX)}
                onTouchEnd={onDragEnd}
                onTouchCancel={onDragEnd}
                onClick={(e) => { if (Math.abs(dragDelta()) > 8) { e.stopPropagation(); e.preventDefault(); } }}
              >
                {displayEvents.map((ev, i) => {
                  const isBookmarked = ev.serial && userBookmarks.includes(ev.serial);
                  const isPending = pendingBookmark === ev.serial;
                  return (
                    <div key={ev.id} className={`event-card${i === current ? " active" : ""}`}>
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
                          <div className={`event-badge${ev.badgeType === "promo" ? " promo" : ""}`}>
                            {ev.badge}
                          </div>
                        )}
                      </div>
                      <div className="event-info">
                        <div className="event-date">
                          {ev.date}
                          {ev.dateRaw && new Date(ev.dateRaw).getFullYear() !== new Date().getFullYear() && (
                            <span style={{ opacity: 0.7, marginLeft: 6, fontSize: "0.85em" }}>
                              ({new Date(ev.dateRaw).getFullYear()})
                            </span>
                          )}
                        </div>                        <h3 className="event-title">{ev.title}</h3>
                        <div className="event-location">
                          <i className="bx bx-map" />
                          <span>{ev.location}</span>
                        </div>
                        <button
                          className={`bookmark-btn${isBookmarked ? " saved" : ""}`}
                          onClick={(e) => handleBookmark(ev, e)}
                          disabled={isPending}
                        >
                          <i className={`bx ${isPending ? "bx-loader-alt" : isBookmarked ? "bxs-bookmark" : "bx-bookmark"}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="carousel-controls">
              <button className="carousel-arrow" onClick={() => goTo(current - 1)} disabled={current === 0}>
                <i className="bx bx-chevron-left" />
              </button>
              <div className="carousel-dots">
                {displayEvents.map((_, i) => (
                  <span key={i} className={`dot${i === current ? " active" : ""}`} onClick={() => goTo(i)} />
                ))}
              </div>
              <button className="carousel-arrow" onClick={() => goTo(current + 1)} disabled={current === total - 1}>
                <i className="bx bx-chevron-right" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* NOTICES */}
      <div className="notices-section">
        <div className="section-header">
          <div className="header-line" />
          <h2 className="section-title">Notices</h2>
          <div className="header-line" />
        </div>
        {notices.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>No notices at the moment.</div>
        ) : (
          <div className="notices-list">
            {notices.map((n) => (
              <div className="notice-item" key={n.id}>
                <div className="notice-content">
                  <h4>{n.title}</h4>
                  <p>{n.body}</p>
                  <span className="notice-time">{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK ACCESS */}
      <h2 className="section-heading">Quick Access</h2>
      <div className="bus-card">
        <h3 style={{ color: "#a78bfa", marginBottom: 10 }}>Welcome to STUVO5 👋</h3>
        <p style={{ color: "#aaa" }}>Track buses, explore events, chat, and manage your profile.</p>
      </div>
    </>
  );
}

/* ─── Main Export ────────────────────────────────────────── */
export default function Explorer() {
  const { currentUser, userProfile } = useAuth();
  const [events, setEvents] = useState(null);
  const [notices, setNotices] = useState(null);

  useEffect(() => {
    const unsubEvents = subscribeToEvents((data) => setEvents(data));
    const unsubNotices = subscribeToNotices((data) => setNotices(data));
    return () => { unsubEvents(); unsubNotices(); };
  }, []);

  // Show skeleton until both Firestore data and userProfile are loaded
  if (events === null || notices === null || !userProfile) return <ExplorerSkeleton />;

  const userBookmarks = userProfile.bookmarkedEvents || [];

  return (
    <ExplorerContent
      key={events.length}
      events={events}
      notices={notices}
      userBookmarks={userBookmarks}
      uid={currentUser.uid}
    />
  );
}