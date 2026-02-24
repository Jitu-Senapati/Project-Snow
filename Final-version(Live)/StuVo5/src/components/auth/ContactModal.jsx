import React, { useState } from "react";

const ContactModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [refId, setRefId] = useState("");

  if (!isOpen) return null;

  const topics = [
    { icon: "🔐", text: "Unable to Login" },
    { icon: "📝", text: "Account Creation / Registration Issue" },
    { icon: "🔑", text: "Unable to Change Password" },
    { icon: "📧", text: "Email Verification Issue" },
    { icon: "👤", text: "Profile Update Problem" },
    { icon: "📊", text: "Marks / Attendance Not Showing" },
    { icon: "🔔", text: "Not Receiving Notifications" },
    { icon: "🚫", text: "Unable to Access Features" },
    { icon: "🐛", text: "Bug / Technical Error" },
    { icon: "💡", text: "Suggestion or Feedback" },
    { icon: "⛔", text: "Account Suspended or Blocked" },
    { icon: "❓", text: "Other / General Query" },
  ];

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setStep(2);
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Please enter your name";
    }
    if (
      !formData.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.message = "Please describe your issue (at least 10 characters)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const id = "STU-" + Date.now().toString(36).toUpperCase().slice(-6);
    setRefId(id);
    setStep(3);
  };

  const resetAndClose = () => {
    setStep(1);
    setSelectedTopic("");
    setFormData({ name: "", email: "", message: "" });
    setErrors({});
    onClose();
  };

  return (
    <div className="contact-modal show">
      <div className="contact-content">
        <div className="terms-header">
          <h2>Contact STUVO5 Support</h2>
          <span className="close-terms" onClick={resetAndClose}>
            &times;
          </span>
        </div>

        {step === 1 && (
          <div className="contact-body">
            <p className="contact-subtitle">What do you need help with?</p>
            <div className="topic-grid">
              {topics.map((topic) => (
                <button
                  key={topic.text}
                  className="topic-btn"
                  onClick={() => handleTopicSelect(topic.text)}
                >
                  <span className="topic-icon">{topic.icon}</span>
                  <span className="topic-text">{topic.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="contact-body">
            <button className="contact-back-btn" onClick={() => setStep(1)}>
              <i className="bx bx-arrow-back"></i> Back
            </button>
            <div className="selected-topic-badge">📌 {selectedTopic}</div>

            <div className="contact-form-group">
              <label>
                <i className="bx bx-user"></i> Your Name
              </label>
              <div className="contact-input-wrapper">
                <i className="bx bx-user"></i>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && (
                <div className="contact-error show">{errors.name}</div>
              )}
            </div>

            <div className="contact-form-group">
              <label>
                <i className="bx bx-envelope"></i> Email Address
              </label>
              <div className="contact-input-wrapper">
                <i className="bx bx-envelope"></i>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <div className="contact-error show">{errors.email}</div>
              )}
            </div>

            <div className="contact-form-group">
              <label>
                <i className="bx bx-message-detail"></i> Describe Your Issue
              </label>
              <div className="contact-input-wrapper">
                <i className="bx bx-message-detail textarea-icon"></i>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Tell us more about your issue..."
                  rows="4"
                ></textarea>
              </div>
              {errors.message && (
                <div className="contact-error show">{errors.message}</div>
              )}
            </div>

            <button className="send-message-btn" onClick={handleSubmit}>
              <i className="bx bx-send"></i> Send Message
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="contact-body contact-success-body">
            <div className="success-icon-wrap">
              <i className="bx bx-check-circle"></i>
            </div>
            <h3 className="success-title">Message Sent!</h3>
            <p className="success-msg">
              Thank you for reaching out. Our team will get back to you within{" "}
              <strong>24 hours</strong> on your registered email.
            </p>
            <p className="success-ref">
              Reference ID: <span>{refId}</span>
            </p>
            <button
              className="accept-terms"
              onClick={resetAndClose}
              style={{ marginTop: "24px", width: "100%" }}
            >
              <i className="bx bx-check"></i> Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactModal;
