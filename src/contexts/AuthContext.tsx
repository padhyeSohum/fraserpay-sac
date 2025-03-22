
import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (studentNumber: string, password: string) => Promise<void>;
  register: (studentNumber: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  verifySACPin: (pin: string) => boolean;
  verifyBoothPin: (pin: string) => Promise<boolean>;
  joinBooth: (boothId: string) => void;
}

// Mock SAC PIN for demo purposes
const SAC_PIN = '123456';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing user session in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }, [user]);

  const login = async (studentNumber: string, password: string) => {
    setIsLoading(true);
    
    try {
      // For demo purposes, we'll simply check if the student number exists in localStorage
      const usersStr = localStorage.getItem('users');
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      const foundUser = users.find(u => u.studentNumber === studentNumber);
      
      if (!foundUser) {
        throw new Error('Student number not found');
      }
      
      // In a real app, you would verify the password hash here
      // For demo, we'll just check if password exists (not secure!)
      const passwordsStr = localStorage.getItem('passwords');
      const passwords: Record<string, string> = passwordsStr ? JSON.parse(passwordsStr) : {};
      
      if (passwords[foundUser.id] !== password) {
        throw new Error('Incorrect password');
      }
      
      setUser(foundUser);
      toast.success('Login successful');

      // Route based on user role
      if (foundUser.role === 'sac') {
        navigate('/sac/dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (studentNumber: string, name: string, email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Check if user already exists
      const usersStr = localStorage.getItem('users');
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      if (users.some(u => u.studentNumber === studentNumber)) {
        throw new Error('Student number already registered');
      }
      
      if (users.some(u => u.email === email)) {
        throw new Error('Email already registered');
      }
      
      // Create new user
      const newUser: User = {
        id: Date.now().toString(),
        studentNumber,
        name,
        email,
        role: 'student',
        balance: 0,
        favoriteProducts: [],
        booths: []
      };
      
      // Save user
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Save password (in a real app, you would hash this!)
      const passwordsStr = localStorage.getItem('passwords');
      const passwords: Record<string, string> = passwordsStr ? JSON.parse(passwordsStr) : {};
      passwords[newUser.id] = password;
      localStorage.setItem('passwords', JSON.stringify(passwords));
      
      setUser(newUser);
      toast.success('Registration successful');
      navigate('/dashboard');
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // In a real app, you'd clear the authentication token here
    toast.info('Logged out');
    navigate('/login');
  };

  const verifySACPin = (pin: string) => {
    if (pin === SAC_PIN) {
      // Update user role to SAC if pin is correct
      if (user) {
        const updatedUser = { ...user, role: 'sac' as UserRole };
        setUser(updatedUser);
        
        // Update in localStorage users array
        const usersStr = localStorage.getItem('users');
        if (usersStr) {
          const users: User[] = JSON.parse(usersStr);
          const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
          localStorage.setItem('users', JSON.stringify(updatedUsers));
        }
        
        toast.success('SAC access granted');
        navigate('/sac/dashboard');
        return true;
      }
    }
    
    toast.error('Invalid PIN');
    return false;
  };

  const verifyBoothPin = async (pin: string): Promise<boolean> => {
    // Get booths from localStorage
    const boothsStr = localStorage.getItem('booths');
    const booths = boothsStr ? JSON.parse(boothsStr) : [];
    
    const booth = booths.find((b: any) => b.pin === pin);
    
    if (booth && user) {
      // Add this booth to user's booths if not already there
      if (!user.booths?.includes(booth.id)) {
        const updatedUser = {
          ...user,
          booths: [...(user.booths || []), booth.id]
        };
        
        setUser(updatedUser);
        
        // Update user in localStorage
        const usersStr = localStorage.getItem('users');
        if (usersStr) {
          const users: User[] = JSON.parse(usersStr);
          const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
          localStorage.setItem('users', JSON.stringify(updatedUsers));
        }
        
        // Add user to booth managers
        booth.managers = [...(booth.managers || []), user.id];
        const updatedBooths = booths.map((b: any) => b.id === booth.id ? booth : b);
        localStorage.setItem('booths', JSON.stringify(updatedBooths));
        
        toast.success(`You now have access to ${booth.name}`);
        return true;
      } else {
        toast.info(`You already have access to ${booth.name}`);
        return true;
      }
    }
    
    toast.error('Invalid booth PIN');
    return false;
  };

  const joinBooth = (boothId: string) => {
    if (user) {
      navigate(`/booth/${boothId}`);
    }
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
        joinBooth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
