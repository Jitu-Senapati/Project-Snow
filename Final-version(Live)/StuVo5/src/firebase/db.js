import { doc, setDoc, onSnapshot, runTransaction, arrayUnion, arrayRemove } from "firebase/firestore";import { db } from "./config";

const eventsActiveRef = () => doc(db, "content", "events_active");
const eventsAllRef    = () => doc(db, "content", "events_all");
const noticesRef      = () => doc(db, "content", "notices");
const metaRef         = () => doc(db, "content", "meta");

// ─── Real-time listeners ──────────────────────────────────
export const subscribeToEvents = (callback) =>
  onSnapshot(eventsActiveRef(), (snap) =>
    callback(snap.exists() ? (snap.data().items ?? []) : [])
  );

export const subscribeToNotices = (callback) =>
  onSnapshot(noticesRef(), (snap) =>
    callback(snap.exists() ? (snap.data().items ?? []) : [])
  );

// ─── Save events ──────────────────────────────────────────
export const saveEvents = async (draft, originalEvents) => {
  const originalIds = new Set((originalEvents || []).map((e) => e.id));
  const newEvents = draft.filter((e) => !originalIds.has(e.id));

  await runTransaction(db, async (transaction) => {
    // ── ALL READS FIRST ──
    const metaSnap = await transaction.get(metaRef());
    const allSnap  = await transaction.get(eventsAllRef());

    // ── COMPUTE ──
    const currentSerial = metaSnap.exists() ? (metaSnap.data().eventSerial ?? 0) : 0;
    const existingAll   = allSnap.exists()  ? (allSnap.data().items ?? [])        : [];

    // Assign serials to new events
    let nextSerial = currentSerial;
    const enrichedDraft = draft.map((e) => {
      if (!originalIds.has(e.id)) {
        nextSerial += 1;
        return { ...e, serial: nextSerial };
      }
      return e;
    });

    // Sync updates to events_all and append new ones
    const newWithSerial = enrichedDraft.filter((e) => !originalIds.has(e.id));
    const updatedAll = [
      ...existingAll.map((e) => {
        const updated = enrichedDraft.find((d) => d.id === e.id);
        return updated || e;
      }),
      ...newWithSerial,
    ];

    // ── ALL WRITES LAST ──
    if (newEvents.length > 0) {
      transaction.set(metaRef(), { eventSerial: nextSerial }, { merge: true });
    }
    transaction.set(eventsActiveRef(), { items: enrichedDraft });
    transaction.set(eventsAllRef(),    { items: updatedAll });
  });
};

// ─── Save notices ─────────────────────────────────────────
export const saveNotices = async (draft, originalNotices) => {
  const originalIds = new Set((originalNotices || []).map((n) => n.id));
  const newNotices = draft.filter((n) => !originalIds.has(n.id));

  await runTransaction(db, async (transaction) => {
    // ── ALL READS FIRST ──
    const metaSnap = await transaction.get(metaRef());

    // ── COMPUTE ──
    const currentSerial = metaSnap.exists() ? (metaSnap.data().noticeSerial ?? 0) : 0;
    let nextSerial = currentSerial;

    const enrichedDraft = draft.map((n) => {
      if (!originalIds.has(n.id)) {
        nextSerial += 1;
        return { ...n, serial: nextSerial };
      }
      return n;
    });

    // ── ALL WRITES LAST ──
    if (newNotices.length > 0) {
      transaction.set(metaRef(), { noticeSerial: nextSerial }, { merge: true });
    }
    transaction.set(noticesRef(), { items: enrichedDraft });
  });
};

// ─── Bookmark toggle ──────────────────────────────────────
export const toggleBookmark = async (uid, eventSerial, eventId, isBookmarked) => {
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (transaction) => {
    // ── ALL READS FIRST ──
    const activeSnap = await transaction.get(eventsActiveRef());
    const allSnap    = await transaction.get(eventsAllRef());

    const activeItems = activeSnap.exists() ? (activeSnap.data().items ?? []) : [];
    const allItems    = allSnap.exists()    ? (allSnap.data().items ?? [])    : [];

    // ── COMPUTE ──
    // Update registeredUsers in both collections
    const updateItems = (items) => items.map((e) =>
      e.serial === eventSerial
        ? {
            ...e,
            registeredUsers: isBookmarked
              ? (e.registeredUsers || []).filter((u) => u !== uid)
              : [...(e.registeredUsers || []), uid],
          }
        : e
    );

    // ── ALL WRITES LAST ──
    transaction.set(eventsActiveRef(), { items: updateItems(activeItems) });
    transaction.set(eventsAllRef(),    { items: updateItems(allItems) });
    transaction.update(userRef, {
      bookmarkedEvents: isBookmarked ? arrayRemove(eventSerial) : arrayUnion(eventSerial),
    });
  });
};