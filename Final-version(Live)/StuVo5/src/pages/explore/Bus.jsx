import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { subscribeToBuses, saveBuses, subscribeToBusPresets, saveBusPresets, searchUsersByName } from "../../firebase/db";
import { rtdb } from "../../firebase/config";
import { ref as rtRef, onValue, set as rtSet, remove as rtRemove } from "firebase/database";
import "../../styles/bus.css";
import "../../styles/AdminExplore.css";
import BusRouteEditor from "./BusRouteEditor";

const COLLEGE = { lat: 19.246111, lng: 83.446283 };
const STATUS = {
  "auto-scheduled": { label: "Auto", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  ontime: { label: "On Time", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  slightly_delayed: { label: "Slightly Delayed", color: "#facc15", bg: "rgba(250,204,21,0.12)" },
  delayed: { label: "Delayed", color: "#fb923c", bg: "rgba(251,146,60,0.12)" },
  canceled: { label: "Canceled", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  notstarted: { label: "Scheduled", color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};
const TABS = [
  { key: "all", label: "All" },
  { key: "ontime", label: "Ongoing" },
  { key: "delayed", label: "Delayed" },
  { key: "notstarted", label: "Upcoming" },
];
const SCHEDULE_OPTS = [
  { key: "daily", label: "Daily" },
  { key: "mon-sat", label: "Mon–Sat" },
  { key: "once", label: "Once" },
  { key: "custom", label: "Custom" },
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getSt = (s) => STATUS[s] || { label: s || "—", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" };

// Compute display status for auto-scheduled buses
function computeAutoStatus(bus, liveLocations, presets) {
  if (bus.status !== "auto-scheduled") return getSt(bus.status);
  const live = liveLocations[bus.id];
  const now = new Date();
  const dep = bus.departure; // "HH:MM" format
  if (!dep) return getSt("notstarted");

  const [hh, mm] = dep.split(":").map(Number);
  const depTime = new Date(); depTime.setHours(hh, mm, 0, 0);
  const diffMin = (now - depTime) / 60000;

  // Not started yet
  if (diffMin < -5 && !live) return getSt("notstarted");

  // Bus is live — check checkpoint timing
  if (live) {
    const preset = presets.find((p) => p.id === bus.fromPreset);
    if (preset?.waypoints?.length) {
      const busPos = { lat: live.lat, lng: live.lng };
      // Find closest waypoint
      let closestIdx = 0, closestDist = Infinity;
      preset.waypoints.forEach((wp, i) => {
        const d = Math.abs(wp.lat - busPos.lat) + Math.abs(wp.lng - busPos.lng);
        if (d < closestDist) { closestDist = d; closestIdx = i; }
      });
      const closestWp = preset.waypoints[closestIdx];
      if (closestWp?.markedTime != null) {
        const expectedTime = new Date(depTime.getTime() + closestWp.markedTime * 60000);
        const behindMin = (now - expectedTime) / 60000;
        if (behindMin <= 0) return getSt("ontime");
        if (behindMin <= 10) return getSt("slightly_delayed");
        return getSt("delayed");
      }
    }
    return getSt("ontime");
  }

  // Not live but past departure time
  if (diffMin > 0 && diffMin <= 10) return getSt("slightly_delayed");
  if (diffMin > 10) return getSt("delayed");
  return getSt("notstarted");
}

function runsToday(bus) {
  const d = new Date().getDay(); // 0=Sun
  if (!bus.schedule || bus.schedule === "daily") return true;
  if (bus.schedule === "mon-sat") return d >= 1 && d <= 6;
  if (bus.schedule === "once") return true; // always show "once" buses
  if (bus.schedule === "custom" && Array.isArray(bus.customDays)) return bus.customDays.includes(d);
  return true;
}

function km(a, b) {
  if (!a || !b) return null;
  const R = 6371, d = Math.PI / 180;
  const dLat = (b.lat - a.lat) * d, dLon = (b.lng - a.lng) * d;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * d) * Math.cos(b.lat * d) * Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))).toFixed(1);
}

/* ─── Google Maps ─── */
function useGoogleMaps() {
  const [ready, setReady] = useState(!!window.google?.maps);
  useEffect(() => {
    if (window.google?.maps) { setReady(true); return; }
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!key) return;
    const ex = document.querySelector('script[src*="maps.googleapis.com"]');
    if (ex) { ex.addEventListener("load", () => setReady(true)); return; }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    s.async = true; s.defer = true; s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);
  return ready;
}

const DARK_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1929" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

/* ─── BusMap ─── */
function BusMap({ buses, presets, selectedId, liveLocations, userLoc, onBusClick, mapRef, onMapClick, mapClickMode }) {
  const divRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const polylinesRef = useRef({});
  const selPolyRef = useRef(null);
  const ready = useGoogleMaps();

  useEffect(() => {
    if (!ready || !divRef.current || mapRef.current) return;
    const gm = window.google.maps;
    mapRef.current = new gm.Map(divRef.current, {
      center: COLLEGE, zoom: 14, disableDefaultUI: true,
      zoomControl: false,
      styles: DARK_STYLE, gestureHandling: "greedy",
    });
  }, [ready, mapRef]);

  // Map click handler for preset creation
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const gm = window.google.maps;
    const listener = mapRef.current.addListener("click", (e) => {
      if (mapClickMode && onMapClick) onMapClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
    return () => gm.event.removeListener(listener);
  }, [ready, mapClickMode, onMapClick, mapRef]);

  // User location
  useEffect(() => {
    if (!ready || !mapRef.current || !userLoc) return;
    const gm = window.google.maps;
    if (!userMarkerRef.current) {
      userMarkerRef.current = new gm.Marker({
        position: userLoc, map: mapRef.current, zIndex: 1000,
        icon: { path: gm.SymbolPath.CIRCLE, scale: 8, fillColor: "#6366f1", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
      });
    } else userMarkerRef.current.setPosition(userLoc);
  }, [ready, userLoc, mapRef]);

  // Bus markers (use live location if available, else static)
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const gm = window.google.maps, map = mapRef.current;
    const ids = new Set(buses.map((b) => b.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!ids.has(id)) { markersRef.current[id].setMap(null); delete markersRef.current[id]; }
    });
    buses.forEach((bus) => {
      const live = liveLocations[bus.id];
      const pos = live ? { lat: live.lat, lng: live.lng } : (bus.waypoints?.[0] || null);
      if (!pos) return;
      const st = getSt(bus.status);
      const isSel = bus.id === selectedId;
      const svg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="52" height="54"><rect x="2" y="2" width="48" height="40" rx="10" fill="${isSel ? '#fff' : 'rgba(10,13,22,0.96)'}" stroke="${isSel ? '#fff' : st.color}" stroke-width="2"/><polygon points="20,42 26,52 32,42" fill="${isSel ? '#fff' : st.color}"/><text x="26" y="28" text-anchor="middle" font-size="16" fill="${isSel ? '#0a0d16' : st.color}">🚌</text><text x="26" y="38" text-anchor="middle" font-size="7" font-weight="800" fill="${isSel ? '#0a0d16' : '#94a3b8'}" font-family="system-ui">${bus.id}</text></svg>`)}`;
      const icon = { url: svg, scaledSize: new gm.Size(52, 54), anchor: new gm.Point(26, 54) };
      if (markersRef.current[bus.id]) {
        const m = markersRef.current[bus.id];
        m.setPosition(pos); m.setIcon(icon);
        m.setOpacity(selectedId && !isSel ? 0.3 : 1);
      } else {
        const m = new gm.Marker({ position: pos, map, icon, opacity: selectedId && !isSel ? 0.3 : 1 });
        m.addListener("click", () => onBusClick(bus.id));
        markersRef.current[bus.id] = m;
      }
    });
  }, [ready, buses, selectedId, liveLocations, onBusClick, mapRef]);

  // Draw route polyline for selected bus using Directions API
  const dirRendererRef = useRef(null);
  const lastDirOriginRef = useRef(null); // avoid re-fetching if bus barely moved
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const gm = window.google.maps, map = mapRef.current;

    // Clean up previous route
    if (dirRendererRef.current) { dirRendererRef.current.setMap(null); dirRendererRef.current = null; }
    if (selPolyRef.current) { selPolyRef.current.setMap(null); selPolyRef.current = null; }

    if (!selectedId) { lastDirOriginRef.current = null; map.panTo(COLLEGE); map.setZoom(14); return; }

    const bus = buses.find((b) => b.id === selectedId);
    const fromPreset = presets.find((p) => p.id === bus?.fromPreset);
    const toPreset = presets.find((p) => p.id === bus?.toPreset);
    if (!fromPreset?.waypoints?.length || !toPreset?.waypoints?.length) return;

    const allWaypoints = [...fromPreset.waypoints, ...toPreset.waypoints];
    if (allWaypoints.length < 2) return;

    const live = liveLocations[selectedId];
    let origin, routePoints;

    if (live) {
      const busPos = { lat: live.lat, lng: live.lng };
      // Skip re-fetch if bus moved less than 200m
      if (lastDirOriginRef.current) {
        const moved = km(lastDirOriginRef.current, busPos);
        if (moved !== null && parseFloat(moved) < 0.2) return;
      }
      let closestIdx = 0, closestDist = Infinity;
      allWaypoints.forEach((wp, i) => {
        const d = Math.abs(wp.lat - busPos.lat) + Math.abs(wp.lng - busPos.lng);
        if (d < closestDist) { closestDist = d; closestIdx = i; }
      });
      routePoints = allWaypoints.slice(Math.min(closestIdx + 1, allWaypoints.length - 1));
      origin = busPos;
      lastDirOriginRef.current = busPos;
    } else {
      origin = allWaypoints[0];
      routePoints = allWaypoints.slice(1);
      lastDirOriginRef.current = null;
    }

    if (routePoints.length === 0) return;

    const destination = routePoints[routePoints.length - 1];
    const intermediateWaypoints = routePoints.slice(0, -1).map((wp) => ({
      location: new gm.LatLng(wp.lat, wp.lng), stopover: true,
    }));

    // Debounce: wait 1.5s after last liveLocation change
    const timer = setTimeout(() => {
      const directionsService = new gm.DirectionsService();
      const renderer = new gm.DirectionsRenderer({
        map, suppressMarkers: true,
        polylineOptions: { strokeColor: "#6366f1", strokeWeight: 5, strokeOpacity: 0.85 },
      });
      dirRendererRef.current = renderer;

      directionsService.route(
        {
          origin: new gm.LatLng(origin.lat, origin.lng),
          destination: new gm.LatLng(destination.lat, destination.lng),
          waypoints: intermediateWaypoints,
          travelMode: gm.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result, status) => {
          if (status === "OK") {
            renderer.setDirections(result);
            const bounds = new gm.LatLngBounds();
            result.routes[0].overview_path.forEach((p) => bounds.extend(p));
            if (live) bounds.extend({ lat: live.lat, lng: live.lng });
            map.fitBounds(bounds, { top: 70, bottom: 350, left: 40, right: 40 });
          } else {
            console.warn("Directions API failed:", status, "— using straight line fallback");
            selPolyRef.current = new gm.Polyline({
              path: [origin, ...routePoints],
              strokeColor: "#6366f1", strokeWeight: 4, strokeOpacity: 0.85, map,
            });
            const bounds = new gm.LatLngBounds();
            [origin, ...routePoints].forEach((w) => bounds.extend(w));
            map.fitBounds(bounds, { top: 70, bottom: 350, left: 40, right: 40 });
          }
        }
      );
    }, live ? 1500 : 100); // longer debounce for live updates, instant for first selection

    return () => clearTimeout(timer);
  }, [ready, selectedId, buses, presets, liveLocations, mapRef]);

  return <div ref={divRef} className={`btm-map${mapClickMode ? " btm-map--clickable" : ""}`} />;
}

