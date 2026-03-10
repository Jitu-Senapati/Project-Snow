import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  linkWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./config";

export const registerUserWithEmailAndPassword = async (email, password, username, phone, fullName, roll, branch, year) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      username,
      email,
      phone,
      fullName,
      roll: roll || "",
      branch,
      year,
      createdAt: serverTimestamp(),
    });

    return user;
  } catch (error) {
    throw error;
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

import { sendPasswordResetEmail } from "firebase/auth";

export const sendPasswordReset = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const createRecaptchaVerifier = (elementId) => {
  if (!window.recaptchaVerifier) {
    const element = document.getElementById(elementId);
    if (element) element.innerHTML = "";
    window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
      size: "invisible",
    });
  } else {
    // Reuse existing verifier, just reset the widget
    window.recaptchaVerifier.render().then((widgetId) => {
      window.grecaptcha?.reset(widgetId);
    });
  }
  return window.recaptchaVerifier;
};

export const loginWithPhone = (phoneNumber, recaptchaVerifier) =>
  signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

export const sendPhoneOtp = (phoneNumber, recaptchaVerifier) =>
  signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

export const linkPhoneToEmailAccount = async (confirmationResult, otp) => {
  const phoneCredential = PhoneAuthProvider.credential(
    confirmationResult.verificationId,
    otp
  );
  await linkWithCredential(auth.currentUser, phoneCredential);
};