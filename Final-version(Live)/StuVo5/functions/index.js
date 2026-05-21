const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest }         = require("firebase-functions/v2/https");
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


// ─── Event Day Reminder (scheduled: 7 AM IST every day) ──────────
const { onSchedule } = require("firebase-functions/v2/scheduler");

exports.eventDayReminder = onSchedule(
  { schedule: "0 7 * * *", timeZone: "Asia/Kolkata" },
  async () => {
    const db        = getFirestore();
    const messaging = getMessaging();

    // ── Today's date string in IST (YYYY-MM-DD) ──────────────────
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const nowIST  = new Date(Date.now() + IST_OFFSET_MS);
    const toISTDateStr = (d) =>
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const todayStr = toISTDateStr(nowIST);
    console.log(`Reminder check for IST date: ${todayStr}`);

    // ── Fetch all active events ───────────────────────────────────
    const activeSnap = await db.doc("content/events_active").get();
    const allEvents  = activeSnap.exists ? (activeSnap.data().items || []) : [];

    // ── Filter: happening today AND has at least one bookmark ─────
    const todayEvents = allEvents.filter((ev) => {
      if (!ev.registeredUsers?.length) return false;
      if (!ev.dateRaw) return false;
      const evIST = new Date(new Date(ev.dateRaw).getTime() + IST_OFFSET_MS);
      return toISTDateStr(evIST) === todayStr;
    });

    if (!todayEvents.length) {
      console.log("No bookmarked events today — nothing to send.");
      return null;
    }

    console.log(`${todayEvents.length} bookmarked event(s) happening today.`);

    for (const ev of todayEvents) {
      const uids = [...new Set(ev.registeredUsers)];
      console.log(`"${ev.title}" → sending reminders to ${uids.length} user(s).`);

      // ── Collect FCM tokens for bookmarked users ─────────────────
      const userSnaps = await Promise.all(uids.map((uid) => db.doc(`users/${uid}`).get()));

      const tokens     = [];
      const tokenToRef = {}; // token → { uid, key } for stale-token cleanup

      userSnaps.forEach((snap) => {
        if (!snap.exists) return;
        const tokenMap = snap.data().fcmTokens;
        if (tokenMap && typeof tokenMap === "object" && !Array.isArray(tokenMap)) {
          Object.entries(tokenMap).forEach(([key, token]) => {
            if (token && typeof token === "string") {
              tokens.push(token);
              tokenToRef[token] = { uid: snap.id, key };
            }
          });
        }
      });

      if (!tokens.length) {
        console.log(`No active tokens for "${ev.title}" — skipping.`);
        continue;
      }

      const title = `🔖 Today: ${ev.title}`;
      const body  = ev.description
        ? ev.description.substring(0, 120)
        : `Today is the event!${ev.location ? " @ " + ev.location : ""}`;

      // ── Save in-app notification doc ────────────────────────────
      try {
        await db.collection("notifications").add({
          title,
          body,
          type:      "event_reminder",
          sourceId:  ev.id || null,
          imageUrl:  ev.img || null,
          createdAt: require("firebase-admin/firestore").FieldValue.serverTimestamp(),
        });
      } catch (e) { console.error("Notification doc write failed:", e); }

      // ── Send targeted push (data-only) ──────────────────────────
      const badTokens = [];

      for (let i = 0; i < tokens.length; i += 500) {
        const batch = tokens.slice(i, i + 500);
        try {
          const res = await messaging.sendEachForMulticast({
            tokens: batch,
            data: {
              type:  "event_reminder",
              title,
              body,
              image: ev.img || "",
              url:   "/explore",
            },
          });
          console.log(`"${ev.title}" batch: ${res.successCount} ok / ${res.failureCount} failed`);
          res.responses.forEach((r, idx) => {
            if (!r.success) {
              const c = r.error?.code;
              if (
                c === "messaging/invalid-registration-token" ||
                c === "messaging/registration-token-not-registered"
              ) badTokens.push(batch[idx]);
            }
          });
        } catch (e) { console.error("Multicast error:", e); }
      }

      // ── Prune stale tokens ──────────────────────────────────────
      if (badTokens.length) {
        const bad = new Set(badTokens);
        const b   = db.batch();
        bad.forEach((token) => {
          const ref = tokenToRef[token];
          if (ref) b.update(db.doc(`users/${ref.uid}`), { [`fcmTokens.${ref.key}`]: FieldValue.delete() });
        });
        await b.commit();
        console.log(`Pruned ${bad.size} stale token(s).`);
      }
    }

    return null;
  }
);


// ─── TEST ONLY — remove before production ────────────────────────
// Hit: https://<region>-stuvo5.cloudfunctions.net/testEventReminder
// Add ?date=2026-07-27 to test a specific IST date, or leave blank for today
exports.testEventReminder = onRequest(async (req, res) => {
  const db        = getFirestore();
  const messaging = getMessaging();

  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const toISTDateStr = (d) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

  // Allow ?date=YYYY-MM-DD to simulate a specific date
  const todayStr = req.query.date ||
    toISTDateStr(new Date(Date.now() + IST_OFFSET_MS));

  console.log(`[TEST] Simulating reminder for IST date: ${todayStr}`);

  const activeSnap = await db.doc("content/events_active").get();
  const allEvents  = activeSnap.exists ? (activeSnap.data().items || []) : [];

  const todayEvents = allEvents.filter((ev) => {
    if (!ev.registeredUsers?.length) return false;
    if (!ev.dateRaw) return false;
    const evIST = new Date(new Date(ev.dateRaw).getTime() + IST_OFFSET_MS);
    return toISTDateStr(evIST) === todayStr;
  });

  if (!todayEvents.length) {
    return res.json({ ok: true, message: `No bookmarked events on ${todayStr}` });
  }

  const results = [];

  for (const ev of todayEvents) {
    const uids     = [...new Set(ev.registeredUsers)];
    const userSnaps = await Promise.all(uids.map((uid) => db.doc(`users/${uid}`).get()));
    const tokens   = [];
    const tokenToRef = {};

    userSnaps.forEach((snap) => {
      if (!snap.exists) return;
      const tokenMap = snap.data().fcmTokens;
      if (tokenMap && typeof tokenMap === "object") {
        Object.entries(tokenMap).forEach(([key, token]) => {
          if (token) { tokens.push(token); tokenToRef[token] = { uid: snap.id, key }; }
        });
      }
    });

    const title = `🔖 Today: ${ev.title}`;
    const body  = ev.description
      ? ev.description.substring(0, 120)
      : `Today is the event!${ev.location ? " @ " + ev.location : ""}`;

    await db.collection("notifications").add({
      title, body, type: "event_reminder",
      sourceId: ev.id || null, imageUrl: ev.img || null,
      createdAt: FieldValue.serverTimestamp(),
    });

    let sent = 0;
    if (tokens.length) {
      for (let i = 0; i < tokens.length; i += 500) {
        const batch = tokens.slice(i, i + 500);
        const r = await messaging.sendEachForMulticast({
          tokens: batch,
          data: { type: "event_reminder", title, body, image: ev.img || "", url: "/explore" },
        });
        sent += r.successCount;
      }
    }
    results.push({ event: ev.title, users: uids.length, tokensSent: sent });
  }

  res.json({ ok: true, date: todayStr, results });
});