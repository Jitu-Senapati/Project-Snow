import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/LostFound.css";
import { useAuth } from "../../context/AuthContext";
import {
  subscribeLostFound,
  addLostFoundPost,
  resolveLostFoundPost,
  deleteLostFoundPost,
} from "../../firebase/db";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/config";

/* ── Constants ─────────────────────────────────────────── */
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

const EMPTY_FORM = {
  type: "lost",
  title: "",
  description: "",
  location: "",
  customLocation: "",
  contact: "",
  imageFile: null,
  imagePreview: null,
};

/* ── Image compression ──────────────────────────────────── */
function compressImage(file, maxPx = 900) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => { URL.revokeObjectURL(url); resolve(blob); },
        "image/jpeg", 0.8
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/* ── Date formatter ─────────────────────────────────────── */
function formatDate(val) {
  if (!val) return "—";
  const d = val?.toDate ? val.toDate() : new Date(val);
  return d.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function LostFound() {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("lost");
  const [search, setSearch]         = useState("");
  const [modal, setModal]           = useState(false);
  const [contactModal, setContactModal] = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [resolving, setResolving]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // postId pending deletion
  const fileRef = useRef(null);

  const uid         = currentUser?.uid;
  const displayName = userProfile?.fullName || userProfile?.username || currentUser?.email || "Anonymous";

  /* ── Firestore live subscription ────────────────────────── */
  useEffect(() => {
    let active = true;   // guards against StrictMode double-invoke race

    const unsub = subscribeLostFound(
      (data) => {
        if (!active) return;
        setPosts(data);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        console.error("LostFound subscription:", err.code);
        setLoading(false);  // stop spinner even on error
      }
    );

    return () => {
      active = false;
      unsub();
    };
  }, []);

  /* ── Counts ─────────────────────────────────────────────── */
  const lostCount     = posts.filter((p) => p.type === "lost"  && !p.resolved).length;
  const foundCount    = posts.filter((p) => p.type === "found" && !p.resolved).length;
  const resolvedCount = posts.filter((p) => p.resolved).length;
  const myCount       = posts.filter((p) => p.postedByUid === uid).length;

  /* ── Filtered list (already ordered desc by Firestore) ──── */
  const visible = posts.filter((p) => {
    let matchTab = false;
    if (activeTab === "lost")     matchTab = p.type === "lost"  && !p.resolved;
    if (activeTab === "found")    matchTab = p.type === "found" && !p.resolved;
    if (activeTab === "resolved") matchTab = p.resolved === true;
    if (activeTab === "my")       matchTab = p.postedByUid === uid;

    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (p.title || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.location || "").toLowerCase().includes(q);

    return matchTab && matchSearch;
  });

  /* ── Modal helpers ──────────────────────────────────────── */
  const openModal = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError("");
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError("");
  };

  /* ── Image select (lost only) ───────────────────────────── */
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm((f) => ({
      ...f,
      imageFile: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  /* ── Validation ─────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = "Item name is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.contact.trim())     e.contact     = "Contact is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      let imageUrl = null;

      // Upload image only for "lost" posts
      if (form.type === "lost" && form.imageFile) {
        const compressed = await compressImage(form.imageFile);
        const storageRef = ref(storage, `lostFound/${uid}_${Date.now()}`);
        await uploadBytes(storageRef, compressed);
        imageUrl = await getDownloadURL(storageRef);
      }

      const finalLocation =
        form.location === "Other"
          ? (form.customLocation.trim() || "Other")
          : (form.location || "Unspecified");

      await addLostFoundPost({
        type:        form.type,
        title:       form.title.trim(),
        description: form.description.trim(),
        location:    finalLocation,
        contact:     form.contact.trim(),
        postedBy:    displayName,
        postedByUid: uid,
        imageUrl,
      });

      setActiveTab(form.type);
      closeModal();
    } catch (err) {
      console.error("LostFound submit:", err);
      setSubmitError("Failed to post. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Resolve ────────────────────────────────────────────── */
  const handleResolve = async (postId) => {
    setResolving(postId);
    try { await resolveLostFoundPost(postId); }
    catch (err) { console.error("Resolve:", err); }
    finally { setResolving(null); }
  };

  /* ── Delete ─────────────────────────────────────────────── */
  const handleDelete = async (postId) => {
    setDeleteConfirm(null);
    try { await deleteLostFoundPost(postId); }
    catch (err) { console.error("Delete:", err); }
  };

  /* ── Tab label ──────────────────────────────────────────── */
  const TAB_TITLES = {
    lost: "Lost Items", found: "Found Items",
    resolved: "Resolved Posts", my: "My Posts",
  };

  /* ─────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────── */
  return (
    <div className="lf-root">

      {/* ── Header ── */}
      <div className="lf-header">
        <button className="lf-back-btn" onClick={() => navigate(-1)}>
          <i className="bx bx-arrow-back" />
        </button>
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
        {/* Lost */}
        <button
          className={`lf-tab${activeTab === "lost" ? " lf-tab--active lf-tab--lost" : ""}`}
          onClick={() => setActiveTab("lost")}
        >
          <i className="bx bx-search-alt" />
          Lost
          {lostCount > 0 && <span className="lf-tab-count">{lostCount}</span>}
        </button>

        {/* Found */}
        <button
          className={`lf-tab${activeTab === "found" ? " lf-tab--active lf-tab--found" : ""}`}
          onClick={() => setActiveTab("found")}
        >
          <i className="bx bx-check-shield" />
          Found
          {foundCount > 0 && (
            <span className="lf-tab-count lf-tab-count--found">{foundCount}</span>
          )}
        </button>

        {/* Resolved */}
        <button
          className={`lf-tab${activeTab === "resolved" ? " lf-tab--active lf-tab--resolved" : ""}`}
          onClick={() => setActiveTab("resolved")}
        >
          <i className="bx bx-check-double" />
          Resolved
          {resolvedCount > 0 && (
            <span className="lf-tab-count lf-tab-count--resolved">{resolvedCount}</span>
          )}
        </button>

        {/* My Posts */}
        <button
          className={`lf-tab${activeTab === "my" ? " lf-tab--active lf-tab--my" : ""}`}
          onClick={() => setActiveTab("my")}
        >
          <i className="bx bx-user" />
          My Posts
          {myCount > 0 && (
            <span className="lf-tab-count lf-tab-count--my">{myCount}</span>
          )}
        </button>
      </div>

      {/* ── Cards List ── */}
      <div className="lf-list">
        <div className="lf-list-header">
          <span className="lf-list-title">{TAB_TITLES[activeTab]}</span>
          <span className="lf-count-badge">{loading ? "…" : visible.length}</span>
        </div>

        {loading ? (
          <div className="lf-loading">
            <div className="lf-spinner" />
            <span>Loading posts…</span>
          </div>
        ) : visible.length === 0 ? (
          <div className="lf-empty">
            <i className={`bx ${
              activeTab === "lost"     ? "bx-search"       :
              activeTab === "found"   ? "bx-box"           :
              activeTab === "resolved"? "bx-check-circle"  : "bx-user"
            }`} />
            <span>
              {activeTab === "my"       ? "You haven't posted anything yet"   :
               activeTab === "resolved" ? "No resolved posts yet"             :
               `No ${activeTab} items posted yet`}
            </span>
            {(activeTab === "lost" || activeTab === "found") && (
              <button className="lf-empty-btn" onClick={openModal}>+ Post one</button>
            )}
          </div>
        ) : (
          <div className="lf-cards">
            {visible.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                uid={uid}
                resolving={resolving}
                activeTab={activeTab}
                onContact={() => setContactModal(post)}
                onResolve={() => handleResolve(post.id)}
                onDelete={() => setDeleteConfirm(post.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════
          POST MODAL
      ════════════════════════════════════════════════════ */}
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
                  onClick={() => setForm((f) => ({ ...f, type: "lost", imageFile: null, imagePreview: null }))}
                >
                  <i className="bx bx-search-alt" /> I Lost Something
                </button>
                <button
                  className={`lf-type-btn${form.type === "found" ? " lf-type-btn--found" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, type: "found", imageFile: null, imagePreview: null }))}
                >
                  <i className="bx bx-check-shield" /> I Found Something
                </button>
              </div>

              {/* Image upload — LOST only */}
              {form.type === "lost" && (
                <>
                  <div className="lf-img-upload" onClick={() => fileRef.current?.click()}>
                    {form.imagePreview ? (
                      <img src={form.imagePreview} alt="preview" className="lf-img-preview" />
                    ) : (
                      <>
                        <i className="bx bx-image-add" />
                        <span>Add Photo <em>(optional)</em></span>
                      </>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="lf-file-input"
                      onChange={handleImageSelect}
                    />
                  </div>
                  {form.imagePreview && (
                    <button
                      className="lf-remove-img"
                      onClick={() => setForm((f) => ({ ...f, imageFile: null, imagePreview: null }))}
                    >
                      <i className="bx bx-trash" /> Remove photo
                    </button>
                  )}
                </>
              )}

              {/* Item Name */}
              <div className="lf-field">
                <label className="lf-label">
                  Item Name <span className="lf-req">*</span>
                </label>
                <input
                  className={`lf-input${errors.title ? " lf-input--error" : ""}`}
                  placeholder="e.g. Blue Water Bottle"
                  value={form.title}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, title: e.target.value }));
                    if (errors.title) setErrors((er) => ({ ...er, title: "" }));
                  }}
                />
                {errors.title && <span className="lf-field-err">{errors.title}</span>}
              </div>

              {/* Description */}
              <div className="lf-field">
                <label className="lf-label">
                  Description <span className="lf-req">*</span>
                </label>
                <textarea
                  className={`lf-input lf-textarea${errors.description ? " lf-input--error" : ""}`}
                  placeholder="Describe the item — colour, brand, any identifiable marks…"
                  value={form.description}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, description: e.target.value }));
                    if (errors.description) setErrors((er) => ({ ...er, description: "" }));
                  }}
                />
                {errors.description && <span className="lf-field-err">{errors.description}</span>}
              </div>

              {/* Location */}
              <div className="lf-field">
                <label className="lf-label">Location</label>
                <select
                  className="lf-input lf-select"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value, customLocation: "" }))
                  }
                >
                  <option value="">Select location…</option>
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Custom location — shown when "Other" selected */}
              {form.location === "Other" && (
                <div className="lf-field lf-field--custom-loc">
                  <label className="lf-label">Specify Location</label>
                  <input
                    className="lf-input"
                    placeholder="e.g. Near the water cooler, 2nd floor…"
                    value={form.customLocation}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, customLocation: e.target.value }))
                    }
                    autoFocus
                  />
                </div>
              )}

              {/* Contact */}
              <div className="lf-field">
                <label className="lf-label">
                  Your Contact (email / phone) <span className="lf-req">*</span>
                </label>
                <input
                  className={`lf-input${errors.contact ? " lf-input--error" : ""}`}
                  placeholder="e.g. yourname@mits.ac.in or 9xxxxxxxxx"
                  value={form.contact}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, contact: e.target.value }));
                    if (errors.contact) setErrors((er) => ({ ...er, contact: "" }));
                  }}
                />
                {errors.contact && <span className="lf-field-err">{errors.contact}</span>}
              </div>

              {/* Server-side error */}
              {submitError && (
                <div className="lf-submit-err">
                  <i className="bx bx-error-circle" /> {submitError}
                </div>
              )}
            </div>

            <div className="lf-modal-footer">
              <button
                className="lf-btn lf-btn--cancel"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className={`lf-btn lf-btn--submit lf-btn--submit-${form.type}`}
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <><i className="bx bx-loader-alt lf-spin" /> Posting…</>
                  : <><i className="bx bx-send" /> Post</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div className="lf-overlay lf-overlay--center" onClick={() => setDeleteConfirm(null)}>
          <div className="lf-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lf-confirm-icon">
              <i className="bx bx-trash" />
            </div>
            <h3 className="lf-confirm-title">Delete Post?</h3>
            <p className="lf-confirm-desc">
              This post will be permanently removed. This action cannot be undone.
            </p>
            <div className="lf-confirm-actions">
              <button
                className="lf-btn lf-btn--cancel"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="lf-btn lf-btn--delete"
                onClick={() => handleDelete(deleteConfirm)}
              >
                <i className="bx bx-trash" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          CONTACT MODAL
      ════════════════════════════════════════════════════ */}
      {contactModal && (
        <div className="lf-overlay" onClick={() => setContactModal(null)}>
          <div className="lf-contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lf-modal-header">
              <span className="lf-modal-title">Contact Info</span>
              <button className="lf-modal-close" onClick={() => setContactModal(null)}>
                <i className="bx bx-x" />
              </button>
            </div>
            <div className="lf-contact-body">
              <div className="lf-contact-item-name">
                <i className={`bx ${contactModal.type === "lost" ? "bx-search-alt" : "bx-check-shield"}`} />
                {contactModal.title}
              </div>
              <div className="lf-contact-row">
                <i className="bx bx-user" />
                <div>
                  <span className="lf-contact-label">Posted by</span>
                  <span className="lf-contact-value">{contactModal.postedBy}</span>
                </div>
              </div>
              {contactModal.contact ? (
                <div className="lf-contact-row">
                  <i className="bx bx-envelope" />
                  <div>
                    <span className="lf-contact-label">Contact</span>
                    <a href={`mailto:${contactModal.contact}`} className="lf-contact-link">
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
                  <span className="lf-contact-value">{contactModal.location}</span>
                </div>
              </div>
              <div className="lf-contact-row">
                <i className="bx bx-calendar" />
                <div>
                  <span className="lf-contact-label">Date posted</span>
                  <span className="lf-contact-value">{formatDate(contactModal.createdAt)}</span>
                </div>
              </div>
              {contactModal.contact && (
                <a
                  href={`mailto:${contactModal.contact}?subject=Regarding your Lost & Found post: ${contactModal.title}`}
                  className="lf-email-btn"
                >
                  <i className="bx bx-envelope" /> Send Email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   POST CARD
═══════════════════════════════════════════════════════════ */
function PostCard({ post, uid, resolving, activeTab, onContact, onResolve, onDelete }) {
  const isOwner = post.postedByUid === uid;

  return (
    <div className={`lf-card${post.resolved ? " lf-card--resolved" : ""}`}>
      {/* Image */}
      {post.imageUrl && (
        <div className="lf-card-img-wrap" id={`imgwrap-${post.id}`}>
          <img
            src={post.imageUrl}
            alt={post.title}
            className="lf-card-img"
            onError={(e) => {
              // Hide whole wrapper if image fails to load (CORS / network issue)
              const wrap = document.getElementById(`imgwrap-${post.id}`);
              if (wrap) wrap.style.display = "none";
            }}
          />
          {post.resolved && (
            <div className="lf-resolved-overlay">
              <i className="bx bx-check-circle" /> Resolved
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
          <span className="lf-meta-item"><i className="bx bx-map-pin" />{post.location}</span>
          <span className="lf-meta-item"><i className="bx bx-calendar" />{formatDate(post.createdAt)}</span>
          <span className="lf-meta-item"><i className="bx bx-user" />{post.postedBy}</span>
        </div>

        {/* Active post actions */}
        {!post.resolved && (
          <div className="lf-card-actions">
            <button className="lf-btn lf-btn--contact" onClick={onContact}>
              <i className="bx bx-message-dots" /> Contact
            </button>
            {isOwner ? (
              <button
                className="lf-btn lf-btn--resolve"
                onClick={onResolve}
                disabled={resolving === post.id}
              >
                {resolving === post.id
                  ? <><i className="bx bx-loader-alt lf-spin" /> Resolving…</>
                  : <><i className="bx bx-check" /> Mark Resolved</>
                }
              </button>
            ) : (
              <span className="lf-resolve-hint">
                <i className="bx bx-lock-alt" /> Only poster can resolve
              </span>
            )}
          </div>
        )}

        {/* My Posts: delete resolved posts */}
        {activeTab === "my" && isOwner && post.resolved && (
          <div className="lf-card-actions lf-card-actions--single">
            <button className="lf-btn lf-btn--delete" onClick={onDelete}>
              <i className="bx bx-trash" /> Delete Post
            </button>
          </div>
        )}
      </div>
    </div>
  );
}