import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SAC_PIN } from './types';

/**
 * Logs in a user with student number and password
 */
export const loginUser = async (studentNumber: string, password: string) => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('student_number', studentNumber.trim())
      .single();
    
    if (userError) {
      console.error('Error finding user:', userError);
      toast.error('Student number not found');
      throw new Error('Student number not found');
    }
    
    const email = userData.email;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Error signing in:', error);
      toast.error(error.message);
      throw error;
    }
    
    toast.success('Successfully logged in');
    return data.user;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

/**
 * Registers a new user
 */
export const registerUser = async (studentNumber: string, name: string, email: string, password: string) => {
  try {
    // First check if user with this email or student number already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},student_number.eq.${studentNumber}`)
      .limit(1);
      
    if (checkError) {
      console.error('Error checking existing user:', checkError);
      toast.error('Failed to check existing user');
      throw checkError;
    }
    
    if (existingUsers && existingUsers.length > 0) {
      toast.error('A user with this email or student number already exists');
      throw new Error('User already exists');
    }
    
    // Register the user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          student_number: studentNumber,
          name,
        }
      }
    });
    
    if (error) {
      console.error('Error creating user:', error);
      toast.error(error.message);
      throw error;
    }
    
    // Create the user record in our custom users table
    if (data.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          name,
          student_number: studentNumber,
          tickets: 0,
          role: 'student',
          booth_access: []
        });
      
      if (insertError) {
        console.error('Error creating user record:', insertError);
        // Clean up auth user if we can't create the user record
        try {
          await supabase.auth.admin.deleteUser(data.user.id);
        } catch (deleteError) {
          console.error('Could not delete auth user after failed registration:', deleteError);
        }
        toast.error('Failed to create user account');
        throw insertError;
      }
    }
    
    toast.success('Account created successfully');
    
    return data.user;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

/**
 * Logs out a user
 */
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
      throw error;
    }
    
    toast.success('Successfully signed out');
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    return false;
  }
};

/**
 * Verifies SAC PIN for a user
 */
export const verifySACAccess = async (pin: string, userId: string): Promise<boolean> => {
  try {
    // First validate the PIN
    if (pin !== SAC_PIN) {
      toast.error('Invalid PIN');
      return false;
    }
    
    // Update the user role to SAC in the database
    const { error } = await supabase
      .from('users')
      .update({ role: 'sac' })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
      throw error;
    }
    
    toast.success('You now have SAC access');
    return true;
  } catch (error) {
    console.error('Error verifying SAC access:', error);
    return false;
  }
};

/**
 * Verifies Booth PIN for a user and adds booth access
 */
export const verifyBoothAccess = async (
  pin: string, 
  userId: string,
  currentBooths: string[] = []
): Promise<{ success: boolean; boothId?: string }> => {
  try {
    console.log('Verifying booth PIN:', pin, 'for user:', userId);
    
    // Find the booth with this PIN
    const { data: boothData, error: boothError } = await supabase
      .from('booths')
      .select('id, name')
      .eq('pin', pin)
      .single();
    
    if (boothError || !boothData) {
      console.error('Error finding booth:', boothError);
      toast.error('Invalid booth PIN');
      return { success: false };
    }
    
    console.log('Found booth:', boothData);
    
    // Check if user already has access to this booth
    if (currentBooths.includes(boothData.id)) {
      toast.info(`You already have access to ${boothData.name}`);
      return { success: true, boothId: boothData.id };
    }
    
    // Add this booth to the user's booth_access array
    const updatedBooths = [...currentBooths, boothData.id];
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ booth_access: updatedBooths })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating user booth access:', updateError);
      toast.error('Failed to add booth access');
      return { success: false };
    }
    
    // Add user to booth members if not already a member
    const { data: boothDetails, error: detailsError } = await supabase
      .from('booths')
      .select('members')
      .eq('id', boothData.id)
      .single();
    
    if (!detailsError && boothDetails) {
      const members = boothDetails.members || [];
      
      if (!members.includes(userId)) {
        const updatedMembers = [...members, userId];
        
        const { error: membersError } = await supabase
          .from('booths')
          .update({ members: updatedMembers })
          .eq('id', boothData.id);
        
        if (membersError) {
          console.error('Error updating booth members:', membersError);
          // We don't need to show this error to the user as they already have access
        }
      }
    }
    
    toast.success(`You now have access to ${boothData.name}`);
    return { success: true, boothId: boothData.id };
  } catch (error) {
    console.error('Error verifying booth access:', error);
    return { success: false };
  }
};

/**
 * Creates a new user with the given data
 */
export const createNewUser = async (userData: {
  id: string;
  email: string;
  name: string;
  student_number: string;
  tickets: number;
  role: string;
  booth_access: string[];
}): Promise<AuthUser | null> => {
  try {
    // Generate a QR code string using the user's ID
    const qrCodeString = userData.id;
    
    const { data, error } = await supabase.from('users').insert({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      student_number: userData.student_number,
      tickets: userData.tickets,
      role: userData.role,
      booth_access: userData.booth_access,
      qr_code: qrCodeString // Add the required qr_code field
    }).select().single();
    
    if (error) {
      console.error("Error creating user:", error);
      return null;
    }
    
    return data as AuthUser;
  } catch (error) {
    console.error("Exception in createNewUser:", error);
    return null;
  }
};
