import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import "../styles/auth.css";
import logo from "../assets/logo192px.png";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="auth-section" id="authSection">
      <video autoPlay muted loop id="bg-video">
        <source src="website.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>

      <div className="logo">
        <img src={logo} alt="STUVO" className="logo-icon" />
        <h1>STUVO5</h1>
      </div>

      <div className="login-box">
        <LoginForm
          onSwitchToRegister={() => navigate("/register")}
          onForgotPassword={() => navigate("/forgot-password")}
        />
      </div>
    </div>
  );
};

export default Login;
