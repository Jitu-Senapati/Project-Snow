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

explorerNavBtn.addEventListener("click", () => {
  explorerNavBtn.classList.add("active");
});

// ===============================
// IMAGE CROP SYSTEM
// ===============================
let cropState = {
  type: null, // 'cover' or 'avatar'
  image: null,
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  isDragging: false,
  lastX: 0,
  lastY: 0,
};

const cropModal = document.getElementById("cropModal");
const cropCanvas = document.getElementById("cropCanvas");
const cropZoom = document.getElementById("cropZoom");
const cropOverlayRing = document.getElementById("cropOverlayRing");
const cropModalTitle = document.getElementById("cropModalTitle");
const ctx = cropCanvas.getContext("2d");

function openCropModal(imageDataUrl, type) {
  cropState.type = type;
  cropState.scale = 1;
  cropState.offsetX = 0;
  cropState.offsetY = 0;
  cropZoom.value = 1;

  cropModalTitle.textContent = type === "avatar" ? "Crop Profile Photo" : "Crop Cover Photo";

  if (type === "avatar") {
    cropCanvas.parentElement.style.aspectRatio = "1";
  } else {
    cropCanvas.parentElement.style.aspectRatio = "2/1";
  }

  const img = new Image();
  img.onload = () => {
    cropState.image = img;
    resizeCropCanvas();
    drawCrop();
    cropModal.classList.add("active");
  };
  img.src = imageDataUrl;
}

function resizeCropCanvas() {
  const container = cropCanvas.parentElement;
  const rect = container.getBoundingClientRect();
  cropCanvas.width = rect.width;
  cropCanvas.height = rect.height;
}

function drawCrop() {
  if (!cropState.image) return;
  const { image, offsetX, offsetY, scale } = cropState;
  const cw = cropCanvas.width;
  const ch = cropCanvas.height;

  const baseScale = Math.max(cw / image.width, ch / image.height);
  const totalScale = baseScale * scale;
  const drawW = image.width * totalScale;
  const drawH = image.height * totalScale;

  const minX = cw - drawW;
  const minY = ch - drawH;
  const clampedX = Math.min(0, Math.max(offsetX, minX));
  const clampedY = Math.min(0, Math.max(offsetY, minY));

  cropState.offsetX = clampedX;
  cropState.offsetY = clampedY;

  ctx.clearRect(0, 0, cw, ch);

  if (cropState.type === "avatar") {
    // Draw dimmed image everywhere
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.drawImage(image, clampedX, clampedY, drawW, drawH);
    ctx.restore();

    // Clip to circle and draw full brightness inside
    const cx = cw / 2, cy = ch / 2;
    const radius = Math.min(cw, ch) * 0.44;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(image, clampedX, clampedY, drawW, drawH);
    ctx.restore();

    // Circle border
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Grid inside circle only
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.clip();
    drawGrid(cw, ch);
    ctx.restore();

  } else {
    ctx.drawImage(image, clampedX, clampedY, drawW, drawH);

    // Border around entire canvas
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, cw - 2, ch - 2);
    ctx.restore();

    drawGrid(cw, ch);
  }
}

function drawGrid(cw, ch) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;

  // Vertical thirds
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo((cw / 3) * i, 0);
    ctx.lineTo((cw / 3) * i, ch);
    ctx.stroke();
  }
  // Horizontal thirds
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (ch / 3) * i);
    ctx.lineTo(cw, (ch / 3) * i);
    ctx.stroke();
  }

  // Corner accent brackets
  const bLen = Math.min(cw, ch) * 0.08;
  const bOff = 10;
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2.5;
  const corners = [
    [bOff, bOff, 1, 1],
    [cw - bOff, bOff, -1, 1],
    [bOff, ch - bOff, 1, -1],
    [cw - bOff, ch - bOff, -1, -1],
  ];
  corners.forEach(([x, y, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(x + dx * bLen, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * bLen);
    ctx.stroke();
  });

  ctx.restore();
}
// Zoom
cropZoom.addEventListener("input", () => {
  cropState.scale = parseFloat(cropZoom.value);
  drawCrop();
});

// Drag to pan
cropCanvas.addEventListener("mousedown", (e) => {
  cropState.isDragging = true;
  cropState.lastX = e.clientX;
  cropState.lastY = e.clientY;
});
window.addEventListener("mousemove", (e) => {
  if (!cropState.isDragging) return;
  cropState.offsetX += e.clientX - cropState.lastX;
  cropState.offsetY += e.clientY - cropState.lastY;
  cropState.lastX = e.clientX;
  cropState.lastY = e.clientY;
  drawCrop();
});
window.addEventListener("mouseup", () => { cropState.isDragging = false; });

