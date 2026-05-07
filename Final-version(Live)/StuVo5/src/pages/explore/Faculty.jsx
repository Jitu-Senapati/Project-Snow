import React, { useState } from "react";
import "../../styles/Faculty.css";

const STORAGE_KEY = "stuvo5_faculty_data_v1";

const DEFAULT_FACULTY = [
  {
    id: "1",
    name: "Dr. Ananya Mishra",
    designation: "Head of Department",
    department: "Computer Science",
    qualification: "PhD, M.Tech",
    experience: 12,
    specialization: "Artificial Intelligence & Machine Learning",
    email: "ananya@college.edu",
    phone: "+91 9876543210",
    office: "Block A, Room 201",
    bio: "Experienced academician with strong research background in AI and modern software systems.",
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "2",
    name: "Prof. Rakesh Kumar",
    designation: "Associate Professor",
    department: "Information Technology",
    qualification: "M.Tech",
    experience: 9,
    specialization: "Web Development & Cloud Computing",
    email: "rakesh@college.edu",
    phone: "+91 9123456780",
    office: "Block B, Room 105",
    bio: "Passionate about teaching web technologies, cloud infrastructure, and project-based learning.",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "3",
    name: "Dr. Priya Sharma",
    designation: "Assistant Professor",
    department: "Electronics",
    qualification: "PhD",
    experience: 6,
    specialization: "VLSI Design & Embedded Systems",
    email: "priya@college.edu",
    phone: "+91 9988776655",
    office: "Block C, Room 310",
    bio: "Researcher and educator specializing in VLSI and embedded systems with several patents.",
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80",
  },
];

function loadFaculty() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return DEFAULT_FACULTY;
}

