
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return null;
    }
    
    if (userData) {
      return transformUserData(userData);
    }
    
    return null;
  } catch (error) {
    console.error('Unexpected error fetching user data:', error);
    return null;
  }
};
