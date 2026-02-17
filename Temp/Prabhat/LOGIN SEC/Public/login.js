const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

const registerForm = document.getElementById("registerForm");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerUsername = document.getElementById("registerUsername");
const registerEmailError = document.getElementById("registerEmailError");
const registerPasswordError = document.getElementById("registerPasswordError");
const registerUsernameError = document.getElementById("registerUsernameError");
const termsCheckbox = document.getElementById("termsCheckbox");
const rememberDiv = document.querySelector(".remember");

const creatAccBtn = document.querySelector(".creat-acc");
const loginAccBtn = document.querySelector(".Login-acc");
const objectsLogin = document.querySelector(".objects");
const objectsRegister = document.querySelector(".objects-register");

// Password toggle elements
const toggleLoginPassword = document.getElementById("toggleLoginPassword");
const toggleRegisterPassword = document.getElementById(
  "toggleRegisterPassword",
);

// Toggle password visibility for login
toggleLoginPassword.addEventListener("click", function () {
  const type =
    loginPassword.getAttribute("type") === "password" ? "text" : "password";
  loginPassword.setAttribute("type", type);

  // Toggle eye icon
  if (type === "password") {
    this.classList.remove("bx-show");
    this.classList.add("bx-hide");
  } else {
    this.classList.remove("bx-hide");
    this.classList.add("bx-show");
  }
});

// Toggle password visibility for register
toggleRegisterPassword.addEventListener("click", function () {
  const type =
    registerPassword.getAttribute("type") === "password" ? "text" : "password";
  registerPassword.setAttribute("type", type);

  // Toggle eye icon
  if (type === "password") {
    this.classList.remove("bx-show");
    this.classList.add("bx-hide");
  } else {
    this.classList.remove("bx-hide");
    this.classList.add("bx-show");
  }
});

// Toggle between login and register
creatAccBtn.addEventListener("click", function (e) {
  e.preventDefault();
  objectsLogin.style.display = "none";
  objectsRegister.style.display = "block";
});

loginAccBtn.addEventListener("click", function (e) {
  e.preventDefault();
  objectsRegister.style.display = "none";
  objectsLogin.style.display = "block";
});

// Helper: Email Validation
function validateEmail(email) {
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;
  return emailRegex.test(email);
}

// Helper: Username Validation
function validateUsername(username) {
  if (!/^[a-zA-Z]/.test(username)) {
    return { valid: false, message: "Username must start with a letter" };
  }
  if (/\s/.test(username)) {
    return { valid: false, message: "Username cannot contain spaces" };
  }
  if (username.length > 9) {
    return { valid: false, message: "Username must be maximum 9 characters" };
  }
  if (username.length === 0) {
    return { valid: false, message: "Please enter a username" };
  }
  return { valid: true, message: "" };
}

// Login form validation
loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  let isValid = true;

  emailError.classList.remove("show");
  passwordError.classList.remove("show");
  loginEmail.classList.remove("error");
  loginPassword.classList.remove("error");

  if (!loginEmail.value.trim()) {
    emailError.textContent = "Please enter your email";
    emailError.classList.add("show");
    loginEmail.classList.add("error");
    isValid = false;
  } else if (!validateEmail(loginEmail.value)) {
    emailError.textContent = "Please enter a valid email address";
    emailError.classList.add("show");
    loginEmail.classList.add("error");
    isValid = false;
  }

  if (!loginPassword.value.trim()) {
    passwordError.textContent = "Please enter your password";
    passwordError.classList.add("show");
    loginPassword.classList.add("error");
    isValid = false;
  } else if (loginPassword.value.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters";
    passwordError.classList.add("show");
    loginPassword.classList.add("error");
    isValid = false;
  }

  if (isValid) window.location.href = "app.html";
});

// Store registered email for verification page
let registeredUserData = {};

