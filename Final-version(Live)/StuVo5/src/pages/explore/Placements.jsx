import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { subscribeToPlacements, savePlacements } from "../../firebase/db";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/config";
import "../../styles/placements.css";

/* ═══════════════════════════════════════════════════════════
   SQUARE CROP MODAL  (for company logo)
═══════════════════════════════════════════════════════════ */
function PlacementCropModal({ isOpen, onClose, onApply, imageUrl }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const stateRef = useRef({ offsetX: 0, offsetY: 0, isDragging: false, lastX: 0, lastY: 0, image: null });

  const drawCrop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.image) return;
    const ctx = canvas.getContext("2d");
    const { image, offsetX, offsetY } = stateRef.current;
    const cw = canvas.width, ch = canvas.height;
    const baseScale = Math.max(cw / image.width, ch / image.height);
    const totalScale = baseScale * zoom;
    const drawW = image.width * totalScale, drawH = image.height * totalScale;
    const minX = cw - drawW, minY = ch - drawH;
    const clampedX = Math.min(0, Math.max(offsetX, minX));
    const clampedY = Math.min(0, Math.max(offsetY, minY));
    stateRef.current.offsetX = clampedX;
    stateRef.current.offsetY = clampedY;
    ctx.clearRect(0, 0, cw, ch);
    // Draw image across full canvas
    ctx.drawImage(image, clampedX, clampedY, drawW, drawH);
    // Darken the area OUTSIDE the square using 4 rectangles
    const pad = Math.min(cw, ch) * 0.05;
    const sq = Math.min(cw, ch) - pad * 2;
    const sx = (cw - sq) / 2, sy = (ch - sq) / 2;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0,      0,      cw,      sy);           // top
    ctx.fillRect(0,      sy + sq, cw,     ch - sy - sq); // bottom
    ctx.fillRect(0,      sy,      sx,      sq);           // left
    ctx.fillRect(sx + sq, sy,    cw - sx - sq, sq);      // right
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, sq, sq);
    ctx.restore();
  }, [zoom]);

  useEffect(() => {
    if (!isOpen || !imageUrl || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      stateRef.current.image = img;
      stateRef.current.offsetX = 0; stateRef.current.offsetY = 0;
      const rect = canvasRef.current.parentElement.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.width; // square canvas
      drawCrop();
    };
    img.src = imageUrl;
  }, [isOpen, imageUrl, drawCrop]);

  useEffect(() => { if (isOpen) drawCrop(); }, [zoom, isOpen, drawCrop]);

  const handleMouseDown = (e) => { stateRef.current.isDragging = true; stateRef.current.lastX = e.clientX; stateRef.current.lastY = e.clientY; };
  const handleTouchStart = (e) => { stateRef.current.isDragging = true; stateRef.current.lastX = e.touches[0].clientX; stateRef.current.lastY = e.touches[0].clientY; };
  const handleMouseMove = useCallback((e) => {
    if (!stateRef.current.isDragging) return;
    stateRef.current.offsetX += e.clientX - stateRef.current.lastX;
    stateRef.current.offsetY += e.clientY - stateRef.current.lastY;
    stateRef.current.lastX = e.clientX; stateRef.current.lastY = e.clientY;
    drawCrop();
  }, [drawCrop]);
  const handleTouchMove = useCallback((e) => {
    if (!stateRef.current.isDragging) return;
    stateRef.current.offsetX += e.touches[0].clientX - stateRef.current.lastX;
    stateRef.current.offsetY += e.touches[0].clientY - stateRef.current.lastY;
    stateRef.current.lastX = e.touches[0].clientX; stateRef.current.lastY = e.touches[0].clientY;
    drawCrop();
  }, [drawCrop]);
  const handleMouseUp = useCallback(() => { stateRef.current.isDragging = false; }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.image) return;
    const { image, offsetX, offsetY } = stateRef.current;
    const cw = canvas.width, ch = canvas.height;
    const pad = Math.min(cw, ch) * 0.05;
    const sq = Math.min(cw, ch) - pad * 2;
    const sx = (cw - sq) / 2, sy = (ch - sq) / 2;
    const outSize = 500;
    const scale = outSize / sq;
    const baseScale = Math.max(cw / image.width, ch / image.height);
    const totalScale = baseScale * zoom;
    const drawW = image.width * totalScale, drawH = image.height * totalScale;
    const minX = cw - drawW, minY = ch - drawH;
    const clampedX = Math.min(0, Math.max(offsetX, minX));
    const clampedY = Math.min(0, Math.max(offsetY, minY));
    const offscreen = document.createElement("canvas");
    offscreen.width = outSize; offscreen.height = outSize;
    const octx = offscreen.getContext("2d");
    octx.drawImage(image,
      (clampedX - sx) * scale, (clampedY - sy) * scale,
      drawW * scale, drawH * scale
    );
    onApply(offscreen.toDataURL("image/jpeg", 0.85));
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="pl-crop-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pl-crop-modal">
        <div className="pl-crop-header">
          <span>Crop Company Logo</span>
          <button className="pl-crop-close" onClick={onClose}><i className="bx bx-x" /></button>
        </div>
        <div className="pl-crop-canvas-wrap">
          <canvas ref={canvasRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            style={{ width: "100%", aspectRatio: "1/1", cursor: "grab", display: "block" }}
          />
        </div>
        <div className="pl-crop-zoom">
          <i className="bx bx-minus" />
          <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
          <i className="bx bx-plus" />
        </div>
        <div className="pl-crop-actions">
          <button className="pl-btn pl-btn--cancel" onClick={onClose}>Cancel</button>
          <button className="pl-btn pl-btn--save" onClick={handleApply}><i className="bx bx-check" /> Apply</button>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "all",      label: "All",      icon: "bx-grid-alt" },
  { key: "upcoming", label: "Upcoming", icon: "bx-calendar" },
  { key: "ongoing",  label: "Ongoing",  icon: "bx-building-house" },
  { key: "finished", label: "Finished", icon: "bx-check-circle" },
];

