// Navigation Logic
const navItems = document.querySelectorAll(".nav-item:not(.explorer-nav)");
const pages = document.querySelectorAll(".page-content");
const explorerNavBtn = document.getElementById("explorerNavBtn");
const explorerOverlay = document.getElementById("explorerOverlay");
const explorerClose = document.getElementById("explorerClose");

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
  explorerOverlay.classList.add("active");
});

explorerClose.addEventListener("click", () => {
  explorerOverlay.classList.remove("active");
  explorerNavBtn.classList.remove("active");
});

explorerOverlay.addEventListener("click", (e) => {
  if (e.target === explorerOverlay) {
    explorerOverlay.classList.remove("active");
    explorerNavBtn.classList.remove("active");
  }
});

// Profile Modal Logic
const editModal = document.getElementById("editModal");
const editProfileBtn = document.querySelector(".edit-profile-btn-main");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () =>
    editModal.classList.add("active"),
  );
}
if (closeModal) {
  closeModal.addEventListener("click", () =>
    editModal.classList.remove("active"),
  );
}
if (cancelBtn) {
  cancelBtn.addEventListener("click", () =>
    editModal.classList.remove("active"),
  );
}
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    // Get values from form
    const name = document.getElementById("editName").value;
    const username = document.getElementById("editUsername").value;
    const bio = document.getElementById("editBio").value;

    // Update profile display
    document.querySelector(".profile-name-main").textContent = name;
    document.querySelector(".profile-username").textContent = username;
    document.querySelector(".profile-bio").textContent = bio;

    // Show success message
    alert("Profile updated successfully!");
    editModal.classList.remove("active");
  });
}

// Close modal when clicking outside
if (editModal) {
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) {
      editModal.classList.remove("active");
    }
  });
}

// Follow Button Logic
const followBtn = document.getElementById("followBtn");
const messageBtn = document.querySelector(".message-btn");
let isFollowing = false;
let isFollower = false; // Does this person follow you back?

if (followBtn) {
  followBtn.addEventListener("click", () => {
    isFollowing = !isFollowing;
    followBtn.innerHTML = isFollowing
      ? '<i class="bx bx-check"></i> Following'
      : '<i class="bx bx-plus"></i> Follow';
    followBtn.style.background = isFollowing ? "#2a2a2a" : "#a78bfa";

    // Update message button state
    updateMessageButton();
  });
}

// Function to update message button availability
function updateMessageButton() {
  if (messageBtn) {
    // Can only message if both follow each other (mutual follow)
    const canMessage = isFollowing && isFollower;

    if (canMessage) {
      messageBtn.disabled = false;
      messageBtn.style.opacity = "1";
      messageBtn.style.cursor = "pointer";
      messageBtn.title = "";
    } else {
      messageBtn.disabled = true;
      messageBtn.style.opacity = "0.5";
      messageBtn.style.cursor = "not-allowed";

      if (!isFollowing) {
        messageBtn.title = "You need to follow this person to message them";
      } else if (!isFollower) {
        messageBtn.title =
          "This person needs to follow you back before you can message them";
      }
    }
  }
}

// Message button click handler
if (messageBtn) {
  messageBtn.addEventListener("click", (e) => {
    if (messageBtn.disabled) {
      e.preventDefault();

      if (!isFollowing) {
        alert("You need to follow this person first before sending a message.");
      } else if (!isFollower) {
        alert(
          "You can only message people who follow you back. Wait for them to follow you!",
        );
      }
    } else {
      // Open direct chat with this person
      openDirectChat("Prabhat Behera", "PB");
    }
  });

  // Initial state - disabled until mutual follow
  updateMessageButton();
}

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

