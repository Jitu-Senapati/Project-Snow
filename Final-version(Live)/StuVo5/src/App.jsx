import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import './App.css'
import Landing from "./pages/auth/Landing";
import FullScreenLoader from "./components/FullScreenLoader";
import Layout from "./components/Layout";
import { ProtectedRoute, UserOnlyRoute, AdminRoute, GuestRoute } from "./routes/AppRoutes";

const Login          = lazy(() => import("./pages/auth/Login"));
const Register       = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const LinkAccount    = lazy(() => import("./pages/auth/LinkAccount"));

const Explore        = lazy(() => import("./pages/explore/Explore"));
const AdminExplore   = lazy(() => import("./pages/explore/AdminExplore"));
const Profile        = lazy(() => import("./pages/explore/Profile"));
const Bus            = lazy(() => import("./pages/explore/Bus"));
const Chat           = lazy(() => import("./pages/explore/Chat"));
const Chats          = lazy(() => import("./pages/explore/Chats"));
const ChatWindow     = lazy(() => import("./pages/explore/ChatWindow"));

// New pages from friend's version
const Settings       = lazy(() => import("./pages/explore/Settings"));
const Search         = lazy(() => import("./pages/explore/Search"));
const ComingSoon     = lazy(() => import("./pages/explore/ComingSoon"));
const SupportUs      = lazy(() => import("./pages/explore/SupportUs"));
const Syllabus       = lazy(() => import("./pages/explore/Syllabus"));
const RaiseComplaint = lazy(() => import("./pages/explore/RaiseComplaint"));

function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/link-account" element={<LinkAccount />} />

        {/* Common protected routes — any logged-in user */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/profile"    element={<Profile />} />
          <Route path="/bus"        element={<Bus />} />
          <Route path="/chat"           element={<Chat />} />
          <Route path="/chat/:chatId"   element={<ChatWindow />} />
          <Route path="/chats"          element={<Chats />} />
          <Route path="/settings"   element={<Settings />} />
          <Route path="/support-us" element={<SupportUs />} />
          <Route path="/syllabus"   element={<Syllabus />} />
          <Route path="/complaint"  element={<RaiseComplaint />} />
          {/* Coming soon routes */}
          <Route path="/clubs"      element={<ComingSoon />} />
          <Route path="/placements" element={<ComingSoon />} />
          <Route path="/facilities" element={<ComingSoon />} />
          <Route path="/transport"  element={<ComingSoon />} />
          <Route path="/cafeteria"  element={<ComingSoon />} />
          <Route path="/library"    element={<ComingSoon />} />
        </Route>

        {/* Regular users only */}
        <Route element={<UserOnlyRoute><Layout /></UserOnlyRoute>}>
          <Route path="/explore" element={<Explore />} />
        </Route>

        {/* Admins only */}
        <Route element={<AdminRoute><Layout /></AdminRoute>}>
          <Route path="/admin-explore" element={<AdminExplore />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;