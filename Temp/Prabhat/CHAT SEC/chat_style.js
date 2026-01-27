// Sample message data for each user
const messageData = {
  1: [
    {
      type: "received",
      text: "Hey, are you coming to the lab?",
      time: "10:30 AM",
    },
    {
      type: "sent",
      text: "Yes, I will be there in 15 minutes",
      time: "10:32 AM",
    },
    {
      type: "received",
      text: "Great! I will wait for you",
      time: "10:33 AM",
    },
  ],
  2: [
    {
      type: "received",
      text: "Can you share the notes?",
      time: "9:45 AM",
    },
    {
      type: "sent",
      text: "Sure, I will send them right away",
      time: "9:50 AM",
    },
    { type: "sent", text: "Check your email", time: "9:51 AM" },
    { type: "received", text: "Got it, thanks!", time: "9:52 AM" },
  ],
  3: [
    { type: "received", text: "Thanks for the help!", time: "8:20 AM" },
    { type: "sent", text: "No problem, happy to help!", time: "8:25 AM" },
    {
      type: "received",
      text: "Let me know if you need anything",
      time: "8:26 AM",
    },
  ],
};

// Blocked users storage
let blockedUsers = JSON.parse(localStorage.getItem("blockedUsers")) || {};

let currentUserId = null;
let currentUserInitials = null;

// Elements
const contactsView = document.getElementById("contactsView");
const chatView = document.getElementById("chatView");
const chatList = document.getElementById("chatList");
const backButton = document.getElementById("backButton");
const chatHeaderName = document.getElementById("chatHeaderName");
const chatHeaderAvatar = document.getElementById("chatHeaderAvatar");
const messagesContainer = document.getElementById("messagesContainer");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const searchInput = document.getElementById("chatSearchInput");
const menuButton = document.getElementById("menuButton");
const menuDropdown = document.getElementById("menuDropdown");
const searchInChatBtn = document.getElementById("searchInChatBtn");
const blockUserBtn = document.getElementById("blockUserBtn");
const chatSearchBar = document.getElementById("chatSearchBar");
const chatMessageSearch = document.getElementById("chatMessageSearch");
const closeSearchBtn = document.getElementById("closeSearchBtn");
const messageInputContainer = document.getElementById("messageInputContainer");
const blockedOverlay = document.getElementById("blockedOverlay");
const unblockButton = document.getElementById("unblockButton");
const emojiBtn = document.querySelector(".bx-smile");
const emojiPanel = document.getElementById("emojiPanel");

chatList.addEventListener("click", (e) => {
  const chatItem = e.target.closest(".chat-item");
  if (chatItem) {
    currentUserId = chatItem.dataset.userId;
    currentUserInitials = chatItem.dataset.userInitials;
    const userName = chatItem.dataset.userName;

    openChat(userName, currentUserInitials, currentUserId);
  }
});

function openChat(userName, initials, userId) {
  chatHeaderName.textContent = userName;
  chatHeaderAvatar.textContent = initials;

  // Load messages
  loadMessages(userId);

  // Check if user is blocked
  updateBlockedState();

  // Switch views
  contactsView.classList.add("hidden");
  chatView.classList.add("active");

  // Close menu if open
  menuDropdown.classList.remove("active");
}

function loadMessages(userId) {
  messagesContainer.innerHTML = "";
  const messages = messageData[userId] || [];

  messages.forEach((msg) => {
    addMessage(msg.text, msg.type, msg.time);
  });

  // Scroll to bottom
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addMessage(text, type, time) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  let avatarHTML = "";
  if (type === "received") {
    avatarHTML = `<div class="message-avatar">${currentUserInitials}</div>`;
  }

  messageDiv.innerHTML = `
    ${avatarHTML}
    <div class="message-content">
      <div class="message-bubble">${text}</div>
      <div class="message-time">${time}</div>
    </div>
  `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Back button
backButton.addEventListener("click", () => {
  chatView.classList.remove("active");
  contactsView.classList.remove("hidden");
  messageInput.value = "";
  chatSearchBar.classList.remove("active");
  chatMessageSearch.value = "";
  menuDropdown.classList.remove("active");
  clearMessageHighlights();
});

// Send message
function sendMessage() {
  const text = messageInput.value.trim();
  if (text && !blockedUsers[currentUserId]) {
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    addMessage(text, "sent", time);
    messageInput.value = "";

    // Store message
    if (!messageData[currentUserId]) {
      messageData[currentUserId] = [];
    }
    messageData[currentUserId].push({ type: "sent", text, time });
  }
}

sendButton.addEventListener("click", sendMessage);

// Emoji button click (STEP 2)
emojiBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // 🔥 important

  // if user is blocked, do nothing
  if (blockedOverlay.classList.contains("active")) {
    return;
  }

  // open / close emoji panel
  emojiPanel.classList.toggle("active");
});

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

