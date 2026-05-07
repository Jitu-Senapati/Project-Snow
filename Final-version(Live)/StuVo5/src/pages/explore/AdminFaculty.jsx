import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase/config";
import {
  subscribeFaculty,
  addFacultyDoc,
  updateFacultyDoc,
  deleteFacultyDoc,
} from "../../firebase/db";
import "../../styles/AdminFaculty.css";

/* ── Image compression (max 900px, 80% JPEG) ─────────────── */
function compressImage(file, maxPx = 900) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
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

const EMPTY_FORM = {
  id: "", name: "", designation: "", department: "",
  qualification: "", experience: "", specialization: "",
  email: "", phone: "", office: "", bio: "", photoUrl: "",
};

export default function AdminFaculty() {
  const navigate = useNavigate();

  /* ── State ─────────────────────────────────────────────── */
  const [faculty, setFaculty]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [photoPreview, setPhotoPreview]     = useState("");
  const [imageFile, setImageFile]           = useState(null);   // new File selected
  const [isEditing, setIsEditing]           = useState(false);
  const [search, setSearch]                 = useState("");
  const [showDrawer, setShowDrawer]         = useState(false);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [submitting, setSubmitting]         = useState(false);
  const [submitError, setSubmitError]       = useState("");
  const fileRef = useRef(null);

  /* ── Live subscription ─────────────────────────────────── */
  useEffect(() => {
    let active = true;
    const unsub = subscribeFaculty(
      (data) => { if (active) { setFaculty(data); setLoading(false); } },
      ()     => { if (active) setLoading(false); }
    );
    return () => { active = false; unsub(); };
  }, []);

  /* ── Derived ────────────────────────────────────────────── */
  const avgExp = faculty.length
    ? Math.round(faculty.reduce((a, f) => {
        const yrs = f.experience > 1990
          ? new Date().getFullYear() - f.experience
          : (f.experience || 0);
        return a + yrs;
      }, 0) / faculty.length)
    : 0;

  const filteredFaculty = faculty.filter((t) => {
    const q = search.toLowerCase();
    return !q ||
      t.name.toLowerCase().includes(q) ||
      (t.department    || "").toLowerCase().includes(q) ||
      (t.specialization|| "").toLowerCase().includes(q) ||
      (t.designation   || "").toLowerCase().includes(q);
  });

  /* ── Form helpers ───────────────────────────────────────── */
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  /* ── Drawer helpers ─────────────────────────────────────── */
  function openDrawer()  { resetForm(); setShowDrawer(true); }
  function closeDrawer() { setShowDrawer(false); resetForm(); }

  function loadIntoForm(t) {
    setForm({
      id: t.id, name: t.name || "", designation: t.designation || "",
      department: t.department || "", qualification: t.qualification || "",
      experience: t.experience || "", specialization: t.specialization || "",
      email: t.email || "", phone: t.phone || "",
      office: t.office || "", bio: t.bio || "", photoUrl: t.photoUrl || "",
    });
    setPhotoPreview(t.photoUrl || "");
    setImageFile(null);
    setIsEditing(true);
    setShowDrawer(true);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setPhotoPreview("");
    setImageFile(null);
    setIsEditing(false);
    setSubmitError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  /* ── Submit (Add / Update) ──────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    const { name, department, qualification, experience, specialization } = form;
    if (!name || !department || !qualification || !experience || !specialization) {
      setSubmitError("Please fill all required fields.");
      return;
    }
    if (!isEditing && !imageFile) {
      setSubmitError("Please upload a faculty photo.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const id = form.id || crypto.randomUUID();
      let photoUrl = form.photoUrl || "";

      // Upload new/changed photo
      if (imageFile) {
        const compressed = await compressImage(imageFile);
        const storageRef = ref(storage, `faculty/${id}`);
        await uploadBytes(storageRef, compressed);
        photoUrl = await getDownloadURL(storageRef);
      }

      const data = {
        name:           form.name.trim(),
        designation:    form.designation.trim(),
        department:     form.department.trim(),
        qualification:  form.qualification.trim(),
        experience:     Number(form.experience),
        specialization: form.specialization.trim(),
        email:          form.email.trim(),
        phone:          form.phone.trim(),
        office:         form.office.trim(),
        bio:            form.bio.trim(),
        photoUrl,
      };

      if (isEditing) {
        await updateFacultyDoc(id, data);
      } else {
        await addFacultyDoc(id, data);
      }

      closeDrawer();
    } catch (err) {
      console.error("Faculty submit:", err);
      setSubmitError("Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Delete ─────────────────────────────────────────────── */
  async function confirmDelete() {
    if (!deleteConfirm) return;
    try {
      await deleteFacultyDoc(deleteConfirm);
    } catch (err) {
      console.error("Faculty delete:", err);
    }
    setDeleteConfirm(null);
  }

  const deleteTarget = faculty.find((t) => t.id === deleteConfirm);

  /* ──────────────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────────────── */
  return (
    <div className="af-page">

      {/* ── Topbar ── */}
      <div className="af-topbar">
        <div className="af-title-row">
          <button className="af-back-btn" onClick={() => navigate(-1)}>
            <i className="bx bx-arrow-back" />
          </button>
          <h1 className="af-title">Faculty Management</h1>
        </div>
        <p className="af-subtitle">Add, edit or remove faculty profiles</p>

        <div className="af-stats-bar">
          <div className="af-sbar-stat">
            <strong>{faculty.length}</strong>
            <span>Total Faculty</span>
          </div>
          <div className="af-sbar-sep" />
          <div className="af-sbar-stat">
            <strong>{[...new Set(faculty.map((f) => f.department))].length}</strong>
            <span>Departments</span>
          </div>
          <div className="af-sbar-sep" />
          <div className="af-sbar-stat">
            <div className="af-sbar-val-row">
              <strong>{avgExp}+</strong>
              <span className="af-sbar-unit">yrs</span>
            </div>
            <span>Avg. Experience</span>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="af-body">
        <section className="af-list-section">
          <div className="af-list-toolbar">
            <div className="af-search-wrap">
              <i className="bx bx-search" />
              <input
                type="text"
                placeholder="Search by name, dept, specialization…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="af-search-clear" onClick={() => setSearch("")}>
                  <i className="bx bx-x" />
                </button>
              )}
            </div>
            <button className="af-btn-primary af-btn-sm" onClick={openDrawer}>
              <i className="bx bx-plus" /> Add Faculty
            </button>
          </div>

          {loading ? (
            <div className="af-loading">
              <div className="af-spinner" />
              <span>Loading faculty…</span>
            </div>
          ) : filteredFaculty.length === 0 ? (
            <div className="af-empty">
              <i className="bx bx-user-x" />
              <h3>{search ? "No results found" : "No faculty added yet"}</h3>
              <p>{search ? "Try a different search term." : "Click 'Add Faculty' to get started."}</p>
              {!search && (
                <button className="af-btn-primary" onClick={openDrawer}>
                  <i className="bx bx-plus" /> Add First Faculty
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="af-table-wrap">
                <table className="af-table">
                  <thead>
                    <tr>
                      <th>Faculty Member</th><th>Department</th><th>Designation</th>
                      <th>Since</th><th>Contact</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFaculty.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div className="af-table-person">
                            <img
                              src={t.photoUrl || "https://via.placeholder.com/60?text=F"}
                              alt={t.name}
                              onError={(e) => { e.target.src = "https://via.placeholder.com/60?text=F"; }}
                            />
                            <div>
                              <span className="af-table-name">{t.name}</span>
                              {t.qualification && <span className="af-table-qual">{t.qualification}</span>}
                            </div>
                          </div>
                        </td>
                        <td><span className="af-dept-tag">{t.department}</span></td>
                        <td className="af-table-desig">{t.designation}</td>
                        <td><span className="af-exp-badge">{t.experience > 1990 ? t.experience : `${t.experience} yrs`}</span></td>
                        <td>
                          <div className="af-table-contact">
                            {t.email  && <span title={t.email}><i className="bx bx-envelope" /></span>}
                            {t.phone  && <span title={t.phone}><i className="bx bx-phone" /></span>}
                            {t.office && <span title={t.office}><i className="bx bx-map-pin" /></span>}
                          </div>
                        </td>
                        <td>
                          <div className="af-row-actions">
                            <button className="af-row-edit" onClick={() => loadIntoForm(t)}>
                              <i className="bx bx-edit" /> Edit
                            </button>
                            <button className="af-row-delete" onClick={() => setDeleteConfirm(t.id)}>
                              <i className="bx bx-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="af-table-footer">
                  Showing {filteredFaculty.length} of {faculty.length} faculty members
                </div>
              </div>

              {/* Mobile card list */}
              <div className="af-mobile-list">
                {filteredFaculty.map((t) => (
                  <div key={t.id} className="af-mobile-card">
                    <img
                      src={t.photoUrl || "https://via.placeholder.com/60?text=F"}
                      alt={t.name}
                      className="af-mobile-photo"
                      onError={(e) => { e.target.src = "https://via.placeholder.com/60?text=F"; }}
                    />
                    <div className="af-mobile-info">
                      <span className="af-mobile-name">{t.name}</span>
                      <span className="af-mobile-dept">{t.department}</span>
                      {t.designation && <span className="af-mobile-desig">{t.designation}</span>}
                    </div>
                    <div className="af-mobile-actions">
                      <button className="af-row-edit" onClick={() => loadIntoForm(t)}>
                        <i className="bx bx-edit" /> Edit
                      </button>
                      <button className="af-row-delete" onClick={() => setDeleteConfirm(t.id)}>
                        <i className="bx bx-trash" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {/* ════════════════════════════════════════════════════
          ADD / EDIT DRAWER
      ════════════════════════════════════════════════════ */}
      {showDrawer && (
        <div className="af-drawer-overlay" onClick={closeDrawer}>
          <div className="af-drawer" onClick={(e) => e.stopPropagation()}>

            <div className="af-drawer-header">
              <div className="af-drawer-title-row">
                <div className="af-form-icon">
                  <i className={`bx bx-${isEditing ? "edit-alt" : "user-plus"}`} />
                </div>
                <span className="af-drawer-title">
                  {isEditing ? "Edit Faculty" : "Add New Faculty"}
                </span>
              </div>
              <button className="af-drawer-close" onClick={closeDrawer}>
                <i className="bx bx-x" />
              </button>
            </div>

            <div className="af-drawer-body">
              <form id="af-drawer-form" onSubmit={handleSubmit}>

                {/* Photo */}
                <div className="af-photo-upload-row">
                  <div className="af-photo-preview">
                    {photoPreview
                      ? <img src={photoPreview} alt="Preview" />
                      : <div className="af-photo-placeholder"><i className="bx bx-user" /></div>
                    }
                  </div>
                  <div className="af-photo-upload-info">
                    <p className="af-photo-label">
                      Faculty Photo {!isEditing && <span className="af-req">*</span>}
                    </p>
                    <p className="af-photo-hint">Square photo, min 300×300px.</p>
                    <label className="af-upload-btn">
                      <i className="bx bx-upload" />
                      {photoPreview ? "Change Photo" : "Upload Photo"}
                      <input
                        type="file" accept="image/*" ref={fileRef}
                        onChange={handlePhotoSelect} style={{ display: "none" }}
                      />
                    </label>
                  </div>
                </div>

                <div className="af-divider"><span>Basic Information</span></div>
                <div className="af-grid">
                  <div className="af-field">
                    <label>Full Name <span className="af-req">*</span></label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Dr. Full Name" />
                  </div>
                  <div className="af-field">
                    <label>Designation</label>
                    <input name="designation" value={form.designation} onChange={handleChange} placeholder="HOD, Associate Professor…" />
                  </div>
                  <div className="af-field">
                    <label>Department <span className="af-req">*</span></label>
                    <input name="department" value={form.department} onChange={handleChange} placeholder="Computer Science" />
                  </div>
                  <div className="af-field">
                    <label>Qualification <span className="af-req">*</span></label>
                    <input name="qualification" value={form.qualification} onChange={handleChange} placeholder="M.Tech, PhD…" />
                  </div>
                  <div className="af-field">
                    <label>Working Since <span className="af-req">*</span></label>
                    <select name="experience" className="af-select" value={form.experience} onChange={handleChange}>
                      <option value="">Select year…</option>
                      {Array.from(
                        { length: new Date().getFullYear() - 1998 },
                        (_, i) => new Date().getFullYear() - i
                      ).map((yr) => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                  <div className="af-field">
                    <label>Specialization <span className="af-req">*</span></label>
                    <input name="specialization" value={form.specialization} onChange={handleChange} placeholder="AI, Web Dev, VLSI…" />
                  </div>
                </div>

                <div className="af-divider"><span>Contact & Location</span></div>
                <div className="af-grid">
                  <div className="af-field">
                    <label>Email</label>
                    <div className="af-input-icon-wrap">
                      <i className="bx bx-envelope" />
                      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="teacher@college.edu" />
                    </div>
                  </div>
                  <div className="af-field">
                    <label>Phone</label>
                    <div className="af-input-icon-wrap">
                      <i className="bx bx-phone" />
                      <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" />
                    </div>
                  </div>
                  <div className="af-field af-field--full">
                    <label>Office / Cabin</label>
                    <div className="af-input-icon-wrap">
                      <i className="bx bx-map-pin" />
                      <input name="office" value={form.office} onChange={handleChange} placeholder="Block B, Room 204" />
                    </div>
                  </div>
                </div>

                <div className="af-divider"><span>Bio</span></div>
                <div className="af-field">
                  <label>Short Bio</label>
                  <textarea name="bio" rows={3} value={form.bio} onChange={handleChange} placeholder="Write a short professional introduction…" />
                </div>

                {submitError && (
                  <div className="af-submit-err">
                    <i className="bx bx-error-circle" /> {submitError}
                  </div>
                )}

              </form>
            </div>

            <div className="af-drawer-footer">
              <button type="button" className="af-btn-secondary af-drawer-cancel" onClick={closeDrawer} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" form="af-drawer-form" className="af-btn-primary af-drawer-save" disabled={submitting}>
                {submitting
                  ? <><i className="bx bx-loader-alt af-spin" /> Saving…</>
                  : <><i className={`bx bx-${isEditing ? "save" : "plus-circle"}`} />{isEditing ? "Save Changes" : "Add Faculty"}</>
                }
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ════════════════════════════════════════════════════ */}
      {deleteConfirm && (
        <div className="af-confirm-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="af-confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="af-confirm-icon">
              <i className="bx bx-trash" />
            </div>
            <h3 className="af-confirm-title">Delete Faculty?</h3>
            <p className="af-confirm-msg">
              <strong>{deleteTarget?.name}</strong> will be permanently removed.
            </p>
            <div className="af-confirm-actions">
              <button className="af-confirm-btn af-confirm-btn--cancel" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="af-confirm-btn af-confirm-btn--delete" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}