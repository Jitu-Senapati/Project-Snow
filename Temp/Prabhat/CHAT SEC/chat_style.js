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
let blockedUsers = JSON.parse(localStorage.getItem("blockedUsers") || "{}");
let pinnedUsers = JSON.parse(localStorage.getItem("pinnedUsers") || "{}");
let mutedUsers = JSON.parse(localStorage.getItem("mutedUsers") || "{}");
let currentUserId = null;
let currentUserInitials = null;
let currentUserName = null;

let msgSelectMode = false;
let selectedMsgEls = new Set();

function saveBlocked() { localStorage.setItem("blockedUsers", JSON.stringify(blockedUsers)); }
function savePinned() { localStorage.setItem("pinnedUsers", JSON.stringify(pinnedUsers)); }
function saveMuted() { localStorage.setItem("mutedUsers", JSON.stringify(mutedUsers)); }

// ===============================
// ELEMENTS
// ===============================
const leftPanel = document.getElementById("leftPanel");
const chatList = document.getElementById("chatList");
const noChatSelected = document.getElementById("noChatSelected");
const chatView = document.getElementById("chatView");
const backButton = document.getElementById("backButton");
const chatHeaderName = document.getElementById("chatHeaderName");
const chatHeaderAvatar = document.getElementById("chatHeaderAvatar");
const messagesContainer = document.getElementById("messagesContainer");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const searchInput = document.getElementById("chatSearchInput");
const menuButton = document.getElementById("menuButton");
const menuDropdown = document.getElementById("menuDropdown");
const blockUserBtn = document.getElementById("blockUserBtn");
const messageInputContainer = document.getElementById("messageInputContainer");
const emojiToggle = document.getElementById("emojiToggle");
const emojiPanel = document.getElementById("emojiPanel");
const clearChatBtn = document.getElementById("clearChatBtn");
const emptyContacts = document.getElementById("emptyContacts");
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmClearChat = document.getElementById("confirmClearChat");
const cancelClearChat = document.getElementById("cancelClearChat");
const blockNotice = document.getElementById("blockNotice");
const blockNoticeUnblock = document.getElementById("blockNoticeUnblock");
const chatHeaderClickable = document.getElementById("chatHeaderClickable");
const replyPreviewEl = document.getElementById("replyPreview");
const replyPreviewUser = document.getElementById("replyPreviewUser");
const replyPreviewText = document.getElementById("replyPreviewText");
const closeReplyBtn = document.getElementById("closeReplyBtn");

const msgSelectBar = document.getElementById("msgSelectBar");
const msgSelectCancel = document.getElementById("msgSelectCancel");
const msgSelectCount = document.getElementById("msgSelectCount");
const msgCopyBtn = document.getElementById("msgCopyBtn");
const msgStarBtn = document.getElementById("msgStarBtn");
const msgDeleteBtn = document.getElementById("msgDeleteBtn");
const msgForwardBtn = document.getElementById("msgForwardBtn");

const deleteMsgOverlay = document.getElementById("deleteMsgOverlay");
const deleteForEveryoneBtn = document.getElementById("deleteForEveryoneBtn");
const deleteForMeBtn = document.getElementById("deleteForMeBtn");
const cancelDeleteMsg = document.getElementById("cancelDeleteMsg");

const contactCtxOverlay = document.getElementById("contactCtxOverlay");
const contactCtxMenu = document.getElementById("contactCtxMenu");
let ctxTargetUserId = null;

// ===============================
// CONTACT RIGHT-CLICK CONTEXT MENU
// ===============================
chatList.addEventListener("contextmenu", (e) => {
  const item = e.target.closest(".chat-item");
  if (!item) return;
  e.preventDefault();
  ctxTargetUserId = item.dataset.userId;

  const muteItem = contactCtxMenu.querySelector("[data-action='mute']");
  muteItem.querySelector("span").textContent = mutedUsers[ctxTargetUserId] ? "Unmute notifications" : "Mute notifications";

  const vw = window.innerWidth, vh = window.innerHeight;
  let x = e.clientX, y = e.clientY;
  contactCtxOverlay.style.display = "block";
  const mw = contactCtxMenu.offsetWidth || 210;
  const mh = contactCtxMenu.offsetHeight || 250;
  if (x + mw + 10 > vw) x = vw - mw - 10;
  if (y + mh + 10 > vh) y = vh - mh - 10;
  contactCtxMenu.style.left = x + "px";
  contactCtxMenu.style.top = y + "px";
  contactCtxOverlay.classList.add("active");
});

contactCtxOverlay.addEventListener("click", (e) => {
  if (e.target === contactCtxOverlay) closeContactCtx();
});

function closeContactCtx() {
  contactCtxOverlay.classList.remove("active");
  setTimeout(() => { contactCtxOverlay.style.display = ""; }, 150);
  ctxTargetUserId = null;
}

