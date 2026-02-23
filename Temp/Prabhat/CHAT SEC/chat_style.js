// ===============================
// CHAT SECTION JAVASCRIPT
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  // ===== HEADER DROPDOWNS =====
  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");
  const notificationToggle = document.getElementById("notificationToggle");
  const notificationPanel = document.getElementById("notificationPanel");

  // Menu Toggle
  if (menuToggle && menuPanel) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      // Close notification if open
      if (notificationPanel) {
        notificationPanel.classList.remove("active");
      }
      menuPanel.classList.toggle("active");
    });
  }

  // Notification Toggle
  if (notificationToggle && notificationPanel) {
    notificationToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      // Close menu if open
      if (menuPanel) {
        menuPanel.classList.remove("active");
      }
      notificationPanel.classList.toggle("active");
    });
  }

  // Click Outside to Close
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

  // ===== CHAT LIST CLICK HANDLERS =====
  const chatItems = document.querySelectorAll(".chat-item");
  chatItems.forEach((item) => {
    item.addEventListener("click", function () {
      const name = this.getAttribute("data-name");
      const initials = this.getAttribute("data-initials");
      openChatWindow(name, initials);
    });
  });

  // ===== NAVIGATION (Visual Only) =====
  const navItems = document.querySelectorAll(".nav-item:not(.explorer-nav)");
  navItems.forEach((item) => {
    item.addEventListener("click", function () {
      navItems.forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");

      const targetPage = this.getAttribute("data-page");
      console.log("Navigate to:", targetPage);
    });
  });

  // Explorer Nav (Visual Only)
  const explorerNavBtn = document.getElementById("explorerNavBtn");
  if (explorerNavBtn) {
    explorerNavBtn.addEventListener("click", function () {
      this.classList.toggle("active");
      console.log("Open Explorer");
    });
  }
});

// ===============================
// CHAT WINDOW FUNCTIONS
// ===============================

function openChatWindow(name, initials) {
  // Remove existing chat window if any
  const existingChat = document.querySelector(".chat-window-overlay");
  if (existingChat) {
    existingChat.remove();
  }

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
                <input type="text" class="chat-input" placeholder="Type a message..." />
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
                <div class="bubble-content">${escapeHtml(message)}</div>
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

  // Focus input
  chatInput.focus();
}

/**
 * Utility function to escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ===============================
// OPTIONAL: Message Restriction Logic
// ===============================

let isFollowing = false;
let isFollower = false;

function checkMessagePermission() {
  const canMessage = isFollowing && isFollower;
  if (!canMessage) {
    if (!isFollowing) {
      alert("You need to follow this person first before sending a message.");
      return false;
    } else if (!isFollower) {
      alert(
        "You can only message people who follow you back. Wait for them to follow you!",
      );
      return false;
    }
  }
  return true;
}

function setFollowState(following, follower) {
  isFollowing = following;
  isFollower = follower;
}
