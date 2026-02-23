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

  // ===== HOME SLIDER LOGIC =====
  const homeSlides = document.querySelectorAll(".home-slide");
  const dots = document.querySelectorAll(".dot");
  let homeIndex = 0;

  // Auto-advance slider every 3.5 seconds
  setInterval(() => {
    changeSlide(1);
  }, 3500);

  function changeSlide(direction) {
    homeSlides[homeIndex].classList.remove("active");
    dots[homeIndex].classList.remove("active");
    homeIndex = (homeIndex + direction + homeSlides.length) % homeSlides.length;
    homeSlides[homeIndex].classList.add("active");
    dots[homeIndex].classList.add("active");
  }

  // Touch swipe support
  const slider = document.querySelector(".home-slider");
  let startX = 0;
  let endX = 0;

  if (slider) {
    slider.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    slider.addEventListener("touchend", (e) => {
      endX = e.changedTouches[0].clientX;
      handleSwipe();
    });
  }

  function handleSwipe() {
    const threshold = 50;
    if (startX - endX > threshold) {
      changeSlide(1);
    } else if (endX - startX > threshold) {
      changeSlide(-1);
    }
  }

  // Desktop arrow controls
  const prevBtn = document.querySelector(".slider-arrow.left");
  const nextBtn = document.querySelector(".slider-arrow.right");

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener("click", () => changeSlide(-1));
    nextBtn.addEventListener("click", () => changeSlide(1));
  }

  // Dot click navigation
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      homeSlides[homeIndex].classList.remove("active");
      dots[homeIndex].classList.remove("active");
      homeIndex = index;
      homeSlides[homeIndex].classList.add("active");
      dots[homeIndex].classList.add("active");
    });
  });

  // ===== NAVIGATION =====
  const navItems = document.querySelectorAll(".nav-item:not(.explorer-nav)");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetPage = item.getAttribute("data-page");
      // Navigation logic here - redirect to respective pages
      console.log("Navigate to:", targetPage);
      // window.location.href = targetPage + '.html';
    });
  });
});
