import { useState, useEffect, useRef, useCallback } from "react";
import "../../styles/bus.css";

const COLLEGE = { lat: 19.246860, lng: 83.446065 };
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

function fmtTime(min) {
  if (min === null || min === undefined || min === "") return "";
  const neg = min < 0;
  const abs = Math.abs(min);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${neg ? "-" : ""}${h > 0 ? h + ":" : ""}${String(m).padStart(2, "0")}`;
}

function parseTime(str) {
  if (!str && str !== "0") return null;
  const neg = str.startsWith("-");
  const clean = str.replace("-", "").replace(":", "");
  const num = parseInt(clean, 10);
  if (isNaN(num)) return null;
  if (str.includes(":")) {
    const parts = str.replace("-", "").split(":");
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return (neg ? -1 : 1) * (h * 60 + m);
  }
  return (neg ? -1 : 1) * num;
}

export default function BusRouteEditor({ preset, isNew, onSave, onClose }) {
  const [name, setName] = useState(preset?.name || "");
  const [fromText, setFromText] = useState(preset?.from || "");
  const [toText, setToText] = useState(preset?.to || "");
  const [waypoints, setWaypoints] = useState(preset?.waypoints?.map((w) => ({ ...w })) || []);
  const [mode, setMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [pinPos, setPinPos] = useState(null);
  const [pinLabel, setPinLabel] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [dragIdx, setDragIdx] = useState(null);
  const [mapTypeOpen, setMapTypeOpen] = useState(false);
  const [mapType, setMapType] = useState("roadmap");
  const [trafficOn, setTrafficOn] = useState(false);
  const [darkMap, setDarkMap] = useState(true);
  const trafficLayerRef = useRef(null);
  const dragCurIdx = useRef(null);
  const waypointsRef = useRef(waypoints);
  waypointsRef.current = waypoints;

  const handleDragStart = useCallback((idx, e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const wpEl = e.target.closest(".bre-wp");
    const itemH = wpEl ? (wpEl.offsetHeight + 4) : 54;
    const anchorY = touch.clientY;
    dragCurIdx.current = idx;
    setDragIdx(idx);
    const move = (ev) => {
      ev.preventDefault();
      const dy = ev.touches[0].clientY - anchorY;
      const targetIdx = Math.min(waypointsRef.current.length - 1, Math.max(0, idx + Math.round(dy / itemH)));
      const cur = dragCurIdx.current;
      if (targetIdx === cur) return;
      setWaypoints((prev) => { const arr = [...prev]; const [item] = arr.splice(cur, 1); arr.splice(targetIdx, 0, item); return arr; });
      dragCurIdx.current = targetIdx;
      setDragIdx(targetIdx);
    };
    const end = () => { setDragIdx(null); dragCurIdx.current = null; window.removeEventListener("touchmove", move); window.removeEventListener("touchend", end); };
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end);
  }, []);

  const mapRef = useRef(null);
  const mapDivRef = useRef(null);
  const markersRef = useRef([]);
  const polyRef = useRef(null);
  const pinMarkerRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (!window.google?.maps || !mapDivRef.current || mapRef.current) return;
    const gm = window.google.maps;
    const center = waypoints.length > 0 ? waypoints[0] : COLLEGE;
    mapRef.current = new gm.Map(mapDivRef.current, {
      center, zoom: 14, disableDefaultUI: true, zoomControl: false,
      styles: DARK_STYLE, gestureHandling: "greedy",
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    const gm = window.google.maps, map = mapRef.current;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (polyRef.current) { polyRef.current.setMap(null); polyRef.current = null; }
    const startIdx = waypoints.findIndex((w) => w.markedTime === 0);
    const endIdx = waypoints.length - 1;
    waypoints.forEach((wp, i) => {
      const isStart = i === startIdx && startIdx >= 0;
      const isEnd = i === endIdx && waypoints.length > 1;
      const color = isStart ? "#4ade80" : isEnd ? "#ef4444" : "#6366f1";
      const m = new gm.Marker({
        position: wp, map,
        label: { text: isStart ? "S" : isEnd ? "E" : `${i}`, color: "#fff", fontSize: "10px", fontWeight: "700" },
        icon: { path: gm.SymbolPath.CIRCLE, scale: 12, fillColor: color, fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
      markersRef.current.push(m);
    });
    if (waypoints.length >= 2) {
      polyRef.current = new gm.Polyline({
        path: waypoints, strokeColor: "#a78bfa", strokeWeight: 3, strokeOpacity: 0.8, map,
        icons: [{ icon: { path: gm.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2.5, fillColor: "#c4b5fd", fillOpacity: 0.8, strokeWeight: 0 }, offset: "0", repeat: "60px" }],
      });
    }
  }, [waypoints]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    const gm = window.google.maps, map = mapRef.current;
    if (pinMarkerRef.current) { pinMarkerRef.current.setMap(null); pinMarkerRef.current = null; }
    if (mode !== "map-pick") return;
    const listener = map.addListener("click", (e) => {
      const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setPinPos(pos);
      if (pinMarkerRef.current) pinMarkerRef.current.setPosition(pos);
      else {
        pinMarkerRef.current = new gm.Marker({
          position: pos, map, draggable: true,
          icon: { url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="30" height="42"><path d="M15 0C6.7 0 0 6.7 0 15c0 12 15 27 15 27s15-15 15-27C30 6.7 23.3 0 15 0z" fill="#ef4444"/><circle cx="15" cy="14" r="6" fill="#fff"/></svg>'), scaledSize: new gm.Size(30, 42), anchor: new gm.Point(15, 42) },
        });
        pinMarkerRef.current.addListener("dragend", (de) => setPinPos({ lat: de.latLng.lat(), lng: de.latLng.lng() }));
      }
    });
    return () => gm.event.removeListener(listener);
  }, [mode]);

  useEffect(() => {
    if (mode !== "search" || !window.google?.maps?.places) return;
    if (!searchInputRef.current || autocompleteRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, { types: ["geocode", "establishment"], componentRestrictions: { country: "in" } });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (place.geometry?.location) {
        addWaypoint({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }, place.name || place.formatted_address || "Location");
        setMode("list"); setSearchQuery(""); autocompleteRef.current = null;
      }
    });
    autocompleteRef.current = ac;
    return () => { autocompleteRef.current = null; };
  }, [mode]);

  const addWaypoint = useCallback((pos, label) => {
    setWaypoints((prev) => [...prev, { lat: pos.lat, lng: pos.lng, label: label || `Point ${prev.length}`, markedTime: null }]);
    if (mapRef.current) { mapRef.current.panTo(pos); mapRef.current.setZoom(15); }
  }, []);

  const removeWaypoint = (idx) => setWaypoints((prev) => prev.filter((_, i) => i !== idx));
  const updateWaypoint = (idx, field, value) => setWaypoints((prev) => prev.map((wp, i) => i === idx ? { ...wp, [field]: value } : wp));

  const addCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => { addWaypoint({ lat: pos.coords.latitude, lng: pos.coords.longitude }, "Your Location"); setMode("list"); },
      () => alert("Could not get location")
    );
  };

  const confirmPin = () => {
    if (!pinPos) return;
    addWaypoint(pinPos, pinLabel.trim() || "Dropped Pin");
    setPinPos(null); setPinLabel("");
    if (pinMarkerRef.current) { pinMarkerRef.current.setMap(null); pinMarkerRef.current = null; }
    setMode("list");
  };

  const handleSave = () => {
    if (!name.trim()) { alert("Route name is required"); return; }
    if (!fromText.trim() || !toText.trim()) { alert("From and To are required"); return; }
    if (waypoints.length < 2) { alert("At least 2 waypoints required"); return; }
    const hasNull = waypoints.some((w) => w.markedTime === null || w.markedTime === undefined);
    if (hasNull) { alert("All waypoints must have a time set"); return; }
    onSave({ id: preset.id, name: name.trim(), from: fromText.trim(), to: toText.trim(), waypoints });
  };

  const changeMapType = (type) => { setMapType(type); setMapTypeOpen(false); if (mapRef.current) mapRef.current.setMapTypeId(type); };
  const toggleTraffic = () => {
    if (!mapRef.current || !window.google?.maps) return;
    if (trafficOn) { trafficLayerRef.current?.setMap(null); trafficLayerRef.current = null; }
    else { trafficLayerRef.current = new window.google.maps.TrafficLayer(); trafficLayerRef.current.setMap(mapRef.current); }
    setTrafficOn((p) => !p);
  };
  const toggleDarkMap = () => { if (!mapRef.current) return; setDarkMap((p) => { mapRef.current.setOptions({ styles: !p ? DARK_STYLE : [] }); return !p; }); };

  // Determine START/END indices dynamically
  const startIdx = waypoints.findIndex((w) => w.markedTime === 0);
  const endIdx = waypoints.length > 1 ? waypoints.reduce((maxI, wp, i, arr) => {
    if (wp.markedTime === null || wp.markedTime === undefined) return maxI;
    return (maxI === -1 || (wp.markedTime > (arr[maxI]?.markedTime ?? -Infinity))) ? i : maxI;
  }, -1) : -1;

  return (
    <div className="bre-overlay">
      <div className="bre-header">
        <button className="bre-back" onClick={onClose}><i className="bx bx-arrow-back" /></button>
        <span className="bre-title">{isNew ? "New Route" : "Edit Route"}</span>
        <button className="bre-save" onClick={handleSave}>Save</button>
      </div>

      <div className="bre-name-row">
        <input className="bre-name-input" placeholder="Route name…" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </div>

      <div className="bre-from-to">
        <div className="bre-ft-item">
          <span className="bre-ft-label">From</span>
          <input className="bre-ft-input" placeholder="e.g. Hostel" value={fromText} onChange={(e) => setFromText(e.target.value)} autoComplete="off" />
        </div>
        <button className="bre-swap" onClick={() => { setWaypoints((prev) => [...prev].reverse()); setFromText(toText); setToText(fromText); }}><i className="bx bx-transfer-alt" /></button>
        <div className="bre-ft-item">
          <span className="bre-ft-label">To</span>
          <input className="bre-ft-input" placeholder="e.g. College" value={toText} onChange={(e) => setToText(e.target.value)} autoComplete="off" />
        </div>
      </div>

      <div className="bre-map-area">
        <div ref={mapDivRef} className="bre-map" />

        {/* Map type overlay — top right of map */}
        <div className="bre-maptype-corner">
          <button className="bt-maptype__btn" onClick={() => setMapTypeOpen((p) => !p)}><i className="bx bx-layer" /></button>
          {mapTypeOpen && (
            <>
              <div className="bt-maptype__backdrop" onClick={() => setMapTypeOpen(false)} />
              <div className="bt-maptype__menu">
                <div className="bt-maptype__section">Map Type</div>
                {[{ key: "roadmap", label: "Default", icon: "bx-map" }, { key: "satellite", label: "Satellite", icon: "bx-globe" }, { key: "terrain", label: "Terrain", icon: "bx-landscape" }, { key: "hybrid", label: "Hybrid", icon: "bx-layer" }].map((t) => (
                  <button key={t.key} className={`bt-maptype__opt${mapType === t.key ? " bt-maptype__opt--active" : ""}`} onClick={() => changeMapType(t.key)}>
                    <i className={`bx ${t.icon}`} /><span>{t.label}</span>
                  </button>
                ))}
                <div className="bt-maptype__divider" />
                <button className={`bt-maptype__opt${trafficOn ? " bt-maptype__opt--active" : ""}`} onClick={toggleTraffic}>
                  <i className="bx bx-car" /><span>Traffic</span><span className={`bt-maptype__toggle${trafficOn ? " bt-maptype__toggle--on" : ""}`} />
                </button>
                <div className="bt-maptype__divider" />
                <button className={`bt-maptype__opt${darkMap ? " bt-maptype__opt--active" : ""}`} onClick={toggleDarkMap}>
                  <i className={`bx ${darkMap ? "bx-moon" : "bx-sun"}`} /><span>{darkMap ? "Dark Map" : "Light Map"}</span><span className={`bt-maptype__toggle${darkMap ? " bt-maptype__toggle--on" : ""}`} />
                </button>
              </div>
            </>
          )}
        </div>
        {mode === "map-pick" && (
          <div className="bre-pin-bar">
            <input className="bre-pin-input" placeholder="Label for this point…" value={pinLabel} onChange={(e) => setPinLabel(e.target.value)} autoComplete="off" />
            <button className="bre-pin-confirm" onClick={confirmPin} disabled={!pinPos}><i className="bx bx-check" /> Add</button>
            <button className="bre-pin-cancel" onClick={() => { setPinPos(null); setPinLabel(""); if (pinMarkerRef.current) { pinMarkerRef.current.setMap(null); pinMarkerRef.current = null; } setMode("list"); }}><i className="bx bx-x" /></button>
          </div>
        )}
      </div>

      {mode === "search" && (
        <div className="bre-search-overlay">
          <div className="bre-search-header">
            <button onClick={() => { setMode("list"); setSearchQuery(""); }}><i className="bx bx-arrow-back" /></button>
            <input ref={searchInputRef} className="bre-search-input" placeholder="Search for a location…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus autoComplete="off" />
          </div>
          <div className="bre-search-list">
            <button className="bre-search-opt" onClick={addCurrentLocation}><i className="bx bx-current-location" /><span>Your Location</span></button>
            <button className="bre-search-opt" onClick={() => { setMode("map-pick"); setSearchQuery(""); }}><i className="bx bx-map-pin" /><span>Choose on Map</span></button>
            <button className="bre-search-opt" onClick={() => { addWaypoint(COLLEGE, "College"); setMode("list"); }}><i className="bx bxs-school" /><span>College (MITS)</span></button>
          </div>
        </div>
      )}

      {mode === "list" && (
        <div className="bre-drawer">
          {/* Quick buttons attached to drawer top */}
          <div className="bre-drawer-quickbtns">
            <button onClick={() => navigator.geolocation.getCurrentPosition((p) => { if (mapRef.current) { mapRef.current.panTo({ lat: p.coords.latitude, lng: p.coords.longitude }); mapRef.current.setZoom(16); } })}><i className="bx bx-current-location" /></button>
            <button onClick={() => { if (mapRef.current) { mapRef.current.panTo(COLLEGE); mapRef.current.setZoom(15); } }}><i className="bx bxs-school" /></button>
          </div>

          <div className="bre-drawer-header">
            <span className="bre-drawer-title">
              Waypoints
              <span className="bre-info-wrap">
                <button className="bre-info-btn" onClick={() => setShowInfo((p) => !p)}><i className="bx bx-info-circle" /></button>
                {showInfo && (
                  <div className="bre-info-bubble">
                    <p><strong>−</strong> (minus) = bus parking / bus start point. eg- time <strong>-30</strong> means 30 min before departure to 00:00 (start point).</p>
                    <p><strong>00:00</strong> = official departure (start point / "From").</p>
                    <p><strong>Last point</strong> = final destination (end point / "To").</p>
                    <p>Times are in minutes relative to departure.</p>
                    <div className="bre-info-bubble__arrow" />
                  </div>
                )}
              </span>
            </span>
            <button className="bre-add-btn" onClick={() => setMode("search")}><i className="bx bx-plus" /></button>
          </div>

          <div className="bre-wp-list">
            {waypoints.map((wp, i) => {
              const isStart = i === startIdx;
              const isEnd = i === endIdx && waypoints.length > 1;
              return (
                <div key={i} className={`bre-wp${isStart ? " bre-wp--first" : ""}${isEnd ? " bre-wp--last" : ""}${dragIdx === i ? " bre-wp--dragging" : ""}`}>
                  <span className="bre-wp-idx">
                    {isStart ? <span className="bre-wp-pill bre-wp-pill--start">START</span> : isEnd ? <span className="bre-wp-pill bre-wp-pill--end">END</span> : i}
                  </span>
                  <div className="bre-wp-time-wrap">
                    <input
                      className={`bre-wp-time${wp.markedTime === null || wp.markedTime === undefined ? " bre-wp-time--empty" : ""}`}
                      value={editIdx === i ? undefined : fmtTime(wp.markedTime)}
                      defaultValue={editIdx === i ? (wp.markedTime ?? "").toString() : undefined}
                      onFocus={() => setEditIdx(i)}
                      onBlur={(e) => { updateWaypoint(i, "markedTime", parseTime(e.target.value)); setEditIdx(null); }}
                      placeholder="--"
                      inputMode="text"
                      autoComplete="off"
                    />
                  </div>
                  <input className="bre-wp-label" value={wp.label} onChange={(e) => updateWaypoint(i, "label", e.target.value)} placeholder="Label…" autoComplete="off" />
                  <div className="bre-wp-actions">
                    <button className="bre-wp-drag" onTouchStart={(e) => handleDragStart(i, e)} title="Hold to reorder"><i className="bx bx-menu" /></button>
                    <button className="bre-wp-del" onClick={() => removeWaypoint(i)}><i className="bx bx-x" /></button>
                  </div>
                </div>
              );
            })}
            {waypoints.length === 0 && (
              <div className="bre-wp-empty">
                <i className="bx bx-map-pin" />
                <span>No waypoints yet</span>
                <span className="bre-wp-empty-sub">Tap + to add your first stop</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}