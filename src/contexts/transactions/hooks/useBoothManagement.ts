
import { useState, useCallback } from 'react';
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
  deleteBooth: (boothId: string) => Promise<boolean>;
  removeBoothFromUser: (userId: string, boothId: string) => Promise<boolean>;
}

export const useBoothManagement = (): UseBoothManagementReturn => {
  const [booths, setBooths] = useState<Booth[]>([]);

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

  const getBoothsByUserId = useCallback((userId: string): Booth[] => {
    return booths.filter(booth => booth.managers.includes(userId));
  }, [booths]);

  const fetchAllBooths = useCallback(async (): Promise<Booth[]> => {
    try {
      const boothsRef = collection(firestore, 'booths');
      const querySnapshot = await getDocs(boothsRef);
      const boothsList: Booth[] = [];
      
      querySnapshot.forEach(doc => {
        boothsList.push({
          id: doc.id,
          ...doc.data()
        } as Booth);
      });
      
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
        }
      }
      
      // Return success
      return true;
    } catch (error) {
      console.error('Error removing booth from user:', error);
      return false;
    }
  };

  return {
    booths,
    createBooth,
    getBoothById,
    getBoothsByUserId,
    fetchAllBooths,
    deleteBooth,
    removeBoothFromUser
  };
};
