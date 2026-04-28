import {
  doc, setDoc, getDoc, updateDoc, onSnapshot,
  runTransaction, arrayUnion, arrayRemove,
  collection, addDoc, serverTimestamp, query,
  orderBy, limit, where, getDocs, deleteField
} from "firebase/firestore";
import { db } from "./config";

// ─── Content refs ─────────────────────────────────────────
const eventsActiveRef = () => doc(db, "content", "events_active");
const eventsAllRef    = () => doc(db, "content", "events_all");
const noticesRef      = () => doc(db, "content", "notices");
const metaRef         = () => doc(db, "content", "meta");
const placementsRef   = () => doc(db, "content", "placements");

// ─── Real-time listeners ──────────────────────────────────
export const subscribeToEvents = (callback) =>
  onSnapshot(eventsActiveRef(), (snap) =>
    callback(snap.exists() ? (snap.data().items ?? []) : [])
  );

export const subscribeToNotices = (callback) =>
  onSnapshot(noticesRef(), (snap) =>
    callback(snap.exists() ? (snap.data().items ?? []) : [])
  );

// ─── Get lastChanged timestamp only (cheap single-field read) ───
export const getLastChanged = async (type) => {
  // type: "events" | "notices"
  const ref = type === "notices" ? noticesRef() : eventsActiveRef();
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const ts = snap.data().lastChanged;
  return ts ? ts.toMillis() : null;
};

// ─── Save events ──────────────────────────────────────────
export const saveEvents = async (draft, originalEvents) => {
  const originalIds = new Set((originalEvents || []).map((e) => e.id));
  const newEvents = draft.filter((e) => !originalIds.has(e.id));

  await runTransaction(db, async (transaction) => {
    const metaSnap = await transaction.get(metaRef());
    const allSnap  = await transaction.get(eventsAllRef());

    const currentSerial = metaSnap.exists() ? (metaSnap.data().eventSerial ?? 0) : 0;
    const existingAll   = allSnap.exists()  ? (allSnap.data().items ?? [])        : [];

    let nextSerial = currentSerial;
    const enrichedDraft = draft.map((e) => {
      if (!originalIds.has(e.id)) {
        nextSerial += 1;
        return { ...e, serial: nextSerial };
      }
      return e;
    });

    const newWithSerial = enrichedDraft.filter((e) => !originalIds.has(e.id));
    const updatedAll = [
      ...existingAll.map((e) => {
        const updated = enrichedDraft.find((d) => d.id === e.id);
        return updated || e;
      }),
      ...newWithSerial,
    ];

    if (newEvents.length > 0) {
      transaction.set(metaRef(), { eventSerial: nextSerial }, { merge: true });
    }
    transaction.set(eventsActiveRef(), { items: enrichedDraft, lastChanged: serverTimestamp() });
    transaction.set(eventsAllRef(),    { items: updatedAll, lastChanged: serverTimestamp() });
  });
};

// ─── Save notices ─────────────────────────────────────────
export const saveNotices = async (draft, originalNotices) => {
  const originalIds = new Set((originalNotices || []).map((n) => n.id));
  const newNotices = draft.filter((n) => !originalIds.has(n.id));

  await runTransaction(db, async (transaction) => {
    const metaSnap = await transaction.get(metaRef());

    const currentSerial = metaSnap.exists() ? (metaSnap.data().noticeSerial ?? 0) : 0;
    let nextSerial = currentSerial;

    const enrichedDraft = draft.map((n) => {
      if (!originalIds.has(n.id)) {
        nextSerial += 1;
        return { ...n, serial: nextSerial };
      }
      return n;
    });

    if (newNotices.length > 0) {
      transaction.set(metaRef(), { noticeSerial: nextSerial }, { merge: true });
    }
    transaction.set(noticesRef(), { items: enrichedDraft, lastChanged: serverTimestamp() });
  });
};

// ─── Bookmark toggle ──────────────────────────────────────
export const toggleBookmark = async (uid, eventSerial, eventId, isBookmarked) => {
  const userRef = doc(db, "users", uid);

  await runTransaction(db, async (transaction) => {
    const activeSnap = await transaction.get(eventsActiveRef());
    const allSnap    = await transaction.get(eventsAllRef());

    const activeItems = activeSnap.exists() ? (activeSnap.data().items ?? []) : [];
    const allItems    = allSnap.exists()    ? (allSnap.data().items ?? [])    : [];

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

    transaction.set(eventsActiveRef(), { items: updateItems(activeItems) });
    transaction.set(eventsAllRef(),    { items: updateItems(allItems) });
    transaction.update(userRef, {
      bookmarkedEvents: isBookmarked ? arrayRemove(eventSerial) : arrayUnion(eventSerial),
    });
  });
};

// ═══════════════════════════════════════════════════════════
// FOLLOW / UNFOLLOW
// ═══════════════════════════════════════════════════════════

export const followUser = async (myUid, targetUid) => {
  await updateDoc(doc(db, "users", myUid), {
    following: arrayUnion(targetUid),
  });
  await updateDoc(doc(db, "users", targetUid), {
    followers: arrayUnion(myUid),
  });
};

