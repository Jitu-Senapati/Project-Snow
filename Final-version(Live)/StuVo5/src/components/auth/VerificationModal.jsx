import React, { useState, useEffect } from "react";

const VerificationModal = ({ show, onClose, onVerify, type, target }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (show) {
      setCode("");
      setError("");
    }
  }, [show]);

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("Please enter the code");
      return;
    }

    const success = await onVerify(code.trim());
    if (!success) {
      setError("Invalid OTP. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  if (!show) return null;

  return (
    <div className="verify-modal show" id="verifyModal">
      <div className="verify-modal-content">
        <div className="verify-modal-header">
          <h3 id="verifyModalTitle">
            Verify {type === "email" ? "Email" : "Phone"}
          </h3>
          <span className="close-verify" id="closeVerify" onClick={onClose}>
            &times;
          </span>
        </div>
        <div className="verify-modal-body">
          <p className="verify-text">
            Enter the 6-digit code sent to your
            <span id="verifyTarget"> {target}</span>
          </p>
          <div className="code-input-wrapper">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              id="verifyCodeInput"
              placeholder="000000"
              maxLength="6"
              value={code}
              autoComplete="one-time-code"
              onChange={(e) => {
                setCode(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
              className={error ? "error" : ""}
              autoFocus
            />
          </div>
          <div
            className={`error-message ${error ? "show" : ""}`}
            id="verifyCodeError"
          >
            {error}
          </div>
          <button
            type="button"
            className="verify-submit-btn"
            id="verifySubmitBtn"
            onClick={handleSubmit}
          >
            Verify Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;