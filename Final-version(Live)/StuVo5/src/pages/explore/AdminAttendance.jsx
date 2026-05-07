import { useState, useEffect } from "react";
import "../../styles/AdminAttendance.css";
const initialData = {
  1: [
    {
      id: 1,
      name: "Mathematics I",
      code: "MATH101",
      attended: 38,
      total: 45,
      icon: "📐",
    },
    {
      id: 2,
      name: "Physics I",
      code: "PHY101",
      attended: 30,
      total: 40,
      icon: "⚛️",
    },
    {
      id: 3,
      name: "English",
      code: "ENG101",
      attended: 22,
      total: 35,
      icon: "📖",
    },
    {
      id: 4,
      name: "Programming Fundamentals",
      code: "CS101",
      attended: 42,
      total: 44,
      icon: "💻",
    },
  ],
  2: [
    {
      id: 1,
      name: "Mathematics II",
      code: "MATH201",
      attended: 35,
      total: 42,
      icon: "📐",
    },
    {
      id: 2,
      name: "Physics II",
      code: "PHY201",
      attended: 28,
      total: 38,
      icon: "⚛️",
    },
    {
      id: 3,
      name: "Chemistry",
      code: "CHEM201",
      attended: 20,
      total: 36,
      icon: "🧪",
    },
    {
      id: 4,
      name: "Data Structures",
      code: "CS201",
      attended: 40,
      total: 44,
      icon: "💻",
    },
  ],
  3: [
    {
      id: 1,
      name: "Discrete Mathematics",
      code: "MATH301",
      attended: 33,
      total: 40,
      icon: "📐",
    },
    {
      id: 2,
      name: "Computer Networks",
      code: "CS301",
      attended: 36,
      total: 42,
      icon: "🌐",
    },
    {
      id: 3,
      name: "Database Systems",
      code: "CS302",
      attended: 38,
      total: 44,
      icon: "🗄️",
    },
    {
      id: 4,
      name: "Operating Systems",
      code: "CS303",
      attended: 25,
      total: 40,
      icon: "⚙️",
    },
  ],
  4: [
    {
      id: 1,
      name: "Algorithms",
      code: "CS401",
      attended: 42,
      total: 44,
      icon: "🔢",
    },
    {
      id: 2,
      name: "Software Engineering",
      code: "CS402",
      attended: 30,
      total: 40,
      icon: "🛠️",
    },
    {
      id: 3,
      name: "Machine Learning",
      code: "CS403",
      attended: 28,
      total: 38,
      icon: "🤖",
    },
    {
      id: 4,
      name: "Web Development",
      code: "CS404",
      attended: 38,
      total: 42,
      icon: "🕸️",
    },
  ],
  5: [
    {
      id: 1,
      name: "Compiler Design",
      code: "CS501",
      attended: 30,
      total: 40,
      icon: "🔧",
    },
    {
      id: 2,
      name: "Computer Graphics",
      code: "CS502",
      attended: 22,
      total: 36,
      icon: "🎨",
    },
    {
      id: 3,
      name: "Cryptography",
      code: "CS503",
      attended: 35,
      total: 44,
      icon: "🔐",
    },
    {
      id: 4,
      name: "Cloud Computing",
      code: "CS504",
      attended: 38,
      total: 42,
      icon: "☁️",
    },
  ],
  6: [
    {
      id: 1,
      name: "Distributed Systems",
      code: "CS601",
      attended: 28,
      total: 38,
      icon: "🖧",
    },
    {
      id: 2,
      name: "AI & Deep Learning",
      code: "CS602",
      attended: 36,
      total: 44,
      icon: "🧠",
    },
    {
      id: 3,
      name: "Blockchain",
      code: "CS603",
      attended: 20,
      total: 36,
      icon: "⛓️",
    },
    {
      id: 4,
      name: "Project Management",
      code: "CS604",
      attended: 40,
      total: 42,
      icon: "📋",
    },
  ],
  7: [
    {
      id: 1,
      name: "Research Methodology",
      code: "CS701",
      attended: 18,
      total: 24,
      icon: "🔬",
    },
    {
      id: 2,
      name: "Data Mining",
      code: "CS702",
      attended: 20,
      total: 28,
      icon: "⛏️",
    },
    {
      id: 3,
      name: "IoT Systems",
      code: "CS703",
      attended: 22,
      total: 28,
      icon: "📡",
    },
    {
      id: 4,
      name: "Elective I",
      code: "CS704",
      attended: 16,
      total: 22,
      icon: "🎯",
    },
  ],
  8: [
    {
      id: 1,
      name: "Project Work",
      code: "CS801",
      attended: 18,
      total: 20,
      icon: "🚀",
    },
    {
      id: 2,
      name: "Seminar",
      code: "CS802",
      attended: 10,
      total: 12,
      icon: "🎤",
    },
    {
      id: 3,
      name: "Industrial Training",
      code: "CS803",
      attended: 28,
      total: 30,
      icon: "🏭",
    },
    {
      id: 4,
      name: "Elective II",
      code: "CS804",
      attended: 16,
      total: 20,
      icon: "🎓",
    },
  ],
};

