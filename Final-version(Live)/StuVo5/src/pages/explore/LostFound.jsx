import React, { useState, useRef } from "react";
import "../../styles/LostFound.css";

const initialPosts = [
  {
    id: 1,
    type: "lost",
    title: "Blue Water Bottle",
    description:
      "Lost my blue Nalgene bottle near the canteen. Has a sticker of a mountain on it.",
    location: "Canteen / Block A",
    date: "2026-04-22",
    postedBy: "Rahul M.",
    contact: "rahul@mits.ac.in",
    image: null,
    resolved: false,
  },
  {
    id: 2,
    type: "found",
    title: "Black Earphones",
    description:
      "Found a pair of black wired earphones near the library entrance. Brand looks like boAt.",
    location: "Library",
    date: "2026-04-23",
    postedBy: "Priya S.",
    contact: "priya@mits.ac.in",
    image: null,
    resolved: false,
  },
  {
    id: 3,
    type: "lost",
    title: "Student ID Card",
    description:
      "Lost my college ID card. Name on card: Arjun Verma, 3rd year CSE.",
    location: "Sports Ground",
    date: "2026-04-21",
    postedBy: "Arjun V.",
    contact: "arjun@mits.ac.in",
    image: null,
    resolved: false,
  },
];

const EMPTY_FORM = {
  type: "lost",
  title: "",
  description: "",
  location: "",
  contact: "",
  image: null,
  imagePreview: null,
};

const LOCATIONS = [
  "Canteen",
  "Library",
  "Block A",
  "Block B",
  "Block C",
  "Hostel",
  "Sports Ground",
  "Parking Area",
  "Admin Block",
  "Other",
];

