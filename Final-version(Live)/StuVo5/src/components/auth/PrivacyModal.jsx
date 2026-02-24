// src/components/auth/PrivacyModal.jsx
import React from "react";

const PrivacyModal = () => {
  const closeModal = () => {
    document.getElementById("privacyModal").classList.remove("show");
  };

  return (
    <div
      className="terms-modal privacy-modal"
      id="privacyModal"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="terms-content">
        <div className="terms-header">
          <h2>Privacy Policy</h2>
          <span className="close-terms" onClick={closeModal}>
            &times;
          </span>
        </div>
        <div className="terms-body">
          <h3>Information We Collect</h3>
          <p>
            We collect information you provide directly to us, including your
            name, email address, phone number, academic information, and profile
            photo.
          </p>

          <h3>How We Use Your Information</h3>
          <p>
            We use the information we collect to provide, maintain, and improve
            our services, to communicate with you, and to personalize your
            experience.
          </p>

          <h3>Information Sharing</h3>
          <p>
            We do not sell or share your personal information with third parties
            except as described in this policy or with your consent.
          </p>

          <h3>Data Security</h3>
          <p>
            We implement reasonable security measures to protect your personal
            information. However, no method of transmission over the Internet is
            100% secure.
          </p>

          <h3>Your Rights</h3>
          <p>
            You have the right to access, update, or delete your personal
            information. Contact us to exercise these rights.
          </p>
        </div>
        <div className="terms-footer">
          <button className="accept-terms" onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyModal;
