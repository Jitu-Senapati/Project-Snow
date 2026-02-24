import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import VerificationForm from "./VerificationForm";
import TermsModal from "./TermsModal";
import VerificationModal from "./VerificationModal";
import ForgotPasswordForm from "./ForgotPasswordForm";
import Logo from "../../assets/logo192px.png";


const AuthContainer = ({ initialView = "login" }) => {
  const [currentView, setCurrentView] = useState(initialView);
  const [showVerification, setShowVerification] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [registeredData, setRegisteredData] = useState({});

  const handleSwitchToRegister = () => {
    setCurrentView("register");
  };

  const handleSwitchToLogin = () => {
    setCurrentView("login");
  };

  const handleSwitchToForgotPassword = () => {
    setCurrentView("forgot-password");
  };

  const handleShowTerms = () => setShowTerms(true);
  const handleCloseTerms = () => setShowTerms(false);
  const handleAcceptTerms = () => {
    setShowTerms(false);
  };

  const handleOpenVerifyModal = (type, value) => {
    setVerifyType(type);
    setVerifyTarget(value);
    setGeneratedCode("123456");
    setShowVerifyModal(true);
  };

  const handleCloseVerifyModal = () => {
    setShowVerifyModal(false);
  };

  const handleVerifyCode = (code) => {
    if (code === generatedCode) {
      if (verifyType === "email") setEmailVerified(true);
      if (verifyType === "phone") setPhoneVerified(true);
      setShowVerifyModal(false);
      return true;
    }
    return false;
  };

  const handleRegisterSuccess = (data) => {
    setRegisteredData(data);
    setShowVerification(true);
  };

  const handleBackToLogin = () => {
    setShowVerification(false);
    setCurrentView("login");
    setEmailVerified(false);
    setPhoneVerified(false);
  };

  const resetVerification = () => {
    setEmailVerified(false);
    setPhoneVerified(false);
  };

  if (showVerification) {
    return (
      <VerificationForm
        registeredData={registeredData}
        onBackToLogin={handleBackToLogin}
      />
    );
  }

  return (
    <div className="auth-section" id="authSection">
      <video autoPlay muted loop id="bg-video">
        <source src="website.mp4" type="video/mp4" />
      </video>
      <div className="video-overlay"></div>

      <div className="logo">
        <img src={Logo} alt="STRUVO" className="logo-icon" />
        <h1>STUVO5</h1>
      </div>

      <div className="login-box">
        {/* Login Form */}
        <div
          className="objects"
          style={{ display: currentView === "login" ? "block" : "none" }}
        >
          <LoginForm
            onSwitchToRegister={handleSwitchToRegister}
            onForgotPassword={handleSwitchToForgotPassword} // Pass this prop
          />
        </div>

        {/* Register Form */}
        <div
          className="objects-register"
          style={{ display: currentView === "register" ? "block" : "none" }}
        >
          <RegisterForm
            onSwitchToLogin={handleSwitchToLogin}
            onShowTerms={handleShowTerms}
            onOpenVerifyModal={handleOpenVerifyModal}
            emailVerified={emailVerified}
            phoneVerified={phoneVerified}
            resetVerification={resetVerification}
            onRegisterSuccess={handleRegisterSuccess}
          />
        </div>

        {/* Forgot Password Form */}
        <div
          className="objects-forgot"
          style={{
            display: currentView === "forgot-password" ? "block" : "none",
          }}
        >
          <ForgotPasswordForm
            key={Date.now()}
            onBackToLogin={handleSwitchToLogin}
          />
        </div>
      </div>

      <TermsModal
        show={showTerms}
        onClose={handleCloseTerms}
        onAccept={handleAcceptTerms}
      />

      <VerificationModal
        show={showVerifyModal}
        onClose={handleCloseVerifyModal}
        onVerify={handleVerifyCode}
        type={verifyType}
        target={verifyTarget}
      />
    </div>
  );
};

export default AuthContainer;