const STATUS_CONFIG = {
  ongoing:  { color: "#4ade80", bg: "rgba(74,222,128,0.12)",  label: "Ongoing" },
  upcoming: { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  label: "Upcoming" },
  finished: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", label: "Finished" },
};

const EMPTY_FORM = { name: "", role: "", date: "", status: "", link: "", branches: [], img: "" };

const BRANCHES = [
  { value: "BCA",          label: "BCA" },
  { value: "BBA",          label: "BBA" },
  { value: "BSC-BIOTECH",  label: "B.Sc. Biotech" },
  { value: "BSC-FOODTECH", label: "B.Sc. Food Tech" },
  { value: "BSC-AGRI",     label: "B.Sc. Agri" },
  { value: "MSC-BIOTECH",  label: "M.Sc. Biotech" },
  { value: "MSC-MICRO",    label: "M.Sc. Micro" },
  { value: "MSC-INDBIO",   label: "M.Sc. Ind. Biotech" },
  { value: "MSC-CS",       label: "M.Sc. CS" },
  { value: "MTECH-CS",     label: "M.Tech CS" },
  { value: "BTECH-BT",     label: "B.Tech BT" },
  { value: "BTECH-CE",     label: "B.Tech Civil" },
  { value: "BTECH-CSE",    label: "B.Tech CSE" },
  { value: "BTECH-EE",     label: "B.Tech EE" },
  { value: "BTECH-BS",     label: "B.Tech BS" },
  { value: "BTECH-ME",     label: "B.Tech Mech" },
];


const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
};


// Quick label lookup for display
const branchLabel = (code) =>
  BRANCHES.find((b) => b.value === code)?.label || code;
