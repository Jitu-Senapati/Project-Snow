/**
 * useCachedData.js
 * Cache-first data fetching:
 * 1. Return cached data immediately (instant UI)
 * 2. Fetch fresh data in background
 * 3. Update cache + UI when new data arrives
 */
import { useState, useEffect, useRef } from "react";
import {
  getCachedEvents, setCachedEvents,
  getCachedNotices, setCachedNotices,
  getCachedChats, setCachedChats,
  getCachedProfile, setCachedProfile,
  getLastSync, setLastSync,
} from "./appCache";
import { useSyncStatus } from "../context/SyncContext";

// ── Events ───────────────────────────────────────────────────────
export function useCachedEvents(subscribeToEvents) {
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { online, markFetching, markUpdated } = useSyncStatus();

  useEffect(() => {
    // 1. Show cached data immediately
    getCachedEvents().then((cached) => {
      if (cached.length > 0) {
        setEvents(cached);
        setLoaded(true);
      }
    });

    if (!online) return;

    // 2. Subscribe to live data in background
    markFetching();
    let first = true;
    const unsub = subscribeToEvents((fresh) => {
      setEvents(fresh);
      setLoaded(true);
      setCachedEvents(fresh);
      setLastSync("events");
      if (first) { markUpdated(); first = false; }
    });
    return () => unsub();
  }, [online]); // eslint-disable-line

  return { events, loaded };
}

// ── Notices ──────────────────────────────────────────────────────
export function useCachedNotices(subscribeToNotices) {
  const [notices, setNotices] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { online, markFetching, markUpdated } = useSyncStatus();

  useEffect(() => {
    getCachedNotices().then((cached) => {
      if (cached.length > 0) {
        setNotices(cached);
        setLoaded(true);
      }
    });

    if (!online) return;

    markFetching();
    let first = true;
    const unsub = subscribeToNotices((fresh) => {
      setNotices(fresh);
      setLoaded(true);
      setCachedNotices(fresh);
      setLastSync("notices");
      if (first) { markUpdated(); first = false; }
    });
    return () => unsub();
  }, [online]); // eslint-disable-line

  return { notices, loaded };
}

// ── Chats ────────────────────────────────────────────────────────
export function useCachedChats(subscribeToChats, uid) {
  const [chats, setChats] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { online, markFetching, markUpdated } = useSyncStatus();

  useEffect(() => {
    if (!uid) return;

    getCachedChats().then((cached) => {
      if (cached.length > 0) {
        setChats(cached);
        setLoaded(true);
      }
    });

    if (!online) return;

    markFetching();
    let first = true;
    const unsub = subscribeToChats(uid, (fresh) => {
      setChats(fresh);
      setLoaded(true);
      setCachedChats(fresh);
      setLastSync("chats");
      if (first) { markUpdated(); first = false; }
    });
    return () => unsub();
  }, [uid, online]); // eslint-disable-line

  return { chats, loaded };
}

// ── User profile ─────────────────────────────────────────────────
export async function getCachedUserProfile(uid, fetchFn) {
  const cached = await getCachedProfile(uid);
  if (cached) return cached;
  const fresh = await fetchFn(uid);
  if (fresh) setCachedProfile(uid, fresh);
  return fresh;
}