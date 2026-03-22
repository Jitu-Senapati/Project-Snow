import { createRecaptchaVerifier, loginWithPhone, loginWithEmail, loginWithGoogle, signOutUser } from "../../firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import "../../styles/auth.css";
import logo from "../../assets/logo192px.png";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
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
    const snap = await getDoc(doc(db, "users", user.uid));
    const admin = snap.exists() && snap.data()?.admin === true;
    navigate(admin ? "/admin-explore" : "/explore", { replace: true });
  };

  const handleSendOtp = async (phone, rememberMe) => {
    setSendingOtp(true);
    try {
      const verifier = createRecaptchaVerifier("recaptcha-container");
      const result = await loginWithPhone("+91" + phone, verifier, rememberMe);
      setConfirmationResult(result);
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
      const result = await confirmationResult.confirm(otp);
      await redirectByRole(result.user);
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleLogin = async (email, password, rememberMe) => {
    try {
      const user = await loginWithEmail(email, password, rememberMe);
      await redirectByRole(user);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoginInProgress(true);
    try {
      const result = await loginWithGoogle();
      const user = result.user;
      const email = user.email;

      if (!email) {
        await signOutUser();
        alert("Could not retrieve email from Google. Please try again.");
        return;
      }

      const providers = user.providerData.map(p => p.providerId);

      if (providers.includes("password")) {
        await redirectByRole(user);
        return;
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.idToken) sessionStorage.setItem('googleIdToken', credential.idToken);
        if (credential?.accessToken) sessionStorage.setItem('googleAccessToken', credential.accessToken);
        sessionStorage.setItem('linkEmail', email);
        await result.user.delete();
        navigate("/link-account", { state: { email } });
      } else {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.idToken) sessionStorage.setItem('googleIdToken', credential.idToken);
        if (credential?.accessToken) sessionStorage.setItem('googleAccessToken', credential.accessToken);
        await result.user.delete();
        navigate("/register", { state: { email, displayName: user.displayName, photoURL: user.photoURL } });
      }
    } catch (err) {
      console.error("FULL ERROR:", err.code, err.message);
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
          onGoogleLogin={handleGoogleLogin}
          sendingOtp={sendingOtp}
        />
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Login;