export default function Placements() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Admin-only state
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [cropUrl, setCropUrl] = useState(null);
  const imgInputRef = useRef(null);

  // Subscribe to Firestore
  useEffect(() => {
    const unsub = subscribeToPlacements((items) => {
      setData(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  const visible = activeTab === "all" ? data : data.filter((d) => d.status === activeTab);

  // ── Admin handlers ──
  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setError("");
    setModal(true);
  };

  const openEdit = (item) => {
    setForm({
      name: item.name,
      role: item.role,
      date: item.date,
      status: item.status,
      link: item.link || "",
      branches: item.branches || [],
      img: item.img || "",
    });
    setEditId(item.id);
    setError("");
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setForm(EMPTY_FORM);
    setEditId(null);
    setError("");
  };

  const toggleBranch = (value) => {
    setForm((f) => ({
      ...f,
      branches: f.branches.includes(value)
        ? f.branches.filter((b) => b !== value)
        : [...f.branches, value],
    }));
  };

  const toggleAllBranches = () => {
    setForm((f) => ({
      ...f,
      branches: f.branches.length === BRANCHES.length
        ? []
        : BRANCHES.map((b) => b.value),
    }));
  };

  const handleImgFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropUrl(url);
    e.target.value = "";
  };

  const handleSave = async () => {
    const errors = [];
    if (!form.name.trim()) errors.push("Company name");
    if (!form.status.trim()) errors.push("Status");
    if (errors.length) { setError(`${errors.join(" & ")} required`); return; }
    setError("");
    setSaving(true);
    try {
      let imgUrl = form.img;
      // Upload to Firebase Storage if a new image was cropped (data URL)
      if (imgUrl && imgUrl.startsWith("data:")) {
        const blob = await fetch(imgUrl).then((r) => r.blob());
        const sRef = storageRef(storage, `companyImages/${Date.now()}_${form.name.replace(/\s+/g, "_")}.jpg`);
        await uploadBytes(sRef, blob);
        imgUrl = await getDownloadURL(sRef);
      }
      let updated;
      if (editId) {
        updated = data.map((item) =>
          item.id === editId ? { ...item, ...form, img: imgUrl } : item
        );
      } else {
        updated = [...data, { id: Date.now().toString(), ...form, img: imgUrl }];
      }
      await savePlacements(updated);
      closeModal();
    } catch (err) {
      console.error("Save placement error:", err);
      setError("Failed to save — check Firestore rules");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const updated = data.filter((item) => item.id !== deleteTarget.id);
    try {
      await savePlacements(updated);
    } catch (err) {
      console.error("Delete placement error:", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="pl-root">
        <div className="pl-header">
          <span className="pl-title">Placements</span>
        </div>
        <div className="pl-empty">
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: 32 }} />
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-root">
      {/* Header */}
      <div className="pl-header">
        <button className="pl-back-btn" onClick={() => editMode ? setEditMode(false) : navigate(-1)}>
          <i className="bx bx-arrow-back" />
        </button>
        <span className="pl-title">{editMode ? "Edit Placements" : "Placements"}</span>
        {isAdmin && !editMode && (
          <button className="pl-header-edit" onClick={() => setEditMode(true)}>
            <i className="bx bx-edit" /> Edit
          </button>
        )}
        {isAdmin && editMode && (
          <button className="pl-header-add" onClick={openAdd}>
            <i className="bx bx-plus" /> Add
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="pl-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`pl-tab${activeTab === tab.key ? " pl-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <i className={`bx ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="pl-list-section">
        <div className="pl-list-header">
          <span className="pl-list-title">
            {TABS.find((t) => t.key === activeTab)?.label} Companies
          </span>
          <span className="pl-count-badge">{visible.length}</span>
        </div>

        {visible.length === 0 ? (
          <div className="pl-empty">
            <i className="bx bx-inbox" />
            <span>No companies here yet</span>
          </div>
        ) : (
          <div className="pl-cards">
            {visible.map((item) => {
              const st = STATUS_CONFIG[item.status];
              return (
                <div key={item.id} className="pl-card">
                  {/* Top row: badge + info + actions */}
                  <div className="pl-card-row">
                    <div className="pl-company-badge">
                      {item.img ? (
                        <img src={item.img} className="pl-company-img" alt={item.name} />
                      ) : (
                        <>
                          <i className="bx bx-buildings" />
                          <span>{item.name.slice(0, 3).toUpperCase()}</span>
                        </>
                      )}
                    </div>

                    <div className="pl-card-info">
                      <div className="pl-card-top">
                        <div className="pl-card-left">
                          <span className="pl-company-name">{item.name}</span>
                          {item.role && (
                            <div className="pl-card-role">
                              <i className="bx bx-briefcase" />
                              {item.role}
                            </div>
                          )}
                          <div className="pl-card-meta">
                            <i className="bx bx-calendar" />
                            {formatDate(item.date)}
                          </div>
                        </div>
                        <div className="pl-card-right">
                          <span className="pl-status" style={{ color: st.color, background: st.bg }}>
                            {st.label}
                          </span>
                          {!editMode && item.link && (
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="pl-register-btn"
                            >
                              <i className="bx bx-link-external" />
                              Register
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Admin: Show link text (edit mode only) */}
                      {isAdmin && editMode && item.link && (
                        <div className="pl-card-link">
                          <i className="bx bx-link" />
                          <span className="pl-link-text">{item.link}</span>
                        </div>
                      )}
                    </div>

                    {/* Admin: Edit/Delete buttons (edit mode only) */}
                    {isAdmin && editMode && (
                      <div className="pl-card-actions">
                        <button
                          className="pl-action-btn pl-action-btn--edit"
                          onClick={() => openEdit(item)}
                        >
                          <i className="bx bx-edit" />
                        </button>
                        <button
                          className="pl-action-btn pl-action-btn--del"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <i className="bx bx-trash" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Branch eligibility — full width below */}
                  {item.branches?.length > 0 && (
                    <div className="pl-card-branches">
                      <span className="pl-card-branches__label">
                        <i className="bx bx-git-branch" /> Branch:
                      </span>
                      <div className="pl-card-branches__tags">
                        {item.branches.length === 16 ? (
                          <span className="pl-branch-tag pl-branch-tag--all">All Branches</span>
                        ) : (
                          item.branches.map((code) => (
                            <span key={code} className="pl-branch-tag">{branchLabel(code)}</span>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Admin: Add/Edit modal */}
      {isAdmin && editMode && modal && (
        <div className="pl-modal-overlay" onClick={closeModal}>
          <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pl-modal-header">
              <span className="pl-modal-title">
                {editId ? "Edit Company" : "Add Company"}
              </span>
            </div>
            <div className="pl-modal-body">
              {/* Company logo image picker */}
              <div className="pl-field pl-img-field">
                <div className="pl-img-picker" onClick={() => imgInputRef.current?.click()}>
                  {form.img ? (
                    <img src={form.img} className="pl-img-preview" alt="logo" />
                  ) : (
                    <div className="pl-img-placeholder">
                      <i className="bx bx-image-add" />
                      <span>Add Logo</span>
                    </div>
                  )}
                </div>
                <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImgFile} />
              </div>
              <div className="pl-field">
                <label className="pl-label">Company Name *</label>
                <input
                  className="pl-input"
                  placeholder="e.g. Google"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="pl-field">
                <label className="pl-label">Role</label>
                <input
                  className="pl-input"
                  placeholder="e.g. Software Engineer"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                />
              </div>
              <div className="pl-field">
                <label className="pl-label">Date</label>
                <input
                  className="pl-input"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="pl-field">
                <label className="pl-label">Status *</label>
                <select
                  className="pl-input pl-select"
                  value={form.status}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="" disabled>Select status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div className="pl-field">
                <label className="pl-label">Registration Link</label>
                <input
                  className="pl-input"
                  placeholder="https://company.com/apply"
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                />
              </div>
              <div className="pl-field">
                <label className="pl-label">Eligible Branches</label>
                <div className="pl-branches-grid">
                  <button
                    type="button"
                    className={`pl-branch-chip pl-branch-chip--all${form.branches.length === BRANCHES.length ? " pl-branch-chip--selected" : ""}`}
                    onClick={toggleAllBranches}
                  >
                    {form.branches.length === BRANCHES.length ? "✓ All Branches" : "All Branches"}
                  </button>
                  {BRANCHES.map((b) => (
                    <button
                      key={b.value}
                      type="button"
                      className={`pl-branch-chip${form.branches.includes(b.value) ? " pl-branch-chip--selected" : ""}`}
                      onClick={() => toggleBranch(b.value)}
                    >
                      {form.branches.includes(b.value) ? `✓ ${b.label}` : b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {error && (
              <div style={{ padding: "0 18px 4px", color: "#f87171", fontSize: 12, fontWeight: 500 }}>
                {error}
              </div>
            )}
            <div className="pl-modal-footer">
              <button className="pl-btn pl-btn--cancel" onClick={closeModal}>
                Cancel
              </button>
              <button
                className="pl-btn pl-btn--save"
                onClick={handleSave}
                disabled={saving}
              >
                <i className={`bx ${saving ? "bx-loader-alt bx-spin" : "bx-check"}`} />
                {editId ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company logo crop modal */}
      <PlacementCropModal
        isOpen={!!cropUrl}
        imageUrl={cropUrl}
        onClose={() => setCropUrl(null)}
        onApply={(dataUrl) => { setForm((f) => ({ ...f, img: dataUrl })); setCropUrl(null); }}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="pl-confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="pl-confirm-box" onClick={(e) => e.stopPropagation()}>
            <p className="pl-confirm-title">Remove Company?</p>
            <p className="pl-confirm-msg">
              You want to remove <strong>{deleteTarget.name}</strong> from placements?
            </p>
            <div className="pl-confirm-actions">
              <button className="pl-confirm-btn pl-confirm-btn--cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="pl-confirm-btn pl-confirm-btn--remove" onClick={handleDelete}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}