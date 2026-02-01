// DOM Elements
const formsWrapper = document.getElementById("formsWrapper");
const creatAccBtn = document.getElementById("creatAccBtn");
const loginAccBtn = document.getElementById("loginAccBtn");

// Forms
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

// Inputs
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerUsername = document.getElementById("registerUsername");
const termsCheckbox = document.getElementById("termsCheckbox");

// Toggle Password Buttons
const toggleLoginPassword = document.getElementById("toggleLoginPassword");
const toggleRegisterPassword = document.getElementById(
  "toggleRegisterPassword",
);

// Characters
const characters = document.querySelectorAll(".character-svg");

// State
let isPasswordVisible = false;
let mouseX = 0;
let mouseY = 0;

// ==================== CHARACTER EYE TRACKING ====================

function updateEyes() {
  characters.forEach((char) => {
    const pupils = char.querySelectorAll(".pupil");
    const eyes = char.querySelector(".eyes");

    if (!eyes) return;

    const eyesRect = eyes.getBoundingClientRect();
    const eyesCenterX = eyesRect.left + eyesRect.width / 2;
    const eyesCenterY = eyesRect.top + eyesRect.height / 2;

    // Calculate angle and distance
    const angle = Math.atan2(mouseY - eyesCenterY, mouseX - eyesCenterX);
    const distance = Math.min(
      8,
      Math.hypot(mouseX - eyesCenterX, mouseY - eyesCenterY) / 15,
    );

    pupils.forEach((pupil, index) => {
      const offsetX = Math.cos(angle) * distance;
      const offsetY = Math.sin(angle) * distance;

      // Add slight variation for each eye
      const variation = index === 0 ? -2 : 2;
      pupil.style.transform = `translate(${offsetX + variation}px, ${offsetY}px)`;
    });
  });
}

document.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  requestAnimationFrame(updateEyes);
});

// ==================== CHARACTER REACTIONS ====================

function setCharacterState(state) {
  characters.forEach((char, index) => {
    // Remove all states
    char.classList.remove("covering", "sad", "happy", "celebrating");

    // Add delay for staggered animation
    setTimeout(() => {
      if (state === "covering") {
        char.classList.add("covering");
      } else if (state === "sad") {
        char.classList.add("sad");
        // Tilt characters down
        char.style.transform = "rotate(-5deg) translateY(10px)";
      } else if (state === "happy") {
        char.classList.add("happy");
        char.style.transform = "rotate(0deg) translateY(-5px)";
      } else if (state === "celebrating") {
        char.classList.add("celebrating");
        char.style.transform = "scale(1.1) translateY(-20px)";
      } else {
        char.style.transform = "";
      }
    }, index * 100);
  });
}

// Reset character positions
function resetCharacters() {
  characters.forEach((char) => {
    char.style.transform = "";
  });
}

// ==================== FORM TRANSITIONS ====================

creatAccBtn.addEventListener("click", (e) => {
  e.preventDefault();
  formsWrapper.classList.add("show-register");
  setCharacterState("happy");
  setTimeout(resetCharacters, 1000);
});

loginAccBtn.addEventListener("click", (e) => {
  e.preventDefault();
  formsWrapper.classList.remove("show-register");
  setCharacterState("happy");
  setTimeout(resetCharacters, 1000);
});

// ==================== PASSWORD TOGGLE ====================

function togglePasswordVisibility(input, icon) {
  const type = input.getAttribute("type") === "password" ? "text" : "password";
  input.setAttribute("type", type);
  isPasswordVisible = type === "text";

  if (type === "text") {
    icon.classList.remove("bx-hide");
    icon.classList.add("bx-show");
    setCharacterState("covering");
  } else {
    icon.classList.remove("bx-show");
    icon.classList.add("bx-hide");
    setCharacterState("happy");
    setTimeout(resetCharacters, 500);
  }
}

toggleLoginPassword.addEventListener("click", () => {
  togglePasswordVisibility(loginPassword, toggleLoginPassword);
});

toggleRegisterPassword.addEventListener("click", () => {
  togglePasswordVisibility(registerPassword, toggleRegisterPassword);
});

// ==================== FORM VALIDATION ====================

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUsername(username) {
  const trimmed = username.trim();
  if (!trimmed) return { valid: false, message: "Please enter a username" };
  if (!/^[a-zA-Z]/.test(trimmed))
    return { valid: false, message: "Username must start with a letter" };
  if (/\s/.test(trimmed))
    return { valid: false, message: "Username cannot contain spaces" };
  if (trimmed.length > 9)
    return { valid: false, message: "Username must be maximum 9 characters" };
  return { valid: true };
}

