
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/types';
import { auth } from '@/integrations/firebase/client';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
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
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Log auth state for debugging
  useEffect(() => {
    console.log('Auth state:', { 
      isLoading, 
      authUser: authUser?.uid || null, 
      user: user?.id || null, 
      authInitialized 
    });
  }, [isLoading, authUser, user, authInitialized]);

  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout;
    
    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.uid);
      
      if (!mounted) return;
      
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        
        try {
          const userData = await fetchUserData(firebaseUser.uid);
          
          if (mounted) {
            setUser(userData);
            setIsLoading(false);
            setAuthInitialized(true);
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
          setAuthUser(null);
          setIsLoading(false);
          setAuthInitialized(true);
        }
        
        // Only navigate if we're not already on login or register
        if (location.pathname !== '/login' && location.pathname !== '/register') {
          console.log("User signed out, redirecting to login");
          navigate('/login');
        }
      }
    });

    // Add timeout to ensure auth always initializes
    authTimeout = setTimeout(() => {
      if (mounted && !authInitialized) {
        console.warn('Auth initialization timeout reached. Force completing auth loading.');
        setIsLoading(false);
        setAuthInitialized(true);
      }
    }, 3000); // 3 second timeout

    return () => {
      mounted = false;
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, [navigate, location.pathname]);

  const login = async (studentNumber: string, password: string) => {
    setIsLoading(true);
    try {
      const loggedInUser = await loginUser(studentNumber, password);
      // Navigation is handled in the auth state change listener
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (studentNumber: string, name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      return await registerUser(studentNumber, name, email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await logoutUser();
      if (success) {
        setUser(null);
        setAuthUser(null);
        navigate('/login');
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  };

  const verifySACPin = async (pin: string): Promise<boolean> => {
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

  const verifyBoothPin = async (pin: string): Promise<{ success: boolean, boothId?: string }> => {
    if (!user) return { success: false };
    
    setIsLoading(true);
    try {
      const result = await verifyBoothAccess(pin, user.id, user.booths);
      
      if (result.success && result.boothId) {
        // Update local user state
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
        session: authUser,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
