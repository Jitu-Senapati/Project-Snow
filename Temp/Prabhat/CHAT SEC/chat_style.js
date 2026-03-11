// ===============================
// MESSAGE DATA
// ===============================
const today = new Date();
function daysAgo(n) {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

const messageData = {
  1: [
    { type: "received", text: "Hey! Long time no see.", time: "10:10 AM", date: daysAgo(3) },
    { type: "sent", text: "I know right! How have you been?", time: "10:12 AM", date: daysAgo(3) },
    { type: "received", text: "All good! You coming to college tomorrow?", time: "6:00 PM", date: daysAgo(1) },
    { type: "sent", text: "Yes, I will be there!", time: "6:05 PM", date: daysAgo(1) },
    { type: "received", text: "Hey, are you coming to the lab?", time: "10:30 AM", date: daysAgo(0) },
    { type: "sent", text: "Yes, I will be there in 15 minutes", time: "10:32 AM", date: daysAgo(0) },
    { type: "received", text: "Great! I will wait for you", time: "10:33 AM", date: daysAgo(0) },
  ],
  2: [
    { type: "received", text: "Did you finish the assignment?", time: "9:00 AM", date: daysAgo(2) },
    { type: "sent", text: "Almost done, a few more questions left.", time: "9:15 AM", date: daysAgo(2) },
    { type: "received", text: "Can you share the notes?", time: "9:45 AM", date: daysAgo(0) },
    { type: "sent", text: "Sure, I will send them right away", time: "9:50 AM", date: daysAgo(0) },
    { type: "sent", text: "Check your email", time: "9:51 AM", date: daysAgo(0) },
    { type: "received", text: "Got it, thanks!", time: "9:52 AM", date: daysAgo(0) },
  ],
  3: [
    { type: "sent", text: "Hey Rahul, need help with the project.", time: "4:00 PM", date: daysAgo(4) },
    { type: "received", text: "Sure! What do you need?", time: "4:10 PM", date: daysAgo(4) },
    { type: "sent", text: "The database part is confusing me.", time: "8:00 AM", date: daysAgo(1) },
    { type: "received", text: "I can explain it to you after class.", time: "8:05 AM", date: daysAgo(1) },
    { type: "received", text: "Thanks for the help!", time: "8:20 AM", date: daysAgo(0) },
    { type: "sent", text: "No problem, happy to help!", time: "8:25 AM", date: daysAgo(0) },
    { type: "received", text: "Let me know if you need anything", time: "8:26 AM", date: daysAgo(0) },
  ],
};

const avatarClass = { 1: "av-blue", 2: "av-pink", 3: "av-green" };

// ===============================
// STATE
// ===============================
let replyData = null;
let blockedUsers = {};
let currentUserId = null;
let currentUserInitials = null;
let currentUserName = null;

// ===============================
// ELEMENTS
// ===============================
const leftPanel        = document.getElementById("leftPanel");
const chatList         = document.getElementById("chatList");
const noChatSelected   = document.getElementById("noChatSelected");
const chatView         = document.getElementById("chatView");
const backButton       = document.getElementById("backButton");
const chatHeaderName   = document.getElementById("chatHeaderName");
const chatHeaderAvatar = document.getElementById("chatHeaderAvatar");
const messagesContainer= document.getElementById("messagesContainer");
const messageInput     = document.getElementById("messageInput");
const sendButton       = document.getElementById("sendButton");
const searchInput      = document.getElementById("chatSearchInput");
const menuButton       = document.getElementById("menuButton");
const menuDropdown     = document.getElementById("menuDropdown");
const searchInChatToggle = document.getElementById("searchInChatToggle");
const blockUserBtn     = document.getElementById("blockUserBtn");
const chatSearchBar    = document.getElementById("chatSearchBar");
const chatMessageSearch= document.getElementById("chatMessageSearch");
const closeSearchBtn   = document.getElementById("closeSearchBtn");
const messageInputContainer = document.getElementById("messageInputContainer");
const blockedOverlay   = document.getElementById("blockedOverlay");
const unblockButton    = document.getElementById("unblockButton");
const emojiToggle      = document.getElementById("emojiToggle");
const emojiPanel       = document.getElementById("emojiPanel");
const clearChatBtn     = document.getElementById("clearChatBtn");
const emptyContacts    = document.getElementById("emptyContacts");
const confirmOverlay   = document.getElementById("confirmOverlay");
const confirmClearChat = document.getElementById("confirmClearChat");
const cancelClearChat  = document.getElementById("cancelClearChat");

// ===============================
// OPEN CHAT
// ===============================
chatList.addEventListener("click", (e) => {
  const item = e.target.closest(".chat-item");
  if (!item) return;
  openChat(item.dataset.userName, item.dataset.userInitials, item.dataset.userId);
});

function openChat(userName, initials, userId) {
  currentUserId = userId;
  currentUserInitials = initials;
  currentUserName = userName;

  chatHeaderName.textContent = userName;
  chatHeaderAvatar.textContent = initials;
  chatHeaderAvatar.className = "chat-avatar " + (avatarClass[userId] || "av-purple");

  // Mark active
  document.querySelectorAll(".chat-item").forEach(i => i.classList.remove("active-chat"));
  const activeItem = chatList.querySelector(`[data-user-id="${userId}"]`);
  if (activeItem) {
    activeItem.classList.add("active-chat");
    const badge = activeItem.querySelector(".unread-badge");
    if (badge) badge.remove();
  }

  loadMessages(userId);
  updateBlockedState();

  // Show chat view, hide empty state
  noChatSelected.classList.add("hidden");
  chatView.classList.add("active");

  // Mobile: hide left panel
  if (window.innerWidth <= 768) {
    leftPanel.classList.add("hidden-mobile");
  }

  menuDropdown.classList.remove("active");
  chatSearchBar.classList.remove("active");
  chatMessageSearch.value = "";
  clearMessageHighlights();
  emojiPanel.classList.remove("active");
}

// ===============================
// BACK BUTTON (mobile)
// ===============================
backButton.addEventListener("click", () => {
  chatView.classList.remove("active");
  noChatSelected.classList.remove("hidden");
  leftPanel.classList.remove("hidden-mobile");
  messageInput.value = "";
  removeReplyPreview();
  menuDropdown.classList.remove("active");
  chatSearchBar.classList.remove("active");
  clearMessageHighlights();
  emojiPanel.classList.remove("active");
});

// ===============================
// DATE HELPERS
// ===============================
function getDateLabel(dateStr) {
  const msgDate = new Date(dateStr);
  const now = new Date();
  const toDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
  const diffDays = Math.round((toDay - mDay) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return msgDate.toLocaleDateString("en-US", { weekday: "long" });
  return msgDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function createDayDivider(label) {
  const div = document.createElement("div");
  div.className = "day-divider";
  div.innerHTML = `<span>${label}</span>`;
  return div;
}

// ===============================
// LOAD MESSAGES
// ===============================
function loadMessages(userId) {
  messagesContainer.innerHTML = "";
  const messages = messageData[userId] || [];
  let lastLabel = null;
  messages.forEach(msg => {
    const label = getDateLabel(msg.date);
    if (label !== lastLabel) {
      messagesContainer.appendChild(createDayDivider(label));
      lastLabel = label;
    }
    addMessage(msg.text, msg.type, msg.time, msg.reply || null, false);
  });
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ===============================
// ADD MESSAGE
// ===============================
function addMessage(text, type, time, reply = null, animate = true) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  if (animate) div.style.animation = "msgIn 0.25s cubic-bezier(0.34,1.56,0.64,1)";

  const avatarHTML = type === "received"
    ? `<div class="message-avatar">${currentUserInitials}</div>` : "";

  const replyHTML = reply ? `
    <div class="reply-quote">
      <span class="reply-user">${reply.user}</span>
      <span class="reply-text">${escapeHtml(reply.text)}</span>
    </div>` : "";

  div.innerHTML = `
    ${avatarHTML}
    <div class="message-content">
      <div class="message-bubble">
        ${replyHTML}
        <div class="message-text">${escapeHtml(text)}</div>
        <i class="bx bx-chevron-down msg-options-btn"></i>
        <div class="bubble-menu">
          <div class="emoji-row">
            <span>👍</span><span>❤️</span><span>😂</span><span>😮</span>
          </div>
          <button class="reply-btn">↩ Reply</button>
          <button class="copy-btn">⎘ Copy</button>
          <button class="delete-btn">🗑 Delete</button>
        </div>
      </div>
      <div class="message-time">${time}</div>
    </div>
  `;
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add keyframe for message animation
const styleEl = document.createElement("style");
styleEl.textContent = `@keyframes msgIn { from { opacity:0; transform: translateY(10px) scale(0.96); } to { opacity:1; transform: none; } }`;
document.head.appendChild(styleEl);

// ===============================
// SEND MESSAGE
// ===============================
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || blockedUsers[currentUserId]) return;

  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const allDividers = messagesContainer.querySelectorAll(".day-divider");
  const lastDivider = allDividers[allDividers.length - 1];
  if (!lastDivider || lastDivider.querySelector("span").textContent !== "Today") {
    messagesContainer.appendChild(createDayDivider("Today"));
  }

  const currentReply = replyData ? { ...replyData } : null;
  addMessage(text, "sent", time, currentReply, true);

  if (!messageData[currentUserId]) messageData[currentUserId] = [];
  messageData[currentUserId].push({ type: "sent", text, time, date: daysAgo(0), reply: currentReply });

  // Update chat list preview
  const item = chatList.querySelector(`[data-user-id="${currentUserId}"]`);
  if (item) item.querySelector(".chat-message").textContent = text;

  replyData = null;
  removeReplyPreview();
  messageInput.value = "";
  messageInput.focus();
}

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

// ===============================
// CONTACT SEARCH
// ===============================
searchInput.addEventListener("input", e => {
  const term = e.target.value.toLowerCase().trim();
  const items = chatList.querySelectorAll(".chat-item");
  let visible = [];
  items.forEach(item => {
    const name = item.querySelector(".chat-name").textContent.toLowerCase();
    const show = name.includes(term);
    item.style.display = show ? "flex" : "none";
    if (show) visible.push(item);
  });
  emptyContacts.style.display = (visible.length === 0 && term.length > 0) ? "block" : "none";
  if (term.length > 0 && visible.length === 1) {
    openChat(visible[0].dataset.userName, visible[0].dataset.userInitials, visible[0].dataset.userId);
  }
});

// ===============================
// EMOJI
// ===============================
emojiToggle.addEventListener("click", e => {
  e.stopPropagation();
  if (blockedOverlay.classList.contains("active")) return;
  emojiPanel.classList.toggle("active");
});
emojiPanel.addEventListener("click", e => {
  if (!e.target.matches("span")) return;
  messageInput.value += e.target.textContent;
  messageInput.focus();
});
document.addEventListener("click", e => {
  if (!emojiPanel.contains(e.target) && e.target !== emojiToggle) {
    emojiPanel.classList.remove("active");
  }
});

// ===============================
// MENU
// ===============================
menuButton.addEventListener("click", e => {
  e.stopPropagation();
  menuDropdown.classList.toggle("active");
});
document.addEventListener("click", e => {
  if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target)) {
    menuDropdown.classList.remove("active");
  }
});

