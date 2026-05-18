import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { requestAndSaveToken, ensureTokenSaved, listenForForegroundMessages } from "../firebase/messaging";
import "../styles/notifications.css";

const DISMISSED_KEY = "stuvo5_notif_dismissed";

export default function NotificationPrompt() {
  const { currentUser } = useAuth();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

    const perm = Notification.permission;

    // Already granted → silently ensure token is saved + listen for foreground
    if (perm === "granted") {
      ensureTokenSaved(currentUser.uid);
      let unsub = () => {};
      listenForForegroundMessages().then((fn) => { unsub = fn || (() => {}); });
      return () => unsub();
    }

    // Already denied → can't ask again
    if (perm === "denied") return;

    // "default" → show banner after 3s (unless previously dismissed this session)
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, [currentUser?.uid]);

  const handleEnable = async () => {
    setShow(false);
    const token = await requestAndSaveToken(currentUser.uid);
    if (token) {
      listenForForegroundMessages();
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  if (!show) return null;

  return (
    <div className="notif-banner">
      <div className="notif-banner-content">
        <i className="bx bx-bell notif-banner-icon" />
        <div className="notif-banner-text">
          <strong>Stay updated!</strong>
          <span>Get notified about new notices instantly</span>
        </div>
      </div>
      <div className="notif-banner-actions">
        <button className="notif-btn notif-btn--later" onClick={handleDismiss}>
          Later
        </button>
        <button className="notif-btn notif-btn--enable" onClick={handleEnable}>
          Enable
        </button>
      </div>
    </div>
  );
}