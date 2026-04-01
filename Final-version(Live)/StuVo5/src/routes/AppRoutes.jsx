import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullScreenLoader from "../components/FullScreenLoader";
import { signOutUser } from "../firebase/auth";

export const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;

  // Orphaned or incomplete account — sign out and redirect to register
  if (currentUser && userProfile !== null && userProfile.regComplete === false) {
    signOutUser().then(() => {});
    return <Navigate to="/register" replace />;
  }

  // No profile at all — sign out and redirect to login
  if (currentUser && userProfile === null) {
    currentUser.delete().catch(() => {});
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const UserOnlyRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin-explore" replace />;
  return children;
};

export const AdminRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/explore" replace />;
  return children;
};

export const GuestRoute = ({ children }) => {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser) return children;
  return <Navigate to={isAdmin ? "/admin-explore" : "/explore"} replace />;
};