import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  collection, query as firestoreQuery, where, getDocs,
  doc, getDoc, updateDoc, arrayUnion, arrayRemove
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import UserProfileOverlay from "../../components/UserProfileOverlay";
import "../../styles/searchpage.css";

const TABS = [
  { key: "student", label: "Students" },
  { key: "faculty", label: "Faculty" },
  { key: "event",   label: "Events"   },
  { key: "notice",  label: "Notices"  },
  { key: "chat",    label: "Groups"   },
];

const TYPE_COLOR = {
  student: "#a78bfa",
  faculty: "#10b981",
  event:   "#f59e0b",
  notice:  "#3b82f6",
  chat:    "#ec4899",
};

const TAB_PLACEHOLDER = {
  student: "Search students by name, branch…",
  faculty: "Search faculty by name, department…",
  event:   "Search events…",
  notice:  "Search notices…",
  chat:    "Search groups…",
};

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

/* ── Avatar ── */
function Avatar({ photoURL, initials, color, shape = "circle", small = false }) {
  return photoURL ? (
    <img
      src={photoURL}
      alt={initials}
      className={[
        "se-avatar",
        small ? "se-avatar--sm" : "",
        shape === "circle" ? "se-avatar--circle" : "se-avatar--rounded",
        "se-avatar--photo",
      ].join(" ")}
    />
  ) : (
    <div
      className={[
        "se-avatar",
        small ? "se-avatar--sm" : "",
        shape === "circle" ? "se-avatar--circle" : "se-avatar--rounded",
      ].join(" ")}
      style={{ background: `${color}22`, border: `1.5px solid ${color}55`, color }}
    >
      {initials}
    </div>
  );
}

/* ── Chip ── */
function Chip({ label, color }) {
  return (
    <span className="se-chip" style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}>
      {label}
    </span>
  );
}

/* ── Follow Button ── */
function FollowBtn({ isFollowing, color, onFollow, onUnfollowRequest, loading }) {
  if (loading) {
    return (
      <button className="se-btn se-btn--outline" style={{ border: `1px solid #333`, color: "#555", minWidth: 80 }} disabled>
        <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 14 }} />
      </button>
    );
  }
  if (isFollowing) {
    return (
      <button
        className="se-btn se-btn--outline"
        onClick={(e) => { e.stopPropagation(); onUnfollowRequest(); }}
        style={{ border: `1px solid ${color}55`, color, minWidth: 80 }}
      >
        Following
      </button>
    );
  }
  return (
    <button
      className="se-btn se-btn--solid"
      onClick={(e) => { e.stopPropagation(); onFollow(); }}
      style={{ background: color, border: `1px solid ${color}`, color: "#000", minWidth: 80 }}
    >
      Follow
    </button>
  );
}

