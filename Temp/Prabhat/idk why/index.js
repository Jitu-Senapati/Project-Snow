document.addEventListener("DOMContentLoaded", function () {
  // ===== ELEMENTS =====
  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");
  const notificationToggle = document.getElementById("notificationToggle");
  const notificationPanel = document.getElementById("notificationPanel");
  const explorerNavBtn = document.getElementById("explorerNavBtn");
  const explorerOverlay = document.getElementById("explorerOverlay");
  const explorerClose = document.getElementById("explorerClose");

  // ===== MENU TOGGLE =====
  if (menuToggle && menuPanel) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (notificationPanel) notificationPanel.classList.remove("active");
      menuPanel.classList.toggle("active");
    });
  }

  // ===== NOTIFICATION TOGGLE =====
  if (notificationToggle && notificationPanel) {
    notificationToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menuPanel) menuPanel.classList.remove("active");
      notificationPanel.classList.toggle("active");
    });
  }

  // ===== CLICK OUTSIDE CLOSE =====
  document.addEventListener("click", function (e) {
    if (
      menuPanel &&
      !menuPanel.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      menuPanel.classList.remove("active");
    }
    if (
      notificationPanel &&
      !notificationPanel.contains(e.target) &&
      !notificationToggle.contains(e.target)
    ) {
      notificationPanel.classList.remove("active");
    }
  });

  // ===== EXPLORER BOTTOM SHEET =====
  if (explorerNavBtn) {
    explorerNavBtn.addEventListener("click", () => {
      explorerNavBtn.classList.add("active");
      explorerOverlay.classList.add("active");
    });
  }

  if (explorerClose) {
    explorerClose.addEventListener("click", () => {
      explorerOverlay.classList.remove("active");
      explorerNavBtn.classList.remove("active");
    });
  }

  if (explorerOverlay) {
    explorerOverlay.addEventListener("click", (e) => {
      if (e.target === explorerOverlay) {
        explorerOverlay.classList.remove("active");
        explorerNavBtn.classList.remove("active");
      }
    });
  }

  // ===== EVENTS CAROUSEL =====
  const eventsTrack = document.getElementById("eventsTrack");
  const carouselDotsContainer = document.getElementById("carouselDots");

  if (!eventsTrack) return;

  const originalCards = Array.from(eventsTrack.querySelectorAll(".event-card"));
  const totalOriginalCards = originalCards.length;
  if (totalOriginalCards === 0) return;

  // ── Clone cards for infinite loop ──────────────────────────────
  const CLONE_COUNT = 3; // clones on each side

  // Prepend clones of LAST N originals
  for (let i = totalOriginalCards - CLONE_COUNT; i < totalOriginalCards; i++) {
    const clone = originalCards[i].cloneNode(true);
    clone.classList.add("clone");
    eventsTrack.insertBefore(clone, eventsTrack.firstChild);
  }

  // Append clones of FIRST N originals
  for (let i = 0; i < CLONE_COUNT; i++) {
    const clone = originalCards[i].cloneNode(true);
    clone.classList.add("clone");
    eventsTrack.appendChild(clone);
  }

  // All cards (originals + clones)
  const allCards = Array.from(eventsTrack.querySelectorAll(".event-card"));
  const totalCards = allCards.length;

  // Current real index (starts on first original = index CLONE_COUNT)
  let currentIndex = CLONE_COUNT;

  // Drag state
  let isDragging = false;
  let dragStartX = 0;
  let dragCurrentX = 0;
  let baseTranslate = 0; // translate at drag start

  // Auto-scroll
  let autoScrollInterval = null;
  let isHovering = false;

  // ── Helpers ────────────────────────────────────────────────────

  function getCardWidth() {
    // card width + gap (20px defined in CSS)
    const card = allCards[0];
    return card.offsetWidth + 20;
  }

  function getCenterOffset() {
    return eventsTrack.parentElement.offsetWidth / 2;
  }

  function translateForIndex(idx) {
    const cw = getCardWidth();
    const co = getCenterOffset();
    return -(idx * cw) + (co - cw / 2);
  }

  function applyTranslate(px, animate) {
    eventsTrack.style.transition = animate
      ? "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : "none";
    eventsTrack.style.transform = `translateX(${px}px)`;
  }

  function updateActiveCards() {
    allCards.forEach((card, idx) => {
      card.classList.toggle("active", idx === currentIndex);
    });

    // Sync dots with original index
    const origIdx =
      (((currentIndex - CLONE_COUNT) % totalOriginalCards) +
        totalOriginalCards) %
      totalOriginalCards;
    document.querySelectorAll(".carousel-dots .dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === origIdx);
    });
  }

  // ── Go to slide (no animation option) ─────────────────────────
  function goTo(idx, animate) {
    currentIndex = idx;
    applyTranslate(translateForIndex(currentIndex), animate);
    updateActiveCards();
  }

  // ── Next / Prev with seamless loop ────────────────────────────
  function next() {
    currentIndex++;
    applyTranslate(translateForIndex(currentIndex), true);
    updateActiveCards();

    // If we stepped into end-clones, silently jump back to real cards
    if (currentIndex >= totalCards - CLONE_COUNT) {
      eventsTrack.addEventListener("transitionend", resetToStart, {
        once: true,
      });
    }
  }

  function prev() {
    currentIndex--;
    applyTranslate(translateForIndex(currentIndex), true);
    updateActiveCards();

    // If we stepped into start-clones, silently jump to real cards
    if (currentIndex < CLONE_COUNT) {
      eventsTrack.addEventListener("transitionend", resetToEnd, { once: true });
    }
  }

  function resetToStart() {
    currentIndex = CLONE_COUNT + (currentIndex - (totalCards - CLONE_COUNT));
    goTo(currentIndex, false);
  }

  function resetToEnd() {
    currentIndex =
      totalCards - CLONE_COUNT - 1 - (CLONE_COUNT - 1 - currentIndex);
    goTo(currentIndex, false);
  }

  // ── Dots ───────────────────────────────────────────────────────
  function generateDots() {
    carouselDotsContainer.innerHTML = "";
    for (let i = 0; i < totalOriginalCards; i++) {
      const dot = document.createElement("span");
      dot.classList.add("dot");
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", () => {
        goTo(i + CLONE_COUNT, true);
        resetAutoScroll();
      });
      carouselDotsContainer.appendChild(dot);
    }
  }

  // ── Auto-scroll ────────────────────────────────────────────────
  function startAutoScroll() {
    stopAutoScroll();
    autoScrollInterval = setInterval(() => {
      if (!isDragging && !isHovering) next();
    }, 4000);
  }

  function stopAutoScroll() {
    clearInterval(autoScrollInterval);
    autoScrollInterval = null;
  }

  function resetAutoScroll() {
    stopAutoScroll();
    startAutoScroll();
  }

  // ── Drag helpers ───────────────────────────────────────────────
  function getEventX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onDragStart(e) {
    isDragging = true;
    dragStartX = getEventX(e);
    baseTranslate = translateForIndex(currentIndex);
    eventsTrack.style.transition = "none";
    eventsTrack.style.cursor = "grabbing";
    stopAutoScroll();
  }

  function onDragMove(e) {
    if (!isDragging) return;
    dragCurrentX = getEventX(e);
    const diff = dragCurrentX - dragStartX;
    eventsTrack.style.transform = `translateX(${baseTranslate + diff}px)`;
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    eventsTrack.style.cursor = "grab";

    const diff = dragCurrentX - dragStartX;

    if (diff < -60) {
      next();
    } else if (diff > 60) {
      prev();
    } else {
      // Snap back to current
      goTo(currentIndex, true);
    }

    resetAutoScroll();
  }

  // Touch events
  eventsTrack.addEventListener("touchstart", onDragStart, { passive: true });
  eventsTrack.addEventListener("touchmove", onDragMove, { passive: true });
  eventsTrack.addEventListener("touchend", onDragEnd);

  // Mouse events
  eventsTrack.addEventListener("mousedown", onDragStart);
  window.addEventListener("mousemove", onDragMove); // use window so fast drags don't escape
  window.addEventListener("mouseup", onDragEnd);

  // Prevent click firing after drag
  eventsTrack.addEventListener("click", (e) => {
    if (Math.abs(dragCurrentX - dragStartX) > 10) e.stopPropagation();
  });

  // Hover pause
  eventsTrack.addEventListener("mouseenter", () => {
    isHovering = true;
    stopAutoScroll();
  });
  eventsTrack.addEventListener("mouseleave", () => {
    isHovering = false;
    if (!isDragging) resetAutoScroll();
  });

  // ── Bookmark ──────────────────────────────────────────────────
  eventsTrack.addEventListener("click", (e) => {
    const btn = e.target.closest(".bookmark-btn");
    if (!btn) return;
    e.stopPropagation();
    btn.classList.toggle("saved");
    const icon = btn.querySelector("i");
    if (btn.classList.contains("saved")) {
      icon.classList.replace("bx-bookmark", "bx-bookmark-alt");
    } else {
      icon.classList.replace("bx-bookmark-alt", "bx-bookmark");
    }
  });

  // ── Init ───────────────────────────────────────────────────────
  generateDots();
  goTo(currentIndex, false);
  startAutoScroll();

  // Reposition on resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => goTo(currentIndex, false), 150);
  });

  // ===== NAVIGATION =====
  document.querySelectorAll(".nav-item:not(.explorer-nav)").forEach((item) => {
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-item")
        .forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
      const targetPage = item.getAttribute("data-page");
      console.log("Navigate to:", targetPage);
    });
  });
});