// Register form validation - Modified to show verification page
registerForm.addEventListener("submit", function (e) {
  e.preventDefault();
  let isValid = true;

  [registerEmailError, registerPasswordError, registerUsernameError].forEach(
    (err) => err.classList.remove("show"),
  );
  [registerEmail, registerPassword, registerUsername].forEach((inp) =>
    inp.classList.remove("error"),
  );

  if (!registerEmail.value.trim()) {
    registerEmailError.textContent = "Please enter your email";
    registerEmailError.classList.add("show");
    registerEmail.classList.add("error");
    isValid = false;
  } else if (!validateEmail(registerEmail.value)) {
    registerEmailError.textContent = "Please enter a valid email address";
    registerEmailError.classList.add("show");
    registerEmail.classList.add("error");
    isValid = false;
  }

  if (!registerPassword.value.trim()) {
    registerPasswordError.textContent = "Please enter your password";
    registerPasswordError.classList.add("show");
    registerPassword.classList.add("error");
    isValid = false;
  } else if (registerPassword.value.length < 6) {
    registerPasswordError.textContent =
      "Password must be at least 6 characters";
    registerPasswordError.classList.add("show");
    registerPassword.classList.add("error");
    isValid = false;
  }

  const userCheck = validateUsername(registerUsername.value);
  if (!userCheck.valid) {
    registerUsernameError.textContent = userCheck.message;
    registerUsernameError.classList.add("show");
    registerUsername.classList.add("error");
    isValid = false;
  }

  if (!termsCheckbox.checked) {
    rememberDiv.classList.add("blink-error");
    setTimeout(() => {
      rememberDiv.classList.remove("blink-error");
    }, 1500);
    isValid = false;
  }

  // If valid, store data and show verification page
  if (isValid) {
    registeredUserData = {
      email: registerEmail.value,
      password: registerPassword.value,
      username: registerUsername.value,
    };

    // Hide auth section, show verification section
    document.getElementById("authSection").style.display = "none";
    document.getElementById("verificationSection").style.display = "flex";

    // Auto-fill email in verification page
    document.getElementById("verifyEmail").value = registerEmail.value;
  }
});

// Clear errors on input
[
  loginEmail,
  loginPassword,
  registerEmail,
  registerPassword,
  registerUsername,
].forEach((el) => {
  el.addEventListener("input", function () {
    this.classList.remove("error");
    const err = this.parentElement.nextElementSibling;
    if (err) err.classList.remove("show");
  });
});

termsCheckbox.addEventListener("change", function () {
  rememberDiv.classList.remove("blink-error");
});

// Terms and Conditions Modal - Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  const termsModal = document.getElementById("termsModal");
  const termsLink = document.getElementById("termsLink");
  const closeTerms = document.getElementById("closeTerms");
  const acceptTerms = document.getElementById("acceptTerms");
  const termsCheckbox = document.getElementById("termsCheckbox");

  // Open modal when clicking the terms link
  if (termsLink) {
    termsLink.addEventListener("click", (e) => {
      e.preventDefault();
      termsModal.style.display = "block";
    });
  }

  // Close modal when clicking X
  if (closeTerms) {
    closeTerms.addEventListener("click", () => {
      termsModal.style.display = "none";
    });
  }

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === termsModal) {
      termsModal.style.display = "none";
    }
  });

  // Accept terms - check the checkbox and close modal
  if (acceptTerms) {
    acceptTerms.addEventListener("click", () => {
      termsCheckbox.checked = true;
      termsModal.style.display = "none";
    });
  }
});

// ============================================
// VERIFICATION PAGE FUNCTIONALITY
// ============================================

// Simulated database of existing users (for duplicate checking)
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

// Get verification form elements
const verificationForm = document.getElementById("verificationForm");
const verifyEmail = document.getElementById("verifyEmail");
const verifyEmailBtn = document.getElementById("verifyEmailBtn");
const emailCodeBox = document.getElementById("emailCodeBox");
const emailVerifyCode = document.getElementById("emailVerifyCode");

const verifyPhone = document.getElementById("verifyPhone");
const verifyPhoneBtn = document.getElementById("verifyPhoneBtn");
const phoneCodeBox = document.getElementById("phoneCodeBox");
const phoneVerifyCode = document.getElementById("phoneVerifyCode");

const verifyName = document.getElementById("verifyName");
const verifyRoll = document.getElementById("verifyRoll");
const verifyBranch = document.getElementById("verifyBranch");
const verifyYear = document.getElementById("verifyYear");
const verifyPhoto = document.getElementById("verifyPhoto");
const uploadArea = document.getElementById("uploadArea");
const uploadedPreview = document.getElementById("uploadedPreview");
const backToLogin = document.getElementById("backToLogin");

