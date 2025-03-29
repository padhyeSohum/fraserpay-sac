import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { Booth } from '@/types';
import { toast } from 'sonner';
import { firestore } from '@/integrations/firebase/client';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  doc, 
  getDoc, 
  orderBy,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  arrayRemove
} from 'firebase/firestore';
import { deleteBooth as deleteBoothService } from '@/contexts/transactions/boothService';

export interface UseBoothManagementReturn {
  booths: Booth[];
  getBoothById: (id: string) => Booth | undefined;
  loadBooths: () => Promise<Booth[]>;
  loadStudentBooths: (userId?: string) => Promise<Booth[]>;
  getBoothsByUserId: (userId: string) => Booth[];
  fetchAllBooths: () => Promise<Booth[]>;
  createBooth: (name: string, description: string, managerId: string, pin: string) => Promise<string | null>;
  deleteBooth: (boothId: string) => Promise<boolean>;
  removeBoothFromUser: (userId: string, boothId: string) => Promise<boolean>;
  isLoading: boolean;
}

export const useBoothManagement = (): UseBoothManagementReturn => {
  const { user, isAuthenticated } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadBooths = useCallback(async () => {
    console.log('Loading all booths');
    setIsLoading(true);
    
    try {
      const boothsCollection = collection(firestore, 'booths');
      const boothsQuery = query(boothsCollection, orderBy('created_at', 'desc'));
      const boothsSnapshot = await getDocs(boothsQuery);
      
      const boothsData: Booth[] = [];
      
      for (const boothDoc of boothsSnapshot.docs) {
        const boothData = boothDoc.data();
        
        const products = boothData.products || [];
        
        const mappedProducts = products.map((prod: any) => ({
          id: prod.id,
          name: prod.name,
          price: prod.price,
          boothId: boothDoc.id,
          description: prod.description || '',
          image: prod.image || '',
          salesCount: prod.salesCount || 0
        }));
        
        boothsData.push({
          id: boothDoc.id,
          name: boothData.name,
          description: boothData.description || '',
          pin: boothData.pin,
          products: mappedProducts,
          managers: boothData.members || [],
          totalEarnings: (boothData.sales || 0) / 100,
          createdAt: boothData.created_at
        });
      }
      
      console.log('Loaded booths:', boothsData.length);
      return boothsData;
    } catch (error) {
      console.error('Error loading booths:', error);
      toast.error('Failed to load booths');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const loadStudentBooths = useCallback(async (userId?: string) => {
    const userIdToUse = userId || (user ? user.id : undefined);
    
    if (!userIdToUse) {
      console.warn('No user ID provided for loadStudentBooths');
      return [];
    }
    
    console.log('Loading booths for user:', userIdToUse);
    setIsLoading(true);
    
    try {
      const boothsCollection = collection(firestore, 'booths');
      const boothsQuery = query(
        boothsCollection, 
        where('members', 'array-contains', userIdToUse),
        orderBy('created_at', 'desc')
      );
      const boothsSnapshot = await getDocs(boothsQuery);
      
      const boothsData: Booth[] = [];
      
      for (const boothDoc of boothsSnapshot.docs) {
        const boothData = boothDoc.data();
        
        const productsCollection = collection(firestore, 'products');
        const productsQuery = query(productsCollection, where('booth_id', '==', boothDoc.id));
        const productsSnapshot = await getDocs(productsQuery);
        
        const products = productsSnapshot.docs.map(productDoc => {
          const productData = productDoc.data();
          return {
            id: productDoc.id,
            name: productData.name,
            price: (productData.price || 0) / 100,
            boothId: boothDoc.id,
            image: productData.image,
            salesCount: 0
          };
        });
        
        boothsData.push({
          id: boothDoc.id,
          name: boothData.name,
          description: boothData.description || '',
          pin: boothData.pin,
          products: products,
          managers: boothData.members || [],
          totalEarnings: (boothData.sales || 0) / 100,
          createdAt: boothData.created_at
        });
      }
      
      console.log('Loaded user booths:', boothsData.length);
      return boothsData;
    } catch (error) {
      console.error('Error loading user booths:', error);
      toast.error('Failed to load your booths');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  const fetchAllBooths = useCallback(async () => {
    setIsLoading(true);
    try {
      const boothsData = await loadBooths();
      setBooths(boothsData);
      return boothsData;
    } catch (error) {
      console.error('Error in fetchAllBooths:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [loadBooths]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllBooths();
    }
  }, [isAuthenticated, fetchAllBooths]);
  
  const createBooth = async (name: string, description: string, managerId: string, pin: string): Promise<string | null> => {
    console.log('Creating booth:', { name, description, managerId, pin });
    setIsLoading(true);
    
    try {
      const boothData = {
        name,
        description,
        members: [managerId],
        pin,
        sales: 0,
        created_at: new Date().toISOString(),
        created_by: managerId
      };
      
      const boothRef = await addDoc(collection(firestore, 'booths'), boothData);
      
      await fetchAllBooths();
      
      console.log('Booth created with ID:', boothRef.id);
      toast.success('Booth created successfully');
      
      return boothRef.id;
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteBooth = async (boothId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const success = await deleteBoothService(boothId);
      
      if (success) {
        setBooths(prevBooths => prevBooths.filter(booth => booth.id !== boothId));
        toast.success('Booth deleted successfully');
      }
      
      return success;
    } catch (error) {
      console.error('Error deleting booth:', error);
      toast.error('Failed to delete booth');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeBoothFromUser = async (userId: string, boothId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        booth_access: arrayRemove(boothId)
      });
      
      setBooths(prevBooths => 
        prevBooths.map(booth => {
          if (booth.id === boothId) {
            return {
              ...booth,
              managers: booth.managers.filter(id => id !== userId)
            };
          }
          return booth;
        })
      );
      
      return true;
    } catch (error) {
      console.error('Error removing booth from user:', error);
      toast.error('Failed to remove booth');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const getBoothById = useCallback((id: string): Booth | undefined => {
    return booths.find(booth => booth.id === id);
  }, [booths]);
  
  const getBoothsByUserId = useCallback((userId: string): Booth[] => {
    return booths.filter(booth => booth.managers.includes(userId));
  }, [booths]);
  
  return {
    booths,
    getBoothById,
    loadBooths,
    loadStudentBooths,
    getBoothsByUserId,
    fetchAllBooths,
    createBooth,
    deleteBooth,
    removeBoothFromUser,
    isLoading
  };
};