contactCtxMenu.querySelectorAll(".ctx-item").forEach((item) => {
  item.addEventListener("click", () => {
    const action = item.dataset.action;
    const uid = ctxTargetUserId;
    if (!uid) return;

    if (action === "mute") {
      if (mutedUsers[uid]) delete mutedUsers[uid]; else mutedUsers[uid] = true;
      saveMuted(); refreshChatList();
    }
    if (action === "block") {
      if (!blockedUsers[uid]) { blockedUsers[uid] = true; saveBlocked(); }
      if (currentUserId === uid) { updateBlockedState(); appendBlockedNoticeMessages(); }
      refreshChatList();
    }
    if (action === "clear") {
      messageData[uid] = [];
      if (currentUserId === uid) messagesContainer.innerHTML = "";
      const listItem = chatList.querySelector(`[data-user-id="${uid}"]`);
      if (listItem) listItem.querySelector(".chat-message").textContent = "";
    }
    if (action === "delete") {
      const el = chatList.querySelector(`[data-user-id="${uid}"]`);
      if (el) {
        el.style.animation = "fadeOut 0.25s ease forwards";
        setTimeout(() => {
          el.remove();
          delete messageData[uid];
          if (currentUserId === uid) {
            chatView.classList.remove("active");
            noChatSelected.classList.remove("hidden");
          }
        }, 250);
      }
    }
    closeContactCtx();
  });
});

// ===============================
// REFRESH CHAT LIST
// ===============================
function refreshChatList() {
  chatList.querySelectorAll(".chat-item").forEach((item) => {
    const uid = item.dataset.userId;
    item.classList.toggle("pinned", !!pinnedUsers[uid]);
    item.classList.toggle("muted", !!mutedUsers[uid]);
    item.classList.toggle("blocked", !!blockedUsers[uid]);

    // Pin badge icon inside list item
    let pinBadge = item.querySelector(".pin-badge");
    if (pinnedUsers[uid]) {
      if (!pinBadge) {
        pinBadge = document.createElement("span");
        pinBadge.className = "pin-badge";
        pinBadge.innerHTML = '<i class="bx bx-pin"></i>';
        item.querySelector(".chat-name-row").appendChild(pinBadge);
      }
    } else {
      if (pinBadge) pinBadge.remove();
    }
  });

  const items = [...chatList.querySelectorAll(".chat-item")];
  const pinned = items.filter((i) => pinnedUsers[i.dataset.userId]);
  const unpinned = items.filter((i) => !pinnedUsers[i.dataset.userId]);
  [...pinned, ...unpinned].forEach((i) => chatList.appendChild(i));
}

// ===============================
// CHAT ITEM CLICK
// ===============================
chatList.addEventListener("click", (e) => {
  const item = e.target.closest(".chat-item");
  if (!item) return;
  openChat(item.dataset.userName, item.dataset.userInitials, item.dataset.userId);
});

// ===============================
// MESSAGE MULTI-SELECT
// ===============================
function enterMsgSelectMode(msgEl) {
  msgSelectMode = true;
  msgSelectBar.classList.add("active");
  messageInputContainer.style.display = "none";
  emojiPanel.classList.remove("active");
  toggleMsgSelect(msgEl);
}

function exitMsgSelectMode() {
  msgSelectMode = false;
  selectedMsgEls.forEach((el) => el.classList.remove("selected-msg"));
  selectedMsgEls.clear();
  msgSelectBar.classList.remove("active");
  messageInputContainer.style.display = "";
  updateMsgSelectCount();
}

function toggleMsgSelect(msgEl) {
  if (selectedMsgEls.has(msgEl)) {
    selectedMsgEls.delete(msgEl);
    msgEl.classList.remove("selected-msg");
  } else {
    selectedMsgEls.add(msgEl);
    msgEl.classList.add("selected-msg");
  }
  updateMsgSelectCount();
  if (selectedMsgEls.size === 0) exitMsgSelectMode();
}

function updateMsgSelectCount() {
  const n = selectedMsgEls.size;
  msgSelectCount.textContent = n === 1 ? "1 selected" : `${n} selected`;
}

messagesContainer.addEventListener("click", (e) => {
  if (!msgSelectMode) return;
  const msgEl = e.target.closest(".message");
  if (!msgEl) return;
  toggleMsgSelect(msgEl);
});

msgSelectCancel.addEventListener("click", exitMsgSelectMode);

msgCopyBtn.addEventListener("click", () => {
  const texts = [...selectedMsgEls].map((el) => el.querySelector(".message-text")?.textContent?.trim() || "");
  navigator.clipboard.writeText(texts.join("\n")).catch(() => {});
  exitMsgSelectMode();
});

msgForwardBtn.addEventListener("click", () => {
  const texts = [...selectedMsgEls].map((el) => el.querySelector(".message-text")?.textContent?.trim() || "");
  openForwardPicker(texts);
  exitMsgSelectMode();
});

