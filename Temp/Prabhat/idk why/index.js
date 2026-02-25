// Fade out STUVO5 text on scroll + add parallax to loop
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;
  const heroContent = document.querySelector(".hero-content");

  // Fade out text
  if (heroContent) {
    const opacity = Math.max(0, 1 - scrolled / 300);
    const translate = scrolled * 0.3;
    heroContent.style.opacity = opacity;
    heroContent.style.transform = `translateY(${translate}px)`;
  }

  // Add parallax offset to the looping animation
  const parallaxElements = document.querySelectorAll(".grid-column");
  parallaxElements.forEach((column) => {
    const speed = parseFloat(column.getAttribute("data-speed")) || 0.3;
    const yPos = -(scrolled * speed * 0.5);
    column.style.setProperty("--parallax-offset", `${yPos}px`);
  });
});

// ============================================
// FOOTER MODALS - PRIVACY & CONTACT
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  // ---- PRIVACY MODAL ----
  const privacyModal = document.getElementById("privacyModal");
  const privacyLink = document.getElementById("privacyLink");
  const closePrivacy = document.getElementById("closePrivacy");
  const closePrivacyBtn = document.getElementById("closePrivacyBtn");

  privacyLink?.addEventListener("click", (e) => {
    e.preventDefault();
    privacyModal.classList.add("show");
    document.body.style.overflow = "hidden";
  });

  closePrivacy?.addEventListener("click", () => {
    privacyModal.classList.remove("show");
    document.body.style.overflow = "";
  });

  closePrivacyBtn?.addEventListener("click", () => {
    privacyModal.classList.remove("show");
    document.body.style.overflow = "";
  });

  window.addEventListener("click", (e) => {
    if (e.target === privacyModal) {
      privacyModal.classList.remove("show");
      document.body.style.overflow = "";
    }
  });

  // ---- CONTACT MODAL ----
  const contactModal = document.getElementById("contactModal");
  const contactLink = document.getElementById("contactLink");
  const closeContact = document.getElementById("closeContact");
  const contactStep1 = document.getElementById("contactStep1");
  const contactStep2 = document.getElementById("contactStep2");
  const contactStep3 = document.getElementById("contactStep3");
  const contactBackBtn = document.getElementById("contactBackBtn");
  const selectedTopicBadge = document.getElementById("selectedTopicBadge");
  const sendMessageBtn = document.getElementById("sendMessageBtn");
  const contactDoneBtn = document.getElementById("contactDoneBtn");
  const contactNameInput = document.getElementById("contactName");
  const contactEmailInput = document.getElementById("contactEmail");
  const contactMessageInput = document.getElementById("contactMessage");
  const contactNameError = document.getElementById("contactNameError");
  const contactEmailError = document.getElementById("contactEmailError");
  const contactMessageError = document.getElementById("contactMessageError");

  let selectedTopic = "";

  function resetContact() {
    contactStep1.style.display = "block";
    contactStep2.style.display = "none";
    contactStep3.style.display = "none";
    selectedTopic = "";
    if (selectedTopicBadge) selectedTopicBadge.textContent = "";
    if (contactNameInput) contactNameInput.value = "";
    if (contactEmailInput) contactEmailInput.value = "";
    if (contactMessageInput) contactMessageInput.value = "";
    [contactNameError, contactEmailError, contactMessageError].forEach((e) =>
      e?.classList.remove("show"),
    );
    // Clear input borders
    [contactNameInput, contactEmailInput, contactMessageInput].forEach(
      (input) => {
        if (input) input.style.borderColor = "";
      },
    );
  }

  contactLink?.addEventListener("click", (e) => {
    e.preventDefault();
    resetContact();
    contactModal.classList.add("show");
    document.body.style.overflow = "hidden";
  });

  closeContact?.addEventListener("click", () => {
    contactModal.classList.remove("show");
    document.body.style.overflow = "";
  });

  window.addEventListener("click", (e) => {
    if (e.target === contactModal) {
      contactModal.classList.remove("show");
      document.body.style.overflow = "";
    }
  });

  // Topic selection
  document.querySelectorAll(".topic-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedTopic = btn.getAttribute("data-topic");
      if (selectedTopicBadge)
        selectedTopicBadge.textContent = "📌 " + selectedTopic;
      contactStep1.style.display = "none";
      contactStep2.style.display = "block";
    });
  });

  // Back button
  contactBackBtn?.addEventListener("click", () => {
    contactStep2.style.display = "none";
    contactStep1.style.display = "block";
  });

  // Send message
  sendMessageBtn?.addEventListener("click", () => {
    let valid = true;
    [contactNameError, contactEmailError, contactMessageError].forEach((e) =>
      e?.classList.remove("show"),
    );

    // Validate name
    if (
      !contactNameInput.value.trim() ||
      contactNameInput.value.trim().length < 2
    ) {
      contactNameError.classList.add("show");
      contactNameInput.style.borderColor = "#ef4444";
      valid = false;
    } else {
      contactNameInput.style.borderColor = "";
    }

    // Validate email
    if (
      !contactEmailInput.value.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmailInput.value)
    ) {
      contactEmailError.classList.add("show");
      contactEmailInput.style.borderColor = "#ef4444";
      valid = false;
    } else {
      contactEmailInput.style.borderColor = "";
    }

    // Validate message
    if (
      !contactMessageInput.value.trim() ||
      contactMessageInput.value.trim().length < 10
    ) {
      contactMessageError.textContent =
        "Please describe your issue (at least 10 characters)";
      contactMessageError.classList.add("show");
      contactMessageInput.style.borderColor = "#ef4444";
      valid = false;
    } else {
      contactMessageInput.style.borderColor = "";
    }

    if (valid) {
      const refId = "STU-" + Date.now().toString(36).toUpperCase().slice(-6);
      const refEl = document.getElementById("refId");
      if (refEl) refEl.textContent = refId;
      contactStep2.style.display = "none";
      contactStep3.style.display = "block";
    }
  });

  // Done button
  contactDoneBtn?.addEventListener("click", () => {
    contactModal.classList.remove("show");
    document.body.style.overflow = "";
    resetContact();
  });

  // Clear errors on input
  [contactNameInput, contactEmailInput, contactMessageInput].forEach((el) => {
    el?.addEventListener("input", function () {
      this.style.borderColor = "";
      const errId = this.id + "Error";
      document.getElementById(errId)?.classList.remove("show");
    });
  });
});
