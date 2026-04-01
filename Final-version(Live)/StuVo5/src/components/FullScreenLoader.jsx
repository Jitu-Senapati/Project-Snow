import { useEffect } from "react";
import { useProgress } from "../context/ProgressContext";

export default function FullScreenLoader() {
  const { startProgress, completeProgress } = useProgress();

  useEffect(() => {
    startProgress(60);
    return () => completeProgress();
  }, []);

  return null; // progress bar is rendered globally by ProgressProvider
}
