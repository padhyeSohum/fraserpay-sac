import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (studentNumber: string, password: string) => Promise<void>;
  register: (studentNumber: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifySACPin: (pin: string) => Promise<boolean>;
  verifyBoothPin: (pin: string) => Promise<boolean>;
  joinBooth: (boothId: string) => void;
  session: Session | null;
}

// Mock SAC PIN for demo purposes
const SAC_PIN = '123456';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        setSession(currentSession);
        
        if (currentSession?.user) {
          // Fetch user data from users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentSession.user.id)
            .single();
          
          if (userError) {
            console.error('Error fetching user data:', userError);
            setUser(null);
          } else if (userData) {
            // Transform to match our User type
            const appUser: User = {
              id: userData.id,
              studentNumber: userData.student_number,
              name: userData.name,
              email: userData.email,
              role: userData.role as UserRole,
              balance: userData.tickets / 100, // Convert from cents to dollars
              favoriteProducts: [],
              booths: userData.booth_access || []
            };
            
            setUser(appUser);
            
            // Route based on user role only for sign-in events
            if (event === 'SIGNED_IN') {
              if (appUser.role === 'sac') {
                navigate('/sac/dashboard');
              } else if (appUser.role === 'booth') {
                // If the user is a booth manager, direct them to booth dashboard
                if (appUser.booths && appUser.booths.length > 0) {
                  navigate(`/booth/${appUser.booths[0]}`);
                } else {
                  navigate('/dashboard');
                }
              } else {
                // Regular students
                navigate('/dashboard');
              }
            }
          }
        } else {
          setUser(null);
          if (event === 'SIGNED_OUT') {
            navigate('/login');
          }
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      
      if (initialSession?.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', initialSession.user.id)
          .single();
        
        if (userError) {
          console.error('Error fetching user data:', userError);
          setUser(null);
        } else if (userData) {
          const appUser: User = {
            id: userData.id,
            studentNumber: userData.student_number,
            name: userData.name,
            email: userData.email,
            role: userData.role as UserRole,
            balance: userData.tickets / 100, // Convert from cents to dollars
            favoriteProducts: [],
            booths: userData.booth_access || []
          };
          
          setUser(appUser);
        }
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (studentNumber: string, password: string) => {
    setIsLoading(true);
    
    try {
      // First, find the user by student number
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('student_number', studentNumber)
        .single();
      
      if (userError || !userData) {
        throw new Error('Student number not found');
      }
      
      // Now sign in with email and password
      const { error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Login successful');
      // Navigation is handled in the auth state change listener
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (studentNumber: string, name: string, email: string, password: string) => {
    setIsLoading(true);
    
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
      
      // Register user with Supabase Auth without email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            student_number: studentNumber,
            name
          },
          emailRedirectTo: window.location.origin,
          // Remove the emailConfirmationUrl property since it's not valid
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
      
      toast.success('Registration successful');
      // Auto-sign in the user after registration
      if (!authData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (signInError) {
          throw signInError;
        }
      }
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
      toast.error('Logout failed');
    } else {
      setUser(null);
      setSession(null);
      toast.info('Logged out');
      navigate('/login');
    }
  };

  const verifySACPin = async (pin: string) => {
    if (pin === SAC_PIN && user) {
      try {
        // Update user role to SAC in database
        const { error } = await supabase
          .from('users')
          .update({ role: 'sac' })
          .eq('id', user.id);
        
        if (error) {
          throw error;
        }
        
        // Update local user state
        setUser(prev => prev ? { ...prev, role: 'sac' } : null);
        
        toast.success('SAC access granted');
        navigate('/sac/dashboard');
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

  const verifyBoothPin = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Find booth with matching PIN
      const { data: boothData, error: boothError } = await supabase
        .from('booths')
        .select('*')
        .eq('pin', pin)
        .single();
      
      if (boothError || !boothData) {
        throw new Error('Invalid booth PIN');
      }
      
      // Check if user already has access
      const hasAccess = user.booths?.includes(boothData.id);
      
      if (hasAccess) {
        toast.info(`You already have access to ${boothData.name}`);
        return true;
      }
      
      // Add booth to user's booth access
      const updatedBoothAccess = [...(user.booths || []), boothData.id];
      
      // Update user's booth access in database
      const { error: updateError } = await supabase
        .from('users')
        .update({ booth_access: updatedBoothAccess })
        .eq('id', user.id);
      
      if (updateError) {
        throw updateError;
      }
      
      // Add user to booth members
      const updatedMembers = [...(boothData.members || []), user.id];
      
      const { error: boothUpdateError } = await supabase
        .from('booths')
        .update({ members: updatedMembers })
        .eq('id', boothData.id);
      
      if (boothUpdateError) {
        console.error('Error updating booth members:', boothUpdateError);
      }
      
      // Update local user state
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          booths: updatedBoothAccess
        };
      });
      
      toast.success(`You now have access to ${boothData.name}`);
      return true;
      
    } catch (error) {
      console.error('Error verifying booth PIN:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify booth PIN');
      return false;
    }
  };

  const joinBooth = (boothId: string) => {
    if (user) {
      navigate(`/booth/${boothId}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        verifySACPin,
        verifyBoothPin,
        joinBooth,
        session
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
