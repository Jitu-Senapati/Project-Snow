import React, { useState } from "react";

const RegisterForm = ({
  onSwitchToLogin,
  onShowTerms,
  onOpenVerifyModal,
  emailVerified,
  phoneVerified,
  resetVerification,
  onRegisterSuccess,
}) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [termsError, setTermsError] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) => /^\d{10}$/.test(phone);

  const validateUsername = (username) => {
    if (!username) return { valid: false, message: "Please enter a username" };
    if (!/^[a-zA-Z]/.test(username))
      return { valid: false, message: "Username must start with a letter" };
    if (/\s/.test(username))
      return { valid: false, message: "Username cannot contain spaces" };
    if (username.length > 9)
      return { valid: false, message: "Username max 9 characters" };
    return { valid: true };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let valid = true;

    const userCheck = validateUsername(username.trim());
    if (!userCheck.valid) {
      setUsernameError(userCheck.message);
      valid = false;
    }

    if (!validateEmail(email.trim())) {
      setEmailError("Invalid email");
      valid = false;
    }

    if (!emailVerified) {
      setEmailError("Please verify your email");
      valid = false;
    }

    if (!validatePhone(phone.trim())) {
      setPhoneError("Invalid phone number");
      valid = false;
    }

    if (!phoneVerified) {
      setPhoneError("Please verify your phone number");
      valid = false;
    }

    if (!password || password.length < 6) {
      setPasswordError("Password min 6 characters");
      valid = false;
    }

    if (!termsChecked) {
      setTermsError(true);
      valid = false;
    }

    if (valid) {
      onRegisterSuccess({ email, password, username, phone });
    }
  };

  return (
    <div>
      {" "}
      {/* IMPORTANT: removed objects-register class here */}
      <div className="box-head-2">
        <h1>Register</h1>
      </div>
      <form id="registerForm" onSubmit={handleSubmit}>
        {/* Username */}
        <div className="input-box">
          <div className="input-wrapper">
            <i className="bx bx-user"></i>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setUsernameError("");
              }}
              className={usernameError ? "error" : ""}
            />
          </div>
          {usernameError && (
            <div className="error-message show">{usernameError}</div>
          )}
        </div>

        {/* Email */}
        <div className="input-box verify-box">
          <div className="input-wrapper-with-btn">
            <div className="input-wrapper">
              <i className="bx bx-envelope"></i>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                  if (emailVerified) resetVerification();
                }}
                className={emailError ? "error" : ""}
              />
            </div>

            <button
              type="button"
              className={`verify-small-btn ${emailVerified ? "verified" : ""}`}
              onClick={() => onOpenVerifyModal("email", email)}
            >
              {emailVerified ? "Verified ✓" : "Verify"}
            </button>
          </div>

          {emailError && <div className="error-message show">{emailError}</div>}
        </div>

        {/* Phone */}
        <div className="input-box verify-box">
          <div className="input-wrapper-with-btn">
            <div className="input-wrapper phone-input-wrapper">
              <span className="country-code">+91</span>
              <input
                type="tel"
                placeholder="Phone number"
                maxLength="10"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setPhone(val);
                  setPhoneError("");
                  if (phoneVerified) resetVerification();
                }}
                className={phoneError ? "error" : ""}
              />
            </div>

            <button
              type="button"
              className={`verify-small-btn ${phoneVerified ? "verified" : ""}`}
              onClick={() => onOpenVerifyModal("phone", "+91 " + phone)}
            >
              {phoneVerified ? "Verified ✓" : "Verify"}
            </button>
          </div>

          {phoneError && <div className="error-message show">{phoneError}</div>}
        </div>

        {/* Password */}
        <div className="input-box">
          <div className="input-wrapper">
            <i className="bx bx-lock"></i>
            <input
              type={showPassword ? "text" : "password"}
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
              onClick={() => setShowPassword(!showPassword)}
            ></i>
          </div>

          {passwordError && (
            <div className="error-message show">{passwordError}</div>
          )}
        </div>

        {/* Terms */}
        <div className="remember">
          <label>
            <input
              type="checkbox"
              checked={termsChecked}
              onChange={(e) => {
                setTermsChecked(e.target.checked);
                setTermsError(false);
              }}
            />
            I agree with{" "}
            <a
              href="#"
              className="auth-link"
              onClick={(e) => {
                e.preventDefault();
                onShowTerms();
              }}
            >
              terms and conditions
            </a>
          </label>
        </div>

        {termsError && (
          <div className="error-message show">
            You must accept terms and conditions
          </div>
        )}

        <div className="Register-button">
          <button type="submit">Register</button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
