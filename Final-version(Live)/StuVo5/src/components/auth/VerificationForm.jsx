import { useState } from "react";
import logo from "../../assets/logo192px.png";

const VerificationForm = ({ registeredData, onBackToLogin }) => {
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [nameError, setNameError] = useState("");
  const [rollError, setRollError] = useState("");
  const [branchError, setBranchError] = useState("");
  const [yearError, setYearError] = useState("");

  const existingUsers = [
    {
      name: "John Doe",
      roll: "CS2024001",
      email: "john@gmail.com",
      phone: "9876543210",
    },
    {
      name: "Jane Smith",
      roll: "EC2024002",
      email: "jane@gmail.com",
      phone: "8765432109",
    },
    {
      name: "Mike Johnson",
      roll: "EE2024003",
      email: "mike@yahoo.com",
      phone: "7654321098",
    },
  ];

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB");
        return;
      }
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const checkDuplicates = (name, roll, email, phone) => {
    const duplicates = [];
    for (let user of existingUsers) {
      if (user.name.toLowerCase() === name.toLowerCase())
        duplicates.push("Name");
      if (roll && user.roll.toLowerCase() === roll.toLowerCase())
        duplicates.push("Roll Number");
      if (user.email.toLowerCase() === email.toLowerCase())
        duplicates.push("Email");
      if (user.phone === phone) duplicates.push("Phone Number");
    }
    return duplicates;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNameError("");
    setRollError("");
    setBranchError("");
    setYearError("");

    let isValid = true;

    if (!name.trim()) {
      setNameError("Please enter your full name");
      isValid = false;
    } else if (name.trim().length < 3) {
      setNameError("Name must be at least 3 characters");
      isValid = false;
    }

    if (roll.trim() && roll.trim().length < 5) {
      setRollError("Roll number must be at least 5 characters");
      isValid = false;
    }

    if (!branch) {
      setBranchError("Please select your branch");
      isValid = false;
    }

    if (!year) {
      setYearError("Please select your year");
      isValid = false;
    }

    if (isValid) {
      const duplicates = checkDuplicates(
        name.trim(),
        roll.trim(),
        registeredData.email || "",
        registeredData.phone || "",
      );

      if (duplicates.length > 0) {
        alert(
          "⚠️ Registration Failed!\n\nThe following data already exists:\n" +
            duplicates.join(", ") +
            "\n\nPlease use different information.",
        );
        if (duplicates.includes("Name")) {
          setNameError("This name is already registered");
        }
        if (duplicates.includes("Roll Number")) {
          setRollError("This roll number is already registered");
        }
        isValid = false;
      }
    }

    if (isValid) {
      alert(
        "✅ Registration Successful!\n\nYour account has been created. Please login with your credentials.",
      );
      onBackToLogin();
    }
  };

  return (
    <div
      className="verification-section"
      id="verificationSection"
      style={{ display: "flex" }}
    >
      <video autoPlay muted loop id="bg-video-verify">
        <source src="website.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>

      <div className="logo">
        <img src={logo} alt="STRUVO" className="logo-icon" />
        <h1>STUVO5</h1>
      </div>

      <div className="verification-box">
        <div className="box-head-verify">
          <h1>Complete Your Profile</h1>
          <p className="subtitle">Just a few more details to get started</p>
        </div>

        <form id="verificationForm" onSubmit={handleSubmit}>
          <div className="avatar-upload-section">
            <div
              className="avatar-circle"
              id="avatarCircle"
              onClick={() => document.getElementById("verifyPhoto").click()}
            >
              <div
                className="avatar-placeholder"
                id="avatarPlaceholder"
                style={{ display: photoPreview ? "none" : "flex" }}
              >
                <i className="bx bx-user-circle"></i>
              </div>
              <img
                src={photoPreview}
                alt="Profile"
                className="avatar-preview-img"
                id="avatarPreviewImg"
                style={{ display: photoPreview ? "block" : "none" }}
              />
              <div className="avatar-overlay" id="avatarOverlay">
                <i className="bx bx-camera"></i>
                <span>Change</span>
              </div>
            </div>
            <p className="avatar-label">
              Profile Photo <span className="optional">· Optional</span>
            </p>
            <input
              type="file"
              id="verifyPhoto"
              accept="image/png, image/jpeg, image/jpg"
              hidden
              onChange={handlePhotoChange}
            />
          </div>

          <div className="form-row">
            <div className="input-box">
              <label>Full Name</label>
              <div className="input-wrapper">
                <i className="bx bx-user"></i>
                <input
                  type="text"
                  id="verifyName"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError("");
                  }}
                  className={nameError ? "error" : ""}
                />
              </div>
              <div
                className={`error-message ${nameError ? "show" : ""}`}
                id="verifyNameError"
              >
                {nameError}
              </div>
            </div>
            <div className="input-box">
              <label>
                Roll Number <span className="optional-label">· Optional</span>
              </label>
              <div className="input-wrapper">
                <i className="bx bx-id-card"></i>
                <input
                  type="text"
                  id="verifyRoll"
                  placeholder="Enter roll number (optional)"
                  value={roll}
                  onChange={(e) => {
                    setRoll(e.target.value);
                    setRollError("");
                  }}
                  className={rollError ? "error" : ""}
                />
              </div>
              <div
                className={`error-message ${rollError ? "show" : ""}`}
                id="verifyRollError"
              >
                {rollError}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="input-box">
              <label>Branch</label>
              <div className="input-wrapper">
                <i className="bx bx-book"></i>
                <select
                  id="verifyBranch"
                  value={branch}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setBranchError("");
                  }}
                  className={branchError ? "error" : ""}
                >
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
              <div
                className={`error-message ${branchError ? "show" : ""}`}
                id="verifyBranchError"
              >
                {branchError}
              </div>
            </div>
            <div className="input-box">
              <label>Year</label>
              <div className="input-wrapper">
                <i className="bx bx-calendar"></i>
                <select
                  id="verifyYear"
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value);
                    setYearError("");
                  }}
                  className={yearError ? "error" : ""}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
              <div
                className={`error-message ${yearError ? "show" : ""}`}
                id="verifyYearError"
              >
                {yearError}
              </div>
            </div>
          </div>

          <div className="verify-button">
            <button type="submit">Complete Registration</button>
          </div>

          <div className="back-to-login">
            <a
              href="#"
              id="backToLogin"
              onClick={(e) => {
                e.preventDefault();
                onBackToLogin();
              }}
            >
              ← Back to Registration
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationForm;
