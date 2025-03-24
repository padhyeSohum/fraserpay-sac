
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Return a dummy context if the real one isn't available yet
  // This prevents the app from crashing during initialization
  if (context === undefined) {
    console.warn('useAuth was called outside of AuthProvider or before provider initialized');
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => { throw new Error('Auth provider not initialized'); },
      register: async () => { throw new Error('Auth provider not initialized'); },
      logout: async () => { throw new Error('Auth provider not initialized'); },
      verifySACPin: async () => false,
      verifyBoothPin: async () => ({ success: false }),
      joinBooth: () => {},
      session: null,
      updateUserData: () => {}
    };
  }
  
  return context;
};