msgDeleteBtn.addEventListener("click", () => {
  const allSent = [...selectedMsgEls].every((el) => el.classList.contains("sent"));
  deleteForEveryoneBtn.style.display = allSent ? "" : "none";
  deleteMsgOverlay.classList.add("active");
});

function replaceWithDeletedNotice(msgEl, forEveryone) {
  const bubble = msgEl.querySelector(".message-bubble");
  const isSent = msgEl.classList.contains("sent");
  bubble.innerHTML = `
    <div class="deleted-msg-notice">
      <i class="bx bx-block"></i>
      <span>${forEveryone ? (isSent ? "You deleted this message" : "This message was deleted") : "You deleted this message"}</span>
    </div>
    <span class="msg-time-stamp">${bubble.querySelector(".msg-time-stamp")?.textContent || ""}</span>
  `;
  bubble.classList.add("deleted-bubble");
  msgEl.classList.remove("selected-msg");
}

deleteForEveryoneBtn.addEventListener("click", () => {
  selectedMsgEls.forEach((el) => replaceWithDeletedNotice(el, true));
  deleteMsgOverlay.classList.remove("active");
  exitMsgSelectMode();
});

deleteForMeBtn.addEventListener("click", () => {
  selectedMsgEls.forEach((el) => {
    el.style.animation = "msgOut 0.2s ease forwards";
    setTimeout(() => el.remove(), 200);
  });
  deleteMsgOverlay.classList.remove("active");
  exitMsgSelectMode();
});

cancelDeleteMsg.addEventListener("click", () => deleteMsgOverlay.classList.remove("active"));

// ===============================
// OPEN CHAT
// ===============================
function openChat(userName, initials, userId) {
  if (msgSelectMode) exitMsgSelectMode();
  hideTypingIndicator();
  clearTimeout(typingTimeout);

  currentUserId = userId;
  currentUserInitials = initials;
  currentUserName = userName;

  chatHeaderName.textContent = userName;
  chatHeaderAvatar.textContent = initials;
  chatHeaderAvatar.className = "chat-avatar " + (avatarClass[userId] || "av-purple");

  document.querySelectorAll(".chat-item").forEach((i) => i.classList.remove("active-chat"));
  const activeItem = chatList.querySelector(`[data-user-id="${userId}"]`);
  if (activeItem) {
    activeItem.classList.add("active-chat");
    activeItem.querySelector(".unread-badge")?.remove();
  }

  loadMessages(userId);
  updateBlockedState();

  noChatSelected.classList.add("hidden");
  chatView.classList.add("active");
  if (window.innerWidth <= 768) leftPanel.classList.add("hidden-mobile");

  menuDropdown.classList.remove("active");
  emojiPanel.classList.remove("active");
}

// ===============================
// BACK BUTTON
// ===============================
backButton.addEventListener("click", () => {
  if (msgSelectMode) { exitMsgSelectMode(); return; }
  chatView.classList.remove("active");
  noChatSelected.classList.remove("hidden");
  leftPanel.classList.remove("hidden-mobile");
  messageInput.value = "";
  removeReplyPreview();
  menuDropdown.classList.remove("active");
  emojiPanel.classList.remove("active");
});

// ===============================
// HEADER → PROFILE PAGE
// ===============================
chatHeaderClickable.addEventListener("click", () => {
  if (!currentUserId) return;
  localStorage.setItem("profileUserId", currentUserId);
  window.location.href = "profile.html";
});