emojiPanel.addEventListener("click", (e) => {
  if (!e.target.matches("span")) return;

  // insert emoji at cursor position
  messageInput.value += e.target.textContent;
  messageInput.focus();
});

// Contact search functionality
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const chatItems = chatList.querySelectorAll(".chat-item");

  chatItems.forEach((item) => {
    const name = item.querySelector(".chat-name").textContent.toLowerCase();
    if (name.includes(searchTerm)) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
});

// Menu dropdown toggle
menuButton.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle("active");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
    menuDropdown.classList.remove("active");
  }
});

// Search in chat functionality
searchInChatBtn.addEventListener("click", () => {
  chatSearchBar.classList.add("active");
  menuDropdown.classList.remove("active");
  chatMessageSearch.focus();
});

closeSearchBtn.addEventListener("click", () => {
  chatSearchBar.classList.remove("active");
  chatMessageSearch.value = "";
  clearMessageHighlights();
});

// Message search functionality
chatMessageSearch.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const messages = messagesContainer.querySelectorAll(".message");

  clearMessageHighlights();

  if (searchTerm) {
    messages.forEach((message) => {
      const bubble = message.querySelector(".message-bubble");
      const text = bubble.textContent.toLowerCase();

      if (text.includes(searchTerm)) {
        message.classList.add("highlight");
        message.classList.remove("hidden");
      } else {
        message.classList.add("hidden");
      }
    });

    // Scroll to first match
    const firstMatch = messagesContainer.querySelector(".message.highlight");
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } else {
    messages.forEach((message) => {
      message.classList.remove("hidden");
    });
  }
});

function clearMessageHighlights() {
  const messages = messagesContainer.querySelectorAll(".message");
  messages.forEach((message) => {
    message.classList.remove("highlight", "hidden");
  });
}

// Block user functionality
blockUserBtn.addEventListener("click", () => {
  if (!blockedUsers[currentUserId]) {
    blockedUsers[currentUserId] = true;

    // ✅ save to localStorage
    localStorage.setItem("blockedUsers", JSON.stringify(blockedUsers));

    updateBlockedState();
    updateChatList();
    menuDropdown.classList.remove("active");
  }
});

// Unblock user functionality
unblockButton.addEventListener("click", () => {
  delete blockedUsers[currentUserId];

  // ✅ update localStorage
  localStorage.setItem("blockedUsers", JSON.stringify(blockedUsers));

  updateBlockedState();
  updateChatList();
});

function updateBlockedState() {
  if (blockedUsers[currentUserId]) {
    blockedOverlay.classList.add("active");
    messageInputContainer.classList.add("disabled");
    blockUserBtn.innerHTML = `
      <i class='bx bx-check'></i>
      <span>User blocked</span>
    `;
  } else {
    blockedOverlay.classList.remove("active");
    messageInputContainer.classList.remove("disabled");
    blockUserBtn.innerHTML = `
      <i class='bx bx-block'></i>
      <span>Block user</span>
    `;
  }
}

function updateChatList() {
  const chatItems = chatList.querySelectorAll(".chat-item");
  chatItems.forEach((item) => {
    const userId = item.dataset.userId;
    if (blockedUsers[userId]) {
      item.classList.add("blocked");
    } else {
      item.classList.remove("blocked");
    }
  });
}

document.addEventListener("click", (e) => {
  if (!emojiPanel.contains(e.target) && !emojiBtn.contains(e.target)) {
    emojiPanel.classList.remove("active");
  }
});
// Restore blocked users on page load
updateChatList();
