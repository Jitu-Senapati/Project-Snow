import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import './App.css'
import Landing from "./pages/auth/Landing";
import FullScreenLoader from "./components/FullScreenLoader";
import Layout from "./components/Layout";
import { ProtectedRoute, UserOnlyRoute, AdminRoute, GuestRoute } from "./routes/AppRoutes";

const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const LinkAccount = lazy(() => import("./pages/auth/LinkAccount"));
const Explore = lazy(() => import("./pages/explore/Explore"));
const AdminExplore = lazy(() => import("./pages/explore/AdminExplore"));
const Profile = lazy(() => import("./pages/explore/Profile"));
const Bus = lazy(() => import("./pages/explore/Bus"));
const Chat = lazy(() => import("./pages/explore/Chat"));

function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/link-account" element={<LinkAccount />} />

        {/* Common protected routes — any logged in user */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/bus" element={<Bus />} />
          <Route path="/chat" element={<Chat />} />
        </Route>

        {/* Regular users only — admins get bounced to /admin-explore */}
        <Route element={<UserOnlyRoute><Layout /></UserOnlyRoute>}>
          <Route path="/explore" element={<Explore />} />
        </Route>

        {/* Admins only — regular users get bounced to /explore */}
        <Route element={<AdminRoute><Layout /></AdminRoute>}>
          <Route path="/admin-explore" element={<AdminExplore />} />
        </Route>

      </Routes>
    </Suspense>
  )
}

export default App