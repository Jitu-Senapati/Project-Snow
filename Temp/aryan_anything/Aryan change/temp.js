// Navigation Logic
const navItems = document.querySelectorAll(".nav-item:not(.explorer-nav)");
const pages = document.querySelectorAll(".page-content");
const explorerNavBtn = document.getElementById("explorerNavBtn");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const targetPage = item.getAttribute("data-page");
    navItems.forEach((nav) => nav.classList.remove("active"));
    explorerNavBtn.classList.remove("active");
    item.classList.add("active");
    pages.forEach((page) => page.classList.remove("active"));
    document.getElementById(targetPage).classList.add("active");
  });
});

// Explorer opens as bottom sheet over current page
explorerNavBtn.addEventListener("click", () => {
  explorerNavBtn.classList.add("active");
});

document.addEventListener("DOMContentLoaded", function () {
  // ===== ELEMENTS =====
  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");

  const notificationToggle = document.getElementById("notificationToggle");
  const notificationPanel = document.getElementById("notificationPanel");

  // ===== MENU TOGGLE =====
  if (menuToggle && menuPanel) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();

      // close notification if open
      if (notificationPanel) {
        notificationPanel.classList.remove("active");
      }

      menuPanel.classList.toggle("active");
    });
  }

  // ===== NOTIFICATION TOGGLE =====
  if (notificationToggle && notificationPanel) {
    notificationToggle.addEventListener("click", function (e) {
      e.stopPropagation();

      // close menu if open
      if (menuPanel) {
        menuPanel.classList.remove("active");
      }

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
});

// Function to open direct chat
function openDirectChat(name, initials) {
  // Switch to chat page
  const chatNav = document.querySelector('[data-page="chatPage"]');
  if (chatNav) {
    chatNav.click();
  }

  // Small delay to let page switch, then open chat
  setTimeout(() => {
    openChatWindow(name, initials);
  }, 100);
}

// Function to open chat window
function openChatWindow(name, initials) {
  // Create chat window overlay
  const chatWindow = document.createElement("div");
  chatWindow.className = "chat-window-overlay";
  chatWindow.innerHTML = `
    <div class="chat-window">
      <div class="chat-window-header">
        <div class="chat-header-left">
          <i class="bx bx-arrow-back back-to-chats"></i>
          <div class="chat-avatar-header">${initials}</div>
          <div class="chat-header-info">
            <div class="chat-header-name">${name}</div>
            <div class="chat-header-status">Online</div>
          </div>
        </div>
        <div class="chat-header-actions">
          <i class="bx bx-phone"></i>
          <i class="bx bx-video"></i>
          <i class="bx bx-dots-vertical-rounded"></i>
        </div>
      </div>
      
      <div class="chat-messages-container">
        <div class="chat-date-divider">Today</div>
        
        <div class="chat-bubble received">
          <div class="bubble-content">Hey! How's it going?</div>
          <div class="bubble-time">10:30 AM</div>
        </div>
        
        <div class="chat-bubble sent">
          <div class="bubble-content">Hi! I'm doing great, thanks! How about you?</div>
          <div class="bubble-time">10:32 AM</div>
        </div>
        
        <div class="chat-bubble received">
          <div class="bubble-content">Pretty good! Working on a project right now.</div>
          <div class="bubble-time">10:33 AM</div>
        </div>
      </div>
      
      <div class="chat-input-container">
        <i class="bx bx-plus-circle"></i>
        <input type="text" class="chat-input" placeholder="Type a message..." />
        <i class="bx bx-image-alt"></i>
        <i class="bx bx-send send-message"></i>
      </div>
    </div>
  `;

  document.body.appendChild(chatWindow);

  // Animate in
  setTimeout(() => chatWindow.classList.add("active"), 10);

  // Handle back button
  const backBtn = chatWindow.querySelector(".back-to-chats");
  backBtn.addEventListener("click", () => {
    chatWindow.classList.remove("active");
    setTimeout(() => chatWindow.remove(), 300);
  });

  // Handle send message
  const sendBtn = chatWindow.querySelector(".send-message");
  const chatInput = chatWindow.querySelector(".chat-input");
  const messagesContainer = chatWindow.querySelector(
    ".chat-messages-container",
  );

  function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      const bubble = document.createElement("div");
      bubble.className = "chat-bubble sent";
      bubble.innerHTML = `
        <div class="bubble-content">${message}</div>
        <div class="bubble-time">${time}</div>
      `;

      messagesContainer.appendChild(bubble);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      chatInput.value = "";
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}
