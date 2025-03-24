import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthUser } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  register: (email: string) => Promise<void>;
  logout: () => Promise<void>;
	verifySACPin: (pin: string) => Promise<boolean>;
	verifyBoothPin: (boothId: string, pin: string) => Promise<{ success: boolean; boothId?: string }>;
	joinBooth: (boothId: string) => Promise<void>;
  session: Session | null;
  updateUserData: (updates: Partial<AuthUser>) => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
	verifySACPin: async () => false,
	verifyBoothPin: async () => ({ success: false }),
	joinBooth: async () => {},
  session: null,
  updateUserData: async () => {}
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session) {
          setIsAuthenticated(true);
          await fetchUser(session.user.id);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Error loading session:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN') {
        setIsAuthenticated(true);
        if (session?.user?.id) {
          fetchUser(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
      }
    });
  }, []);

  const fetchUser = async (userId: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user:", error);
      } else {
        setUser(user as AuthUser);
      }
    } catch (error) {
      console.error("Exception fetching user:", error);
    }
  };

  const login = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert('Check your email for the login link!');
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
      if (error) throw error;
      alert('Check your email for the registration link!');
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsAuthenticated(false);
      setUser(null);
    } catch (error: any) {
      alert(error.error_description || error.message);
    } finally {
      setIsLoading(false);
    }
  };

	const verifySACPin = async (pin: string): Promise<boolean> => {
		try {
			// Fetch the user with matching SAC pin
			const { data, error } = await supabase
				.from('users')
				.select('id')
				.eq('sac_pin', pin)
				.single();
	
			if (error || !data) {
				console.error("Error verifying SAC pin:", error);
				return false;
			}
	
			// If we found a matching user, return true
			return true;
		} catch (error) {
			console.error("Exception in verifySACPin:", error);
			return false;
		}
	};

// Update the verifyBoothPin function to include boothId in the return type
const verifyBoothPin = async (boothId: string, pin: string): Promise<{ success: boolean; boothId?: string }> => {
  try {
    // Attempt to fetch the booth with matching id and pin
    const { data, error } = await supabase
      .from('booths')
      .select('id, name, pin')
      .eq('id', boothId)
      .eq('pin', pin)
      .single();
    
    if (error || !data) {
      console.error("Error verifying booth pin:", error);
      return { success: false };
    }
    
    // If we found a matching booth, return success true
    return { success: true, boothId: data.id };
  } catch (error) {
    console.error("Exception in verifyBoothPin:", error);
    return { success: false };
  }
};

	const joinBooth = async (boothId: string) => {
		try {
			if (!user) {
				console.warn("No user is currently logged in.");
				return;
			}
	
			// Check if the boothId is already in the user's booth_access array
			if (user.booth_access && user.booth_access.includes(boothId)) {
				console.log(`User already has access to booth ${boothId}.`);
				return;
			}
	
			// Add the boothId to the user's booth_access array
			const updatedBoothAccess = user.booth_access ? [...user.booth_access, boothId] : [boothId];
	
			const { data, error } = await supabase
				.from('users')
				.update({ booth_access: updatedBoothAccess })
				.eq('id', user.id)
				.select()
				.single();
	
			if (error) {
				console.error("Error updating booth access:", error);
			} else {
				// Update the local user state with the new booth_access array
				setUser(data as AuthUser);
				console.log(`Successfully joined booth ${boothId}.`);
			}
		} catch (error) {
			console.error("Exception in joinBooth:", error);
		}
	};

  const updateUserData = useCallback(async (updates: Partial<AuthUser>) => {
    if (!user) {
      console.warn("No user is currently logged in.");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user data:", error);
      } else {
        setUser(data as AuthUser);
        console.log("Successfully updated user data.");
      }
    } catch (error) {
      console.error("Exception in updateUserData:", error);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
		verifySACPin,
		verifyBoothPin,
		joinBooth,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