// Touch support
cropCanvas.addEventListener("touchstart", (e) => {
  cropState.isDragging = true;
  cropState.lastX = e.touches[0].clientX;
  cropState.lastY = e.touches[0].clientY;
}, { passive: true });
cropCanvas.addEventListener("touchmove", (e) => {
  if (!cropState.isDragging) return;
  cropState.offsetX += e.touches[0].clientX - cropState.lastX;
  cropState.offsetY += e.touches[0].clientY - cropState.lastY;
  cropState.lastX = e.touches[0].clientX;
  cropState.lastY = e.touches[0].clientY;
  drawCrop();
}, { passive: true });
cropCanvas.addEventListener("touchend", () => { cropState.isDragging = false; });

// Apply crop - use clean offscreen canvas for full quality output
document.getElementById("applyCropBtn").addEventListener("click", () => {
  if (!cropState.image) return;

  const { image, offsetX, offsetY, scale, type } = cropState;
  const cw = cropCanvas.width;
  const ch = cropCanvas.height;

  // Build a clean offscreen canvas - no grid, no overlay
  const dpr = window.devicePixelRatio || 1;
  const offscreen = document.createElement("canvas");
  offscreen.width = cw * dpr;
  offscreen.height = ch * dpr;
  const octx = offscreen.getContext("2d");
  octx.scale(dpr, dpr);

  const baseScale = Math.max(cw / image.width, ch / image.height);
  const totalScale = baseScale * scale;
  const drawW = image.width * totalScale;
  const drawH = image.height * totalScale;
  const minX = cw - drawW;
  const minY = ch - drawH;
  const clampedX = Math.min(0, Math.max(cropState.offsetX, minX));
  const clampedY = Math.min(0, Math.max(cropState.offsetY, minY));

  if (type === "avatar") {
    // Clip to circle for clean circular crop
    octx.beginPath();
    octx.arc(cw / 2, ch / 2, Math.min(cw, ch) / 2, 0, Math.PI * 2);
    octx.clip();
  }
  octx.drawImage(image, clampedX, clampedY, drawW, drawH);

  const result = offscreen.toDataURL("image/png", 1.0);
  if (type === "cover") {
    applyCoverPhoto(result);
  } else if (type === "avatar") {
    applyAvatarPhoto(result);
  }
  cropModal.classList.remove("active");
});

document.getElementById("cancelCropBtn").addEventListener("click", () => {
  cropModal.classList.remove("active");
});
document.getElementById("closeCropModal").addEventListener("click", () => {
  cropModal.classList.remove("active");
});

// ===============================
// COVER PHOTO
// ===============================
const coverFileInput = document.getElementById("coverFileInput");
const changeCoverBtn = document.getElementById("changeCoverBtn");
const coverBtnText = document.getElementById("coverBtnText");
const coverPhotoImg = document.getElementById("coverPhotoImg");
const coverPhotoPlaceholder = document.getElementById("coverPhotoPlaceholder");

changeCoverBtn.addEventListener("click", () => coverFileInput.click());
coverPhotoPlaceholder.addEventListener("click", () => {
  if (document.querySelector(".own-profile").style.display !== "none") {
    coverFileInput.click();
  }
});

coverFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => openCropModal(ev.target.result, "cover");
  reader.readAsDataURL(file);
  e.target.value = "";
});

function applyCoverPhoto(dataUrl) {
  coverPhotoImg.src = dataUrl;
  coverPhotoImg.style.display = "block";
  coverPhotoPlaceholder.style.display = "none";
  coverBtnText.textContent = "Change Cover";
}

// ===============================
// AVATAR PHOTO
// ===============================
const avatarFileInput = document.getElementById("avatarFileInput");
const changeAvatarBtn = document.getElementById("changeAvatarBtn");
const profileAvatarImg = document.getElementById("profileAvatarImg");
const profileAvatarInner = document.getElementById("profileAvatarInner");

changeAvatarBtn.addEventListener("click", () => avatarFileInput.click());

// Also from edit modal
const modalUploadPicBtn = document.getElementById("modalUploadPicBtn");
if (modalUploadPicBtn) {
  modalUploadPicBtn.addEventListener("click", () => avatarFileInput.click());
}

avatarFileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => openCropModal(ev.target.result, "avatar");
  reader.readAsDataURL(file);
  e.target.value = "";
});

function applyAvatarPhoto(dataUrl) {
  profileAvatarImg.src = dataUrl;
  profileAvatarImg.style.display = "block";
  profileAvatarInner.style.display = "none";

  const modalPic = document.getElementById("modalCurrentPic");
  if (modalPic) {
    const existingImg = modalPic.querySelector("img");
    if (existingImg) existingImg.remove();
    const img = document.createElement("img");
    img.src = dataUrl;
    modalPic.appendChild(img);
  }
}

