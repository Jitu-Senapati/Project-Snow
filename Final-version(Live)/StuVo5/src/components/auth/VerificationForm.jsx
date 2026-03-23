import { linkEmailPasswordToPhoneAccount, linkGoogleAfterRegistration, uploadProfilePhoto } from "../../firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import logo from "../../assets/logo192px.png";
import { auth, db } from "../../firebase/config";
import { doc, updateDoc } from "firebase/firestore";

/* ═══════════════════════════════════════════════════════════
   CROP MODAL
═══════════════════════════════════════════════════════════ */
function CropModal({ isOpen, onClose, onApply, imageUrl }) {
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
    const drawW = image.width * totalScale;
    const drawH = image.height * totalScale;
    const minX = cw - drawW, minY = ch - drawH;
    const clampedX = Math.min(0, Math.max(offsetX, minX));
    const clampedY = Math.min(0, Math.max(offsetY, minY));
    stateRef.current.offsetX = clampedX;
    stateRef.current.offsetY = clampedY;
    ctx.clearRect(0, 0, cw, ch);
    ctx.save(); ctx.globalAlpha = 0.35;
    ctx.drawImage(image, clampedX, clampedY, drawW, drawH);
    ctx.restore();
    const cx = cw / 2, cy = ch / 2;
    const radius = Math.min(cw, ch) * 0.44;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(image, clampedX, clampedY, drawW, drawH); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  }, [zoom]);

  useEffect(() => {
    if (!isOpen || !imageUrl || !canvasRef.current) return;
    const img = new Image();
    img.onload = () => {
      stateRef.current.image = img;
      stateRef.current.offsetX = 0; stateRef.current.offsetY = 0;
      const rect = canvasRef.current.parentElement.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
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
    const outW = 500, outH = 500;
    const scaleX = outW / cw, scaleY = outH / ch;
    const offscreen = document.createElement("canvas");
    offscreen.width = outW; offscreen.height = outH;
    const octx = offscreen.getContext("2d");
    const baseScale = Math.max(cw / image.width, ch / image.height);
    const totalScale = baseScale * zoom;
    const drawW = image.width * totalScale, drawH = image.height * totalScale;
    const minX = cw - drawW, minY = ch - drawH;
    const clampedX = Math.min(0, Math.max(offsetX, minX));
    const clampedY = Math.min(0, Math.max(offsetY, minY));
    octx.beginPath(); octx.arc(outW / 2, outH / 2, Math.min(outW, outH) / 2, 0, Math.PI * 2); octx.clip();
    octx.drawImage(image, clampedX * scaleX, clampedY * scaleY, drawW * scaleX, drawH * scaleY);
    onApply(offscreen.toDataURL("image/png", 1.0));
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="vf-crop-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="vf-crop-modal">
        <div className="vf-crop-header">
          <h3>Crop Profile Photo</h3>
          <i className="bx bx-x" onClick={onClose} style={{ fontSize: 28, cursor: "pointer", color: "#888" }} />
        </div>
        <div className="vf-crop-canvas-wrap">
          <canvas ref={canvasRef} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} style={{ width: "100%", height: "100%", cursor: "grab", display: "block" }} />
        </div>
        <div className="vf-crop-zoom">
          <label>Zoom</label>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
        </div>
        <div className="vf-crop-actions">
          <button className="vf-crop-cancel" onClick={onClose}>Cancel</button>
          <button className="vf-crop-apply" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   VERIFICATION FORM
═══════════════════════════════════════════════════════════ */
const VerificationForm = ({ registeredData, onBackToLogin, initialProfileData, onProfileChange }) => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("student");
  const [fullName, setFullName] = useState(initialProfileData?.fullName || "");
  const [nameError, setNameError] = useState("");

  // Student fields
  const [roll, setRoll] = useState(initialProfileData?.roll || "");
  const [branch, setBranch] = useState(initialProfileData?.branch || "");
  const [year, setYear] = useState(initialProfileData?.year || "");
  const [rollError, setRollError] = useState("");
  const [branchError, setBranchError] = useState("");
  const [yearError, setYearError] = useState("");

  // Faculty fields
  const [department, setDepartment] = useState("");
  const [subject, setSubject] = useState("");
  const [workingSince, setWorkingSince] = useState("");
  const [departmentError, setDepartmentError] = useState("");
  const [workingSinceError, setWorkingSinceError] = useState("");

  // Photo
  const [photoPreview, setPhotoPreview] = useState(initialProfileData?.photoPreview || "");
  const [photoFile, setPhotoFile] = useState(null); // stores cropped blob
  const [cropOpen, setCropOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 40 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (onProfileChange) {
      onProfileChange({ fullName, roll, branch, year, photoPreview });
    }
  }, [fullName, roll, branch, year, photoPreview]);

  const handlePhotoClick = () => fileInputRef.current.click();

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File size must be less than 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setRawImageUrl(ev.target.result); setCropOpen(true); };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropApply = (dataUrl) => {
    setPhotoPreview(dataUrl);
    // Convert dataUrl to blob for upload
    fetch(dataUrl).then(r => r.blob()).then(blob => setPhotoFile(blob));
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setNameError(""); setRollError(""); setBranchError(""); setYearError("");
    setDepartmentError(""); setWorkingSinceError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNameError(""); setRollError(""); setBranchError(""); setYearError("");
    setDepartmentError(""); setWorkingSinceError("");
    let isValid = true;

    if (!fullName.trim()) { setNameError("Please enter your full name"); isValid = false; }
    else if (fullName.trim().length < 3) { setNameError("Name must be at least 3 characters"); isValid = false; }

    if (activeTab === "student") {
      if (roll.trim() && roll.trim().length < 5) { setRollError("Roll number must be at least 5 characters"); isValid = false; }
      if (!branch) { setBranchError("Please select your branch"); isValid = false; }
      if (!year) { setYearError("Please select your year"); isValid = false; }
    }

    if (activeTab === "faculty") {
      if (!department) { setDepartmentError("Please select your department"); isValid = false; }
      if (!workingSince) { setWorkingSinceError("Please select your working since year"); isValid = false; }
    }

    if (!isValid) return;

    setSubmitting(true);
    try {
      const studentData = { roll, branch, year };
      const facultyData = { department, subject, workingSince };

      await linkEmailPasswordToPhoneAccount(
        registeredData.email,
        registeredData.password,
        registeredData.username,
        registeredData.phone,
        fullName,
        activeTab,
        studentData,
        facultyData,
        ""
      );

      // Upload photo if selected
      if (photoFile) {
        const photoURL = await uploadProfilePhoto(auth.currentUser.uid, photoFile);
        await updateDoc(doc(db, "users", auth.currentUser.uid), { photoURL });
      }

      await linkGoogleAfterRegistration();
      alert("✅ Registration Successful!");
      navigate("/explore");
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <CropModal isOpen={cropOpen} imageUrl={rawImageUrl} onClose={() => setCropOpen(false)} onApply={handleCropApply} />

      <div className="verification-section" id="verificationSection" style={{ display: "flex" }}>
        <video autoPlay muted loop id="bg-video-verify">
          <source src="website.mp4" type="video/mp4" />
        </video>
        <div className="video-overlay"></div>

        <div className="logo">
          <img src={logo} alt="STUVO5" className="logo-icon" />
          <h1>STUVO5</h1>
        </div>

        <div className="verification-box">
          <div className="box-head-verify">
            <h1>Complete Your Profile</h1>
            <p className="subtitle">Just a few more details to get started</p>
          </div>

          <form id="verificationForm" onSubmit={handleSubmit}>
            {/* AVATAR */}
            <div className="avatar-upload-section">
              <div className="avatar-circle" onClick={handlePhotoClick}>
                <div className="avatar-placeholder" style={{ display: photoPreview ? "none" : "flex" }}>
                  <i className="bx bx-user-circle"></i>
                </div>
                {photoPreview && (
                  <img src={photoPreview} alt="Profile" className="avatar-preview-img" />
                )}
                <div className="avatar-overlay">
                  <i className="bx bx-camera"></i>
                  <span>{photoPreview ? "Change" : "Upload"}</span>
                </div>
              </div>
              <p className="avatar-label">Profile Photo <span className="optional">· Optional</span></p>
              <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/jpg" hidden onChange={handlePhotoChange} />
            </div>

            {/* TABS */}
            <div className="vf-tabs">
              <button type="button" className={`vf-tab-btn${activeTab === "student" ? " active" : ""}`} onClick={() => switchTab("student")}>
                <i className="bx bx-book-reader" /> Student
              </button>
              <button type="button" className={`vf-tab-btn${activeTab === "faculty" ? " active" : ""}`} onClick={() => switchTab("faculty")}>
                <i className="bx bx-chalkboard" /> Faculty
              </button>
            </div>

            {/* SHARED — NAME */}
            <div className="input-box" style={{ marginBottom: 14 }}>
              <label>Full Name</label>
              <div className="input-wrapper">
                <i className="bx bx-user"></i>
                <input type="text" placeholder="Enter your full name" value={fullName} onChange={(e) => { setFullName(e.target.value); setNameError(""); }} className={nameError ? "error" : ""} />
              </div>
              <div className={`error-message ${nameError ? "show" : ""}`}>{nameError}</div>
            </div>

            {/* STUDENT FIELDS */}
            {activeTab === "student" && (
              <div className="vf-tab-content">
                <div className="form-row">
                  <div className="input-box">
                    <label>Roll Number <span className="optional-label">· Optional</span></label>
                    <div className="input-wrapper">
                      <i className="bx bx-id-card"></i>
                      <input type="text" placeholder="Enter roll number" value={roll} onChange={(e) => { setRoll(e.target.value); setRollError(""); }} className={rollError ? "error" : ""} />
                    </div>
                    <div className={`error-message ${rollError ? "show" : ""}`}>{rollError}</div>
                  </div>
                  <div className="input-box">
                    <label>Branch</label>
                    <div className="input-wrapper">
                      <i className="bx bx-book"></i>
                      <select value={branch} onChange={(e) => { setBranch(e.target.value); setBranchError(""); }} className={branchError ? "error" : ""}>
                        <option value="">Select Branch</option>
                        <option value="CSE">Computer Science Engineering</option>
                        <option value="ECE">Electronics & Communication</option>
                        <option value="EEE">Electrical & Electronics</option>
                        <option value="MECH">Mechanical Engineering</option>
                        <option value="CIVIL">Civil Engineering</option>
                        <option value="IT">Information Technology</option>
                        <option value="AI-ML">AI & Machine Learning</option>
                        <option value="DS">Data Science</option>
                      </select>
                    </div>
                    <div className={`error-message ${branchError ? "show" : ""}`}>{branchError}</div>
                  </div>
                </div>
                <div className="input-box">
                  <label>Year</label>
                  <div className="input-wrapper">
                    <i className="bx bx-calendar"></i>
                    <select value={year} onChange={(e) => { setYear(e.target.value); setYearError(""); }} className={yearError ? "error" : ""}>
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <div className={`error-message ${yearError ? "show" : ""}`}>{yearError}</div>
                </div>
              </div>
            )}

            {/* FACULTY FIELDS */}
            {activeTab === "faculty" && (
              <div className="vf-tab-content">
                <div className="input-box" style={{ marginBottom: 14 }}>
                  <label>Department</label>
                  <div className="input-wrapper">
                    <i className="bx bx-building"></i>
                    <select value={department} onChange={(e) => { setDepartment(e.target.value); setDepartmentError(""); }} className={departmentError ? "error" : ""}>
                      <option value="">Select Department</option>
                      <option value="CSE">Computer Science Engineering</option>
                      <option value="ECE">Electronics & Communication</option>
                      <option value="EEE">Electrical & Electronics</option>
                      <option value="MECH">Mechanical Engineering</option>
                      <option value="CIVIL">Civil Engineering</option>
                      <option value="IT">Information Technology</option>
                      <option value="AI-ML">AI & Machine Learning</option>
                      <option value="DS">Data Science</option>
                      <option value="MATH">Mathematics</option>
                      <option value="PHY">Physics</option>
                      <option value="CHEM">Chemistry</option>
                      <option value="MBA">Management Studies</option>
                    </select>
                  </div>
                  <div className={`error-message ${departmentError ? "show" : ""}`}>{departmentError}</div>
                </div>
                <div className="input-box" style={{ marginBottom: 14 }}>
                  <label>Subject Specialization <span className="optional-label">· Optional</span></label>
                  <div className="input-wrapper">
                    <i className="bx bx-chalkboard"></i>
                    <input type="text" placeholder="e.g. Data Structures, Algorithms" value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </div>
                </div>
                <div className="input-box">
                  <label>Working Since</label>
                  <div className="input-wrapper">
                    <i className="bx bx-calendar"></i>
                    <select value={workingSince} onChange={(e) => { setWorkingSince(e.target.value); setWorkingSinceError(""); }} className={workingSinceError ? "error" : ""}>
                      <option value="">Select Year</option>
                      {yearOptions.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <div className={`error-message ${workingSinceError ? "show" : ""}`}>{workingSinceError}</div>
                </div>
              </div>
            )}

            <div className="verify-button">
              <button type="submit" disabled={submitting}>
                {submitting ? "Creating Account..." : "Complete Registration"}
              </button>
            </div>

            <div className="back-to-login">
              <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin(); }}>
                ← Back to Registration
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default VerificationForm;