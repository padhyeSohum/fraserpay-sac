
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration with your actual credentials
const firebaseConfig = {
  apiKey: "AIzaSyCfUi-2emJm69P27RxWsKgm9Cipm-XHi74",
  authDomain: "fraserpay-sac.firebaseapp.com",
  projectId: "fraserpay-sac",
  storageBucket: "fraserpay-sac.firebasestorage.app",
  messagingSenderId: "1076398745844",
  appId: "1:1076398745844:web:7aa0f09d05611d96a496a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// Enable local emulators for development
if (import.meta.env.DEV) {
  try {
    // Uncomment these lines to connect to local emulators
    // connectAuthEmulator(auth, "http://localhost:9099");
    // connectFirestoreEmulator(firestore, "localhost", 8080);
    console.log("Firebase emulators connected");
  } catch (error) {
    console.error("Error connecting to Firebase emulators:", error);
  }
}

// Function to clear Firebase auth state (useful for troubleshooting)
export const clearFirebaseAuth = async () => {
  try {
    await auth.signOut();
    localStorage.removeItem('firebase:authUser');
    console.log('Firebase auth cleared');
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};

export { auth, firestore };