export default function Faculty() {
  const [faculty] = useState(loadFaculty);
  const [search, setSearch] = useState("");
  const [activeDept, setActiveDept] = useState("All");
  const [selected, setSelected] = useState(null);

  const departments = ["All", ...new Set(faculty.map((f) => f.department))];

  const filtered = faculty.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.department.toLowerCase().includes(q) ||
      (f.specialization || "").toLowerCase().includes(q) ||
      f.designation.toLowerCase().includes(q);
    const matchDept = activeDept === "All" || f.department === activeDept;
    return matchSearch && matchDept;
  });

  return (
    <div className="fac-page">
      {/* Hero Header */}
      <div className="fac-hero">
        <div className="fac-hero-bg" />
        <div className="fac-hero-content">
          <span className="fac-eyebrow">
            <i className="bx bx-buildings" /> MITS Faculty
          </span>
          <h1 className="fac-hero-title">Meet Our Faculty</h1>
          <p className="fac-hero-sub">
            Dedicated educators and researchers shaping the future at MITS.
          </p>
          <div className="fac-hero-stats">
            <div className="fac-hstat">
              <strong>{faculty.length}</strong>
              <span>Faculty Members</span>
            </div>
            <div className="fac-hstat-sep" />
            <div className="fac-hstat">
              <strong>{[...new Set(faculty.map((f) => f.department))].length}</strong>
              <span>Departments</span>
            </div>
            <div className="fac-hstat-sep" />
            <div className="fac-hstat">
              <strong>{Math.round(faculty.reduce((a, f) => a + (f.experience || 0), 0) / (faculty.length || 1))}+</strong>
              <span>Avg. Years Exp.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="fac-main">
        {/* Controls */}
        <div className="fac-controls">
          <div className="fac-search-box">
            <i className="bx bx-search" />
            <input
              type="text"
              placeholder="Search faculty by name, dept, or expertise…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} className="fac-clear-btn">
                <i className="bx bx-x" />
              </button>
            )}
          </div>

          <div className="fac-dept-pills">
            {departments.map((dept) => (
              <button
                key={dept}
                className={`fac-dept-pill ${activeDept === dept ? "fac-dept-pill--active" : ""}`}
                onClick={() => setActiveDept(dept)}
              >
                {dept}
                <span className="fac-pill-count">
                  {dept === "All" ? faculty.length : faculty.filter((f) => f.department === dept).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {(search || activeDept !== "All") && (
          <p className="fac-results-info">
            <i className="bx bx-filter-alt" />
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {activeDept !== "All" ? ` in ${activeDept}` : ""}
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="fac-no-results">
            <i className="bx bx-search-alt" />
            <h3>No faculty found</h3>
            <p>Try adjusting your search or filter.</p>
            <button className="fac-reset-btn" onClick={() => { setSearch(""); setActiveDept("All"); }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div className="fac-grid">
            {filtered.map((teacher) => (
              <FacultyCard
                key={teacher.id}
                teacher={teacher}
                onClick={() => setSelected(teacher)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fac-modal-overlay" onClick={() => setSelected(null)}>
          <div className="fac-modal" onClick={(e) => e.stopPropagation()}>
            <button className="fac-modal-close" onClick={() => setSelected(null)}>
              <i className="bx bx-x" />
            </button>
            <div className="fac-modal-photo">
              <img
                src={selected.photo || "https://via.placeholder.com/600x400?text=Faculty"}
                alt={selected.name}
                onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Faculty"; }}
              />
              <div className="fac-modal-dept-badge">{selected.department}</div>
            </div>
            <div className="fac-modal-body">
              <h2 className="fac-modal-name">{selected.name}</h2>
              <p className="fac-modal-desig">{selected.designation}</p>

              <div className="fac-modal-chips">
                {selected.experience != null && (
                  <span className="fac-mchip"><i className="bx bx-time-five" /> {selected.experience} Years Exp.</span>
                )}
                {selected.qualification && (
                  <span className="fac-mchip"><i className="bx bx-award" /> {selected.qualification}</span>
                )}
              </div>

              {selected.specialization && (
                <div className="fac-modal-spec">
                  <i className="bx bx-bulb" />
                  <span>{selected.specialization}</span>
                </div>
              )}

              {selected.bio && (
                <p className="fac-modal-bio">{selected.bio}</p>
              )}

              <div className="fac-modal-contacts">
                {selected.email && (
                  <a href={`mailto:${selected.email}`} className="fac-contact-row">
                    <i className="bx bx-envelope" />
                    <span>{selected.email}</span>
                  </a>
                )}
                {selected.phone && (
                  <a href={`tel:${selected.phone}`} className="fac-contact-row">
                    <i className="bx bx-phone" />
                    <span>{selected.phone}</span>
                  </a>
                )}
                {selected.office && (
                  <div className="fac-contact-row">
                    <i className="bx bx-map-pin" />
                    <span>{selected.office}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FacultyCard({ teacher, onClick }) {
  return (
    <article className="fac-card" onClick={onClick}>
      <div className="fac-card-img-wrap">
        <img
          className="fac-card-img"
          src={teacher.photo || "https://via.placeholder.com/600x400?text=Faculty"}
          alt={teacher.name}
          onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Faculty"; }}
        />
        <div className="fac-card-dept">{teacher.department}</div>
      </div>
      <div className="fac-card-info">
        <h3 className="fac-card-name">{teacher.name}</h3>
        <p className="fac-card-desig">{teacher.designation}</p>
        <div className="fac-card-tags">
          {teacher.experience != null && (
            <span className="fac-tag"><i className="bx bx-time" /> {teacher.experience}y</span>
          )}
          {teacher.qualification && (
            <span className="fac-tag"><i className="bx bx-graduation" /> {teacher.qualification}</span>
          )}
        </div>
        {teacher.specialization && (
          <p className="fac-card-spec"><i className="bx bx-bookmark" /> {teacher.specialization}</p>
        )}
        <div className="fac-card-cta">
          View Profile <i className="bx bx-right-arrow-alt" />
        </div>
      </div>
    </article>
  );
}
