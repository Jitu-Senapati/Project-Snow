import { createRecaptchaVerifier, loginWithPhone, loginWithEmail, loginWithGoogle, signOutUser } from "../../firebase/auth";
import { GoogleAuthProvider, browserLocalPersistence, browserSessionPersistence, setPersistence } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import "../../styles/auth.css";
import logo from "../../assets/logo192px.png";
import { useAuth } from "../../context/AuthContext";
import { useProgress } from "../../context/ProgressContext";

const Login = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { startProgress, updateProgress, completeProgress } = useProgress();
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [googleLoginInProgress, setGoogleLoginInProgress] = useState(false);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const redirectByRole = async (user) => {
    updateProgress(80);
    const snap = await getDoc(doc(db, "users", user.uid));
    const admin = snap.exists() && snap.data()?.admin === true;
    completeProgress();
    navigate(admin ? "/admin-explore" : "/explore", { replace: true });
  };

  const handleSendOtp = async (phone) => {
    setSendingOtp(true);
    startProgress(20);
    try {
      const verifier = createRecaptchaVerifier("recaptcha-container");
      updateProgress(50);
      const result = await loginWithPhone("+91" + phone, verifier);
      setConfirmationResult(result);
      completeProgress();
      return true;
    } catch (err) {
      completeProgress();
      alert(err.message);
      return false;
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (otp, rememberMe = false) => {
    startProgress(20);
    try {
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      updateProgress(50);
      const result = await confirmationResult.confirm(otp);
      await redirectByRole(result.user);
      return true;
    } catch (err) {
      completeProgress();
      return false;
    }
  };

  const handleLogin = async (email, password, rememberMe) => {
    startProgress(20);
    try {
      updateProgress(50);
      const user = await loginWithEmail(email, password, rememberMe);
      await redirectByRole(user);
    } catch (err) {
      completeProgress();
      alert(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoginInProgress(true);
    startProgress(10);
    try {
      const result = await loginWithGoogle();
      updateProgress(40);
      const user = result.user;
      const email = user.email;

      if (!email) {
        await signOutUser();
        completeProgress();
        alert("Could not retrieve email from Google. Please try again.");
        return;
      }

      const providers = user.providerData.map(p => p.providerId);

      if (providers.includes("password")) {
        await redirectByRole(user);
        return;
      }

      updateProgress(60);
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(q);

      updateProgress(80);
      if (!snapshot.empty) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.idToken) sessionStorage.setItem('googleIdToken', credential.idToken);
        if (credential?.accessToken) sessionStorage.setItem('googleAccessToken', credential.accessToken);
        sessionStorage.setItem('linkEmail', email);
        await result.user.delete();
        completeProgress();
        navigate("/link-account", { state: { email } });
      } else {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.idToken) sessionStorage.setItem('googleIdToken', credential.idToken);
        if (credential?.accessToken) sessionStorage.setItem('googleAccessToken', credential.accessToken);
        await result.user.delete();
        completeProgress();
        navigate("/register", { state: { email, displayName: user.displayName, photoURL: user.photoURL } });
      }
    } catch (err) {
      console.error("FULL ERROR:", err.code, err.message);
      completeProgress();
      alert(err.message);
    } finally {
      setGoogleLoginInProgress(false);
    }
  };

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
        <LoginForm
          onSwitchToRegister={() => navigate("/register")}
          onForgotPassword={() => navigate("/forgot-password")}
          onLogin={handleLogin}
          onSendOtp={handleSendOtp}
          onVerifyOtp={handleVerifyOtp}
          onGoogleLogin={handleGoogleLogin}
          sendingOtp={sendingOtp}
        />
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;