import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Faculty.css";
import { subscribeFaculty } from "../../firebase/db";

export default function Faculty() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let active = true;
    const unsub = subscribeFaculty(
      (data) => { if (active) { setFaculty(data); setLoading(false); } },
      ()     => { if (active) setLoading(false); }
    );
    return () => { active = false; unsub(); };
  }, []);


  const filtered = faculty.filter((f) => {
    const q = search.toLowerCase();
    return !q ||
      f.name.toLowerCase().includes(q) ||
      (f.department || "").toLowerCase().includes(q) ||
      (f.specialization || "").toLowerCase().includes(q) ||
      (f.designation || "").toLowerCase().includes(q);
  });

  // Smart: if experience > 1990 it's a "working since" year; else it's raw years
  const avgExp = faculty.length
    ? Math.round(faculty.reduce((a, f) => {
        const yrs = f.experience > 1990
          ? new Date().getFullYear() - f.experience
          : (f.experience || 0);
        return a + yrs;
      }, 0) / faculty.length)
    : 0;

  return (
    <div className="fac-page">
      {/* Hero Header */}
      <div className="fac-hero">
        <div className="fac-hero-bg" />
        <div className="fac-hero-content">
          <div className="fac-hero-top-row">
            <button className="fac-back-btn" onClick={() => navigate(-1)}>
              <i className="bx bx-arrow-back" />
            </button>
            <h1 className="fac-hero-title">Meet Our Faculty</h1>
            {isAdmin && (
              <button className="fac-edit-btn" onClick={() => navigate("/admin-faculty")}>
                <i className="bx bx-edit" /> Manage
              </button>
            )}
          </div>
          <p className="fac-hero-sub">
            The strength of an institution lies in the excellence of its faculty.
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
              <div className="fac-hstat-val-row">
                <strong>{avgExp}+</strong>
                <span className="fac-hstat-unit">yrs</span>
              </div>
              <span>Average Experience</span>
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

        </div>


                {/* Grid */}
        {loading ? (
          <div className="fac-loading">
            <div className="fac-spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="fac-no-results">
            <i className="bx bx-search-alt" />
            <h3>No faculty found</h3>
            <p>Try adjusting your search or filter.</p>
            <button className="fac-reset-btn" onClick={() => setSearch("")}>
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
                src={selected.photoUrl || selected.photo || "https://via.placeholder.com/600x400?text=Faculty"}
                alt={selected.name}
                onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Faculty"; }}
              />
              {selected.designation && (
              <div className="fac-modal-dept-badge">{selected.designation}</div>
            )}
            </div>
            <div className="fac-modal-body">
              <h2 className="fac-modal-name">{selected.name}</h2>
              <p className="fac-modal-desig">{selected.department}</p>

              <div className="fac-modal-chips">
                {selected.experience != null && (
                  <span className="fac-mchip"><i className="bx bx-time-five" />{selected.experience > 1990 ? ` Since ${selected.experience}` : ` ${selected.experience} yrs exp.`}</span>
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
          src={teacher.photoUrl || teacher.photo || "https://via.placeholder.com/600x400?text=Faculty"}
          alt={teacher.name}
          onError={(e) => { e.target.src = "https://via.placeholder.com/600x400?text=Faculty"; }}
        />
        {teacher.designation && (
          <div className="fac-card-dept">{teacher.designation}</div>
        )}
      </div>
      <div className="fac-card-info">
        <h3 className="fac-card-name">{teacher.name}</h3>
        <p className="fac-card-desig">{teacher.department}</p>
        <div className="fac-card-tags">
          {teacher.experience != null && (
            <span className="fac-tag"><i className="bx bx-time" />{teacher.experience > 1990 ? ` Since ${teacher.experience}` : ` ${teacher.experience} yrs`}</span>
          )}
          {teacher.qualification && (
            <span className="fac-tag"><i className="bx bx-graduation" /> {teacher.qualification}</span>
          )}
        </div>
        {teacher.specialization && (
          <p className="fac-card-spec"><i className="bx bx-bookmark" /> {teacher.specialization}</p>
        )}

      </div>
    </article>
  );
}