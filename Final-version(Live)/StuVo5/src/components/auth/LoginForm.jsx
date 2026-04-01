import React, { useState, forwardRef, useEffect } from "react";

const LoginForm = forwardRef(
  ({ onSwitchToRegister, onForgotPassword, onLogin, onSendOtp, onVerifyOtp, sendingOtp, onGoogleLogin }, ref) => {
    const [activeTab, setActiveTab] = useState("email");
    const [rememberMe, setRememberMe] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [otpError, setOtpError] = useState("");

    const [countdown, setCountdown] = useState(0);
    const [otpSent, setOtpSent] = useState(false);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    useEffect(() => {
      if (countdown === 0) return;
      const timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }, [countdown]);

    const handlePhoneChange = (e) => {
      setPhone(e.target.value.replace(/[^0-9]/g, ""));
      setOtpSent(false);
      setOtp("");
      setPhoneError("");
      setOtpError("");
    };

    const handleSendOtp = async () => {
      setPhoneError("");
      if (!/^\d{10}$/.test(phone)) {
        setPhoneError("Enter a valid 10-digit number");
        return;
      }
      const success = await onSendOtp(phone, rememberMe);
      if (success) {
        setCountdown(30);
        setOtpSent(true);
      }
    };

    const handleEmailLogin = (e) => {
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
        onLogin(email, password, rememberMe);
      }
    };

    const handlePhoneLogin = async (e) => {
      e.preventDefault();
      setPhoneError("");
      setOtpError("");
      let valid = true;

      if (!/^\d{10}$/.test(phone)) {
        setPhoneError("Please enter a valid phone number");
        valid = false;
      }

      if (!otpSent) {
        setOtpError("Please send the OTP first");
        valid = false;
      } else if (!otp.trim()) {
        setOtpError("Please enter the OTP");
        valid = false;
      } else if (otp.length !== 6) {
        setOtpError("OTP must be 6 digits");
        valid = false;
      }

      if (valid) {
        const success = await onVerifyOtp(otp, rememberMe);
        if (!success) {
          setOtpError("Invalid OTP. Please try again.");
        }
      }
    };

    return (
      <>
        <div className="objects">
          <div className="box-head">
            <h1>Log in</h1>
          </div>

          <div className="login-tabs">
            <button
              type="button"
              className={`tab-btn ${activeTab === "email" ? "active" : ""}`}
              onClick={() => setActiveTab("email")}
            >
              Email
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "phone" ? "active" : ""}`}
              onClick={() => setActiveTab("phone")}
            >
              Ph no
            </button>
          </div>

          {/* EMAIL LOGIN */}
          {activeTab === "email" && (
            <form onSubmit={handleEmailLogin}>
              <div className="input-box">
                <div className="input-wrapper">
                  <i className="bx bx-envelope"></i>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                    className={emailError ? "error" : ""}
                  />
                </div>
                <div className={`error-message ${emailError ? "show" : ""}`}>{emailError}</div>
              </div>

              <div className="input-box">
                <div className="input-wrapper">
                  <i className="bx bx-lock"></i>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
                    className={passwordError ? "error" : ""}
                  />
                  <i
                    className={`bx ${showPassword ? "bx-show" : "bx-hide"} toggle-password`}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>
                <div className={`error-message ${passwordError ? "show" : ""}`}>{passwordError}</div>
              </div>

              <div className="remember-forgot">
                <label>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  /> Remember me
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); if (onForgotPassword) onForgotPassword(); }}>
                  Forgot password?
                </a>
              </div>

              <div className="login-button">
                <button type="submit">Log in</button>
              </div>
            </form>
          )}

          {/* PHONE LOGIN */}
          {activeTab === "phone" && (
            <form onSubmit={handlePhoneLogin}>
              <div className="input-box">
                <div className="input-wrapper-with-btn">
                  <div className="phone-input-wrapper">
                    <span className="country-code">+91</span>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      maxLength="10"
                      value={phone}
                      onChange={handlePhoneChange}
                    />
                  </div>
                  <button
                    type="button"
                    className="verify-small-btn"
                    onClick={handleSendOtp}
                    disabled={countdown > 0 || sendingOtp}
                  >
                    {sendingOtp ? "Sending..." : countdown > 0 ? `(${countdown}s)` : "Send OTP"}
                  </button>
                </div>
                <div className={`error-message ${phoneError ? "show" : ""}`}>{phoneError}</div>
              </div>

              <div className="input-box">
                <div className="input-wrapper">
                  <i className="bx bx-key"></i>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    maxLength="6"
                    value={otp}
                    autoComplete="one-time-code"
                    onChange={(e) => { setOtp(e.target.value); setOtpError(""); }}
                  />
                </div>
                <div className={`error-message ${otpError ? "show" : ""}`}>{otpError}</div>
              </div>

              <div className="remember-forgot">
                <label>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  /> Remember me
                </label>
              </div>

              <div className="login-button">
                <button type="submit">Log in</button>
              </div>
            </form>
          )}

          <div className="divider"><span>OR</span></div>

          <button type="button" className="google-login" onClick={onGoogleLogin}>
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="google-icon"
            />
            Continue with Google
          </button>

          <div className="account">
            <p>
              Don't have an account?
              <a href="#" className="creat-acc" onClick={(e) => { e.preventDefault(); onSwitchToRegister(); }}>
                Create an account
              </a>
            </p>
          </div>
        </div>
      </>
    );
  },
);

export default LoginForm;