// Demo: Simulate the other person following you back after 3 seconds of you following them
// (Remove this in production - this is just for testing)
if (followBtn) {
  followBtn.addEventListener("click", () => {
    if (isFollowing && !isFollower) {
      // Simulate them following back after 3 seconds
      setTimeout(() => {
        isFollower = true;
        updateMessageButton();

        // Show notification
        const notification = document.createElement("div");
        notification.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          background: #1a1a1a;
          border: 1px solid #a78bfa;
          padding: 15px 20px;
          border-radius: 12px;
          color: white;
          z-index: 1001;
          animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <i class="bx bx-check-circle" style="color: #10b981; font-size: 24px;"></i>
            <div>
              <strong>They followed you back!</strong>
              <p style="font-size: 12px; color: #aaa; margin-top: 3px;">You can now send messages</p>
            </div>
          </div>
        `;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
          notification.style.animation = "slideOutRight 0.3s ease";
          setTimeout(() => notification.remove(), 300);
        }, 3000);
      }, 3000);
    }
  });
}

// Demo View Toggle (From your original code)
const appLogo = document.querySelector(".app-logo");
const toggleViewBtn = document.createElement("button");
toggleViewBtn.textContent = "View as Others";
toggleViewBtn.style.cssText =
  "padding: 5px 10px; background: #a78bfa; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 10px; margin-left: 10px;";

let viewingOwnProfile = true;
toggleViewBtn.addEventListener("click", () => {
  viewingOwnProfile = !viewingOwnProfile;
  const ownButtons = document.querySelector(".own-profile");
  const otherButtons = document.querySelector(".other-profile");
  ownButtons.style.display = viewingOwnProfile ? "flex" : "none";
  otherButtons.style.display = viewingOwnProfile ? "none" : "flex";
  toggleViewBtn.textContent = viewingOwnProfile
    ? "View as Others"
    : "View as Me";
});
appLogo.appendChild(toggleViewBtn);

// Share Profile Button Handler
const shareProfileBtn = document.querySelector(".share-profile-btn");
if (shareProfileBtn) {
  shareProfileBtn.addEventListener("click", () => {
    showShareModal();
  });
}

// Function to show share modal
function showShareModal() {
  const shareModal = document.createElement("div");
  shareModal.className = "share-modal-overlay";
  shareModal.innerHTML = `
    <div class="share-modal">
      <div class="share-modal-header">
        <h3>Share Profile</h3>
        <i class="bx bx-x close-share-modal"></i>
      </div>
      
      <div class="share-options">
        <div class="share-option" data-type="copy">
          <div class="share-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
            <i class="bx bx-link"></i>
          </div>
          <span>Copy Link</span>
        </div>
        
        <div class="share-option" data-type="whatsapp">
          <div class="share-icon" style="background: #25D366;">
            <i class="bx bxl-whatsapp"></i>
          </div>
          <span>WhatsApp</span>
        </div>
        
        <div class="share-option" data-type="facebook">
          <div class="share-icon" style="background: #1877F2;">
            <i class="bx bxl-facebook"></i>
          </div>
          <span>Facebook</span>
        </div>
        
        <div class="share-option" data-type="twitter">
          <div class="share-icon" style="background: #1DA1F2;">
            <i class="bx bxl-twitter"></i>
          </div>
          <span>Twitter</span>
        </div>
        
        <div class="share-option" data-type="linkedin">
          <div class="share-icon" style="background: #0A66C2;">
            <i class="bx bxl-linkedin"></i>
          </div>
          <span>LinkedIn</span>
        </div>
        
        <div class="share-option" data-type="email">
          <div class="share-icon" style="background: #EA4335;">
            <i class="bx bx-envelope"></i>
          </div>
          <span>Email</span>
        </div>
      </div>
      
      <div class="share-link-container">
        <input type="text" class="share-link-input" value="https://stuvo.app/profile/Prabhat4a" readonly />
        <button class="copy-link-btn">
          <i class="bx bx-copy"></i>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(shareModal);
  setTimeout(() => shareModal.classList.add("active"), 10);

  // Handle close
  const closeBtn = shareModal.querySelector(".close-share-modal");
  closeBtn.addEventListener("click", () => {
    shareModal.classList.remove("active");
    setTimeout(() => shareModal.remove(), 300);
  });

  // Handle clicking outside
  shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) {
      shareModal.classList.remove("active");
      setTimeout(() => shareModal.remove(), 300);
    }
  });

  // Handle share options
  const shareOptions = shareModal.querySelectorAll(".share-option");
  shareOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const type = option.getAttribute("data-type");
      handleShare(type);
    });
  });

  // Handle copy button
  const copyBtn = shareModal.querySelector(".copy-link-btn");
  const linkInput = shareModal.querySelector(".share-link-input");
  copyBtn.addEventListener("click", () => {
    linkInput.select();
    document.execCommand("copy");

    copyBtn.innerHTML = '<i class="bx bx-check"></i>';
    copyBtn.style.background = "#10b981";

    setTimeout(() => {
      copyBtn.innerHTML = '<i class="bx bx-copy"></i>';
      copyBtn.style.background = "";
    }, 2000);

    showToast("Profile link copied to clipboard!");
  });
}

