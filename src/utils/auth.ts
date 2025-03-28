
import { toast } from 'sonner';
import { auth, clearFirebaseAuth } from '@/integrations/firebase/client';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Utility to force reset authentication state - useful when stuck
export const resetAuthState = async () => {
  try {
    console.log("Resetting authentication state...");
    await clearFirebaseAuth();
    
    // Force page reload to clear any in-memory state
    window.location.href = '/login';
    
    return true;
  } catch (error) {
    console.error("Error resetting auth state:", error);
    toast.error("Failed to reset authentication. Please try again.");
    return false;
  }
};

// Check if Firebase auth session exists (for debugging)
export const checkSessionExists = async () => {
  try {
    const currentUser = auth.currentUser;
    console.log("Current session:", currentUser ? "Exists" : "None");
    return !!currentUser;
  } catch (error) {
    console.error("Error checking session:", error);
    return false;
  }
};

// Add a function to manually sign in (useful for troubleshooting)
export const manualSignIn = async (email: string, password: string) => {
  try {
    // First clear any existing auth state
    await clearFirebaseAuth();
    
    // Then attempt to sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    console.log("Manual sign in successful:", userCredential.user);
    return true;
  } catch (error) {
    console.error("Manual sign in failed:", error);
    return false;
  }
};