function getRingColor(pct) {
  if (pct >= 75) return "#4ade80";
  if (pct >= 60) return "#facc15";
  return "#f87171";
}

function EditRow({ subject, onSave, onCancel }) {
  const [att, setAtt] = useState(String(subject.attended));
  const [tot, setTot] = useState(String(subject.total));
  const [name, setName] = useState(subject.name);

  const pct =
    tot && att
      ? Math.min(100, Math.round((parseInt(att) / parseInt(tot)) * 100))
      : 0;
  const color = getRingColor(pct);

  const handleSave = () => {
    const a = parseInt(att),
      t = parseInt(tot);
    if (isNaN(a) || isNaN(t) || a < 0 || t <= 0 || a > t || !name.trim())
      return;
    onSave({ ...subject, name: name.trim(), attended: a, total: t });
  };

  return (
    <div className="adm-edit-row">
      <div className="adm-edit-row__top">
        <span className="adm-edit-row__icon">{subject.icon}</span>
        <input
          className="adm-edit-row__name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Subject name"
        />
        <span className="adm-edit-row__code">{subject.code}</span>
      </div>
      <div className="adm-edit-row__fields">
        <div className="adm-edit-field">
          <label>Attended</label>
          <input
            type="number"
            value={att}
            min="0"
            onChange={(e) => setAtt(e.target.value)}
          />
        </div>
        <div className="adm-edit-field">
          <label>Total</label>
          <input
            type="number"
            value={tot}
            min="1"
            onChange={(e) => setTot(e.target.value)}
          />
        </div>
        <div className="adm-edit-field adm-edit-field--pct">
          <label>Result</label>
          <span
            style={{
              color,
              fontFamily: "'DM Mono', monospace",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {pct}%
          </span>
        </div>
      </div>
      <div className="adm-edit-row__actions">
        <button className="adm-btn adm-btn--save" onClick={handleSave}>
          Save
        </button>
        <button className="adm-btn adm-btn--cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function SubjectRow({ subject, onEdit, onDelete }) {
  const pct = Math.round((subject.attended / subject.total) * 100);
  const color = getRingColor(pct);
  const isLow = pct < 75;

  return (
    <div className={`adm-row ${isLow ? "adm-row--low" : ""}`}>
      <span className="adm-row__icon">{subject.icon}</span>
      <div className="adm-row__info">
        <p className="adm-row__name">{subject.name}</p>
        <p className="adm-row__meta">
          {subject.code} · {subject.attended}/{subject.total}
        </p>
        <div className="adm-row__track">
          <div
            className="adm-row__fill"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
      <span className="adm-row__pct" style={{ color }}>
        {pct}%
      </span>
      <div className="adm-row__btns">
        <button
          className="adm-icon-btn adm-icon-btn--edit"
          onClick={onEdit}
          title="Edit"
        >
          ✏️
        </button>
        <button
          className="adm-icon-btn adm-icon-btn--del"
          onClick={onDelete}
          title="Delete"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

function AddSubjectForm({ onAdd, onClose }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [icon, setIcon] = useState("📚");
  const [att, setAtt] = useState("");
  const [tot, setTot] = useState("");
  const [err, setErr] = useState("");

  const icons = [
    "📐",
    "⚛️",
    "📖",
    "💻",
    "🧪",
    "🌐",
    "🗄️",
    "⚙️",
    "🔢",
    "🛠️",
    "🤖",
    "🕸️",
    "🔧",
    "🎨",
    "🔐",
    "☁️",
    "🧠",
    "⛓️",
    "📋",
    "🔬",
    "⛏️",
    "📡",
    "🎯",
    "🚀",
    "🎤",
    "🏭",
    "🎓",
  ];

  const handleAdd = () => {
    const a = parseInt(att),
      t = parseInt(tot);
    if (!name.trim()) return setErr("Subject name required");
    if (!code.trim()) return setErr("Code required");
    if (isNaN(a) || isNaN(t) || a < 0 || t <= 0 || a > t)
      return setErr("Invalid attendance values");
    onAdd({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      icon,
      attended: a,
      total: t,
    });
  };

  return (
    <div className="adm-add-form">
      <div className="adm-add-form__header">
        <p className="adm-add-form__title">Add Subject</p>
        <button className="adm-add-form__close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="adm-add-form__icon-grid">
        {icons.map((ic) => (
          <button
            key={ic}
            className={`adm-icon-pick ${icon === ic ? "adm-icon-pick--on" : ""}`}
            onClick={() => setIcon(ic)}
          >
            {ic}
          </button>
        ))}
      </div>

      <div className="adm-add-form__row">
        <div className="adm-add-field">
          <label>Subject Name</label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErr("");
            }}
            placeholder="e.g. Mathematics I"
          />
        </div>
        <div className="adm-add-field">
          <label>Code</label>
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setErr("");
            }}
            placeholder="e.g. MATH101"
          />
        </div>
      </div>
      <div className="adm-add-form__row">
        <div className="adm-add-field">
          <label>Attended</label>
          <input
            type="number"
            value={att}
            onChange={(e) => {
              setAtt(e.target.value);
              setErr("");
            }}
            placeholder="38"
            min="0"
          />
        </div>
        <div className="adm-add-field">
          <label>Total Classes</label>
          <input
            type="number"
            value={tot}
            onChange={(e) => {
              setTot(e.target.value);
              setErr("");
            }}
            placeholder="45"
            min="1"
          />
        </div>
      </div>
      {err && <p className="adm-add-form__err">{err}</p>}
      <button className="adm-btn adm-btn--primary" onClick={handleAdd}>
        + Add Subject
      </button>
    </div>
  );
}

export default function AdminAttendence() {
  const [sem, setSem] = useState(1);
  const [data, setData] = useState(() =>
    JSON.parse(JSON.stringify(initialData)),
  );
  const [editId, setEditId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 40);
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const subjects = data[sem] || [];
  const totalAtt = subjects.reduce((a, s) => a + s.attended, 0);
  const totalCls = subjects.reduce((a, s) => a + s.total, 0);
  const overallPct = totalCls ? Math.round((totalAtt / totalCls) * 100) : 0;

  const handleSave = (updated) => {
    setData((prev) => ({
      ...prev,
      [sem]: prev[sem].map((s) => (s.id === updated.id ? updated : s)),
    }));
    setEditId(null);
    showToast("Attendance updated");
  };

  const handleDelete = (id) => {
    setData((prev) => ({
      ...prev,
      [sem]: prev[sem].filter((s) => s.id !== id),
    }));
    setDeleteId(null);
    showToast("Subject removed", "warn");
  };

  const handleAdd = (newSubject) => {
    const newId = Date.now();
    setData((prev) => ({
      ...prev,
      [sem]: [...(prev[sem] || []), { ...newSubject, id: newId }],
    }));
    setShowAdd(false);
    showToast("Subject added");
  };

  const handleResetSem = () => {
    setData((prev) => ({
      ...prev,
      [sem]: JSON.parse(JSON.stringify(initialData[sem] || [])),
    }));
    showToast("Semester reset to defaults", "warn");
  };

  return (
    <div className={`adm ${mounted ? "adm--in" : ""}`}>
      <div className="adm__inner">
        {/* Toast */}
        {toast && (
          <div className={`adm-toast adm-toast--${toast.type}`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="adm__header">
          <button className="adm__back" onClick={() => window.history.back()}>
            ←
          </button>
          <div className="adm__header-info">
            <h1 className="adm__title">Attendance Admin</h1>
            <p className="adm__sub">Manage subject-wise records</p>
          </div>
          <span className="adm__badge">ADMIN</span>
        </div>

        {/* Sem Selector */}
        <div className="sem-bar">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <button
              key={s}
              className={`sem-btn ${sem === s ? "sem-btn--on" : ""}`}
              onClick={() => {
                setSem(s);
                setEditId(null);
                setShowAdd(false);
              }}
            >
              Sem {s}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="adm-summary">
          <div className="adm-summary__left">
            <p className="adm-summary__label">SEMESTER {sem} OVERVIEW</p>
            <p className="adm-summary__val">
              {totalAtt}
              <span>/{totalCls}</span>
            </p>
            <p className="adm-summary__sub">
              classes · {subjects.length} subjects
            </p>
          </div>
          <div className="adm-summary__right">
            <div
              className="adm-summary__pct"
              style={{ color: getRingColor(overallPct) }}
            >
              {overallPct}%
            </div>
            <p className="adm-summary__pct-lbl">Overall</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="adm-actions">
          <button
            className="adm-btn adm-btn--primary adm-btn--sm"
            onClick={() => {
              setShowAdd(!showAdd);
              setEditId(null);
            }}
          >
            {showAdd ? "✕ Cancel" : "+ Add Subject"}
          </button>
          <button
            className="adm-btn adm-btn--ghost adm-btn--sm"
            onClick={handleResetSem}
          >
            ↺ Reset Sem
          </button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <div className="adm__section">
            <AddSubjectForm
              onAdd={handleAdd}
              onClose={() => setShowAdd(false)}
            />
          </div>
        )}

        {/* Subject List */}
        <div className="adm__section">
          <p className="adm-section-lbl">SUBJECTS · SEM {sem}</p>

          {subjects.length === 0 && (
            <div className="adm-empty">No subjects yet. Add one above.</div>
          )}

          {subjects.map((s) =>
            editId === s.id ? (
              <EditRow
                key={s.id}
                subject={s}
                onSave={handleSave}
                onCancel={() => setEditId(null)}
              />
            ) : deleteId === s.id ? (
              <div key={s.id} className="adm-confirm">
                <p>
                  Delete <strong>{s.name}</strong>?
                </p>
                <div className="adm-confirm__btns">
                  <button
                    className="adm-btn adm-btn--danger adm-btn--sm"
                    onClick={() => handleDelete(s.id)}
                  >
                    Delete
                  </button>
                  <button
                    className="adm-btn adm-btn--ghost adm-btn--sm"
                    onClick={() => setDeleteId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <SubjectRow
                key={s.id}
                subject={s}
                onEdit={() => {
                  setEditId(s.id);
                  setShowAdd(false);
                  setDeleteId(null);
                }}
                onDelete={() => {
                  setDeleteId(s.id);
                  setEditId(null);
                }}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
