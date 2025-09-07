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
  loginWithGoogle as loginWithGoogleOperation,
  registerUser, 
  logoutUser, 
  verifySACAccess, 
  verifyBoothAccess 
} from './authOperations';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

//   useEffect(() => {
//     console.log('Auth state:', { 
//       isLoading, 
//       authUser: authUser?.uid || null, 
//       user: user?.id || null, 
//       authInitialized,
//       isGoogleUser: authUser?.providerData?.[0]?.providerId === 'google.com'
//     });
//   }, [isLoading, authUser, user, authInitialized]);

  useEffect(() => {
    let mounted = true;
    let authTimeout: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    //   console.log("Auth state changed:", firebaseUser?.uid);
      if (!mounted) return;
      
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        
        try {
          const userData = await fetchUserData(user!.id);
          
          if (mounted) {
            if (userData) {
            //   console.log("User data fetched successfully:", userData.id);
              setUser(userData);
            } else {
              console.warn("No user data found for authenticated user:", firebaseUser.uid);
            }
            
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
        
        if (location.pathname !== '/login' && location.pathname !== '/register') {
          console.log("User signed out, redirecting to login");
          navigate('/login');
        }
      }
    });

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
      unsubscribe();
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

  const loginWithGoogleProvider = async (): Promise<User | null> => {
    setIsLoading(true);
    try {
      const userData = await loginWithGoogleOperation();
      console.log("loginWithGoogle completed, user data:", userData?.id);
      
      if (userData && !user) {
        console.log("Setting user data from Google login");
        setUser(userData);
      }
      
      return userData;
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
        loginWithGoogle: loginWithGoogleProvider,
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