// ===============================
// SEARCH IN CHAT
// ===============================
searchInChatToggle.addEventListener("click", () => {
  chatSearchBar.classList.toggle("active");
  if (chatSearchBar.classList.contains("active")) chatMessageSearch.focus();
  else { chatMessageSearch.value = ""; clearMessageHighlights(); }
});
closeSearchBtn.addEventListener("click", () => {
  chatSearchBar.classList.remove("active");
  chatMessageSearch.value = "";
  clearMessageHighlights();
});
chatMessageSearch.addEventListener("input", e => {
  const term = e.target.value.toLowerCase();
  clearMessageHighlights();
  if (!term) return;
  messagesContainer.querySelectorAll(".message").forEach(m => {
    const t = m.querySelector(".message-text");
    if (!t) return;
    if (t.textContent.toLowerCase().includes(term)) m.classList.add("highlight");
    else m.classList.add("hidden");
  });
  const first = messagesContainer.querySelector(".message.highlight");
  if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
});
function clearMessageHighlights() {
  messagesContainer.querySelectorAll(".message").forEach(m => m.classList.remove("highlight", "hidden"));
}

// ===============================
// BLOCK / UNBLOCK
// ===============================
blockUserBtn.addEventListener("click", () => {
  if (!blockedUsers[currentUserId]) {
    blockedUsers[currentUserId] = true;
    updateBlockedState();
    updateChatList();
    menuDropdown.classList.remove("active");
  }
});
unblockButton.addEventListener("click", () => {
  delete blockedUsers[currentUserId];
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
  chatList.querySelectorAll(".chat-item").forEach(item => {
    if (blockedUsers[item.dataset.userId]) item.classList.add("blocked");
    else item.classList.remove("blocked");
  });
}

// ===============================
// MESSAGE OPTIONS
// ===============================
messagesContainer.addEventListener("click", e => {
  const btn = e.target.closest(".msg-options-btn");
  if (!btn) return;
  e.stopPropagation();
  const msg = btn.closest(".message");
  document.querySelectorAll(".message.show-menu").forEach(m => { if (m !== msg) m.classList.remove("show-menu"); });
  msg.classList.toggle("show-menu");
});
document.addEventListener("click", e => {
  if (!e.target.closest(".message")) {
    document.querySelectorAll(".message.show-menu").forEach(m => m.classList.remove("show-menu"));
  }
});

// ===============================
// REACTIONS
// ===============================
messagesContainer.addEventListener("click", e => {
  if (!e.target.matches(".emoji-row span")) return;
  const msg = e.target.closest(".message");
  let reaction = msg.querySelector(".reaction");
  if (!reaction) { reaction = document.createElement("div"); reaction.className = "reaction"; msg.appendChild(reaction); }
  reaction.textContent = e.target.textContent;
  msg.classList.remove("show-menu");
});

// ===============================
// REPLY / COPY / DELETE
// ===============================
messagesContainer.addEventListener("click", e => {
  const msg = e.target.closest(".message");
  if (!msg) return;

  if (e.target.classList.contains("copy-btn")) {
    const t = msg.querySelector(".message-text");
    if (t) navigator.clipboard.writeText(t.textContent.trim()).catch(() => {});
    msg.classList.remove("show-menu");
  }
  if (e.target.classList.contains("delete-btn")) {
    msg.style.animation = "msgOut 0.2s ease forwards";
    setTimeout(() => msg.remove(), 200);
  }
  if (e.target.classList.contains("reply-btn")) {
    const t = msg.querySelector(".message-text");
    if (!t) return;
    replyData = {
      user: msg.classList.contains("sent") ? "You" : currentUserName,
      text: t.textContent.trim(),
    };
    showReplyPreview(replyData);
    msg.classList.remove("show-menu");
    messageInput.focus();
  }
});

// Add delete animation
styleEl.textContent += `@keyframes msgOut { from { opacity:1; transform:scale(1); } to { opacity:0; transform:scale(0.8); } }`;

// ===============================
// REPLY PREVIEW
// ===============================
function showReplyPreview({ user, text }) {
  removeReplyPreview();
  const preview = document.createElement("div");
  preview.className = "reply-preview";
  preview.innerHTML = `
    <div class="reply-bar"></div>
    <div class="reply-content"><strong>${user}</strong><span>${escapeHtml(text)}</span></div>
    <button class="close-reply">✕</button>
  `;
  messageInputContainer.insertBefore(preview, messageInputContainer.querySelector(".input-row"));
}
function removeReplyPreview() {
  document.querySelector(".reply-preview")?.remove();
  replyData = null;
}
messageInputContainer.addEventListener("click", e => {
  if (e.target.classList.contains("close-reply")) removeReplyPreview();
});

// ===============================
// CLEAR CHAT
// ===============================
clearChatBtn.addEventListener("click", e => {
  e.stopPropagation();
  menuDropdown.classList.remove("active");
  // Temporarily lift blocked overlay so confirm modal is accessible
  if (blockedOverlay.classList.contains("active")) {
    blockedOverlay.style.zIndex = "0";
  }
  confirmOverlay.classList.add("active");
});
cancelClearChat.addEventListener("click", () => {
  confirmOverlay.classList.remove("active");
  blockedOverlay.style.zIndex = "";
});

confirmClearChat.addEventListener("click", () => {
  if (!currentUserId) return;
  messageData[currentUserId] = [];
  messagesContainer.innerHTML = "";
  confirmOverlay.classList.remove("active");
  blockedOverlay.style.zIndex = "";
});

// ===============================
// UTILS
// ===============================
function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

// ===============================
// INIT
// ===============================
updateChatList();
// Auto-open first chat on desktop
if (window.innerWidth > 768) {
  const firstItem = chatList.querySelector(".chat-item");
  if (firstItem) openChat(firstItem.dataset.userName, firstItem.dataset.userInitials, firstItem.dataset.userId);
}