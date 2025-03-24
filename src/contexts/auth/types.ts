
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';

// SAC PIN for quick development access
export const SAC_PIN = '2706';

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (studentNumber: string, password: string) => Promise<boolean>;
  register: (studentNumber: string, name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  verifySACPin: (pin: string) => Promise<boolean>;
  verifyBoothPin: (pin: string) => Promise<boolean>;
  joinBooth: (boothId: string) => void;
  session: Session | null;
  updateUserData: (userData: User) => void;
  authError: string | null;
  clearAuthError: () => void;
};
