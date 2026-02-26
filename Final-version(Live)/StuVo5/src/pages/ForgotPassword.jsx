import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import logo from "../assets/logo192px.png";

const ForgotPassword = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-section">
      <video autoPlay muted loop id="bg-video">
        <source src="/website.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>

      <div className="logo">
        <img src={logo} alt="STUVO" className="logo-icon" />
        <h1>STUVO5</h1>
      </div>

      <div className="login-box">
        <ForgotPasswordForm onBackToLogin={() => navigate("/login")} />
      </div>
    </div>
  );
};

export default ForgotPassword;