// ===============================
// EDIT PROFILE MODAL
// ===============================
const editModal = document.getElementById("editModal");
const editProfileBtn = document.querySelector(".edit-profile-btn-main");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () => editModal.classList.add("active"));
}
if (closeModal) {
  closeModal.addEventListener("click", () => editModal.classList.remove("active"));
}
if (cancelBtn) {
  cancelBtn.addEventListener("click", () => editModal.classList.remove("active"));
}
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    const name = document.getElementById("editName").value;
    const username = document.getElementById("editUsername").value;
    const bio = document.getElementById("editBio").value;

    document.querySelector(".profile-name-main").textContent = name;
    document.querySelector(".profile-username").textContent = username;
    document.querySelector(".profile-bio").textContent = bio;

    showToast("Profile updated successfully!");
    editModal.classList.remove("active");
  });
}
if (editModal) {
  editModal.addEventListener("click", (e) => {
    if (e.target === editModal) editModal.classList.remove("active");
  });
}

// ===============================
// SOCIAL LINKS
// ===============================
const socialData = {
  instagram: { label: "Instagram", placeholder: "https://instagram.com/yourhandle", prefix: "" },
  linkedin:  { label: "LinkedIn",  placeholder: "https://linkedin.com/in/yourname",  prefix: "" },
  github:    { label: "GitHub",    placeholder: "https://github.com/yourname",        prefix: "" },
  email:     { label: "Email",     placeholder: "yourname@example.com",               prefix: "mailto:" },
};

const socialValues = {
  instagram: "",
  linkedin: "",
  github: "",
  email: "",
};

const socialModal = document.getElementById("socialModal");
const socialModalTitle = document.getElementById("socialModalTitle");
const socialModalLabel = document.getElementById("socialModalLabel");
const socialModalInput = document.getElementById("socialModalInput");
const closeSocialModal = document.getElementById("closeSocialModal");
const cancelSocialBtn = document.getElementById("cancelSocialBtn");
const saveSocialBtn = document.getElementById("saveSocialBtn");

let currentSocialType = null;

document.querySelectorAll(".social-edit-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.getAttribute("data-social");
    currentSocialType = type;
    const info = socialData[type];
    socialModalTitle.textContent = "Edit " + info.label;
    socialModalLabel.textContent = info.label + " " + (type === "email" ? "Address" : "URL");
    socialModalInput.placeholder = info.placeholder;
    socialModalInput.value = socialValues[type] || "";
    socialModal.classList.add("active");
    setTimeout(() => socialModalInput.focus(), 200);
  });
});

function closeSocialModalFn() {
  socialModal.classList.remove("active");
  currentSocialType = null;
}

closeSocialModal.addEventListener("click", closeSocialModalFn);
cancelSocialBtn.addEventListener("click", closeSocialModalFn);
socialModal.addEventListener("click", (e) => {
  if (e.target === socialModal) closeSocialModalFn();
});

saveSocialBtn.addEventListener("click", () => {
  if (!currentSocialType) return;
  const val = socialModalInput.value.trim();
  socialValues[currentSocialType] = val;
  updateSocialUI(currentSocialType, val);
  closeSocialModalFn();
  showToast("Link saved!");
});

socialModalInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") saveSocialBtn.click();
});

function updateSocialUI(type, val) {
  const valEl = document.getElementById("val-" + type);
  const goEl = document.getElementById("go-" + type);
  if (!valEl || !goEl) return;

  if (val) {
    valEl.textContent = val;
    valEl.classList.remove("not-linked");
    goEl.style.display = "flex";
    const prefix = socialData[type].prefix;
    goEl.href = val.startsWith("http") || val.startsWith("mailto:") ? val : prefix + val;
  } else {
    valEl.textContent = "Not linked";
    valEl.classList.add("not-linked");
    goEl.style.display = "none";
  }
}

// Init not-linked styles
Object.keys(socialValues).forEach((type) => {
  const valEl = document.getElementById("val-" + type);
  if (valEl) valEl.classList.add("not-linked");
});

// ===============================
// NOTIFICATION DOT & PANEL
// ===============================
const notifDot = document.getElementById("notifDot");
let unreadNotifCount = 0;

function addNotifDot() {
  unreadNotifCount++;
  if (notifDot) notifDot.classList.add("visible");
}

function clearNotifDot() {
  unreadNotifCount = 0;
  if (notifDot) notifDot.classList.remove("visible");
}

