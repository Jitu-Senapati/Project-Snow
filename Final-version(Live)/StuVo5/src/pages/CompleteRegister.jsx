import React from "react";
import "../styles/auth.css";
import VerificationForm from "../components/auth/VerificationForm";

function CompleteRegister() {
  const registeredData = {}; // later you can pass email/phone

  const handleBackToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <VerificationForm
      registeredData={registeredData}
      onBackToLogin={handleBackToLogin}
    />
  );
}

export default CompleteRegister;
