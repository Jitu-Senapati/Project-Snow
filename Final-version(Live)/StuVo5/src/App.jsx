import { Routes, Route } from "react-router-dom";
import './App.css'
import { lazy, Suspense } from "react";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Explore = lazy(() => import("./pages/Explore"));
import FullScreenLoader from "./components/FullScreenLoader";

function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/FullScreenLoader" element={<FullScreenLoader />} />      
      </Routes>
    </Suspense>
  )
}

export default App