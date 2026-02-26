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

  // ── Image fade-in on load ──────────────────────────────────────
  function setupImageFadeIn(card) {
    card.querySelectorAll("img").forEach((img) => {
      if (img.complete) {
        img.classList.add("loaded");
      } else {
        img.addEventListener("load", () => img.classList.add("loaded"), {
          once: true,
        });
        img.addEventListener("error", () => img.classList.add("loaded"), {
          once: true,
        }); // show broken gracefully
      }
    });
  }
  originalCards.forEach(setupImageFadeIn);

  // ── Clone cards for infinite loop ──────────────────────────────
  const CLONE_COUNT = 3;

  for (let i = totalOriginalCards - CLONE_COUNT; i < totalOriginalCards; i++) {
    const clone = originalCards[i].cloneNode(true);
    clone.classList.add("clone");
    setupImageFadeIn(clone);
    eventsTrack.insertBefore(clone, eventsTrack.firstChild);
  }

  for (let i = 0; i < CLONE_COUNT; i++) {
    const clone = originalCards[i].cloneNode(true);
    clone.classList.add("clone");
    setupImageFadeIn(clone);
    eventsTrack.appendChild(clone);
  }

  const allCards = Array.from(eventsTrack.querySelectorAll(".event-card"));
  const totalCards = allCards.length;

  // currentIndex always points to the card that should be centered
  let currentIndex = CLONE_COUNT;

  let isDragging = false;
  let dragStartX = 0;
  let dragCurrentX = 0;
  let baseTranslate = 0;

  let autoScrollInterval = null;
  let isHovering = false;
  let isTransitioning = false;

  // ── Helpers ────────────────────────────────────────────────────

  function getCardWidth() {
    return allCards[0].offsetWidth + 12; // 12 = gap
  }

  // The track is centered: active card sits in the middle of the carousel container
  function translateForIndex(idx) {
    const carousel = eventsTrack.parentElement;
    const containerW = carousel.offsetWidth;
    const cw = getCardWidth();
    // Center the active card
    return containerW / 2 - cw / 2 - idx * cw;
  }

  function applyTranslate(px, animate) {
    eventsTrack.style.transition = animate
      ? "transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : "none";
    eventsTrack.style.transform = `translateX(${px}px)`;
  }

  function getOrigIdx(idx) {
    return (
      (((idx - CLONE_COUNT) % totalOriginalCards) + totalOriginalCards) %
      totalOriginalCards
    );
  }

  function updateActiveCards() {
    allCards.forEach((card, idx) => {
      card.classList.toggle("active", idx === currentIndex);
    });
    const origIdx = getOrigIdx(currentIndex);
    document.querySelectorAll(".carousel-dots .dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === origIdx);
    });
  }

  function goTo(idx, animate) {
    currentIndex = idx;
    applyTranslate(translateForIndex(currentIndex), animate);
    updateActiveCards();
  }

  function next() {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex++;
    applyTranslate(translateForIndex(currentIndex), true);
    updateActiveCards();
  }

  function prev() {
    if (isTransitioning) return;
    isTransitioning = true;
    currentIndex--;
    applyTranslate(translateForIndex(currentIndex), true);
    updateActiveCards();
  }

  // After transition ends, silently jump to the real card if we're in clone territory
  eventsTrack.addEventListener("transitionend", () => {
    isTransitioning = false;
    if (currentIndex >= totalCards - CLONE_COUNT) {
      currentIndex = CLONE_COUNT + (currentIndex - (totalCards - CLONE_COUNT));
      goTo(currentIndex, false);
    } else if (currentIndex < CLONE_COUNT) {
      currentIndex =
        totalCards - CLONE_COUNT - 1 - (CLONE_COUNT - 1 - currentIndex);
      goTo(currentIndex, false);
    }
  });

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

  // ── Drag ───────────────────────────────────────────────────────
  function getEventX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }

  function onDragStart(e) {
    isDragging = true;
    dragStartX = getEventX(e);
    dragCurrentX = dragStartX;
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
      goTo(currentIndex, true);
    }
    resetAutoScroll();
  }

  eventsTrack.addEventListener("touchstart", onDragStart, { passive: true });
  eventsTrack.addEventListener("touchmove", onDragMove, { passive: true });
  eventsTrack.addEventListener("touchend", onDragEnd);
  eventsTrack.addEventListener("mousedown", onDragStart);
  window.addEventListener("mousemove", onDragMove);
  window.addEventListener("mouseup", onDragEnd);

  eventsTrack.addEventListener("click", (e) => {
    if (Math.abs(dragCurrentX - dragStartX) > 10) e.stopPropagation();
  });

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
