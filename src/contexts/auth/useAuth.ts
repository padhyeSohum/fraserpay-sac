
import { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import { AuthContextType } from './types';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    console.error('Auth context is undefined, Provider may be missing');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
