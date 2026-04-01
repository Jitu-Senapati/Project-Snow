import { useAuth } from "../context/AuthContext";

export default function FullScreenLoader() {
  const { loadProgress } = useAuth();

  return (
    <div className="top-progress-bar">
      <div
        className="top-progress-bar-inner"
        style={{ width: `${loadProgress}%` }}
      />
    </div>
  );
}