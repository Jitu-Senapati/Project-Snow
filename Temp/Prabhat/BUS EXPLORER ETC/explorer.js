// Navigation Logic
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

// Profile Modal Logic
const editModal = document.getElementById("editModal");
const editProfileBtn = document.querySelector(".edit-profile-btn-main");
const closeModal = document.getElementById("closeModal");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

if (editProfileBtn) {
  editProfileBtn.addEventListener("click", () =>
    editModal.classList.add("active")
  );
}
if (closeModal) {
  closeModal.addEventListener("click", () =>
    editModal.classList.remove("active")
  );
}
if (cancelBtn) {
  cancelBtn.addEventListener("click", () =>
    editModal.classList.remove("active")
  );
}
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    alert("Profile updated successfully!");
    editModal.classList.remove("active");
  });
}

// Follow Button Logic
const followBtn = document.getElementById("followBtn");
let isFollowing = false;
if (followBtn) {
  followBtn.addEventListener("click", () => {
    isFollowing = !isFollowing;
    followBtn.innerHTML = isFollowing
      ? '<i class="bx bx-check"></i> Following'
      : '<i class="bx bx-plus"></i> Follow';
    followBtn.style.background = isFollowing ? "#2a2a2a" : "#a78bfa";
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
