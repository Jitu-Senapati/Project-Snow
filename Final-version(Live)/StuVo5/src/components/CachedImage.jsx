/**
 * CachedImage.jsx
 * Drop-in replacement for <img> that uses the blob cache.
 *
 * Key insight: on first render we synchronously check the in-memory
 * blob URL cache. If present (file was loaded this session), we render
 * the image immediately — no flicker, no skeleton. Only fall back to
 * async IndexedDB lookup for truly fresh files.
 */
import { useState, useEffect, useRef } from "react";
import { getBlobUrl, getBlobUrlSync } from "../utils/appCache";

export default function CachedImage({
  src,
  alt = "",
  className = "",
  style,
  onLoad,
  onError,
  draggable,
  fallback = null,
  ...rest
}) {
  // Synchronous initializer — if already loaded this session, render instantly
  const [resolvedSrc, setResolvedSrc] = useState(() => getBlobUrlSync(src));
  const [failed, setFailed] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

  useEffect(() => {
    if (!src) { setResolvedSrc(null); return; }

    // Check memory again when src changes (same component re-used for different img)
    const memUrl = getBlobUrlSync(src);
    if (memUrl) { setResolvedSrc(memUrl); setFailed(false); return; }

    // Not in memory — async lookup (IndexedDB or network)
    setFailed(false);
    let cancelled = false;
    (async () => {
      const blobUrl = await getBlobUrl(src);
      if (cancelled || !mountedRef.current) return;
      if (blobUrl) {
        setResolvedSrc(blobUrl);
      } else {
        setResolvedSrc(null);
        setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [src]);

  if (!resolvedSrc) {
    return fallback ?? (
      <div
        className={className}
        style={{
          background: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#333",
          ...style,
        }}
        {...rest}
      >
        {failed && <i className="bx bx-image" style={{ fontSize: 32 }} />}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      draggable={draggable}
      onLoad={onLoad}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}