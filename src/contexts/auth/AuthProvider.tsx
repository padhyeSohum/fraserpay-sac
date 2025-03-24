import React, { createContext, useState, useEffect } from 'react';
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log('Auth state:', { isLoading, session: session?.user?.id || null, user: user?.id || null, authInitialized });
  }, [isLoading, session, user, authInitialized]);

  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        
        if (!mounted) return;
        
        if (currentSession) {
          setSession(currentSession);
          
          try {
            const userData = await fetchUserData(currentSession.user.id);
            
            if (mounted) {
              setUser(userData);
              setIsLoading(false);
              setAuthInitialized(true);
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

    const checkSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (initialSession?.user) {
          setSession(initialSession);
          const userData = await fetchUserData(initialSession.user.id);
          if (mounted) {
            setUser(userData);
          }
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

    authTimeout = setTimeout(() => {
      if (mounted && !authInitialized) {
        console.warn('Auth initialization timeout reached. Force completing auth loading.');
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
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
        setUser(prev => {
          if (!prev) return null;
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
