import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "boxicons/css/boxicons.min.css";
import "../../styles/chats.css";
import { useAuth } from "../../context/AuthContext";
import { subscribeToChats, getUserProfiles, getChatId, deleteChat, clearChatPreview } from "../../firebase/db";
import { useSyncStatus } from "../../context/SyncContext";
import { getCachedChats, setCachedChats, precacheMedia, getBlobUrl } from "../../utils/appCache";
import CachedImage from "../../components/CachedImage";
import { createPortal } from "react-dom";

function formatTime(timestamp) {
  if (!timestamp) return "";
  let date;
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    // Live Firestore Timestamp
    date = timestamp.toDate();
  } else if (typeof timestamp === "object" && timestamp.seconds !== undefined) {
    // Serialized Firestore Timestamp (from IndexedDB cache) — plain {seconds, nanoseconds}
    date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1e6);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diff < 604800000) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}

function ChatAvatar({ photoURL, name, size = 48 }) {
  const initials = getInitials(name);
  if (photoURL) {
    return <CachedImage src={photoURL} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div className="co-avatar av-purple" style={{ width: size, height: size, fontSize: size * 0.3 }}>
      {initials}
    </div>
  );
}

function SectionLabel({ label }) {
  return <div className="ch-section-label"><span>{label}</span></div>;
}

function SkeletonItem() {
  return (
    <div className="co-item" style={{ cursor: "default" }}>
      <div className="ch-sk ch-sk--avatar" />
      <div className="ch-sk-info">
        <div className="ch-sk ch-sk--name" />
        <div className="ch-sk ch-sk--preview" />
      </div>
    </div>
  );
}

