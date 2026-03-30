import { useState, useRef, useEffect, useCallback } from "react";
import "../../styles/searchpage.css";

const TABS = [
  { key: "student", label: "Students" },
  { key: "faculty", label: "Faculty" },
  { key: "event", label: "Events" },
  { key: "notice", label: "Notices" },
  { key: "chat", label: "Groups" },
];

const TYPE_COLOR = {
  student: "#a78bfa",
  faculty: "#10b981",
  event: "#f59e0b",
  notice: "#3b82f6",
  chat: "#ec4899",
};

const INITIAL_MOCK = [
  {
    id: 1,
    type: "student",
    name: "Jitu Grandu",
    username: "@jitu_samapati",
    branch: "BCA",
    year: "3rd year",
    initials: "JG",
    following: false,
  },
  {
    id: 2,
    type: "student",
    name: "Priya Sahoo",
    username: "@priya_s",
    branch: "B.Tech CSE",
    year: "2nd year",
    initials: "PS",
    following: true,
  },
  {
    id: 3,
    type: "student",
    name: "Rohit Dash",
    username: "@rohit_d",
    branch: "MCA",
    year: "1st year",
    initials: "RD",
    following: false,
  },
  {
    id: 4,
    type: "student",
    name: "Sneha Pattnaik",
    username: "@sneha_p",
    branch: "B.Sc IT",
    year: "4th year",
    initials: "SP",
    following: false,
  },
  {
    id: 5,
    type: "student",
    name: "Aman Verma",
    username: "@aman_v",
    branch: "MBA",
    year: "2nd year",
    initials: "AV",
    following: true,
  },
  {
    id: 6,
    type: "faculty",
    name: "Dr. Arjun Mahapatra",
    username: "@dr.arjun",
    dept: "Computer Science",
    designation: "Associate Professor",
    initials: "AM",
    following: false,
  },
  {
    id: 7,
    type: "faculty",
    name: "Prof. Sunita Rath",
    username: "@prof.sunita",
    dept: "Mathematics",
    designation: "Professor",
    initials: "SR",
    following: true,
  },
  {
    id: 8,
    type: "faculty",
    name: "Dr. Bikash Mohanty",
    username: "@dr.bikash",
    dept: "Physics",
    designation: "Assistant Professor",
    initials: "BM",
    following: false,
  },
  {
    id: 9,
    type: "event",
    name: "Tech Fest 2025",
    date: "Apr 12",
    tag: "Technical",
    desc: "Annual inter-college tech competition",
    initials: "TF",
  },
  {
    id: 10,
    type: "event",
    name: "Cultural Night",
    date: "Apr 20",
    tag: "Cultural",
    desc: "Music, dance and drama performances",
    initials: "CN",
  },
  {
    id: 11,
    type: "event",
    name: "Hackathon 3.0",
    date: "May 2",
    tag: "Technical",
    desc: "24-hour coding marathon open to all",
    initials: "H3",
  },
  {
    id: 12,
    type: "notice",
    name: "Exam Schedule Released",
    date: "Mar 22",
    dept: "Examination Cell",
    desc: "End semester exam timetable is now available on the portal.",
  },
  {
    id: 13,
    type: "notice",
    name: "Fee Payment Deadline",
    date: "Mar 28",
    dept: "Accounts",
    desc: "Last date to pay semester fees without late fine.",
  },
  {
    id: 14,
    type: "notice",
    name: "Library Timing Change",
    date: "Mar 20",
    dept: "Library",
    desc: "Library will remain open until 9 PM from April onwards.",
  },
  {
    id: 15,
    type: "chat",
    name: "BCA 3rd Year",
    members: "128 members",
    desc: "Official group for BCA 3rd year students",
    initials: "B3",
  },
  {
    id: 16,
    type: "chat",
    name: "Coding Club",
    members: "64 members",
    desc: "Discuss DSA, projects and hackathons",
    initials: "CC",
  },
  {
    id: 17,
    type: "chat",
    name: "Placement Cell",
    members: "210 members",
    desc: "Jobs, internships and interview tips",
    initials: "PC",
  },
];

const TAB_PLACEHOLDER = {
  student: "Search students by name, branch…",
  faculty: "Search faculty by name, department…",
  event: "Search events…",
  notice: "Search notices…",
  chat: "Search groups…",
};

const Chip = ({ label, color }) => (
  <span
    className="se-chip"
    style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
  >
    {label}
  </span>
);

