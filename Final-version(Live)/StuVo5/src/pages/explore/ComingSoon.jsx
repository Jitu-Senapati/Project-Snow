import { useNavigate, useLocation } from "react-router-dom";
import "boxicons/css/boxicons.min.css";

export default function ComingSoon() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageName = location.state?.name || "This Page";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "rgba(167,139,250,0.1)",
          border: "1px solid rgba(167,139,250,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <i
          className="bx bx-time-five"
          style={{ fontSize: 36, color: "#a78bfa" }}
        />
      </div>
      <h2
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#fff",
          marginBottom: 10,
        }}
      >
        Coming Soon
      </h2>
      <p
        style={{
          fontSize: 13,
          color: "#666",
          lineHeight: 1.6,
          maxWidth: 260,
          marginBottom: 28,
        }}
      >
        <strong style={{ color: "#a78bfa" }}>{pageName}</strong> is under
        construction. We're working hard to bring it to you!
      </p>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#1a1a1a",
          border: "1px solid #2a2a2a",
          borderRadius: 12,
          color: "#aaa",
          fontSize: 14,
          fontWeight: 600,
          padding: "12px 24px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <i className="bx bx-arrow-back" />
        Go Back
      </button>
    </div>
  );
}
