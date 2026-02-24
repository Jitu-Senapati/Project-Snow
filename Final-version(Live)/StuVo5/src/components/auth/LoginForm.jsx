import React, { useState, forwardRef } from "react";

const LoginForm = forwardRef(
  ({ onSwitchToRegister, onForgotPassword }, ref) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleSubmit = (e) => {
      e.preventDefault();
      setEmailError("");
      setPasswordError("");

      let valid = true;

      if (!email.trim()) {
        setEmailError("Please enter your email");
        valid = false;
      } else if (!validateEmail(email.trim())) {
        setEmailError("Please enter a valid email");
        valid = false;
      }

      if (!password) {
        setPasswordError("Please enter your password");
        valid = false;
      } else if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters");
        valid = false;
      }

      if (valid) {
        window.location.href = "app.html";
      }
    };

    return (
      <div className="objects">
        <div className="box-head">
          <h1>Log in</h1>
        </div>
        <form id="loginForm" onSubmit={handleSubmit}>
          <div className="input-box">
            <div className="input-wrapper">
              <i className="bx bx-envelope"></i>
              <input
                type="email"
                id="loginEmail"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                className={emailError ? "error" : ""}
              />
            </div>
            <div
              className={`error-message ${emailError ? "show" : ""}`}
              id="emailError"
            >
              {emailError}
            </div>
          </div>

          <div className="input-box">
            <div className="input-wrapper">
              <i className="bx bx-lock"></i>
              <input
                type={showPassword ? "text" : "password"}
                id="loginPassword"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                className={passwordError ? "error" : ""}
              />
              <i
                className={`bx ${showPassword ? "bx-show" : "bx-hide"} toggle-password`}
                id="toggleLoginPassword"
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
            <div
              className={`error-message ${passwordError ? "show" : ""}`}
              id="passwordError"
            >
              {passwordError}
            </div>
          </div>

          <div className="remember-forgot">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            {/* Changed from href="forgot-password.html" to onClick handler */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onForgotPassword) onForgotPassword();
              }}
            >
              Forgot password?
            </a>
          </div>

          <div className="login-button">
            <button type="submit" id="loginBtn">
              Log in
            </button>
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <button type="button" className="google-login">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg "
              alt="Google"
              className="google-icon"
            />
            Continue with Google
          </button>

          <div className="account">
            <p>
              Don't have an account?
              <a
                href="#"
                className="creat-acc"
                onClick={(e) => {
                  e.preventDefault();
                  onSwitchToRegister();
                }}
              >
                Create an account
              </a>
            </p>
          </div>
        </form>
      </div>
    );
  },
);

export default LoginForm;
