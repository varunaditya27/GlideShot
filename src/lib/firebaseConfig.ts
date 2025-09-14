import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBWNrH6PCTnWZ9IDQxvFqa1cmPcQzVowIc",
  authDomain: "glideshot-c4e65.firebaseapp.com",
  projectId: "glideshot-c4e65",
  storageBucket: "glideshot-c4e65.firebasestorage.app",
  messagingSenderId: "226438536482",
  appId: "1:226438536482:web:54160614f6be2d8ce6d97b",
  measurementId: "G-Q2XST9EH6T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : undefined;
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };