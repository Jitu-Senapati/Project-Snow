import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useProgress } from "./ProgressContext";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { startProgress, updateProgress, completeProgress } = useProgress();

  useEffect(() => {
    let unsubscribeProfile = null;

    startProgress(10);

    // Safety net — if Firebase hangs for > 5s, unblock the app
    const safetyTimeout = setTimeout(() => {
      completeProgress();
      setLoading(false);
    }, 5000);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      clearTimeout(safetyTimeout);
      setCurrentUser(user);
      updateProgress(40);

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        updateProgress(60);
        unsubscribeProfile = onSnapshot(
          doc(db, "users", user.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setUserProfile(data);
              setIsAdmin(data?.admin === true);
            } else {
              setUserProfile(null);
              setIsAdmin(false);
            }
            completeProgress();
            setLoading(false);
          },
          (error) => {
            console.error("Profile listener error:", error);
            setIsAdmin(false);
            completeProgress();
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        completeProgress();
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};