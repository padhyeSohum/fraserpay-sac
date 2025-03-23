
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { Booth } from '@/types';
import { toast } from 'sonner';
import { 
  fetchAllBooths, 
  getBoothById, 
  getBoothsByUserId, 
  createBooth 
} from '../boothService';

export interface UseBoothManagementReturn {
  booths: Booth[];
  getBoothById: (id: string) => Booth | undefined;
  loadBooths: () => void;
  loadStudentBooths: () => Booth[];
  getBoothsByUserId: (userId: string) => Booth[];
  fetchAllBooths: () => Promise<Booth[]>;
  createBooth: (name: string, description: string, userId: string) => Promise<string | null>;
  isLoading: boolean;
}

export const useBoothManagement = (): UseBoothManagementReturn => {
  const { user } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize booths on component mount
  useEffect(() => {
    if (user) {
      loadBooths();
    }
  }, [user]);

  const loadBooths = async () => {
    setIsLoading(true);
    
    try {
      const fetchedBooths = await fetchAllBooths();
      setBooths(fetchedBooths);
    } catch (error) {
      console.error('Unexpected error loading booths:', error);
      toast.error('Failed to load booths');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadStudentBooths = () => {
    if (!user || !user.booths || user.booths.length === 0) {
      return [];
    }
    
    const studentBooths = booths.filter(booth => 
      user.booths?.includes(booth.id)
    );
    
    return studentBooths;
  };
  
  const getBoothByIdImpl = (id: string) => {
    return booths.find(booth => booth.id === id);
  };
  
  const getBoothsByUserIdImpl = (userId: string) => {
    return booths.filter(booth => booth.managers.includes(userId));
  };

  const fetchAllBoothsImpl = async () => {
    return await fetchAllBooths();
  };

  return {
    booths,
    getBoothById: getBoothByIdImpl,
    loadBooths,
    loadStudentBooths,
    getBoothsByUserId: getBoothsByUserIdImpl,
    fetchAllBooths: fetchAllBoothsImpl,
    createBooth,
    isLoading
  };
};
