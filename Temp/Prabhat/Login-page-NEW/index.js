document.addEventListener("DOMContentLoaded", function () {
  // -------------------------
  // ELEMENTS
  // -------------------------
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

  const termsModal = document.getElementById("termsModal");
  const closeTerms = document.getElementById("closeTerms");
  const acceptTerms = document.getElementById("acceptTerms");
  const countryCodeSpan = document.querySelector(".country-code");

  // -------------------------
  // STATE
  // -------------------------
  let emailVerified = false;
  let phoneVerified = false;
  let currentVerificationType = null;
  let generatedVerifyCode = null;

  // -------------------------
  // VALIDATION HELPERS
  // -------------------------
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

  // -------------------------
  // PASSWORD TOGGLE — FIX: use setAttribute for reliable type change
  // -------------------------
  toggleLoginPassword?.addEventListener("click", function () {
    const isPassword = loginPassword.getAttribute("type") === "password";
    loginPassword.setAttribute("type", isPassword ? "text" : "password");
    this.classList.toggle("bx-hide");
    this.classList.toggle("bx-show");
  });

  toggleRegisterPassword?.addEventListener("click", function () {
    const isPassword = registerPassword.getAttribute("type") === "password";
    registerPassword.setAttribute("type", isPassword ? "text" : "password");
    this.classList.toggle("bx-hide");
    this.classList.toggle("bx-show");
  });

  // -------------------------
  // TOGGLE LOGIN / REGISTER
  // FIX: JS was adding animation classes that had no CSS definitions.
  // Now we use display + CSS animation classes properly.
  // -------------------------
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

    // Reset register form state
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

  // -------------------------
  // TERMS MODAL
  // -------------------------
  termsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    termsModal.classList.add("show");
  });

  closeTerms?.addEventListener("click", () => {
    termsModal.classList.remove("show");
  });

  acceptTerms?.addEventListener("click", () => {
    termsCheckbox.checked = true;
    termsModal.classList.remove("show");
    rememberDiv.classList.remove("blink-error");
  });

  // -------------------------
  // VERIFICATION
  // -------------------------
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
      const code = countryCodeSpan?.textContent || "";
      verifyModalTitle.textContent = "Verify Phone";
      verifyTarget.textContent = code + " " + registerPhone.value.trim();
    }

    generatedVerifyCode = "123456"; // Demo OTP
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

  window.addEventListener("click", (e) => {
    if (e.target === verifyModal) verifyModal.classList.remove("show");
    if (e.target === termsModal) termsModal.classList.remove("show");
  });

  verifyCodeInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") verifyCode();
  });

  // Reset verification state when user edits the field
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

  // Clear errors on input
  [loginEmail, loginPassword, registerUsername, registerPassword].forEach(
    (el) => {
      el?.addEventListener("input", function () {
        const errorDiv =
          this.closest(".input-box")?.querySelector(".error-message");
        if (errorDiv) errorDiv.classList.remove("show");
        this.classList.remove("error");
      });
    },
  );

  termsCheckbox?.addEventListener("change", () => {
    rememberDiv.classList.remove("blink-error");
  });

  // -------------------------
  // LOGIN VALIDATION
  // -------------------------
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

  // -------------------------
  // REGISTER VALIDATION
  // -------------------------
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

    if (valid) window.location.href = "app.html";
  });
});
