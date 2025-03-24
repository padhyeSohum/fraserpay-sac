
import React, { createContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AuthContextType } from './types';
import { fetchUserData } from './authUtils';
import { 
  loginUser, 
  registerUser, 
  logoutUser, 
  verifySACAccess, 
  verifyBoothAccess 
} from './authOperations';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Auth state:', { isLoading, session: session?.user?.id || null, user: user?.id || null, authInitialized });
  }, [isLoading, session, user, authInitialized]);

  useEffect(() => {
    let mounted = true;
    
    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        
        if (!mounted) return;
        
        if (currentSession) {
          // We have a session, update state and get user data
          setSession(currentSession);
          
          try {
            const userData = await fetchUserData(currentSession.user.id);
            
            if (mounted) {
              setUser(userData);
              setIsLoading(false);
              setAuthInitialized(true);
              
              // Log user details for debugging
              console.log("User data loaded:", {
                id: userData?.id,
                role: userData?.role,
                booths: userData?.booths?.length || 0
              });
            }
            
            if (event === 'SIGNED_IN' && mounted) {
              console.log("User signed in, navigating based on role:", userData?.role);
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
            if (mounted) {
              setIsLoading(false);
              setAuthInitialized(true);
            }
          }
        } else {
          // No session, clear user data
          if (mounted) {
            setUser(null);
            setSession(null);
            setIsLoading(false);
            setAuthInitialized(true);
          }
          
          if (event === 'SIGNED_OUT' && mounted) {
            console.log("User signed out, redirecting to login");
            if (location.pathname !== '/login' && location.pathname !== '/register') {
              navigate('/login');
            }
          }
        }
      }
    );

    // Initial session check
    const checkSession = async () => {
      try {
        console.log("Checking initial session");
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (initialSession?.user) {
          console.log("Found initial session for user:", initialSession.user.id);
          setSession(initialSession);
          const userData = await fetchUserData(initialSession.user.id);
          if (mounted) {
            setUser(userData);
            
            // Log user details for debugging
            console.log("Initial user data loaded:", {
              id: userData?.id,
              role: userData?.role,
              booths: userData?.booths?.length || 0
            });
          }
        } else {
          console.log("No initial session found");
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
    checkSession();

    // Safety timeout to ensure auth state is eventually resolved
    authTimeoutRef.current = setTimeout(() => {
      if (mounted && !authInitialized) {
        console.warn('Auth initialization timeout reached. Force completing auth loading.');
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 3000);

    return () => {
      mounted = false;
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const login = async (studentNumber: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginUser(studentNumber, password);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (studentNumber: string, name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      await registerUser(studentNumber, name, email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const success = await logoutUser();
      if (success) {
        setUser(null);
        setSession(null);
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifySACPin = async (pin: string) => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      const success = await verifySACAccess(pin, user.id);
      if (success) {
        setUser(prev => prev ? { ...prev, role: 'sac' } : null);
        navigate('/sac/dashboard');
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyBoothPin = async (pin: string): Promise<{ success: boolean, boothId?: string }> => {
    if (!user) return { success: false };
    
    setIsLoading(true);
    try {
      const result = await verifyBoothAccess(pin, user.id, user.booths);
      
      if (result.success && result.boothId) {
        // Update user state with new booth access
        setUser(prev => {
          if (!prev) return null;
          
          // Add boothId to booths array if not already present
          const updatedBooths = prev.booths?.includes(result.boothId!) 
            ? prev.booths 
            : [...(prev.booths || []), result.boothId!];
          
          return {
            ...prev,
            booths: updatedBooths
          };
        });
      }
      
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const joinBooth = (boothId: string) => {
    if (user) {
      navigate(`/booth/${boothId}`);
    }
  };

  const updateUserData = (userData: User) => {
    console.log("Updating user data:", {
      id: userData.id,
      role: userData.role,
      booths: userData.booths?.length || 0
    });
    setUser(userData);
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
        session,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
