import { createRecaptchaVerifier, loginWithPhone } from "../firebase/auth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import "../styles/auth.css";
import logo from "../assets/logo192px.png";

import { loginWithEmail } from "../firebase/auth";

const Login = () => {
  const navigate = useNavigate();

  const [confirmationResult, setConfirmationResult] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOtp = async (phone) => {
    setSendingOtp(true);
    try {
      const verifier = createRecaptchaVerifier("recaptcha-container");
      const result = await loginWithPhone("+91" + phone, verifier);
      setConfirmationResult(result);
      // Clear after successful send
      return true;
    } catch (err) {
      alert(err.message);
      return false;
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    try {
      await confirmationResult.confirm(otp);
      navigate("/explore");
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleLogin = async (email, password) => {
    try {
      await loginWithEmail(email, password);
      navigate("/explore");
    } catch (err) {
      alert(err.message);
    }
  };

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
          onLogin={handleLogin}
          onSendOtp={handleSendOtp}
          onVerifyOtp={handleVerifyOtp}
          sendingOtp={sendingOtp}
        />
      </div>

      <div id="recaptcha-container"></div>    </div>
  );
};

export default Login;
