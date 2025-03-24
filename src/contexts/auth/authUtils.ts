
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, UserRole } from '@/types';

// Transform user data from Supabase to our app's User type
export const transformUserData = (userData: any): User => {
  return {
    id: userData.id,
    studentNumber: userData.student_number,
    name: userData.name, 
    email: userData.email,
    role: userData.role as UserRole,
    balance: userData.tickets / 100, // Convert from cents to dollars
    favoriteProducts: [],
    booths: userData.booth_access || []
  };
};

// Fetch user data from Supabase
export const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    console.log(`Fetching user data for ID: ${userId}`);
    
    // First try to get the user by ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no data is found
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }
    
    if (!userData) {
      console.error('No user data found for ID:', userId);
      
      // Try to get user info from auth
      const { data: authUser } = await supabase.auth.getUser(userId);
      if (authUser?.user) {
        console.log('User exists in auth but not in users table:', authUser.user);
        
        // Try to create user profile if it doesn't exist
        const metaData = authUser.user.user_metadata || {};
        const studentNumber = metaData.student_number || '';
        const name = metaData.name || authUser.user.email?.split('@')[0] || 'User';
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            student_number: studentNumber,
            name: name,
            email: authUser.user.email || '',
            role: 'student',
            tickets: 0,
            qr_code: `USER:${userId}`
          })
          .select()
          .single();
        
        if (createError) {
          console.error('Failed to create user profile:', createError);
          return null;
        }
        
        console.log('Created new user profile:', newUser);
        return transformUserData(newUser);
      }
      
      return null;
    }
    
    console.log('User data fetched successfully:', userData.name);
    return transformUserData(userData);
  } catch (error) {
    console.error('Unexpected error fetching user data:', error);
    return null;
  }
};

// Validate student number format
export const isValidStudentNumber = (studentNumber: string): boolean => {
  // Simple validation - can be enhanced based on school requirements
  return /^\d{6,12}$/.test(studentNumber.trim());
};

// Check if user exists by student number
export const checkUserExists = async (studentNumber: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('student_number', studentNumber.trim())
      .maybeSingle(); // Use maybeSingle instead of single
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking if user exists:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Unexpected error checking if user exists:', error);
    return false;
  }
};