// Clear All — slides out regular notifications beautifully
document.addEventListener("DOMContentLoaded", () => {
  const clearAllBtn = document.getElementById("clearAllNotifs");
  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", () => {
      const regularNotifs = document.querySelectorAll(".regular-notif");
      regularNotifs.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add("sliding-out");
          setTimeout(() => el.remove(), 430);
        }, i * 90);
      });
    });
  }

  // View All — expand panel
  const viewAllBtn = document.getElementById("notifViewAll");
  if (viewAllBtn) {
    viewAllBtn.addEventListener("click", () => {
      const panel = document.getElementById("notificationPanel");
      if (panel) panel.classList.toggle("expanded");
      viewAllBtn.textContent = panel.classList.contains("expanded")
        ? "Show less" : "View all notifications";
    });
  }

  // ===============================
  // SKELETON LOADER
  // ===============================
  const profilePage = document.getElementById("profilePage");
  if (profilePage) {
    // Hide real content briefly
    const realContent = profilePage.querySelectorAll(
      ".cover-photo-section, .profile-header-section, .profile-completion, .info-section"
    );
    realContent.forEach(el => { el.style.opacity = "0"; el.style.pointerEvents = "none"; });

    // Show skeleton
    const skeleton = document.createElement("div");
    skeleton.id = "profileSkeleton";
    skeleton.innerHTML = `
      <div style="position:relative; margin-bottom:60px;">
        <div class="skeleton skeleton-cover"></div>
        <div class="skeleton skeleton-avatar"></div>
      </div>
      <div style="padding:10px 20px 15px;">
        <div class="skeleton skeleton-name"></div>
        <div class="skeleton skeleton-username"></div>
        <div class="skeleton skeleton-bio"></div>
        <div class="skeleton skeleton-bio-2"></div>
        <div style="display:flex;gap:10px;margin-top:15px;">
          <div class="skeleton skeleton-btn"></div>
          <div class="skeleton skeleton-btn" style="max-width:40px;"></div>
        </div>
      </div>
      <div style="padding:0 20px;">
        <div class="skeleton" style="height:16px;width:80px;margin-bottom:12px;"></div>
        <div style="border-radius:16px;overflow:hidden;border:1px solid #222;">
          <div class="skeleton skeleton-social"></div>
          <div class="skeleton skeleton-social"></div>
          <div class="skeleton skeleton-social"></div>
          <div class="skeleton skeleton-social" style="border-bottom:none;"></div>
        </div>
      </div>
    `;
    profilePage.insertBefore(skeleton, profilePage.firstChild);

    // After 1.2s remove skeleton and reveal real content
    setTimeout(() => {
      skeleton.style.transition = "opacity 0.4s ease";
      skeleton.style.opacity = "0";
      setTimeout(() => {
        skeleton.remove();
        realContent.forEach(el => {
          el.style.opacity = "";
          el.style.pointerEvents = "";
        });
      }, 400);
    }, 1200);
  }
});

function addFriendRequestToPanel(name, initials) {
  const panel = document.getElementById("notificationPanel");
  if (!panel) return;

  // Don't add duplicate
  if (document.getElementById("friendReqNotifItem")) return;

  const wrapper = document.getElementById("notifItemsWrapper");
  const notifItem = document.createElement("div");
  notifItem.className = "notification-item friend-request-notif";
  notifItem.id = "friendReqNotifItem";
  notifItem.innerHTML = `
    <button class="friend-req-dismiss" id="friendReqDismiss" title="Dismiss">✕</button>
    <div class="notif-top">
      <div class="notif-avatar">${initials}</div>
      <div class="notification-text">
        <strong>${name}</strong>
        <p>sent you a friend request</p>
      </div>
    </div>
    <div class="notif-btns">
      <button class="notif-accept-btn" id="notifAcceptBtn">Accept</button>
      <button class="notif-decline-btn" id="notifDeclineBtn">Decline</button>
    </div>
  `;

  // Insert at top of wrapper
  wrapper.insertBefore(notifItem, wrapper.firstChild);
  addNotifDot();

  // Dismiss X — just removes card, request stays pending
  document.getElementById("friendReqDismiss").addEventListener("click", (e) => {
    e.stopPropagation();
    notifItem.remove();
  });

  // Accept from panel
  document.getElementById("notifAcceptBtn").addEventListener("click", () => {
    isFriends = true;
    requestPending = false;
    if (addFriendBtn) {
      addFriendBtn.className = "add-friend-btn friends";
      addFriendBtn.innerHTML = '<i class="bx bx-user-minus"></i> Unfriend';
    }
    updateMessageButton();
    // Close popup too
    closeFriendRequestPopup();
    notifItem.innerHTML = `
      <div class="notif-top">
        <div class="notif-avatar">${initials}</div>
        <div class="notification-text">
          <strong>${name}</strong>
          <p style="color:#10b981;">Friend request accepted ✓</p>
        </div>
      </div>
    `;
    showToast("You are now friends! You can now message each other.");
  });

  // Decline from panel
  document.getElementById("notifDeclineBtn").addEventListener("click", () => {
    isFriends = false;
    requestPending = false;
    if (addFriendBtn) {
      addFriendBtn.className = "add-friend-btn";
      addFriendBtn.innerHTML = '<i class="bx bx-user-plus"></i> Add Friend';
    }
    updateMessageButton();
    closeFriendRequestPopup();
    notifItem.remove();
    // Silent — no toast
  });
}

