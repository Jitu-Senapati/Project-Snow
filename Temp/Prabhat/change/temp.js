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

let replyData = null;
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
const clearChatBtn = document.getElementById("clearChatBtn");

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
  loadMessages(userId);
  updateBlockedState();
  contactsView.classList.add("hidden");
  chatView.classList.add("active");
  menuDropdown.classList.remove("active");
}

function loadMessages(userId) {
  messagesContainer.innerHTML = "";
  const messages = messageData[userId] || [];
  messages.forEach((msg) => {
    addMessage(msg.text, msg.type, msg.time, msg.reply || null);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ✅ FIXED addMessage - now includes full HTML with reply
function addMessage(text, type, time, reply = null) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  let avatarHTML = "";
  if (type === "received") {
    avatarHTML = `<div class="message-avatar">${currentUserInitials}</div>`;
  }

  let replyHTML = "";
  if (reply) {
    replyHTML = `
      <div class="reply-quote">
        <span class="reply-user">${reply.user}</span>
        <span class="reply-text">${reply.text}</span>
      </div>
    `;
  }

  messageDiv.innerHTML = `
    ${avatarHTML}
    <div class="message-content">
      <div class="message-bubble">
        ${replyHTML}
        <div class="message-text">${text}</div>
        <i class="bx bx-chevron-down msg-options-btn"></i>
        <div class="bubble-menu">
          <span>👍</span>
          <span>❤️</span>
          <span>😂</span>
          <hr />
          <button class="reply-btn">Reply</button>
          <button class="copy-btn">Copy</button>
          <button class="delete-btn">Delete</button>
        </div>
      </div>
      <div class="message-time">${time}</div>
    </div>
  `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

backButton.addEventListener("click", () => {
  chatView.classList.remove("active");
  contactsView.classList.remove("hidden");
  messageInput.value = "";
  chatSearchBar.classList.remove("active");
  chatMessageSearch.value = "";
  menuDropdown.classList.remove("active");
  clearMessageHighlights();
});

// ✅ FIXED sendMessage - clean single version
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || blockedUsers[currentUserId]) return;

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const currentReply = replyData ? { ...replyData } : null;

  addMessage(text, "sent", time, currentReply);

  if (!messageData[currentUserId]) {
    messageData[currentUserId] = [];
  }
  messageData[currentUserId].push({
    type: "sent",
    text,
    time,
    reply: currentReply,
  });

  replyData = null;
  removeReplyPreview();
  messageInput.value = "";
  messageInput.focus();
}

sendButton.addEventListener("click", sendMessage);

emojiBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  if (blockedOverlay.classList.contains("active")) return;
  emojiPanel.classList.toggle("active");
});

messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});

emojiPanel.addEventListener("click", (e) => {
  if (!e.target.matches("span")) return;
  messageInput.value += e.target.textContent;
  messageInput.focus();
});

searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const chatItems = chatList.querySelectorAll(".chat-item");
  chatItems.forEach((item) => {
    const name = item.querySelector(".chat-name").textContent.toLowerCase();
    item.style.display = name.includes(searchTerm) ? "flex" : "none";
  });
});

menuButton.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
    menuDropdown.classList.remove("active");
  }
});

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

blockUserBtn.addEventListener("click", () => {
  if (!blockedUsers[currentUserId]) {
    blockedUsers[currentUserId] = true;
    localStorage.setItem("blockedUsers", JSON.stringify(blockedUsers));
    updateBlockedState();
    updateChatList();
    menuDropdown.classList.remove("active");
  }
});

unblockButton.addEventListener("click", () => {
  delete blockedUsers[currentUserId];
  localStorage.setItem("blockedUsers", JSON.stringify(blockedUsers));
  updateBlockedState();
  updateChatList();
});

function updateBlockedState() {
  if (blockedUsers[currentUserId]) {
    blockedOverlay.classList.add("active");
    messageInputContainer.classList.add("disabled");
    blockUserBtn.innerHTML = `<i class='bx bx-check'></i><span>User blocked</span>`;
  } else {
    blockedOverlay.classList.remove("active");
    messageInputContainer.classList.remove("disabled");
    blockUserBtn.innerHTML = `<i class='bx bx-block'></i><span>Block user</span>`;
  }
}

