import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { storage, db } from "../../firebase/config";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeToMessages, sendMessage, markChatRead, getUserProfile, getChatId,
  reactToMessage, markAudioPlayed, subscribeToUserPresence, setUserOnline, setUserOffline, deleteMessage, blockUser, unblockUser, clearChatPreview
} from "../../firebase/db";
import { precacheMedia, getBlobUrl } from "../../utils/appCache";
import CachedImage from "../../components/CachedImage";
import { useHistoryBack } from "../../utils/useHistoryBack";
import "boxicons/css/boxicons.min.css";
import "../../styles/chats.css";

/* ── Helpers ── */
function getInitials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
}
// Safely convert any timestamp format to a Date:
//  • Live Firestore Timestamp (has .toDate)
//  • Serialized Timestamp from IndexedDB ({seconds, nanoseconds})
//  • Plain date/number/string
function tsToDate(ts) {
  if (!ts) return null;
  if (ts.toDate && typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts === "object" && ts.seconds !== undefined) {
    return new Date(ts.seconds * 1000 + (ts.nanoseconds || 0) / 1e6);
  }
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}
function formatTime(ts) {
  const d = tsToDate(ts);
  if (!d) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function formatLastSeen(ts) {
  const d = tsToDate(ts);
  if (!d) return "";
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "last seen just now";
  if (mins < 60) return `last seen ${mins}m ago`;
  const today = now.toDateString() === d.toDateString();
  if (today) return `last seen today at ${formatTime(ts)}`;
  const yesterday = new Date(now - 86400000).toDateString() === d.toDateString();
  if (yesterday) return `last seen yesterday at ${formatTime(ts)}`;
  return `last seen ${d.toLocaleDateString("en-US", { day: "numeric", month: "short" })} at ${formatTime(ts)}`;
}
function getDateLabel(ts) {
  const d = tsToDate(ts);
  if (!d) return "";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const mDay = new Date(d); mDay.setHours(0, 0, 0, 0);
  const diff = Math.round((today - mDay) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

const SAY_HI = [
  { emoji: "👋", label: "Say Hi!" }, { emoji: "😊", label: "Hello!" },
  { emoji: "🔥", label: "Hey!" }, { emoji: "❤️", label: "Love" },
  { emoji: "🎉", label: "Wohoo!" }, { emoji: "😂", label: "Haha" },
];
const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

/* ── Avatar ── */
function ChatAvatar({ photoURL, name, size = 38 }) {
  const initials = getInitials(name);
  if (photoURL) return <CachedImage src={photoURL} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return <div className="co-avatar av-purple" style={{ width: size, height: size, fontSize: size * 0.32 }}>{initials}</div>;
}

/* ── Bubble context menu ── */
function BubbleMenu({ x, y, onClose, onReact, onReply, onCopy, onForward, onSelect, onDelete }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ left: x, top: y });
  useEffect(() => {
    if (!ref.current) return;
    const pw = ref.current.offsetWidth || 220, ph = ref.current.offsetHeight || 300;
    const vw = window.innerWidth, vh = window.innerHeight;
    let lx = x, ly = y;
    if (lx + pw + 10 > vw) lx = vw - pw - 10;
    if (ly + ph + 10 > vh) ly = vh - ph - 10;
    if (lx < 10) lx = 10; if (ly < 10) ly = 10;
    setPos({ left: lx, top: ly });
  }, [x, y]);

  const items = [
    { icon: "bx-undo", label: "Reply", fn: onReply },
    { icon: "bx-copy", label: "Copy", fn: onCopy },
    { icon: "bx-share-alt", label: "Forward", fn: onForward },
    { icon: "bx-check-square", label: "Select", fn: onSelect },
    { icon: "bx-trash", label: "Delete", fn: onDelete, danger: true },
  ];
  return createPortal(
    <>
      <div className="co-bm-backdrop" onClick={onClose} />
      <div ref={ref} className="co-bm-popup" style={pos}>
        <div className="co-bm-emoji-row">
          {QUICK_EMOJIS.map((em) => <span key={em} className="co-bm-emoji" onClick={() => onReact(em)}>{em}</span>)}
        </div>
        {items.map((item) => (
          <div key={item.label} className={`co-bm-item${item.danger ? " danger" : ""}`} onClick={item.fn}>
            <i className={`bx ${item.icon}`} /><span>{item.label}</span>
          </div>
        ))}
      </div>
    </>,
    document.body
  );
}

/* ── Ensure chat doc exists ── */
async function ensureChatDoc(chatId, myUid, myProfile, otherUser) {
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) {
    await setDoc(chatRef, {
      participants: [myUid, otherUser.uid],
      createdAt: serverTimestamp(),
      lastMessage: "", lastMessageTime: serverTimestamp(), lastSenderId: "",
      participantInfo: {
        [myUid]: { name: myProfile?.fullName || "", username: myProfile?.username || "", photoURL: myProfile?.photoURL || "" },
        [otherUser.uid]: { name: otherUser?.fullName || otherUser?.name || "", username: otherUser?.username || "", photoURL: otherUser?.photoURL || "" },
      },
      unreadCount: { [myUid]: 0, [otherUser.uid]: 0 },
    });
  }
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function ChatWindow() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile: myProfile } = useAuth();

  const [otherUser, setOtherUser] = useState(null);
  const [allMessages, setAllMessages] = useState([]);
  // Load clearedAt from localStorage on mount
  const [clearedAt, setClearedAtState] = useState(() => {
    if (!chatId) return null;
    const stored = localStorage.getItem(`chat_cleared_${chatId}`);
    return stored ? parseInt(stored, 10) : null;
  });

  const setClearedAt = (ts) => {
    setClearedAtState(ts);
    if (ts && chatId) localStorage.setItem(`chat_cleared_${chatId}`, String(ts));
  };
  const [deletedIds, setDeletedIds] = useState(new Set());
  const [reactions, setReactions] = useState({});
  const [chatExists, setChatExists] = useState(false);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState(null);
  const [sending, setSending] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [videoOpen, setVideoOpen] = useState(null);
  const [mediaViewer, setMediaViewer] = useState(null); // { items: [...], index: number }
  const [reactionSheet, setReactionSheet] = useState(null); // { msg }
  // uploadTasks: { [localId]: { progress: 0-100, task, status: 'uploading'|'failed', file, forceType, waveform, caption } }
  const [uploadTasks, setUploadTasks] = useState({});

  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [bubMenu, setBubMenu] = useState(null);
  const [selMode, setSelMode] = useState(false);
  const [selMsgs, setSelMsgs] = useState(new Set());
  const [fwdData, setFwdData] = useState(null); // { text, type, fileURL, fileName }
  const [fwdDataMulti, setFwdDataMulti] = useState(null); // array of messages to forward
  const [fwdSel, setFwdSel] = useState(new Set());
  const [chats, setChats] = useState([]);

  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [showMicTooltip, setShowMicTooltip] = useState(false);
  const recordingChunks = useRef([]);
  const recordingTimer = useRef(null);
  const recordingStarted = useRef(false);

  // Intercept browser back gesture for full-screen overlays
  useHistoryBack(cameraOpen, () => setCameraOpen(false));
  useHistoryBack(!!lightbox, () => setLightbox(null));
  useHistoryBack(!!fwdData, () => { setFwdData(null); setFwdSel(new Set()); });
  useHistoryBack(!!fwdDataMulti, () => { setFwdDataMulti(null); setFwdSel(new Set()); });
  const waveformSamples = useRef([]); // amplitude samples collected during recording
  const analyserRef = useRef(null);
  const analyserTimer = useRef(null);
  const recordingElapsed = useRef(0); // tracks duration reliably inside closures

  const endRef = useRef(null);
  const inputRef = useRef(null);
  const messagesRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [highlightId, setHighlightId] = useState(null);

  const scrollToMessage = useCallback((msgId) => {
    if (!msgId) return;
    const el = document.getElementById(`msg-${msgId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(msgId);
    setTimeout(() => setHighlightId(null), 1500);
  }, []);

  const attachRef = useRef(null);
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const overlayRef = useRef(null);
  const docRef = useRef(null);
  const audioRef = useRef(null);

  const parts = chatId?.split("_") || [];
  const otherUid = parts.length === 2 ? parts.find((p) => p !== currentUser?.uid) : otherUser?.uid;

  /* ── Mobile keyboard: shrink overlay to visual viewport ── */
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const el = overlayRef.current;
      if (!el) return;
      el.style.height = `${vv.height}px`;
      el.style.top = `${vv.offsetTop}px`;
      // Keep messages scrolled to bottom when keyboard opens
      if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
      }
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  /* ── Load chats for forward picker ── */
  useEffect(() => {
    if (!currentUser) return;
    import("../../firebase/db").then(({ subscribeToChats }) => {
      const unsub = subscribeToChats(currentUser.uid, async (data) => {
        // Pre-warm participant photos so forward modal avatars render instantly
        await Promise.all(data.map((chat) => {
          const otherId = chat.participants?.find((p) => p !== currentUser.uid);
          const photoURL = chat.participantInfo?.[otherId]?.photoURL;
          return photoURL ? getBlobUrl(photoURL).catch(() => null) : null;
        }));
        setChats(data);
      });
      return unsub;
    });
  }, [currentUser]);

  /* ── Load blocked state from userProfile ── */
  useEffect(() => {
    if (!otherUid || !myProfile) return;
    setIsBlocked((myProfile.blockedUsers || []).includes(otherUid));
  }, [otherUid, myProfile]);

  /* ── Load other user — handles both uid1_uid2 and legacy random chat IDs ── */
  useEffect(() => {
    if (!chatId || !currentUser) return;
    const parts = chatId.split("_");
    const derivedUid = parts.length === 2 ? parts.find((p) => p !== currentUser.uid) : null;

    const applyOtherUser = async (p) => {
      if (!p) return;
      // Pre-fetch profile photo blob before rendering header avatar
      if (p.photoURL) await getBlobUrl(p.photoURL).catch(() => null);
      setOtherUser(p);
    };

    if (derivedUid) {
      getUserProfile(derivedUid).then(applyOtherUser);
    } else {
      getDoc(doc(db, "chats", chatId)).then((snap) => {
        if (!snap.exists()) return;
        const otherId = snap.data().participants?.find((p) => p !== currentUser.uid);
        if (!otherId) return;
        getUserProfile(otherId).then(applyOtherUser);
      });
    }
  }, [chatId, currentUser]);

  /* ── Check chat existence + subscribe to messages ── */
  const [chatData, setChatData] = useState(null); // live chat doc for readBy
  const [otherUserPresence, setOtherUserPresence] = useState(null); // { online, lastSeen }

  // ── Own presence ──
  useEffect(() => {
    if (!currentUser?.uid) return;
    setUserOnline(currentUser.uid).catch(() => {});
    const handleOffline = () => setUserOffline(currentUser.uid).catch(() => {});
    window.addEventListener("beforeunload", handleOffline);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) setUserOffline(currentUser.uid).catch(() => {});
      else setUserOnline(currentUser.uid).catch(() => {});
    });
    return () => {
      window.removeEventListener("beforeunload", handleOffline);
      setUserOffline(currentUser.uid).catch(() => {});
    };
  }, [currentUser?.uid]);

  // ── Other user presence ──
  useEffect(() => {
    if (!otherUser?.uid) return;
    const unsub = subscribeToUserPresence(otherUser.uid, setOtherUserPresence);
    return () => unsub();
  }, [otherUser?.uid]);

  useEffect(() => {
    if (!chatId || !currentUser) return;
    let unsub = () => { };
    getDoc(doc(db, "chats", chatId)).then((snap) => {
      if (snap.exists()) {
        setChatExists(true);
        setChatData(snap.data());
        markChatRead(chatId, currentUser.uid);
      }
      unsub = subscribeToMessages(chatId, async (msgs) => {
        // Pre-fetch all media blobs before rendering so CachedImage hits memory sync
        const mediaUrls = msgs.filter((m) => m.fileURL?.startsWith("http")).map((m) => m.fileURL);
        await Promise.all(mediaUrls.map((url) => getBlobUrl(url).catch(() => null)));
        setAllMessages(msgs);
        // Clean up any stale messages that were written with blob: URLs (from old system)
        msgs.forEach(async (m) => {
          if (m.status === "uploading" && m.fileURL?.startsWith("blob:")) {
            try {
              const { deleteDoc, doc: docFn } = await import("firebase/firestore");
              await deleteDoc(docFn(db, "chats", chatId, "messages", m.id));
            } catch {}
          }
        });
      });
    });
    // Also subscribe to chat doc for real-time readBy updates
    const unsubChat = onSnapshot(doc(db, "chats", chatId), (snap) => {
      if (snap.exists()) setChatData(snap.data());
    });
    return () => { unsub(); unsubChat(); };
  }, [chatId, currentUser]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (!showScrollBtn) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages]);

  /* ── Show/hide scroll-to-bottom button ── */
  const handleMessagesScroll = useCallback(() => {
    const el = messagesRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 150);
  }, []);

  /* ── Close attach on outside click ── */
  useEffect(() => {
    if (!attachOpen) return;
    const fn = (e) => { if (attachRef.current && !attachRef.current.contains(e.target)) setAttachOpen(false); };
    setTimeout(() => document.addEventListener("click", fn), 10);
    return () => document.removeEventListener("click", fn);
  }, [attachOpen]);

  /* ── Escape key ── */
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") {
        if (lightbox) { setLightbox(null); return; }
        if (bubMenu) { setBubMenu(null); return; }
        if (selMode) { setSelMode(false); setSelMsgs(new Set()); return; }
        if (reply) { setReply(null); return; }
        if (attachOpen) { setAttachOpen(false); return; }
        navigate("/chats");
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [lightbox, bubMenu, selMode, reply, attachOpen, navigate]);

  /* ── Filtered messages ── */
  const messages = allMessages.filter((m) => {
    // Clear chat: hide everything before clearedAt timestamp
    if (clearedAt && m.timestamp) {
      const ts = m.timestamp.toMillis
        ? m.timestamp.toMillis()
        : m.timestamp.seconds
          ? m.timestamp.seconds * 1000
          : new Date(m.timestamp).getTime();
      if (ts < clearedAt) return false;
    }
    return true;
  });

  /* ── Send text ── */
  const handleSend = useCallback(async (textOverride) => {
    const text = (textOverride !== undefined ? textOverride : input).trim();
    if (!text || !chatId || sending || !otherUser) return;
    setSending(true); setInput(""); setReply(null);
    try {
      if (!chatExists) {
        await ensureChatDoc(chatId, currentUser.uid, myProfile, otherUser);
        setChatExists(true);
      }
      await sendMessage(chatId, currentUser.uid, {
        type: "text", text,
        ...(reply ? { replyTo: { user: reply.user, text: reply.text, msgId: reply.msgId } } : {}),
      });
    } catch (e) { console.error(e); }
    setSending(false);
    inputRef.current?.focus();
  }, [input, chatId, currentUser, myProfile, otherUser, sending, reply, chatExists]);

  /* ── Send file ── */
  const handleSendFile = useCallback(async (file, forceType, waveform = null, caption = "", retryLocalId = null) => {
    if (!file || !chatId || !otherUser) return;
    const isImage = forceType === "image" || file.type.startsWith("image/") || file.type.startsWith("video/");
    const isAudio = forceType === "audio" || file.type.startsWith("audio/");
    const type = isImage ? "image" : isAudio ? "audio" : "document";
    const path = `chats/${chatId}/${type}s/${Date.now()}_${file.name}`;
    const localURL = URL.createObjectURL(file);
    const localId = retryLocalId || `local_${Date.now()}`;

    try {
      if (!chatExists) {
        await ensureChatDoc(chatId, currentUser.uid, myProfile, otherUser);
        setChatExists(true);
      }
    } catch (e) { console.error("Chat doc error:", e); }

    // Add to local uploadTasks only — NOT written to Firestore yet
    // The message appears via pendingMessages derived from uploadTasks
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    setUploadTasks((prev) => ({
      ...prev,
      [localId]: {
        progress: 0, task, status: "uploading",
        file, forceType, waveform, caption,
        localURL, type,
        isVideoFile: file.type.startsWith("video/"),
        localId,
        timestamp: Date.now(),
      },
    }));

    task.on("state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setUploadTasks((prev) => prev[localId]
          ? { ...prev, [localId]: { ...prev[localId], progress: pct } }
          : prev);
      },
      (err) => {
        if (err.code === "storage/canceled") {
          // Cancelled — remove from pending
          setUploadTasks((prev) => { const n = { ...prev }; delete n[localId]; return n; });
          URL.revokeObjectURL(localURL);
          return;
        }
        setUploadTasks((prev) => prev[localId]
          ? { ...prev, [localId]: { ...prev[localId], status: "failed" } }
          : prev);
      },
      async () => {
        // Upload complete — NOW write real message to Firestore
        try {
          const fileURL = await getDownloadURL(storageRef);
          await sendMessage(chatId, currentUser.uid, {
            type, text: caption || "", fileURL,
            fileName: file.name,
            fileSize: type === "document" ? `${(file.size / 1024).toFixed(1)} KB` : "",
            ...(waveform ? { waveform } : {}),
            status: "sent",
          });
          URL.revokeObjectURL(localURL);
        } catch (e) { console.error("Final msg write error:", e); }
        // Remove from local pending
        setUploadTasks((prev) => { const n = { ...prev }; delete n[localId]; return n; });
      }
    );
    setAttachOpen(false);
  }, [chatId, currentUser, myProfile, otherUser, chatExists]);

  /* ── Voice recording ── */
  const startRecording = async () => {
    if (recordingStarted.current) return;
    recordingStarted.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recordingChunks.current = [];
      waveformSamples.current = [];

      // Set up AnalyserNode to capture amplitude while recording
      const actx = new (window.AudioContext || window.webkitAudioContext)();
      const source = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Sample amplitude every 100ms
      analyserTimer.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        // RMS of lower frequencies = voice amplitude
        let sum = 0;
        const bins = Math.floor(dataArray.length / 4);
        for (let i = 0; i < bins; i++) sum += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sum / bins);
        waveformSamples.current.push(rms); // 0–255 range
      }, 100);

      mr.ondataavailable = (e) => { if (e.data.size > 0) recordingChunks.current.push(e.data); };
      mr.onstop = () => {
        // Downsample collected samples to 64 values, normalise to 0–100
        clearInterval(analyserTimer.current);
        actx.close();

        // Too short — don't send, show tooltip instead
        if (recordingElapsed.current < 1) {
          stream.getTracks().forEach((t) => t.stop());
          clearInterval(recordingTimer.current);
          setRecordingTime(0); setRecording(false); setMediaRecorder(null);
          recordingStarted.current = false;
          waveformSamples.current = [];
          recordingChunks.current = [];
          setShowMicTooltip(true);
          setTimeout(() => setShowMicTooltip(false), 2500);
          return;
        }

        const raw = waveformSamples.current;
        const COUNT = 64;
        const waveform = Array.from({ length: COUNT }, (_, i) => {
          const start = Math.floor((i / COUNT) * raw.length);
          const end = Math.floor(((i + 1) / COUNT) * raw.length) || start + 1;
          const slice = raw.slice(start, end);
          const avg = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
          return Math.round((avg / 255) * 100);
        });
        const maxVal = Math.max(...waveform, 1);
        const normalised = waveform.map((v) => Math.round((v / maxVal) * 100));

        const blob = new Blob(recordingChunks.current, { type: "audio/webm" });
        handleSendFile(new File([blob], "voice-message.webm", { type: "audio/webm" }), "audio", normalised);
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordingTimer.current);
        setRecordingTime(0); setRecording(false); setMediaRecorder(null);
        recordingStarted.current = false;
      };
      mr.start(); setMediaRecorder(mr); setRecording(true);
      recordingElapsed.current = 0;
      recordingTimer.current = setInterval(() => {
        recordingElapsed.current += 1;
        setRecordingTime((p) => p + 1);
      }, 1000);
    } catch (e) { alert("Microphone access denied"); recordingStarted.current = false; }
  };
  const stopRecording = () => { if (mediaRecorder) mediaRecorder.stop(); };
  const cancelRecording = () => {
    if (mediaRecorder) {
      clearInterval(analyserTimer.current);
      analyserRef.current = null;
      mediaRecorder.ondataavailable = null; mediaRecorder.onstop = () => { };
      mediaRecorder.stop(); mediaRecorder.stream?.getTracks().forEach((t) => t.stop());
      clearInterval(recordingTimer.current);
      setRecordingTime(0); setRecording(false); setMediaRecorder(null);
      recordingChunks.current = [];
      waveformSamples.current = [];
      recordingStarted.current = false;
    }
  };
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Bubble menu actions ── */
  const handleBubReact = async (em) => {
    const msgId = bubMenu.msgId;
    setBubMenu(null);
    setReactions((p) => ({ ...p, [msgId]: em })); // optimistic
    try { await reactToMessage(chatId, msgId, em); } catch (e) { console.error(e); }
  };

  const handleBubReply = () => {
    setReply({ user: bubMenu.isMine ? "You" : (otherUser?.fullName || otherUser?.name || ""), text: bubMenu.text, msgId: bubMenu.msgId });
    setBubMenu(null);
    inputRef.current?.focus();
  };

  const handleBubCopy = () => { navigator.clipboard.writeText(bubMenu.text || "").catch(() => { }); setBubMenu(null); };
  const handleBubForward = () => {
    const msg = messages.find((m) => m.id === bubMenu.msgId);
    if (!msg) return;
    setFwdData({
      type: msg.type || "text",
      text: msg.text || "",
      fileURL: msg.fileURL || "",
      fileName: msg.fileName || "",
      fileSize: msg.fileSize || "",
      waveform: msg.waveform || null,
    });
    setFwdSel(new Set());
    setBubMenu(null);
  };
  const handleBubSelect = () => { setSelMode(true); setSelMsgs(new Set([bubMenu.msgId])); setBubMenu(null); };

  const handleBubDelete = async () => {
    const msgId = bubMenu.msgId;
    setBubMenu(null);
    setDeletedIds((p) => new Set([...p, msgId])); // optimistic
    try { await deleteMessage(chatId, msgId); }
    catch (e) { setDeletedIds((p) => { const n = new Set(p); n.delete(msgId); return n; }); }
  };

  /* ── Group messages by date ── */
  const grouped = (() => {
    const out = []; let lastLabel = null;
    messages.forEach((m) => {
      const lbl = getDateLabel(m.timestamp);
      if (lbl && lbl !== lastLabel) { out.push({ kind: "div", lbl }); lastLabel = lbl; }
      out.push({ kind: "msg", m });
    });
    return out;
  })();

  const isNewChat = messages.length === 0;
  const isMine = (m) => m.senderId === currentUser?.uid;

  return (
    <div ref={overlayRef} className="cw-overlay" onClick={() => { setBubMenu(null); setMenuOpen(false); }}>

      {/* Header */}
      <div className="co-header" onClick={(e) => e.stopPropagation()}>
        <button className="co-back-btn" onClick={() => navigate("/chats")}>
          <i className="bx bx-arrow-back" />
        </button>
        <div style={{ cursor: "pointer" }} onClick={() => otherUid && navigate(`/user/${otherUid}`)}>
          <ChatAvatar photoURL={otherUser?.photoURL} name={otherUser?.fullName || otherUser?.name || "..."} size={38} />
        </div>
        <div
          className="co-header-info"
          style={{ cursor: "pointer" }}
          onClick={() => otherUid && navigate(`/user/${otherUid}`)}
        >
          <div className="co-header-name">{otherUser?.fullName || otherUser?.name || "..."}</div>
          <div className="co-header-presence">
            {otherUserPresence?.online
              ? <span className="co-presence-online">online</span>
              : otherUserPresence?.lastSeen
                ? <span className="co-presence-lastseen">{formatLastSeen(otherUserPresence.lastSeen)}</span>
                : null
            }
          </div>
        </div>
        <div className="co-menu-wrap" onClick={(e) => e.stopPropagation()}>
          <button className="co-icon-btn" onClick={() => setMenuOpen((p) => !p)}>
            <i className="bx bx-dots-vertical-rounded" />
          </button>
          {menuOpen && (
            <div className="co-menu-dropdown">
              <div className="co-menu-item" onClick={() => { setModal({ type: "block" }); setMenuOpen(false); }}>
                <i className="bx bx-block" /><span>{isBlocked ? "Unblock user" : "Block user"}</span>
              </div>
              <div className="co-menu-item" onClick={() => { setModal({ type: "clearChat" }); setMenuOpen(false); }}>
                <i className="bx bx-eraser" /><span>Clear chat</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="co-messages" ref={messagesRef} onScroll={handleMessagesScroll}>
        {isNewChat && (
          <div className="co-sayhi-wrap">
            <div className="co-sayhi-avatar">
              <ChatAvatar photoURL={otherUser?.photoURL} name={otherUser?.fullName || otherUser?.name || ""} size={64} />
            </div>
            <p className="co-sayhi-name">{otherUser?.fullName || otherUser?.name || ""}</p>
            <p className="co-sayhi-hint">Say something nice to start the conversation!</p>
            <div className="co-sayhi-stickers">
              {SAY_HI.map((s, i) => (
                <button key={i} className="co-sayhi-btn" style={{ animationDelay: `${i * 0.07}s` }} onClick={() => handleSend(s.emoji + " " + s.label)}>
                  <span className="co-sayhi-emoji">{s.emoji}</span>
                  <span className="co-sayhi-label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {grouped.map((item, idx) =>
          item.kind === "div" ? (
            <div key={`d-${idx}`} className="co-day-divider"><span>{item.lbl}</span></div>
          ) : (
            <MsgBubble
              key={item.m.id}
              msg={item.m}
              isMine={isMine(item.m)}
              reaction={reactions[item.m.id] || item.m.reaction}
              msgStatus={(() => {
                if (!isMine(item.m)) return null;
                if (item.m.status === "uploading" || uploadTasks[item.m.localId]) return "sending";
                if (!item.m.timestamp) return "sending";
                const otherUid = item.m.senderId === currentUser?.uid
                  ? Object.keys(chatData?.readBy || {}).find((u) => u !== currentUser?.uid)
                  : null;
                const readByOther = otherUid && chatData?.readBy?.[otherUid];
                if (readByOther) {
                  const readTs = readByOther.toMillis ? readByOther.toMillis() : 0;
                  const msgTs = item.m.timestamp?.toMillis ? item.m.timestamp.toMillis() : 0;
                  if (readTs >= msgTs) return "read";
                }
                // Delivered = other user has unread count > 0 meaning they received but not read
                const theirUnread = chatData?.unreadCount?.[otherUid] || 0;
                if (otherUid && theirUnread > 0) return "delivered";
                // Also delivered if they've ever read any message (readBy exists at all)
                if (readByOther) return "delivered";
                return "sent";
              })()}
              isSel={selMsgs.has(item.m.id)}
              selMode={selMode}
              isDeleted={deletedIds.has(item.m.id) || item.m.deleted}
              isHighlighted={highlightId === item.m.id}
              onTap={() => {
                if (selMode) setSelMsgs((p) => { const n = new Set(p); n.has(item.m.id) ? n.delete(item.m.id) : n.add(item.m.id); return n; });
              }}
              onCtx={(e) => {
                e.preventDefault(); e.stopPropagation();
                const preview = item.m.text || (item.m.type === "image" ? "📷 Photo" : item.m.type === "audio" ? "🎵 Audio" : item.m.type === "document" ? `📄 ${item.m.fileName}` : "");
                setBubMenu({ msgId: item.m.id, x: e.clientX, y: e.clientY, text: preview, isMine: isMine(item.m) });
              }}
              onReply={() => {
                const preview = item.m.text || (item.m.type === "image" ? "📷 Photo" : item.m.type === "audio" ? "🎵 Audio" : item.m.type === "document" ? `📄 ${item.m.fileName}` : "Message");
                setReply({ user: isMine(item.m) ? "You" : (otherUser?.fullName || ""), text: preview, msgId: item.m.id });
              }}
              onImageClick={(url) => {
                const mediaItems = messages
                  .filter((m) => m.type === "image" && m.fileURL)
                  .map((m) => ({
                    url: m.fileURL,
                    msgId: m.id,
                    isVideo: !!m.fileName?.match(/\.(mp4|webm|mov|avi|mkv)$/i),
                    timestamp: m.timestamp,
                    senderId: m.senderId,
                    reactions: m.reactions || {},
                  }));
                const idx = mediaItems.findIndex((m) => m.url === url);
                setMediaViewer({ items: mediaItems, index: Math.max(0, idx) });
              }}
              onVideoOpen={(url) => {
                const mediaItems = messages
                  .filter((m) => m.type === "image" && m.fileURL)
                  .map((m) => ({
                    url: m.fileURL,
                    msgId: m.id,
                    isVideo: !!m.fileName?.match(/\.(mp4|webm|mov|avi|mkv)$/i),
                    timestamp: m.timestamp,
                    senderId: m.senderId,
                    reactions: m.reactions || {},
                  }));
                const idx = mediaItems.findIndex((m) => m.url === url);
                setMediaViewer({ items: mediaItems, index: Math.max(0, idx) });
              }}
              onReactionClick={(msg) => setReactionSheet({ msg })}
              onMarkAudioPlayed={() => markAudioPlayed(chatId, item.m.id).catch(() => {})}
              onScrollToReply={scrollToMessage}
            />
          )
        )}
        {/* Pending uploads — local only, disappear on refresh */}
        {Object.entries(uploadTasks).map(([localId, task]) => {
          const cancelFn = () => {
            task.task.cancel();
            setUploadTasks((prev) => { const n = { ...prev }; delete n[localId]; return n; });
          };
          const retryFn = () => handleSendFile(task.file, task.forceType, task.waveform, task.caption, localId);
          const timeStr = new Date(task.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={localId} className="co-msg sent">
              <div className="co-msg-content">
                {/* Image / Video pending */}
                {task.type === "image" && (
                  <div className="co-bubble sent" style={{ padding: 4, overflow: "visible" }}>
                    <div className="co-img-msg" style={{ borderRadius: 14, overflow: "hidden", margin: 0, maxWidth: 260, position: "relative", minHeight: 120, background: "#111" }}>
                      {task.file.type.startsWith("video/")
                        ? <video src={task.localURL} style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover" }} muted playsInline />
                        : <img src={task.localURL} alt={task.file.name} style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover" }} />
                      }
                      {task.file.type.startsWith("video/") && task.status !== "failed" && task.progress == null && (
                        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }}>
                          <i className="bx bx-play" style={{ fontSize: 40, color: "#fff", opacity: 0.8 }} />
                        </div>
                      )}
                      <div className="co-upload-overlay">
                        {task.status === "failed"
                          ? <button className="co-retry-btn" onClick={retryFn}><i className="bx bx-upload" /><span>Retry</span></button>
                          : <UploadProgress progress={task.progress} onCancel={cancelFn} />
                        }
                      </div>
                      <div className="co-img-ts-overlay">
                        {timeStr}
                        <span className="co-msg-status co-msg-status--sending"><i className="bx bx-time-five" /></span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Audio pending */}
                {task.type === "audio" && (
                  <div className="co-bubble sent" style={{ padding: "4px 10px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                      <i className="bx bx-microphone" style={{ fontSize: 20 }} />
                      <span style={{ flex: 1 }}>Uploading voice… {task.progress}%</span>
                      {task.status !== "failed" && (
                        <button onClick={cancelFn} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18, padding: 0 }}>
                          <i className="bx bx-x" />
                        </button>
                      )}
                      {task.status === "failed" && (
                        <button onClick={retryFn} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: 13, padding: 0 }}>Retry</button>
                      )}
                    </div>
                    <span className="co-timestamp">{timeStr} <span className="co-msg-status co-msg-status--sending"><i className="bx bx-time-five" /></span></span>
                  </div>
                )}
                {/* Document pending */}
                {task.type === "document" && (
                  <div className="co-bubble sent" style={{ padding: "10px 14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                      <i className="bx bx-file-blank" style={{ fontSize: 24, color: "#a78bfa" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.file.name}</div>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>{task.progress}% uploaded</div>
                      </div>
                      {task.status !== "failed"
                        ? <button onClick={cancelFn} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 18 }}><i className="bx bx-x" /></button>
                        : <button onClick={retryFn} style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: 13 }}>Retry</button>
                      }
                    </div>
                    <span className="co-timestamp">{timeStr} <span className="co-msg-status co-msg-status--sending"><i className="bx bx-time-five" /></span></span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          className="cw-scroll-btn"
          onClick={() => endRef.current?.scrollIntoView({ behavior: "smooth" })}
        >
          <i className="bx bx-chevron-down" />
        </button>
      )}

      {/* Block bar — shows when blocked, replaces input */}
      {isBlocked && (
        <div className="co-block-bar">
          <i className="bx bx-block" />
          <span>You blocked this contact.</span>
          <button onClick={async () => {
            try { await unblockUser(currentUser.uid, otherUid); setIsBlocked(false); }
            catch (e) { console.error(e); }
          }}>Unblock</button>
        </div>
      )}

      {/* Select bar */}
      {selMode && (
        <div className="co-select-bar">
          <button className="co-sel-cancel" onClick={() => { setSelMode(false); setSelMsgs(new Set()); }}>
            <i className="bx bx-x" />
          </button>
          <span className="co-sel-count">{selMsgs.size} selected</span>
          <div className="co-sel-actions">
            <button className="co-sel-btn" title="Forward" onClick={() => {
              // Collect selected messages in chronological order
              const selected = messages
                .filter((m) => selMsgs.has(m.id))
                .sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
              if (selected.length === 0) return;
              // Use multi-forward: store array of fwdData items
              setFwdDataMulti(selected.map((m) => ({
                type: m.type || "text",
                text: m.text || "",
                fileURL: m.fileURL || "",
                fileName: m.fileName || "",
                fileSize: m.fileSize || "",
                waveform: m.waveform || null,
              })));
              setFwdSel(new Set());
              setSelMode(false);
              setSelMsgs(new Set());
            }}>
              <i className="bx bx-share-alt" />
            </button>
            <button className="co-sel-btn" title="Copy" onClick={() => {
              const text = messages.filter((m) => selMsgs.has(m.id)).map((m) => m.text).filter(Boolean).join("\n");
              navigator.clipboard.writeText(text).catch(() => { });
              setSelMode(false); setSelMsgs(new Set());
            }}>
              <i className="bx bx-copy" />
            </button>
            <button className="co-sel-btn" title="Delete" onClick={async () => {
              const ids = [...selMsgs];
              setDeletedIds((p) => new Set([...p, ...ids]));
              setSelMode(false); setSelMsgs(new Set());
              for (const msgId of ids) {
                try { await deleteMessage(chatId, msgId); } catch (e) { console.error(e); }
              }
            }}>
              <i className="bx bx-trash" />
            </button>
          </div>
        </div>
      )}

      {/* Input area — hidden when blocked */}
      {!selMode && !isBlocked && (
        <div className="co-input-area" onClick={(e) => e.stopPropagation()}>
          {reply && (
            <div className="co-reply-preview">
              <div className="co-reply-content">
                <strong>{reply.user}</strong>
                <span>{reply.text}</span>
              </div>
              <button className="co-close-reply" onClick={() => setReply(null)}><i className="bx bx-x" /></button>
            </div>
          )}

          {recording ? (
            <div className="co-recording-bar">
              <button className="co-rec-cancel" onClick={cancelRecording}><i className="bx bx-x" /></button>
              <div className="co-rec-indicator">
                <span className="co-rec-dot" />
                <span className="co-rec-time">{fmt(recordingTime)}</span>
                <span className="co-rec-label">Recording…</span>
              </div>
              <button className="co-rec-send" onClick={stopRecording}><i className="bx bx-send" /></button>
            </div>
          ) : (
            <div className="co-input-box">
              <div className="co-input-row">
                <div className="co-attach-wrap" ref={attachRef}>
                  <button className="co-attach-btn" onClick={(e) => { e.stopPropagation(); setAttachOpen((p) => !p); }}>
                    <i className="bx bx-plus" />
                  </button>
                  {attachOpen && (
                    <div className="co-attach-popup">
                      <button className="co-attach-item" onClick={() => { docRef.current?.click(); setAttachOpen(false); }}>
                        <span className="co-attach-icon doc-icon"><i className="bx bx-file" /></span><span>Document</span>
                      </button>
                      <button className="co-attach-item" onClick={() => { imageRef.current?.click(); setAttachOpen(false); }}>
                        <span className="co-attach-icon img-icon"><i className="bx bx-image" /></span><span>Photos &amp; Videos</span>
                      </button>
                      <button className="co-attach-item" onClick={() => { setCameraOpen(true); setAttachOpen(false); }}>
                        <span className="co-attach-icon cam-icon"><i className="bx bx-camera" /></span><span>Camera</span>
                      </button>
                      <button className="co-attach-item" onClick={() => { audioRef.current?.click(); setAttachOpen(false); }}>
                        <span className="co-attach-icon aud-icon"><i className="bx bx-headphone" /></span><span>Audio</span>
                      </button>
                    </div>
                  )}
                </div>
                <input ref={imageRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={(e) => { handleSendFile(e.target.files[0]); e.target.value = ""; }} />
                <input ref={cameraRef} type="file" accept="image/*,video/*" capture="environment" style={{ display: "none" }} onChange={(e) => { handleSendFile(e.target.files[0], "image"); e.target.value = ""; }} />
                <input ref={docRef} type="file" accept=".pdf,.doc,.docx,.txt,.zip,.xls,.xlsx,.ppt,.pptx" style={{ display: "none" }} onChange={(e) => { handleSendFile(e.target.files[0]); e.target.value = ""; }} />
                <input ref={audioRef} type="file" accept="audio/*" style={{ display: "none" }} onChange={(e) => { handleSendFile(e.target.files[0], "audio"); e.target.value = ""; }} />
                <input
                  ref={inputRef} value={input}
                  type="search"
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Type a message…"
                  autoComplete="off"
                  enterKeyHint="send"
                />
                {input.trim() ? (
                  <button className="co-send-btn" onClick={() => handleSend()} disabled={sending}>
                    <i className="bx bx-send" />
                  </button>
                ) : (
                  <div className="co-mic-wrap">
                    {showMicTooltip && (
                      <div className="co-mic-tooltip">Hold to record, release to send</div>
                    )}
                    <button
                      className="co-mic-btn"
                      onPointerDown={(e) => { e.preventDefault(); startRecording(); }}
                      title="Hold to record"
                    >
                      <i className="bx bx-microphone" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox */}
      {lightbox && createPortal(
        <div className="cw-lightbox" onClick={() => setLightbox(null)}>
          <button className="cw-lightbox-close" onClick={() => setLightbox(null)}><i className="bx bx-x" /></button>
          <CachedImage src={lightbox} alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>,
        document.body
      )}

      {/* Fullscreen Video Player */}
      {mediaViewer && createPortal(
        <MediaViewer
          items={mediaViewer.items}
          startIndex={mediaViewer.index}
          onClose={() => setMediaViewer(null)}
          otherName={otherUser?.fullName || otherUser?.name || ""}
          chatId={chatId}
          myUid={currentUser?.uid}
          myName={myProfile?.fullName || "You"}
          myPhoto={myProfile?.photoURL || null}
          otherUser={otherUser}
          onReact={async (msgId, emoji) => {
            try { await reactToMessage(chatId, msgId, emoji, currentUser.uid); } catch (e) { console.error(e); }
          }}
        />,
        document.body
      )}

      {/* Bubble menu */}
      {bubMenu && (
        <BubbleMenu
          x={bubMenu.x} y={bubMenu.y}
          onClose={() => setBubMenu(null)}
          onReact={handleBubReact}
          onReply={handleBubReply}
          onCopy={handleBubCopy}
          onForward={handleBubForward}
          onSelect={handleBubSelect}
          onDelete={handleBubDelete}
        />
      )}

      {/* Block modal */}
      {modal?.type === "block" && createPortal(
        <div className="cw-modal-overlay" onClick={() => setModal(null)}>
          <div className="cw-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{isBlocked ? "Unblock user?" : "Block user?"}</h3>
            <p>{isBlocked ? "They will be able to message you again." : "They won't be able to message you. They won't know they've been blocked."}</p>
            <div className="cw-modal-actions">
              <button className="cw-btn-cancel" onClick={() => setModal(null)}>Cancel</button>
              <button className="cw-btn-danger" onClick={async () => {
                setModal(null);
                try {
                  if (isBlocked) { await unblockUser(currentUser.uid, otherUid); setIsBlocked(false); }
                  else { await blockUser(currentUser.uid, otherUid); setIsBlocked(true); }
                } catch (e) { console.error(e); }
              }}>
                {isBlocked ? "Unblock" : "Block"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Clear chat modal */}
      {modal?.type === "clearChat" && createPortal(
        <div className="cw-modal-overlay" onClick={() => setModal(null)}>
          <div className="cw-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Clear this chat?</h3>
            <p>All messages will be removed from your view. This only affects your device.</p>
            <div className="cw-modal-actions">
              <button className="cw-btn-cancel" onClick={() => setModal(null)}>Cancel</button>
              <button className="cw-btn-danger" onClick={() => {
                setClearedAt(Date.now());
                clearChatPreview(chatId).catch((e) => console.error(e));
                setModal(null);
              }}>Clear</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Forward modal */}
      {fwdData && createPortal(
        <div className="co-modal-backdrop" onClick={() => setFwdData(null)}>
          <div className="co-fwd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="co-fwd-header">
              <button className="co-icon-btn" onClick={() => setFwdData(null)}>
                <i className="bx bx-x" />
              </button>
              <h3>Forward to</h3>
            </div>
            <div className="co-fwd-list">
              {chats.map((chat) => {
                const otherId = chat.participants?.find((p) => p !== currentUser?.uid);
                const info = chat.participantInfo?.[otherId] || {};
                const name = info.name || "Unknown";
                const photoURL = info.photoURL || null;
                const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div
                    key={chat.id}
                    className={`co-fwd-item${fwdSel.has(chat.id) ? " sel" : ""}`}
                    onClick={() => setFwdSel((p) => { const n = new Set(p); n.has(chat.id) ? n.delete(chat.id) : n.add(chat.id); return n; })}
                  >
                    <div className="co-fwd-check">{fwdSel.has(chat.id) && <i className="bx bx-check" />}</div>
                    {photoURL
                      ? <CachedImage src={photoURL} alt={name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      : <div className="co-avatar av-purple" style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0 }}>{initials}</div>
                    }
                    <span>{name}</span>
                  </div>
                );
              })}
              {chats.length === 0 && (
                <div style={{ padding: "30px 16px", textAlign: "center", color: "#555", fontSize: 13 }}>No conversations yet</div>
              )}
            </div>
            <button
              className="co-fwd-send"
              disabled={fwdSel.size === 0}
              onClick={() => {
                const targets = [...fwdSel];
                const data = { ...fwdData };
                // Close modal and navigate immediately
                setFwdData(null); setFwdSel(new Set());
                if (targets.length === 1) {
                  navigate(`/chat/${targets[0]}`);
                } else {
                  navigate("/chats");
                }
                // Send in background — no await
                targets.forEach((chatIdFwd) => {
                  sendMessage(chatIdFwd, currentUser.uid, {
                    type: data.type, text: data.text,
                    fileURL: data.fileURL, fileName: data.fileName,
                    fileSize: data.fileSize,
                    ...(data.waveform ? { waveform: data.waveform } : {}),
                    forwarded: true,
                  }).catch((e) => console.error(e));
                });
              }}
            >
              <i className="bx bx-send" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Multi-forward modal — for forwarding multiple selected messages */}
      {fwdDataMulti && createPortal(
        <div className="co-modal-backdrop" onClick={() => setFwdDataMulti(null)}>
          <div className="co-fwd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="co-fwd-header">
              <button className="co-icon-btn" onClick={() => setFwdDataMulti(null)}>
                <i className="bx bx-x" />
              </button>
              <h3>Forward {fwdDataMulti.length} message{fwdDataMulti.length > 1 ? "s" : ""} to</h3>
            </div>
            <div className="co-fwd-list">
              {chats.map((chat) => {
                const otherId = chat.participants?.find((p) => p !== currentUser?.uid);
                const info = chat.participantInfo?.[otherId] || {};
                const name = info.name || "Unknown";
                const photoURL = info.photoURL || null;
                const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <div
                    key={chat.id}
                    className={`co-fwd-item${fwdSel.has(chat.id) ? " sel" : ""}`}
                    onClick={() => setFwdSel((p) => { const n = new Set(p); n.has(chat.id) ? n.delete(chat.id) : n.add(chat.id); return n; })}
                  >
                    <div className="co-fwd-check">{fwdSel.has(chat.id) && <i className="bx bx-check" />}</div>
                    {photoURL
                      ? <CachedImage src={photoURL} alt={name} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                      : <div className="co-avatar av-purple" style={{ width: 38, height: 38, fontSize: 13, flexShrink: 0 }}>{initials}</div>
                    }
                    <span>{name}</span>
                  </div>
                );
              })}
              {chats.length === 0 && (
                <div style={{ padding: "30px 16px", textAlign: "center", color: "#555", fontSize: 13 }}>No conversations yet</div>
              )}
            </div>
            <button
              className="co-fwd-send"
              disabled={fwdSel.size === 0}
              onClick={() => {
                const targets = [...fwdSel];
                const items = [...fwdDataMulti];
                // Close modal and navigate immediately
                setFwdDataMulti(null); setFwdSel(new Set());
                if (targets.length === 1) {
                  navigate(`/chat/${targets[0]}`);
                } else {
                  navigate("/chats");
                }
                // Send all messages in background — no await
                targets.forEach((chatIdFwd) => {
                  items.reduce((promise, item) =>
                    promise.then(() =>
                      sendMessage(chatIdFwd, currentUser.uid, {
                        type: item.type, text: item.text,
                        fileURL: item.fileURL, fileName: item.fileName,
                        fileSize: item.fileSize,
                        ...(item.waveform ? { waveform: item.waveform } : {}),
                        forwarded: true,
                      }).catch((e) => console.error(e))
                    ), Promise.resolve()
                  );
                });
              }}
            >
              <i className="bx bx-send" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {cameraOpen && createPortal(
        <CameraModal
          onCapture={(file, caption) => {
            const isVideo = file.type.startsWith("video/");
            handleSendFile(file, isVideo ? "image" : "image", null, caption);
            setCameraOpen(false);
          }}
          onClose={() => setCameraOpen(false)}
        />,
        document.body
      )}
      {reactionSheet && createPortal(
        <ReactionsSheet
          msg={reactionSheet.msg}
          chatId={chatId}
          myUid={currentUser?.uid}
          myName={myProfile?.fullName || "You"}
          myPhoto={myProfile?.photoURL || null}
          otherUser={otherUser}
          onClose={() => setReactionSheet(null)}
          onReact={async (msgId, emoji) => {
            try { await reactToMessage(chatId, msgId, emoji, currentUser.uid); } catch (e) { console.error(e); }
          }}
        />,
        document.body
      )}
    </div>
  );
}

/* ── Reactions Sheet (standalone, for chat bubble reactions) ── */
function ReactionsSheet({ msg, chatId, myUid, myName, myPhoto, otherUser, onClose, onReact }) {
  const QUICK_REACTS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "💀"];
  const [filter, setFilter] = useState("all");

  const reacts = msg.reactions || (msg.reaction ? { [msg.senderId || "unknown"]: msg.reaction } : {});
  const total = Object.keys(reacts).length;

  // Group by emoji for tab counts
  const grouped = {};
  Object.values(reacts).forEach((em) => { grouped[em] = (grouped[em] || 0) + 1; });

  const filtered = filter === "all"
    ? Object.entries(reacts)
    : Object.entries(reacts).filter(([, em]) => em === filter);

  const userInfo = {};
  if (myUid) userInfo[myUid] = { name: myName || "You", photo: myPhoto };
  if (otherUser?.uid) userInfo[otherUser.uid] = { name: otherUser.fullName || otherUser.name || "User", photo: otherUser.photoURL || null };

  return createPortal(
    <div className="mv-sheet-backdrop" style={{ position: "fixed", zIndex: 9000 }} onClick={onClose}>
      <div className="mv-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mv-sheet-handle" />
        <div className="mv-sheet-title">{total} reaction{total !== 1 ? "s" : ""}</div>
        {/* Filter tabs */}
        <div className="mv-sheet-tabs">
          <button className={`mv-sheet-tab${filter === "all" ? " active" : ""}`} onClick={() => setFilter("all")}>
            <i className="bx bx-smile" />
          </button>
          {Object.entries(grouped).map(([em, count]) => (
            <button key={em} className={`mv-sheet-tab${filter === em ? " active" : ""}`} onClick={() => setFilter(em)}>
              {em} {count}
            </button>
          ))}
        </div>
        {/* Reactor list */}
        <div className="mv-sheet-list">
          {filtered.map(([uid, em]) => {
            const info = userInfo[uid] || { name: uid === myUid ? "You" : "User", photo: null };
            const initials = (info.name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={uid} className="mv-sheet-row">
                {info.photo
                  ? <CachedImage src={info.photo} alt={info.name} className="mv-sheet-avatar" />
                  : <div className="mv-sheet-avatar mv-sheet-initials">{initials}</div>
                }
                <span className="mv-sheet-name">{uid === myUid ? "You" : info.name}</span>
                <span className="mv-sheet-emoji">{em}</span>
              </div>
            );
          })}
        </div>
        {/* Add / change your reaction */}
        <div className="mv-sheet-add-row">
          {QUICK_REACTS.map((em) => (
            <span
              key={em}
              className={`mv-sheet-react-em${reacts[myUid] === em ? " selected" : ""}`}
              onClick={() => {
                const newEmoji = reacts[myUid] === em ? null : em;
                onReact(msg.id, newEmoji);
                onClose();
              }}
            >{em}</span>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Camera Modal ── */
function CameraModal({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoChunks = useRef([]);
  const timerRef = useRef(null);
  const galleryInputRef = useRef(null);
  const pinchRef = useRef({ dist: 0, zoom: 1 }); // pinch-to-zoom tracking

  const [ready, setReady] = useState(false);
  const [facingFront, setFacingFront] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("photo"); // "photo" | "video"
  const [captured, setCaptured] = useState(null); // { url, type, file }
  const [videoRecording, setVideoRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [galleryThumbs, setGalleryThumbs] = useState([]);

  const startStream = useCallback(async (front = false) => {
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    try {
      const constraints = {
        video: { facingMode: front ? "user" : "environment" },
        audio: true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Try to enable torch/flash if supported
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack?.getCapabilities?.()?.torch) {
        videoTrack.applyConstraints({ advanced: [{ torch: false }] });
      }
      streamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setReady(true);
          setError(null);
        }
      }, 50);
    } catch (e) {
      setError("Camera access denied or not available.");
    }
  }, []);

  useEffect(() => {
    startStream(false);
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      clearInterval(timerRef.current);
    };
  }, []); // eslint-disable-line

  // Toggle flash/torch
  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    const newVal = !flashOn;
    if (track?.getCapabilities?.()?.torch) {
      await track.applyConstraints({ advanced: [{ torch: newVal }] });
    }
    setFlashOn(newVal);
  };

  /* ── Photo ── */
  const handleSnap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (facingFront) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const byteStr = atob(dataUrl.split(",")[1]);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    const file = new File([arr], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
    setCaptured({ url: dataUrl, type: "photo", file });
  };

  /* ── Video ── */
  const startVideoRecord = () => {
    const stream = streamRef.current;
    if (!stream) return;
    videoChunks.current = [];
    const mr = new MediaRecorder(stream, { mimeType: "video/webm" });
    mr.ondataavailable = (e) => { if (e.data.size > 0) videoChunks.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(videoChunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const file = new File([blob], `video_${Date.now()}.webm`, { type: "video/webm" });
      setCaptured({ url, type: "video", file });
      setVideoRecording(false);
      setElapsed(0);
      clearInterval(timerRef.current);
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setVideoRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
  };

  const stopVideoRecord = () => {
    mediaRecorderRef.current?.stop();
    clearInterval(timerRef.current);
  };

  /* ── Gallery pick ── */
  const handleGalleryPick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onCapture(file);
  };

  /* ── Retake / Send ── */
  const handleRetake = () => {
    if (captured?.type === "video") URL.revokeObjectURL(captured.url);
    setCaptured(null);
    setElapsed(0);
    setCropPreview(null);
    setCaption("");
    // Restart stream — video element needs fresh srcObject after being hidden
    startStream(facingFront);
  };

  /* ── Crop state ── */
  const [cropOpen, setCropOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const cropCanvasRef = useRef(null);
  const cropImgRef = useRef(null);
  const cropOffsetRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, dragging: false });
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPreview, setCropPreview] = useState(null); // cropped dataUrl

  const openCrop = () => {
    setCropZoom(1);
    cropOffsetRef.current = { x: 0, y: 0, startX: 0, startY: 0, dragging: false };
    setCropOpen(true);
  };

  const drawCrop = useCallback((zoom, offset) => {
    const canvas = cropCanvasRef.current;
    const img = cropImgRef.current;
    if (!canvas || !img) return;
    const S = 280;
    canvas.width = S; canvas.height = S;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, S, S);
    const scale = Math.max(S / img.naturalWidth, S / img.naturalHeight) * zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const dx = (S - w) / 2 + offset.x;
    const dy = (S - h) / 2 + offset.y;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, S, S);
    ctx.clip();
    ctx.drawImage(img, dx, dy, w, h);
    ctx.restore();
    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    [S/3, 2*S/3].forEach(p => {
      ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(S, p); ctx.stroke();
    });
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, S-2, S-2);
  }, []);

  useEffect(() => {
    if (cropOpen) setTimeout(() => drawCrop(cropZoom, { x: cropOffsetRef.current.x, y: cropOffsetRef.current.y }), 50);
  }, [cropOpen, cropZoom, drawCrop]);

  const handleCropDone = () => {
    setCropPreview(cropCanvasRef.current?.toDataURL("image/jpeg", 0.92) || null);
    setCropOpen(false);
  };

  const handleSaveDevice = () => {
    if (!captured) return;
    const a = document.createElement("a");
    a.href = captured.url;
    a.download = captured.file.name;
    a.click();
  };

  const handleSendWithCaption = () => {
    if (!captured) return;
    if (cropPreview) {
      // Convert cropped preview to file
      const byteStr = atob(cropPreview.split(",")[1]);
      const arr = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
      const file = new File([arr], captured.file.name, { type: "image/jpeg" });
      onCapture(file, caption);
    } else {
      onCapture(captured.file, caption);
    }
  };

  const handleFlip = () => {
    const next = !facingFront;
    setFacingFront(next);
    setCaptured(null);
    startStream(next);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Pinch to zoom ── */
  const applyZoom = async (zoom) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const caps = track.getCapabilities?.();
    if (!caps?.zoom) return;
    const clamped = Math.max(caps.zoom.min, Math.min(caps.zoom.max, zoom));
    await track.applyConstraints({ advanced: [{ zoom: clamped }] });
    pinchRef.current.zoom = clamped;
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current.dist = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const newDist = Math.hypot(dx, dy);
    const scale = newDist / pinchRef.current.dist;
    pinchRef.current.dist = newDist;
    applyZoom(pinchRef.current.zoom * scale);
  };

  /* ── Scroll to zoom (desktop) ── */
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    applyZoom(pinchRef.current.zoom * delta);
  };
  const handleShutter = () => {
    if (mode === "photo") handleSnap();
    else if (videoRecording) stopVideoRecord();
    else startVideoRecord();
  };

  return (
    <div className="cam-overlay">
      {/* Full-screen viewfinder */}
      <div className="cam-viewfinder-full">
        {error ? (
          <div className="cam-error-full">
            <i className="bx bx-camera-off" />
            <p>{error}</p>
          </div>
        ) : captured ? (
          /* ── Full preview screen ── */
          <div className="cam-preview-screen">
            {/* Crop modal */}
            {cropOpen && (
              <div className="cam-crop-overlay">
                <div className="cam-crop-header">
                  <button className="cam-circle-btn" onClick={() => setCropOpen(false)}><i className="bx bx-x" /></button>
                  <span style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>Crop</span>
                  <button className="cam-circle-btn" onClick={handleCropDone}><i className="bx bx-check" /></button>
                </div>
                <div className="cam-crop-canvas-wrap"
                  onMouseDown={(e) => { cropOffsetRef.current.dragging = true; cropOffsetRef.current.startX = e.clientX - cropOffsetRef.current.x; cropOffsetRef.current.startY = e.clientY - cropOffsetRef.current.y; }}
                  onMouseMove={(e) => { if (!cropOffsetRef.current.dragging) return; cropOffsetRef.current.x = e.clientX - cropOffsetRef.current.startX; cropOffsetRef.current.y = e.clientY - cropOffsetRef.current.startY; drawCrop(cropZoom, cropOffsetRef.current); }}
                  onMouseUp={() => { cropOffsetRef.current.dragging = false; }}
                  onTouchStart={(e) => { const t = e.touches[0]; cropOffsetRef.current.dragging = true; cropOffsetRef.current.startX = t.clientX - cropOffsetRef.current.x; cropOffsetRef.current.startY = t.clientY - cropOffsetRef.current.y; }}
                  onTouchMove={(e) => { if (!cropOffsetRef.current.dragging) return; const t = e.touches[0]; cropOffsetRef.current.x = t.clientX - cropOffsetRef.current.startX; cropOffsetRef.current.y = t.clientY - cropOffsetRef.current.startY; drawCrop(cropZoom, cropOffsetRef.current); }}
                  onTouchEnd={() => { cropOffsetRef.current.dragging = false; }}
                >
                  <img ref={cropImgRef} src={captured.url} alt="" style={{ display: "none" }} onLoad={() => drawCrop(cropZoom, { x: 0, y: 0 })} />
                  <canvas ref={cropCanvasRef} className="cam-crop-canvas" />
                </div>
                <div className="cam-crop-zoom-row">
                  <i className="bx bx-minus" style={{ color: "#aaa" }} />
                  <input type="range" min="1" max="4" step="0.01" value={cropZoom}
                    onChange={(e) => { const z = Number(e.target.value); setCropZoom(z); drawCrop(z, cropOffsetRef.current); }}
                    className="cam-crop-slider"
                  />
                  <i className="bx bx-plus" style={{ color: "#aaa" }} />
                </div>
              </div>
            )}

            {/* Preview image/video */}
            {captured.type === "photo"
              ? <img src={cropPreview || captured.url} alt="preview" className="cam-preview-img-full" />
              : <video src={captured.url} className="cam-preview-img-full" controls autoPlay loop />
            }

            {/* Top toolbar */}
            <div className="cam-preview-topbar">
              <button className="cam-circle-btn" onClick={handleRetake}><i className="bx bx-x" /></button>
              <div className="cam-preview-actions">
                <button className="cam-circle-btn" onClick={handleSaveDevice} title="Save to device">
                  <i className="bx bx-download" />
                </button>
                {captured.type === "photo" && (
                  <button className="cam-circle-btn" onClick={openCrop} title="Crop">
                    <i className="bx bx-crop" />
                  </button>
                )}
              </div>
            </div>

            {/* Bottom caption + send */}
            <div className="cam-preview-bottom">
              <div className="cam-caption-row">
                <i className="bx bx-image-add" style={{ color: "#aaa", fontSize: 22, flexShrink: 0 }} />
                <input
                  className="cam-caption-input"
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendWithCaption()}
                  autoComplete="off"
                />
              </div>
              <button className="cam-send-fab" onClick={handleSendWithCaption}>
                <i className="bx bx-send" />
              </button>
            </div>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="cam-live-video"
            autoPlay playsInline muted
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onWheel={handleWheel}
            style={{ touchAction: "none", transform: facingFront ? "scaleX(-1)" : "none" }}
          />
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Top overlaid buttons */}
        {!captured && (
          <div className="cam-top-bar">
            <button className="cam-circle-btn" onClick={onClose}>
              <i className="bx bx-x" />
            </button>
            <button className={`cam-circle-btn${flashOn ? " cam-flash-on" : " cam-flash-off"}`} onClick={toggleFlash}>
              <span className="cam-flash-icon">⚡</span>
            </button>
          </div>
        )}

        {/* Recording timer badge */}
        {videoRecording && (
          <div className="cam-rec-badge">
            <span className="cam-rec-dot" />{fmt(elapsed)}
          </div>
        )}

        {/* Captured top bar — handled inside preview screen */}
      </div>

      {/* Bottom panel — hidden when preview is showing */}
      {!captured && (
      <div className="cam-bottom-panel">
            {/* Controls row: gallery | shutter | flip */}
            <div className="cam-controls-row">
              {/* Gallery button — hidden while recording */}
              {!videoRecording && (
                <button className="cam-side-btn" onClick={() => galleryInputRef.current?.click()}>
                  <i className="bx bx-image" />
                </button>
              )}
              {videoRecording && <div style={{ width: 50 }} />}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,video/*"
                style={{ display: "none" }}
                onChange={handleGalleryPick}
              />

              {/* Shutter */}
              <button
                className={`cam-shutter${videoRecording ? " cam-shutter-recording" : ""}`}
                onClick={handleShutter}
                disabled={!ready}
              >
                <div className={`cam-shutter-inner${videoRecording ? " cam-shutter-stop" : ""}`} />
              </button>

              {/* Flip */}
              <button className="cam-side-btn" onClick={handleFlip}>
                <span className="cam-flip-icon">
                  <i className="bx bx-camera" />
                  <span className="cam-flip-arrow">↺</span>
                </span>
              </button>
            </div>

            {/* Mode tabs */}
            {!videoRecording && (
              <div className="cam-mode-tabs">
                <button
                  className={`cam-mode-tab${mode === "video" ? " active" : ""}`}
                  onClick={() => setMode("video")}
                >Video</button>
                <button
                  className={`cam-mode-tab${mode === "photo" ? " active" : ""}`}
                  onClick={() => setMode("photo")}
                >Photo</button>
              </div>
            )}
      </div>
      )}
    </div>
  );
}

/* ── Audio Player ── */
const AudioPlayer = memo(function AudioPlayer({ src, isMine, waveform, timestamp, msgStatus, isPlayed, onMarkPlayed }) {
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const draggingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const playedRef = useRef(isPlayed || false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [played, setPlayed] = useState(isPlayed || false);
  const [resolvedSrc, setResolvedSrc] = useState(null);

  // Resolve blob URL (cached) for the audio source
  useEffect(() => {
    if (!src) { setResolvedSrc(null); return; }
    let cancelled = false;
    import("../../utils/appCache").then(({ getBlobUrl }) => {
      getBlobUrl(src).then((url) => { if (!cancelled) setResolvedSrc(url || src); });
    });
    return () => { cancelled = true; };
  }, [src]);

  const bars = useRef(
    waveform && waveform.length > 0
      ? waveform
      : Array.from({ length: 64 }, (_, i) => {
          const t = i / 63;
          const env = Math.sin(t * Math.PI);
          const noise = 0.5 + 0.5 * Math.sin(i * 1.9 + 0.3) * Math.cos(i * 0.7);
          return Math.round((0.1 + env * 0.8 * noise) * 100);
        })
  ).current;

  const drawFrame = (prog) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const barW = 2.5, gap = 1;
    const totalW = bars.length * (barW + gap) - gap;
    const startX = (W - totalW) / 2;

    const isPlayedNow = playedRef.current;
    const dotR = draggingRef.current ? 8 : 6;
    // Waveform spans from dotR to W-dotR so dot never gets clipped at edges
    const waveStartX = dotR;
    const waveEndX = W - dotR;
    const waveW = waveEndX - waveStartX;
    const dotX = waveStartX + waveW * prog;
    const playedX = dotX;
    const glowRadius = 50;
    bars.forEach((v, i) => {
      const barH = Math.max(3, Math.round((v / 100) * (H - 4)));
      const x = waveStartX + (i / (bars.length - 1)) * waveW - barW / 2;
      const y = (H - barH) / 2;
      const barCx = x + barW / 2;
      const barIsPlayed = barCx < playedX;
      const dist = Math.abs(barCx - dotX);
      const glow = Math.max(0, 1 - (dist / glowRadius) ** 1.5);
      if (barIsPlayed) {
        const alpha = 0.5 + glow * 0.5;
        const [r, g, b] = isPlayedNow ? [160, 196, 255] : (isMine ? [255, 255, 255] : [167, 139, 250]);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
      } else {
        const alpha = 0.18 + glow * 0.55;
        const [r, g, b] = isPlayedNow ? [160, 196, 255] : (isMine ? [255, 255, 255] : [167, 139, 250]);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
      }
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 1.5);
      ctx.fill();
    });

    // Dot always white — reaches full left and right edges
    ctx.beginPath();
    ctx.arc(dotX, H / 2, dotR, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
  };

  // Fix drag coordinate mapping: use same waveStartX/waveEndX as drawFrame
  const getPct = (clientX) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const canvasX = (clientX - rect.left) * scaleX;
    const dotR = 6;
    const waveStartX = dotR;
    const waveEndX = canvas.width - dotR;
    const waveW = waveEndX - waveStartX;
    return Math.max(0, Math.min(1, (canvasX - waveStartX) / waveW));
  };

  const startRaf = () => {
    const loop = () => {
      const a = audioRef.current;
      if (!a || (a.paused && !draggingRef.current)) {
        // Draw one final frame at current position before stopping
        if (a) drawFrame(a.duration ? a.currentTime / a.duration : 0);
        return;
      }
      const prog = a.duration ? a.currentTime / a.duration : 0;
      drawFrame(prog);
      setCurrent(a.currentTime);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const stopRaf = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => {
    // Small delay ensures canvas is painted and has real dimensions
    const t = setTimeout(() => drawFrame(0), 30);
    return () => { clearTimeout(t); stopRaf(); };
  }, []); // eslint-disable-line

  // Redraw when played state changes (colour switch) — also sync ref
  useEffect(() => {
    playedRef.current = played;
    const a = audioRef.current;
    const prog = a?.duration ? a.currentTime / a.duration : 0;
    drawFrame(prog);
  }, [played]); // eslint-disable-line

  // Global drag listeners
  useEffect(() => {
    const onMouseMove = (e) => {
      if (!draggingRef.current) return;
      const a = audioRef.current;
      if (!a || !a.duration) return;
      const pct = getPct(e.clientX);
      a.currentTime = pct * a.duration;
      setCurrent(pct * a.duration);
      drawFrame(pct);
    };
    const onTouchMove = (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const a = audioRef.current;
      if (!a || !a.duration) return;
      const pct = getPct(e.touches[0].clientX);
      a.currentTime = pct * a.duration;
      setCurrent(pct * a.duration);
      drawFrame(pct);
    };
    const onEnd = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      stopRaf();
      const a = audioRef.current;
      if (!a) return;
      if (wasPlayingRef.current) {
        a.play().catch(() => {});
        startRaf();
      } else {
        drawFrame(a.duration ? a.currentTime / a.duration : 0);
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []); // eslint-disable-line

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const handlePointerDown = (clientX) => {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    draggingRef.current = true;
    wasPlayingRef.current = !a.paused;
    if (!a.paused) { a.pause(); stopRaf(); }
    startRaf(); // keep drawing every frame during drag
    const pct = getPct(clientX);
    a.currentTime = pct * a.duration;
    setCurrent(pct * a.duration);
    drawFrame(pct);
  };

  return (
    <div className={`ca-player ${isMine ? "ca-sent" : "ca-received"}`}>
      <audio
        ref={audioRef}
        src={resolvedSrc || src}
        onLoadedMetadata={(e) => { setDuration(e.target.duration); drawFrame(0); }}
        onEnded={() => {
          stopRaf();
          setPlaying(false);
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
          setCurrent(0);
          // Small delay to let currentTime reset settle before redraw
          requestAnimationFrame(() => drawFrame(0));
        }}
      />
      <button className="ca-play-btn" onClick={() => {
        const a = audioRef.current;
        if (!a) return;
        if (playing) {
          a.pause(); stopRaf(); setPlaying(false);
          drawFrame(a.duration ? a.currentTime / a.duration : 0);
        } else {
          a.play().catch(() => {}); setPlaying(true); startRaf();
          // Mark as played only when receiver (not sender) plays it
          if (!played && !isMine) {
            playedRef.current = true;
            setPlayed(true);
            onMarkPlayed && onMarkPlayed();
          }
        }
      }}>
        {playing
          ? <i className="bx bx-pause" style={played ? { color: "#a0c4ff" } : {}} />
          : <i className="bx bx-play"  style={played ? { color: "#a0c4ff" } : {}} />
        }
      </button>
      <div className="ca-body">
        <canvas
          ref={canvasRef}
          width={180}
          height={36}
          className="ca-canvas"
          style={{ cursor: "grab", touchAction: "none" }}
          onMouseDown={(e) => handlePointerDown(e.clientX)}
          onTouchStart={(e) => { e.preventDefault(); handlePointerDown(e.touches[0].clientX); }}
        />
        <div className="ca-time">
          <span>{playing || current > 0 ? fmt(current) : fmt(duration)}</span>
          <span className="ca-timestamp-inline">
            {timestamp}
            {isMine && msgStatus && (
              <span className={`co-msg-status co-msg-status--${msgStatus}`}>
                {msgStatus === "sending" && <i className="bx bx-time-five" />}
                {msgStatus === "sent" && <i className="bx bx-check" />}
                {msgStatus === "delivered" && <><i className="bx bx-check" /><i className="bx bx-check" /></>}
                {msgStatus === "read" && <><i className="bx bx-check" /><i className="bx bx-check" /></>}
              </span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
});

/* ── Media Viewer (WhatsApp-style fullscreen) ── */
function MediaViewer({ items, startIndex, onClose, otherName, chatId, myUid, myName, myPhoto, otherUser, onReact }) {
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const videoRef = useRef(null);
  const controlsTimer = useRef(null);
  const touchStartX = useRef(0);
  const item = items[index] || items[0];

  // Push a history entry so the browser back gesture closes the viewer
  useHistoryBack(true, onClose);

  // Resolve blob URL for current item
  useEffect(() => {
    if (!item?.url) { setResolvedUrl(null); return; }
    let cancelled = false;
    import("../../utils/appCache").then(({ getBlobUrl }) => {
      getBlobUrl(item.url).then((url) => { if (!cancelled) setResolvedUrl(url || item.url); });
    });
    return () => { cancelled = true; };
  }, [item?.url]);

  // Reset state when item changes
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setSpeed(1);
    showControls();
  }, [index]);

  // Auto-hide controls after 3s
  const showControls = () => {
    setControlsVisible(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  useEffect(() => () => clearTimeout(controlsTimer.current), []);

  // Escape key
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const goNext = () => { if (index < items.length - 1) setIndex((p) => p + 1); };
  const goPrev = () => { if (index > 0) setIndex((p) => p - 1); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev(); }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play(); setPlaying(true); }
    showControls();
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    const pct = Number(e.target.value) / 100;
    v.currentTime = pct * duration;
    setCurrent(pct * duration);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
    showControls();
  };

  const [downloadToast, setDownloadToast] = useState(null);

  const handleDownload = async () => {
    try {
      // Try blob fetch first (works on production with CORS configured)
      const res = await fetch(item.url, { mode: "cors" });
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const ext = item.isVideo ? "webm" : (blob.type.includes("png") ? "png" : "jpg");
      const fileName = item.isVideo ? `video_${Date.now()}.webm` : `photo_${Date.now()}.${ext}`;
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      setDownloadToast("Saved to device ✓");
    } catch {
      // CORS blocked (localhost dev) — open in new tab so user can save manually
      window.open(item.url, "_blank");
      setDownloadToast("Opened in new tab — save from there");
    }
    setTimeout(() => setDownloadToast(null), 2500);
  };

  const [reactOpen, setReactOpen] = useState(false);
  const [reactSheetOpen, setReactSheetOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [reactFilter, setReactFilter] = useState("all");
  const QUICK_REACTS = ["👍", "❤️", "😂", "😮", "😢", "🙏", "💀"];

  const fmt = (s) => {
    if (!s || isNaN(s)) return "00:00";
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const progress = duration ? (current / duration) * 100 : 0;

  return (
    <div
      className="mv-overlay"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={item.isVideo ? () => { togglePlay(); showControls(); } : undefined}
    >
      {/* Top bar */}
      <div className={`mv-topbar${controlsVisible ? " visible" : ""}`}>
        <button className="mv-icon-btn" onClick={(e) => { e.stopPropagation(); onClose(); }}>
          <i className="bx bx-arrow-back" />
        </button>
        <div className="mv-title">
          <span className="mv-name">{otherName}</span>
          <span className="mv-date">{(() => {
            const d = tsToDate(item.timestamp);
            return d ? d.toLocaleString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "";
          })()}
          </span>
        </div>
        <div className="mv-top-actions">
          <button className="mv-icon-btn" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
            <i className="bx bx-download" />
          </button>
        </div>
      </div>

      {/* Media content */}
      <div className="mv-content" onClick={(e) => { e.stopPropagation(); showControls(); }}>
        {item.isVideo ? (
          <>
            <video
              ref={videoRef}
              src={resolvedUrl || item.url}
              className="mv-media"
              onLoadedMetadata={(e) => setDuration(e.target.duration)}
              onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
              onEnded={() => { setPlaying(false); setCurrent(0); }}
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            />
            {/* Centre play/pause overlay */}
            <div
              className={`mv-play-overlay${controlsVisible ? " visible" : ""}`}
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            >
              <i className={`bx ${playing ? "bx-pause" : "bx-play"}`} />
            </div>
          </>
        ) : (
          <img src={resolvedUrl || item.url} alt="media" className="mv-media" onClick={(e) => e.stopPropagation()} />
        )}

        {/* Prev/Next arrows — desktop */}
        {index > 0 && (
          <button className="mv-nav mv-nav-left" onClick={(e) => { e.stopPropagation(); goPrev(); }}>
            <i className="bx bx-chevron-left" />
          </button>
        )}
        {index < items.length - 1 && (
          <button className="mv-nav mv-nav-right" onClick={(e) => { e.stopPropagation(); goNext(); }}>
            <i className="bx bx-chevron-right" />
          </button>
        )}
      </div>

      {/* Video scrubber bar */}
      {item.isVideo && (
        <div className={`mv-controls${controlsVisible ? " visible" : ""}`} onClick={(e) => e.stopPropagation()}>
          <span className="mv-time">{fmt(current)}</span>
          <div className="mv-scrubber-wrap">
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleSeek}
              className="mv-scrubber"
            />
          </div>
          <span className="mv-time">{fmt(duration)}</span>
          <button className="mv-speed-btn" onClick={cycleSpeed}>{speed.toFixed(1)}x</button>
        </div>
      )}

      {/* React panel */}
      {reactOpen && (
        <div className="mv-react-panel" onClick={(e) => e.stopPropagation()}>
          {QUICK_REACTS.map((em) => (
            <span key={em} className="mv-react-emoji" onClick={() => {
              const msgId = item.msgId;
              if (msgId) onReact(msgId, em);
              setReactOpen(false);
            }}>{em}</span>
          ))}
          <button className="mv-react-more" onClick={() => setReactOpen(false)}>+</button>
        </div>
      )}

      {/* Reply preview + input */}
      {replyOpen && (
        <div onClick={(e) => e.stopPropagation()}>
          <div className="mv-reply-preview">
            <div className="mv-reply-preview-bar" />
            {item.isVideo
              ? <div style={{ width: 40, height: 40, background: "#111", borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 18 }}><i className="bx bx-video" /></div>
              : <CachedImage src={item.url} alt="" className="mv-reply-preview-thumb" />
            }
            <div className="mv-reply-preview-info">
              <div className="mv-reply-preview-label">{otherName || "You"}</div>
              <div className="mv-reply-preview-text">{item.isVideo ? "🎥 Video" : "📷 Photo"}</div>
            </div>
            <button className="mv-reply-close" onClick={() => { setReplyOpen(false); setReplyText(""); }}>
              <i className="bx bx-x" />
            </button>
          </div>
          <div className="mv-reply-input-row">
            <input
              className="mv-reply-input"
              placeholder="Type a message..."
              value={replyText}
              type="search"
              onChange={(e) => setReplyText(e.target.value)}
              autoComplete="off"
              autoFocus
            />
            <button className="mv-reply-send" onClick={() => { setReplyOpen(false); setReplyText(""); }}>
              <i className="bx bx-send" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom bar — shows existing reactions + add button */}
      <div className="mv-bottombar visible" onClick={(e) => e.stopPropagation()}>
        <div className="mv-react-bar">
          {/* Existing reactions — each unique emoji as a pill */}
          {(() => {
            const reacts = item.reactions || {};
            const myReact = reacts[myUid];
            // Group by emoji
            const grouped = {};
            Object.values(reacts).forEach((em) => { grouped[em] = (grouped[em] || 0) + 1; });
            return (
              <>
                {Object.entries(grouped).map(([em, count]) => (
                  <button
                    key={em}
                    className={`mv-react-pill${myReact === em ? " mine" : ""}`}
                    onClick={() => setReactSheetOpen(true)}
                  >
                    {em} {count > 1 ? count : ""}
                  </button>
                ))}
                {/* Add reaction button — always shown */}
                <button
                  className="mv-react-add-btn"
                  onClick={() => { setReactOpen((p) => !p); setReplyOpen(false); }}
                >
                  <span className="mv-react-add-icon">
                    <i className="bx bx-smile" />
                    <span className="mv-react-add-plus">+</span>
                  </span>
                </button>
              </>
            );
          })()}
        </div>
        <button className="mv-reply-btn" onClick={() => { setReplyOpen((p) => !p); setReactOpen(false); }}>
          <i className="bx bx-undo" /><span>Reply</span>
        </button>
      </div>

      {/* Reactions bottom sheet */}
      {reactSheetOpen && (() => {
        const reacts = item.reactions || {};
        const total = Object.keys(reacts).length;
        const grouped = {};
        Object.values(reacts).forEach((em) => { grouped[em] = (grouped[em] || 0) + 1; });
        const filtered = reactFilter === "all"
          ? Object.entries(reacts)
          : Object.entries(reacts).filter(([, em]) => em === reactFilter);
        // Build user info map
        const userInfo = {};
        if (myUid) userInfo[myUid] = { name: myName || "You", photo: myPhoto };
        if (otherUser?.uid) userInfo[otherUser.uid] = { name: otherUser.fullName || otherUser.name || "User", photo: otherUser.photoURL || null };
        return (
          <div className="mv-sheet-backdrop" onClick={() => setReactSheetOpen(false)}>
            <div className="mv-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="mv-sheet-handle" />
              <div className="mv-sheet-title">{total} reaction{total !== 1 ? "s" : ""}</div>
              {/* Filter tabs */}
              <div className="mv-sheet-tabs">
                <button
                  className={`mv-sheet-tab${reactFilter === "all" ? " active" : ""}`}
                  onClick={() => setReactFilter("all")}
                >
                  <i className="bx bx-smile" />
                </button>
                {Object.entries(grouped).map(([em, count]) => (
                  <button
                    key={em}
                    className={`mv-sheet-tab${reactFilter === em ? " active" : ""}`}
                    onClick={() => setReactFilter(em)}
                  >
                    {em} {count}
                  </button>
                ))}
              </div>
              {/* Reactor list */}
              <div className="mv-sheet-list">
                {filtered.map(([uid, em]) => {
                  const info = userInfo[uid] || { name: uid === myUid ? "You" : "User", photo: null };
                  const initials = info.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={uid} className="mv-sheet-row">
                      {info.photo
                        ? <CachedImage src={info.photo} alt={info.name} className="mv-sheet-avatar" />
                        : <div className="mv-sheet-avatar mv-sheet-initials">{initials}</div>
                      }
                      <span className="mv-sheet-name">{uid === myUid ? "You" : info.name}</span>
                      <span className="mv-sheet-emoji">{em}</span>
                    </div>
                  );
                })}
              </div>
              {/* Add your reaction from sheet */}
              <div className="mv-sheet-add-row">
                {QUICK_REACTS.map((em) => (
                  <span
                    key={em}
                    className={`mv-sheet-react-em${reacts[myUid] === em ? " selected" : ""}`}
                    onClick={() => {
                      const newEmoji = reacts[myUid] === em ? null : em;
                      onReact(item.msgId, newEmoji);
                      setReactSheetOpen(false);
                    }}
                  >{em}</span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Download toast */}
      {downloadToast && (
        <div className="mv-toast">{downloadToast}</div>
      )}
    </div>
  );
}

/* ── Video Thumbnail ── */
function VideoThumb({ src, timestamp, onOpen, isMine, msgStatus }) {
  const vidRef = useRef(null);
  const canvasRef = useRef(null);
  const [duration, setDuration] = useState("");
  const [thumbReady, setThumbReady] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState(null);

  // Resolve blob URL (cached) for the video source
  useEffect(() => {
    if (!src) { setResolvedSrc(null); return; }
    let cancelled = false;
    import("../../utils/appCache").then(({ getBlobUrl }) => {
      getBlobUrl(src).then((url) => { if (!cancelled) setResolvedSrc(url || src); });
    });
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    const vid = vidRef.current;
    if (!vid || !resolvedSrc) return;
    vid.src = resolvedSrc;
    vid.muted = true;
    vid.preload = "metadata";
    vid.currentTime = 0.1;
    const onMeta = () => {
      const d = vid.duration;
      if (d && isFinite(d)) {
        const m = Math.floor(d / 60);
        const s = Math.floor(d % 60);
        setDuration(`${m}:${String(s).padStart(2, "0")}`);
      }
    };
    const onSeeked = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = vid.videoWidth || 240;
      canvas.height = vid.videoHeight || 180;
      canvas.getContext("2d").drawImage(vid, 0, 0, canvas.width, canvas.height);
      setThumbReady(true);
    };
    vid.addEventListener("loadedmetadata", onMeta);
    vid.addEventListener("seeked", onSeeked);
    vid.load();
    return () => {
      vid.removeEventListener("loadedmetadata", onMeta);
      vid.removeEventListener("seeked", onSeeked);
    };
  }, [resolvedSrc]);

  return (
    <div
      className="co-video-thumb"
      onClick={(e) => { e.stopPropagation(); onOpen(src); }}
    >
      {/* Hidden video for frame extraction */}
      <video ref={vidRef} style={{ display: "none" }} />
      {/* Thumbnail canvas */}
      <canvas
        ref={canvasRef}
        className={`co-video-canvas${thumbReady ? " ready" : ""}`}
      />
      {!thumbReady && <div className="co-video-placeholder"><i className="bx bx-video" /></div>}
      {/* Centre play button */}
      <div className="co-video-play-btn">
        <i className="bx bx-play" />
      </div>
      {/* Bottom bar: duration left, time right */}
      <div className="co-video-bar">
        <span className="co-video-dur">{duration || "--:--"}</span>
        <span className="co-video-time">
          {timestamp}
          {isMine && msgStatus && (
            <span className={`co-msg-status co-msg-status--${msgStatus}`} style={{ marginLeft: 2 }}>
              {msgStatus === "sending" && <i className="bx bx-time-five" />}
              {msgStatus === "sent" && <i className="bx bx-check" />}
              {msgStatus === "delivered" && <><i className="bx bx-check" /><i className="bx bx-check" /></>}
                {msgStatus === "read" && <><i className="bx bx-check" /><i className="bx bx-check" /></>}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

/* ── Upload Progress Circle ── */
function UploadProgress({ progress, onCancel }) {
  const r = 24;
  const circ = 2 * Math.PI * r;
  const dash = circ * (progress / 100);
  return (
    <div className="co-upload-circle" onClick={(e) => { e.stopPropagation(); onCancel(); }}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="rgba(0,0,0,0.55)" />
        <circle
          cx="30" cy="30" r={r}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="3"
        />
        <circle
          cx="30" cy="30" r={r}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 30 30)"
        />
      </svg>
      <i className="bx bx-x co-upload-cancel-icon" />
    </div>
  );
}

/* ── Message Bubble ── */
const MsgBubble = memo(function MsgBubble({ msg, isMine, reaction, msgStatus, uploadProgress, uploadFailed, onCancelUpload, onRetryUpload, isSel, selMode, isDeleted, isHighlighted, onTap, onCtx, onReply, onImageClick, onScrollToReply, onVideoOpen, onReactionClick, onMarkAudioPlayed }) {
  const touchTimer = useRef(null);

  const handleTouchStart = (e) => {
    touchTimer.current = setTimeout(() => {
      const t = e.touches[0];
      onCtx({ preventDefault: () => { }, stopPropagation: () => { }, clientX: t.clientX, clientY: t.clientY });
    }, 500);
  };
  const handleTouchEnd = () => clearTimeout(touchTimer.current);

  if (isDeleted) {
    return (
      <div className={`co-msg ${isMine ? "sent" : "received"}`}>
        <div className="co-msg-content">
          <div className={`co-bubble ${isMine ? "sent" : "received"}`} style={{ opacity: 0.55 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontStyle: "italic", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              <i className="bx bx-block" style={{ fontSize: 14 }} />
              <span>{isMine ? "You deleted this message" : "This message was deleted"}</span>
            </div>
            <span className="co-timestamp">{formatTime(msg.timestamp)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`msg-${msg.id}`}
      className={`co-msg ${isMine ? "sent" : "received"}${isSel ? " selected" : ""}${selMode ? " sel-mode" : ""}${isHighlighted ? " highlighted" : ""}`}
      onClick={onTap}
      style={isHighlighted ? { transition: "background 0.3s" } : {}}
    >
      {selMode && (
        <div className="co-sel-check">
          <div className={`co-sel-circle${isSel ? " checked" : ""}`}>
            {isSel && <i className="bx bx-check" />}
          </div>
        </div>
      )}
      <div className="co-msg-content">
        <div
          className={`co-bubble ${isMine ? "sent" : "received"}`}
          onContextMenu={onCtx}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd}
        >
          {msg.replyTo && (
            <div
              className="co-reply-quote"
              style={{ cursor: msg.replyTo.msgId ? "pointer" : "default" }}
              onClick={(e) => {
                e.stopPropagation();
                if (msg.replyTo.msgId) onScrollToReply(msg.replyTo.msgId);
              }}
            >
              <span className="co-reply-user">{msg.replyTo.user}</span>
              <span className="co-reply-text">{msg.replyTo.text}</span>
            </div>
          )}
          {msg.forwarded && (
            <div className="co-forwarded-label">
              <i className="bx bx-share-alt" /> Forwarded
            </div>
          )}
          {msg.type === "image" && msg.fileURL && (
            msg.fileName?.match(/\.(mp4|webm|mov|avi|mkv)$/i)
              ? (
                <VideoThumb
                  src={msg.fileURL}
                  timestamp={formatTime(msg.timestamp)}
                  onOpen={onVideoOpen}
                  isMine={isMine}
                  msgStatus={msgStatus}
                />
              ) : (
                <div className="co-img-msg" onClick={(e) => { e.stopPropagation(); if (uploadProgress == null && !uploadFailed) onImageClick(msg.fileURL); }}>
                  <CachedImage src={msg.fileURL} alt={msg.fileName || "attachment"} />
                  {/* Uploading state — progress circle + cancel */}
                  {uploadProgress != null && !uploadFailed && (
                    <div className="co-upload-overlay">
                      <UploadProgress progress={uploadProgress} onCancel={onCancelUpload} />
                    </div>
                  )}
                  {/* Failed state — retry button */}
                  {uploadFailed && (
                    <div className="co-upload-overlay">
                      <button className="co-retry-btn" onClick={(e) => { e.stopPropagation(); onRetryUpload(); }}>
                        <i className="bx bx-upload" /><span>Retry</span>
                      </button>
                    </div>
                  )}
                  {/* Normal state — zoom icon + timestamp with status tick */}
                  {uploadProgress == null && !uploadFailed && (
                    <div className="co-img-overlay"><i className="bx bx-zoom-in" /></div>
                  )}
                  {/* Timestamp + status tick overlaid on image */}
                  <div className="co-img-ts-overlay">
                    {formatTime(msg.timestamp)}
                    {isMine && msgStatus && (
                      <span className={`co-msg-status co-msg-status--${msgStatus}`}>
                        {msgStatus === "sending" && <i className="bx bx-time-five" />}
                        {msgStatus === "sent" && <i className="bx bx-check" />}
                        {msgStatus === "delivered" && <><i className="bx bx-check" /><i className="bx bx-check" /></>}
                {msgStatus === "read" && <><i className="bx bx-check" /><i className="bx bx-check" /></>}
                      </span>
                    )}
                  </div>
                </div>
              )
          )}
          {msg.type === "audio" && msg.fileURL && (
            <AudioPlayer src={msg.fileURL} isMine={isMine} waveform={msg.waveform} timestamp={formatTime(msg.timestamp)} msgStatus={msgStatus} isPlayed={msg.audioPlayed} onMarkPlayed={onMarkAudioPlayed} />
          )}
          {msg.type === "document" && msg.fileURL && (() => {
            const ext = msg.fileName?.split(".").pop()?.toLowerCase() || "";
            const docMeta = {
              pdf: { icon: "bxs-file-pdf", color: "#ef4444" },
              doc: { icon: "bxs-file-doc", color: "#3b82f6" },
              docx: { icon: "bxs-file-doc", color: "#3b82f6" },
              xls: { icon: "bxs-file", color: "#22c55e" },
              xlsx: { icon: "bxs-file", color: "#22c55e" },
              ppt: { icon: "bxs-file", color: "#f97316" },
              pptx: { icon: "bxs-file", color: "#f97316" },
              zip: { icon: "bxs-file-archive", color: "#eab308" },
              rar: { icon: "bxs-file-archive", color: "#eab308" },
              txt: { icon: "bxs-file-txt", color: "#a78bfa" },
            };
            const meta = docMeta[ext] || { icon: "bx-file-blank", color: "#a78bfa" };
            return (
              <a className="co-doc-msg" href={msg.fileURL} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                <div className="co-doc-icon" style={{ background: `${meta.color}22` }}>
                  <i className={`bx ${meta.icon}`} style={{ color: meta.color }} />
                </div>
                <div className="co-doc-info">
                  <span className="co-doc-name">{msg.fileName}</span>
                  <span className="co-doc-size">{msg.fileSize}</span>
                </div>
                <i className="bx bx-download co-doc-dl" />
              </a>
            );
          })()}
          {msg.text && <div className="co-msg-text">{msg.text}</div>}
          {/* Arrow button — tap to open bubble menu */}
          <button className="co-arrow-btn" onClick={(e) => { e.stopPropagation(); onCtx({ preventDefault: () => { }, stopPropagation: () => { }, clientX: e.clientX, clientY: e.clientY }); }}>
            <i className="bx bx-chevron-down" />
          </button>
          <span className="co-timestamp">
            {formatTime(msg.timestamp)}
            {isMine && msgStatus && (
              <span className={`co-msg-status co-msg-status--${msgStatus}`}>
                {msgStatus === "sending" && <i className="bx bx-time-five" />}
                {msgStatus === "sent" && <i className="bx bx-check" />}
                {msgStatus === "delivered" && <><i className="bx bx-check" /><i className="bx bx-check" /></>}
                {msgStatus === "read" && <><i className="bx bx-check" /><i className="bx bx-check" /></>}
              </span>
            )}
          </span>
        </div>
        {reaction && (
          <div
            className="co-reaction"
            onClick={(e) => { e.stopPropagation(); onReactionClick && onReactionClick(msg); }}
            style={{ cursor: "pointer" }}
          >{reaction}</div>
        )}
      </div>
    </div>
  );
});