function closeFriendRequestPopup() {
  const popup = document.getElementById("friendRequestPopup");
  if (popup && popup.style.display !== "none") {
    popup.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => {
      popup.style.display = "none";
      popup.style.animation = "";
    }, 300);
  }
}

// ===============================
// ADD FRIEND / UNFRIEND LOGIC
// ===============================
const addFriendBtn = document.getElementById("addFriendBtn");
const messageBtn = document.querySelector(".message-btn");
let isFriends = false;
let requestPending = false;

function updateMessageButton() {
  if (messageBtn) {
    messageBtn.disabled = !isFriends;
    messageBtn.style.opacity = isFriends ? "1" : "0.5";
    messageBtn.style.cursor = isFriends ? "pointer" : "not-allowed";
    messageBtn.title = isFriends ? "" : "Become friends to send a message";
  }
}

if (addFriendBtn) {
  addFriendBtn.addEventListener("click", () => {
    if (isFriends) {
      // Unfriend
      if (confirm("Unfriend Prabhat Behera?")) {
        isFriends = false;
        requestPending = false;
        addFriendBtn.className = "add-friend-btn";
        addFriendBtn.innerHTML = '<i class="bx bx-user-plus"></i> Add Friend';
        updateMessageButton();
        showToast("Unfriended successfully");
      }
      return;
    }
    if (requestPending) return;

    // Send friend request
    requestPending = true;
    addFriendBtn.className = "add-friend-btn pending";
    addFriendBtn.innerHTML = '<i class="bx bx-time"></i> Pending...';
    updateMessageButton();
    showToast("Friend request sent!");

    // Simulate other person receiving — both popup AND notification panel
    setTimeout(() => {
      showFriendRequestPopup();
      addFriendRequestToPanel("Prabhat Behera", "PB");
    }, 3000);
  });
}

function showFriendRequestPopup() {
  const popup = document.getElementById("friendRequestPopup");
  if (!popup) return;

  popup.innerHTML = `
    <div class="friend-req-top">
      <div class="friend-req-avatar">PB</div>
      <div class="friend-req-info">
        <strong>Prabhat Behera</strong>
        <p>sent you a friend request</p>
      </div>
    </div>
    <div class="friend-req-actions">
      <button class="friend-req-accept" id="acceptFriendBtn">✓ Accept</button>
      <button class="friend-req-decline" id="declineFriendBtn">✗ Decline</button>
    </div>
  `;
  popup.style.display = "flex";
  popup.style.flexDirection = "column";
  popup.style.animation = "slideInRight 0.35s ease";

  // Auto-dismiss after 4 seconds — panel item stays
  const autoDismiss = setTimeout(() => {
    closeFriendRequestPopup();
  }, 4000);

  document.getElementById("acceptFriendBtn").addEventListener("click", () => {
    clearTimeout(autoDismiss);
    isFriends = true;
    requestPending = false;
    addFriendBtn.className = "add-friend-btn friends";
    addFriendBtn.innerHTML = '<i class="bx bx-user-minus"></i> Unfriend';
    updateMessageButton();
    closeFriendRequestPopup();
    // Sync panel item
    const notifItem = document.getElementById("friendReqNotifItem");
    if (notifItem) {
      notifItem.innerHTML = `
        <div class="notif-top">
          <div class="notif-avatar">PB</div>
          <div class="notification-text">
            <strong>Prabhat Behera</strong>
            <p style="color:#10b981;">Friend request accepted ✓</p>
          </div>
        </div>
      `;
    }
    showToast("You are now friends! You can now message each other.");
  });

  document.getElementById("declineFriendBtn").addEventListener("click", () => {
    clearTimeout(autoDismiss);
    isFriends = false;
    requestPending = false;
    addFriendBtn.className = "add-friend-btn";
    addFriendBtn.innerHTML = '<i class="bx bx-user-plus"></i> Add Friend';
    updateMessageButton();
    closeFriendRequestPopup();
    // Remove panel item too
    const notifItem = document.getElementById("friendReqNotifItem");
    if (notifItem) notifItem.remove();
    // Silent — no toast
  });
}

