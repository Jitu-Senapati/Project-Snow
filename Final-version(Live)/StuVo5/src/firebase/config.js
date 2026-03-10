import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDfnI5L2tiLT8tpOrKcbU30lxzS6iOl6fo",
    authDomain: "stuvo5.firebaseapp.com",
    projectId: "stuvo5",
    storageBucket: "stuvo5.firebasestorage.app",
    messagingSenderId: "663968338842",
    appId: "1:663968338842:web:69856b67638df1fca32023",
    measurementId: "G-M42KJQH2WC"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);