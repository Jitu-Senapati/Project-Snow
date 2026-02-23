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

  // ===== NAVIGATION =====
  const navItems = document.querySelectorAll(".nav-item:not(.explorer-nav)");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetPage = item.getAttribute("data-page");
      console.log("Navigate to:", targetPage);
      // window.location.href = targetPage + '.html';
    });
  });
});
