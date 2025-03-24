
import React, { createContext, useState, useEffect, useCallback } from 'react';
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

// Create the context with undefined initial value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Log auth state for debugging
  useEffect(() => {
    console.log('Auth state:', { 
      isLoading, 
      session: session?.user?.id || null, 
      user: user?.id || null, 
      authInitialized,
      currentPath: location.pathname 
    });
  }, [isLoading, session, user, authInitialized, location.pathname]);

  // Reset auth error when location changes
  useEffect(() => {
    if (authError) {
      setAuthError(null);
    }
  }, [location.pathname, authError]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        
        if (!mounted) return;
        
        if (currentSession) {
          setSession(currentSession);
          
          try {
            const userData = await fetchUserData(currentSession.user.id);
            
            if (mounted) {
              if (userData) {
                console.log("User data fetched successfully:", userData.name);
                setUser(userData);
              } else {
                console.error("Failed to fetch user data after auth change");
                setAuthError("Failed to fetch user profile");
              }
              
              setIsLoading(false);
              setAuthInitialized(true);
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
            if (mounted) {
              setAuthError(error instanceof Error ? error.message : "Authentication error");
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
            // Only navigate if we're not already on login or register
            if (location.pathname !== '/login' && location.pathname !== '/register') {
              navigate('/login');
            }
          }
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      try {
        console.log("Checking for existing session...");
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          if (mounted) {
            setAuthError(error.message);
          }
        }
        
        if (!mounted) return;
        
        if (initialSession?.user) {
          console.log("Found existing session, fetching user data");
          setSession(initialSession);
          
          try {
            const userData = await fetchUserData(initialSession.user.id);
            if (mounted) {
              if (userData) {
                console.log("User data fetched for existing session:", userData.name);
                setUser(userData);
              } else {
                console.error("Failed to fetch user data for existing session");
                setAuthError("Failed to fetch user profile");
              }
            }
          } catch (error) {
            console.error("Error fetching user data for existing session:", error);
            if (mounted) {
              setAuthError(error instanceof Error ? error.message : "Error fetching user data");
            }
          }
        } else {
          console.log("No existing session found");
        }
      } catch (error) {
        console.error('Error checking session:', error);
        if (mounted) {
          setAuthError(error instanceof Error ? error.message : "Session check error");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
    checkSession();

    // Add timeout to ensure auth always initializes
    authTimeout = setTimeout(() => {
      if (mounted && !authInitialized) {
        console.warn('Auth initialization timeout reached. Force completing auth loading.');
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 5000); // 5 second timeout

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  // Login function
  const login = async (studentNumber: string, password: string) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      console.log("Attempting login with student number:", studentNumber);
      const loggedInUser = await loginUser(studentNumber, password);
      
      if (!loggedInUser) {
        throw new Error("Login failed. Please check your credentials.");
      }
      
      setUser(loggedInUser);
      // Navigation is handled in the auth state change listener
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error instanceof Error ? error.message : "Login failed");
      return false;
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
        // Update local user state
        setUser(prev => prev ? { ...prev, role: 'sac' } : null);
        navigate('/sac/dashboard');
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyBoothPin = async (pin: string): Promise<boolean> => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      const { success, boothId } = await verifyBoothAccess(pin, user.id, user.booths);
      
      if (success && boothId) {
        // Update local user state
        setUser(prev => {
          if (!prev) return null;
          const updatedBooths = prev.booths?.includes(boothId) 
            ? prev.booths 
            : [...(prev.booths || []), boothId];
          
          return {
            ...prev,
            booths: updatedBooths
          };
        });
      }
      
      return success;
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

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register: registerUser,
        logout: logoutUser,
        verifySACPin,
        verifyBoothPin,
        joinBooth,
        session,
        updateUserData,
        authError,
        clearAuthError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
