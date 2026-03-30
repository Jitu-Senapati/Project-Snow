import { useState } from "react";
import "boxicons/css/boxicons.min.css";
import "../../styles/SupportUs.css";

// ── Replace this with your actual QR code image path or URL ──
const QR_PLACEHOLDER = null; // Set to your QR image path e.g. "/qr-code.png"

const UPI_ID = "yourname@upi"; // ← Replace with your UPI ID
const COLLEGE_NAME = "STUVO5 College";

const PRESET_AMOUNTS = [10, 20, 50, 100, 200, 500];

export default function SupportUs() {
  const [copied, setCopied] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [thankYou, setThankYou] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(UPI_ID).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDonateClick = () => {
    const amt = selectedAmount || customAmount;
    if (!amt) return;
    setThankYou(true);
    setTimeout(() => setThankYou(false), 3500);
  };

  const activeAmount = selectedAmount || customAmount;

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
          {QR_PLACEHOLDER ? (
            <img
              src={QR_PLACEHOLDER}
              alt="Payment QR Code"
              className="su-qr-img"
            />
          ) : (
            /* Placeholder grid when no QR provided */
            <div className="su-qr-placeholder">
              <div className="su-qr-grid">
                {Array.from({ length: 121 }).map((_, i) => (
                  <div
                    key={i}
                    className={`su-qr-cell ${Math.random() > 0.5 ? "filled" : ""}`}
                  />
                ))}
              </div>
              <div className="su-qr-corners">
                <div className="su-qr-corner tl" />
                <div className="su-qr-corner tr" />
                <div className="su-qr-corner bl" />
              </div>
            </div>
          )}
        </div>

        <div className="su-upi-row">
          <span className="su-upi-label">UPI ID</span>
          <span className="su-upi-id">{UPI_ID}</span>
          <button
            className={`su-copy-btn${copied ? " copied" : ""}`}
            onClick={handleCopy}
          >
            <i className={`bx ${copied ? "bx-check" : "bx-copy"}`} />
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* ── Amount Selector ── */}
      <div className="su-card su-amount-card">
        <div className="su-card-label">
          <i className="bx bx-rupee" />
          <span>Choose Amount</span>
        </div>

        <div className="su-preset-grid">
          {PRESET_AMOUNTS.map((amt) => (
            <button
              key={amt}
              className={`su-preset-btn${selectedAmount === amt ? " active" : ""}`}
              onClick={() => {
                setSelectedAmount(amt);
                setCustomAmount("");
              }}
            >
              ₹{amt}
            </button>
          ))}
        </div>

        <div className="su-custom-row">
          <span className="su-rupee-symbol">₹</span>
          <input
            type="number"
            className="su-custom-input"
            placeholder="Enter custom amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(null);
            }}
            min="1"
          />
        </div>

        <button
          className={`su-donate-btn${activeAmount ? " ready" : ""}`}
          onClick={handleDonateClick}
          disabled={!activeAmount}
        >
          <i className="bx bx-heart" />
          <span>
            {activeAmount ? `Donate ₹${activeAmount}` : "Select an amount"}
          </span>
        </button>
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
            {
              icon: "bx-shield-check",
              text: "Keep the platform ad-free & private",
            },
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

      {/* ── Thank You Toast ── */}
      {thankYou && (
        <div className="su-toast">
          <i className="bx bx-heart" />
          <span>Thank you for your support! 💜</span>
        </div>
      )}
    </div>
  );
}
