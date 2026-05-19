const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

/**
 * Sends push when new notices are added.
 * Also cleans up notification docs when notices are deleted.
 * DATA-ONLY message — no webpush.notification.
 * This prevents the browser auto-displaying a duplicate notification.
 * sw.js onBackgroundMessage handles the single display.
 */
exports.onNoticeUpdate = onDocumentUpdated("content/notices", async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();

  const oldIds = new Set((before?.items || []).map((n) => n.id));
  const newIds = new Set((after?.items  || []).map((n) => n.id));

  const added   = (after?.items  || []).filter((n) => !oldIds.has(n.id));
  const deleted = (before?.items || []).filter((n) => !newIds.has(n.id));

  const db = getFirestore();

  // ── Clean up notification docs for deleted notices ──────────────
  if (deleted.length > 0) {
    console.log(`${deleted.length} notice(s) deleted — cleaning up notification docs…`);
    try {
      const deleteBatch = db.batch();
      for (const notice of deleted) {
        const snap = await db.collection("notifications")
          .where("type",     "==", "notice")
          .where("sourceId", "==", notice.id)
          .get();
        snap.docs.forEach((doc) => deleteBatch.delete(doc.ref));
      }
      await deleteBatch.commit();
      console.log("Notification cleanup done.");
    } catch (err) {
      console.error("Failed to clean up notification docs:", err);
    }
  }

  if (added.length === 0) {
    console.log("No new notices — skipping push.");
    return null;
  }

  console.log(`${added.length} new notice(s) detected.`);

  const usersSnap = await db.collection("users").get();
  const tokenSet = new Set();

  usersSnap.forEach((doc) => {
    const tokenMap = doc.data().fcmTokens;
    if (tokenMap && typeof tokenMap === "object" && !Array.isArray(tokenMap)) {
      Object.values(tokenMap).forEach((t) => {
        if (t && typeof t === "string") tokenSet.add(t);
      });
    }
  });

  const tokens = [...tokenSet];
  if (tokens.length === 0) {
    console.log("No tokens found.");
    return null;
  }

  console.log(`Sending to ${tokens.length} unique token(s)…`);

  // ── Persist one Firestore doc per notice (for in-app history) ──
  try {
    const writeBatch = db.batch();
    added.forEach((notice) => {
      const ref = db.collection("notifications").doc();
      writeBatch.set(ref, {
        title:     `📢 ${notice.title || "New Notice"}`,
        body:      (notice.body || notice.description || "A new notice has been posted.").substring(0, 200),
        type:      "notice",
        sourceId:  notice.id || null,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    await writeBatch.commit();
    console.log(`${added.length} notification doc(s) saved to Firestore.`);
  } catch (err) {
    console.error("Failed to save notifications:", err);
  }

  // ── Build a single grouped push (one push per trigger, not per notice) ──
  const latest = added[added.length - 1];
  const title  = added.length === 1
    ? `📢 ${latest.title || "New Notice"}`
    : `📢 ${added.length} New Notices`;
  const body   = added.length === 1
    ? (latest.body || latest.description || "A new notice has been posted.").substring(0, 120)
    : `${latest.title || "Notice"} and ${added.length - 1} more`;

  const messaging = getMessaging();
  const badTokens = [];

  for (let i = 0; i < tokens.length; i += 500) {
    const batch = tokens.slice(i, i + 500);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batch,
        // DATA ONLY — no notification field, no webpush.notification
        // sw.js onBackgroundMessage handles display
        data: {
          type:  "notice",
          title: title,
          body:  body,
          icon:  "https://stuvo5.web.app/logo192px.png",
          url:   "/explore",
        },
      });

      console.log(`Batch: ${response.successCount} ok, ${response.failureCount} failed`);

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (
            code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered"
          ) {
            badTokens.push(batch[idx]);
          }
        }
      });
    } catch (err) {
      console.error("Multicast error:", err);
    }
  }

  if (badTokens.length > 0) {
    console.log(`Removing ${badTokens.length} invalid token(s)…`);
    const badSet = new Set(badTokens);
    const cleanBatch = db.batch();
    usersSnap.forEach((doc) => {
      const tokenMap = doc.data().fcmTokens;
      if (tokenMap && typeof tokenMap === "object") {
        for (const [key, val] of Object.entries(tokenMap)) {
          if (badSet.has(val)) {
            cleanBatch.update(doc.ref, { [`fcmTokens.${key}`]: FieldValue.delete() });
          }
        }
      }
    });
    await cleanBatch.commit();
    console.log("Cleanup done.");
  }

  return null;
});