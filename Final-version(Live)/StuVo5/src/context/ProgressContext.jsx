import { createContext, useContext, useState, useCallback, useRef } from "react";

const ProgressContext = createContext(null);

export const ProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);

  const startProgress = useCallback((value = 10) => {
    clearTimeout(hideTimer.current);
    setVisible(true);
    setProgress(value);
  }, []);

  const updateProgress = useCallback((value) => {
    setProgress(value);
  }, []);

  const completeProgress = useCallback(() => {
    setProgress(100);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400); // let the bar reach 100% visually before hiding
  }, []);

  return (
    <ProgressContext.Provider value={{ progress, visible, startProgress, updateProgress, completeProgress }}>
      {visible && (
        <div className="top-progress-bar">
          <div
            className="top-progress-bar-inner"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used inside ProgressProvider");
  return context;
};