export default function LostFound() {
  const [posts, setPosts] = useState(initialPosts);
  const [activeTab, setActiveTab] = useState("lost");
  const [modal, setModal] = useState(false);
  const [contactModal, setContactModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const fileRef = useRef(null);

  const currentUser = localStorage.getItem("username") || "Anonymous";

  const visible = posts.filter((p) => {
    const matchTab = p.type === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const openModal = () => {
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setForm(EMPTY_FORM);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({
        ...f,
        image: ev.target.result,
        imagePreview: ev.target.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.description.trim()) return;
    const newPost = {
      id: Date.now(),
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location || "Unknown",
      contact: form.contact.trim(),
      date: new Date().toISOString().split("T")[0],
      postedBy: currentUser,
      image: form.image || null,
      resolved: false,
    };
    setPosts((p) => [newPost, ...p]);
    setActiveTab(form.type);
    closeModal();
  };

  const handleResolve = (id) => {
    setPosts((p) =>
      p.map((post) => (post.id === id ? { ...post, resolved: true } : post)),
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const lostCount = posts.filter(
    (p) => p.type === "lost" && !p.resolved,
  ).length;
  const foundCount = posts.filter(
    (p) => p.type === "found" && !p.resolved,
  ).length;

  return (
    <div className="lf-root">
      {/* ── Header ── */}
      <div className="lf-header">
        <div className="lf-header-text">
          <span className="lf-title">Lost &amp; Found</span>
          <span className="lf-subtitle">Report or recover items on campus</span>
        </div>
        <button className="lf-post-btn" onClick={openModal}>
          <i className="bx bx-plus" />
          Post
        </button>
      </div>

      {/* ── Search ── */}
      <div className="lf-search-wrap">
        <input
          className="lf-search"
          placeholder="Search items, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="lf-search-clear" onClick={() => setSearch("")}>
            <i className="bx bx-x" />
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="lf-tabs">
        <button
          className={`lf-tab${activeTab === "lost" ? " lf-tab--active lf-tab--lost" : ""}`}
          onClick={() => setActiveTab("lost")}
        >
          <i className="bx bx-search-alt" />
          Lost
          {lostCount > 0 && <span className="lf-tab-count">{lostCount}</span>}
        </button>
        <button
          className={`lf-tab${activeTab === "found" ? " lf-tab--active lf-tab--found" : ""}`}
          onClick={() => setActiveTab("found")}
        >
          <i className="bx bx-check-shield" />
          Found
          {foundCount > 0 && (
            <span className="lf-tab-count lf-tab-count--found">
              {foundCount}
            </span>
          )}
        </button>
      </div>

      {/* ── List ── */}
      <div className="lf-list">
        <div className="lf-list-header">
          <span className="lf-list-title">
            {activeTab === "lost" ? "Lost Items" : "Found Items"}
          </span>
          <span className="lf-count-badge">{visible.length}</span>
        </div>

        {visible.length === 0 ? (
          <div className="lf-empty">
            <i
              className={`bx ${activeTab === "lost" ? "bx-search" : "bx-box"}`}
            />
            <span>No {activeTab} items posted yet</span>
            <button className="lf-empty-btn" onClick={openModal}>
              + Post one
            </button>
          </div>
        ) : (
          <div className="lf-cards">
            {visible.map((post) => (
              <div
                key={post.id}
                className={`lf-card${post.resolved ? " lf-card--resolved" : ""}`}
              >
                {/* Image */}
                {post.image && (
                  <div className="lf-card-img-wrap">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="lf-card-img"
                    />
                    {post.resolved && (
                      <div className="lf-resolved-overlay">
                        <i className="bx bx-check-circle" />
                        Resolved
                      </div>
                    )}
                  </div>
                )}

                <div className="lf-card-body">
                  {/* Top row */}
                  <div className="lf-card-top">
                    <div className="lf-card-title-row">
                      <span className="lf-card-title">{post.title}</span>
                      {post.resolved && (
                        <span className="lf-resolved-pill">
                          <i className="bx bx-check" /> Resolved
                        </span>
                      )}
                    </div>
                    <span className={`lf-type-pill lf-type-pill--${post.type}`}>
                      {post.type === "lost" ? "Lost" : "Found"}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="lf-card-desc">{post.description}</p>

                  {/* Meta */}
                  <div className="lf-card-meta">
                    <span className="lf-meta-item">
                      <i className="bx bx-map-pin" />
                      {post.location}
                    </span>
                    <span className="lf-meta-item">
                      <i className="bx bx-calendar" />
                      {formatDate(post.date)}
                    </span>
                    <span className="lf-meta-item">
                      <i className="bx bx-user" />
                      {post.postedBy}
                    </span>
                  </div>

                  {/* Actions */}
                  {!post.resolved && (
                    <div className="lf-card-actions">
                      <button
                        className="lf-btn lf-btn--contact"
                        onClick={() => setContactModal(post)}
                      >
                        <i className="bx bx-message-dots" />
                        Contact
                      </button>
                      {post.postedBy === currentUser ? (
                        <button
                          className="lf-btn lf-btn--resolve"
                          onClick={() => handleResolve(post.id)}
                        >
                          <i className="bx bx-check" />
                          Mark Resolved
                        </button>
                      ) : (
                        <span className="lf-resolve-hint">
                          <i className="bx bx-lock-alt" />
                          Only poster can resolve
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Post Modal ── */}
      {modal && (
        <div className="lf-overlay" onClick={closeModal}>
          <div className="lf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lf-modal-header">
              <span className="lf-modal-title">Post Item</span>
              <button className="lf-modal-close" onClick={closeModal}>
                <i className="bx bx-x" />
              </button>
            </div>

            <div className="lf-modal-body">
              {/* Type toggle */}
              <div className="lf-type-toggle">
                <button
                  className={`lf-type-btn${form.type === "lost" ? " lf-type-btn--lost" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, type: "lost" }))}
                >
                  <i className="bx bx-search-alt" /> I Lost Something
                </button>
                <button
                  className={`lf-type-btn${form.type === "found" ? " lf-type-btn--found" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, type: "found" }))}
                >
                  <i className="bx bx-check-shield" /> I Found Something
                </button>
              </div>

              {/* Image upload */}
              <div
                className="lf-img-upload"
                onClick={() => fileRef.current?.click()}
              >
                {form.imagePreview ? (
                  <img
                    src={form.imagePreview}
                    alt="preview"
                    className="lf-img-preview"
                  />
                ) : (
                  <>
                    <i className="bx bx-image-add" />
                    <span>
                      Add Photo <em>(optional)</em>
                    </span>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="lf-file-input"
                  onChange={handleImage}
                />
              </div>
              {form.imagePreview && (
                <button
                  className="lf-remove-img"
                  onClick={() =>
                    setForm((f) => ({ ...f, image: null, imagePreview: null }))
                  }
                >
                  <i className="bx bx-trash" /> Remove photo
                </button>
              )}

              {/* Fields */}
              <div className="lf-field">
                <label className="lf-label">Item Name *</label>
                <input
                  className="lf-input"
                  placeholder="e.g. Blue Water Bottle"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>

              <div className="lf-field">
                <label className="lf-label">Description *</label>
                <textarea
                  className="lf-input lf-textarea"
                  placeholder="Describe the item — colour, brand, any identifiable marks…"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="lf-field">
                <label className="lf-label">Location</label>
                <select
                  className="lf-input lf-select"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                >
                  <option value="">Select location…</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="lf-field">
                <label className="lf-label">Your Contact (email / phone)</label>
                <input
                  className="lf-input"
                  placeholder="e.g. yourname@mits.ac.in"
                  value={form.contact}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contact: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="lf-modal-footer">
              <button className="lf-btn lf-btn--cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                className={`lf-btn lf-btn--submit lf-btn--submit-${form.type}`}
                onClick={handleSubmit}
              >
                <i className="bx bx-send" />
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contact Modal ── */}
      {contactModal && (
        <div className="lf-overlay" onClick={() => setContactModal(null)}>
          <div
            className="lf-contact-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lf-modal-header">
              <span className="lf-modal-title">Contact Info</span>
              <button
                className="lf-modal-close"
                onClick={() => setContactModal(null)}
              >
                <i className="bx bx-x" />
              </button>
            </div>

            <div className="lf-contact-body">
              <div className="lf-contact-item-name">
                <i
                  className={`bx ${
                    contactModal.type === "lost"
                      ? "bx-search-alt"
                      : "bx-check-shield"
                  }`}
                />
                {contactModal.title}
              </div>

              <div className="lf-contact-row">
                <i className="bx bx-user" />
                <div>
                  <span className="lf-contact-label">Posted by</span>
                  <span className="lf-contact-value">
                    {contactModal.postedBy}
                  </span>
                </div>
              </div>

              {contactModal.contact ? (
                <div className="lf-contact-row">
                  <i className="bx bx-envelope" />
                  <div>
                    <span className="lf-contact-label">Contact</span>
                    <a
                      href={`mailto:${contactModal.contact}`}
                      className="lf-contact-link"
                    >
                      {contactModal.contact}
                    </a>
                  </div>
                </div>
              ) : (
                <div className="lf-contact-row lf-contact-row--muted">
                  <i className="bx bx-info-circle" />
                  <span>No contact info provided</span>
                </div>
              )}

              <div className="lf-contact-row">
                <i className="bx bx-map-pin" />
                <div>
                  <span className="lf-contact-label">Location</span>
                  <span className="lf-contact-value">
                    {contactModal.location}
                  </span>
                </div>
              </div>

              <div className="lf-contact-row">
                <i className="bx bx-calendar" />
                <div>
                  <span className="lf-contact-label">Date posted</span>
                  <span className="lf-contact-value">
                    {formatDate(contactModal.date)}
                  </span>
                </div>
              </div>

              {contactModal.contact && (
                <a
                  href={`mailto:${contactModal.contact}?subject=Regarding your Lost & Found post: ${contactModal.title}`}
                  className="lf-email-btn"
                >
                  <i className="bx bx-envelope" />
                  Send Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
