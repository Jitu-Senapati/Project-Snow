import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProgressProvider } from "./context/ProgressContext";
import { SyncProvider } from "./context/SyncContext";
import "./index.css";
import App from "./App.jsx";

// ── Capture beforeinstallprompt EARLY ─────────────────────────────
// This event fires once, very early. Must listen before React mounts.
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__stuvo5InstallPrompt = e;
  // Notify any component listening
  window.dispatchEvent(new CustomEvent("stuvo5:installAvailable"));
});

window.addEventListener("appinstalled", () => {
  window.__stuvo5InstallPrompt = null;
  window.dispatchEvent(new CustomEvent("stuvo5:installed"));
});

// ── Register Service Worker ───────────────────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const sw = reg.active || reg.installing || reg.waiting;
      if (!sw) return;

      // 1. Cache all JS/CSS chunks Vite injected into this page
      const chunkUrls = [
        ...[...document.querySelectorAll("script[src]")]
          .map((s) => s.src)
          .filter((s) => s.includes("/assets/")),
        ...[...document.querySelectorAll("link[rel=stylesheet][href]")]
          .map((l) => l.href)
          .filter((h) => h.includes("/assets/")),
      ];
      if (chunkUrls.length > 0) {
        sw.postMessage({ type: "CACHE_CHUNKS", urls: chunkUrls });
      }

      // 2. Proactively fetch + cache remaining page chunks by
      //    triggering dynamic imports in background after 3s
      //    (gives main thread time to settle first)
      setTimeout(() => prefetchAllPageChunks(sw), 3000);

    } catch (e) {
      console.warn("SW registration failed:", e);
    }
  });
}

// Pre-load all lazy pages in background so their chunks get cached
async function prefetchAllPageChunks(sw) {
  const pages = [
    () => import("./pages/explore/Explore.jsx"),
    () => import("./pages/explore/Chats.jsx"),
    () => import("./pages/explore/ChatWindow.jsx"),
    () => import("./pages/explore/Profile.jsx"),
    () => import("./pages/explore/OthersProfile.jsx"),
    () => import("./pages/explore/Settings.jsx"),
    () => import("./pages/explore/Search.jsx"),
    () => import("./pages/explore/Bus.jsx"),
    () => import("./pages/explore/SupportUs.jsx"),
    () => import("./pages/explore/Syllabus.jsx"),
    () => import("./pages/explore/RaiseComplaint.jsx"),
    () => import("./pages/explore/ComingSoon.jsx"),
    () => import("./pages/auth/Login.jsx"),
    () => import("./pages/auth/Register.jsx"),
  ];

  for (const load of pages) {
    try {
      await load(); // triggers Vite to fetch the chunk
    } catch {}
    // Small delay between each to avoid blocking main thread
    await new Promise((r) => setTimeout(r, 200));
  }
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ProgressProvider>
        <AuthProvider>
          <SyncProvider>
            <App />
          </SyncProvider>
        </AuthProvider>
      </ProgressProvider>
    </BrowserRouter>
  </StrictMode>
);