import { createRecaptchaVerifier, loginWithPhone, loginWithEmail, loginWithGoogle, signOutUser } from "../../firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
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
    if (currentUser && !googleLoginInProgress) {
      navigate("/explore", { replace: true });
    }
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

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
      await confirmationResult.confirm(otp);
      navigate("/explore");
      return true;
    } catch (err) {
      return false;
    }
  };

  const handleLogin = async (email, password, rememberMe) => {
    try {
      await loginWithEmail(email, password, rememberMe);
      navigate("/explore");
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
      console.log("email:", email);
      console.log("providerData:", user.providerData);

      if (!email) {
        await signOutUser();
        alert("Could not retrieve email from Google. Please try again.");
        return;
      }

      const providers = user.providerData.map(p => p.providerId);
      console.log("providers:", providers);

      if (providers.includes("password")) {
        console.log("→ navigate to /explore");
        navigate("/explore");
        return;
      }

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(q);
      console.log("Snapshot empty:", snapshot.empty);

      if (!snapshot.empty) {
        console.log("→ navigate to /link-account");
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.idToken) sessionStorage.setItem('googleIdToken', credential.idToken);
        if (credential?.accessToken) sessionStorage.setItem('googleAccessToken', credential.accessToken);
        sessionStorage.setItem('linkEmail', email);
        // Delete the auto-created Google account before navigating
        await result.user.delete();
        navigate("/link-account", { state: { email } });
      } else {
        console.log("→ navigate to /register");
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.idToken) sessionStorage.setItem('googleIdToken', credential.idToken);
        if (credential?.accessToken) sessionStorage.setItem('googleAccessToken', credential.accessToken);
        await result.user.delete(); // delete instead of signOut
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