export const unfollowUser = async (myUid, targetUid) => {
  await updateDoc(doc(db, "users", myUid), {
    following: arrayRemove(targetUid),
  });
  await updateDoc(doc(db, "users", targetUid), {
    followers: arrayRemove(myUid),
  });
};

export const requestFollow = async (myUid, targetUid) => {
  await updateDoc(doc(db, "users", targetUid), {
    pendingFollowers: arrayUnion(myUid),
  });
};

export const cancelFollowRequest = async (myUid, targetUid) => {
  await updateDoc(doc(db, "users", targetUid), {
    pendingFollowers: arrayRemove(myUid),
  });
};

// ═══════════════════════════════════════════════════════════
// USER PROFILE
// ═══════════════════════════════════════════════════════════

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
};

// ─── Presence ────────────────────────────────────────────
export const setUserOnline = async (uid) => {
  await updateDoc(doc(db, "users", uid), {
    online: true,
    lastSeen: serverTimestamp(),
  });
};

export const setUserOffline = async (uid) => {
  await updateDoc(doc(db, "users", uid), {
    online: false,
    lastSeen: serverTimestamp(),
  });
};

export const subscribeToUserPresence = (uid, callback) => {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    if (snap.exists()) callback({ uid, ...snap.data() });
  });
};

export const updateUserSettings = async (uid, updates) => {
  await updateDoc(doc(db, "users", uid), updates);
};

export const getUserProfiles = async (uids) => {
  if (!uids || uids.length === 0) return [];
  const profiles = await Promise.all(
    uids.map((uid) => getDoc(doc(db, "users", uid)))
  );
  return profiles
    .filter((snap) => snap.exists())
    .map((snap) => ({ uid: snap.id, ...snap.data() }));
};

// ═══════════════════════════════════════════════════════════
// CHAT
// ═══════════════════════════════════════════════════════════

export const getChatId = (uid1, uid2) =>
  [uid1, uid2].sort().join("_");

export const getOrCreateChat = async (myUid, targetUid, myProfile, targetProfile) => {
  const chatId = getChatId(myUid, targetUid);
  const chatRef = doc(db, "chats", chatId);
  try {
    const snap = await getDoc(chatRef);
    if (!snap.exists()) {
      await setDoc(chatRef, {
        participants:    [myUid, targetUid],
        createdAt:       serverTimestamp(),
        lastMessage:     "",
        lastMessageTime: serverTimestamp(),
        lastSenderId:    "",
        participantInfo: {
          [myUid]: {
            name:     myProfile?.fullName     || "",
            username: myProfile?.username     || "",
            photoURL: myProfile?.photoURL     || "",
          },
          [targetUid]: {
            name:     targetProfile?.fullName || "",
            username: targetProfile?.username || "",
            photoURL: targetProfile?.photoURL || "",
          },
        },
        unreadCount: { [myUid]: 0, [targetUid]: 0 },
        deletedFor:  [],
      });
    }
  } catch (e) {
    console.error("getOrCreateChat error:", e);
    throw e;
  }
  return chatId;
};

// Send a message
export const sendMessage = async (chatId, senderId, message) => {
  const chatRef  = doc(db, "chats", chatId);
  const msgsRef  = collection(db, "chats", chatId, "messages");

  const msgData = {
    senderId,
    text:      message.text      || "",
    type:      message.type      || "text",
    fileURL:   message.fileURL   || "",
    fileName:  message.fileName  || "",
    fileSize:  message.fileSize  || "",
    duration:  message.duration  || "",
    timestamp: serverTimestamp(),
    status:    "sent",
  };

  if (message.waveform)  msgData.waveform  = message.waveform;
  if (message.replyTo)   msgData.replyTo   = message.replyTo;
  if (message.forwarded) msgData.forwarded = true;

  const msgRef = await addDoc(msgsRef, msgData);

  const preview = message.type === "text"
    ? message.text
    : message.type === "image"    ? "📷 Photo"
    : message.type === "audio"    ? "🎵 Audio"
    : message.type === "document" ? `📄 ${message.fileName}`
    : message.type === "location" ? "📍 Location"
    : message.text;

  const chatSnap = await getDoc(chatRef);
  const otherUid = chatSnap.exists()
    ? chatSnap.data().participants?.find((p) => p !== senderId)
    : null;

  const updates = {
    lastMessage:     preview,
    lastMessageTime: serverTimestamp(),
    lastSenderId:    senderId,
    deletedFor:      [], // reappear for both users when new message arrives
  };
  if (otherUid) updates[`unreadCount.${otherUid}`] = (chatSnap.data().unreadCount?.[otherUid] || 0) + 1;

  await updateDoc(chatRef, updates);

  return msgRef.id;
};

// Real-time listener for messages in a chat
export const subscribeToMessages = (chatId, callback) => {
  const msgsRef = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "asc")
  );
  return onSnapshot(msgsRef, (snap) => {
    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(messages);
  }, (error) => {
    console.warn("subscribeToMessages error:", error.message);
    callback([]);
  });
};

