import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createRecaptchaVerifier, sendPhoneOtp } from "../../firebase/auth";
import RegisterForm from "../../components/auth/RegisterForm";
import TermsModal from "../../components/auth/TermsModal";
import VerificationModal from "../../components/auth/VerificationModal";
import VerificationForm from "../../components/auth/VerificationForm";
import "../../styles/auth.css";
import logo from "../../assets/logo192px.png";
import { useAuth } from "../../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [registrationInProgress, setRegistrationInProgress] = useState(false);

  useEffect(() => {
    if (currentUser && !registrationInProgress) {
      navigate("/explore", { replace: true });
    }
  }, [currentUser]);

  const googleEmail = location.state?.email || "";
  const googleDisplayName = location.state?.displayName || "";

  const [showTerms, setShowTerms] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState(null);
  const [verifyTarget, setVerifyTarget] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState(
    googleEmail ? { email: googleEmail, username: "", password: "", phone: "", termsChecked: false } : null
  );
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(
    googleDisplayName ? { fullName: googleDisplayName } : null
  );

  const [confirmationResult, setConfirmationResult] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleShowTerms = () => setShowTerms(true);
  const handleCloseTerms = () => setShowTerms(false);
  const handleAcceptTerms = () => {
    setShowTerms(false);
    setTermsAccepted(true);
  };

  const handleOpenVerifyModal = async (type, value) => {
    setVerifyType(type);
    setVerifyTarget(value);
    setOtpSent(true);
    setRegistrationInProgress(true);

    if (type === "phone") {
      setSendingOtp(true);
      try {
        const verifier = createRecaptchaVerifier("recaptcha-container");
        verifier.render().then(() => setSendingOtp(false));
        const result = await sendPhoneOtp("+91" + value, verifier);
        setConfirmationResult(result);
        setShowVerifyModal(true);
        setOtpSent(true);
        return true;
      } catch (err) {
        setSendingOtp(false);
        alert(err.message);
        return false;
      } finally {
        setSendingOtp(false);
      }
    }
  };

  const handleCloseVerifyModal = () => setShowVerifyModal(false);

  const handleVerifyCode = async (code) => {
    try {
      await confirmationResult.confirm(code);
      setPhoneVerified(true);
      setShowVerifyModal(false);
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleRegisterSuccess = (data) => {
    setFormData(data);
    setShowProfile(true);
  };

  const resetVerification = () => setPhoneVerified(false);

  if (showProfile) {
    return (
      <VerificationForm
        registeredData={formData}
        initialProfileData={profileData}
        onProfileChange={(data) => setProfileData(data)}
        onBackToLogin={() => setShowProfile(false)}
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
          initialData={formData}
          googleEmail={googleEmail}
          sendingOtp={sendingOtp}
          otpSent={otpSent}
          onPhoneChange={() => setOtpSent(false)}
          onSwitchToLogin={() => navigate("/login")}
          onShowTerms={handleShowTerms}
          onOpenVerifyModal={handleOpenVerifyModal}
          phoneVerified={phoneVerified}
          resetVerification={resetVerification}
          onRegisterSuccess={handleRegisterSuccess}
          termsAccepted={termsAccepted}
          onTermsAccepted={() => setTermsAccepted(false)}
        />
      </div>

      <TermsModal show={showTerms} onClose={handleCloseTerms} onAccept={handleAcceptTerms} />
      <VerificationModal
        show={showVerifyModal}
        onClose={handleCloseVerifyModal}
        onVerify={handleVerifyCode}
        type={verifyType}
        target={verifyTarget}
      />
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Register;