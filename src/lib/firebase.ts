
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzm2wJwHuDfjvz0a3gBx5oXFiwFzGmne8",
  authDomain: "cirpman-homes.firebaseapp.com",
  projectId: "cirpman-homes",
  storageBucket: "cirpman-homes.firebasestorage.app",
  messagingSenderId: "940551375902",
  appId: "1:940551375902:web:3f6ba3fda976c64c8d320f",
  measurementId: "G-CYL0Y74FJ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
