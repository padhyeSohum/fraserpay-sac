
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/types';
import { fetchUserData } from './authUtils';
import { SAC_PIN } from './types';

// Login functionality
export const loginUser = async (studentNumber: string, password: string): Promise<User | null> => {
  try {
    console.log('Attempting login with student number:', studentNumber);
    
    // First, find the user by student number
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, student_number')
      .eq('student_number', studentNumber)
      .single();
    
    if (userError) {
      console.error('Student number lookup error:', userError);
      // Log more detailed error information to help troubleshoot
      if (userError.code === 'PGRST116') {
        console.error('No user found with student number:', studentNumber);
        throw new Error('Student number not found. Please check your credentials.');
      } else {
        console.error('Database error when looking up student number:', userError.message);
        throw new Error('Error looking up student number');
      }
    }
    
    if (!userData) {
      console.error('No user data returned for student number:', studentNumber);
      throw new Error('Student number not found. Please check your credentials.');
    }
    
    console.log('Found user with student number, proceeding with auth', userData);
    
    // Now sign in with email and password
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: password
    });
    
    if (error) {
      console.error('Auth error:', error);
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Incorrect password. Please try again.');
      }
      throw error;
    }
    
    console.log('Login successful, user authenticated');
    toast.success('Login successful');
    
    // Get session to retrieve user ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user.id) {
      console.error('Failed to retrieve user session');
      throw new Error('Failed to retrieve user session');
    }
    
    // Fetch and return user data
    const userData2 = await fetchUserData(sessionData.session.user.id);
    if (!userData2) {
      console.error('Failed to fetch user data after successful login');
      throw new Error('Failed to load user profile');
    }
    
    return userData2;
    
  } catch (error) {
    console.error('Login error:', error);
    toast.error(error instanceof Error ? error.message : 'Login failed');
    return null;
  }
};

// Registration functionality
export const registerUser = async (
  studentNumber: string, 
  name: string, 
  email: string, 
  password: string
): Promise<boolean> => {
  try {
    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`student_number.eq.${studentNumber},email.eq.${email}`);
    
    if (checkError) {
      throw new Error('Error checking existing users');
    }
    
    if (existingUsers && existingUsers.length > 0) {
      throw new Error('Student number or email already registered');
    }
    
    // Register user with Supabase Auth with email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          student_number: studentNumber,
          name
        },
        emailRedirectTo: window.location.origin
      }
    });
    
    if (authError || !authData.user) {
      throw authError || new Error('Failed to create account');
    }
    
    // Create user profile in users table
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        email,
        student_number: studentNumber,
        role: 'student',
        tickets: 0,
        qr_code: `USER:${authData.user.id}`
      });
    
    if (profileError) {
      throw profileError;
    }
    
    toast.success('Registration successful! Please check your email to confirm your account.');
    return true;
    
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Registration failed');
    console.error(error);
    return false;
  }
};

// Logout functionality
export const logoutUser = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      toast.error('Logout failed');
      return false;
    }
    
    toast.info('Logged out');
    return true;
  } catch (error) {
    console.error('Unexpected error during logout:', error);
    return false;
  }
};

// SAC PIN verification functionality
export const verifySACAccess = async (pin: string, userId: string): Promise<boolean> => {
  if (pin === SAC_PIN) {
    try {
      // Update user role to SAC in database
      const { error } = await supabase
        .from('users')
        .update({ role: 'sac' })
        .eq('id', userId);
      
      if (error) {
        throw error;
      }
      
      toast.success('SAC access granted');
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to grant SAC access');
      return false;
    }
  }
  
  toast.error('Invalid PIN');
  return false;
};

// Booth PIN verification functionality
export const verifyBoothAccess = async (pin: string, userId: string, userBooths: string[] = []): Promise<{ success: boolean, boothId?: string }> => {
  try {
    console.log("Verifying booth PIN:", pin);
    
    // Find booth with matching PIN
    const { data: boothData, error: boothError } = await supabase
      .from('booths')
      .select('*')
      .eq('pin', pin)
      .single();
    
    if (boothError) {
      console.error("Booth PIN verification error:", boothError);
      throw new Error('Invalid booth PIN');
    }
    
    if (!boothData) {
      console.error("No booth found with that PIN");
      throw new Error('Invalid booth PIN');
    }
    
    console.log("Found booth:", boothData);
    
    // Check if user already has access
    const hasAccess = userBooths.includes(boothData.id);
    
    if (hasAccess) {
      console.log("User already has access to booth:", boothData.id);
      toast.info(`You already have access to ${boothData.name}`);
      return { success: true, boothId: boothData.id };
    }
    
    // Add booth to user's booth access
    const updatedBoothAccess = [...(userBooths || []), boothData.id];
    
    // Update user's booth access in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ booth_access: updatedBoothAccess })
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating user's booth access:", updateError);
      throw updateError;
    }
    
    // Add user to booth members
    const updatedMembers = [...(boothData.members || []), userId];
    
    const { error: boothUpdateError } = await supabase
      .from('booths')
      .update({ members: updatedMembers })
      .eq('id', boothData.id);
    
    if (boothUpdateError) {
      console.error('Error updating booth members:', boothUpdateError);
    }
    
    console.log("User successfully joined booth:", boothData.id);
    toast.success(`You now have access to ${boothData.name}`);
    return { success: true, boothId: boothData.id };
    
  } catch (error) {
    console.error('Error verifying booth PIN:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to verify booth PIN');
    return { success: false };
  }
};
