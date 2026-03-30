import { useState, useRef } from "react";
import "boxicons/css/boxicons.min.css";
import "../../styles/Syllabus.css";

const BRANCHES = [
  {
    id: "cse",
    label: "CSE",
    full: "Computer Science & Engineering",
    icon: "bx-code-alt",
  },
  {
    id: "ece",
    label: "ECE",
    full: "Electronics & Communication",
    icon: "bx-chip",
  },
  { id: "mech", label: "MECH", full: "Mechanical Engineering", icon: "bx-cog" },
  {
    id: "civil",
    label: "CIVIL",
    full: "Civil Engineering",
    icon: "bx-buildings",
  },
  {
    id: "eee",
    label: "EEE",
    full: "Electrical & Electronics",
    icon: "bx-bolt-circle",
  },
  { id: "it", label: "IT", full: "Information Technology", icon: "bx-desktop" },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const SYLLABUS_DATA = {
  cse: {
    1: {
      subjects: [
        {
          code: "MA101",
          name: "Engineering Mathematics I",
          credits: 4,
          type: "theory",
        },
        {
          code: "PH101",
          name: "Engineering Physics",
          credits: 3,
          type: "theory",
        },
        {
          code: "CS101",
          name: "Introduction to Programming",
          credits: 4,
          type: "theory",
        },
        {
          code: "ME101",
          name: "Engineering Drawing",
          credits: 2,
          type: "practical",
        },
        {
          code: "CS102",
          name: "Programming Lab",
          credits: 2,
          type: "practical",
        },
      ],
      timetableImage: null, // Replace with image URL e.g. "/timetables/cse-sem1.jpg"
    },
    2: {
      subjects: [
        {
          code: "MA102",
          name: "Engineering Mathematics II",
          credits: 4,
          type: "theory",
        },
        { code: "CS201", name: "Data Structures", credits: 4, type: "theory" },
        {
          code: "CS202",
          name: "Digital Logic Design",
          credits: 3,
          type: "theory",
        },
        {
          code: "CS203",
          name: "Data Structures Lab",
          credits: 2,
          type: "practical",
        },
      ],
      timetableImage: null,
    },
    3: {
      subjects: [
        {
          code: "CS301",
          name: "Computer Organization",
          credits: 4,
          type: "theory",
        },
        { code: "CS302", name: "Algorithms", credits: 4, type: "theory" },
        { code: "CS303", name: "Database Systems", credits: 3, type: "theory" },
        { code: "CS304", name: "DBMS Lab", credits: 2, type: "practical" },
      ],
      timetableImage: null,
    },
    4: {
      subjects: [
        {
          code: "CS401",
          name: "Operating Systems",
          credits: 4,
          type: "theory",
        },
        {
          code: "CS402",
          name: "Computer Networks",
          credits: 4,
          type: "theory",
        },
        {
          code: "CS403",
          name: "Software Engineering",
          credits: 3,
          type: "theory",
        },
        { code: "CS404", name: "Networks Lab", credits: 2, type: "practical" },
      ],
      timetableImage: null,
    },
    5: {
      subjects: [
        { code: "CS501", name: "Compiler Design", credits: 4, type: "theory" },
        { code: "CS502", name: "Machine Learning", credits: 4, type: "theory" },
        { code: "CS503", name: "Web Technologies", credits: 3, type: "theory" },
        { code: "CS504", name: "ML Lab", credits: 2, type: "practical" },
      ],
      timetableImage: null,
    },
    6: {
      subjects: [
        { code: "CS601", name: "Cloud Computing", credits: 4, type: "theory" },
        { code: "CS602", name: "Cyber Security", credits: 3, type: "theory" },
        {
          code: "CS603",
          name: "Mobile App Development",
          credits: 3,
          type: "theory",
        },
        { code: "CS604", name: "Project Work I", credits: 4, type: "project" },
      ],
      timetableImage: null,
    },
    7: {
      subjects: [
        {
          code: "CS701",
          name: "Artificial Intelligence",
          credits: 4,
          type: "theory",
        },
        {
          code: "CS702",
          name: "Big Data Analytics",
          credits: 3,
          type: "theory",
        },
        { code: "CS703", name: "Elective I", credits: 3, type: "elective" },
        { code: "CS704", name: "Project Work II", credits: 6, type: "project" },
      ],
      timetableImage: null,
    },
    8: {
      subjects: [
        { code: "CS801", name: "Elective II", credits: 3, type: "elective" },
        { code: "CS802", name: "Elective III", credits: 3, type: "elective" },
        {
          code: "CS803",
          name: "Internship / Industry Project",
          credits: 6,
          type: "project",
        },
        { code: "CS804", name: "Seminar", credits: 2, type: "theory" },
      ],
      timetableImage: null,
    },
  },
};

const TYPE_CLASS = {
  theory: "type-theory",
  practical: "type-practical",
  project: "type-project",
  elective: "type-elective",
};

const TYPE_LABEL = {
  theory: "Theory",
  practical: "Lab",
  project: "Project",
  elective: "Elective",
};

export default function Syllabus() {
  const [step, setStep] = useState("branch");
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedSem, setSelectedSem] = useState(null);
  const [activeTab, setActiveTab] = useState("syllabus");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const imgRef = useRef(null);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setStep("semester");
  };

  const handleSemSelect = (sem) => {
    setSelectedSem(sem);
    setStep("subjects");
    setActiveTab("syllabus");
  };

  const handleBack = () => {
    if (step === "subjects") {
      setStep("semester");
      setSelectedSem(null);
    } else if (step === "semester") {
      setStep("branch");
      setSelectedBranch(null);
    }
  };

  const openLightbox = () => {
    setZoom(1);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const subjectData =
    selectedBranch && selectedSem
      ? (SYLLABUS_DATA[selectedBranch.id]?.[selectedSem]?.subjects ?? [])
      : [];

  const timetableImage =
    selectedBranch && selectedSem
      ? (SYLLABUS_DATA[selectedBranch.id]?.[selectedSem]?.timetableImage ??
        null)
      : null;

  return (
    <div className="syl-wrapper">
      <div className="syl-header">
        <div className="syl-header-row">
          {/* Always show back — goes to previous page on branch step, goes back within syllabus on other steps */}
          <button
            className="syl-back-btn"
            onClick={
              step === "branch" ? () => window.history.back() : handleBack
            }
          >
            <i className="bx bx-arrow-back" />
          </button>

          <div className="syl-header-icon">
            <i className="bx bx-book-open" />
          </div>
          <div className="syl-header-text">
            <h1 className="syl-title">
              {step === "branch" && "Syllabus"}
              {step === "semester" && selectedBranch?.full}
              {step === "subjects" && `Semester ${selectedSem}`}
            </h1>
            <p className="syl-subtitle">
              {step === "branch" && "Select your branch to continue"}
              {step === "semester" && "Select your semester"}
              {step === "subjects" && selectedBranch?.full}
            </p>
          </div>
        </div>
      </div>

      {/* ══ STEP 1: Branch ══ */}
      {step === "branch" && (
        <div className="syl-section">
          <p className="syl-section-hint">Choose your branch</p>
          <div className="syl-branch-grid">
            {BRANCHES.map((branch) => (
              <div
                key={branch.id}
                className="syl-branch-card"
                onClick={() => handleBranchSelect(branch)}
              >
                <div className="syl-branch-icon">
                  <i className={`bx ${branch.icon}`} />
                </div>
                <span className="syl-branch-label">{branch.label}</span>
                <span className="syl-branch-full">{branch.full}</span>
                <i className="bx bx-chevron-right syl-branch-arrow" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ STEP 2: Semester ══ */}
      {step === "semester" && (
        <div className="syl-section">
          <p className="syl-section-hint">Select your semester</p>
          <div className="syl-sem-grid">
            {SEMESTERS.map((sem) => (
              <div
                key={sem}
                className="syl-sem-card"
                onClick={() => handleSemSelect(sem)}
              >
                <span className="syl-sem-num">{sem}</span>
                <span className="syl-sem-label">Semester</span>
                <span className="syl-sem-tag">
                  {sem <= 2
                    ? "1st Year"
                    : sem <= 4
                      ? "2nd Year"
                      : sem <= 6
                        ? "3rd Year"
                        : "4th Year"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ STEP 3: Subjects / Timetable ══ */}
      {step === "subjects" && (
        <div className="syl-section">
          {/* Tabs */}
          <div className="syl-tabs">
            <button
              className={`syl-tab${activeTab === "syllabus" ? " active" : ""}`}
              onClick={() => setActiveTab("syllabus")}
            >
              <i className="bx bx-list-ul" />
              Syllabus
            </button>
            <button
              className={`syl-tab${activeTab === "timetable" ? " active" : ""}`}
              onClick={() => setActiveTab("timetable")}
            >
              <i className="bx bx-time" />
              Timetable
            </button>
          </div>

          {/* ── Syllabus Tab ── */}
          {activeTab === "syllabus" && (
            <div className="syl-subjects-list">
              {subjectData.length > 0 ? (
                subjectData.map((subj, i) => (
                  <div className="syl-subject-card" key={i}>
                    <div className="syl-subject-left">
                      <span className="syl-subject-code">{subj.code}</span>
                      <h4 className="syl-subject-name">{subj.name}</h4>
                      <span
                        className={`syl-subject-type-tag ${TYPE_CLASS[subj.type]}`}
                      >
                        {TYPE_LABEL[subj.type]}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="syl-empty">
                  <i className="bx bx-book-open" />
                  <p>Syllabus not available yet</p>
                  <span>Check back later or contact your department</span>
                </div>
              )}
            </div>
          )}

          {/* ── Timetable Tab ── */}
          {activeTab === "timetable" && (
            <div className="syl-timetable">
              {timetableImage ? (
                <>
                  <p className="syl-timetable-tap-hint">
                    <i className="bx bx-zoom-in" />
                    Tap the image to open full view
                  </p>
                  <div className="syl-tt-img-wrap" onClick={openLightbox}>
                    <img
                      src={timetableImage}
                      alt="Timetable"
                      className="syl-tt-img"
                    />
                    <div className="syl-tt-img-overlay">
                      <i className="bx bx-fullscreen" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="syl-empty">
                  <i className="bx bx-calendar-x" />
                  <p>Timetable not uploaded yet</p>
                  <span>
                    Set timetableImage in SYLLABUS_DATA to your image URL
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxOpen && timetableImage && (
        <div className="syl-lightbox" onClick={closeLightbox}>
          <div
            className="syl-lightbox-toolbar"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="syl-lb-btn"
              onClick={() =>
                setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))
              }
            >
              <i className="bx bx-zoom-out" />
            </button>
            <span className="syl-lb-zoom-label">{Math.round(zoom * 100)}%</span>
            <button
              className="syl-lb-btn"
              onClick={() =>
                setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))
              }
            >
              <i className="bx bx-zoom-in" />
            </button>
            <button className="syl-lb-btn syl-lb-close" onClick={closeLightbox}>
              <i className="bx bx-x" />
            </button>
          </div>
          <div
            className="syl-lightbox-scroll"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              ref={imgRef}
              src={timetableImage}
              alt="Timetable"
              className="syl-lb-img"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
