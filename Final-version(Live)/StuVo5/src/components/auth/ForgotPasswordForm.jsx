import { useState } from "react";

const ForgotPasswordForm = ({ onBackToLogin }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userContact, setUserContact] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Form states
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error states
  const [emailPhoneError, setEmailPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Resend button state
  const [resendText, setResendText] = useState("Resend");
  const [resendDisabled, setResendDisabled] = useState(false);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com)$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  // Mask functions
  const maskEmail = (email) => {
    const [username, domain] = email.split("@");
    const masked = username.substring(0, 2) + "***" + username.slice(-1);
    return masked + "@" + domain;
  };

  const maskPhone = (phone) => {
    return "******" + phone.slice(-4);
  };

  // Step 1: Email/Phone verification
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setEmailPhoneError("");

    const input = emailOrPhone.trim();

    if (!input) {
      setEmailPhoneError("Please enter your email or phone number");
      return;
    }

    const isEmail = input.includes("@");
    const isValid = isEmail ? validateEmail(input) : validatePhone(input);

    if (!isValid) {
      setEmailPhoneError(
        isEmail
          ? "Please enter a valid email address"
          : "Please enter a valid 10-digit phone number",
      );
      return;
    }

    setUserContact(input);
    setSentTo(isEmail ? maskEmail(input) : maskPhone(input));
    setCurrentStep(2);
    console.log(`Verification code sent to ${input}`);
  };

  // Step 2: OTP verification
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setOtpError("");

    const code = otpCode.trim();

    if (!code) {
      setOtpError("Please enter the verification code");
      return;
    }

    if (code.length !== 6) {
      setOtpError("Code must be 6 digits");
      return;
    }

    if (!/^[0-9]{6}$/.test(code)) {
      setOtpError("Please enter a valid 6-digit code");
      return;
    }

    setCurrentStep(3);
    console.log("Code verified successfully");
  };

  // Resend code
  const handleResendCode = (e) => {
    e.preventDefault();
    setResendText("Sent!");
    setResendDisabled(true);

    setTimeout(() => {
      setResendText("Resend");
      setResendDisabled(false);
    }, 3000);

    console.log("Verification code resent");
  };

  // Step 3: New password creation
  const handleNewPasswordSubmit = (e) => {
    e.preventDefault();

    let isValid = true;
    setNewPasswordError("");
    setConfirmPasswordError("");

    if (!newPassword.trim()) {
      setNewPasswordError("Please enter a new password");
      isValid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please re-enter your password");
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    if (isValid) {
      console.log("Password updated successfully");
      setShowSuccess(true);

      setTimeout(() => {
        if (onBackToLogin) onBackToLogin();
      }, 2000);
    }
  };

  // Back button handler
  const handleBackToStep1 = (e) => {
    e.preventDefault();
    setOtpCode("");
    setOtpError("");
    setCurrentStep(1);
  };

  // Handle OTP input with auto-format
  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setOtpCode(value);
    setOtpError("");
  };

  // In ForgotPasswordForm.jsx, replace the return statement:

  return (
    <div className="forgot-password-content">
      {/* Success Notification */}
      <div className={`success-notification ${showSuccess ? 'show' : ''}`}>
        <i className='bx bx-check-circle'></i>
        <span>Password changed successfully!</span>
      </div>

      {/* Step 1: Email/Phone Input */}
      <div className={`step-container ${currentStep !== 1 ? 'hidden' : ''}`} id="step1">
        <div className="box-head">
          <h1>Forgot Password?</h1>
          <p className="subtitle">Enter your registered email or phone number</p>
        </div>
        <form id="emailForm" onSubmit={handleEmailSubmit}>
          <div className="input-box">
            <div className="input-wrapper-verify">
              <div className="input-with-icon">
                <i className='bx bx-envelope'></i>
                <input
                  type="text"
                  id="emailOrPhone"
                  placeholder="Email or Phone Number"
                  value={emailOrPhone}
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value);
                    setEmailPhoneError('');
                  }}
                  className={emailPhoneError ? 'error' : ''}
                />
              </div>
              <button type="submit" className="verify-btn">Verify</button>
            </div>
            <div className={`error-message ${emailPhoneError ? 'show' : ''}`} id="emailPhoneError">
              {emailPhoneError || 'Please enter a valid email or phone number'}
            </div>
          </div>
        </form>
        <div className="back-to-login">
          <a href="#" onClick={(e) => { e.preventDefault(); if (onBackToLogin) onBackToLogin(); }}>
            <i className='bx bx-arrow-back'></i> Back to Login
          </a>
        </div>
      </div>

      {/* Step 2: OTP Verification */}
      <div className={`step-container ${currentStep !== 2 ? 'hidden' : ''}`} id="step2">
        <div className="box-head">
          <h1>Verify Code</h1>
          <p className="subtitle">
            Enter the verification code sent to <span id="sentTo">{sentTo}</span>
          </p>
        </div>
        <form id="otpForm" onSubmit={handleOtpSubmit}>
          <div className="input-box">
            <div className="input-wrapper">
              <i className='bx bx-lock-open'></i>
              <input
                type="text"
                id="otpCode"
                placeholder="Enter 6-digit code"
                maxLength="6"
                value={otpCode}
                onChange={handleOtpChange}
                className={otpError ? 'error' : ''}
              />
            </div>
            <div className={`error-message ${otpError ? 'show' : ''}`} id="otpError">
              {otpError || 'Please enter the verification code'}
            </div>
          </div>
          <div className="verify-button">
            <button type="submit">Verify Code</button>
          </div>
          <div className="resend-code">
            <p>Didn't receive code?
              <a
                href="#"
                id="resendCode"
                onClick={handleResendCode}
                style={{ pointerEvents: resendDisabled ? 'none' : 'auto' }}
              >
                {resendText}
              </a>
            </p>
          </div>
        </form>
        <div className="back-to-login">
          <a href="#" id="backToStep1" onClick={handleBackToStep1}>
            <i className='bx bx-arrow-back'></i> Back
          </a>
        </div>
      </div>

      {/* Step 3: New Password */}
      <div className={`step-container ${currentStep !== 3 ? 'hidden' : ''}`} id="step3">
        <div className="box-head">
          <h1>Create New Password</h1>
          <p className="subtitle">
            Your new password must be different from previous passwords
          </p>
        </div>
        <form id="newPasswordForm" onSubmit={handleNewPasswordSubmit}>
          <div className="input-box">
            <div className="input-wrapper">
              <i className='bx bx-lock'></i>
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setNewPasswordError('');
                }}
                className={newPasswordError ? 'error' : ''}
              />
              <i
                className={`bx ${showNewPassword ? 'bx-show' : 'bx-hide'} toggle-password`}
                id="toggleNewPassword"
                onClick={() => setShowNewPassword(!showNewPassword)}
              ></i>
            </div>
            <div className={`error-message ${newPasswordError ? 'show' : ''}`} id="newPasswordError">
              {newPasswordError || 'Password must be at least 6 characters'}
            </div>
          </div>
          <div className="input-box">
            <div className="input-wrapper">
              <i className='bx bx-lock'></i>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Re-enter Password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setConfirmPasswordError('');
                }}
                className={confirmPasswordError ? 'error' : ''}
              />
              <i
                className={`bx ${showConfirmPassword ? 'bx-show' : 'bx-hide'} toggle-password`}
                id="toggleConfirmPassword"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              ></i>
            </div>
            <div className={`error-message ${confirmPasswordError ? 'show' : ''}`} id="confirmPasswordError">
              {confirmPasswordError || 'Passwords do not match'}
            </div>
          </div>
          <div className="confirm-button">
            <button type="submit">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
