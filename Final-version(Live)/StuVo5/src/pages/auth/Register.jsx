import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import RegisterForm from "../../components/auth/RegisterForm";
import TermsModal from "../../components/auth/TermsModal";
import VerificationModal from "../../components/auth/VerificationModal";
import VerificationForm from "../../components/auth/VerificationForm";
import "../../styles/auth.css";
import logo from "../../assets/logo192px.png";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { createRecaptchaVerifier, sendPhoneOtp, createIncompleteProfile } from "../../firebase/auth";
import { useProgress } from "../../context/ProgressContext";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  const { startProgress, updateProgress, completeProgress } = useProgress();
  const [registrationInProgress, setRegistrationInProgress] = useState(false);

  useEffect(() => {
    // Only redirect to /explore if user has a COMPLETE profile
    if (currentUser && !registrationInProgress && userProfile?.regComplete === true) {
      navigate("/explore", { replace: true });
    }
  }, [currentUser, userProfile]);

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

  const handleBackToLogin = async () => {
    try {
      if (phoneVerified && auth.currentUser) {
        await auth.currentUser.delete();
      }
    } catch (err) {
      // ignore
    }
    navigate("/login");
  };

 const handleOpenVerifyModal = async (type, value) => {
  setVerifyType(type);
  setVerifyTarget(value);
  setOtpSent(true);
  setRegistrationInProgress(true);

  if (type === "phone") {
    setSendingOtp(true);
    startProgress(20);
    try {
      const verifier = createRecaptchaVerifier("recaptcha-container");
      updateProgress(50);
      const result = await sendPhoneOtp("+91" + value, verifier);
      setConfirmationResult(result);
      setSendingOtp(false);
      completeProgress();
      setShowVerifyModal(true);
      return true;
    } catch (err) {
      setSendingOtp(false);
      completeProgress();
      alert(err.message);
      return false;
    }
  }
};

  const handleCloseVerifyModal = () => setShowVerifyModal(false);

const handleVerifyCode = async (code) => {
  startProgress(30);
  try {
    updateProgress(50);
    const result = await confirmationResult.confirm(code);
    updateProgress(70);
    // OTP is valid — user is now signed in
    try {
      await createIncompleteProfile(result.user.uid, verifyTarget);
    } catch (profileErr) {
      console.error("Profile creation failed (OTP was valid):", profileErr);
    }
    completeProgress();
    setPhoneVerified(true);
    setShowVerifyModal(false);
    return true;
  } catch (err) {
    console.error("OTP verification failed:", err);
    completeProgress();
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
        <img src={logo} alt="STUVO" className="auth-logo-icon" />
        <h1>STUVO5</h1>
      </div>

      <div className="login-box">
        <RegisterForm
          initialData={formData}
          googleEmail={googleEmail}
          sendingOtp={sendingOtp}
          otpSent={otpSent}
          onPhoneChange={() => setOtpSent(false)}
          onSwitchToLogin={handleBackToLogin}
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