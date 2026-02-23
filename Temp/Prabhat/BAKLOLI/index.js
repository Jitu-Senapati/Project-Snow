// ===============================
// MESSAGE DATA (with dates)
// ===============================
const today = new Date();

function daysAgo(n) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

const messageData = {
  1: [
    {
      type: "received",
      text: "Hey! Long time no see.",
      time: "10:10 AM",
      date: daysAgo(3),
    },
    {
      type: "sent",
      text: "I know right! How have you been?",
      time: "10:12 AM",
      date: daysAgo(3),
    },
    {
      type: "received",
      text: "All good! You coming to college tomorrow?",
      time: "6:00 PM",
      date: daysAgo(1),
    },
    {
      type: "sent",
      text: "Yes, I will be there!",
      time: "6:05 PM",
      date: daysAgo(1),
    },
    {
      type: "received",
      text: "Hey, are you coming to the lab?",
      time: "10:30 AM",
      date: daysAgo(0),
    },
    {
      type: "sent",
      text: "Yes, I will be there in 15 minutes",
      time: "10:32 AM",
      date: daysAgo(0),
    },
    {
      type: "received",
      text: "Great! I will wait for you",
      time: "10:33 AM",
      date: daysAgo(0),
    },
  ],
  2: [
    {
      type: "received",
      text: "Did you finish the assignment?",
      time: "9:00 AM",
      date: daysAgo(2),
    },
    {
      type: "sent",
      text: "Almost done, a few more questions left.",
      time: "9:15 AM",
      date: daysAgo(2),
    },
    {
      type: "received",
      text: "Can you share the notes?",
      time: "9:45 AM",
      date: daysAgo(0),
    },
    {
      type: "sent",
      text: "Sure, I will send them right away",
      time: "9:50 AM",
      date: daysAgo(0),
    },
    {
      type: "sent",
      text: "Check your email",
      time: "9:51 AM",
      date: daysAgo(0),
    },
    {
      type: "received",
      text: "Got it, thanks!",
      time: "9:52 AM",
      date: daysAgo(0),
    },
  ],
  3: [
    {
      type: "sent",
      text: "Hey Rahul, need help with the project.",
      time: "4:00 PM",
      date: daysAgo(4),
    },
    {
      type: "received",
      text: "Sure! What do you need?",
      time: "4:10 PM",
      date: daysAgo(4),
    },
    {
      type: "sent",
      text: "The database part is confusing me.",
      time: "8:00 AM",
      date: daysAgo(1),
    },
    {
      type: "received",
      text: "I can explain it to you after class.",
      time: "8:05 AM",
      date: daysAgo(1),
    },
    {
      type: "received",
      text: "Thanks for the help!",
      time: "8:20 AM",
      date: daysAgo(0),
    },
    {
      type: "sent",
      text: "No problem, happy to help!",
      time: "8:25 AM",
      date: daysAgo(0),
    },
    {
      type: "received",
      text: "Let me know if you need anything",
      time: "8:26 AM",
      date: daysAgo(0),
    },
  ],
};

// ===============================
// STATE
// ===============================
let replyData = null;
let blockedUsers = {};
try {
  blockedUsers = JSON.parse(localStorage.getItem("blockedUsers")) || {};
} catch (e) {}
let currentUserId = null;
let currentUserInitials = null;

// ===============================
// ELEMENTS
// ===============================
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
const emojiToggle = document.getElementById("emojiToggle");
const emojiPanel = document.getElementById("emojiPanel");
const clearChatBtn = document.getElementById("clearChatBtn");
const emptyContacts = document.getElementById("emptyContacts");
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmClearChat = document.getElementById("confirmClearChat");
const cancelClearChat = document.getElementById("cancelClearChat");

// ===============================
// OPEN CHAT
// ===============================
chatList.addEventListener("click", (e) => {
  const chatItem = e.target.closest(".chat-item");
  if (chatItem) {
    currentUserId = chatItem.dataset.userId;
    currentUserInitials = chatItem.dataset.userInitials;
    openChat(chatItem.dataset.userName, currentUserInitials, currentUserId);
  }
});

function openChat(userName, initials, userId) {
  currentUserId = userId;
  currentUserInitials = initials;
  chatHeaderName.textContent = userName;
  chatHeaderAvatar.textContent = initials;
  loadMessages(userId);
  updateBlockedState();
  contactsView.classList.add("hidden");
  chatView.classList.add("active");
  menuDropdown.classList.remove("active");
  searchInput.value = "";
  showAllChatItems();
}

