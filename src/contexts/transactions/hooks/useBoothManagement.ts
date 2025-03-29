
import { useState, useCallback, useEffect } from 'react';
import { Booth } from '@/types';
import { firestore } from '@/integrations/firebase/client';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  arrayRemove,
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import { toast } from 'sonner';

export interface UseBoothManagementReturn {
  booths: Booth[];
  createBooth: (name: string, description: string, managerId: string, pinCode: string) => Promise<string>;
  getBoothById: (boothId: string) => Booth | undefined;
  getBoothsByUserId: (userId: string) => Booth[];
  fetchAllBooths: () => Promise<Booth[]>;
  fetchBoothById: (boothId: string) => Promise<Booth | null>;  // New method for direct fetching
  deleteBooth: (boothId: string) => Promise<boolean>;
  removeBoothFromUser: (userId: string, boothId: string) => Promise<boolean>;
}

export const useBoothManagement = (): UseBoothManagementReturn => {
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize booths on first load
  useEffect(() => {
    if (!isInitialized) {
      fetchAllBooths().then(() => {
        setIsInitialized(true);
      }).catch(error => {
        console.error("Failed to initialize booths:", error);
      });
    }
  }, [isInitialized]);

  const createBooth = async (
    name: string, 
    description: string, 
    managerId: string,
    pinCode: string
  ): Promise<string> => {
    try {
      const boothsRef = collection(firestore, 'booths');
      const boothData = {
        name,
        description,
        managers: [managerId],
        products: [],
        totalEarnings: 0,
        sales: 0,
        pin: pinCode,
        created_at: serverTimestamp()
      };
      const docRef = await addDoc(boothsRef, boothData);
      
      // Update the user document to include the booth ID in the booth_access array
      const userRef = doc(firestore, 'users', managerId);
      await updateDoc(userRef, {
        booth_access: arrayUnion(docRef.id),
        updated_at: serverTimestamp()
      });
      
      // Add to local state
      const newBooth: Booth = {
        id: docRef.id,
        ...boothData,
        managers: [managerId],
        products: []
      };
      setBooths(prev => [...prev, newBooth]);
      
      toast.success('Booth created successfully!');
      return docRef.id;
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth');
      return "";
    }
  };

  const getBoothById = useCallback((boothId: string): Booth | undefined => {
    return booths.find(booth => booth.id === boothId);
  }, [booths]);

  // New method to fetch booth directly from Firestore
  const fetchBoothById = useCallback(async (boothId: string): Promise<Booth | null> => {
    try {
      console.log(`Directly fetching booth ${boothId} from Firestore`);
      const boothRef = doc(firestore, 'booths', boothId);
      const boothSnap = await getDoc(boothRef);
      
      if (boothSnap.exists()) {
        const boothData = {
          id: boothSnap.id,
          ...boothSnap.data()
        } as Booth;
        
        // Update local state
        setBooths(prev => {
          const exists = prev.some(b => b.id === boothId);
          if (!exists) {
            return [...prev, boothData];
          }
          return prev.map(b => b.id === boothId ? boothData : b);
        });
        
        return boothData;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching booth ${boothId}:`, error);
      return null;
    }
  }, []);

  const getBoothsByUserId = useCallback((userId: string): Booth[] => {
    if (!userId || !booths || !Array.isArray(booths)) return [];
    return booths.filter(booth => 
      booth.managers && Array.isArray(booth.managers) && booth.managers.includes(userId)
    );
  }, [booths]);

  const fetchAllBooths = useCallback(async (): Promise<Booth[]> => {
    try {
      console.log("Fetching all booths from Firestore");
      const boothsRef = collection(firestore, 'booths');
      const querySnapshot = await getDocs(boothsRef);
      const boothsList: Booth[] = [];
      
      querySnapshot.forEach(doc => {
        boothsList.push({
          id: doc.id,
          ...doc.data()
        } as Booth);
      });
      
      console.log(`Retrieved ${boothsList.length} booths from Firestore`);
      setBooths(boothsList);
      return boothsList;
    } catch (error) {
      console.error('Error fetching booths:', error);
      toast.error('Failed to fetch booths');
      return [];
    }
  }, []);

  const deleteBooth = async (boothId: string): Promise<boolean> => {
    try {
      const boothRef = doc(firestore, 'booths', boothId);
      await deleteDoc(boothRef);
      
      // Remove the booth from the local state
      setBooths(prevBooths => prevBooths.filter(booth => booth.id !== boothId));
      
      toast.success('Booth deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting booth:', error);
      toast.error('Failed to delete booth');
      return false;
    }
  };

  // Add function to remove a booth from a user
  const removeBoothFromUser = async (userId: string, boothId: string): Promise<boolean> => {
    try {
      console.log(`Removing booth ${boothId} from user ${userId}`);
      
      // Update the user document to remove booth access
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        booth_access: arrayRemove(boothId),
        updated_at: serverTimestamp()
      });
      
      // Update the booth document to remove manager
      const boothRef = doc(firestore, 'booths', boothId);
      const boothDoc = await getDoc(boothRef);
      
      if (boothDoc.exists()) {
        const boothData = boothDoc.data();
        if (boothData.managers && Array.isArray(boothData.managers)) {
          await updateDoc(boothRef, {
            managers: arrayRemove(userId),
            updated_at: serverTimestamp()
          });
          
          // Update the local state
          setBooths(prevBooths => prevBooths.map(booth => {
            if (booth.id === boothId && booth.managers) {
              return {
                ...booth,
                managers: booth.managers.filter(id => id !== userId)
              };
            }
            return booth;
          }));
        }
      }
      
      toast.success('Successfully removed from booth');
      return true;
    } catch (error) {
      console.error('Error removing booth from user:', error);
      toast.error('Failed to remove booth access');
      return false;
    }
  };

  return {
    booths,
    createBooth,
    getBoothById,
    getBoothsByUserId,
    fetchAllBooths,
    fetchBoothById,
    deleteBooth,
    removeBoothFromUser
  };
};
