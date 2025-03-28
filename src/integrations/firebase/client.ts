
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase configuration - replace with your own config 
const firebaseConfig = {
  apiKey: "AIzaSyBYp-nGW6VZ5thQQeIU01YJ5-WqefvXU9c",
  authDomain: "fraser-pay-demo.firebaseapp.com",
  projectId: "fraser-pay-demo",
  storageBucket: "fraser-pay-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:1234567890abcdef"
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