/* ── Unfollow Confirm Modal ── */
function UnfollowModal({ username, onConfirm, onCancel }) {
  return createPortal(
    <div className="se-modal-overlay" onClick={onCancel}>
      <div className="se-modal" onClick={(e) => e.stopPropagation()}>
        <div className="se-modal-icon">
          <i className="bx bx-user-minus" />
        </div>
        <h3>Unfollow {username}?</h3>
        <p>You will stop seeing their updates in your feed.</p>
        <div className="se-modal-actions">
          <button className="se-modal-cancel" onClick={onCancel}>Cancel</button>
          <button className="se-modal-confirm" onClick={onConfirm}>Unfollow</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Person Card (Student / Faculty) ── */
function PersonCard({ item, following, onFollow, onUnfollow, onCardClick }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const isFollowing = following.has(item.id);
  const c = TYPE_COLOR[item.type];

  const handleFollow = async () => {
    setBtnLoading(true);
    await onFollow(item.id);
    setBtnLoading(false);
  };

  const handleUnfollow = async () => {
    setShowConfirm(false);
    setBtnLoading(true);
    await onUnfollow(item.id);
    setBtnLoading(false);
  };

  return (
    <>
      <div className="se-card se-card--clickable" onClick={() => onCardClick(item.id)}>
        <Avatar photoURL={item.photoURL} initials={item.initials} color={c} />
        <div className="se-card-meta">
          <div className="se-card-name">{item.name}</div>
          <div className="se-card-username" style={{ color: c }}>{item.username}</div>
          <div className="se-card-chips">
            {item.type === "student" && (
              <>
                {item.branch && <Chip label={item.branch} color={c} />}
                {item.year   && <Chip label={item.year}   color="#555" />}
              </>
            )}
            {item.type === "faculty" && (
              <>
                {item.department && <Chip label={item.department} color={c} />}
                {item.subject    && <Chip label={item.subject}    color="#555" />}
              </>
            )}
          </div>
        </div>
        <FollowBtn
          isFollowing={isFollowing}
          color={c}
          onFollow={handleFollow}
          onUnfollowRequest={() => setShowConfirm(true)}
          loading={btnLoading}
        />
      </div>

      {showConfirm && (
        <UnfollowModal
          username={item.username}
          onConfirm={handleUnfollow}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  );
}

/* ── Event Card ── */
function EventCard({ item }) {
  const c = TYPE_COLOR.event;
  return (
    <div className="se-card">
      <Avatar initials={item.initials} color={c} shape="rounded" />
      <div className="se-card-meta">
        <div className="se-card-name">{item.name}</div>
        <div className="se-card-desc">{item.desc}</div>
        <div className="se-card-chips">
          {item.date && <Chip label={`📅 ${item.date}`} color={c} />}
          {item.tag  && <Chip label={item.tag}           color="#555" />}
        </div>
      </div>
    </div>
  );
}

/* ── Notice Card ── */
function NoticeCard({ item }) {
  const c = TYPE_COLOR.notice;
  return (
    <div className="se-card se-card--notice">
      <div className="se-card-notice-row">
        <Avatar initials="📋" color={c} shape="rounded" small />
        <div className="se-card-meta">
          <div className="se-card-name">{item.name}</div>
          <div className="se-card-chips">
            {item.dept && <Chip label={item.dept} color={c}    />}
            {item.date && <Chip label={item.date} color="#555" />}
          </div>
        </div>
      </div>
      {item.desc && <p className="se-card-notice-body">{item.desc}</p>}
    </div>
  );
}

/* ── Skeleton ── */
function SkeletonCard() {
  return (
    <div className="se-skeleton-card">
      <div className="se-skeleton-block" style={{ width: 48, height: 48, borderRadius: "50%" }} />
      <div className="se-skeleton-meta">
        <div className="se-skeleton-block" style={{ width: "55%", height: 13 }} />
        <div className="se-skeleton-block" style={{ width: "35%", height: 11 }} />
        <div className="se-skeleton-chips">
          <div className="se-skeleton-block" style={{ width: 52, height: 19, borderRadius: 20 }} />
          <div className="se-skeleton-block" style={{ width: 60, height: 19, borderRadius: 20 }} />
        </div>
      </div>
      <div className="se-skeleton-block" style={{ width: 76, height: 31, borderRadius: 8 }} />
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ query: q, isComingSoon }) {
  if (isComingSoon) {
    return (
      <div className="se-empty">
        <div className="se-empty-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="se-empty-title">Coming Soon</div>
        <div className="se-empty-sub">Groups will be available once the chat feature is ready.</div>
      </div>
    );
  }
  return (
    <div className="se-empty">
      <div className="se-empty-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3a3a3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      {q ? (
        <>
          <div className="se-empty-title">No results for "{q}"</div>
          <div className="se-empty-sub">Try a different keyword.</div>
        </>
      ) : (
        <>
          <div className="se-empty-title">Start searching</div>
          <div className="se-empty-sub">Type a name, branch, or department to find people.</div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function SearchExplore() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("student");
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery]           = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [allItems, setAllItems]     = useState([]);
  const [tabLoaded, setTabLoaded]   = useState({});

  // Set of UIDs the current user follows
  const [following, setFollowing] = useState(new Set());
  const [overlayUid, setOverlayUid] = useState(null); // UserProfileOverlay

  const debounceRef = useRef(null);

  /* ── Load current user's following list on mount ── */
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "users", currentUser.uid)).then((snap) => {
      if (snap.exists()) {
        const list = snap.data().following || [];
        setFollowing(new Set(list));
      }
    });
  }, [currentUser]);

  /* ── Follow a user ── */
  const handleFollow = useCallback(async (targetUid) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        following: arrayUnion(targetUid),
      });
      await updateDoc(doc(db, "users", targetUid), {
        followers: arrayUnion(currentUser.uid),
      });
      setFollowing((prev) => new Set([...prev, targetUid]));
    } catch (err) {
      console.error("Follow error:", err);
    }
  }, [currentUser]);

  /* ── Unfollow a user ── */
  const handleUnfollow = useCallback(async (targetUid) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        following: arrayRemove(targetUid),
      });
      await updateDoc(doc(db, "users", targetUid), {
        followers: arrayRemove(currentUser.uid),
      });
      setFollowing((prev) => {
        const next = new Set(prev);
        next.delete(targetUid);
        return next;
      });
    } catch (err) {
      console.error("Unfollow error:", err);
    }
  }, [currentUser]);

  /* ── Navigate to chat with user ── */
  const handleCardClick = useCallback((targetUid) => {
    setOverlayUid(targetUid);
  }, []);

  /* ── Fetch data per tab ── */
  const fetchTab = useCallback(async (tab) => {
    if (tab === "chat") return;
    if (tabLoaded[tab]) return;

    setIsLoading(true);
    try {
      let newItems = [];

      if (tab === "student" || tab === "faculty") {
        const q = firestoreQuery(
          collection(db, "users"),
          where("role", "==", tab)
        );
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.uid === currentUser?.uid) return;
          newItems.push({
            id:          docSnap.id,
            type:        tab,
            name:        d.fullName    || "",
            username:    "@" + (d.username || ""),
            branch:      d.branch      || "",
            year:        d.year        || "",
            department:  d.department  || "",
            subject:     d.subject     || "",
            photoURL:    d.photoURL    || null,
            initials:    getInitials(d.fullName),
          });
        });

      } else if (tab === "event") {
        const snap = await getDoc(doc(db, "content", "events_all"));
        const items = snap.exists() ? (snap.data().items ?? []) : [];
        newItems = items.map((e) => ({
          id:       e.id || e.serial,
          type:     "event",
          name:     e.title || e.name || "",
          desc:     e.description || e.desc || "",
          date:     e.date || "",
          tag:      e.tag || e.category || "",
          initials: getInitials(e.title || e.name || "EV"),
        }));

      } else if (tab === "notice") {
        const snap = await getDoc(doc(db, "content", "notices"));
        const items = snap.exists() ? (snap.data().items ?? []) : [];
        newItems = items.map((n) => ({
          id:   n.id || n.serial,
          type: "notice",
          name: n.title || n.name || "",
          desc: n.description || n.body || n.desc || "",
          date: n.date || "",
          dept: n.department || n.dept || n.from || "",
        }));
      }

      setAllItems((prev) => [
        ...prev.filter((i) => i.type !== tab),
        ...newItems,
      ]);
      setTabLoaded((prev) => ({ ...prev, [tab]: true }));
    } catch (err) {
      console.error("Search fetch error:", err);
    }
    setIsLoading(false);
  }, [currentUser, tabLoaded]);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  /* ── Debounce input ── */
  const handleInput = useCallback((e) => {
    const val = e.target.value;
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), 280);
  }, []);

  const clearSearch = () => { setInputValue(""); setQuery(""); };

  /* ── Filter ── */
  const q = query.trim().toLowerCase();
  const results = q
    ? allItems
        .filter((item) => {
          if (item.type !== activeTab) return false;
          const fields = [
            item.name, item.username, item.branch, item.year,
            item.department, item.subject, item.tag, item.desc, item.dept,
          ].filter(Boolean);
          return fields.some((f) => f.toLowerCase().includes(q));
        })
        .sort((a, b) => {
          // Followed users first for student/faculty tabs
          if (a.type === "student" || a.type === "faculty") {
            const aFollowed = following.has(a.id) ? 0 : 1;
            const bFollowed = following.has(b.id) ? 0 : 1;
            return aFollowed - bFollowed;
          }
          return 0;
        })
    : [];

  const color = TYPE_COLOR[activeTab];

  const renderCard = (item) => {
    if (item.type === "student" || item.type === "faculty") {
      return (
        <PersonCard
          key={item.id}
          item={item}
          following={following}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
          onCardClick={handleCardClick}
        />
      );
    }
    if (item.type === "event")  return <EventCard  key={item.id} item={item} />;
    if (item.type === "notice") return <NoticeCard key={item.id} item={item} />;
    return null;
  };

  return (
    <div className="se-wrapper">
      <div className="se-inner">
        {/* Header */}
        <div className="se-header">
          <div className="se-header-inner">
            <div className="se-search-wrap">
              <div className="se-search-input-wrap">
                <span className="se-search-icon">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <input
                  type="search"
                  className="se-search-input"
                  value={inputValue}
                  placeholder={TAB_PLACEHOLDER[activeTab]}
                  onChange={handleInput}
                  autoComplete="off"
                />
                {inputValue && (
                  <button className="se-clear-btn" onClick={clearSearch}>✕</button>
                )}
              </div>
            </div>

            <div className="se-tabs">
              {TABS.map((t) => {
                const active = activeTab === t.key;
                const tc = TYPE_COLOR[t.key];
                return (
                  <button
                    key={t.key}
                    className="se-tab-btn"
                    onClick={() => setActiveTab(t.key)}
                    style={{
                      background: active ? `${tc}22` : "#111",
                      border: `1px solid ${active ? `${tc}66` : "#2a2a2a"}`,
                      color: active ? tc : "#777",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="se-body">
          {activeTab === "chat" && <EmptyState isComingSoon />}

          {activeTab !== "chat" && isLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

          {activeTab !== "chat" && !isLoading && q && results.length > 0 && (
            <>
              <div className="se-results-header">
                <div className="se-results-line" style={{ background: "linear-gradient(to right, #2a2a2a, transparent)" }} />
                <span className="se-results-count" style={{ color }}>
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </span>
                <div className="se-results-line" style={{ background: "linear-gradient(to left, #2a2a2a, transparent)" }} />
              </div>
              <div className="se-results-grid">{results.map(renderCard)}</div>
            </>
          )}

          {activeTab !== "chat" && !isLoading && (!q || results.length === 0) && (
            <EmptyState query={q && results.length === 0 ? q : ""} />
          )}
        </div>
      </div>

      {/* User Profile Overlay — opens when a card is tapped */}
      {overlayUid && (
        <UserProfileOverlay
          uid={overlayUid}
          onClose={() => setOverlayUid(null)}
        />
      )}
    </div>
  );
}