import { Routes, Route } from "react-router-dom";
import './App.css'
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  )
}

export default App