// ===============================
// DATE HELPERS
// ===============================
function getDateLabel(dateStr) {
  const msgDate = new Date(dateStr);
  const now = new Date();
  const toDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const mDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
  const diff = Math.round((toDay - mDay) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return msgDate.toLocaleDateString("en-US", { weekday: "long" });
  return msgDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
}

function createDayDivider(label) {
  const div = document.createElement("div");
  div.className = "day-divider";
  div.innerHTML = `<span>${label}</span>`;
  return div;
}

// ===============================
// NOTIFICATION SOUND
// ===============================
function playPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

// ===============================
// LOAD MESSAGES
// ===============================
function loadMessages(userId) {
  messagesContainer.innerHTML = "";
  const messages = messageData[userId] || [];

  if (messages.length === 0 && !blockedUsers[userId]) {
    const empty = document.createElement("div");
    empty.className = "empty-chat-state";
    empty.innerHTML = `
      <div class="empty-chat-inner">
        <div class="empty-chat-emoji">👋</div>
        <h3>Say hello!</h3>
        <p>No messages yet. Start the conversation.</p>
      </div>`;
    messagesContainer.appendChild(empty);
    return;
  }

  let lastLabel = null;
  messages.forEach((msg) => {
    const label = getDateLabel(msg.date);
    if (label !== lastLabel) {
      messagesContainer.appendChild(createDayDivider(label));
      lastLabel = label;
    }
    addMessage(msg.text, msg.type, msg.time, msg.reply || null, false, msg.forwarded || false);
  });
  if (blockedUsers[userId]) appendBlockedNoticeMessages();
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ===============================
// ADD MESSAGE
// ===============================
function addMessage(text, type, time, reply = null, animate = true, forwarded = false) {
  const div = document.createElement("div");
  div.className = `message ${type}`;
  if (animate) div.style.animation = "msgIn 0.25s cubic-bezier(0.34,1.56,0.64,1)";

  const avatarHTML = type === "received"
    ? `<div class="message-avatar ${avatarClass[currentUserId] || ""}">${currentUserInitials}</div>`
    : "";

  const replyHTML = reply
    ? `<div class="reply-quote">
        <span class="reply-user">${reply.user}</span>
        <span class="reply-text">${escapeHtml(reply.text)}</span>
      </div>`
    : "";

  const forwardedHTML = forwarded
    ? `<div class="forwarded-label"><i class="bx bx-forward-big"></i> Forwarded</div>`
    : "";

  div.innerHTML = `
    ${avatarHTML}
    <div class="message-content">
      <div class="message-bubble">
        ${forwardedHTML}
        ${replyHTML}
        <div class="message-text">${escapeHtml(text)}</div>
        <button class="bubble-arrow-btn" title="Options"><i class="bx bx-chevron-down"></i></button>
        <span class="msg-time-stamp">${time}</span>
      </div>
    </div>`;

  messagesContainer.appendChild(div);

  if (type === "received" && animate) playPing();

  const bubble = div.querySelector(".message-bubble");
  const arrowBtn = div.querySelector(".bubble-arrow-btn");

  bubble.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (msgSelectMode) { toggleMsgSelect(div); return; }
    openBubbleMenu(e, div, text, type);
  });
  arrowBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (msgSelectMode) return;
    openBubbleMenu(e, div, text, type);
  });

  let touchTimer = null;
  bubble.addEventListener("touchstart", (e) => {
    if (msgSelectMode) return;
    touchTimer = setTimeout(() => openBubbleMenu(e.touches[0], div, text, type), 500);
  }, { passive: true });
  bubble.addEventListener("touchend", () => clearTimeout(touchTimer));
  bubble.addEventListener("touchmove", () => clearTimeout(touchTimer));

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ===============================
// BUBBLE CONTEXT MENU
// ===============================
let activeBubbleMenu = null;

function openBubbleMenu(e, msgEl, text, type) {
  closeAllBubbleMenus();
  const overlay = document.createElement("div");
  overlay.className = "bm-overlay";

  const emojis = ["👍", "❤️", "😂", "😮", "😢", "🙏", "+"];
  const emojiRow = emojis.map((em) => `<span class="bm-emoji">${em}</span>`).join("");

  const items = [
    { icon: "bx-reply-big",    label: "Reply",   action: "reply",   danger: false, svg: null },
    { icon: "bx-copy",         label: "Copy",    action: "copy",    danger: false, svg: null },
    { icon: "bx-forward-big",  label: "Forward", action: "forward", danger: false, svg: null },
    { icon: "bx-check-square", label: "Select",  action: "select",  danger: false, svg: null },
    { icon: "bx-trash",        label: "Delete",  action: "delete",  danger: true,  svg: null },
  ];

  overlay.innerHTML = `
    <div class="bm-backdrop"></div>
    <div class="bm-popup">
      <div class="bm-emoji-row">${emojiRow}</div>
      <div class="bm-sep"></div>
      ${items.map((i) => `
        <div class="bm-item${i.danger ? " bm-danger" : ""}" data-action="${i.action}">
          <i class="bx ${i.icon}"></i><span>${i.label}</span>
        </div>`).join("")}
    </div>`;

  document.body.appendChild(overlay);
  activeBubbleMenu = overlay;

  const popup = overlay.querySelector(".bm-popup");
  const vw = window.innerWidth, vh = window.innerHeight;
  let x = e.clientX ?? vw / 2, y = e.clientY ?? vh / 2;
  requestAnimationFrame(() => {
    const pw = popup.offsetWidth || 220, ph = popup.offsetHeight || 300;
    if (x + pw + 10 > vw) x = vw - pw - 10;
    if (y + ph + 10 > vh) y = vh - ph - 10;
    if (x < 10) x = 10;
    if (y < 10) y = 10;
    popup.style.left = x + "px";
    popup.style.top = y + "px";
    popup.style.opacity = "1";
  });

  overlay.querySelector(".bm-backdrop").addEventListener("click", closeAllBubbleMenus);

  overlay.querySelectorAll(".bm-emoji").forEach((span, idx) => {
    span.addEventListener("click", () => {
      if (idx === emojis.length - 1) { closeAllBubbleMenus(); return; }
      let reaction = msgEl.querySelector(".reaction");
      if (!reaction) {
        reaction = document.createElement("div");
        reaction.className = "reaction";
        msgEl.querySelector(".message-content").appendChild(reaction);
      }
      reaction.textContent = span.textContent;
      closeAllBubbleMenus();
    });
  });

  overlay.querySelectorAll(".bm-item").forEach((item) => {
    item.addEventListener("click", () => {
      const action = item.dataset.action;
      if (action === "copy") navigator.clipboard.writeText(text).catch(() => {});
      if (action === "delete") {
        selectedMsgEls.clear();
        selectedMsgEls.add(msgEl);
        deleteForEveryoneBtn.style.display = type === "sent" ? "" : "none";
        deleteMsgOverlay.classList.add("active");
      }
      if (action === "forward") openForwardPicker([text]);
      if (action === "reply") {
        replyData = { user: type === "sent" ? "You" : currentUserName, text };
        showReplyPreview(replyData);
        messageInput.focus();
      }
      if (action === "select") {
        closeAllBubbleMenus();
        enterMsgSelectMode(msgEl);
        return;
      }
      closeAllBubbleMenus();
    });
  });
}