if (messageBtn) {
  messageBtn.addEventListener("click", (e) => {
    if (messageBtn.disabled) {
      e.preventDefault();
      showToast("Send a friend request first to message this person");
    } else {
      openDirectChat("Prabhat Behera", "PB");
    }
  });
  updateMessageButton();
}

function openDirectChat(name, initials) {
  const chatNav = document.querySelector('[data-page="chatPage"]');
  if (chatNav) chatNav.click();
  setTimeout(() => openChatWindow(name, initials), 100);
}

function openChatWindow(name, initials) {
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
  setTimeout(() => chatWindow.classList.add("active"), 10);

  chatWindow.querySelector(".back-to-chats").addEventListener("click", () => {
    chatWindow.classList.remove("active");
    setTimeout(() => chatWindow.remove(), 300);
  });

  const sendBtn = chatWindow.querySelector(".send-message");
  const chatInput = chatWindow.querySelector(".chat-input");
  const messagesContainer = chatWindow.querySelector(".chat-messages-container");

  function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
      const now = new Date();
      const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      const bubble = document.createElement("div");
      bubble.className = "chat-bubble sent";
      bubble.innerHTML = `<div class="bubble-content">${message}</div><div class="bubble-time">${time}</div>`;
      messagesContainer.appendChild(bubble);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      chatInput.value = "";
    }
  }
  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });
}

// ===============================
// VIEW TOGGLE (Own / Others)
// ===============================
const appLogo = document.querySelector(".app-logo");
const toggleViewBtn = document.createElement("button");
toggleViewBtn.textContent = "View as Others";
toggleViewBtn.style.cssText =
  "padding: 5px 10px; background: #a78bfa; border: none; border-radius: 5px; color: white; cursor: pointer; font-size: 10px; margin-left: 10px;";

let viewingOwnProfile = true;
toggleViewBtn.addEventListener("click", () => {
  viewingOwnProfile = !viewingOwnProfile;
  document.querySelectorAll(".own-profile").forEach(el => {
    el.style.display = viewingOwnProfile ? (el.classList.contains("profile-buttons") ? "flex" : "") : "none";
  });
  document.querySelectorAll(".other-profile").forEach(el => {
    el.style.display = viewingOwnProfile ? "none" : "flex";
  });
  // Reset friend state when toggling views
  if (!viewingOwnProfile) {
    isFriends = false;
    requestPending = false;
    if (addFriendBtn) {
      addFriendBtn.className = "add-friend-btn";
      addFriendBtn.innerHTML = '<i class="bx bx-user-plus"></i> Add Friend';
    }
    updateMessageButton();
  }
  toggleViewBtn.textContent = viewingOwnProfile ? "View as Others" : "View as Me";
});
appLogo.appendChild(toggleViewBtn);