// Error message elements
const verifyEmailError = document.getElementById("verifyEmailError");
const emailCodeError = document.getElementById("emailCodeError");
const verifyPhoneError = document.getElementById("verifyPhoneError");
const phoneCodeError = document.getElementById("phoneCodeError");
const verifyNameError = document.getElementById("verifyNameError");
const verifyRollError = document.getElementById("verifyRollError");
const verifyBranchError = document.getElementById("verifyBranchError");
const verifyYearError = document.getElementById("verifyYearError");

// Verification status
let emailVerified = false;
let phoneVerified = false;

// Email verify button handler
verifyEmailBtn.addEventListener("click", () => {
  if (!emailVerified) {
    // Show code input box without alert
    emailCodeBox.style.display = "block";
  }
});

// Phone verify button handler
verifyPhoneBtn.addEventListener("click", () => {
  // Validate phone first
  if (!verifyPhone.value.trim()) {
    verifyPhoneError.textContent = "Please enter phone number";
    verifyPhoneError.classList.add("show");
    verifyPhone.classList.add("error");
    return;
  }

  if (!validatePhone(verifyPhone.value)) {
    verifyPhoneError.textContent = "Please enter valid 10-digit phone number";
    verifyPhoneError.classList.add("show");
    verifyPhone.classList.add("error");
    return;
  }

  if (!phoneVerified) {
    // Show code input box without alert
    phoneCodeBox.style.display = "block";
    verifyPhone.setAttribute("readonly", true);
  }
});

// Auto-verify email code when 6 digits entered
emailVerifyCode.addEventListener("input", function () {
  if (this.value.length === 6 && validateVerificationCode(this.value)) {
    emailVerified = true;
    verifyEmailBtn.innerHTML = '<i class="bx bx-check-circle"></i> Verified';
    verifyEmailBtn.classList.add("verified");
    verifyEmailBtn.disabled = true;
    this.classList.remove("error");
    emailCodeError.classList.remove("show");
  }
});

// Auto-verify phone code when 6 digits entered
phoneVerifyCode.addEventListener("input", function () {
  if (this.value.length === 6 && validateVerificationCode(this.value)) {
    phoneVerified = true;
    verifyPhoneBtn.innerHTML = '<i class="bx bx-check-circle"></i> Verified';
    verifyPhoneBtn.classList.add("verified");
    verifyPhoneBtn.disabled = true;
    this.classList.remove("error");
    phoneCodeError.classList.remove("show");
  }
});

// Photo upload handling
let uploadedFile = null;

uploadArea.addEventListener("click", () => {
  verifyPhoto.click();
});

uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "#a78bfa";
  uploadArea.style.background = "rgba(167, 139, 250, 0.1)";
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.style.borderColor = "rgba(255, 255, 255, 0.3)";
  uploadArea.style.background = "rgba(255, 255, 255, 0.03)";
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = "rgba(255, 255, 255, 0.3)";
  uploadArea.style.background = "rgba(255, 255, 255, 0.03)";

  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    handleFileUpload(file);
  }
});

verifyPhoto.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    handleFileUpload(file);
  }
});

function handleFileUpload(file) {
  // Check file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert("File size must be less than 2MB");
    return;
  }

  uploadedFile = file;
  const reader = new FileReader();

  reader.onload = (e) => {
    uploadArea.style.display = "none";
    uploadedPreview.classList.add("show");
    uploadedPreview.innerHTML = `
      <div class="preview-container">
        <img src="${e.target.result}" alt="Preview">
        <button type="button" class="remove-photo" onclick="removePhoto()">×</button>
      </div>
    `;
  };

  reader.readAsDataURL(file);
}

function removePhoto() {
  uploadedFile = null;
  verifyPhoto.value = "";
  uploadArea.style.display = "block";
  uploadedPreview.classList.remove("show");
  uploadedPreview.innerHTML = "";
}

// Make removePhoto available globally
window.removePhoto = removePhoto;

