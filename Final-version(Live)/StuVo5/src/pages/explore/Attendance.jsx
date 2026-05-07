import { useState, useEffect } from "react";
import "../../styles/Attendance.css";

const semesterData = {
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

function CircularProgress({ percentage, size = 72, strokeWidth = 6 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getRingColor(percentage);

  return (
    <svg width={size} height={size} className="att-ring">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fill="#fff"
        fontSize={size * 0.2}
        fontWeight="700"
        fontFamily="'DM Mono', monospace"
      >
        {percentage}%
      </text>
    </svg>
  );
}

function SubjectCard({ subject, index }) {
  const pct = Math.round((subject.attended / subject.total) * 100);
  const isLow = pct < 75;
  const color = getRingColor(pct);

  return (
    <div
      className={`scard ${isLow ? "scard--low" : ""}`}
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="scard__icon">{subject.icon}</div>
      <div className="scard__body">
        <div className="scard__name">{subject.name}</div>
        <div className="scard__meta">
          <span className="scard__code">{subject.code}</span>
          <span className="scard__sep">·</span>
          <span className="scard__count">
            {subject.attended}/{subject.total}
          </span>
        </div>
        <div className="scard__track">
          <div
            className="scard__fill"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>
      <div className="scard__right">
        <CircularProgress percentage={pct} size={58} strokeWidth={5} />
        {isLow && <span className="scard__low">LOW</span>}
      </div>
    </div>
  );
}

function Calculator() {
  const [total, setTotal] = useState("");
  const [attended, setAttended] = useState("");
  const [result, setResult] = useState(null);
  const [err, setErr] = useState(false);

  const pctLive =
    total && attended
      ? Math.min(100, Math.round((parseInt(attended) / parseInt(total)) * 100))
      : 0;

  const calculate = () => {
    const t = parseInt(total);
    const a = parseInt(attended);
    if (!t || isNaN(a) || a > t || t <= 0 || a < 0) {
      setErr(true);
      setTimeout(() => setErr(false), 500);
      return;
    }
    const current = Math.round((a / t) * 100);
    const target = 75;
    let classesNeeded = 0,
      canBunk = 0;
    if (current < target) {
      classesNeeded = Math.ceil(((target * t) / 100 - a) / (1 - target / 100));
    } else {
      canBunk = Math.floor((100 * a - target * t) / target);
    }
    setResult({ current, classesNeeded, canBunk, total: t, attended: a });
  };

  return (
    <div className="calc">
      <p className="calc__desc">
        Enter your class data to find out how many you can skip or need to
        attend to stay above 75%.
      </p>

      <div className="calc__preview">
        <CircularProgress percentage={pctLive} size={90} strokeWidth={7} />
        <span className="calc__preview-lbl">Live Preview</span>
      </div>

      <div className={`calc__row ${err ? "calc__row--err" : ""}`}>
        <div className="calc__field">
          <label>Total Classes</label>
          <input
            type="number"
            placeholder="45"
            value={total}
            min="1"
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>
        <div className="calc__field">
          <label>Attended</label>
          <input
            type="number"
            placeholder="38"
            value={attended}
            min="0"
            onChange={(e) => setAttended(e.target.value)}
          />
        </div>
      </div>

      <button className="calc__btn" onClick={calculate}>
        Calculate
      </button>

      {result && (
        <div
          className={`calc__result ${result.current < 75 ? "calc__result--bad" : "calc__result--good"}`}
        >
          <CircularProgress
            percentage={result.current}
            size={72}
            strokeWidth={6}
          />
          <div className="calc__result-info">
            <p className="calc__result-status">
              {result.current >= 75 ? "You're Safe ✓" : "Below Target ✗"}
            </p>
            <p className="calc__result-fraction">
              {result.attended}/{result.total} attended
            </p>
            <p className="calc__result-msg">
              {result.current < 75 ? (
                <>
                  Need <strong>{result.classesNeeded}</strong> more classes to
                  reach 75%
                </>
              ) : (
                <>
                  Can skip <strong>{result.canBunk}</strong> more and stay above
                  75%
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Attendence() {
  const [sem, setSem] = useState(3);
  const [tab, setTab] = useState("subjects");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 40);
  }, []);

  const subjects = semesterData[sem] || [];
  const totalAtt = subjects.reduce((a, s) => a + s.attended, 0);
  const totalCls = subjects.reduce((a, s) => a + s.total, 0);
  const overallPct = totalCls ? Math.round((totalAtt / totalCls) * 100) : 0;
  const lowCount = subjects.filter(
    (s) => Math.round((s.attended / s.total) * 100) < 75,
  ).length;

  return (
    <div className={`att ${mounted ? "att--in" : ""}`}>
      {/* Header */}
      <div className="att__header">
        <button className="att__back" onClick={() => window.history.back()}>
          ←
        </button>
        <h1 className="att__title">Attendance</h1>
        <span
          className="att__overall-badge"
          style={{
            color: getRingColor(overallPct),
            borderColor: getRingColor(overallPct) + "44",
          }}
        >
          {overallPct}%
        </span>
      </div>

      {/* Semester Pills */}
      <div className="sem-bar">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
          <button
            key={s}
            className={`sem-btn ${sem === s ? "sem-btn--on" : ""}`}
            onClick={() => setSem(s)}
          >
            Sem {s}
          </button>
        ))}
      </div>

      {/* Overview Card */}
      <div className="overview">
        <CircularProgress percentage={overallPct} size={100} strokeWidth={8} />
        <div className="overview__info">
          <p className="overview__label">SEMESTER {sem}</p>
          <p className="overview__fraction">
            {totalAtt}
            <span>/{totalCls}</span>
          </p>
          <p className="overview__sub">classes attended</p>
          <div className="overview__badges">
            {lowCount > 0 ? (
              <span className="badge badge--warn">⚠ {lowCount} below 75%</span>
            ) : (
              <span className="badge badge--ok">✓ All clear</span>
            )}
            <span className="badge badge--muted">
              {totalCls - totalAtt} missed
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats">
        {[
          { label: "Total", val: totalCls, color: "#fff" },
          { label: "Present", val: totalAtt, color: "#4ade80" },
          { label: "Absent", val: totalCls - totalAtt, color: "#f87171" },
        ].map((s) => (
          <div key={s.label} className="stat">
            <p className="stat__val" style={{ color: s.color }}>
              {s.val}
            </p>
            <p className="stat__lbl">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${tab === "subjects" ? "tab-btn--on" : ""}`}
          onClick={() => setTab("subjects")}
        >
          Subjects
        </button>
        <button
          className={`tab-btn ${tab === "calculator" ? "tab-btn--on" : ""}`}
          onClick={() => setTab("calculator")}
        >
          ⚡ Calculator
        </button>
      </div>

      {/* Content */}
      <div className="att__content">
        {tab === "subjects" ? (
          <>
            <p className="section-lbl">SUBJECT-WISE · SEM {sem}</p>
            {subjects.map((s, i) => (
              <SubjectCard key={s.id} subject={s} index={i} />
            ))}
          </>
        ) : (
          <Calculator />
        )}
      </div>
    </div>
  );
}