function closeAllBubbleMenus() {
  if (activeBubbleMenu) { activeBubbleMenu.remove(); activeBubbleMenu = null; }
}

// Keyframe styles
const styleEl = document.createElement("style");
styleEl.textContent = `
  @keyframes msgIn  { from{opacity:0;transform:translateY(10px) scale(0.96);}to{opacity:1;transform:none;} }
  @keyframes msgOut { from{opacity:1;transform:scale(1);}to{opacity:0;transform:scale(0.8);} }
  @keyframes bmIn   { from{opacity:0;transform:scale(0.92) translateY(-6px);}to{opacity:1;transform:none;} }
  @keyframes fadeOut{ from{opacity:1;}to{opacity:0;} }
`;
document.head.appendChild(styleEl);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllBubbleMenus();
    closeContactCtx();
    if (msgSelectMode) exitMsgSelectMode();
  }
});

// ===============================
// TYPING INDICATOR
// ===============================
let typingIndicatorEl = null;
let typingTimeout = null;

function showTypingIndicator() {
  if (typingIndicatorEl) return;
  typingIndicatorEl = document.createElement("div");
  typingIndicatorEl.className = "typing-indicator";
  typingIndicatorEl.innerHTML = `
    <div class="typing-avatar ${avatarClass[currentUserId] || "av-purple"}">${currentUserInitials}</div>
    <div class="typing-bubble">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  messagesContainer.appendChild(typingIndicatorEl);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  const statusEl = document.querySelector(".chat-header-status");
  if (statusEl) {
    statusEl.dataset.prev = statusEl.textContent;
    statusEl.textContent = "typing...";
    statusEl.style.color = "#a78bfa";
  }
}

function hideTypingIndicator() {
  if (typingIndicatorEl) { typingIndicatorEl.remove(); typingIndicatorEl = null; }
  const statusEl = document.querySelector(".chat-header-status");
  if (statusEl && statusEl.dataset.prev) {
    statusEl.textContent = statusEl.dataset.prev;
    statusEl.style.color = "";
  }
}

// ===============================
// SEND MESSAGE
// ===============================
function sendMessage() {
  const text = messageInput.value.trim();
  if (!text || blockedUsers[currentUserId]) return;
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const emptyState = messagesContainer.querySelector(".empty-chat-state");
  if (emptyState) emptyState.remove();

  const allDividers = messagesContainer.querySelectorAll(".day-divider");
  const lastDivider = allDividers[allDividers.length - 1];
  if (!lastDivider || lastDivider.querySelector("span").textContent !== "Today")
    messagesContainer.appendChild(createDayDivider("Today"));

  const currentReply = replyData ? { ...replyData } : null;
  addMessage(text, "sent", time, currentReply, true);
  if (!messageData[currentUserId]) messageData[currentUserId] = [];
  messageData[currentUserId].push({ type: "sent", text, time, date: daysAgo(0), reply: currentReply });

  const item = chatList.querySelector(`[data-user-id="${currentUserId}"]`);
  if (item) item.querySelector(".chat-message").textContent = text;

  replyData = null;
  removeReplyPreview();
  messageInput.value = "";
  messageInput.focus();

  clearTimeout(typingTimeout);
  setTimeout(() => {
    if (currentUserId && !blockedUsers[currentUserId]) {
      showTypingIndicator();
      typingTimeout = setTimeout(hideTypingIndicator, 2200);
    }
  }, 600);
}

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

// ===============================
// CLOSE CHAT BUTTON (desktop arrow next to name)
// ===============================
document.getElementById("closeChatBtn").addEventListener("click", (e) => {
  e.stopPropagation(); // prevent profile navigation
  chatView.classList.remove("active");
  noChatSelected.classList.remove("hidden");
  leftPanel.classList.remove("hidden-mobile");
  document.querySelectorAll(".chat-item").forEach((i) => i.classList.remove("active-chat"));
  messageInput.value = "";
  removeReplyPreview();
  menuDropdown.classList.remove("active");
  emojiPanel.classList.remove("active");
  currentUserId = null;
});

// ===============================
// CONTACT SEARCH — filter only, NEVER auto-open
// ===============================
searchInput.addEventListener("input", (e) => {
  const term = e.target.value.toLowerCase().trim();
  const items = chatList.querySelectorAll(".chat-item");
  let visible = 0;
  items.forEach((item) => {
    const name = item.querySelector(".chat-name").textContent.toLowerCase();
    const show = name.includes(term);
    item.style.display = show ? "flex" : "none";
    if (show) visible++;
  });
  emptyContacts.style.display = visible === 0 && term.length > 0 ? "block" : "none";
});

// ===============================
// FULL EMOJI PICKER
// ===============================
const emojiCategories = {
  "😀 Smileys": ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"],
  "👋 People": ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🫀","🫁","🧠","🦷","🦴","👀","👁️","👅","👄","💋","👶","🧒","👦","👧","🧑","👱","👨","🧔","👩","🧓","👴","👵","🙍","🙎","🙅","🙆","💁","🙋","🧏","🙇","🤦","🤷"],
  "🐶 Animals": ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🙈","🙉","🙊","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷️","🦂","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🦧","🦣","🐘","🦛","🦏","🐪","🐫","🦒","🦘","🦬","🐃","🐂","🐄","🐎","🐖","🐏","🐑","🦙","🐐","🦌","🐕","🐩","🦮","🐈","🐓","🦃","🦤","🦚","🦜","🦢","🦩","🕊️","🐇","🦝","🦨","🦡","🦫","🦦","🦥","🐁","🐀","🐿️","🦔"],
  "🍎 Food": ["🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🫒","🥑","🍆","🥔","🥕","🌽","🌶️","🫑","🥒","🥬","🥦","🧄","🧅","🍄","🥜","🌰","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧈","🍳","🍲","🥘","🍜","🍝","🍠","🍢","🍣","🍤","🍙","🍚","🍛","🍥","🥮","🍡","🥟","🥠","🥡","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🫖","🍵","🍶","🍾","🍷","🍸","🍹","🍺","🍻","🥂","🥃","🫗","🥤","🧋","🧃","🧉","🧊"],
  "⚽ Activity": ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🏓","🏸","🏒","🏑","🥍","🏏","🪃","🥅","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛼","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","🤺","⛺","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🪕","🎻","🎲","♟️","🎯","🎳","🎮","🎰","🧩"],
  "🚗 Travel": ["🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🛻","🚚","🚛","🚜","🏍️","🛵","🛺","🚲","🛴","🛹","🛼","🚏","🛣️","🛤️","⛽","🚨","🚥","🚦","🚧","⚓","🛟","⛵","🛶","🚤","🛳️","⛴️","🛥️","🚢","✈️","🛩️","🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡","🛰️","🚀","🛸","🪐","🌍","🌎","🌏","🌐","🗺️","🧭","🏔️","⛰️","🌋","🗻","🏕️","🏖️","🏜️","🏝️","🏞️","🏟️","🏛️","🏗️","🧱","🏘️","🏚️","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽"],
  "💡 Objects": ["💡","🔦","🕯️","🪔","🧱","💰","💴","💵","💶","💷","💸","💳","🪙","💹","📈","📉","📊","📋","📌","📍","✂️","🗃️","🗄️","🗑️","🔒","🔓","🔏","🔐","🔑","🗝️","🔨","🪓","⛏️","⚒️","🛠️","🗡️","⚔️","🔫","🪃","🏹","🛡️","🔧","🔩","⚙️","🗜️","🔗","⛓️","🧲","🪜","🧰","💊","💉","🩸","🩹","🩺","🩻","🚪","🛋️","🪑","🚽","🪠","🚿","🛁","🪤","🧴","🧷","🧹","🧺","🧻","🧼","🫧","🧽","🧯","🛒","🚬","⚰️","🪦","⚱️","🗿","🪧","🪪"],
  "❤️ Symbols": ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉️","☸️","✡️","🔯","🕎","☯️","☦️","🛐","⛎","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","🆔","⚛️","🉑","☢️","☣️","📴","📳","🈶","🈚","🈸","🈺","🈷️","✴️","🆚","💮","🉐","㊙️","㊗️","🈴","🈵","🈹","🈲","🅰️","🅱️","🆎","🆑","🅾️","🆘","❌","⭕","🛑","⛔","📛","🚫","💯","💢","♨️","🚷","🚯","🚳","🚱","🔞","📵","🔕"],
};

let emojiPickerEl = null;

function openEmojiPicker() {
  if (emojiPickerEl) { emojiPickerEl.remove(); emojiPickerEl = null; return; }

  const picker = document.createElement("div");
  picker.className = "emoji-picker";
  picker.innerHTML = `
    <div class="ep-search-row">
      <i class="bx bx-search"></i>
      <input class="ep-search" placeholder="Search emoji..." />
    </div>
    <div class="ep-tabs">
      ${Object.keys(emojiCategories).map((cat, i) =>
        `<button class="ep-tab${i === 0 ? " active" : ""}" data-cat="${cat}">${cat.split(" ")[0]}</button>`
      ).join("")}
    </div>
    <div class="ep-body">
      ${Object.entries(emojiCategories).map(([cat, emojis], i) => `
        <div class="ep-section${i === 0 ? "" : " hidden"}" data-section="${cat}">
          <div class="ep-cat-label">${cat}</div>
          <div class="ep-grid">${emojis.map((em) => `<span class="ep-em">${em}</span>`).join("")}</div>
        </div>`).join("")}
    </div>
  `;

  const inputRect = messageInputContainer.getBoundingClientRect();
  picker.style.position = "fixed";
  picker.style.bottom = window.innerHeight - inputRect.top + 8 + "px";
  picker.style.left = inputRect.left + "px";
  picker.style.width = Math.min(320, inputRect.width) + "px";

  document.body.appendChild(picker);
  emojiPickerEl = picker;

  picker.querySelectorAll(".ep-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      picker.querySelectorAll(".ep-tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const cat = tab.dataset.cat;
      picker.querySelectorAll(".ep-section").forEach((s) => {
        s.classList.toggle("hidden", s.dataset.section !== cat);
      });
    });
  });

  picker.querySelector(".ep-search").addEventListener("input", (e) => {
    const term = e.target.value.trim().toLowerCase();
    if (!term) {
      picker.querySelectorAll(".ep-section").forEach((s, i) => s.classList.toggle("hidden", i !== 0));
      picker.querySelectorAll(".ep-tab").forEach((t, i) => t.classList.toggle("active", i === 0));
      return;
    }
    picker.querySelectorAll(".ep-tab").forEach((t) => t.classList.remove("active"));
    picker.querySelectorAll(".ep-section").forEach((s) => {
      const all = [...s.querySelectorAll(".ep-em")];
      const matches = all.filter((em) => em.textContent.includes(term) || term.length <= 2);
      s.classList.toggle("hidden", matches.length === 0);
      all.forEach((em) => (em.style.display = matches.includes(em) || !term ? "" : "none"));
    });
  });

  picker.querySelectorAll(".ep-em").forEach((em) => {
    em.addEventListener("click", () => { messageInput.value += em.textContent; messageInput.focus(); });
  });

  setTimeout(() => { document.addEventListener("click", closeEmojiPickerOutside); }, 10);
}

function closeEmojiPickerOutside(e) {
  if (emojiPickerEl && !emojiPickerEl.contains(e.target) && e.target !== emojiToggle) {
    emojiPickerEl.remove();
    emojiPickerEl = null;
    document.removeEventListener("click", closeEmojiPickerOutside);
  }
}

emojiToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  if (blockedUsers[currentUserId]) return;
  openEmojiPicker();
});

// ===============================
// MENU DROPDOWN
// ===============================
menuButton.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle("active");
});
document.addEventListener("click", (e) => {
  if (!menuButton.contains(e.target) && !menuDropdown.contains(e.target))
    menuDropdown.classList.remove("active");
});

// ===============================
// BLOCK / UNBLOCK
// ===============================
blockUserBtn.addEventListener("click", () => {
  if (blockedUsers[currentUserId]) return;
  blockedUsers[currentUserId] = true;
  saveBlocked();
  updateBlockedState();
  appendBlockedNoticeMessages();
  refreshChatList();
  menuDropdown.classList.remove("active");
});
blockNoticeUnblock.addEventListener("click", doUnblock);

function doUnblock() {
  delete blockedUsers[currentUserId];
  saveBlocked();
  updateBlockedState();
  refreshChatList();
  loadMessages(currentUserId);
}

function updateBlockedState() {
  const blocked = !!blockedUsers[currentUserId];
  blockNotice.classList.toggle("active", blocked);
  messageInputContainer.classList.toggle("disabled", blocked);
  blockUserBtn.innerHTML = blocked
    ? `<i class='bx bx-check'></i><span>User blocked</span>`
    : `<i class='bx bx-block'></i><span>Block user</span>`;
}

function appendBlockedNoticeMessages() {
  messagesContainer.appendChild(createDayDivider("Today"));
  const n = document.createElement("div");
  n.className = "system-notice";
  n.textContent = "You blocked this contact. Tap to unblock.";
  n.addEventListener("click", doUnblock);
  messagesContainer.appendChild(n);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ===============================
// REPLY PREVIEW
// ===============================
function showReplyPreview({ user, text }) {
  replyPreviewUser.textContent = user;
  replyPreviewText.textContent = text;
  replyPreviewEl.classList.add("visible");
  messageInput.focus();
}
function removeReplyPreview() {
  replyPreviewEl.classList.remove("visible");
  replyData = null;
}
closeReplyBtn.addEventListener("click", removeReplyPreview);

// ===============================
// CLEAR CHAT
// ===============================
clearChatBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.remove("active");
  confirmOverlay.classList.add("active");
});
cancelClearChat.addEventListener("click", () => confirmOverlay.classList.remove("active"));
confirmClearChat.addEventListener("click", () => {
  if (!currentUserId) return;
  messageData[currentUserId] = [];
  messagesContainer.innerHTML = "";
  const item = chatList.querySelector(`[data-user-id="${currentUserId}"]`);
  if (item) item.querySelector(".chat-message").textContent = "";
  confirmOverlay.classList.remove("active");
});

// ===============================
// FORWARD PICKER
// ===============================
function openForwardPicker(texts) {
  const contacts = [...chatList.querySelectorAll(".chat-item")].map((item) => ({
    userId: item.dataset.userId,
    name: item.querySelector(".chat-name").textContent,
    initials: item.dataset.userInitials,
    avClass: avatarClass[item.dataset.userId] || "av-purple",
  }));

  const overlay = document.createElement("div");
  overlay.className = "forward-overlay";
  overlay.innerHTML = `
    <div class="forward-modal">
      <div class="forward-header">
        <button class="forward-close"><i class="bx bx-x"></i></button>
        <h3>Forward message to</h3>
      </div>
      <div class="forward-search">
        <i class="bx bx-search"></i>
        <input type="text" placeholder="Search name..." id="forwardSearchInput" />
      </div>
      <div class="forward-list">
        ${contacts.map((c) => `
          <div class="forward-item" data-uid="${c.userId}">
            <div class="forward-check"><i class="bx bx-check"></i></div>
            <div class="chat-avatar ${c.avClass}" style="width:42px;height:42px;font-size:14px;">${c.initials}</div>
            <span>${c.name}</span>
          </div>`).join("")}
      </div>
      <button class="forward-send-btn" id="forwardSendBtn" disabled>
        <i class="bx bx-forward-big"></i>
      </button>
    </div>
  `;

  document.body.appendChild(overlay);
  const selectedFwd = new Set();

  overlay.querySelector("#forwardSearchInput").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    overlay.querySelectorAll(".forward-item").forEach((item) => {
      item.style.display = item.querySelector("span").textContent.toLowerCase().includes(term) ? "flex" : "none";
    });
  });

  overlay.querySelectorAll(".forward-item").forEach((item) => {
    item.addEventListener("click", () => {
      const uid = item.dataset.uid;
      if (selectedFwd.has(uid)) { selectedFwd.delete(uid); item.classList.remove("fwd-selected"); }
      else { selectedFwd.add(uid); item.classList.add("fwd-selected"); }
      overlay.querySelector("#forwardSendBtn").disabled = selectedFwd.size === 0;
    });
  });

  overlay.querySelector("#forwardSendBtn").addEventListener("click", () => {
    const now = new Date();
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    selectedFwd.forEach((uid) => {
      if (!messageData[uid]) messageData[uid] = [];
      texts.forEach((txt) => {
        messageData[uid].push({ type: "sent", text: txt, time, date: daysAgo(0), forwarded: true });
      });
      if (currentUserId === uid) {
        texts.forEach((txt) => addMessage(txt, "sent", time, null, true, true));
      }
      const listItem = chatList.querySelector(`[data-user-id="${uid}"]`);
      if (listItem) listItem.querySelector(".chat-message").textContent = "Forwarded: " + texts[texts.length - 1];
    });
    overlay.remove();
  });

  overlay.querySelector(".forward-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
}

// ===============================
// UTILS
// ===============================
function escapeHtml(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

// ===============================
// SWIPE RIGHT TO GO BACK (mobile)
// ===============================
let swipeStartX = 0, swipeStartY = 0;

document.addEventListener("touchstart", (e) => {
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - swipeStartX;
  const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY);
  if (dx > 80 && dy < 60 && swipeStartX < window.innerWidth * 0.4) {
    if (chatView.classList.contains("active") && window.innerWidth <= 768) {
      if (msgSelectMode) { exitMsgSelectMode(); return; }
      chatView.classList.remove("active");
      noChatSelected.classList.remove("hidden");
      leftPanel.classList.remove("hidden-mobile");
      removeReplyPreview();
      menuDropdown.classList.remove("active");
    }
  }
}, { passive: true });

// ===============================
// INIT
// ===============================
refreshChatList();
// Do NOT auto-open any chat on load — user must click a contact