import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullScreenLoader from "../components/FullScreenLoader";
import { signOutUser } from "../firebase/auth";

export const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;

  // Incomplete registration — sign out and redirect to register
  if (userProfile && userProfile.regComplete === false) {
    signOutUser().then(() => {});
    return <Navigate to="/register" replace />;
  }

  // No Firestore profile at all — redirect to register (don't delete the auth user,
  // they might just need to complete registration)
  if (!userProfile) {
    return <Navigate to="/register" replace />;
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
  const { currentUser, isAdmin, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!currentUser) return children;
  return <Navigate to={isAdmin ? "/admin-explore" : "/explore"} replace />;
};