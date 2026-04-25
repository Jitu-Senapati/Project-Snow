/**
 * appCache.js — IndexedDB-based offline-first caching
 * Stores: userProfile, chats, chatMessages, events, notices, blobs (for media)
 */

const DB_NAME = "stuvo5_cache";
const DB_VERSION = 2; // v2 adds "blobs" store
const STORES = ["keyval", "chats", "messages", "events", "notices", "profiles", "blobs"];

let _db = null;

export function openDB() {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: "id" });
        }
      });
    };
    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

// ── Generic get/set ──────────────────────────────────────────────
export async function cacheGet(store, id) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

export async function cacheSet(store, id, data) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put({ id, ...data, _cachedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function cacheGetAll(store) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => resolve([]);
  });
}

export async function cacheSetMany(store, items) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    const os = tx.objectStore(store);
    items.forEach((item) => os.put({ ...item, _cachedAt: Date.now() }));
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export async function cacheDelete(store, id) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// ── Key-value helpers ────────────────────────────────────────────
export async function kvGet(key) {
  const rec = await cacheGet("keyval", key);
  return rec ? rec.value : null;
}

export async function kvSet(key, value) {
  await cacheSet("keyval", key, { value });
}

// ── Specific data helpers ────────────────────────────────────────
export async function getCachedChats() {
  return cacheGetAll("chats");
}
export async function setCachedChats(chats) {
  return cacheSetMany("chats", chats.map((c) => ({ id: c.id, ...c })));
}
export async function getCachedMessages(chatId) {
  const all = await cacheGetAll("messages");
  return all.filter((m) => m.chatId === chatId);
}
export async function setCachedMessages(chatId, messages) {
  return cacheSetMany("messages", messages.map((m) => ({ id: m.id, chatId, ...m })));
}
export async function getCachedEvents() {
  return cacheGetAll("events");
}
export async function setCachedEvents(events) {
  return cacheSetMany("events", events.map((e) => ({ id: e.id, ...e })));
}
export async function getCachedNotices() {
  return cacheGetAll("notices");
}
export async function setCachedNotices(notices) {
  return cacheSetMany("notices", notices.map((n) => ({ id: n.id, ...n })));
}
export async function getCachedProfile(uid) {
  return cacheGet("profiles", uid);
}
export async function setCachedProfile(uid, profile) {
  return cacheSet("profiles", uid, profile);
}

// Last sync timestamps
export async function getLastSync(key) { return kvGet(`lastSync_${key}`); }
export async function setLastSync(key) { return kvSet(`lastSync_${key}`, Date.now()); }

// lastChanged timestamps
export async function getCachedLastChanged(type) {
  return kvGet(`lastChanged_${type}`);
}
export async function setCachedLastChanged(type, millis) {
  return kvSet(`lastChanged_${type}`, millis);
}

// ═══════════════════════════════════════════════════════════════════
// BLOB-BASED MEDIA CACHE
// Store the actual image/video/audio bytes as a Blob in IndexedDB.
// On subsequent loads, create a fresh object URL from the stored Blob.
// Zero network on cache hit, works offline, no SW involvement needed.
// ═══════════════════════════════════════════════════════════════════

// Convert any URL (with or without auth token) into a stable key
function urlToCacheKey(url) {
  try {
    const u = new URL(url);
    return u.origin + u.pathname;
  } catch {
    return url;
  }
}

// In-memory map: cacheKey → blob URL. Prevents creating duplicate object URLs.
const _blobUrlCache = new Map();
// In-memory map: cacheKey → pending promise. Prevents double-fetching same URL.
const _inFlight = new Map();

async function getCachedBlob(url) {
  const key = urlToCacheKey(url);
  const rec = await cacheGet("blobs", key);
  return rec?.blob || null;
}

async function setCachedBlob(url, blob, contentType) {
  const key = urlToCacheKey(url);
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").put({
      id: key,
      blob,
      contentType,
      _cachedAt: Date.now(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

/**
 * getBlobUrlSync(url) — synchronous check for in-memory blob URL
 * Returns a blob URL instantly if this session already created one,
 * otherwise returns null. Does NOT touch IndexedDB or network.
 * Use this for React useState initializers to avoid first-render flicker.
 */
export function getBlobUrlSync(url) {
  if (!url || !url.startsWith("http")) return url;
  const key = urlToCacheKey(url);
  return _blobUrlCache.get(key) || null;
}

/**
 * getBlobUrl(url)
 * Returns a blob: URL for the given source URL.
 *  • Already loaded this session → returns the existing blob URL instantly
 *  • Bytes in IndexedDB → creates a new blob URL from the stored Blob
 *  • Not cached and online → fetches, stores, returns blob URL
 *  • Not cached and offline → returns null (caller shows placeholder)
 * Auth-protected URLs (profilePhotos) bypass the cache and return as-is.
 */
export async function getBlobUrl(url) {
  if (!url || !url.startsWith("http")) return url;

  const key = urlToCacheKey(url);

  // 1. Already created a blob URL this session
  if (_blobUrlCache.has(key)) return _blobUrlCache.get(key);

  // 2. Coalesce concurrent calls for the same URL
  if (_inFlight.has(key)) return _inFlight.get(key);

  const promise = (async () => {
    // 3. Try IndexedDB
    const cachedBlob = await getCachedBlob(url);
    if (cachedBlob) {
      const blobUrl = URL.createObjectURL(cachedBlob);
      _blobUrlCache.set(key, blobUrl);
      return blobUrl;
    }

    // 4. Fetch from network if online
    if (!navigator.onLine) return null;

    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      await setCachedBlob(url, blob, blob.type);
      const blobUrl = URL.createObjectURL(blob);
      _blobUrlCache.set(key, blobUrl);
      return blobUrl;
    } catch {
      return null;
    }
  })();

  _inFlight.set(key, promise);
  try {
    const result = await promise;
    return result;
  } finally {
    _inFlight.delete(key);
  }
}

/**
 * precacheMedia(url) — fire-and-forget warmup
 */
export function precacheMedia(url) {
  if (!url || !url.startsWith("http")) return;
  const key = urlToCacheKey(url);
  if (_blobUrlCache.has(key)) return;
  getBlobUrl(url).catch(() => {});
}

/**
 * hasCachedBlob(url) — check IndexedDB without fetching
 */
export async function hasCachedBlob(url) {
  if (!url) return false;
  const key = urlToCacheKey(url);
  if (_blobUrlCache.has(key)) return true;
  const rec = await cacheGet("blobs", key);
  return !!rec?.blob;
}

// Evict oldest blobs when cache grows too large
const BLOB_CACHE_MAX_ITEMS = 500;
export async function evictOldBlobs() {
  try {
    const all = await cacheGetAll("blobs");
    if (all.length <= BLOB_CACHE_MAX_ITEMS) return;
    all.sort((a, b) => (a._cachedAt || 0) - (b._cachedAt || 0));
    const toDelete = all.slice(0, all.length - BLOB_CACHE_MAX_ITEMS);
    for (const item of toDelete) await cacheDelete("blobs", item.id);
  } catch {}
}

export async function clearBlobCache() {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("blobs", "readwrite");
    tx.objectStore("blobs").clear();
    tx.oncomplete = () => {
      for (const url of _blobUrlCache.values()) URL.revokeObjectURL(url);
      _blobUrlCache.clear();
      resolve();
    };
    tx.onerror = () => resolve();
  });
}