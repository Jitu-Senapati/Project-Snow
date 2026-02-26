document.addEventListener("DOMContentLoaded", function () {
  // ---- ELEMENTS ----
  const loginForm = document.getElementById("loginForm");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  const registerForm = document.getElementById("registerForm");
  const registerEmail = document.getElementById("registerEmail");
  const registerPassword = document.getElementById("registerPassword");
  const registerUsername = document.getElementById("registerUsername");
  const registerPhone = document.getElementById("registerPhone");
  const registerEmailError = document.getElementById("registerEmailError");
  const registerPasswordError = document.getElementById(
    "registerPasswordError",
  );
  const registerUsernameError = document.getElementById(
    "registerUsernameError",
  );
  const registerPhoneError = document.getElementById("registerPhoneError");

  const termsCheckbox = document.getElementById("termsCheckbox");
  const termsLink = document.getElementById("termsLink");
  const termsModal = document.getElementById("termsModal");
  const closeTerms = document.getElementById("closeTerms");
  const acceptTerms = document.getElementById("acceptTerms");
  const rememberDiv = document.querySelector(".remember");

  const creatAccBtn = document.querySelector(".creat-acc");
  const loginAccBtn = document.querySelector(".Login-acc");
  const objectsLogin = document.querySelector(".objects");
  const objectsRegister = document.querySelector(".objects-register");

  const toggleLoginPassword = document.getElementById("toggleLoginPassword");
  const toggleRegisterPassword = document.getElementById(
    "toggleRegisterPassword",
  );

  const verifyEmailBtn = document.getElementById("verifyEmailBtn");
  const verifyPhoneBtn = document.getElementById("verifyPhoneBtn");
  const verifyModal = document.getElementById("verifyModal");
  const closeVerify = document.getElementById("closeVerify");
  const verifyCodeInput = document.getElementById("verifyCodeInput");
  const verifySubmitBtn = document.getElementById("verifySubmitBtn");
  const verifyModalTitle = document.getElementById("verifyModalTitle");
  const verifyTarget = document.getElementById("verifyTarget");
  const verifyCodeError = document.getElementById("verifyCodeError");
  const countryCodeSpan = document.querySelector(".country-code");

  // ---- STATE ----
  let emailVerified = false;
  let phoneVerified = false;
  let currentVerificationType = null;
  let generatedVerifyCode = null;

  // Expose to outer scope so verification form can access
  window._loginState = {
    get emailVerified() {
      return emailVerified;
    },
    get phoneVerified() {
      return phoneVerified;
    },
    get objectsLogin() {
      return objectsLogin;
    },
    get objectsRegister() {
      return objectsRegister;
    },
    get registerForm() {
      return registerForm;
    },
    resetVerifyBtns() {
      emailVerified = false;
      phoneVerified = false;
      if (verifyEmailBtn) {
        verifyEmailBtn.textContent = "Verify";
        verifyEmailBtn.disabled = false;
      }
      if (verifyPhoneBtn) {
        verifyPhoneBtn.textContent = "Verify";
        verifyPhoneBtn.disabled = false;
      }
    },
  };

  // ---- HELPERS ----
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  function validatePhone(phone) {
    return /^\d{10}$/.test(phone);
  }
  function validateUsername(username) {
    if (!username) return { valid: false, message: "Please enter a username" };
    if (!/^[a-zA-Z]/.test(username))
      return { valid: false, message: "Username must start with a letter" };
    if (/\s/.test(username))
      return { valid: false, message: "Username cannot contain spaces" };
    if (username.length > 9)
      return { valid: false, message: "Username max 9 characters" };
    return { valid: true };
  }

  // ---- PASSWORD TOGGLE ----
  toggleLoginPassword?.addEventListener("click", function () {
    const isPass = loginPassword.getAttribute("type") === "password";
    loginPassword.setAttribute("type", isPass ? "text" : "password");
    this.classList.toggle("bx-hide");
    this.classList.toggle("bx-show");
  });

  toggleRegisterPassword?.addEventListener("click", function () {
    const isPass = registerPassword.getAttribute("type") === "password";
    registerPassword.setAttribute("type", isPass ? "text" : "password");
    this.classList.toggle("bx-hide");
    this.classList.toggle("bx-show");
  });

  // ---- TOGGLE LOGIN / REGISTER ----
  creatAccBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    objectsLogin.classList.add("slide-up-out");
    setTimeout(() => {
      objectsLogin.style.display = "none";
      objectsLogin.classList.remove("slide-up-out");
      objectsRegister.style.display = "block";
      objectsRegister.classList.add("slide-up-in");
      setTimeout(() => objectsRegister.classList.remove("slide-up-in"), 400);
    }, 300);
    registerForm?.reset();
    emailVerified = false;
    phoneVerified = false;
    if (verifyEmailBtn) {
      verifyEmailBtn.textContent = "Verify";
      verifyEmailBtn.disabled = false;
    }
    if (verifyPhoneBtn) {
      verifyPhoneBtn.textContent = "Verify";
      verifyPhoneBtn.disabled = false;
    }
    [
      registerEmailError,
      registerPasswordError,
      registerUsernameError,
      registerPhoneError,
    ].forEach((el) => el?.classList.remove("show"));
  });

  loginAccBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    objectsRegister.classList.add("slide-down-out");
    setTimeout(() => {
      objectsRegister.style.display = "none";
      objectsRegister.classList.remove("slide-down-out");
      objectsLogin.style.display = "block";
      objectsLogin.classList.add("slide-down-in");
      setTimeout(() => objectsLogin.classList.remove("slide-down-in"), 400);
    }, 300);
    loginForm?.reset();
    [emailError, passwordError].forEach((el) => el?.classList.remove("show"));
  });

  // ---- TERMS MODAL ----
  termsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    termsModal.classList.add("show");
  });
  closeTerms?.addEventListener("click", () =>
    termsModal.classList.remove("show"),
  );
  acceptTerms?.addEventListener("click", () => {
    termsCheckbox.checked = true;
    termsModal.classList.remove("show");
    rememberDiv.classList.remove("blink-error");
  });
  termsCheckbox?.addEventListener("change", () =>
    rememberDiv.classList.remove("blink-error"),
  );

  window.addEventListener("click", (e) => {
    if (e.target === termsModal) termsModal.classList.remove("show");
    if (e.target === verifyModal) verifyModal.classList.remove("show");
  });

  // ---- OTP MODAL ----
  function openVerifyModal(type) {
    currentVerificationType = type;
    if (type === "email") {
      if (!validateEmail(registerEmail.value.trim())) {
        registerEmailError.textContent = "Enter a valid email first";
        registerEmailError.classList.add("show");
        return;
      }
      verifyModalTitle.textContent = "Verify Email";
      verifyTarget.textContent = registerEmail.value.trim();
    }
    if (type === "phone") {
      if (!validatePhone(registerPhone.value.trim())) {
        registerPhoneError.textContent = "Enter a valid 10-digit number first";
        registerPhoneError.classList.add("show");
        return;
      }
      verifyModalTitle.textContent = "Verify Phone";
      verifyTarget.textContent =
        (countryCodeSpan?.textContent || "") + " " + registerPhone.value.trim();
    }
    generatedVerifyCode = "123456";
    verifyModal.classList.add("show");
    verifyCodeInput.value = "";
    verifyCodeInput.classList.remove("error");
    verifyCodeError.classList.remove("show");
    setTimeout(() => verifyCodeInput.focus(), 100);
  }

  function verifyCode() {
    const entered = verifyCodeInput.value.trim();
    if (!entered) {
      verifyCodeError.textContent = "Please enter the code";
      verifyCodeError.classList.add("show");
      verifyCodeInput.classList.add("error");
      return;
    }
    if (entered !== generatedVerifyCode) {
      verifyCodeError.textContent = "Incorrect code. Try: 123456";
      verifyCodeError.classList.add("show");
      verifyCodeInput.classList.add("error");
      setTimeout(() => verifyCodeInput.classList.remove("error"), 500);
      return;
    }
    if (currentVerificationType === "email") {
      emailVerified = true;
      verifyEmailBtn.textContent = "Verified ✓";
      verifyEmailBtn.disabled = true;
      registerEmailError.classList.remove("show");
    }
    if (currentVerificationType === "phone") {
      phoneVerified = true;
      verifyPhoneBtn.textContent = "Verified ✓";
      verifyPhoneBtn.disabled = true;
      registerPhoneError.classList.remove("show");
    }
    verifyModal.classList.remove("show");
  }

  verifyEmailBtn?.addEventListener("click", () => openVerifyModal("email"));
  verifyPhoneBtn?.addEventListener("click", () => openVerifyModal("phone"));
  verifySubmitBtn?.addEventListener("click", verifyCode);
  closeVerify?.addEventListener("click", () =>
    verifyModal.classList.remove("show"),
  );
  verifyCodeInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") verifyCode();
  });

  registerEmail?.addEventListener("input", () => {
    if (emailVerified) {
      emailVerified = false;
      verifyEmailBtn.textContent = "Verify";
      verifyEmailBtn.disabled = false;
    }
    registerEmailError.classList.remove("show");
  });

  registerPhone?.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
    if (phoneVerified) {
      phoneVerified = false;
      verifyPhoneBtn.textContent = "Verify";
      verifyPhoneBtn.disabled = false;
    }
    registerPhoneError.classList.remove("show");
  });

  [loginEmail, loginPassword, registerUsername, registerPassword].forEach(
    (el) => {
      el?.addEventListener("input", function () {
        const err = this.closest(".input-box")?.querySelector(".error-message");
        if (err) err.classList.remove("show");
        this.classList.remove("error");
      });
    },
  );

  // ---- LOGIN ----
  loginForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;
    emailError.classList.remove("show");
    passwordError.classList.remove("show");

    if (!loginEmail.value.trim()) {
      emailError.textContent = "Please enter your email";
      emailError.classList.add("show");
      valid = false;
    } else if (!validateEmail(loginEmail.value.trim())) {
      emailError.textContent = "Please enter a valid email";
      emailError.classList.add("show");
      valid = false;
    }
    if (!loginPassword.value) {
      passwordError.textContent = "Please enter your password";
      passwordError.classList.add("show");
      valid = false;
    } else if (loginPassword.value.length < 6) {
      passwordError.textContent = "Password must be at least 6 characters";
      passwordError.classList.add("show");
      valid = false;
    }
    if (valid) window.location.href = "app.html";
  });

  // ---- REGISTER ----
  window.registeredUserData = {};

  registerForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    [
      registerEmailError,
      registerPasswordError,
      registerUsernameError,
      registerPhoneError,
    ].forEach((el) => el?.classList.remove("show"));
    [registerEmail, registerPassword, registerUsername, registerPhone].forEach(
      (el) => el?.classList.remove("error"),
    );

    const userCheck = validateUsername(registerUsername.value.trim());
    if (!userCheck.valid) {
      registerUsernameError.textContent = userCheck.message;
      registerUsernameError.classList.add("show");
      registerUsername.classList.add("error");
      valid = false;
    }
    if (!registerEmail.value.trim()) {
      registerEmailError.textContent = "Please enter your email";
      registerEmailError.classList.add("show");
      registerEmail.classList.add("error");
      valid = false;
    } else if (!validateEmail(registerEmail.value.trim())) {
      registerEmailError.textContent = "Please enter a valid email";
      registerEmailError.classList.add("show");
      registerEmail.classList.add("error");
      valid = false;
    } else if (!emailVerified) {
      registerEmailError.textContent = "Please verify your email first";
      registerEmailError.classList.add("show");
      registerEmail.classList.add("error");
      valid = false;
    }
    if (!registerPhone.value.trim()) {
      registerPhoneError.textContent = "Please enter your phone number";
      registerPhoneError.classList.add("show");
      registerPhone.classList.add("error");
      valid = false;
    } else if (!validatePhone(registerPhone.value.trim())) {
      registerPhoneError.textContent = "Please enter a valid 10-digit number";
      registerPhoneError.classList.add("show");
      registerPhone.classList.add("error");
      valid = false;
    } else if (!phoneVerified) {
      registerPhoneError.textContent = "Please verify your phone number first";
      registerPhoneError.classList.add("show");
      registerPhone.classList.add("error");
      valid = false;
    }
    if (!registerPassword.value) {
      registerPasswordError.textContent = "Please enter your password";
      registerPasswordError.classList.add("show");
      registerPassword.classList.add("error");
      valid = false;
    } else if (registerPassword.value.length < 6) {
      registerPasswordError.textContent =
        "Password must be at least 6 characters";
      registerPasswordError.classList.add("show");
      registerPassword.classList.add("error");
      valid = false;
    }
    if (!termsCheckbox.checked) {
      rememberDiv.classList.add("blink-error");
      setTimeout(() => rememberDiv.classList.remove("blink-error"), 1600);
      valid = false;
    }
    if (valid) {
      window.registeredUserData = {
        email: registerEmail.value,
        password: registerPassword.value,
        username: registerUsername.value,
        phone: registerPhone.value,
      };
      document.getElementById("authSection").style.display = "none";
      document.getElementById("verificationSection").style.display = "flex";
    }
  });

  // ---- PRIVACY MODAL ----
  const privacyModal = document.getElementById("privacyModal");
  const privacyLink = document.getElementById("privacyLink");
  const closePrivacy = document.getElementById("closePrivacy");
  const closePrivacyBtn = document.getElementById("closePrivacyBtn");

  privacyLink?.addEventListener("click", (e) => {
    e.preventDefault();
    privacyModal.classList.add("show");
  });
  closePrivacy?.addEventListener("click", () =>
    privacyModal.classList.remove("show"),
  );
  closePrivacyBtn?.addEventListener("click", () =>
    privacyModal.classList.remove("show"),
  );
  window.addEventListener("click", (e) => {
    if (e.target === privacyModal) privacyModal.classList.remove("show");
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
  }

  contactLink?.addEventListener("click", (e) => {
    e.preventDefault();
    resetContact();
    contactModal.classList.add("show");
  });
  closeContact?.addEventListener("click", () =>
    contactModal.classList.remove("show"),
  );
  window.addEventListener("click", (e) => {
    if (e.target === contactModal) contactModal.classList.remove("show");
  });

  document.querySelectorAll(".topic-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedTopic = btn.getAttribute("data-topic");
      if (selectedTopicBadge)
        selectedTopicBadge.textContent = "📌 " + selectedTopic;
      contactStep1.style.display = "none";
      contactStep2.style.display = "block";
    });
  });

  contactBackBtn?.addEventListener("click", () => {
    contactStep2.style.display = "none";
    contactStep1.style.display = "block";
  });

  sendMessageBtn?.addEventListener("click", () => {
    let valid = true;
    [contactNameError, contactEmailError, contactMessageError].forEach((e) =>
      e?.classList.remove("show"),
    );
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

  contactDoneBtn?.addEventListener("click", () => {
    contactModal.classList.remove("show");
    resetContact();
  });

  [contactNameInput, contactEmailInput, contactMessageInput].forEach((el) => {
    el?.addEventListener("input", function () {
      this.style.borderColor = "";
      const errId = this.id + "Error";
      document.getElementById(errId)?.classList.remove("show");
    });
  });
}); // end DOMContentLoaded

