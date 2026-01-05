const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

loginForm.addEventListener("submit", function (e) {
  e.preventDefault();

  let isValid = true;

  // Reset styles
  [loginEmail, loginPassword].forEach(
    (input) => (input.style.borderColor = "#e0e0e0")
  );
  [emailError, passwordError].forEach(
    (error) => (error.style.display = "none")
  );

  // Basic Validation
  if (!loginEmail.value.includes("@")) {
    emailError.style.display = "block";
    loginEmail.style.borderColor = "#e74c3c";
    isValid = false;
  }

  if (loginPassword.value.length < 6) {
    passwordError.style.display = "block";
    loginPassword.style.borderColor = "#e74c3c";
    isValid = false;
  }

  if (isValid) {
    // Redirect to your profile page
    window.location.href = "profile.html";
  }
});