const Avatar = ({ initials, color, shape = "circle", small = false }) => (
  <div
    className={[
      "se-avatar",
      small ? "se-avatar--sm" : "",
      shape === "circle" ? "se-avatar--circle" : "se-avatar--rounded",
    ].join(" ")}
    style={{
      background: `${color}22`,
      border: `1.5px solid ${color}55`,
      color,
    }}
  >
    {initials}
  </div>
);

const FollowButton = ({ following, color, onToggle }) => {
  const [hovered, setHovered] = useState(false);
  return following ? (
    <button
      className="se-btn se-btn--outline"
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${color}55`,
        color,
        background: hovered ? `${color}18` : "transparent",
      }}
    >
      Following
    </button>
  ) : (
    <button
      className="se-btn se-btn--solid"
      onClick={onToggle}
      style={{ background: color, border: `1px solid ${color}` }}
    >
      Follow
    </button>
  );
};

const StudentCard = ({ item, onToggleFollow }) => {
  const c = TYPE_COLOR.student;
  return (
    <div className="se-card">
      <Avatar initials={item.initials} color={c} />
      <div className="se-card-meta">
        <div className="se-card-name">{item.name}</div>
        <div className="se-card-username" style={{ color: c }}>
          {item.username}
        </div>
        <div className="se-card-chips">
          <Chip label={item.branch} color={c} />
          <Chip label={item.year} color="#555" />
        </div>
      </div>
      <FollowButton
        following={item.following}
        color={c}
        onToggle={() => onToggleFollow(item.id)}
      />
    </div>
  );
};

const FacultyCard = ({ item, onToggleFollow }) => {
  const c = TYPE_COLOR.faculty;
  return (
    <div className="se-card">
      <Avatar initials={item.initials} color={c} />
      <div className="se-card-meta">
        <div className="se-card-name">{item.name}</div>
        <div className="se-card-username" style={{ color: c }}>
          {item.username}
        </div>
        <div className="se-card-chips">
          <Chip label={item.designation} color={c} />
          <Chip label={item.dept} color="#555" />
        </div>
      </div>
      <FollowButton
        following={item.following}
        color={c}
        onToggle={() => onToggleFollow(item.id)}
      />
    </div>
  );
};

const EventCard = ({ item }) => {
  const c = TYPE_COLOR.event;
  return (
    <div className="se-card">
      <Avatar initials={item.initials} color={c} shape="rounded" />
      <div className="se-card-meta">
        <div className="se-card-name">{item.name}</div>
        <div className="se-card-desc">{item.desc}</div>
        <div className="se-card-chips">
          <Chip label={`📅 ${item.date}`} color={c} />
          <Chip label={item.tag} color="#555" />
        </div>
      </div>
      <button
        className="se-btn se-btn--solid"
        style={{ background: c, border: `1px solid ${c}` }}
      >
        View
      </button>
    </div>
  );
};

const NoticeCard = ({ item }) => {
  const c = TYPE_COLOR.notice;
  return (
    <div className="se-card se-card--notice">
      <div className="se-card-notice-row">
        <Avatar initials="📋" color={c} shape="rounded" small />
        <div className="se-card-meta">
          <div className="se-card-name">{item.name}</div>
          <div className="se-card-chips">
            <Chip label={item.dept} color={c} />
            <Chip label={item.date} color="#555" />
          </div>
        </div>
      </div>
      <p className="se-card-notice-body">{item.desc}</p>
    </div>
  );
};

const ChatCard = ({ item }) => {
  const c = TYPE_COLOR.chat;
  return (
    <div className="se-card">
      <Avatar initials={item.initials} color={c} shape="rounded" />
      <div className="se-card-meta">
        <div className="se-card-name">{item.name}</div>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
          {item.members}
        </div>
        <div className="se-card-desc se-card-desc--chat">{item.desc}</div>
      </div>
      <button
        className="se-btn se-btn--outline"
        style={{ background: `${c}18`, border: `1px solid ${c}35`, color: c }}
      >
        Join
      </button>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="se-skeleton-card">
    <div
      className="se-skeleton-block"
      style={{ width: 48, height: 48, borderRadius: "50%" }}
    />
    <div className="se-skeleton-meta">
      <div className="se-skeleton-block" style={{ width: "55%", height: 13 }} />
      <div className="se-skeleton-block" style={{ width: "35%", height: 11 }} />
      <div className="se-skeleton-chips">
        <div
          className="se-skeleton-block"
          style={{ width: 52, height: 19, borderRadius: 20 }}
        />
        <div
          className="se-skeleton-block"
          style={{ width: 60, height: 19, borderRadius: 20 }}
        />
      </div>
    </div>
    <div
      className="se-skeleton-block"
      style={{ width: 70, height: 31, borderRadius: 8 }}
    />
  </div>
);

const EmptyState = ({ query }) => (
  <div className="se-empty">
    <div className="se-empty-icon">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#3a3a3a"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    </div>
    {query ? (
      <>
        <div className="se-empty-title">No results for "{query}"</div>
        <div className="se-empty-sub">Try a different keyword.</div>
      </>
    ) : (
      <>
        <div className="se-empty-title">No recent searches</div>
        <div className="se-empty-sub">Your search history will appear here</div>
      </>
    )}
  </div>
);

export default function SearchExplore() {
  const [activeTab, setActiveTab] = useState("student");
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState(INITIAL_MOCK);

  const debounceRef = useRef(null);
  const loadingRef = useRef(null);

  const handleInput = useCallback((e) => {
    const val = e.target.value;
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), 280);
  }, []);

  const clearSearch = () => {
    setInputValue("");
    setQuery("");
  };

  useEffect(() => {
    if (!query.trim()) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    clearTimeout(loadingRef.current);
    loadingRef.current = setTimeout(() => setIsLoading(false), 260);
    return () => clearTimeout(loadingRef.current);
  }, [query, activeTab]);

  const toggleFollow = (id) =>
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, following: !item.following } : item,
      ),
    );

  const q = query.trim().toLowerCase();
  const results = q
    ? items.filter((r) => {
        if (r.type !== activeTab) return false;
        const fields = [
          r.name,
          r.username,
          r.branch,
          r.year,
          r.dept,
          r.designation,
          r.tag,
          r.desc,
          r.members,
        ].filter(Boolean);
        return fields.some((f) => f.toLowerCase().includes(q));
      })
    : [];

  const color = TYPE_COLOR[activeTab];

  const renderCard = (item) => {
    switch (item.type) {
      case "student":
        return (
          <StudentCard
            key={item.id}
            item={item}
            onToggleFollow={toggleFollow}
          />
        );
      case "faculty":
        return (
          <FacultyCard
            key={item.id}
            item={item}
            onToggleFollow={toggleFollow}
          />
        );
      case "event":
        return <EventCard key={item.id} item={item} />;
      case "notice":
        return <NoticeCard key={item.id} item={item} />;
      case "chat":
        return <ChatCard key={item.id} item={item} />;
      default:
        return null;
    }
  };

  return (
    <div className="se-wrapper">
      <div className="se-inner">
        {/* ── Header ── */}
        <div className="se-header">
          <div className="se-header-inner">
            <div className="se-search-wrap">
              <div className="se-search-input-wrap">
                <span className="se-search-icon">
                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="se-search-input"
                  value={inputValue}
                  placeholder={TAB_PLACEHOLDER[activeTab]}
                  onChange={handleInput}
                />
                {inputValue && (
                  <button className="se-clear-btn" onClick={clearSearch}>
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="se-tabs">
              {TABS.map((t) => {
                const active = activeTab === t.key;
                const tc = TYPE_COLOR[t.key];
                return (
                  <button
                    key={t.key}
                    className="se-tab-btn"
                    onClick={() => setActiveTab(t.key)}
                    style={{
                      background: active ? `${tc}22` : "#111",
                      border: `1px solid ${active ? `${tc}66` : "#2a2a2a"}`,
                      color: active ? tc : "#777",
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="se-body">
          {isLoading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}

          {!isLoading && q && results.length > 0 && (
            <>
              <div className="se-results-header">
                <div
                  className="se-results-line"
                  style={{
                    background:
                      "linear-gradient(to right, #2a2a2a, transparent)",
                  }}
                />
                <span className="se-results-count" style={{ color }}>
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </span>
                <div
                  className="se-results-line"
                  style={{
                    background:
                      "linear-gradient(to left, #2a2a2a, transparent)",
                  }}
                />
              </div>
              <div className="se-results-grid">{results.map(renderCard)}</div>
            </>
          )}

          {!isLoading && (!q || results.length === 0) && (
            <EmptyState query={q && results.length === 0 ? q : ""} />
          )}
        </div>
      </div>
    </div>
  );
}
