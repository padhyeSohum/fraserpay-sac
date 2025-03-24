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
  refreshUserBooths: () => Promise<Booth[]>;
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
      console.log("useBoothManagement: Loading booths for user:", user?.id);
      const fetchedBooths = await fetchAllBooths();
      setBooths(fetchedBooths);
      console.log(`useBoothManagement: Loaded ${fetchedBooths.length} booths`);
    } catch (error) {
      console.error('Unexpected error loading booths:', error);
      toast.error('Failed to load booths');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadStudentBooths = () => {
    if (!user || !user.booths || user.booths.length === 0) {
      console.log("useBoothManagement: No booths for user");
      return [];
    }
    
    console.log(`useBoothManagement: Filtering booths for user's booth access:`, user.booths);
    const studentBooths = booths.filter(booth => 
      user.booths?.includes(booth.id)
    );
    
    console.log(`useBoothManagement: Found ${studentBooths.length} booths for user`);
    return studentBooths;
  };
  
  const getBoothByIdImpl = (id: string) => {
    return booths.find(booth => booth.id === id);
  };
  
  const getBoothsByUserIdImpl = (userId: string) => {
    if (!userId || !booths || booths.length === 0) {
      return [];
    }
    console.log(`useBoothManagement: Getting booths for userId: ${userId}`);
    return booths.filter(booth => booth.managers.includes(userId));
  };

  const fetchAllBoothsImpl = async () => {
    console.log("useBoothManagement: Fetching all booths");
    const fetchedBooths = await fetchAllBooths();
    setBooths(fetchedBooths);
    console.log(`useBoothManagement: Fetched ${fetchedBooths.length} booths`);
    return fetchedBooths;
  };

  const refreshUserBoothsImpl = async () => {
    console.log("useBoothManagement: Refreshing user booths");
    setIsLoading(true);
    try {
      const fetchedBooths = await fetchAllBooths();
      setBooths(fetchedBooths);
      console.log(`useBoothManagement: Refreshed ${fetchedBooths.length} booths`);
      return fetchedBooths;
    } catch (error) {
      console.error('Error refreshing user booths:', error);
      return booths; // Return current state if refresh fails
    } finally {
      setIsLoading(false);
    }
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
    isLoading,
    refreshUserBooths: refreshUserBoothsImpl
  };
};
