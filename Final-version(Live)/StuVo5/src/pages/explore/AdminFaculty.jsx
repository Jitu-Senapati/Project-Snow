import React, { useState, useEffect, useRef } from "react";
import "../../styles/AdminFaculty.css";

const STORAGE_KEY = "stuvo5_faculty_data_v1";

const DEFAULT_FACULTY = [
  {
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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
    id: crypto.randomUUID(),
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

const EMPTY_FORM = {
  id: "", name: "", designation: "", department: "",
  qualification: "", experience: "", specialization: "",
  email: "", phone: "", office: "", bio: "", photo: "",
};

function loadFaculty() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return DEFAULT_FACULTY;
}

function saveFaculty(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function AdminFaculty() {
  const [faculty, setFaculty] = useState(loadFaculty);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photoPreview, setPhotoPreview] = useState("");
  const [currentPhotoData, setCurrentPhotoData] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const fileRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => { saveFaculty(faculty); }, [faculty]);

  const filteredFaculty = faculty.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.name.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      (t.specialization || "").toLowerCase().includes(q) ||
      t.designation.toLowerCase().includes(q);
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCurrentPhotoData(ev.target.result);
      setPhotoPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { name, designation, department, qualification, experience } = form;
    if (!name || !designation || !department || !qualification || !experience) {
      alert("Please fill all required fields.");
      return;
    }
    const teacherData = {
      ...form,
      id: form.id || crypto.randomUUID(),
      experience: Number(form.experience),
      photo: currentPhotoData || form.photo || "https://via.placeholder.com/600x400?text=Faculty",
    };
    if (form.id) {
      setFaculty((prev) => prev.map((t) => (t.id === form.id ? teacherData : t)));
    } else {
      setFaculty((prev) => [teacherData, ...prev]);
    }
    resetForm();
    setActiveTab("list");
  }

  function loadIntoForm(id) {
    const teacher = faculty.find((t) => t.id === id);
    if (!teacher) return;
    setForm({ ...teacher });
    setCurrentPhotoData(teacher.photo || "");
    setPhotoPreview(teacher.photo || "");
    setIsEditing(true);
    setActiveTab("add");
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function deleteTeacher(id) {
    const teacher = faculty.find((t) => t.id === id);
    if (!teacher) return;
    if (!window.confirm(`Delete ${teacher.name}?`)) return;
    setFaculty((prev) => prev.filter((t) => t.id !== id));
    if (form.id === id) resetForm();
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setCurrentPhotoData("");
    setPhotoPreview("");
    setIsEditing(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function clearAll() {
    if (!window.confirm("Remove all faculty members? This cannot be undone.")) return;
    setFaculty([]);
    resetForm();
  }

  return (
    <div className="af-page">
      <div className="af-topbar">
        <div className="af-topbar-left">
          <div className="af-badge"><i className="bx bx-shield-quarter" /> Admin Panel</div>
          <h1 className="af-title">Faculty Management</h1>
          <p className="af-subtitle">Add, edit or remove faculty profiles</p>
        </div>
        <div className="af-topbar-stats">
          <div className="af-stat-card">
            <span className="af-stat-val">{faculty.length}</span>
            <span className="af-stat-lbl">Total Faculty</span>
          </div>
          <div className="af-stat-card">
            <span className="af-stat-val">{[...new Set(faculty.map(f => f.department))].length}</span>
            <span className="af-stat-lbl">Departments</span>
          </div>
        </div>
      </div>

      <div className="af-tabs">
        <button className={`af-tab ${activeTab === "list" ? "af-tab--active" : ""}`} onClick={() => { setActiveTab("list"); resetForm(); }}>
          <i className="bx bx-list-ul" /> Faculty List <span className="af-tab-count">{faculty.length}</span>
        </button>
        <button className={`af-tab ${activeTab === "add" ? "af-tab--active" : ""}`} onClick={() => { setActiveTab("add"); if (!isEditing) resetForm(); }}>
          <i className={`bx bx-${isEditing ? "edit" : "plus"}`} /> {isEditing ? "Edit Faculty" : "Add New Faculty"}
        </button>
        {faculty.length > 0 && (
          <button className="af-tab af-tab--danger" onClick={clearAll}><i className="bx bx-trash" /> Clear All</button>
        )}
      </div>

      <div className="af-body">
        {activeTab === "add" && (
          <section className="af-form-section" ref={formRef}>
            <div className="af-form-header">
              <div className="af-form-title-row">
                <div className="af-form-icon"><i className={`bx bx-${isEditing ? "edit-alt" : "user-plus"}`} /></div>
                <div>
                  <h2>{isEditing ? "Edit Faculty Member" : "Add New Faculty Member"}</h2>
                  <p>{isEditing ? "Update the details below and save." : "Fill in the details to add a new faculty member."}</p>
                </div>
                {isEditing && <span className="af-editing-pill"><i className="bx bx-pencil" /> Editing Mode</span>}
              </div>
            </div>

            <form className="af-form" onSubmit={handleSubmit}>
              <div className="af-photo-upload-row">
                <div className="af-photo-preview">
                  {photoPreview ? <img src={photoPreview} alt="Preview" /> : <div className="af-photo-placeholder"><i className="bx bx-user" /></div>}
                </div>
                <div className="af-photo-upload-info">
                  <p className="af-photo-label">Faculty Photo</p>
                  <p className="af-photo-hint">Upload a clear photo. Recommended: square, min 300×300px.</p>
                  <label className="af-upload-btn">
                    <i className="bx bx-upload" /> {photoPreview ? "Change Photo" : "Upload Photo"}
                    <input type="file" accept="image/*" ref={fileRef} onChange={handlePhotoChange} style={{ display: "none" }} />
                  </label>
                  {isEditing && <small className="af-hint">Leave unchanged to keep existing photo.</small>}
                </div>
              </div>

              <div className="af-divider"><span>Basic Information</span></div>
              <div className="af-grid">
                <div className="af-field"><label>Full Name <span className="af-req">*</span></label><input name="name" value={form.name} onChange={handleChange} placeholder="Dr. Full Name" /></div>
                <div className="af-field"><label>Designation <span className="af-req">*</span></label><input name="designation" value={form.designation} onChange={handleChange} placeholder="Assistant Professor, HOD…" /></div>
                <div className="af-field"><label>Department <span className="af-req">*</span></label><input name="department" value={form.department} onChange={handleChange} placeholder="Computer Science" /></div>
                <div className="af-field"><label>Qualification <span className="af-req">*</span></label><input name="qualification" value={form.qualification} onChange={handleChange} placeholder="M.Tech, PhD…" /></div>
                <div className="af-field"><label>Experience (Years) <span className="af-req">*</span></label><input name="experience" type="number" min="0" value={form.experience} onChange={handleChange} placeholder="5" /></div>
                <div className="af-field"><label>Specialization</label><input name="specialization" value={form.specialization} onChange={handleChange} placeholder="AI, Web Dev, VLSI…" /></div>
              </div>

              <div className="af-divider"><span>Contact & Location</span></div>
              <div className="af-grid">
                <div className="af-field"><label>Email</label><div className="af-input-icon-wrap"><i className="bx bx-envelope" /><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="teacher@college.edu" /></div></div>
                <div className="af-field"><label>Phone</label><div className="af-input-icon-wrap"><i className="bx bx-phone" /><input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+91 9876543210" /></div></div>
                <div className="af-field af-field--full"><label>Office / Cabin</label><div className="af-input-icon-wrap"><i className="bx bx-map-pin" /><input name="office" value={form.office} onChange={handleChange} placeholder="Block B, Room 204" /></div></div>
              </div>

              <div className="af-divider"><span>Bio</span></div>
              <div className="af-field"><label>Short Bio</label><textarea name="bio" rows={4} value={form.bio} onChange={handleChange} placeholder="Write a short professional introduction…" /></div>

              <div className="af-form-actions">
                <button type="submit" className="af-btn-primary"><i className={`bx bx-${isEditing ? "save" : "plus-circle"}`} /> {isEditing ? "Save Changes" : "Add Faculty Member"}</button>
                <button type="button" className="af-btn-secondary" onClick={() => { resetForm(); if (!isEditing) setActiveTab("list"); }}><i className="bx bx-x" /> Cancel</button>
                {isEditing && <button type="button" className="af-btn-danger" onClick={() => { deleteTeacher(form.id); setActiveTab("list"); }}><i className="bx bx-trash" /> Delete This Member</button>}
              </div>
            </form>
          </section>
        )}

        {activeTab === "list" && (
          <section className="af-list-section">
            <div className="af-list-toolbar">
              <div className="af-search-wrap">
                <i className="bx bx-search" />
                <input type="text" placeholder="Search by name, dept, specialization…" value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && <button className="af-search-clear" onClick={() => setSearch("")}><i className="bx bx-x" /></button>}
              </div>
              <button className="af-btn-primary af-btn-sm" onClick={() => { resetForm(); setActiveTab("add"); }}><i className="bx bx-plus" /> Add Faculty</button>
            </div>

            {filteredFaculty.length === 0 ? (
              <div className="af-empty">
                <i className="bx bx-user-x" />
                <h3>{search ? "No results found" : "No faculty added yet"}</h3>
                <p>{search ? "Try a different search term." : "Click 'Add Faculty' to get started."}</p>
                {!search && <button className="af-btn-primary" onClick={() => setActiveTab("add")}><i className="bx bx-plus" /> Add First Faculty</button>}
              </div>
            ) : (
              <div className="af-table-wrap">
                <table className="af-table">
                  <thead>
                    <tr><th>Faculty Member</th><th>Department</th><th>Designation</th><th>Experience</th><th>Contact</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {filteredFaculty.map((t) => (
                      <tr key={t.id}>
                        <td><div className="af-table-person"><img src={t.photo || "https://via.placeholder.com/60?text=F"} alt={t.name} onError={(e) => { e.target.src = "https://via.placeholder.com/60?text=F"; }} /><div><span className="af-table-name">{t.name}</span>{t.qualification && <span className="af-table-qual">{t.qualification}</span>}</div></div></td>
                        <td><span className="af-dept-tag">{t.department}</span></td>
                        <td className="af-table-desig">{t.designation}</td>
                        <td><span className="af-exp-badge">{t.experience}y</span></td>
                        <td><div className="af-table-contact">{t.email && <span title={t.email}><i className="bx bx-envelope" /></span>}{t.phone && <span title={t.phone}><i className="bx bx-phone" /></span>}{t.office && <span title={t.office}><i className="bx bx-map-pin" /></span>}</div></td>
                        <td><div className="af-row-actions"><button className="af-row-edit" onClick={() => loadIntoForm(t.id)}><i className="bx bx-edit" /> Edit</button><button className="af-row-delete" onClick={() => deleteTeacher(t.id)}><i className="bx bx-trash" /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="af-table-footer">Showing {filteredFaculty.length} of {faculty.length} faculty members</div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
