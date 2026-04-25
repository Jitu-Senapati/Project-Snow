import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const SyncContext = createContext(null);

// Flag for first app load in this session — shared across all sync calls
const FIRST_LOAD_KEY = "stuvo5_first_load_done";

export function SyncProvider({ children }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState("idle"); // "idle"|"fetching"|"updated"|"offline"
  const toastTimer = useRef(null);
  const fetchingStartRef = useRef(0); // track when fetching started (min 1s display)
  const wasOfflineRef = useRef(!navigator.onLine);
  const isFirstLoadRef = useRef(!sessionStorage.getItem(FIRST_LOAD_KEY));

  const showStatus = useCallback((status, duration = 3000) => {
    setSyncStatus(status);
    clearTimeout(toastTimer.current);
    if (duration !== 99999) {
      toastTimer.current = setTimeout(() => setSyncStatus("idle"), duration);
    }
  }, []);

  // Track online/offline
  useEffect(() => {
    const goOnline  = () => {
      setOnline(true);
      wasOfflineRef.current = true;
      // showStatus handled by markFetching — no auto-toast here
      setTimeout(() => window.dispatchEvent(new Event("stuvo5:online")), 500);
    };
    const goOffline = () => {
      setOnline(false);
      wasOfflineRef.current = true;
      // Show "Offline" toast for 3 seconds, then auto-hide
      showStatus("offline", 3000);
    };
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    if (!navigator.onLine) {
      wasOfflineRef.current = true;
      showStatus("offline", 3000);
    }
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [showStatus]);

  // Only show fetching toast on first session load or after coming back online
  const markFetching = useCallback(() => {
    if (isFirstLoadRef.current || wasOfflineRef.current) {
      fetchingStartRef.current = Date.now();
      showStatus("fetching", 99999);
    }
  }, [showStatus]);

  // Show "Updated" toast on first load or after coming online
  // Enforces minimum 1s "fetching" display to avoid flicker on fast connections
  const markUpdated = useCallback(() => {
    const shouldShow = isFirstLoadRef.current || wasOfflineRef.current;
    if (!shouldShow) {
      setSyncStatus("idle");
      return;
    }

    // Reset flags — don't show again until next offline→online or new session
    isFirstLoadRef.current = false;
    wasOfflineRef.current = false;
    sessionStorage.setItem(FIRST_LOAD_KEY, "1");

    // Calculate remaining time before we can switch from fetching → updated
    const elapsed = Date.now() - fetchingStartRef.current;
    const minFetchTime = 1500;
    const wait = Math.max(0, minFetchTime - elapsed);

    setTimeout(() => showStatus("updated", 2500), wait);
  }, [showStatus]);

  const markIdle = useCallback(() => setSyncStatus("idle"), []);

  return (
    <SyncContext.Provider value={{ online, syncStatus, markFetching, markUpdated, markIdle }}>
      {children}
      <SyncToast status={syncStatus} />
    </SyncContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncContext);
}

// ── Background data pre-warm ──────────────────────────────────────
// Call this once after login to aggressively cache all user data
export async function prewarmCache(uid, { subscribeToChats, subscribeToEvents, subscribeToNotices }) {
  const {
    setCachedChats, setCachedEvents, setCachedNotices, precacheMedia
  } = await import("../utils/appCache");

  // Events
  await new Promise((resolve) => {
    const unsub = subscribeToEvents((data) => {
      setCachedEvents(data);
      data.forEach((ev) => { if (ev.img) precacheMedia(ev.img); });
      unsub();
      resolve();
    });
    setTimeout(resolve, 5000); // timeout safety
  });

  // Notices
  await new Promise((resolve) => {
    const unsub = subscribeToNotices((data) => {
      setCachedNotices(data);
      unsub();
      resolve();
    });
    setTimeout(resolve, 5000);
  });

  // Chats
  if (uid) {
    await new Promise((resolve) => {
      const unsub = subscribeToChats(uid, (data) => {
        setCachedChats(data);
        // Pre-cache cover photos from chat participants
        data.forEach((chat) => {
          const otherId = chat.participants?.find((p) => p !== uid);
          const cover = chat.participantInfo?.[otherId]?.coverPhotoURL;
          if (cover) precacheMedia(cover);
        });
        unsub();
        resolve();
      });
      setTimeout(resolve, 5000);
    });
  }
}

// ── Toast component ──────────────────────────────────────────────
function SyncToast({ status }) {
  if (status === "idle") return null;

  const config = {
    offline:  { icon: "bx-wifi-off",    text: "Offline",           bg: "#374151", color: "#f9fafb" },
    fetching: { icon: "bx-loader-alt",  text: "Fetching updates…", bg: "#1e1b4b", color: "#a78bfa" },
    updated:  { icon: "bx-check-circle",text: "Updated",           bg: "#14532d", color: "#86efac" },
  };

  const c = config[status] || config.fetching;

  return (
    <div style={{
      position: "fixed",
      top: 14,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 99999,
      background: c.bg,
      color: c.color,
      borderRadius: 24,
      padding: "7px 16px",
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontSize: 13,
      fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
      pointerEvents: "none",
      whiteSpace: "nowrap",
      animation: "syncToastIn 0.2s ease",
      fontFamily: "inherit",
    }}>
      <i
        className={`bx ${c.icon}`}
        style={{
          fontSize: 16,
          animation: status === "fetching" ? "spin 1s linear infinite" : "none",
        }}
      />
      {c.text}
      <style>{`
        @keyframes syncToastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}