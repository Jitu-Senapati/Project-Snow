import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FullScreenLoader from "../components/FullScreenLoader";

export const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!currentUser) return <Navigate to="/login" replace />;
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