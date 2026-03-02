document.addEventListener("DOMContentLoaded", function () {
  /* ══════════════════════════════════════════════════════
     INSTALL BANNER
     Shows every page load (no sessionStorage persistence).
     Dismissed only by clicking ✕ or Install — for this session.
  ══════════════════════════════════════════════════════ */
  const installBanner = document.getElementById("installBanner");
  const installBtn = document.getElementById("installBtn");
  const installClose = document.getElementById("installClose");
  const mainApp = document.getElementById("mainApp");

  // Show banner after a short delay so the page feels loaded first
  setTimeout(() => {
    mainApp.classList.add("banner-visible");
  }, 600);

  function hideBanner() {
    mainApp.classList.remove("banner-visible");
  }

  // ✕ — dismiss for this session only
  installClose.addEventListener("click", hideBanner);

  // Install button — tell user how to install
  installBtn.addEventListener("click", () => {
    alert(
      "To install STUVO5 as an app:\n\n" +
        "• Chrome / Edge (desktop): click the ⊕ icon in the address bar, or ⋮ menu → Install app\n" +
        "• Chrome (Android): tap ⋮ menu → Add to Home Screen\n" +
        "• Safari (iPhone / iPad): tap Share ↑ → Add to Home Screen",
    );
    hideBanner();
  });

  /* ══════════════════════════════════════════════════════
     HEADER PANELS
  ══════════════════════════════════════════════════════ */
  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");
  const notifToggle = document.getElementById("notificationToggle");
  const notifPanel = document.getElementById("notificationPanel");

  function closeAllPanels() {
    menuPanel.classList.remove("active");
    notifPanel.classList.remove("active");
  }

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasOpen = menuPanel.classList.contains("active");
    closeAllPanels();
    if (!wasOpen) menuPanel.classList.add("active");
  });

  notifToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const wasOpen = notifPanel.classList.contains("active");
    closeAllPanels();
    if (!wasOpen) notifPanel.classList.add("active");
  });

  document.addEventListener("click", closeAllPanels);
  menuPanel.addEventListener("click", (e) => e.stopPropagation());
  notifPanel.addEventListener("click", (e) => e.stopPropagation());

  /* ══════════════════════════════════════════════════════
     EXPLORER BOTTOM SHEET
  ══════════════════════════════════════════════════════ */
  const explorerBtn = document.getElementById("explorerNavBtn");
  const explorerOverlay = document.getElementById("explorerOverlay");
  const explorerClose = document.getElementById("explorerClose");

  function openExplorer() {
    explorerOverlay.classList.add("active");
    explorerBtn.classList.add("active");
  }
  function closeExplorer() {
    explorerOverlay.classList.remove("active");
    explorerBtn.classList.remove("active");
  }

  explorerBtn.addEventListener("click", openExplorer);
  explorerClose.addEventListener("click", closeExplorer);
  explorerOverlay.addEventListener("click", (e) => {
    if (e.target === explorerOverlay) closeExplorer();
  });

  /* ══════════════════════════════════════════════════════
     BOTTOM NAV
  ══════════════════════════════════════════════════════ */
  document.querySelectorAll(".nav-item:not(.explorer-nav)").forEach((item) => {
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-item")
        .forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
    });
  });

  /* ══════════════════════════════════════════════════════
     CAROUSEL
     • Odd card count enforced (removes last card if even)
     • Always opens at the exact middle card
     • Arrows sit beside dots, NOT overlaid on cards
     • Accurate centering: tx = viewportW/2 − (idx×step + cardW/2)
  ══════════════════════════════════════════════════════ */
  const carousel = document.getElementById("eventsCarousel");
  const track = document.getElementById("eventsTrack");
  const dotsWrap = document.getElementById("carouselDots");
  const prevBtn = document.getElementById("prevArrow");
  const nextBtn = document.getElementById("nextArrow");

  if (!track || !carousel) return;

  /* 1. Enforce odd count */
  let cards = Array.from(track.querySelectorAll(".event-card"));
  while (cards.length % 2 === 0 && cards.length > 0) cards.pop().remove();
  const total = cards.length;
  if (total === 0) return;

  /* 2. Start at middle */
  let current = Math.floor(total / 2);

  /* 3. Image fade-in */
  cards.forEach((card) => {
    card.querySelectorAll("img").forEach((img) => {
      const reveal = () => img.classList.add("loaded");
      if (img.complete && img.naturalWidth > 0) {
        reveal();
        return;
      }
      img.addEventListener("load", reveal, { once: true });
      img.addEventListener("error", reveal, { once: true });
    });
  });

  /* 4. Build dots */
  dotsWrap.innerHTML = "";
  cards.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  /* 5. Measurement helpers */
  const cardW = () => cards[0].offsetWidth;
  const gapPx = () => parseInt(getComputedStyle(track).gap) || 16;
  const stepPx = () => cardW() + gapPx();
  const viewW = () => carousel.clientWidth;
  const calcTx = (i) => viewW() / 2 - (i * stepPx() + cardW() / 2);

  /* 6. Apply translateX */
  function applyTx(tx, animate = true) {
    track.style.transition = animate
      ? "transform 0.42s cubic-bezier(0.4,0,0.2,1)"
      : "none";
    track.style.transform = `translateX(${tx}px)`;
  }

  /* 7. Sync active card, dots, arrow states */
  function syncUI() {
    cards.forEach((c, i) => c.classList.toggle("active", i === current));
    dotsWrap
      .querySelectorAll(".dot")
      .forEach((d, i) => d.classList.toggle("active", i === current));
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === total - 1;
  }

  /* 8. Go to slide */
  function goTo(idx, animate = true) {
    if (idx < 0 || idx >= total) return;
    current = idx;
    applyTx(calcTx(current), animate);
    syncUI();
  }

  /* 9. Arrow buttons */
  if (prevBtn) prevBtn.addEventListener("click", () => goTo(current - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goTo(current + 1));

  /* 10. Keyboard */
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goTo(current - 1);
    if (e.key === "ArrowRight") goTo(current + 1);
  });

  /* 11. Drag / swipe */
  let dragging = false,
    startX = 0,
    delta = 0,
    baseTx = 0,
    t0 = 0;

  function dragStart(x) {
    dragging = true;
    startX = x;
    delta = 0;
    baseTx = calcTx(current);
    t0 = Date.now();
    track.classList.add("is-dragging");
    track.style.transition = "none";
  }
  function dragMove(x) {
    if (!dragging) return;
    delta = x - startX;
    let d = delta;
    /* rubber-band at ends */
    if ((current === 0 && d > 0) || (current === total - 1 && d < 0)) d *= 0.2;
    track.style.transform = `translateX(${baseTx + d}px)`;
  }
  function dragEnd() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");

    const elapsed = Date.now() - t0 || 1;
    const velocity = Math.abs(delta) / elapsed; // px/ms
    const threshold = cardW() / 4;
    const isFlick = velocity > 0.35 && Math.abs(delta) > 25;

    if ((delta < -threshold || (isFlick && delta < 0)) && current < total - 1)
      goTo(current + 1);
    else if ((delta > threshold || (isFlick && delta > 0)) && current > 0)
      goTo(current - 1);
    else goTo(current);
  }

  /* Touch */
  track.addEventListener("touchstart", (e) => dragStart(e.touches[0].clientX), {
    passive: true,
  });
  track.addEventListener("touchmove", (e) => dragMove(e.touches[0].clientX), {
    passive: true,
  });
  track.addEventListener("touchend", dragEnd);
  track.addEventListener("touchcancel", dragEnd);

  /* Mouse */
  track.addEventListener("mousedown", (e) => {
    dragStart(e.clientX);
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => dragMove(e.clientX));
  window.addEventListener("mouseup", dragEnd);
  window.addEventListener("mouseleave", dragEnd);

  /* Prevent stray clicks after drag */
  track.addEventListener("click", (e) => {
    if (Math.abs(delta) > 8) {
      e.stopPropagation();
      e.preventDefault();
    }
  });

  /* 12. Bookmark */
  track.addEventListener("click", (e) => {
    const btn = e.target.closest(".bookmark-btn");
    if (!btn) return;
    btn.classList.toggle("saved");
    const icon = btn.querySelector("i");
    icon.classList.toggle("bx-bookmark", !btn.classList.contains("saved"));
    icon.classList.toggle("bxs-bookmark", btn.classList.contains("saved"));
  });

  /* 13. Resize → recentre */
  let raf;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => goTo(current, false));
  });

  /* 14. Init — snap to middle after layout is painted */
  syncUI();
  requestAnimationFrame(() =>
    requestAnimationFrame(() => goTo(current, false)),
  );
});