// ============================================
// VERIFICATION PAGE
// ============================================

(function () {
  // Simulated existing users
  const existingUsers = [
    {
      name: "John Doe",
      roll: "CS2024001",
      email: "john@gmail.com",
      phone: "9876543210",
    },
    {
      name: "Jane Smith",
      roll: "EC2024002",
      email: "jane@gmail.com",
      phone: "8765432109",
    },
    {
      name: "Mike Johnson",
      roll: "EE2024003",
      email: "mike@yahoo.com",
      phone: "7654321098",
    },
  ];

  function validatePhone(phone) {
    return /^[6-9]\d{9}$/.test(phone);
  }

  // Roll number is now optional — only check duplicates if a value was entered
  function checkDuplicates(name, roll, email, phone) {
    const duplicates = [];
    for (let user of existingUsers) {
      if (user.name.toLowerCase() === name.toLowerCase())
        duplicates.push("Name");
      // Only check roll number duplicate if a roll number was provided
      if (roll && user.roll.toLowerCase() === roll.toLowerCase())
        duplicates.push("Roll Number");
      if (user.email.toLowerCase() === email.toLowerCase())
        duplicates.push("Email");
      if (user.phone === phone) duplicates.push("Phone Number");
    }
    return duplicates;
  }

  // Wait for DOM
  document.addEventListener("DOMContentLoaded", function () {
    const verificationForm = document.getElementById("verificationForm");
    const verifyName = document.getElementById("verifyName");
    const verifyRoll = document.getElementById("verifyRoll");
    const verifyBranch = document.getElementById("verifyBranch");
    const verifyYear = document.getElementById("verifyYear");
    const verifyPhoto = document.getElementById("verifyPhoto");
    const avatarCircle = document.getElementById("avatarCircle");
    const avatarPlaceholder = document.getElementById("avatarPlaceholder");
    const avatarPreviewImg = document.getElementById("avatarPreviewImg");
    const backToLogin = document.getElementById("backToLogin");

    const verifyNameError = document.getElementById("verifyNameError");
    const verifyRollError = document.getElementById("verifyRollError");
    const verifyBranchError = document.getElementById("verifyBranchError");
    const verifyYearError = document.getElementById("verifyYearError");

    if (!verificationForm) return;

    // ---- AVATAR UPLOAD ----
    let uploadedFile = null;

    avatarCircle?.addEventListener("click", () => {
      verifyPhoto.click();
    });

    verifyPhoto?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleFileUpload(file);
    });

    function handleFileUpload(file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }
      uploadedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreviewImg.src = e.target.result;
        avatarPreviewImg.style.display = "block";
        if (avatarPlaceholder) avatarPlaceholder.style.display = "none";
      };
      reader.readAsDataURL(file);
    }

    function removePhoto() {
      uploadedFile = null;
      if (verifyPhoto) verifyPhoto.value = "";
      if (avatarPreviewImg) {
        avatarPreviewImg.src = "";
        avatarPreviewImg.style.display = "none";
      }
      if (avatarPlaceholder) avatarPlaceholder.style.display = "flex";
    }

    window.removePhoto = removePhoto;

    // ---- BACK TO LOGIN ----
    backToLogin?.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("verificationSection").style.display = "none";
      document.getElementById("authSection").style.display = "flex";

      verificationForm.reset();
      removePhoto();

      // Clear errors
      [
        verifyNameError,
        verifyRollError,
        verifyBranchError,
        verifyYearError,
      ].forEach((err) => err?.classList.remove("show"));
      [verifyName, verifyRoll, verifyBranch, verifyYear].forEach((inp) =>
        inp?.classList.remove("error"),
      );

      // Reset register verify buttons via shared state
      if (window._loginState) window._loginState.resetVerifyBtns();
    });

    // ---- INPUT CLEAR ERRORS ----
    [verifyName, verifyRoll, verifyBranch, verifyYear].forEach((el) => {
      el?.addEventListener("input", function () {
        this.classList.remove("error");
        const errEl = document.getElementById(this.id + "Error");
        if (errEl) errEl.classList.remove("show");
      });
    });

    // ---- FORM SUBMIT ----
    verificationForm.addEventListener("submit", (e) => {
      e.preventDefault();

      let isValid = true;

      // Clear previous errors
      [
        verifyNameError,
        verifyRollError,
        verifyBranchError,
        verifyYearError,
      ].forEach((err) => err?.classList.remove("show"));
      [verifyName, verifyRoll, verifyBranch, verifyYear].forEach((inp) =>
        inp?.classList.remove("error"),
      );

      // Validate name (required)
      if (!verifyName.value.trim()) {
        verifyNameError.textContent = "Please enter your full name";
        verifyNameError.classList.add("show");
        verifyName.classList.add("error");
        isValid = false;
      } else if (verifyName.value.trim().length < 3) {
        verifyNameError.textContent = "Name must be at least 3 characters";
        verifyNameError.classList.add("show");
        verifyName.classList.add("error");
        isValid = false;
      }

      // Validate roll (OPTIONAL — only validate format if something is entered)
      if (verifyRoll.value.trim() && verifyRoll.value.trim().length < 5) {
        verifyRollError.textContent =
          "Roll number must be at least 5 characters";
        verifyRollError.classList.add("show");
        verifyRoll.classList.add("error");
        isValid = false;
      }

      // Validate branch (required)
      if (!verifyBranch.value) {
        verifyBranchError.textContent = "Please select your branch";
        verifyBranchError.classList.add("show");
        verifyBranch.classList.add("error");
        isValid = false;
      }

      // Validate year (required)
      if (!verifyYear.value) {
        verifyYearError.textContent = "Please select your year";
        verifyYearError.classList.add("show");
        verifyYear.classList.add("error");
        isValid = false;
      }

      // Duplicate check
      if (isValid) {
        const userData = window.registeredUserData || {};
        const duplicates = checkDuplicates(
          verifyName.value.trim(),
          verifyRoll.value.trim(), // empty string = skip roll check
          userData.email || "",
          userData.phone || "",
        );

        if (duplicates.length > 0) {
          alert(
            "⚠️ Registration Failed!\n\nThe following data already exists:\n" +
              duplicates.join(", ") +
              "\n\nPlease use different information.",
          );
          if (duplicates.includes("Name")) {
            verifyNameError.textContent = "This name is already registered";
            verifyNameError.classList.add("show");
            verifyName.classList.add("error");
          }
          if (duplicates.includes("Roll Number")) {
            verifyRollError.textContent =
              "This roll number is already registered";
            verifyRollError.classList.add("show");
            verifyRoll.classList.add("error");
          }
          isValid = false;
        }
      }

      if (isValid) {
        alert(
          "✅ Registration Successful!\n\nYour account has been created. Please login with your credentials.",
        );

        verificationForm.reset();
        removePhoto();

        document.getElementById("verificationSection").style.display = "none";
        document.getElementById("authSection").style.display = "flex";

        // Go back to login form
        const state = window._loginState;
        if (state) {
          state.resetVerifyBtns();
          if (state.objectsRegister)
            state.objectsRegister.style.display = "none";
          if (state.objectsLogin) state.objectsLogin.style.display = "block";
          if (state.registerForm) state.registerForm.reset();
        }
      }
    });
  });
})();