/* ═══ MAIN ═══ */
export default function Bus() {
  const { currentUser, isAdmin, userProfile } = useAuth();
  const [buses, setBuses] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const minSheet = 100; // just header + hint
  const maxSheet = Math.round(window.innerHeight * 0.78);
  const [sheetH, setSheetH] = useState(minSheet);
  const [tab, setTab] = useState("all");
  const [time, setTime] = useState(new Date());
  const [userLoc, setUserLoc] = useState(null);
  const [liveLocations, setLiveLocations] = useState({});
  const [lastDataTime, setLastDataTime] = useState(null);
  // Admin
  const [editPanel, setEditPanel] = useState(false);
  const [editBus, setEditBus] = useState(null); // null=list, object=form
  const [delTarget, setDelTarget] = useState(null);
  const [delRouteTarget, setDelRouteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  // Route editor
  const [routeEditorData, setRouteEditorData] = useState(null); // null=closed, { preset, isNew }
  const [presetPanel, setPresetPanel] = useState(false);
  // Driver search
  const [driverSearch, setDriverSearch] = useState("");
  const [driverResults, setDriverResults] = useState([]);
  const [searchingDriver, setSearchingDriver] = useState(false);
  // Driver live toggle
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef(null);
  const mapRef = useRef(null);
  const [mapType, setMapType] = useState("roadmap");
  const [mapTypeOpen, setMapTypeOpen] = useState(false);
  const [trafficOn, setTrafficOn] = useState(false);
  const [darkMap, setDarkMap] = useState(true);
  const trafficLayerRef = useRef(null);
  const initialFitRef = useRef(false);
  const sheetRef = useRef(null);
  const scrollRef = useRef(null);

  // ── Subscriptions ──
  useEffect(() => { const u = subscribeToBuses((d) => { setBuses(d); setLoading(false); setLastDataTime(new Date()); }); return u; }, []);
  useEffect(() => { const u = subscribeToBusPresets((d) => setPresets(d)); return u; }, []);
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!navigator.geolocation) return;
    const w = navigator.geolocation.watchPosition(
      (p) => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setUserLoc(COLLEGE), { enableHighAccuracy: true, timeout: 10000 });
    return () => navigator.geolocation.clearWatch(w);
  }, []);

  // Live location listener (RTDB)
  useEffect(() => {
    const locRef = rtRef(rtdb, "busLocations");
    const unsub = onValue(locRef, (snap) => {
      const val = snap.val() || {};
      setLiveLocations(val);
      if (Object.keys(val).length > 0) setLastDataTime(new Date());
    });
    return () => unsub();
  }, []);

  // ── Derived ──
  const myDriverBus = useMemo(() => buses.find((b) => b.driverUid === currentUser?.uid), [buses, currentUser]);
  const selBus = buses.find((b) => b.id === selected) || null;
  const selSt = selBus ? computeAutoStatus(selBus, liveLocations, presets) : null;
  const selPreset = presets.find((p) => p.id === selBus?.fromPreset);
  const selLive = liveLocations[selected];
  const selDist = selLive && userLoc ? km(selLive, userLoc) : null;

  // Smart LIVE/stale indicator
  const dataAgeSec = lastDataTime ? Math.floor((time - lastDataTime) / 1000) : null;
  const isDataLive = dataAgeSec !== null && dataAgeSec < 30;
  const staleLabel = dataAgeSec !== null && !isDataLive
    ? (dataAgeSec < 60 ? `${dataAgeSec}s ago` : `${Math.floor(dataAgeSec / 60)}m ago`)
    : null;

  const displayBuses = useMemo(() => {
    let list = tab === "all" ? buses : buses.filter((b) => b.status === tab);
    return list.map((b) => ({ ...b, _runsToday: runsToday(b) })).sort((a, b) => (b._runsToday ? 1 : 0) - (a._runsToday ? 1 : 0));
  }, [buses, tab]);

  const handleBusClick = useCallback((id) => { setSelected((p) => p === id ? null : id); setSheetH(380); }, []);

  // Smooth sheet drag — works on entire drawer, scroll-aware
  const handleSheetTouch = useCallback((e) => {
    const startY = e.touches[0].clientY;
    const startH = sheetH;
    let dragging = false;
    const scrollEl = scrollRef.current;

    const move = (ev) => {
      const diff = startY - ev.touches[0].clientY; // positive = up(expand)
      if (!dragging) {
        if (Math.abs(diff) < 8) return; // dead zone for taps
        const goingDown = diff < 0;
        // If dragging down and scroll isn't at top, let native scroll handle it
        if (goingDown && scrollEl && scrollEl.scrollTop > 0) { end(); return; }
        dragging = true;
        if (scrollEl) scrollEl.style.overflowY = "hidden"; // lock scroll while dragging
      }
      ev.preventDefault(); // prevent pull-to-refresh
      const newH = Math.min(maxSheet, Math.max(minSheet, startH + diff));
      setSheetH(newH);
    };
    const end = () => {
      if (scrollEl) scrollEl.style.overflowY = "auto"; // restore scroll
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
    };
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
  }, [sheetH, maxSheet, minSheet]);

  // (quick action buttons positioned via CSS inside sheet wrapper)
  const changeMapType = (type) => {
    setMapType(type);
    setMapTypeOpen(false);
    if (mapRef.current) mapRef.current.setMapTypeId(type);
  };
  const toggleTraffic = () => {
    if (!mapRef.current || !window.google?.maps) return;
    if (trafficOn) {
      trafficLayerRef.current?.setMap(null);
      trafficLayerRef.current = null;
    } else {
      trafficLayerRef.current = new window.google.maps.TrafficLayer();
      trafficLayerRef.current.setMap(mapRef.current);
    }
    setTrafficOn((p) => !p);
  };
  const toggleDarkMap = () => {
    if (!mapRef.current) return;
    const next = !darkMap;
    setDarkMap(next);
    mapRef.current.setOptions({ styles: next ? DARK_STYLE : [] });
  };
  const flyToMe = () => {
    if (mapRef.current && userLoc) { mapRef.current.panTo(userLoc); mapRef.current.setZoom(16); }
  };
  const flyToCollege = () => {
    if (mapRef.current) { mapRef.current.panTo(COLLEGE); mapRef.current.setZoom(15); }
  };
  const fitAllBuses = () => {
    if (!mapRef.current || !window.google?.maps || buses.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    let any = false;
    buses.forEach((b) => {
      const live = liveLocations[b.id];
      const pos = live ? { lat: live.lat, lng: live.lng } : (b.waypoints?.[0] || null);
      if (pos) { bounds.extend(pos); any = true; }
    });
    if (userLoc) bounds.extend(userLoc);
    bounds.extend(COLLEGE);
    if (any) mapRef.current.fitBounds(bounds, { top: 20, bottom: 300, left: 30, right: 30 });
  };

  // Auto fit all buses on first load
  useEffect(() => {
    if (!loading && buses.length > 0 && mapRef.current && !initialFitRef.current) {
      initialFitRef.current = true;
      setTimeout(fitAllBuses, 500); // slight delay for map to be ready
    }
  }, [loading, buses]);
  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 3000); };

  // ── Driver live tracking ──
  const toggleTracking = () => {
    if (!myDriverBus) return;
    if (isTracking) {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      rtRemove(rtRef(rtdb, `busLocations/${myDriverBus.id}`));
      setIsTracking(false);
    } else {
      watchIdRef.current = navigator.geolocation.watchPosition((pos) => {
        rtSet(rtRef(rtdb, `busLocations/${myDriverBus.id}`), {
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          speed: pos.coords.speed, heading: pos.coords.heading,
          timestamp: Date.now(), driverUid: currentUser.uid,
        });
      }, null, { enableHighAccuracy: true, maximumAge: 3000 });
      setIsTracking(true);
    }
  };
  useEffect(() => () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); }, []);

  // ── Admin: Bus CRUD ──
  const [form, setForm] = useState({});
  const openAddBus = () => { setForm({ id: "", fromPreset: "", toPreset: "", departure: "", status: "auto-scheduled", customStatus: "", schedule: "daily", customDays: [], driverUid: "", driverName: "" }); setDriverSearch(""); setDriverResults([]); setEditBus("new"); };
  const openEditBus = (bus) => { setForm({ ...bus, fromPreset: bus.fromPreset || "", toPreset: bus.toPreset || "" }); setDriverSearch(bus.driverName || ""); setDriverResults([]); setEditBus(bus.id); };

  const saveBusForm = async () => {
    if (!form.id?.trim() || !form.fromPreset || !form.toPreset || !form.departure?.trim()) { showToast("error", "Bus ID, From, To & departure required"); return; }
    const fromP = presets.find((p) => p.id === form.fromPreset);
    const toP = presets.find((p) => p.id === form.toPreset);
    const busObj = {
      id: form.id.trim(), fromPreset: form.fromPreset, toPreset: form.toPreset,
      route: `${fromP?.name || "?"} → ${toP?.name || "?"}`,
      departure: form.departure.trim(), status: form.status === "custom" ? (form.customStatus || "custom") : (form.status || "auto-scheduled"),
      schedule: form.schedule || "daily",
      customDays: form.schedule === "custom" ? (form.customDays || []) : [],
      driverUid: form.driverUid || "", driverName: form.driverName || "",
    };
    setSaving(true);
    try {
      let updated;
      if (editBus === "new") {
        if (buses.find((b) => b.id === busObj.id)) { showToast("error", "Bus ID exists"); setSaving(false); return; }
        updated = [...buses, busObj];
      } else {
        updated = buses.map((b) => b.id === editBus ? busObj : b);
      }
      await saveBuses(updated); showToast("success", editBus === "new" ? "Bus added" : "Bus updated"); setEditBus(null);
    } catch (e) { console.error(e); showToast("error", "Save failed"); }
    setSaving(false);
  };

  const deleteBus = async () => {
    if (!delTarget) return;
    try { await saveBuses(buses.filter((b) => b.id !== delTarget)); showToast("success", `${delTarget} removed`); }
    catch (e) { showToast("error", "Delete failed"); }
    setDelTarget(null);
  };

  // ── Driver search ──
  useEffect(() => {
    if (driverSearch.length < 2) { setDriverResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingDriver(true);
      const r = await searchUsersByName(driverSearch);
      setDriverResults(r); setSearchingDriver(false);
    }, 400);
    return () => clearTimeout(t);
  }, [driverSearch]);

  // ── Preset CRUD ──
  const openAddPreset = () => { setRouteEditorData({ preset: { id: `preset_${Date.now()}`, name: "", waypoints: [] }, isNew: true }); };
  const openEditPreset = (p) => { setRouteEditorData({ preset: { ...p }, isNew: false }); };
  const handleMapClick = useCallback(() => {}, []);
  const handleRouteSave = async (presetObj) => {
    let updated;
    if (routeEditorData.isNew) updated = [...presets, presetObj];
    else updated = presets.map((p) => p.id === presetObj.id ? presetObj : p);
    try { await saveBusPresets(updated); showToast("success", "Route saved"); }
    catch (e) { showToast("error", "Failed to save route"); }
    setRouteEditorData(null);
  };
  const deletePreset = async (id) => {
    try { await saveBusPresets(presets.filter((p) => p.id !== id)); showToast("success", "Route removed"); }
    catch (e) { showToast("error", "Failed"); }
    setDelRouteTarget(null);
  };
  const confirmDeleteRoute = () => { if (delRouteTarget) deletePreset(delRouteTarget.id); };

  const F = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="bt-root">
      <BusMap buses={buses} presets={presets} selectedId={selected} liveLocations={liveLocations} userLoc={userLoc} onBusClick={handleBusClick} mapRef={mapRef} onMapClick={handleMapClick} mapClickMode={false} />

      {/* Map type selector */}
      <div className="bt-maptype">
        <button className="bt-maptype__btn" onClick={() => setMapTypeOpen((p) => !p)}>
          <i className="bx bx-layer" />
        </button>
        {mapTypeOpen && (
          <>
            <div className="bt-maptype__backdrop" onClick={() => setMapTypeOpen(false)} />
            <div className="bt-maptype__menu">
              <div className="bt-maptype__section">Map Type</div>
              {[
                { key: "roadmap", label: "Default", icon: "bx-map" },
                { key: "satellite", label: "Satellite", icon: "bx-globe" },
                { key: "terrain", label: "Terrain", icon: "bx-landscape" },
                { key: "hybrid", label: "Hybrid", icon: "bx-layer" },
              ].map((t) => (
                <button key={t.key} className={`bt-maptype__opt${mapType === t.key ? " bt-maptype__opt--active" : ""}`} onClick={() => changeMapType(t.key)}>
                  <i className={`bx ${t.icon}`} />
                  <span>{t.label}</span>
                </button>
              ))}
              <div className="bt-maptype__divider" />
              <button className={`bt-maptype__opt${trafficOn ? " bt-maptype__opt--active" : ""}`} onClick={toggleTraffic}>
                <i className="bx bx-car" />
                <span>Traffic</span>
                <span className={`bt-maptype__toggle${trafficOn ? " bt-maptype__toggle--on" : ""}`} />
              </button>
              <div className="bt-maptype__divider" />
              <button className={`bt-maptype__opt${darkMap ? " bt-maptype__opt--active" : ""}`} onClick={toggleDarkMap}>
                <i className={`bx ${darkMap ? "bx-moon" : "bx-sun"}`} />
                <span>{darkMap ? "Dark Map" : "Light Map"}</span>
                <span className={`bt-maptype__toggle${darkMap ? " bt-maptype__toggle--on" : ""}`} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* HEADER removed — uses Layout STUVO5 header */}

      {/* BOTTOM DRAWER */}
      {/* Quick actions + drawer wrapper */}
      {!editPanel && !routeEditorData && (
        <div ref={sheetRef} className="bt-sheet-wrap" style={{ maxHeight: selected ? 380 : sheetH }}>
          {/* Quick action buttons */}
          <div className="bt-quick-actions">
            <button className="bt-quick-btn" onClick={flyToMe} title="My Location">
              <i className="bx bx-current-location" />
            </button>
            <button className="bt-quick-btn" onClick={flyToCollege} title="College">
              <i className="bx bxs-school" />
            </button>
          </div>

          {/* Drawer */}
          <div className="bt-sheet" onTouchStart={handleSheetTouch}>
          <div className="bt-sheet__handle-zone"><div className="bt-sheet__handle" /></div>
          <div className="bt-sheet__header">
            <div>
              <div className="bt-sheet__title-row">
                {selected ? (
                  <button className="bt-allbuses-btn" onClick={() => { setSelected(null); setSheetH(minSheet); fitAllBuses(); }}>
                    <i className="bx bx-chevron-left" />All Buses
                  </button>
                ) : (
                  <button className="bt-allbuses-btn bt-allbuses-btn--active" onClick={fitAllBuses}>
                    <i className="bx bxs-bus" />All Buses
                  </button>
                )}
                {isAdmin && !selected && (
                  <button className="bt-sheet__edit" onClick={() => { setEditPanel(true); setEditBus(null); }}>
                    <i className="bx bx-edit" /><span>Edit</span>
                  </button>
                )}
              </div>
              <div className="bt-sheet__sub">{buses.filter((b) => b.status !== "notstarted").length} running now</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className={`bt-status-chip${isDataLive ? " bt-status-chip--live" : " bt-status-chip--stale"}`}>
                <span className={`bt-status-chip__dot${isDataLive ? "" : " bt-status-chip__dot--off"}`} />
                {isDataLive ? "LIVE" : (staleLabel ? `Updated ${staleLabel}` : "Connecting…")}
              </div>
            </div>
          </div>

          {!selected && buses.length > 0 && <div className="bt-hint-bar"><i className="bx bx-info-circle" />Choose a bus to live track</div>}
          {!selected && (<div className="bt-tabs">{TABS.map((t) => (<button key={t.key} className={`bt-tab${tab === t.key ? " bt-tab--active" : ""}`} onClick={() => setTab(t.key)}>{t.label}<span className="bt-tab__count">{t.key === "all" ? buses.length : buses.filter((b) => b.status === t.key).length}</span></button>))}</div>)}

          <div ref={scrollRef} className="bt-sheet__scroll">
            {/* Selected bus detail */}
            {selBus && selSt && (
              <div className="bt-card" style={{ "--sc": selSt.color }}>
                <div className="bt-card__accent" />
                <div className="bt-card__body">
                  <div className="bt-card__row">
                    <div className="bt-card__icon"><i className="bx bxs-bus" /><span>{selBus.id}</span></div>
                    <div className="bt-card__info"><div className="bt-card__route">{selBus.route}</div><div className="bt-card__meta"><i className="bx bx-time" />{selBus.departure}</div></div>
                    <span className="bt-item__badge" style={{ color: selSt.color, background: selSt.bg }}>{selSt.label}</span>
                    <button className="bt-card__close" onClick={() => setSelected(null)}><i className="bx bx-x" /></button>
                  </div>
                  {/* Live indicator */}
                  <div className="bt-card__live-row">
                    {selLive ? (<><span className="bt-live-dot" />Live tracked<span className="bt-live-time">Updated {new Date(selLive.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span></>) : (<><span className="bt-live-dot bt-live-dot--off" />Not live tracked<span className="bt-live-time">—</span></>)}
                    {selDist && <span className="bt-live-dist">{selDist} km away</span>}
                  </div>
                  {/* Driver toggle */}
                  {myDriverBus?.id === selBus.id && (
                    <div className="bt-driver-toggle">
                      <span>Share Live Location</span>
                      <button className={`bt-toggle${isTracking ? " bt-toggle--on" : ""}`} onClick={toggleTracking}>
                        <span className="bt-toggle__knob" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bus list */}
            {!selected && displayBuses.map((bus) => {
              const st = computeAutoStatus(bus, liveLocations, presets);
              const today = bus._runsToday;
              const live = liveLocations[bus.id];
              return (
                <div key={bus.id} className={`bt-item${!today ? " bt-item--grey" : ""}`} style={{ "--sc": st.color }} onClick={() => today && handleBusClick(bus.id)}>
                  <div className="bt-item__left">
                    <div className="bt-item__icon"><i className="bx bxs-bus" /><span>{bus.id}</span></div>
                    <div className="bt-item__text">
                      <div className="bt-item__route">{bus.route || "—"}</div>
                      <div className="bt-item__meta"><i className="bx bx-time" /><span>{bus.departure}</span>{!today && <span className="bt-item__off">Not today</span>}</div>
                    </div>
                  </div>
                  <div className="bt-item__right">
                    <span className="bt-item__badge" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  </div>
                  {/* Driver toggle inline */}
                  {myDriverBus?.id === bus.id && (
                    <div className="bt-driver-toggle bt-driver-toggle--inline" onClick={(e) => e.stopPropagation()}>
                      <span>Go Live</span>
                      <button className={`bt-toggle bt-toggle--sm${isTracking ? " bt-toggle--on" : ""}`} onClick={toggleTracking}><span className="bt-toggle__knob" /></button>
                    </div>
                  )}
                </div>
              );
            })}
            {!selected && !loading && displayBuses.length === 0 && <div className="bt-empty"><i className="bx bx-bus" /><span>No buses</span></div>}
            {loading && <div className="bt-empty"><i className="bx bx-loader-alt bx-spin" /><span>Loading…</span></div>}
          </div>
          </div>
        </div>
      )}

      {/* ═══ ADMIN EDIT PANEL (portaled to cover Layout) ═══ */}
      {editPanel && createPortal(
        <div className="edit-overlay">
          <div className="edit-page">
            {/* Header */}
            <div className="edit-page-header">
              <button className="edit-back-btn" onClick={() => { if (presetPanel) { setPresetPanel(false); } else { setEditPanel(false); setEditBus(null); } }}>
                <i className="bx bx-arrow-back" />
              </button>
              <span className="edit-page-title">{presetPanel ? "Route Presets" : "Bus Management"}</span>
              <button className="edit-save-btn" onClick={() => { setEditPanel(false); setEditBus(null); }}>Save</button>
            </div>

            {/* Bus list */}
            <div className="edit-page-content">
              {!presetPanel && (
                <>
                  {buses.map((bus) => { const st = getSt(bus.status); const autoSt = computeAutoStatus(bus, liveLocations, presets); return (
                    <div key={bus.id} className="ad-bus-card" style={{ "--sc": autoSt.color }}>
                      <div className="ad-bus-card__top">
                        <div className="ad-bus-card__icon"><i className="bx bxs-bus" /><span>{bus.id}</span></div>
                        <div className="ad-bus-card__info">
                          <div className="ad-bus-card__route">{bus.route || "—"}</div>
                          <div className="ad-bus-card__meta"><i className="bx bx-time" />{bus.departure}{bus.driverName && <><span className="ad-dot">·</span><i className="bx bx-user" />{bus.driverName}</>}</div>
                        </div>
                        <div className="ad-bus-card__actions">
                          <button className="ad-action-btn ad-action-btn--edit" onClick={() => openEditBus(bus)}><i className="bx bx-edit-alt" /></button>
                          <button className="ad-action-btn ad-action-btn--delete" onClick={() => setDelTarget(bus.id)}><i className="bx bx-trash" /></button>
                        </div>
                      </div>
                      <div className="ad-bus-card__bottom">
                        <span className="ad-bus-card__badge" style={{ color: autoSt.color, background: autoSt.bg }}>
                          {bus.status === "auto-scheduled" ? `Auto: ${autoSt.label}` : autoSt.label}
                        </span>
                        <span className="ad-bus-card__next"><i className="bx bx-refresh" />{bus.schedule === "custom" && Array.isArray(bus.customDays) ? bus.customDays.map((d) => DAY_LABELS[d]).join(", ") : (bus.schedule || "daily")}</span>
                      </div>
                    </div>); })}
                  {buses.length === 0 && <div className="bt-empty"><i className="bx bx-bus" /><span>No buses yet</span></div>}
                </>
              )}

              {/* Preset panel */}
              {presetPanel && (
                <>
                  {presets.map((p) => {
                    const checkpoints = Math.max(0, (p.waypoints?.length || 0) - 2);
                    return (
                    <div key={p.id} className="bt-preset-item">
                      <div>
                        <strong>{p.name}</strong>
                        <div className="bt-preset-meta">{p.from || "?"} → {p.to || "?"} · {checkpoints} checkpoint{checkpoints !== 1 ? "s" : ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="ad-action-btn ad-action-btn--edit" onClick={() => openEditPreset(p)}><i className="bx bx-edit-alt" /></button>
                        <button className="ad-action-btn ad-action-btn--delete" onClick={() => setDelRouteTarget(p)}><i className="bx bx-trash" /></button>
                      </div>
                    </div>
                    );
                  })}
                  {presets.length === 0 && <div className="bt-empty" style={{ padding: 20 }}><span>No routes — tap + to create</span></div>}
                </>
              )}
            </div>

            {/* Footer */}
            {!presetPanel && (
              <div className="edit-page-footer">
                <button className="bt-add-new-btn" onClick={openAddBus}>
                  <i className="bx bx-plus" /> Add New Bus
                </button>
                <button className="bt-routes-link" onClick={() => setPresetPanel(true)}>
                  <i className="bx bx-map-alt" /> Manage Routes
                </button>
              </div>
            )}
            {presetPanel && (
              <div className="edit-page-footer">
                <button className="bt-add-new-btn" onClick={openAddPreset}>
                  <i className="bx bx-plus" /> Add New Route
                </button>
              </div>
            )}

            {/* ── Form sheet (slides up for add/edit bus) ── */}
            <div className={`form-sheet-backdrop${editBus ? " active" : ""}`} onClick={() => setEditBus(null)} />
            <div className={`form-sheet${editBus ? " active" : ""}`}>
              <div className="form-sheet-handle" />
              <div className="form-sheet-title">
                <i className="bx bx-bus" />
                {editBus === "new" ? "Add Bus" : "Edit Bus"}
              </div>

              <div className="ef-field">
                <label className="ef-label">Bus ID *</label>
                <input className="ef-input" placeholder="e.g. BUS 01" value={form.id || ""} onChange={F("id")} disabled={editBus && editBus !== "new"} autoComplete="off" />
              </div>

              <div className="bt-from-to-row">
                <div className="ef-field" style={{ flex: 1 }}>
                  <label className="ef-label">From *</label>
                  <select className="ef-input bt-route-select" value={form.fromPreset || ""} onChange={(e) => {
                    if (e.target.value === "__add__") { openAddPreset(); setEditBus(null); return; }
                    const p = presets.find((pr) => pr.id === e.target.value);
                    setForm((prev) => ({ ...prev, fromPreset: e.target.value, toPreset: p ? (presets.find((pr2) => pr2.to && pr2.from === p.from)?.id || prev.toPreset) : prev.toPreset }));
                  }}>
                    <option value="" disabled>Select</option>
                    {[...new Set(presets.map((p) => p.from).filter(Boolean))].map((f) => <option key={f} value={presets.find((p) => p.from === f)?.id || f}>{f}</option>)}
                    <option value="__add__">+ Add new route</option>
                  </select>
                </div>
                <button type="button" className="bt-swap-btn" onClick={() => setForm((p) => ({ ...p, fromPreset: p.toPreset, toPreset: p.fromPreset }))}>
                  <i className="bx bx-transfer-alt" />
                </button>
                <div className="ef-field" style={{ flex: 1 }}>
                  <label className="ef-label">To *</label>
                  <select className="ef-input bt-route-select" value={form.toPreset || ""} onChange={(e) => {
                    if (e.target.value === "__add__") { openAddPreset(); setEditBus(null); return; }
                    setForm((p) => ({ ...p, toPreset: e.target.value }));
                  }}>
                    <option value="" disabled>Select</option>
                    {[...new Set(presets.map((p) => p.to).filter(Boolean))].map((t) => <option key={t} value={presets.find((p) => p.to === t)?.id || t}>{t}</option>)}
                    <option value="__add__">+ Add new route</option>
                  </select>
                </div>
              </div>

              <div className="ef-field">
                <label className="ef-label">Departure Time (Point 0) *</label>
                <input className="ef-input" type="time" value={form.departure || ""} onChange={F("departure")} />
              </div>

              <div className="ef-field">
                <label className="ef-label">Status</label>
                <div className="ad-status-options">
                  {[
                    { key: "auto-scheduled", label: "Auto-Scheduled", color: "#6366f1" },
                    { key: "canceled", label: "Canceled", color: "#ef4444" },
                    { key: "custom", label: "Custom", color: "#94a3b8" },
                  ].map((s) => (
                    <button key={s.key} type="button" className={`ad-status-btn${form.status === s.key ? " ad-status-btn--active" : ""}`} onClick={() => setForm((p) => ({ ...p, status: s.key }))}>{s.label}</button>
                  ))}
                </div>
                {form.status === "custom" && (
                  <input className="ef-input" style={{ marginTop: 6 }} placeholder="Custom status text…" value={form.customStatus || ""} onChange={F("customStatus")} autoComplete="off" />
                )}
              </div>

              <div className="ef-field">
                <label className="ef-label">Schedule</label>
                <div className="ad-status-options">
                  {SCHEDULE_OPTS.map((s) => (
                    <button key={s.key} type="button" className={`ad-status-btn${form.schedule === s.key ? " ad-status-btn--active" : ""}`} onClick={() => setForm((p) => ({ ...p, schedule: s.key }))}>{s.label}</button>
                  ))}
                </div>
                {form.schedule === "custom" && (
                  <div className="bt-day-row">{DAY_LABELS.map((d, i) => (<button key={i} className={`bt-day-btn${(form.customDays || []).includes(i) ? " bt-day-btn--on" : ""}`} onClick={() => setForm((p) => { const days = p.customDays || []; return { ...p, customDays: days.includes(i) ? days.filter((x) => x !== i) : [...days, i] }; })}>{d}</button>))}</div>
                )}
              </div>

              <div className="ef-field">
                <label className="ef-label">Live Location Access (Driver)</label>
                <input className="ef-input" placeholder="Search user by name…" value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} autoComplete="off" />
                {searchingDriver && <span className="bt-hint">Searching…</span>}
                {driverResults.length > 0 && (
                  <div className="bt-driver-results">{driverResults.map((u) => (
                    <div key={u.uid} className={`bt-driver-result${form.driverUid === u.uid ? " bt-driver-result--sel" : ""}`} onClick={() => { setForm((p) => ({ ...p, driverUid: u.uid, driverName: u.fullName })); setDriverSearch(u.fullName); setDriverResults([]); }}>
                      <span>{u.fullName}</span>
                      <span className="bt-driver-dept">{u.role === "faculty" ? (u.department || "Faculty") : `${u.branch || ""} ${u.year ? "• Year " + u.year : ""}`.trim() || "Student"}</span>
                    </div>
                  ))}</div>
                )}
                {form.driverUid && <span className="bt-hint bt-hint--ok">✓ {form.driverName}</span>}
              </div>

              <div className="ef-actions">
                <button className="ef-cancel" onClick={() => setEditBus(null)}>Cancel</button>
                <button className="ef-save" onClick={saveBusForm} disabled={saving}>{saving ? "Saving…" : editBus === "new" ? "Add Bus" : "Update"}</button>
              </div>
            </div>
            {/* Delete Bus Confirm */}
            {delTarget && (
              <div className="pl-confirm-overlay" onClick={() => setDelTarget(null)}>
                <div className="pl-confirm-box" onClick={(e) => e.stopPropagation()}>
                  <p className="pl-confirm-title">Remove Bus?</p>
                  <p className="pl-confirm-msg">Remove <strong>{delTarget}</strong>? This can't be undone.</p>
                  <div className="pl-confirm-actions">
                    <button className="pl-confirm-btn pl-confirm-btn--cancel" onClick={() => setDelTarget(null)}>Cancel</button>
                    <button className="pl-confirm-btn pl-confirm-btn--remove" onClick={deleteBus}>Remove</button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Route Confirm */}
            {delRouteTarget && (
              <div className="pl-confirm-overlay" onClick={() => setDelRouteTarget(null)}>
                <div className="pl-confirm-box" onClick={(e) => e.stopPropagation()}>
                  <p className="pl-confirm-title">Remove Route?</p>
                  <p className="pl-confirm-msg">Remove <strong>{delRouteTarget.name}</strong>? Buses using this route will lose their path.</p>
                  <div className="pl-confirm-actions">
                    <button className="pl-confirm-btn pl-confirm-btn--cancel" onClick={() => setDelRouteTarget(null)}>Cancel</button>
                    <button className="pl-confirm-btn pl-confirm-btn--remove" onClick={confirmDeleteRoute}>Remove</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* ═══ ROUTE EDITOR ═══ */}
      {routeEditorData && createPortal(
        <BusRouteEditor
          preset={routeEditorData.preset}
          isNew={routeEditorData.isNew}
          onSave={handleRouteSave}
          onClose={() => setRouteEditorData(null)}
        />,
        document.body
      )}

      {/* TOAST */}
      {toast && <div className={`ad-toast ad-toast--${toast.type}`}><i className={`bx ${toast.type === "success" ? "bx-check-circle" : "bx-error-circle"}`} />{toast.msg}</div>}
    </div>
  );
}