function showError(input, errorId, show) {
  const group = input.closest(".input-group");
  const error = document.getElementById(errorId);

  if (show) {
    group.classList.add("error");
  } else {
    group.classList.remove("error");
  }
}

// Login Form
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let isValid = true;

  // Validate email
  if (!loginEmail.value.trim() || !validateEmail(loginEmail.value)) {
    showError(loginEmail, "emailError", true);
    isValid = false;
  } else {
    showError(loginEmail, "emailError", false);
  }

  // Validate password
  if (!loginPassword.value || loginPassword.value.length < 6) {
    showError(loginPassword, "passwordError", true);
    isValid = false;
  } else {
    showError(loginPassword, "passwordError", false);
  }

  if (isValid) {
    setCharacterState("celebrating");
    const btn = document.getElementById("loginBtn");
    btn.innerHTML =
      '<span>Logging in...</span><i class="bx bx-loader-alt bx-spin"></i>';
    btn.disabled = true;

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    window.location.href = "app.html";
  } else {
    setCharacterState("sad");
    setTimeout(resetCharacters, 2000);
  }
});

// Register Form
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let isValid = true;

  // Validate email
  if (!registerEmail.value.trim() || !validateEmail(registerEmail.value)) {
    showError(registerEmail, "registerEmailError", true);
    isValid = false;
  } else {
    showError(registerEmail, "registerEmailError", false);
  }

  // Validate password
  if (!registerPassword.value || registerPassword.value.length < 6) {
    showError(registerPassword, "registerPasswordError", true);
    isValid = false;
  } else {
    showError(registerPassword, "registerPasswordError", false);
  }

  // Validate username
  const userCheck = validateUsername(registerUsername.value);
  if (!userCheck.valid) {
    document.getElementById("registerUsernameError").textContent =
      userCheck.message;
    showError(registerUsername, "registerUsernameError", true);
    isValid = false;
  } else {
    showError(registerUsername, "registerUsernameError", false);
  }

  // Validate terms
  if (!termsCheckbox.checked) {
    termsCheckbox.closest(".checkbox-wrapper").style.animation =
      "shake 0.5s ease";
    setTimeout(() => {
      termsCheckbox.closest(".checkbox-wrapper").style.animation = "";
    }, 500);
    isValid = false;
  }

  if (isValid) {
    setCharacterState("celebrating");
    const btn = registerForm.querySelector(".btn-primary");
    btn.innerHTML =
      '<span>Creating account...</span><i class="bx bx-loader-alt bx-spin"></i>';
    btn.disabled = true;

    await new Promise((resolve) => setTimeout(resolve, 1500));
    window.location.href = "app.html";
  } else {
    setCharacterState("sad");
    setTimeout(resetCharacters, 2000);
  }
});

// Clear errors on input
document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", function () {
    this.closest(".input-group")?.classList.remove("error");
  });
});

// Focus effects for characters
loginEmail.addEventListener("focus", () => {
  if (!isPasswordVisible) setCharacterState("happy");
});

loginPassword.addEventListener("focus", () => {
  if (!isPasswordVisible) setCharacterState("covering");
});

// Typing animation
loginPassword.addEventListener("input", () => {
  if (!isPasswordVisible) {
    characters.forEach((char, index) => {
      setTimeout(() => {
        char.style.transform = "scale(0.98)";
        setTimeout(() => {
          char.style.transform = "";
        }, 100);
      }, index * 50);
    });
  }
});

// Add shake animation for checkbox
const style = document.createElement("style");
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;
document.head.appendChild(style);

// ==================== RESPONSIVE CHECK ====================

function checkScreenSize() {
  const isMobile = window.innerWidth <= 767;
  if (isMobile) {
    // Mobile: ensure characters are hidden
    document
      .querySelector(".characters-side")
      ?.style.setProperty("display", "none");
  }
}

window.addEventListener("resize", checkScreenSize);
checkScreenSize();

// ==================== INITIALIZE ====================

// Initial character animation
window.addEventListener("load", () => {
  setTimeout(() => {
    setCharacterState("happy");
    setTimeout(resetCharacters, 1000);
  }, 1000);
});

// Blink animation randomizer
function randomBlink() {
  const chars = document.querySelectorAll(".character-svg");
  const randomChar = chars[Math.floor(Math.random() * chars.length)];
  const eyes = randomChar.querySelector(".eyes");

  if (eyes) {
    eyes.style.animation = "none";
    eyes.offsetHeight; // Trigger reflow
    eyes.style.animation = "blink 0.2s ease";
  }

  setTimeout(randomBlink, Math.random() * 3000 + 2000);
}

setTimeout(randomBlink, 2000);
