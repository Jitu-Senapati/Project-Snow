const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp }     = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging }      = require("firebase-admin/messaging");

initializeApp();

// ─── Shared helpers ───────────────────────────────────────────────

async function getAllTokens(db) {
  const snap = await db.collection("users").get();
  const tokenSet = new Set();
  snap.forEach((doc) => {
    const m = doc.data().fcmTokens;
    if (m && typeof m === "object" && !Array.isArray(m))
      Object.values(m).forEach((t) => { if (t) tokenSet.add(t); });
  });
  return { tokens: [...tokenSet], usersSnap: snap };
}

async function pruneStaleTokens(db, usersSnap, badTokens) {
  if (!badTokens.length) return;
  const bad = new Set(badTokens);
  const b = db.batch();
  usersSnap.forEach((doc) => {
    const m = doc.data().fcmTokens;
    if (m && typeof m === "object")
      for (const [k, v] of Object.entries(m))
        if (bad.has(v)) b.update(doc.ref, { [`fcmTokens.${k}`]: FieldValue.delete() });
  });
  await b.commit();
  console.log(`Pruned ${badTokens.length} stale token(s).`);
}

/**
 * Send a multicast push message.
 * Pass `webpushNotification` to use webpush.notification (for image support).
 * Otherwise falls back to data-only message.
 */
async function multicast(db, usersSnap, tokens, data) {
  if (!tokens.length) { console.log("No tokens."); return; }

  const messaging = getMessaging();
  const badTokens = [];

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    try {
      const res = await messaging.sendEachForMulticast({ tokens: batch, data });
      console.log(`Batch: ${res.successCount} ok / ${res.failureCount} failed`);
      res.responses.forEach((r, idx) => {
        if (!r.success) {
          const c = r.error?.code;
          if (c === "messaging/invalid-registration-token" ||
              c === "messaging/registration-token-not-registered")
            badTokens.push(batch[idx]);
        }
      });
    } catch (e) { console.error("Multicast error:", e); }
  }

  await pruneStaleTokens(db, usersSnap, badTokens);
}

// ─── Notices ──────────────────────────────────────────────────────
exports.onNoticeUpdate = onDocumentUpdated("content/notices", async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();

  const oldIds = new Set((before?.items || []).map((n) => n.id));
  const newIds = new Set((after?.items  || []).map((n) => n.id));
  const added   = (after?.items  || []).filter((n) => !oldIds.has(n.id));
  const deleted = (before?.items || []).filter((n) => !newIds.has(n.id));

  const db = getFirestore();

  if (deleted.length) {
    try {
      const b = db.batch();
      for (const n of deleted) {
        const q = await db.collection("notifications")
          .where("type", "==", "notice").where("sourceId", "==", n.id).get();
        q.docs.forEach((d) => b.delete(d.ref));
      }
      await b.commit();
    } catch (e) { console.error("Notice cleanup error:", e); }
  }

  if (!added.length) return null;

  try {
    const b = db.batch();
    added.forEach((n) => {
      b.set(db.collection("notifications").doc(), {
        title:    `📢 ${n.title || "New Notice"}`,
        body:     (n.body || n.description || "A new notice has been posted.").substring(0, 200),
        type:     "notice",
        sourceId: n.id || null,
        imageUrl: null,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await b.commit();
  } catch (e) { console.error("Notice Firestore write error:", e); }

  const { tokens, usersSnap } = await getAllTokens(db);
  const latest = added[added.length - 1];
  const title  = added.length === 1
    ? `📢 ${latest.title || "New Notice"}`
    : `📢 ${added.length} New Notices`;
  const body   = added.length === 1
    ? (latest.body || latest.description || "A new notice has been posted.").substring(0, 120)
    : `${latest.title || "Notice"} and ${added.length - 1} more`;

  // Notices: data-only push — sw.js onBackgroundMessage handles display
  await multicast(db, usersSnap, tokens, {
    type: "notice", title, body, image: "", url: "/explore",
  });

  return null;
});

// ─── Events ───────────────────────────────────────────────────────
exports.onEventsUpdate = onDocumentUpdated("content/events_active", async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();

  const oldIds = new Set((before?.items || []).map((e) => e.id));
  const newIds = new Set((after?.items  || []).map((e) => e.id));
  const added   = (after?.items  || []).filter((e) => !oldIds.has(e.id));
  const deleted = (before?.items || []).filter((e) => !newIds.has(e.id));

  const db = getFirestore();

  if (deleted.length) {
    try {
      const b = db.batch();
      for (const e of deleted) {
        const q = await db.collection("notifications")
          .where("type", "==", "event").where("sourceId", "==", e.id).get();
        q.docs.forEach((d) => b.delete(d.ref));
      }
      await b.commit();
    } catch (e) { console.error("Event cleanup error:", e); }
  }

  if (!added.length) return null;

  try {
    const b = db.batch();
    added.forEach((e) => {
      b.set(db.collection("notifications").doc(), {
        title:    `🎉 ${e.title || "New Event"}`,
        body:     (e.description || "A new event has been added.").substring(0, 200),
        type:     "event",
        sourceId: e.id || null,
        imageUrl: e.img || null,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await b.commit();
  } catch (e) { console.error("Event Firestore write error:", e); }

  const { tokens, usersSnap } = await getAllTokens(db);
  const latest = added[added.length - 1];
  const title  = added.length === 1
    ? `🎉 ${latest.title || "New Event"}`
    : `🎉 ${added.length} New Events`;
  const body   = added.length === 1
    ? (latest.description || "A new event has been added.").substring(0, 120)
    : `${latest.title || "Event"} and ${added.length - 1} more`;

  // Pure data-only push — onBackgroundMessage in sw.js handles the single
  // display, including showing the event image. No webpush.notification means
  // no duplicate, no badge icon, full control over the notification appearance.
  await multicast(db, usersSnap, tokens, {
    type:  "event",
    title,
    body,
    image: latest.img || "",   // passed to showNotification({ image }) in sw.js
    url:   "/explore",
  });

  return null;
});