// Back to login handler
backToLogin.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("verificationSection").style.display = "none";
  document.getElementById("authSection").style.display = "flex";

  // Reset verification form
  verificationForm.reset();
  removePhoto();

  // Reset verification states
  emailVerified = false;
  phoneVerified = false;
  emailCodeBox.style.display = "none";
  phoneCodeBox.style.display = "none";
  verifyEmailBtn.innerHTML = '<i class="bx bx-check-circle"></i> Verify';
  verifyEmailBtn.classList.remove("verified");
  verifyEmailBtn.disabled = false;
  verifyPhoneBtn.innerHTML = '<i class="bx bx-check-circle"></i> Verify';
  verifyPhoneBtn.classList.remove("verified");
  verifyPhoneBtn.disabled = false;
  verifyPhone.removeAttribute("readonly");

  // Clear all error messages
  [
    verifyEmailError,
    emailCodeError,
    verifyPhoneError,
    phoneCodeError,
    verifyNameError,
    verifyRollError,
    verifyBranchError,
    verifyYearError,
  ].forEach((err) => err.classList.remove("show"));

  [
    verifyEmail,
    emailVerifyCode,
    verifyPhone,
    phoneVerifyCode,
    verifyName,
    verifyRoll,
    verifyBranch,
    verifyYear,
  ].forEach((inp) => inp.classList.remove("error"));
});

// Phone number validation
function validatePhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// Verification code validation
function validateVerificationCode(code) {
  return /^\d{6}$/.test(code);
}

// Check for duplicate data
function checkDuplicateData(name, roll, email, phone) {
  const duplicates = [];

  for (let user of existingUsers) {
    if (user.name.toLowerCase() === name.toLowerCase()) {
      duplicates.push("Name");
    }
    if (user.roll.toLowerCase() === roll.toLowerCase()) {
      duplicates.push("Roll Number");
    }
    if (user.email.toLowerCase() === email.toLowerCase()) {
      duplicates.push("Email");
    }
    if (user.phone === phone) {
      duplicates.push("Phone Number");
    }
  }

  return duplicates;
}

