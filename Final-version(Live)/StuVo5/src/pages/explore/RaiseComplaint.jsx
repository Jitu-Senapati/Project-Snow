import { useState } from "react";
import "boxicons/css/boxicons.min.css";
import "../../styles/RaiseComplaint.css";

const COMPLAINT_CATEGORIES = [
  {
    id: "teacher",
    icon: "bx-chalkboard",
    label: "Teacher",
    cssClass: "cat-purple",
  },
  { id: "student", icon: "bx-user", label: "Student", cssClass: "cat-blue" },
  {
    id: "infrastructure",
    icon: "bx-building",
    label: "Infrastructure",
    cssClass: "cat-orange",
  },
  {
    id: "canteen",
    icon: "bx-food-menu",
    label: "Canteen",
    cssClass: "cat-green",
  },
  { id: "hostel", icon: "bx-home", label: "Hostel", cssClass: "cat-yellow" },
  {
    id: "admin",
    icon: "bx-id-card",
    label: "Administration",
    cssClass: "cat-red",
  },
  {
    id: "transport",
    icon: "bx-bus",
    label: "Transport",
    cssClass: "cat-violet",
  },
  {
    id: "other",
    icon: "bx-dots-horizontal-rounded",
    label: "Other",
    cssClass: "cat-gray",
  },
];

const SEVERITY_OPTIONS = [
  { id: "low", label: "Low", desc: "Minor issue", cssClass: "sev-low" },
  {
    id: "medium",
    label: "Medium",
    desc: "Needs attention",
    cssClass: "sev-medium",
  },
  { id: "high", label: "High", desc: "Urgent issue", cssClass: "sev-high" },
];

export default function RaiseComplaint() {
  const [step, setStep] = useState("form");
  const [category, setCategory] = useState(null);
  const [severity, setSeverity] = useState("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [refId] = useState(() =>
    Math.random().toString(36).substring(2, 8).toUpperCase(),
  );

  const validate = () => {
    const errs = {};
    if (!category) errs.category = "Please select a category";
    if (!title.trim()) errs.title = "Title is required";
    else if (title.trim().length < 5)
      errs.title = "Title must be at least 5 characters";
    if (!description.trim()) errs.description = "Please describe the issue";
    else if (description.trim().length < 20)
      errs.description = "Description must be at least 20 characters";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setStep("success");
    }, 1800);
  };

  const handleReset = () => {
    setStep("form");
    setCategory(null);
    setSeverity("medium");
    setTitle("");
    setDescription("");
    setIsAnonymous(false);
    setErrors({});
  };

  const selectedCategory = COMPLAINT_CATEGORIES.find((c) => c.id === category);
  const selectedSeverity = SEVERITY_OPTIONS.find((s) => s.id === severity);

  if (step === "success") {
    return (
      <div className="rc-wrapper">
        <div className="rc-success">
          <div className="rc-success-icon">
            <i className="bx bx-check" />
          </div>
          <h2 className="rc-success-title">Complaint Submitted!</h2>
          <p className="rc-success-body">
            Your complaint has been recorded and will be reviewed by the college
            administration. You'll be notified of updates.
          </p>
          <div className="rc-success-info">
            <div className="rc-info-row">
              <span className="rc-info-label">Category</span>
              <span className="rc-info-value">{selectedCategory?.label}</span>
            </div>
            <div className="rc-info-row">
              <span className="rc-info-label">Severity</span>
              <span
                className={`rc-info-value rc-sev-text ${selectedSeverity?.cssClass}`}
              >
                {selectedSeverity?.label}
              </span>
            </div>
            <div className="rc-info-row">
              <span className="rc-info-label">Anonymous</span>
              <span className="rc-info-value">
                {isAnonymous ? "Yes" : "No"}
              </span>
            </div>
            <div className="rc-info-row">
              <span className="rc-info-label">Ref ID</span>
              <span className="rc-info-value rc-ref-id">#{refId}</span>
            </div>
          </div>
          <button className="rc-new-btn" onClick={handleReset}>
            <i className="bx bx-plus" />
            Raise Another Complaint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rc-wrapper">
      {/* ── Header ── */}
      {/* ── Header ── */}
      <div className="rc-header">
        <button className="syl-back-btn" onClick={() => window.history.back()}>
          <i className="bx bx-arrow-back" />
        </button>
        <div className="rc-header-icon">
          <i className="bx bx-message-error" />
        </div>
        <div>
          <h1 className="rc-title">Raise a Complaint</h1>
          <p className="rc-subtitle">We're here to help resolve your issue</p>
        </div>
      </div>

      {/* ── Category ── */}
      <div className="rc-section">
        <div className="rc-section-label">
          <span>Category</span>
          {errors.category && (
            <span className="rc-error">{errors.category}</span>
          )}
        </div>
        <div className="rc-category-grid">
          {COMPLAINT_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`rc-cat-card ${cat.cssClass}${category === cat.id ? " active" : ""}`}
              onClick={() => {
                setCategory(cat.id);
                setErrors((e) => ({ ...e, category: undefined }));
              }}
            >
              <i className={`bx ${cat.icon}`} />
              <span>{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Severity ── */}
      <div className="rc-section">
        <div className="rc-section-label">
          <span>Severity Level</span>
        </div>
        <div className="rc-severity-row">
          {SEVERITY_OPTIONS.map((sev) => (
            <button
              key={sev.id}
              className={`rc-severity-btn ${sev.cssClass}${severity === sev.id ? " active" : ""}`}
              onClick={() => setSeverity(sev.id)}
            >
              <span className="rc-sev-label">{sev.label}</span>
              <span className="rc-sev-desc">{sev.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Title ── */}
      <div className="rc-section">
        <div className="rc-section-label">
          <span>Complaint Title</span>
          {errors.title && <span className="rc-error">{errors.title}</span>}
        </div>
        <input
          type="text"
          className={`rc-input${errors.title ? " rc-input-error" : ""}`}
          placeholder="Brief summary of the issue"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((er) => ({ ...er, title: undefined }));
          }}
          maxLength={100}
        />
        <span className="rc-char-count">{title.length}/100</span>
      </div>

      {/* ── Description ── */}
      <div className="rc-section">
        <div className="rc-section-label">
          <span>Describe the Issue</span>
          {errors.description && (
            <span className="rc-error">{errors.description}</span>
          )}
        </div>
        <textarea
          className={`rc-textarea${errors.description ? " rc-input-error" : ""}`}
          placeholder="Provide details — what happened, when, where, and who was involved..."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setErrors((er) => ({ ...er, description: undefined }));
          }}
          rows={5}
          maxLength={1000}
        />
        <span className="rc-char-count">{description.length}/1000</span>
      </div>

      {/* ── Submit ── */}
      <div className="rc-section rc-submit-section">
        <button
          className={`rc-submit-btn${submitting ? " loading" : ""}`}
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <i className="bx bx-loader-alt rc-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <i className="bx bx-send" />
              <span>Submit Complaint</span>
            </>
          )}
        </button>
        <p className="rc-disclaimer">
          <i className="bx bx-shield-check" />
          All complaints are confidential and reviewed by senior administration
          within 48 hours.
        </p>
      </div>
    </div>
  );
}
