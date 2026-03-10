import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { sendPasswordReset } from "../../firebase/auth";

const ForgotPasswordForm = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const validateEmail = (v) =>
    /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/.test(
      v,
    );

  /* ── Auto-redirect countdown ── */
  useEffect(() => {
    if (!isSubmitted) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onBackToLogin?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted, onBackToLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");

    const input = email.trim();

    if (!input) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!validateEmail(input)) {
      setEmailError("Please enter a valid email address (Gmail, Yahoo, Outlook, or Hotmail)");
      return;
    }

    try {
      await sendPasswordReset(input);
      setIsSubmitted(true);
      setCountdown(3);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setEmailError("No account found with this email address");
      } else {
        setEmailError(err.message);
      }
    }
  };

  /* ── Success overlay ── */
  const successOverlay = createPortal(
    <div className={`success-overlay${isSubmitted ? " show" : ""}`}>
      <div className="success-card">
        <div className="success-icon-circle">
          <i className="bx bx-check"></i>
        </div>
        <h2>Check Your Email!</h2>
        <p>Reset link has been sent to your registered email address.</p>
        <div className="success-progress-bar">
          <div className="success-progress-fill"></div>
        </div>
        <p className="success-redirect-text">
          Redirecting to login in <span>{countdown}</span>s...
        </p>
      </div>
    </div>,
    document.body,
  );

  return (
    <>
      {successOverlay}

      <div className="forgot-password-content">
        <div className="step-container">
          <div className="box-head">
            <h1>Forgot Password?</h1>
            <p className="subtitle">Enter your registered email address</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="input-box">
              <div className="input-wrapper">
                <i className="bx bx-envelope"></i>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={emailError ? "error" : ""}
                  disabled={isSubmitted}
                />
              </div>
              <div className={`error-message ${emailError ? "show" : ""}`}>
                {emailError}
              </div>
            </div>

            <div className="login-button">
              <button type="submit" disabled={isSubmitted}>
                Send Reset Link
              </button>
            </div>
          </form>

          <div className="back-to-login">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onBackToLogin?.();
              }}
            >
              <i className="bx bx-arrow-back"></i> Back to Login
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordForm;
