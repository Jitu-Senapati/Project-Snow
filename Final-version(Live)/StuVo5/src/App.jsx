import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import './App.css'
import Landing from "./pages/auth/Landing";
import FullScreenLoader from "./components/FullScreenLoader";
import { ProtectedRoute, GuestRoute } from "./routes/AppRoutes";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const LinkAccount = lazy(() => import("./pages/auth/LinkAccount"));
const Explore = lazy(() => import("./pages/explore/Explore"));
const AdminExplore = lazy(() => import("./pages/explore/AdminExplore"));

function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/link-account" element={<LinkAccount />} />
        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
        <Route path="/admin-explore" element={<ProtectedRoute><AdminExplore /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  )
}

export default App