
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
  arrayUnion
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
  joinBooth: (pin: string, userId: string) => Promise<boolean>;
  isLoading: boolean;
}

export const useBoothManagement = (): UseBoothManagementReturn => {
  const { user, isAuthenticated } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load all booths
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
        
        // Check if the booth already has products in the document
        const products = boothData.products || [];
        
        // Map the products to our Product type
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
          totalEarnings: (boothData.sales || 0) / 100, // Convert from cents to dollars
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
  
  // Load booths where a user is a member
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
        
        // Load booth products
        const productsCollection = collection(firestore, 'products');
        const productsQuery = query(productsCollection, where('booth_id', '==', boothDoc.id));
        const productsSnapshot = await getDocs(productsQuery);
        
        const products = productsSnapshot.docs.map(productDoc => {
          const productData = productDoc.data();
          return {
            id: productDoc.id,
            name: productData.name,
            price: (productData.price || 0) / 100, // Convert from cents to dollars
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
          totalEarnings: (boothData.sales || 0) / 100, // Convert from cents to dollars
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
  
  // Function to join a booth using PIN
  const joinBooth = async (pin: string, userId: string): Promise<boolean> => {
    console.log('Attempting to join booth with PIN:', pin);
    setIsLoading(true);
    
    try {
      // Find the booth with the matching PIN
      const boothsCollection = collection(firestore, 'booths');
      const boothsQuery = query(boothsCollection, where('pin', '==', pin));
      const boothsSnapshot = await getDocs(boothsQuery);
      
      if (boothsSnapshot.empty) {
        console.log('No booth found with the provided PIN');
        return false;
      }
      
      // Get the booth document
      const boothDoc = boothsSnapshot.docs[0];
      const boothId = boothDoc.id;
      const boothData = boothDoc.data();
      
      console.log('Found booth with matching PIN:', boothId);
      
      // Check if user is already a member
      const members = boothData.members || [];
      if (members.includes(userId)) {
        console.log('User is already a member of this booth');
        return true; // Return true since the user is already connected to the booth
      }
      
      // Update the booth document to add the user as a member
      await updateDoc(doc(firestore, 'booths', boothId), {
        members: arrayUnion(userId)
      });
      
      console.log('Added user to booth members list');
      
      // Also update the user's booth_access array
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          booth_access: arrayUnion(boothId)
        });
        console.log('Updated user booth_access list');
      } else {
        console.warn('User document not found:', userId);
      }
      
      // Refresh the booths list after joining
      const updatedBooths = await loadBooths();
      setBooths(updatedBooths);
      
      return true;
    } catch (error) {
      console.error('Error joining booth:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch all booths and update state
  const fetchAllBooths = useCallback(async () => {
    setIsLoading(true);
    try {
      const boothsData = await loadBooths();
      setBooths(boothsData);
      return boothsData; // Return the booths data to match the interface
    } catch (error) {
      console.error('Error in fetchAllBooths:', error);
      return []; // Return empty array on error to match the interface
    } finally {
      setIsLoading(false);
    }
  }, [loadBooths]);
  
  // Effect to load booths when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllBooths();
    }
  }, [isAuthenticated, fetchAllBooths]);
  
  // Create a new booth
  const createBooth = async (name: string, description: string, managerId: string, pin: string): Promise<string | null> => {
    console.log('Creating booth:', { name, description, managerId, pin });
    setIsLoading(true);
    
    try {
      // Create the booth
      const boothData = {
        name,
        description,
        members: [managerId], // Initial member - not just manager but member
        pin,
        sales: 0,
        created_at: new Date().toISOString(),
        created_by: managerId
      };
      
      const boothRef = await addDoc(collection(firestore, 'booths'), boothData);
      
      // Also update the user's booth_access array
      const userRef = doc(firestore, 'users', managerId);
      await updateDoc(userRef, {
        booth_access: arrayUnion(boothRef.id)
      });
      
      // Update booth list
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
  
  // Delete a booth
  const deleteBooth = async (boothId: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const success = await deleteBoothService(boothId);
      
      if (success) {
        // Update the local booths state by removing the deleted booth
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
  
  // Get booth by ID
  const getBoothById = useCallback((id: string): Booth | undefined => {
    return booths.find(booth => booth.id === id);
  }, [booths]);
  
  // Get booths by user ID
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
    joinBooth,
    isLoading
  };
};