/* ── Contact Context Menu ── */
function ContactCtxMenu({ x, y, isMuted, onClose, onAction }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useEffect(() => {
    if (!ref.current) return;
    const pw = ref.current.offsetWidth || 200;
    const ph = ref.current.offsetHeight || 180;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let lx = x, ly = y;
    if (lx + pw + 10 > vw) lx = vw - pw - 10;
    if (ly + ph + 10 > vh) ly = vh - ph - 10;
    if (lx < 10) lx = 10;
    if (ly < 10) ly = 10;
    setPos({ left: lx, top: ly });
  }, [x, y]);

  const items = [
    { icon: "bx-bell-off", label: isMuted ? "Unmute" : "Mute notifications", action: "mute" },
    { icon: "bx-block", label: "Block", action: "block" },
    { icon: "bx-eraser", label: "Clear chat", action: "clear" },
    { icon: "bx-trash", label: "Delete chat", action: "delete", danger: true },
  ];

  return createPortal(
    <>
      <div className="co-ctx-backdrop" onClick={onClose} />
      <div ref={ref} className="co-ctx-popup" style={pos}>
        {items.map((item) => (
          <div
            key={item.action}
            className={`co-ctx-item${item.danger ? " danger" : ""}`}
            onClick={() => { onAction(item.action); onClose(); }}
          >
            <i className={`bx ${item.icon}`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </>,
    document.body
  );
}

/* ── Confirm Modal ── */
function ConfirmModal({ title, desc, confirmLabel, onConfirm, onCancel, danger = true }) {
  return createPortal(
    <div className="cw-modal-overlay" onClick={onCancel}>
      <div className="cw-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{desc}</p>
        <div className="cw-modal-actions">
          <button className="cw-btn-cancel" onClick={onCancel}>Cancel</button>
          <button className={danger ? "cw-btn-danger" : "cw-btn-confirm"} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function Chats() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [chats, setChats] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [muted, setMuted] = useState({});
  const [blocked, setBlocked] = useState({});
  const [ctxMenu, setCtxMenu] = useState(null);
  const [modal, setModal] = useState(null);

  const longPressTimer = useRef(null);

  const { online, markFetching, markUpdated } = useSyncStatus();

  /* ── Subscribe to existing chats — cache first ── */
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;

    // 1. Show cached chats for THIS user immediately
    getCachedChats().then(async (cached) => {
      const mine = cached.filter((c) =>
        Array.isArray(c.participants) ? c.participants.includes(uid) : c.id?.includes(uid)
      );
      if (mine.length > 0) {
        // Pre-fetch participant photos before rendering
        await Promise.all(mine.map((chat) => {
          const otherId = chat.participants?.find((p) => p !== uid);
          const photoURL = chat.participantInfo?.[otherId]?.photoURL;
          return photoURL ? getBlobUrl(photoURL).catch(() => null) : null;
        }));
        setChats(mine);
        setLoadingChats(false);
      }
    });

    if (!online) return;

    // 2. Live subscription — always replaces cache state entirely
    markFetching();
    let first = true;
    const unsub = subscribeToChats(uid, async (data) => {
      // Pre-fetch all participant photo blobs before rendering
      await Promise.all(data.map((chat) => {
        const otherId = chat.participants?.find((p) => p !== uid);
        const photoURL = chat.participantInfo?.[otherId]?.photoURL;
        return photoURL ? getBlobUrl(photoURL).catch(() => null) : null;
      }));
      setChats(data);
      setLoadingChats(false);
      setCachedChats(data);
      if (first) { markUpdated(); first = false; }
    });
    return unsub;
  }, [currentUser?.uid, online]); // eslint-disable-line

  /* ── Load followers ── */
  useEffect(() => {
    if (!userProfile?.followers?.length) return;
    getUserProfiles(userProfile.followers).then(setFollowers);
  }, [userProfile]);

  /* ── Other participant info ── */
  const getOther = useCallback((chat) => {
    const otherId = chat.participants?.find((p) => p !== currentUser?.uid);
    if (!otherId) return { name: "Unknown", photoURL: null, uid: null };
    const info = chat.participantInfo?.[otherId] || {};
    return { uid: otherId, name: info.name || "Unknown", username: info.username || "", photoURL: info.photoURL || null };
  }, [currentUser]);

  /* ── Long press handlers ── */
  const startLongPress = (e, chatId, other) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches?.[0] || e;
      setCtxMenu({ chatId, otherId: other.uid, name: other.name, x: touch.clientX, y: touch.clientY });
    }, 500);
  };
  const cancelLongPress = () => clearTimeout(longPressTimer.current);

  /* ── Context menu actions ── */
  const handleCtxAction = (action) => {
    const { chatId, otherId, name } = ctxMenu || {};
    if (action === "mute") setMuted((p) => ({ ...p, [chatId]: !p[chatId] }));
    if (action === "block") setModal({ type: "block", chatId, otherId, name });
    if (action === "clear") setModal({ type: "clear", chatId });
    if (action === "delete") setModal({ type: "delete", chatId });
  };

  const handleConfirm = async () => {
    if (!modal) return;
    if (modal.type === "block") {
      setBlocked((p) => ({ ...p, [modal.otherId]: true }));
    }
    if (modal.type === "clear") {
      setChats((p) => p.map((c) => c.id === modal.chatId ? { ...c, lastMessage: "" } : c));
    }
    if (modal.type === "delete") {
      setChats((p) => p.filter((c) => c.id !== modal.chatId)); // optimistic
      // Store clearedAt in localStorage so ChatWindow hides old messages
      localStorage.setItem(`chat_cleared_${modal.chatId}`, String(Date.now()));
      try {
        await deleteChat(modal.chatId, currentUser.uid);
        await clearChatPreview(modal.chatId);
      } catch (e) {
        console.error("Delete chat failed:", e);
      }
    }
    setModal(null);
  };

  const handleNewChat = useCallback((follower) => {
    if (!currentUser) return;
    navigate(`/chat/${getChatId(currentUser.uid, follower.uid)}`);
  }, [currentUser, navigate]);

  const existingPartnerIds = new Set(
    chats.map((c) => c.participants?.find((p) => p !== currentUser?.uid)).filter(Boolean)
  );

  const q = search.trim().toLowerCase();

  const filteredChats = chats.filter((chat) => {
    if (!q) return true;
    const other = getOther(chat);
    return other.name.toLowerCase().includes(q) || other.username.toLowerCase().includes(q);
  });

  const filteredFollowers = followers.filter((f) => {
    if (existingPartnerIds.has(f.uid)) return false;
    if (!q) return true;
    return (f.fullName || "").toLowerCase().includes(q) || (f.username || "").toLowerCase().includes(q);
  });

  return (
    <div className="ch-page">
      {/* Header */}
      <div className="ch-header">
        <span className="ch-title">Messages</span>
        <button className="co-icon-btn" title="New Group">
          <i className="bx bx-edit" />
        </button>
      </div>

      {/* Search */}
      <div className="co-search" style={{ margin: "10px 12px" }}>
        <i className="bx bx-search" />
        <input
          type="search"
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
        />
        {search && <i className="bx bx-x" style={{ cursor: "pointer", color: "#666" }} onClick={() => setSearch("")} />}
      </div>

      {/* List */}
      <div className="ch-list">
        {loadingChats && (
          <>
            <SectionLabel label="Messages" />
            {[1, 2, 3].map((i) => <SkeletonItem key={i} />)}
          </>
        )}

        {!loadingChats && filteredChats.length > 0 && (
          <>
            {!q && <SectionLabel label="Messages" />}
            {filteredChats.map((chat) => {
              const other = getOther(chat);
              const unread = chat.unreadCount?.[currentUser?.uid] || 0;
              const isBlocked = blocked[other.uid];
              const isMuted = muted[chat.id];
              return (
                <div
                  key={chat.id}
                  className={`co-item${isBlocked ? " blocked" : ""}`}
                  onClick={() => !isBlocked && navigate(`/chat/${chat.id}`)}
                  onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ chatId: chat.id, otherId: other.uid, name: other.name, x: e.clientX, y: e.clientY }); }}
                  onTouchStart={(e) => startLongPress(e, chat.id, other)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                >
                  <ChatAvatar photoURL={other.photoURL} name={other.name} />
                  <div className="co-info">
                    <div className="co-name-row">
                      <span className="co-name">{other.name}{isMuted ? " 🔇" : ""}</span>
                      <span className="co-ctime">{formatTime(chat.lastMessageTime)}</span>
                    </div>
                    <div className="co-preview-row">
                      <span className="co-preview">
                        {isBlocked
                          ? <span style={{ color: "#ef4444", fontStyle: "italic" }}>Blocked</span>
                          : <>
                            {chat.lastMessage === "You deleted this message"
                              ? <span style={{ fontStyle: "italic", color: "#555" }}>You deleted this message</span>
                              : chat.lastMessage
                                ? <>{chat.lastSenderId === currentUser?.uid && <span style={{ color: "#555" }}>You: </span>}{chat.lastMessage}</>
                                : <span style={{ color: "#555", fontStyle: "italic" }}>No messages yet</span>
                            }
                          </>
                        }
                      </span>
                      {unread > 0 && !isBlocked && <span className="co-unread">{unread}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {filteredFollowers.length > 0 && (
          <>
            <SectionLabel label="People you follow" />
            {filteredFollowers.map((f) => (
              <div key={f.uid} className="co-item" onClick={() => handleNewChat(f)}>
                <ChatAvatar photoURL={f.photoURL} name={f.fullName} />
                <div className="co-info">
                  <div className="co-name-row">
                    <span className="co-name">{f.fullName}</span>
                  </div>
                  <div className="co-preview-row">
                    <span className="co-preview" style={{ color: "#555" }}>@{f.username}</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {!loadingChats && filteredChats.length === 0 && filteredFollowers.length === 0 && (
          <div className="co-empty-list" style={{ marginTop: 60 }}>
            <i className="bx bx-message-rounded-dots" />
            <p>{q ? `No results for "${q}"` : "No messages yet. Follow someone to start chatting!"}</p>
          </div>
        )}
      </div>

      {/* Context menu */}
      {ctxMenu && (
        <ContactCtxMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          isMuted={!!muted[ctxMenu.chatId]}
          onClose={() => setCtxMenu(null)}
          onAction={handleCtxAction}
        />
      )}

      {/* Modals */}
      {modal?.type === "block" && (
        <ConfirmModal
          title={`Block ${modal.name}?`}
          desc="They won't be able to message you. They won't know they've been blocked."
          confirmLabel="Block"
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "clear" && (
        <ConfirmModal
          title="Clear this chat?"
          desc="All messages will be removed from your view."
          confirmLabel="Clear"
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="Delete this chat?"
          desc="This chat will be removed from your messages. The other person won't be affected."
          confirmLabel="Delete"
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}