// Function to handle different share types
function handleShare(type) {
  const profileUrl = "https://stuvo.app/profile/Prabhat4a";
  const profileName = "Prabhat Behera";
  const message = `Check out ${profileName}'s profile on STUVO!`;

  switch (type) {
    case "copy":
      navigator.clipboard.writeText(profileUrl);
      showToast("Profile link copied to clipboard!");
      break;

    case "whatsapp":
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message + " " + profileUrl)}`,
        "_blank",
      );
      break;

    case "facebook":
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
        "_blank",
      );
      break;

    case "twitter":
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(profileUrl)}`,
        "_blank",
      );
      break;

    case "linkedin":
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
        "_blank",
      );
      break;

    case "email":
      window.location.href = `mailto:?subject=${encodeURIComponent("Check out this STUVO profile")}&body=${encodeURIComponent(message + "\n\n" + profileUrl)}`;
      break;
  }
}

// Function to show toast notification
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerHTML = `
    <i class="bx bx-check-circle"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("active"), 10);

  setTimeout(() => {
    toast.classList.remove("active");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

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

/* js part for academic details added by aryan*/

// Data Mapping for Semesters
const academicData = {
  1: {
    gpa: "GPA 8.0",
    status: "Completed",
    subjects: [
      { name: "Mathematics I", grade: "A", type: "grade-a" },
      { name: "Engineering Physics", grade: "B+", type: "grade-b" },
    ],
  },
  6: {
    gpa: "CGPA 8.5",
    status: "Active - Semester 6",
    subjects: [
      { name: "Data Structures", grade: "A", type: "grade-a" },
      { name: "Database Management", grade: "A+", type: "grade-a" },
      { name: "Operating Systems", grade: "B+", type: "grade-b" },
      { name: "Web Development", grade: "A+", type: "grade-a" },
    ],
  },
  // Add other semesters as needed
};

const combo = document.getElementById("semester-select");
const subjectList = document.getElementById("subjects-container");
const gpaBadge = document.getElementById("gpa-badge");
const statusText = document.getElementById("current-sem-text");

function updateUI(sem) {
  const data = academicData[sem] || {
    gpa: "N/A",
    status: "No Data",
    subjects: [],
  };

  // Update GPA and Status labels
  gpaBadge.textContent = data.gpa;
  statusText.textContent = data.status;

  // Clear and build subject list
  subjectList.innerHTML = "";
  if (data.subjects.length === 0) {
    subjectList.innerHTML = `<p style="color:#666; text-align:center;">No data for Sem ${sem}</p>`;
  } else {
    data.subjects.forEach((sub) => {
      const html = `
                <div class="subject-item">
                    <span class="subject-name">${sub.name}</span>
                    <span class="subject-grade ${sub.type}">${sub.grade}</span>
                </div>`;
      subjectList.insertAdjacentHTML("beforeend", html);
    });
  }
}

// Event listener for the Combo-box change
combo.addEventListener("change", (e) => {
  updateUI(e.target.value);
});

// Initial load (default sem 6)
updateUI(6);

// HOME TOP SLIDER LOGIC
const homeSlides = document.querySelectorAll(".home-slide");
const dots = document.querySelectorAll(".dot");
let homeIndex = 0;

// Auto-advance slider every 3.5 seconds
setInterval(() => {
  changeSlide(1);
}, 3500);

// UNIFIED changeSlide function (handles auto-advance, arrows, swipe, and dots)
function changeSlide(direction) {
  homeSlides[homeIndex].classList.remove("active");
  dots[homeIndex].classList.remove("active");

  homeIndex = (homeIndex + direction + homeSlides.length) % homeSlides.length;

  homeSlides[homeIndex].classList.add("active");
  dots[homeIndex].classList.add("active");
}

// HOME SLIDER SWIPE SUPPORT
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
  const threshold = 50; // minimum swipe distance

  if (startX - endX > threshold) {
    // swipe left → next
    changeSlide(1);
  } else if (endX - startX > threshold) {
    // swipe right → previous
    changeSlide(-1);
  }
}

// DESKTOP ARROW CONTROLS
const prevBtn = document.querySelector(".slider-arrow.left");
const nextBtn = document.querySelector(".slider-arrow.right");

if (prevBtn && nextBtn) {
  prevBtn.addEventListener("click", () => changeSlide(-1));
  nextBtn.addEventListener("click", () => changeSlide(1));
}

// DOT CLICK NAVIGATION
dots.forEach((dot, index) => {
  dot.addEventListener("click", () => {
    homeSlides[homeIndex].classList.remove("active");
    dots[homeIndex].classList.remove("active");

    homeIndex = index;

    homeSlides[homeIndex].classList.add("active");
    dots[homeIndex].classList.add("active");
  });
});
