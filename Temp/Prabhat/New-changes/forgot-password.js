// Get all step containers
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");

// Step 1 elements
const emailForm = document.getElementById("emailForm");
const emailOrPhone = document.getElementById("emailOrPhone");
const emailPhoneError = document.getElementById("emailPhoneError");

// Step 2 elements
const otpForm = document.getElementById("otpForm");
const otpCode = document.getElementById("otpCode");
const otpError = document.getElementById("otpError");
const sentTo = document.getElementById("sentTo");
const resendCode = document.getElementById("resendCode");

// Step 3 elements
const newPasswordForm = document.getElementById("newPasswordForm");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");
const newPasswordError = document.getElementById("newPasswordError");
const confirmPasswordError = document.getElementById("confirmPasswordError");

// Password toggle elements
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

// Success notification
const successNotification = document.getElementById("successNotification");

// Store user input
let userContact = "";

// Email validation
function validateEmail(email) {
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;
  return emailRegex.test(email);
}

// Phone validation (10 digits)
function validatePhone(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

// Toggle password visibility for new password
toggleNewPassword.addEventListener("click", function () {
  const type =
    newPassword.getAttribute("type") === "password" ? "text" : "password";
  newPassword.setAttribute("type", type);

  if (type === "password") {
    this.classList.remove("bx-show");
    this.classList.add("bx-hide");
  } else {
    this.classList.remove("bx-hide");
    this.classList.add("bx-show");
  }
});

// Toggle password visibility for confirm password
toggleConfirmPassword.addEventListener("click", function () {
  const type =
    confirmPassword.getAttribute("type") === "password" ? "text" : "password";
  confirmPassword.setAttribute("type", type);

  if (type === "password") {
    this.classList.remove("bx-show");
    this.classList.add("bx-hide");
  } else {
    this.classList.remove("bx-hide");
    this.classList.add("bx-show");
  }
});

// Step 1: Email/Phone verification
emailForm.addEventListener("submit", function (e) {
  e.preventDefault();

  emailPhoneError.classList.remove("show");
  emailOrPhone.classList.remove("error");

  const input = emailOrPhone.value.trim();

  if (!input) {
    emailPhoneError.textContent = "Please enter your email or phone number";
    emailPhoneError.classList.add("show");
    emailOrPhone.classList.add("error");
    return;
  }

  // Check if it's email or phone
  const isEmail = input.includes("@");
  const isValid = isEmail ? validateEmail(input) : validatePhone(input);

  if (!isValid) {
    emailPhoneError.textContent = isEmail
      ? "Please enter a valid email address"
      : "Please enter a valid 10-digit phone number";
    emailPhoneError.classList.add("show");
    emailOrPhone.classList.add("error");
    return;
  }

  // Store the contact info
  userContact = input;

  // Show where code was sent
  sentTo.textContent = isEmail ? maskEmail(input) : maskPhone(input);

  // Move to step 2
  step1.classList.add("hidden");
  step2.classList.remove("hidden");

  // Simulate sending code (in real app, API call here)
  console.log(`Verification code sent to ${input}`);
});

// Mask email for privacy
function maskEmail(email) {
  const [username, domain] = email.split("@");
  const masked = username.substring(0, 2) + "***" + username.slice(-1);
  return masked + "@" + domain;
}

// Mask phone for privacy
function maskPhone(phone) {
  return "******" + phone.slice(-4);
}

// Step 2: OTP verification
otpForm.addEventListener("submit", function (e) {
  e.preventDefault();

  otpError.classList.remove("show");
  otpCode.classList.remove("error");

  const code = otpCode.value.trim();

  if (!code) {
    otpError.textContent = "Please enter the verification code";
    otpError.classList.add("show");
    otpCode.classList.add("error");
    return;
  }

  if (code.length !== 6) {
    otpError.textContent = "Code must be 6 digits";
    otpError.classList.add("show");
    otpCode.classList.add("error");
    return;
  }

  // In real app, verify code with backend
  // For demo, accept any 6-digit code
  if (!/^[0-9]{6}$/.test(code)) {
    otpError.textContent = "Please enter a valid 6-digit code";
    otpError.classList.add("show");
    otpCode.classList.add("error");
    return;
  }

  // Move to step 3
  step2.classList.add("hidden");
  step3.classList.remove("hidden");

  console.log("Code verified successfully");
});

// Resend code functionality
resendCode.addEventListener("click", function (e) {
  e.preventDefault();

  // Show feedback
  const originalText = this.textContent;
  this.textContent = "Sent!";
  this.style.pointerEvents = "none";

  setTimeout(() => {
    this.textContent = originalText;
    this.style.pointerEvents = "auto";
  }, 3000);

  console.log("Verification code resent");
});

// Step 3: New password creation
newPasswordForm.addEventListener("submit", function (e) {
  e.preventDefault();

  let isValid = true;

  // Clear previous errors
  newPasswordError.classList.remove("show");
  confirmPasswordError.classList.remove("show");
  newPassword.classList.remove("error");
  confirmPassword.classList.remove("error");

  // Validate new password
  if (!newPassword.value.trim()) {
    newPasswordError.textContent = "Please enter a new password";
    newPasswordError.classList.add("show");
    newPassword.classList.add("error");
    isValid = false;
  } else if (newPassword.value.length < 6) {
    newPasswordError.textContent = "Password must be at least 6 characters";
    newPasswordError.classList.add("show");
    newPassword.classList.add("error");
    isValid = false;
  }

  // Validate confirm password
  if (!confirmPassword.value.trim()) {
    confirmPasswordError.textContent = "Please re-enter your password";
    confirmPasswordError.classList.add("show");
    confirmPassword.classList.add("error");
    isValid = false;
  } else if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.textContent = "Passwords do not match";
    confirmPasswordError.classList.add("show");
    confirmPassword.classList.add("error");
    isValid = false;
  }

  if (isValid) {
    // In real app, update password via API
    console.log("Password updated successfully");

    // Show success notification
    successNotification.classList.add("show");

    // Redirect to login page after 2 seconds
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  }
});

// Clear errors on input
emailOrPhone.addEventListener("input", function () {
  this.classList.remove("error");
  emailPhoneError.classList.remove("show");
});

otpCode.addEventListener("input", function () {
  this.classList.remove("error");
  otpError.classList.remove("show");

  // Auto-format to numbers only
  this.value = this.value.replace(/[^0-9]/g, "");
});

newPassword.addEventListener("input", function () {
  this.classList.remove("error");
  newPasswordError.classList.remove("show");
});

confirmPassword.addEventListener("input", function () {
  this.classList.remove("error");
  confirmPasswordError.classList.remove("show");
});