// Verification form submission
verificationForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Force email verification
  if (!emailVerified) {
    verifyEmailError.textContent = "Please verify your email";
    verifyEmailError.classList.add("show");
    isValid = false;
  }

  // Force phone verification
  if (!phoneVerified) {
    verifyPhoneError.textContent = "Please verify your phone number";
    verifyPhoneError.classList.add("show");
    isValid = false;
  }

  let isValid = true;

  // Clear previous errors
  [
    verifyEmailError,
    emailCodeError,
    verifyPhoneError,
    phoneCodeError,
    verifyNameError,
    verifyRollError,
    verifyBranchError,
    verifyYearError,
  ].forEach((err) => err.classList.remove("show"));

  [
    verifyEmail,
    emailVerifyCode,
    verifyPhone,
    phoneVerifyCode,
    verifyName,
    verifyRoll,
    verifyBranch,
    verifyYear,
  ].forEach((inp) => inp.classList.remove("error"));

  // Validate email verification code
  if (emailCodeBox.style.display === "block") {
    if (!emailVerifyCode.value.trim()) {
      emailCodeError.textContent = "Please enter email verification code";
      emailCodeError.classList.add("show");
      emailVerifyCode.classList.add("error");
      isValid = false;
    } else if (!validateVerificationCode(emailVerifyCode.value)) {
      emailCodeError.textContent = "Verification code must be 6 digits";
      emailCodeError.classList.add("show");
      emailVerifyCode.classList.add("error");
      isValid = false;
    } else {
      emailVerified = true;
    }
  }

  // Validate phone
  if (!verifyPhone.value.trim()) {
    verifyPhoneError.textContent = "Please enter phone number";
    verifyPhoneError.classList.add("show");
    verifyPhone.classList.add("error");
    isValid = false;
  } else if (!validatePhone(verifyPhone.value)) {
    verifyPhoneError.textContent = "Please enter valid 10-digit phone number";
    verifyPhoneError.classList.add("show");
    verifyPhone.classList.add("error");
    isValid = false;
  }

  // Validate phone verification code
  if (phoneCodeBox.style.display === "block") {
    if (!phoneVerifyCode.value.trim()) {
      phoneCodeError.textContent = "Please enter phone verification code";
      phoneCodeError.classList.add("show");
      phoneVerifyCode.classList.add("error");
      isValid = false;
    } else if (!validateVerificationCode(phoneVerifyCode.value)) {
      phoneCodeError.textContent = "Verification code must be 6 digits";
      phoneCodeError.classList.add("show");
      phoneVerifyCode.classList.add("error");
      isValid = false;
    } else {
      phoneVerified = true;
    }
  }

  // Validate name
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

  // Validate roll number
  if (!verifyRoll.value.trim()) {
    verifyRollError.textContent = "Please enter roll number";
    verifyRollError.classList.add("show");
    verifyRoll.classList.add("error");
    isValid = false;
  } else if (verifyRoll.value.trim().length < 5) {
    verifyRollError.textContent = "Roll number must be at least 5 characters";
    verifyRollError.classList.add("show");
    verifyRoll.classList.add("error");
    isValid = false;
  }

  // Validate branch
  if (!verifyBranch.value) {
    verifyBranchError.textContent = "Please select your branch";
    verifyBranchError.classList.add("show");
    verifyBranch.classList.add("error");
    isValid = false;
  }

  // Validate year
  if (!verifyYear.value) {
    verifyYearError.textContent = "Please select your year";
    verifyYearError.classList.add("show");
    verifyYear.classList.add("error");
    isValid = false;
  }

  // Check for duplicate data
  if (isValid) {
    const duplicates = checkDuplicateData(
      verifyName.value.trim(),
      verifyRoll.value.trim(),
      registeredUserData.email,
      verifyPhone.value.trim(),
    );

    if (duplicates.length > 0) {
      const duplicateFields = duplicates.join(", ");
      alert(
        `⚠️ Registration Failed!\n\nThe following data already exists in our system:\n${duplicateFields}\n\nPlease use different information.`,
      );

      // Highlight duplicate fields
      if (duplicates.includes("Name")) {
        verifyNameError.textContent = "This name is already registered";
        verifyNameError.classList.add("show");
        verifyName.classList.add("error");
      }
      if (duplicates.includes("Roll Number")) {
        verifyRollError.textContent = "This roll number is already registered";
        verifyRollError.classList.add("show");
        verifyRoll.classList.add("error");
      }
      if (duplicates.includes("Email")) {
        alert(
          "This email is already registered. Please use a different email.",
        );
      }
      if (duplicates.includes("Phone Number")) {
        verifyPhoneError.textContent =
          "This phone number is already registered";
        verifyPhoneError.classList.add("show");
        verifyPhone.classList.add("error");
      }

      isValid = false;
    }
  }

  // If all valid and no duplicates, complete registration
  if (isValid) {
    // Success message
    alert(
      "✅ Registration Successful!\n\nYour account has been created. Please login with your credentials.",
    );

    // Reset everything and go back to login page
    verificationForm.reset();
    removePhoto();

    // Reset verification states
    emailVerified = false;
    phoneVerified = false;
    emailCodeBox.style.display = "none";
    phoneCodeBox.style.display = "none";
    verifyEmailBtn.innerHTML = '<i class="bx bx-check-circle"></i> Verify';
    verifyEmailBtn.classList.remove("verified");
    verifyEmailBtn.disabled = false;
    verifyPhoneBtn.innerHTML = '<i class="bx bx-check-circle"></i> Verify';
    verifyPhoneBtn.classList.remove("verified");
    verifyPhoneBtn.disabled = false;
    verifyPhone.removeAttribute("readonly");

    document.getElementById("verificationSection").style.display = "none";
    document.getElementById("authSection").style.display = "flex";

    // Show login form (hide register form)
    objectsRegister.style.display = "none";
    objectsLogin.style.display = "block";

    // Clear registration form
    registerForm.reset();
  }
});

// Clear errors on input for verification fields
[
  emailVerifyCode,
  verifyPhone,
  phoneVerifyCode,
  verifyName,
  verifyRoll,
  verifyBranch,
  verifyYear,
].forEach((el) => {
  el.addEventListener("input", function () {
    this.classList.remove("error");
    const errorId = this.id + "Error";
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
      errorElement.classList.remove("show");
    }
  });
});

// Clear phone error when typing
verifyPhone.addEventListener("input", function () {
  this.classList.remove("error");
  verifyPhoneError.classList.remove("show");
});
