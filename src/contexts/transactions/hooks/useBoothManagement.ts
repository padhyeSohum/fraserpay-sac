import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { Booth } from '@/types';
import { toast } from 'sonner';
import { 
  fetchAllBooths, 
  getBoothById, 
  getBoothsByUserId, 
  createBooth,
  addProductToBooth
} from '../boothService';

export interface UseBoothManagementReturn {
  booths: Booth[];
  getBoothById: (id: string) => Booth | undefined;
  loadBooths: () => void;
  loadStudentBooths: () => Booth[];
  getBoothsByUserId: (userId: string) => Booth[];
  fetchAllBooths: () => Promise<Booth[]>;
  createBooth: (name: string, description: string, userId: string, customPin?: string) => Promise<string | null>;
  addProductToBooth: (boothId: string, product: Omit<import('@/types').Product, 'id' | 'boothId' | 'salesCount'>) => Promise<boolean>;
  isLoading: boolean;
}

export const useBoothManagement = (): UseBoothManagementReturn => {
  const { user } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const createBoothImpl = async (name: string, description: string, userId: string, customPin?: string) => {
    setIsLoading(true);
    try {
      const boothId = await createBooth(name, description, userId, customPin);
      
      if (boothId) {
        await loadBooths();
      }
      
      return boothId;
    } catch (error) {
      console.error('Error in useBoothManagement.createBooth:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const addProductToBoothImpl = async (boothId: string, product: Omit<import('@/types').Product, 'id' | 'boothId' | 'salesCount'>) => {
    setIsLoading(true);
    try {
      const result = await addProductToBooth(boothId, product);
      
      if (result) {
        await loadBooths();
      }
      
      return result;
    } catch (error) {
      console.error('Error in useBoothManagement.addProductToBooth:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    booths,
    getBoothById: getBoothByIdImpl,
    loadBooths,
    loadStudentBooths,
    getBoothsByUserId: getBoothsByUserIdImpl,
    fetchAllBooths: fetchAllBoothsImpl,
    createBooth: createBoothImpl,
    addProductToBooth: addProductToBoothImpl,
    isLoading
  };
};
