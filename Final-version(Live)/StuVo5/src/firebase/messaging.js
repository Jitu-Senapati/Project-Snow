import { getToken, onMessage } from "firebase/messaging";
import { getAppMessaging } from "./config";
import { saveFcmToken } from "./db";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Physical device key — same on Chrome and PWA (same screen), 
 * different between phone and PC. Used as the map key in Firestore
 * so each physical device gets exactly 1 notification.
 */
export const getDeviceKey = () => {
  const mobile = /Mobi|Android/i.test(navigator.userAgent);
  return `${mobile ? "m" : "d"}_${screen.width}x${screen.height}`;
};

/**
 * Request permission → get FCM token → save under fcmTokens.{deviceKey}.
 * Same physical device always overwrites the same slot.
 */
export async function requestAndSaveToken(uid) {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const messaging = await getAppMessaging();
    if (!messaging) return null;

    const swReg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token && uid) {
      const deviceKey = getDeviceKey();
      await saveFcmToken(uid, deviceKey, token);
      localStorage.setItem("stuvo5_fcm_token", token);
    }

    return token;
  } catch (err) {
    console.error("FCM token request failed:", err);
    return null;
  }
}

/**
 * Silently ensure this device's token is saved if permission already granted.
 */
export async function ensureTokenSaved(uid) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  await requestAndSaveToken(uid);
}

/**
 * Foreground push listener.
 */
export async function listenForForegroundMessages() {
  const messaging = await getAppMessaging();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    // Read from payload.notification (if present) OR payload.data (always present)
    const notif = payload.notification || {};
    const data  = payload.data || {};
    const title = notif.title || data.title || "StuVo5";
    const body  = notif.body  || data.body  || "New notification";

    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: notif.icon || "/logo192px.png",
        tag:  "stuvo5-notice",   // collapse with background notifications
      });
    }
  });
}