// ===============================
// SHARE PROFILE
// ===============================
const shareProfileBtn = document.querySelector(".share-profile-btn");
if (shareProfileBtn) {
  shareProfileBtn.addEventListener("click", showShareModal);
}

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
          <div class="share-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);"><i class="bx bx-link"></i></div>
          <span>Copy Link</span>
        </div>
        <div class="share-option" data-type="whatsapp">
          <div class="share-icon" style="background: #25D366;"><i class="bx bxl-whatsapp"></i></div>
          <span>WhatsApp</span>
        </div>
        <div class="share-option" data-type="facebook">
          <div class="share-icon" style="background: #1877F2;"><i class="bx bxl-facebook"></i></div>
          <span>Facebook</span>
        </div>
        <div class="share-option" data-type="twitter">
          <div class="share-icon" style="background: #1DA1F2;"><i class="bx bxl-twitter"></i></div>
          <span>Twitter</span>
        </div>
        <div class="share-option" data-type="linkedin">
          <div class="share-icon" style="background: #0A66C2;"><i class="bx bxl-linkedin"></i></div>
          <span>LinkedIn</span>
        </div>
        <div class="share-option" data-type="email">
          <div class="share-icon" style="background: #EA4335;"><i class="bx bx-envelope"></i></div>
          <span>Email</span>
        </div>
      </div>
      <div class="share-link-container">
        <input type="text" class="share-link-input" value="https://stuvo.app/profile/Prabhat4a" readonly />
        <button class="copy-link-btn"><i class="bx bx-copy"></i></button>
      </div>
    </div>
  `;
  document.body.appendChild(shareModal);
  setTimeout(() => shareModal.classList.add("active"), 10);

  shareModal.querySelector(".close-share-modal").addEventListener("click", () => {
    shareModal.classList.remove("active");
    setTimeout(() => shareModal.remove(), 300);
  });
  shareModal.addEventListener("click", (e) => {
    if (e.target === shareModal) {
      shareModal.classList.remove("active");
      setTimeout(() => shareModal.remove(), 300);
    }
  });
  shareModal.querySelectorAll(".share-option").forEach((option) => {
    option.addEventListener("click", () => handleShare(option.getAttribute("data-type")));
  });

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

function handleShare(type) {
  const profileUrl = "https://stuvo.app/profile/Prabhat4a";
  const message = `Check out Prabhat Behera's profile on STUVO!`;
  switch (type) {
    case "copy": navigator.clipboard.writeText(profileUrl); showToast("Profile link copied!"); break;
    case "whatsapp": window.open(`https://wa.me/?text=${encodeURIComponent(message + " " + profileUrl)}`, "_blank"); break;
    case "facebook": window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`, "_blank"); break;
    case "twitter": window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(profileUrl)}`, "_blank"); break;
    case "linkedin": window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`, "_blank"); break;
    case "email": window.location.href = `mailto:?subject=${encodeURIComponent("Check out this STUVO profile")}&body=${encodeURIComponent(message + "\n\n" + profileUrl)}`; break;
  }
}

// ===============================
// TOAST
// ===============================
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.innerHTML = `<i class="bx bx-check-circle"></i><span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("active"), 10);
  setTimeout(() => {
    toast.classList.remove("active");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===============================
// PROFILE PHOTO VIEWER
// ===============================
const photoViewerOverlay = document.getElementById("photoViewerOverlay");
const photoViewerClose = document.getElementById("photoViewerClose");
const photoViewerImg = document.getElementById("photoViewerImg");
const photoViewerAvatar = document.getElementById("photoViewerAvatar");
const profileAvatarRingEl = document.getElementById("profileAvatarRing");

if (profileAvatarRingEl) {
  profileAvatarRingEl.style.cursor = "pointer";
  profileAvatarRingEl.addEventListener("click", () => {
    const currentImg = document.getElementById("profileAvatarImg");
    if (currentImg && currentImg.style.display !== "none" && currentImg.src) {
      // Has a real photo
      photoViewerImg.src = currentImg.src;
      photoViewerImg.style.display = "block";
      photoViewerAvatar.style.display = "none";
    } else {
      // Show initials avatar
      photoViewerImg.style.display = "none";
      photoViewerAvatar.style.display = "flex";
      photoViewerAvatar.textContent = document.getElementById("profileAvatarInner").textContent;
    }
    photoViewerOverlay.classList.add("active");
  });
}

if (photoViewerClose) {
  photoViewerClose.addEventListener("click", () => {
    photoViewerOverlay.classList.remove("active");
  });
}

if (photoViewerOverlay) {
  photoViewerOverlay.addEventListener("click", (e) => {
    if (e.target === photoViewerOverlay) {
      photoViewerOverlay.classList.remove("active");
    }
  });
}

// ===============================
// MORE BUTTON DROPDOWN
// ===============================
const moreBtn = document.querySelector(".more-btn");
const moreDropdown = document.getElementById("moreDropdown");

if (moreBtn && moreDropdown) {
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = moreBtn.getBoundingClientRect();
    moreDropdown.style.top = (rect.top - moreDropdown.offsetHeight - 8) + "px";
    moreDropdown.style.left = (rect.right - 180) + "px";
    moreDropdown.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!moreDropdown.contains(e.target) && e.target !== moreBtn) {
      moreDropdown.classList.remove("active");
    }
  });
}

// ===============================
// BLOCK USER
// ===============================
const blockModal = document.getElementById("blockModal");
const blockUserBtn = document.getElementById("blockUserBtn");
const cancelBlockBtn = document.getElementById("cancelBlockBtn");
const confirmBlockBtn = document.getElementById("confirmBlockBtn");
let isBlocked = false;

if (blockUserBtn) {
  blockUserBtn.addEventListener("click", () => {
    moreDropdown.classList.remove("active");
    blockModal.classList.add("active");
  });
}

if (cancelBlockBtn) {
  cancelBlockBtn.addEventListener("click", () => blockModal.classList.remove("active"));
}

if (blockModal) {
  blockModal.addEventListener("click", (e) => {
    if (e.target === blockModal) blockModal.classList.remove("active");
  });
}

