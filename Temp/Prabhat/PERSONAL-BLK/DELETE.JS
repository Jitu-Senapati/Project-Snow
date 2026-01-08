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
const termsError = document.getElementById("termsError");
const rememberDiv = document.querySelector(".remember");

const creatAccBtn = document.querySelector(".creat-acc");
const loginAccBtn = document.querySelector(".Login-acc");
const objectsLogin = document.querySelector(".objects");
const objectsRegister = document.querySelector(".objects-register");

const loginBtn = document.getElementById("loginBtn");

function setLoading(btn, text) {
  btn.disabled = true;
  btn.dataset.oldText = btn.innerText;
  btn.innerText = text;
}

function clearLoading(btn) {
  btn.disabled = false;
  btn.innerText = btn.dataset.oldText;
}

// Password toggle elements
const toggleLoginPassword = document.getElementById("toggleLoginPassword");
const toggleRegisterPassword = document.getElementById(
  "toggleRegisterPassword"
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

function resetForm(form) {
  form.reset();
  form
    .querySelectorAll(".error-message")
    .forEach((e) => e.classList.remove("show"));
  form.querySelectorAll("input").forEach((i) => i.classList.remove("error"));
}

// Toggle between login and register
creatAccBtn.addEventListener("click", function (e) {
  e.preventDefault();
  resetForm(loginForm);
  objectsLogin.style.display = "none";
  objectsRegister.style.display = "block";
});

loginAccBtn.addEventListener("click", function (e) {
  e.preventDefault();
  resetForm(registerForm);
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

  if (isValid) {
    setLoading(loginBtn, "Logging in...");
    setTimeout(() => {
      window.location.href = "app.html";
    }, 1200);
  }
});

// Register form validation
registerForm.addEventListener("submit", function (e) {
  e.preventDefault();
  let isValid = true;

  [
    registerEmailError,
    registerPasswordError,
    registerUsernameError,
    termsError,
  ].forEach((err) => err.classList.remove("show"));
  [registerEmail, registerPassword, registerUsername].forEach((inp) =>
    inp.classList.remove("error")
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
    termsError.classList.add("show");
    rememberDiv.classList.add("blink-error");
    setTimeout(() => {
      rememberDiv.classList.remove("blink-error");
    }, 1500);
    isValid = false;
  }

  if (isValid) window.location.href = "app.html";
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
  termsError.classList.remove("show");
  rememberDiv.classList.remove("blink-error");
});