// ===============================
// DAY DIVIDER HELPERS
// ===============================
function getDateLabel(dateStr) {
  const msgDate = new Date(dateStr);
  const now = new Date();
  const toDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mDay = new Date(
    msgDate.getFullYear(),
    msgDate.getMonth(),
    msgDate.getDate(),
  );
  const diffDays = Math.round((toDay - mDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)
    return msgDate.toLocaleDateString("en-US", { weekday: "long" });
  return msgDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function createDayDivider(label) {
  const div = document.createElement("div");
  div.className = "day-divider";
  div.innerHTML = `<span>${label}</span>`;
  return div;
}

// ===============================
// LOAD MESSAGES WITH DAY DIVIDERS
// ===============================
function loadMessages(userId) {
  messagesContainer.innerHTML = "";
  const messages = messageData[userId] || [];
  let lastDateLabel = null;

  messages.forEach((msg) => {
    const label = getDateLabel(msg.date);
    if (label !== lastDateLabel) {
      messagesContainer.appendChild(createDayDivider(label));
      lastDateLabel = label;
    }
    addMessage(msg.text, msg.type, msg.time, msg.reply || null);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ===============================
// ADD MESSAGE
// ===============================
function addMessage(text, type, time, reply = null) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;

  const avatarHTML =
    type === "received"
      ? `<div class="message-avatar">${currentUserInitials}</div>`
      : "";

  const replyHTML = reply
    ? `
    <div class="reply-quote">
      <span class="reply-user">${reply.user}</span>
      <span class="reply-text">${reply.text}</span>
    </div>`
    : "";

  messageDiv.innerHTML = `
    ${avatarHTML}
    <div class="message-content">
      <div class="message-bubble">
        ${replyHTML}
        <div class="message-text">${escapeHtml(text)}</div>
        <i class="bx bx-chevron-down msg-options-btn"></i>
        <div class="bubble-menu">
          <span>👍</span><span>❤️</span><span>😂</span>
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

// ===============================
// SEND MESSAGE - Fixed Today repeating bug
// ===============================
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || blockedUsers[currentUserId]) return;

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = daysAgo(0);

  // Only add "Today" divider if the LAST divider is NOT already "Today"
  const allDividers = messagesContainer.querySelectorAll(".day-divider");
  const lastDivider = allDividers[allDividers.length - 1];
  const lastLabel = lastDivider
    ? lastDivider.querySelector("span").textContent
    : null;
  if (lastLabel !== "Today") {
    messagesContainer.appendChild(createDayDivider("Today"));
  }

  const currentReply = replyData ? { ...replyData } : null;
  addMessage(text, "sent", time, currentReply);

  if (!messageData[currentUserId]) messageData[currentUserId] = [];
  messageData[currentUserId].push({
    type: "sent",
    text,
    time,
    date: dateStr,
    reply: currentReply,
  });

  replyData = null;
  removeReplyPreview();
  messageInput.value = "";
  messageInput.focus();
}

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// ===============================
// BACK BUTTON
// ===============================
backButton.addEventListener("click", () => {
  chatView.classList.remove("active");
  contactsView.classList.remove("hidden");
  messageInput.value = "";
  chatSearchBar.classList.remove("active");
  chatMessageSearch.value = "";
  menuDropdown.classList.remove("active");
  clearMessageHighlights();
  emojiPanel.classList.remove("active");
});

// ===============================
// CONTACT SEARCH → AUTO NAVIGATE
// ===============================
searchInput.addEventListener("input", (e) => {
  const searchTerm = e.target.value.toLowerCase().trim();
  const chatItems = chatList.querySelectorAll(".chat-item");
  let visibleItems = [];

  chatItems.forEach((item) => {
    const name = item.querySelector(".chat-name").textContent.toLowerCase();
    if (name.includes(searchTerm)) {
      item.style.display = "flex";
      visibleItems.push(item);
    } else {
      item.style.display = "none";
    }
  });

  // Auto-open if exactly one match
  if (searchTerm.length > 0 && visibleItems.length === 1) {
    const item = visibleItems[0];
    openChat(
      item.dataset.userName,
      item.dataset.userInitials,
      item.dataset.userId,
    );
  }

  emptyContacts.style.display =
    visibleItems.length === 0 && searchTerm.length > 0 ? "block" : "none";
});

function showAllChatItems() {
  chatList
    .querySelectorAll(".chat-item")
    .forEach((item) => (item.style.display = "flex"));
  emptyContacts.style.display = "none";
}

// ===============================
// EMOJI
// ===============================
emojiToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  if (blockedOverlay.classList.contains("active")) return;
  emojiPanel.classList.toggle("active");
});

emojiPanel.addEventListener("click", (e) => {
  if (!e.target.matches("span")) return;
  messageInput.value += e.target.textContent;
  messageInput.focus();
});

document.addEventListener("click", (e) => {
  if (!emojiPanel.contains(e.target) && !emojiToggle.contains(e.target)) {
    emojiPanel.classList.remove("active");
  }
});

// ===============================
// MENU BUTTON
// ===============================
menuButton.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle("active");
});

document.addEventListener("click", (e) => {
  if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
    menuDropdown.classList.remove("active");
  }
});

// ===============================
// SEARCH IN CHAT
// ===============================
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
      const textEl = message.querySelector(".message-text");
      if (!textEl) return;
      const text = textEl.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        message.classList.add("highlight");
      } else {
        message.classList.add("hidden");
      }
    });

    const firstMatch = messagesContainer.querySelector(".message.highlight");
    if (firstMatch)
      firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    messages.forEach((m) => m.classList.remove("hidden"));
  }
});

function clearMessageHighlights() {
  messagesContainer.querySelectorAll(".message").forEach((m) => {
    m.classList.remove("highlight", "hidden");
  });
}

// ===============================
// BLOCK / UNBLOCK
// ===============================
blockUserBtn.addEventListener("click", () => {
  if (!blockedUsers[currentUserId]) {
    blockedUsers[currentUserId] = true;
    try {
      localStorage.setItem("blockedUsers", JSON.stringify(blockedUsers));
    } catch (e) {}
    updateBlockedState();
    updateChatList();
    menuDropdown.classList.remove("active");
  }
});

unblockButton.addEventListener("click", () => {
  delete blockedUsers[currentUserId];
  try {
    localStorage.setItem("blockedUsers", JSON.stringify(blockedUsers));
  } catch (e) {}
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

function updateChatList() {
  chatList.querySelectorAll(".chat-item").forEach((item) => {
    if (blockedUsers[item.dataset.userId]) item.classList.add("blocked");
    else item.classList.remove("blocked");
  });
}

// ===============================
// MESSAGE OPTIONS (chevron)
// ===============================
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

// ===============================
// REACTIONS
// ===============================
messagesContainer.addEventListener("click", (e) => {
  if (!e.target.matches(".bubble-menu span")) return;
  const message = e.target.closest(".message");
  let reaction = message.querySelector(".reaction");
  if (!reaction) {
    reaction = document.createElement("div");
    reaction.className = "reaction";
    message.appendChild(reaction);
  }
  reaction.textContent = e.target.textContent;
  message.classList.remove("show-menu");
});

// ===============================
// REPLY / COPY / DELETE
// ===============================
messagesContainer.addEventListener("click", (e) => {
  const message = e.target.closest(".message");
  if (!message) return;

  if (e.target.classList.contains("copy-btn")) {
    const textEl = message.querySelector(".message-text");
    const text = textEl ? textEl.textContent.trim() : "";
    navigator.clipboard.writeText(text).catch(() => {});
    message.classList.remove("show-menu");
    alert("Message copied!");
  }

  if (e.target.classList.contains("delete-btn")) {
    const textEl = message.querySelector(".message-text");
    const text = textEl ? textEl.textContent.trim() : "";
    const time = message.querySelector(".message-time")?.textContent;
    if (messageData[currentUserId]) {
      messageData[currentUserId] = messageData[currentUserId].filter(
        (msg) => !(msg.text === text && msg.time === time),
      );
    }
    message.remove();
  }

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

// ===============================
// REPLY PREVIEW
// ===============================
function showReplyPreview({ user, text }) {
  removeReplyPreview();
  const preview = document.createElement("div");
  preview.className = "reply-preview";
  preview.innerHTML = `
    <div class="reply-bar"></div>
    <div class="reply-content">
      <strong>${user}</strong>
      <span>${escapeHtml(text)}</span>
    </div>
    <button class="close-reply">✕</button>
  `;
  // Insert above the input-row
  const inputRow = messageInputContainer.querySelector(".input-row");
  messageInputContainer.insertBefore(preview, inputRow);
}

function removeReplyPreview() {
  document.querySelector(".reply-preview")?.remove();
  replyData = null;
}

messageInputContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("close-reply")) removeReplyPreview();
});

// ===============================
// CLEAR CHAT
// ===============================
clearChatBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  confirmOverlay.classList.add("active");
  menuDropdown.classList.remove("active");
});

cancelClearChat.addEventListener("click", () => {
  confirmOverlay.classList.remove("active");
});

confirmClearChat.addEventListener("click", () => {
  if (!currentUserId) return;
  messageData[currentUserId] = [];
  messagesContainer.innerHTML = "";
  confirmOverlay.classList.remove("active");
});

// ===============================
// UTILS
// ===============================
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ===============================
// INIT
// ===============================
updateChatList();
