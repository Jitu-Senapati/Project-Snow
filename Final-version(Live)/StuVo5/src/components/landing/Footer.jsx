import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { saveSupportRequest } from "../../firebase/db";

const EMAILJS_SERVICE_ID  = "service_a3vaoeq";
const EMAILJS_TEMPLATE_ID = "template_55etri8";
const EMAILJS_PUBLIC_KEY  = "sCgzp5Hhl1FqOTFHD";

const Footer = () => {
  const [showPrivacy, setShowPrivacy]   = useState(false);
  const [showContact, setShowContact]   = useState(false);
  const [contactStep, setContactStep]   = useState(1);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors]     = useState({});
  const [refId, setRefId]       = useState("");
  const [sending, setSending]   = useState(false);
  const [sendError, setSendError] = useState("");

  const topics = [
    { emoji: "🔐", label: "Unable to Login" },
    { emoji: "📝", label: "Account Creation Issue" },
    { emoji: "🔑", label: "Forgot / Change Password" },
    { emoji: "📧", label: "Email Verification Issue" },
    { emoji: "👤", label: "Profile Update Problem" },
    { emoji: "📊", label: "Marks / Attendance Issue" },
    { emoji: "🔔", label: "Notifications Not Working" },
    { emoji: "🚫", label: "Can't Access Features" },
    { emoji: "🐛", label: "Bug / Technical Error" },
    { emoji: "💡", label: "Suggestion / Feedback" },
    { emoji: "⛔", label: "Account Suspended" },
    { emoji: "❓", label: "Other / General Query" },
  ];

  const openPrivacy = (e) => {
    e.preventDefault();
    setShowPrivacy(true);
    document.body.style.overflow = "hidden";
  };
  const closePrivacy = () => {
    setShowPrivacy(false);
    document.body.style.overflow = "";
  };

  const openContact = (e) => {
    e.preventDefault();
    setContactStep(1);
    setSelectedTopic("");
    setFormData({ name: "", email: "", message: "" });
    setErrors({});
    setSendError("");
    setShowContact(true);
    document.body.style.overflow = "hidden";
  };
  const closeContact = () => {
    setShowContact(false);
    document.body.style.overflow = "";
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    setContactStep(2);
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const key = id.replace("contact", "").toLowerCase();
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    let valid = true;
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.contactName = "Please enter your name";
      valid = false;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.contactEmail = "Please enter a valid email";
      valid = false;
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      newErrors.contactMessage = "Please describe your issue (at least 10 characters)";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSendMessage = async () => {
    if (!validateForm()) return;
    setSending(true);
    setSendError("");

    const newRefId = "STU-" + Date.now().toString(36).toUpperCase().slice(-6);

    try {
      // 1. Send email via EmailJS
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name:  formData.name,
          from_email: formData.email,
          topic:      selectedTopic,
          message:    formData.message,
          ref_id:     newRefId,
        },
        EMAILJS_PUBLIC_KEY
      );

      // 2. Save to Firestore
      await saveSupportRequest({
        name:    formData.name,
        email:   formData.email,
        topic:   selectedTopic,
        message: formData.message,
        refId:   newRefId,
      });

      setRefId(newRefId);
      setContactStep(3);
    } catch (err) {
      console.error("Support request failed:", err);
      setSendError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <footer className="site-footer">
        <div className="footer-links">
          <a href="#" onClick={openPrivacy}>Privacy</a>
          <a href="#" onClick={openContact}>Contact with STUVO5</a>
        </div>
        <span className="footer-copy">© 2026 STUVO5. All rights reserved.</span>
      </footer>

      {/* Privacy Modal */}
      {showPrivacy && (
        <div className="privacy-modal show" onClick={(e) => e.target === e.currentTarget && closePrivacy()}>
          <div className="terms-content">
            <div className="terms-header">
              <h2>Privacy Policy – STUVO5</h2>
              <span className="close-terms" onClick={closePrivacy}>&times;</span>
            </div>
            <div className="terms-body">
              <h3>1. Introduction</h3>
              <p>Your privacy is important to us. This Privacy Policy explains how STUVO5 collects, uses, and protects your personal information when you use our platform.</p>
              <h3>2. Data We Collect</h3>
              <p>We collect your name, email address, username, roll number, branch, year, profile photo (optional), and general usage activity within the platform.</p>
              <h3>3. How We Use Your Data</h3>
              <p>Your data is used solely to provide and improve our student services. We do not use your data for advertising or any commercial purpose.</p>
              <h3>4. Data Storage & Security</h3>
              <p>We take reasonable measures to protect your information. However, as STUVO5 is an academic project, we cannot guarantee absolute security.</p>
              <h3>5. Cookies & Sessions</h3>
              <p>STUVO5 may use session data to keep you logged in and remember your preferences. No third-party tracking cookies are used.</p>
              <h3>6. Third-Party Services</h3>
              <p>If you choose to sign in with Google, your basic Google profile information may be shared with us as permitted by Google's OAuth policy. We do not store your Google password.</p>
              <h3>7. Data Sharing</h3>
              <p>We do not sell, trade, or share your personal data with any external parties.</p>
              <h3>8. Your Rights</h3>
              <p>You have the right to request access to, correction of, or deletion of your personal data at any time.</p>
              <h3>9. Minors</h3>
              <p>STUVO5 is intended for college students aged 17 or older. We do not knowingly collect data from minors under this age.</p>
              <h3>10. Policy Updates</h3>
              <p>This policy may be updated as the platform evolves. Continued use after updates implies acceptance of the revised policy.</p>
              <h3>11. Contact Regarding Privacy</h3>
              <p>For any privacy-related concerns, please reach us through the Contact page. We aim to respond within 48 hours.</p>
            </div>
            <div className="terms-footer">
              <button className="accept-terms" onClick={closePrivacy}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div className="contact-modal show" onClick={(e) => e.target === e.currentTarget && closeContact()}>
          <div className="contact-content">
            <div className="terms-header">
              <h2>Contact STUVO5 Support</h2>
              <span className="close-terms" onClick={closeContact}>&times;</span>
            </div>

            {/* Step 1 — Topic selection */}
            {contactStep === 1 && (
              <div className="contact-step">
                <div className="contact-body">
                  <p className="contact-subtitle">What do you need help with?</p>
                  <div className="topic-grid">
                    {topics.map((topic, index) => (
                      <button key={index} className="topic-btn" onClick={() => handleTopicSelect(topic.label)}>
                        {topic.emoji} {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Form */}
            {contactStep === 2 && (
              <div className="contact-step">
                <div className="contact-body">
                  <button className="contact-back-btn" onClick={() => setContactStep(1)}>← Back</button>
                  <div className="selected-topic-badge">📌 {selectedTopic}</div>

                  <div className="contact-form-group">
                    <label>Your Name</label>
                    <div className="contact-input-wrapper">
                      <i className="bx bx-user" />
                      <input
                        type="text" id="contactName"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        style={{ borderColor: errors.contactName ? "#ef4444" : "" }}
                      />
                    </div>
                    {errors.contactName && <div className="contact-error">{errors.contactName}</div>}
                  </div>

                  <div className="contact-form-group">
                    <label>Email Address</label>
                    <div className="contact-input-wrapper">
                      <i className="bx bx-envelope" />
                      <input
                        type="email" id="contactEmail"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        style={{ borderColor: errors.contactEmail ? "#ef4444" : "" }}
                      />
                    </div>
                    {errors.contactEmail && <div className="contact-error">{errors.contactEmail}</div>}
                  </div>

                  <div className="contact-form-group">
                    <label>Describe Your Issue</label>
                    <div className="contact-input-wrapper">
                      <i className="bx bx-message-detail textarea-icon" />
                      <textarea
                        id="contactMessage"
                        placeholder="Tell us more about your issue..."
                        rows="4"
                        value={formData.message}
                        onChange={handleInputChange}
                        style={{ borderColor: errors.contactMessage ? "#ef4444" : "" }}
                      />
                    </div>
                    {errors.contactMessage && <div className="contact-error">{errors.contactMessage}</div>}
                  </div>

                  {sendError && (
                    <div className="contact-error" style={{ textAlign: "center", fontSize: 13 }}>
                      {sendError}
                    </div>
                  )}

                  <button className="send-message-btn" onClick={handleSendMessage} disabled={sending}>
                    {sending
                      ? <><i className="bx bx-loader-alt bx-spin" /> Sending…</>
                      : <><i className="bx bx-send" /> Send Message</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Success */}
            {contactStep === 3 && (
              <div className="contact-step">
                <div className="contact-body contact-success-body">
                  <div className="success-icon-wrap">
                    <i className="bx bx-check-circle" />
                  </div>
                  <h3 className="success-title">Message Sent!</h3>
                  <p className="success-msg">
                    Thank you for reaching out. Our team will get back to you within <strong>24 hours</strong> on your registered email.
                  </p>
                  <p className="success-ref">Reference ID: <span>{refId}</span></p>
                  <button className="accept-terms" onClick={closeContact} style={{ marginTop: "24px", width: "100%" }}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Footer;