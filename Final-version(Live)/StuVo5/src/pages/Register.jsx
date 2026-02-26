import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";
import VerificationForm from "../components/auth/VerificationForm";
import TermsModal from "../components/auth/TermsModal";
import VerificationModal from "../components/auth/VerificationModal";
import "../styles/auth.css";
import logo from "../assets/logo192px.png";

const Register = () => {
  const navigate = useNavigate();

  const [showVerification, setShowVerification] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [registeredData, setRegisteredData] = useState({});

  const handleSwitchToLogin = () => {
    navigate("/login");
  };

  const handleShowTerms = () => setShowTerms(true);
  const handleCloseTerms = () => setShowTerms(false);
  const handleAcceptTerms = () => setShowTerms(false);

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
    navigate("/login");
  };

  const resetVerification = () => {
    setEmailVerified(false);
    setPhoneVerified(false);
  };

  // Show verification page if registration is complete
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
        <img src={logo} alt="STUVO" className="logo-icon" />
        <h1>STUVO5</h1>
      </div>

      <div className="login-box">
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

export default Register;
