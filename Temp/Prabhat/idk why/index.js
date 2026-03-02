document.addEventListener("DOMContentLoaded", function () {
  /* ============================================================
     HEADER PANELS
  ============================================================ */
  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");
  const notifToggle = document.getElementById("notificationToggle");
  const notifPanel = document.getElementById("notificationPanel");

  function closeAll() {
    menuPanel.classList.remove("active");
    notifPanel.classList.remove("active");
  }

  menuToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    const open = menuPanel.classList.contains("active");
    closeAll();
    if (!open) menuPanel.classList.add("active");
  });

  notifToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    const open = notifPanel.classList.contains("active");
    closeAll();
    if (!open) notifPanel.classList.add("active");
  });

  document.addEventListener("click", closeAll);
  menuPanel.addEventListener("click", function (e) {
    e.stopPropagation();
  });
  notifPanel.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  /* ============================================================
     EXPLORER BOTTOM SHEET
  ============================================================ */
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
  explorerOverlay.addEventListener("click", function (e) {
    if (e.target === explorerOverlay) closeExplorer();
  });

  /* ============================================================
     BOTTOM NAV
  ============================================================ */
  document
    .querySelectorAll(".nav-item:not(.explorer-nav)")
    .forEach(function (item) {
      item.addEventListener("click", function () {
        document.querySelectorAll(".nav-item").forEach(function (n) {
          n.classList.remove("active");
        });
        item.classList.add("active");
      });
    });

  /* ============================================================
     CAROUSEL
     ─────────────────────────────────────────────────────────────
     We clone ALL N cards on both sides so the nearest clone is
     always exactly 1 card away — the silent jump after loop is
     imperceptible because it's zero visual distance.

     Layout: [N clones of tail | originals | N clones of head]
     Real cards live at indices N … 2N-1.
     Current starts at N (first real card).
  ============================================================ */
  const track = document.getElementById("eventsTrack");
  const dotsWrap = document.getElementById("carouselDots");
  if (!track) return;

  const originals = Array.from(track.querySelectorAll(".event-card"));
  const N = originals.length;
  if (N === 0) return;

  // Image fade-in
  function fadeIn(card) {
    card.querySelectorAll("img").forEach(function (img) {
      function show() {
        img.classList.add("loaded");
      }
      if (img.complete && img.naturalWidth) {
        show();
      } else {
        img.addEventListener("load", show, { once: true });
        img.addEventListener("error", show, { once: true });
      }
    });
  }
  originals.forEach(fadeIn);

  // Clone N cards before (tail copies) and N cards after (head copies)
  for (let i = N - 1; i >= 0; i--) {
    const c = originals[i].cloneNode(true);
    c.classList.add("clone");
    fadeIn(c);
    track.insertBefore(c, track.firstChild);
  }
  for (let i = 0; i < N; i++) {
    const c = originals[i].cloneNode(true);
    c.classList.add("clone");
    fadeIn(c);
    track.appendChild(c);
  }

  const allCards = Array.from(track.querySelectorAll(".event-card"));
  const TOTAL = allCards.length; // 3N total

  // current = index into allCards. Starts at N (first real card).
  let current = N;
  let animating = false;
  let isDragging = false;
  let dragDelta = 0;
  let isHover = false;

  function cardW() {
    return allCards[0].offsetWidth + 12;
  }
  function containerW() {
    return track.parentElement.offsetWidth;
  }
  function xFor(i) {
    return containerW() / 2 - cardW() / 2 - i * cardW();
  }

  function setPos(x, anim) {
    track.style.transition = anim
      ? "transform 0.42s cubic-bezier(0.35, 0, 0.25, 1)"
      : "none";
    track.style.transform = "translateX(" + x + "px)";
  }

  function updateUI() {
    allCards.forEach(function (c, i) {
      c.classList.toggle("active", i === current);
    });
    // dot index = position within the real cards block
    const dotIdx = (((current - N) % N) + N) % N;
    document.querySelectorAll(".carousel-dots .dot").forEach(function (d, i) {
      d.classList.toggle("active", i === dotIdx);
    });
  }

  // Instant jump — no animation, no visible movement
  function jumpTo(i) {
    current = i;
    setPos(xFor(current), false);
    updateUI();
  }

  // Animated slide
  function slideTo(i) {
    if (animating) return;
    animating = true;
    current = i;
    setPos(xFor(current), true);
    updateUI();

    const safety = setTimeout(onDone, 460);

    function onDone() {
      clearTimeout(safety);
      track.removeEventListener("transitionend", onTransEnd);
      animating = false;

      // If we drifted into the clone zone, jump to the real equivalent
      // The jump is zero visual distance because clones are identical
      if (current < N) {
        // In pre-clones → jump to matching real card in tail
        jumpTo(current + N);
      } else if (current >= 2 * N) {
        // In post-clones → jump to matching real card in head
        jumpTo(current - N);
      }
    }

    function onTransEnd(e) {
      if (e.target !== track || e.propertyName !== "transform") return;
      onDone();
    }
    track.addEventListener("transitionend", onTransEnd);
  }

  function goNext() {
    slideTo(current + 1);
  }
  function goPrev() {
    slideTo(current - 1);
  }

  // Dots
  dotsWrap.innerHTML = "";
  for (let i = 0; i < N; i++) {
    (function (idx) {
      const dot = document.createElement("span");
      dot.className = "dot" + (idx === 0 ? " active" : "");
      dot.addEventListener("click", function () {
        slideTo(N + idx);
      });
      dotsWrap.appendChild(dot);
    })(i);
  }

  // Hover pause (no auto-scroll, but keep pause logic for drag)
  track.addEventListener("mouseenter", function () {
    isHover = true;
  });
  track.addEventListener("mouseleave", function () {
    isHover = false;
  });

  // Drag / swipe
  let dragStartX = 0;
  let dragStartT = 0;
  let baseX = 0;

  function onDragStart(x) {
    isDragging = true;
    animating = false; // always unlock on touch
    dragStartX = x;
    dragDelta = 0;
    dragStartT = Date.now();
    baseX = xFor(current);
    track.style.transition = "none";
    track.style.cursor = "grabbing";
  }

  function onDragMove(x) {
    if (!isDragging) return;
    dragDelta = x - dragStartX;
    track.style.transform = "translateX(" + (baseX + dragDelta) + "px)";
  }

  function onDragEnd() {
    if (!isDragging) return;
    isDragging = false;
    track.style.cursor = "grab";

    const velocity = dragDelta / Math.max(1, Date.now() - dragStartT);

    if (dragDelta < -40 || velocity < -0.3) goNext();
    else if (dragDelta > 40 || velocity > 0.3) goPrev();
    else setPos(xFor(current), true);
  }

  track.addEventListener(
    "touchstart",
    function (e) {
      onDragStart(e.touches[0].clientX);
    },
    { passive: true },
  );
  track.addEventListener(
    "touchmove",
    function (e) {
      onDragMove(e.touches[0].clientX);
    },
    { passive: true },
  );
  track.addEventListener("touchend", onDragEnd);
  track.addEventListener("mousedown", function (e) {
    onDragStart(e.clientX);
  });
  window.addEventListener("mousemove", function (e) {
    onDragMove(e.clientX);
  });
  window.addEventListener("mouseup", onDragEnd);

  track.addEventListener("click", function (e) {
    if (Math.abs(dragDelta) > 8) e.stopPropagation();
  });

  // Bookmark
  track.addEventListener("click", function (e) {
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
    btn.blur();
  });

  // Resize
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      jumpTo(current);
    }, 120);
  });

  // Init
  jumpTo(N);
});
