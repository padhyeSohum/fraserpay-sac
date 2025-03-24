
import { User, UserRole } from '@/types';
import { Session } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (studentNumber: string, password: string) => Promise<void>;
  register: (studentNumber: string, name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  verifySACPin: (pin: string) => Promise<boolean>;
  verifyBoothPin: (pin: string) => Promise<{ success: boolean, boothId?: string }>;
  joinBooth: (boothId: string) => void;
  session: Session | null;
  updateUserData: (userData: User) => void;
}

// Mock SAC PIN - in a real app, this would be in a secure backend
export const SAC_PIN = '123456';
