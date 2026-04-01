import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(10);

  useEffect(() => {
    let unsubscribeProfile = null;

    // Start at 10% — Firebase SDK initializing
    setLoadProgress(10);

    // Safety net — if Firebase hangs for > 5s, unblock the app
    const safetyTimeout = setTimeout(() => {
      setLoadProgress(100);
      setLoading(false);
    }, 5000);

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      clearTimeout(safetyTimeout); // Firebase responded — cancel the timeout
      setCurrentUser(user);
      setLoadProgress(40); // Auth resolved

      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (user) {
        setLoadProgress(60); // Fetching profile
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
            setLoadProgress(100);
            setLoading(false);
          },
          (error) => {
            console.error("Profile listener error:", error);
            setIsAdmin(false);
            setLoadProgress(100);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setLoadProgress(100);
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
    // ✅ Always render children — route guards handle loading per-page
    <AuthContext.Provider value={{ currentUser, userProfile, isAdmin, loading, loadProgress }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};