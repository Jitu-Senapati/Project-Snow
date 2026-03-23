import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  linkWithCredential,
  PhoneAuthProvider,
  RecaptchaVerifier,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "./config";

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
      admin: false,  // ← add this line
      createdAt: serverTimestamp(),
    });

    return user;
  } catch (error) {
    throw error;
  }
};

export const loginWithEmail = async (email, password, rememberMe = false) => {
  const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
  await setPersistence(auth, persistence);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

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

export const loginWithPhone = async (phoneNumber, recaptchaVerifier, rememberMe = false) => {
  const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
  await setPersistence(auth, persistence);
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

export const sendPhoneOtp = (phoneNumber, recaptchaVerifier) =>
  signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);

export const linkPhoneToEmailAccount = async (confirmationResult, otp) => {
  const phoneCredential = PhoneAuthProvider.credential(
    confirmationResult.verificationId,
    otp
  );
  await linkWithCredential(auth.currentUser, phoneCredential);
};

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);

  // Get email from providerData if not on main user object
  if (!result.user.email && result.user.providerData.length > 0) {
    result.user.email = result.user.providerData[0].email;
  }

  return result;
};

export const checkEmailExists = async (email) => {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  return methods;
};

export const linkGoogleToExistingAccount = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  await linkWithCredential(auth.currentUser, credential);
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const linkEmailPasswordToPhoneAccount = async (email, password, username, phone, fullName, role, studentData, facultyData, photoURL = "") => {
  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(auth.currentUser, credential);
  const user = result.user;

  const userData = {
    uid: user.uid,
    username,
    email,
    phone,
    fullName,
    role,
    photoURL,
    admin: false,  // ← add this line
    createdAt: serverTimestamp(),
  };

  if (role === "student") {
    userData.roll = studentData.roll || "";
    userData.branch = studentData.branch;
    userData.year = studentData.year;
  } else {
    userData.department = facultyData.department;
    userData.subject = facultyData.subject || "";
    userData.workingSince = facultyData.workingSince;
  }

console.log("Writing to Firestore:", userData);
await setDoc(doc(db, "users", user.uid), userData);

  await setDoc(doc(db, "users", user.uid), userData);
  return user;
};

export const linkGoogleCredentialToEmailAccount = async (email, password) => {
  const idToken = sessionStorage.getItem('googleIdToken');
  const accessToken = sessionStorage.getItem('googleAccessToken');

  if (!idToken && !accessToken) {
    throw new Error("Google session expired. Please try again.");
  }

  await setPersistence(auth, browserLocalPersistence);
  await signInWithEmailAndPassword(auth, email, password);

  const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
  await linkWithCredential(auth.currentUser, googleCredential);

  sessionStorage.removeItem('googleIdToken');
  sessionStorage.removeItem('googleAccessToken');
  sessionStorage.removeItem('linkEmail');
};

export const linkGoogleAfterRegistration = async () => {
  const idToken = sessionStorage.getItem('googleIdToken');
  const accessToken = sessionStorage.getItem('googleAccessToken');

  if (!idToken && !accessToken) return; // No Google credential — normal registration, skip

  const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
  await linkWithCredential(auth.currentUser, googleCredential);

  sessionStorage.removeItem('googleIdToken');
  sessionStorage.removeItem('googleAccessToken');
};

export const uploadProfilePhoto = async (uid, file) => {
  const storageRef = ref(storage, `profilePhotos/${uid}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
};

// --------------------------------------------------------------------------------------------------------------------
// 
// profile 


export const updateUserProfile = async (uid, data) => {
  await updateDoc(doc(db, "users", uid), data);
};

export const uploadCoverPhoto = async (uid, file) => {
  const storageRef = ref(storage, `coverPhotos/${uid}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};