messagesContainer.addEventListener("click", (e) => {
  const btn = e.target.closest(".msg-options-btn");
  if (!btn) return;

  e.stopPropagation();
  const message = btn.closest(".message");

  document.querySelectorAll(".message.show-menu").forEach((m) => {
    if (m !== message) m.classList.remove("show-menu");
  });

  message.classList.toggle("show-menu");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".message")) {
    document
      .querySelectorAll(".message.show-menu")
      .forEach((m) => m.classList.remove("show-menu"));
  }
});

messagesContainer.addEventListener("click", (e) => {
  if (e.target.matches(".bubble-menu span")) {
    const message = e.target.closest(".message");
    let reaction = message.querySelector(".reaction");

    if (!reaction) {
      reaction = document.createElement("div");
      reaction.className = "reaction";
      message.appendChild(reaction);
    }

    reaction.textContent = e.target.textContent;
    message.classList.remove("show-menu");
  }
});

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

updateChatList();

// Handle reply, copy, delete buttons
messagesContainer.addEventListener("click", (e) => {
  const message = e.target.closest(".message");
  if (!message) return;

  // Copy button
  if (e.target.classList.contains("copy-btn")) {
    const textEl = message.querySelector(".message-text");
    const text = textEl ? textEl.textContent.trim() : "";
    navigator.clipboard.writeText(text);
    message.classList.remove("show-menu");
    alert("Message copied!");
  }

  // Delete button
  if (e.target.classList.contains("delete-btn")) {
    const textEl = message.querySelector(".message-text");
    const text = textEl ? textEl.textContent.trim() : "";
    const time = message.querySelector(".message-time").textContent;

    if (messageData[currentUserId]) {
      messageData[currentUserId] = messageData[currentUserId].filter(
        (msg) => !(msg.text === text && msg.time === time),
      );
    }

    message.remove();
    message.classList.remove("show-menu");
  }

  // ✅ FIXED Reply button - now uses .message-text
  if (e.target.classList.contains("reply-btn")) {
    const textEl = message.querySelector(".message-text");
    if (!textEl) return;

    replyData = {
      user: message.classList.contains("sent")
        ? "You"
        : chatHeaderName.textContent,
      text: textEl.textContent.trim(),
    };

    showReplyPreview(replyData);
    message.classList.remove("show-menu");
    messageInput.focus();
  }
});

function showReplyPreview({ user, text }) {
  removeReplyPreview();

  const preview = document.createElement("div");
  preview.className = "reply-preview";

  preview.innerHTML = `
    <div class="reply-bar"></div>
    <div class="reply-content">
      <strong>${user}</strong>
      <span>${text}</span>
    </div>
    <button class="close-reply">✕</button>
  `;

  messageInputContainer.prepend(preview);
}

function removeReplyPreview() {
  document.querySelector(".reply-preview")?.remove();
  replyData = null;
}

messageInputContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("close-reply")) {
    removeReplyPreview();
  }
});

// Clear Chat button functionality

// ===== Clear Chat Modal Logic =====
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmClearChat = document.getElementById("confirmClearChat");
const cancelClearChat = document.getElementById("cancelClearChat");

// Open modal when Clear Chat is clicked
clearChatBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  confirmOverlay.classList.add("active");
  menuDropdown.classList.remove("active");
});

// Cancel button
cancelClearChat.addEventListener("click", () => {
  confirmOverlay.classList.remove("active");
});

// Confirm clear chat
confirmClearChat.addEventListener("click", () => {
  if (!currentUserId) return;

  messageData[currentUserId] = [];
  messagesContainer.innerHTML = "";

  confirmOverlay.classList.remove("active");
});
function updateEmptyContactsState() {
  const chatItems = chatList.querySelectorAll(".chat-item");
  const emptyState = document.getElementById("emptyContacts");

  if (chatItems.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }
}
