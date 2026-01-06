const creatAcc = document.querySelector(".creat-acc");
const loginAcc = document.querySelector(".Login-acc");
const loginForm = document.querySelector(".objects");
const registerForm = document.querySelector(".objects-register");

creatAcc.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.style.display = "none";
  registerForm.style.display = "block";
});

loginAcc.addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.style.display = "none";
  loginForm.style.display = "block";
});

const loginBtn = document.getElementById("loginBtn");
const authSection = document.getElementById("authSection");
const mainApp = document.getElementById("mainApp");

loginBtn.addEventListener("click", () => {
  authSection.style.display = "none";
  mainApp.style.display = "block";
});

const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page-content");

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    const targetPage = item.getAttribute("data-page");

    navItems.forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");

    pages.forEach((page) => page.classList.remove("active"));
    document.getElementById(targetPage).classList.add("active");
  });
});

const googleLoginButtons = document.querySelectorAll(".google-login");
googleLoginButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    alert(
      "Google Sign-In placeholder.\nImplement Google OAuth for real login."
    );
  });
});

// Follow button toggle
const followBtn = document.getElementById("followBtn");
let isFollowing = false;

if (followBtn) {
  followBtn.addEventListener("click", () => {
    isFollowing = !isFollowing;

    if (isFollowing) {
      followBtn.innerHTML = '<i class="bx bx-check"></i> Following';
      followBtn.style.background = "#2a2a2a";
      followBtn.style.border = "1px solid #444";
    } else {
      followBtn.innerHTML = '<i class="bx bx-plus"></i> Follow';
      followBtn.style.background = "#a78bfa";
      followBtn.style.border = "none";
    }
  });
}

// Edit Profile Modal
const editModal = document.getElementById("editModal");
const editProfileBtn = document.querySelector(".edit-profile-btn-main");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () => {
    editModal.classList.add("active");
  });
}

if (closeModal) {
  closeModal.addEventListener("click", () => {
    editModal.classList.remove("active");
  });
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", () => {
    editModal.classList.remove("active");
  });
}

if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    // Here you would save the profile data
    alert("Profile updated successfully!");
    editModal.classList.remove("active");
  });
}

// Close modal when clicking outside
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) {
    editModal.classList.remove("active");
  }
});

// Chat functionality
const chatItems = document.querySelectorAll(".chat-item");
const chatListView = document.querySelector(".chat-list-view");
const chatWindowView = document.querySelector(".chat-window-view");
const backToChats = document.querySelector(".back-to-chats");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const chatNameHeader = document.getElementById("chatNameHeader");
const chatAvatarHeader = document.getElementById("chatAvatarHeader");

// Check if chat elements exist
if (
  !chatItems ||
  !chatListView ||
  !chatWindowView ||
  !backToChats ||
  !chatMessages ||
  !chatInput ||
  !sendBtn
) {
  console.log("Chat elements not found");
}

// Sample chat data
const chatData = {
  amit: {
    name: "Amit Kumar",
    avatar: "AK",
    messages: [
      { type: "received", text: "Hey! How are you?", time: "10:30 AM" },
      {
        type: "sent",
        text: "I'm good! What about you?",
        time: "10:32 AM",
      },
      {
        type: "received",
        text: "Great! Are you coming to the lab today?",
        time: "10:35 AM",
      },
      {
        type: "sent",
        text: "Yes, I'll be there around 2 PM",
        time: "10:36 AM",
      },
      {
        type: "received",
        text: "Hey, are you coming to the lab?",
        time: "Just now",
      },
    ],
  },
  priya: {
    name: "Priya Sharma",
    avatar: "PS",
    messages: [
      {
        type: "received",
        text: "Hi! Do you have the DSA notes?",
        time: "9:15 AM",
      },
      {
        type: "sent",
        text: "Yes, I'll send them to you",
        time: "9:20 AM",
      },
      {
        type: "received",
        text: "Can you share the notes?",
        time: "15 min ago",
      },
    ],
  },
  rahul: {
    name: "Rahul Verma",
    avatar: "RV",
    messages: [
      {
        type: "sent",
        text: "Here's the assignment solution",
        time: "Yesterday",
      },
      {
        type: "received",
        text: "Thanks for the help!",
        time: "1 hour ago",
      },
    ],
  },
  group: {
    name: "Study Group",
    avatar: "SG",
    messages: [
      {
        type: "received",
        text: "Meeting at 5 PM today",
        time: "3 hours ago",
      },
      { type: "sent", text: "I'll be there!", time: "3 hours ago" },
    ],
  },
};

// Open chat window
chatItems.forEach((item) => {
  item.addEventListener("click", () => {
    const chatId = item.getAttribute("data-chat");
    const chat = chatData[chatId];

    // Update header
    if (chatNameHeader) chatNameHeader.textContent = chat.name;
    if (chatAvatarHeader) chatAvatarHeader.textContent = chat.avatar;

    // Load messages
    if (chatMessages) {
      chatMessages.innerHTML = "";
      chat.messages.forEach((msg) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `message ${msg.type}`;
        messageDiv.innerHTML = `
                            <div class="message-avatar">${
                              msg.type === "sent" ? "PB" : chat.avatar
                            }</div>
                            <div class="message-content">
                                <div class="message-bubble">${msg.text}</div>
                                <div class="message-time">${msg.time}</div>
                            </div>
                        `;
        chatMessages.appendChild(messageDiv);
      });

      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show chat window
    if (chatListView) chatListView.style.display = "none";
    if (chatWindowView) chatWindowView.style.display = "flex";
  });
});

// Back to chat list
if (backToChats) {
  backToChats.addEventListener("click", () => {
    if (chatWindowView) chatWindowView.style.display = "none";
    if (chatListView) chatListView.style.display = "block";
  });
}

// Send message
function sendMessage() {
  if (!chatInput || !chatMessages) return;

  const text = chatInput.value.trim();
  if (text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message sent";
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    messageDiv.innerHTML = `
                    <div class="message-avatar">PB</div>
                    <div class="message-content">
                        <div class="message-bubble">${text}</div>
                        <div class="message-time">${time}</div>
                    </div>
                `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatInput.value = "";
  }
}

if (sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
}

if (chatInput) {
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

// Demo: Toggle between own profile and other's profile
// You can add a button to test this
const header = document.querySelector(".app-header");
const toggleViewBtn = document.createElement("button");
toggleViewBtn.textContent = "Switch View";
toggleViewBtn.style.cssText =
  "padding: 5px 10px; background: #a78bfa; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 12px; margin-left: 10px;";

let viewingOwnProfile = true;
toggleViewBtn.addEventListener("click", () => {
  viewingOwnProfile = !viewingOwnProfile;
  const ownButtons = document.querySelector(".own-profile");
  const otherButtons = document.querySelector(".other-profile");

  if (viewingOwnProfile) {
    ownButtons.style.display = "flex";
    otherButtons.style.display = "none";
    toggleViewBtn.textContent = "View as Others";
  } else {
    ownButtons.style.display = "none";
    otherButtons.style.display = "flex";
    toggleViewBtn.textContent = "View as Me";
  }
});

document.querySelector(".app-logo").appendChild(toggleViewBtn);
