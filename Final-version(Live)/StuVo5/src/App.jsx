import { Routes, Route } from "react-router-dom";
import { lazy, Suspense, Component } from "react";
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
const OthersProfile  = lazy(() => import("./pages/explore/OthersProfile"));
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
const Placements     = lazy(() => import("./pages/explore/Placements"));

// Error boundary for lazy-loaded pages that fail offline
class LazyErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: 12, color: "#aaa" }}>
          <i className="bx bx-wifi-off" style={{ fontSize: 48, color: "#555" }} />
          <p style={{ fontSize: 15 }}>Page unavailable offline</p>
          <button onClick={() => this.setState({ failed: false })} style={{ background: "#7c3aed", border: "none", color: "#fff", padding: "8px 20px", borderRadius: 20, cursor: "pointer", fontSize: 13 }}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <LazyErrorBoundary>
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
          <Route path="/user/:uid"  element={<OthersProfile />} />
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
          <Route path="/placements" element={<Placements />} />
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
    </LazyErrorBoundary>
  );
}

export default App;