// Real-time listener for all chats a user is in
export const subscribeToChats = (uid, callback) => {
  const chatsRef = query(
    collection(db, "chats"),
    where("participants", "array-contains", uid)
  );
  return onSnapshot(chatsRef, (snap) => {
    const chats = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => !(c.deletedFor || []).includes(uid))
      .sort((a, b) => {
        const aTime = a.lastMessageTime?.toMillis?.() || 0;
        const bTime = b.lastMessageTime?.toMillis?.() || 0;
        return bTime - aTime;
      });
    callback(chats);
  }, (error) => {
    console.warn("subscribeToChats error:", error.message);
    callback([]);
  });
};

export const markChatRead = async (chatId, uid) => {
  await updateDoc(doc(db, "chats", chatId), {
    [`unreadCount.${uid}`]: 0,
    [`readBy.${uid}`]: serverTimestamp(),
  });
};

export const incrementUnread = async (chatId, targetUid) => {
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);
  if (!snap.exists()) return;
  const current = snap.data().unreadCount?.[targetUid] || 0;
  await updateDoc(chatRef, {
    [`unreadCount.${targetUid}`]: current + 1,
  });
};

// ─── React to a message ──────────────────────────────────
export const markAudioPlayed = async (chatId, messageId) => {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    audioPlayed: true,
  });
};

export const reactToMessage = async (chatId, messageId, emoji, uid) => {
  const msgRef = doc(db, "chats", chatId, "messages", messageId);
  if (emoji === null) {
    // Remove reaction
    await updateDoc(msgRef, {
      [`reactions.${uid}`]: deleteField(),
      reaction: emoji, // keep legacy field in sync
    });
  } else {
    await updateDoc(msgRef, {
      [`reactions.${uid}`]: emoji,
      reaction: emoji, // keep legacy field in sync
    });
  }
};

// ─── Delete a message (mark as deleted) ──────────────────
export const deleteMessage = async (chatId, messageId) => {
  const msgRef  = doc(db, "chats", chatId, "messages", messageId);
  const chatRef = doc(db, "chats", chatId);

  const msgSnap = await getDoc(msgRef);
  const msgTimestamp = msgSnap.exists() ? msgSnap.data().timestamp : null;

  await updateDoc(msgRef, { deleted: true, text: "", fileURL: "" });

  const msgsSnap = await getDocs(query(
    collection(db, "chats", chatId, "messages"),
    orderBy("timestamp", "desc"),
    limit(30)
  ));

  const hasNewerMessage = msgsSnap.docs.some((d) => {
    if (d.id === messageId || d.data().deleted) return false;
    const dTs = d.data().timestamp;
    if (!dTs || !msgTimestamp) return false;
    const dMs = dTs.toMillis        ? dTs.toMillis()        : dTs.seconds * 1000;
    const mMs = msgTimestamp.toMillis ? msgTimestamp.toMillis() : msgTimestamp.seconds * 1000;
    return dMs > mMs;
  });

  if (hasNewerMessage) {
    const lastVisible = msgsSnap.docs.find(
      (d) => d.id !== messageId && !d.data().deleted
    );
    if (lastVisible) {
      const d = lastVisible.data();
      const preview = d.text ||
        (d.type === "image"    ? "📷 Photo"        :
         d.type === "audio"    ? "🎵 Audio"         :
         d.type === "document" ? `📄 ${d.fileName}` : "");
      await updateDoc(chatRef, { lastMessage: preview });
    }
  } else {
    await updateDoc(chatRef, { lastMessage: "You deleted this message" });
  }
};

// ─── Block / unblock a user ───────────────────────────────
export const blockUser = async (myUid, targetUid) => {
  await updateDoc(doc(db, "users", myUid), {
    blockedUsers: arrayUnion(targetUid),
  });
};

export const unblockUser = async (myUid, targetUid) => {
  await updateDoc(doc(db, "users", myUid), {
    blockedUsers: arrayRemove(targetUid),
  });
};

// ─── Clear chat preview ───────────────────────────────────
export const clearChatPreview = async (chatId) => {
  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: "",
    lastMessageTime: serverTimestamp(),
  });
};

// ─── Soft delete chat for one user ───────────────────────
export const deleteChat = async (chatId, uid) => {
  await updateDoc(doc(db, "chats", chatId), {
    deletedFor: arrayUnion(uid),
  });
};

// ─── Save support request to Firestore ───────────────────
export const saveSupportRequest = async (data) => {
  await addDoc(collection(db, "support_requests"), {
    name:      data.name,
    email:     data.email,
    topic:     data.topic,
    message:   data.message,
    refId:     data.refId,
    createdAt: serverTimestamp(),
    status:    "open",
  });
};

// ─── Placements ──────────────────────────────────────────
export const subscribeToPlacements = (callback) =>
  onSnapshot(placementsRef(), (snap) =>
    callback(snap.exists() ? (snap.data().items ?? []) : [])
  );

export const savePlacements = async (items) => {
  await setDoc(placementsRef(), {
    items,
    lastChanged: serverTimestamp(),
  });
};