if (confirmBlockBtn) {
  confirmBlockBtn.addEventListener("click", () => {
    isBlocked = true;
    blockModal.classList.remove("active");

    // Hide other-profile buttons
    const otherProfileBtns = document.querySelector(".other-profile");
    if (otherProfileBtns) otherProfileBtns.style.display = "none";

    // Hide social links section
    const infoSection = document.querySelector(".info-section");
    if (infoSection) infoSection.style.display = "none";

    // Hide friend request popup if visible
    const popup = document.getElementById("friendRequestPopup");
    if (popup) popup.style.display = "none";

    // Reset friend state
    isFriends = false;
    requestPending = false;

    // Show Instagram-style blocked state
    const existingBlocked = document.getElementById("blockedState");
    if (!existingBlocked) {
      const blockedState = document.createElement("div");
      blockedState.id = "blockedState";
      blockedState.className = "blocked-state";
      blockedState.innerHTML = `
        <div class="blocked-top-bar">
          <button class="unblock-top-btn" id="unblockTopBtn">Unblock</button>
        </div>
        <div class="blocked-body">
          <div class="blocked-icon"><i class="bx bx-block"></i></div>
          <h2>You've blocked this account</h2>
          <p>Unblock this account to see their profile and connect with them. When you unblock them, they'll also be able to find your profile and message you again.</p>
        </div>
      `;
      const profileHeader = document.querySelector(".profile-header-section");
      profileHeader.after(blockedState);

      document.getElementById("unblockTopBtn").addEventListener("click", () => {
        isBlocked = false;
        blockedState.remove();
        if (otherProfileBtns) otherProfileBtns.style.display = "flex";
        if (infoSection) infoSection.style.display = "";
        updateMessageButton();
        showToast("User unblocked");
      });
    }

    showToast("User blocked");
  });
}

// ===============================
// REPORT USER
// ===============================
const reportModal = document.getElementById("reportModal");
const reportUserBtn = document.getElementById("reportUserBtn");
const cancelReportBtn = document.getElementById("cancelReportBtn");
const submitReportBtn = document.getElementById("submitReportBtn");
let selectedReason = null;
let hasReported = false;

if (reportUserBtn) {
  reportUserBtn.addEventListener("click", () => {
    if (hasReported) {
      showToast("You have already reported this profile");
      moreDropdown.classList.remove("active");
      return;
    }
    moreDropdown.classList.remove("active");
    // Reset state
    selectedReason = null;
    submitReportBtn.disabled = true;
    document.querySelectorAll(".report-reason").forEach(r => r.classList.remove("selected"));
    const otherInput = document.getElementById("reportOtherInput");
    if (otherInput) otherInput.style.display = "none";
    const otherText = document.getElementById("reportOtherText");
    if (otherText) otherText.value = "";
    reportModal.classList.add("active");
  });
}

if (cancelReportBtn) {
  cancelReportBtn.addEventListener("click", () => reportModal.classList.remove("active"));
}

if (reportModal) {
  reportModal.addEventListener("click", (e) => {
    if (e.target === reportModal) reportModal.classList.remove("active");
  });
}

document.querySelectorAll(".report-reason").forEach((reason) => {
  reason.addEventListener("click", () => {
    document.querySelectorAll(".report-reason").forEach(r => r.classList.remove("selected"));
    reason.classList.add("selected");
    selectedReason = reason.getAttribute("data-reason");

    // Show textarea only for "other"
    const otherInput = document.getElementById("reportOtherInput");
    if (otherInput) {
      otherInput.style.display = selectedReason === "other" ? "block" : "none";
      if (selectedReason === "other") {
        // Only enable submit when they type something
        submitReportBtn.disabled = true;
        const otherText = document.getElementById("reportOtherText");
        otherText.value = "";
        otherText.addEventListener("input", () => {
          submitReportBtn.disabled = otherText.value.trim().length === 0;
        });
      } else {
        submitReportBtn.disabled = false;
      }
    } else {
      submitReportBtn.disabled = false;
    }
  });
});

if (submitReportBtn) {
  submitReportBtn.addEventListener("click", () => {
    if (!selectedReason) return;
    hasReported = true;
    reportModal.classList.remove("active");

    // Gray out report option
    if (reportUserBtn) {
      reportUserBtn.style.opacity = "0.4";
      reportUserBtn.style.pointerEvents = "none";
    }

    showToast("Report submitted. We'll review this profile within 24 hours.");
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const menuToggle = document.getElementById("menuToggle");
  const menuPanel = document.getElementById("menuPanel");
  const notificationToggle = document.getElementById("notificationToggle");
  const notificationPanel = document.getElementById("notificationPanel");

  if (menuToggle && menuPanel) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (notificationPanel) notificationPanel.classList.remove("active");
      menuPanel.classList.toggle("active");
    });
  }
  if (notificationToggle && notificationPanel) {
    notificationToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (menuPanel) menuPanel.classList.remove("active");
      notificationPanel.classList.toggle("active");
      // Clear dot when user opens the panel
      if (notificationPanel.classList.contains("active")) {
        clearNotifDot();
      }
    });
  }
  document.addEventListener("click", function (e) {
    if (menuPanel && !menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
      menuPanel.classList.remove("active");
    }
    if (notificationPanel && !notificationPanel.contains(e.target) && !notificationToggle.contains(e.target)) {
      notificationPanel.classList.remove("active");
    }
  });
});