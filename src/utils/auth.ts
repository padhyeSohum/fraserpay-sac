
import { toast } from 'sonner';
import { supabase, clearSupabaseAuth } from '@/integrations/supabase/client';

// Utility to force reset authentication state - useful when stuck
export const resetAuthState = async () => {
  try {
    console.log("Resetting authentication state...");
    await clearSupabaseAuth();
    
    // Force page reload to clear any in-memory state
    window.location.href = '/login';
    
    return true;
  } catch (error) {
    console.error("Error resetting auth state:", error);
    toast.error("Failed to reset authentication. Please try again.");
    return false;
  }
};

// Check if Supabase session exists (for debugging)
export const checkSessionExists = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Error checking session:", error);
      return false;
    }
    console.log("Current session:", data.session ? "Exists" : "None");
    return !!data.session;
  } catch (error) {
    console.error("Error checking session:", error);
    return false;
  }
};

// Add a function to manually sign in (useful for troubleshooting)
export const manualSignIn = async (email: string, password: string) => {
  try {
    // First clear any existing auth state
    await clearSupabaseAuth();
    
    // Then attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    console.log("Manual sign in successful:", data);
    return true;
  } catch (error) {
    console.error("Manual sign in failed:", error);
    return false;
  }
};

// Debug function to find a user by student number
export const findUserByStudentNumber = async (studentNumber: string) => {
  try {
    console.log("Looking up user with student number:", studentNumber);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, student_number, email, name')
      .eq('student_number', studentNumber)
      .single();
    
    if (error) {
      console.error("Error finding student:", error);
      return null;
    }
    
    console.log("Found student:", data);
    return data;
  } catch (error) {
    console.error("Error in student lookup:", error);
    return null;
  }
};
