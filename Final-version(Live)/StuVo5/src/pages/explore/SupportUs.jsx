import { useState } from "react";
import "boxicons/css/boxicons.min.css";
import "../../styles/SupportUs.css";
import QRImage from "../../assets/QR_code.jpeg";

export default function SupportUs() {
  return (
    <div className="su-wrapper">
      {/* ── Header ── */}
      <div className="su-header">
        <button className="su-back-btn" onClick={() => window.history.back()}>
          <i className="bx bx-arrow-back" />
        </button>
        <div className="su-header-icon">
          <i className="bx bx-donate-heart" />
        </div>
        <h1 className="su-title">Support Us</h1>
        <p className="su-subtitle">
          Your contribution helps us build a better college experience for
          everyone
        </p>
      </div>

      {/* ── QR Code Card ── */}
      <div className="su-card su-qr-card">
        <div className="su-card-label">
          <i className="bx bx-qr" />
          <span>Scan to Pay</span>
        </div>
        <div className="su-qr-box">
          <img src={QRImage} alt="Payment QR Code" className="su-qr-img" />
        </div>
      </div>

      {/* ── Why Support Section ── */}
      <div className="su-card su-why-card">
        <div className="su-card-label">
          <i className="bx bx-info-circle" />
          <span>Why Support?</span>
        </div>
        <div className="su-why-list">
          {[
            { icon: "bx-devices", text: "Improve app features & performance" },
            { icon: "bx-server", text: "Cover hosting & infrastructure costs" },
            { icon: "bx-bulb", text: "Fund new student-focused innovations" },
            { icon: "bx-shield-check", text: "Keep the platform ad-free & private" },
          ].map((item, i) => (
            <div className="su-why-item" key={i}>
              <div className="su-why-icon">
                <i className={`bx ${item.icon}`} />
              </div>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
