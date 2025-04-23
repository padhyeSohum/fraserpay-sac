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
  arrayUnion, 
  deleteDoc,
  arrayRemove,
  serverTimestamp
} from 'firebase/firestore';
import { Booth, Product } from '@/types';
import { toast } from 'sonner';

export const deleteBooth = async (boothId: string): Promise<boolean> => {
  try {
    const boothRef = doc(firestore, 'booths', boothId);
    
    const boothSnap = await getDoc(boothRef);
    if (!boothSnap.exists()) {
      console.error('Booth not found:', boothId);
      return false;
    }
    
    await deleteDoc(boothRef);
    console.log('Booth deleted successfully:', boothId);
    
    return true;
  } catch (error) {
    console.error('Error deleting booth:', error);
    return false;
  }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      console.error('User not found:', userId);
      return false;
    }
    
    await deleteDoc(userRef);
    console.log('User deleted successfully:', userId);
    
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

export const setBoothPWYC = async (boothId: string, enabled: boolean): Promise<boolean> => {
  try {
    const boothRef = doc(firestore, 'booths', boothId);
    await updateDoc(boothRef, {
      pwycEnabled: enabled
    });
    toast.success(enabled ? 'PWYC enabled for this booth!' : 'PWYC disabled for this booth.');
    return true;
  } catch (error) {
    console.error('Error updating booth PWYC:', error);
    toast.error('Failed to update PWYC setting');
    return false;
  }
};

export const createBooth = async (
  name: string, 
  description: string, 
  managerId: string,
  pin: string
): Promise<string | null> => {
  try {
    const boothsRef = collection(firestore, 'booths');
    
    const existingBoothQuery = query(boothsRef, where('name', '==', name));
    const existingBoothSnapshot = await getDocs(existingBoothQuery);
    
    if (!existingBoothSnapshot.empty) {
      toast.error('Booth name already exists. Please choose a different name.');
      return null;
    }
    
    const boothData = {
      name,
      description,
      managers: [managerId],
      products: [],
      totalEarnings: 0,
      pin: pin,
      created_at: serverTimestamp(),
      pwycEnabled: false
    };
    
    const docRef = await addDoc(boothsRef, boothData);
    
    const userRef = doc(firestore, 'users', managerId);
    await updateDoc(userRef, {
      booth_access: arrayUnion(docRef.id)
    });
    
    toast.success('Booth created successfully!');
    return docRef.id;
  } catch (error) {
    console.error('Error creating booth:', error);
    toast.error('Failed to create booth');
    return null;
  }
};

export const addProductToBooth = async (
  boothId: string, 
  product: { name: string; price: number; image?: string }
): Promise<boolean> => {
  try {
    const boothRef = doc(firestore, 'booths', boothId);
    
    const boothSnap = await getDoc(boothRef);
    if (!boothSnap.exists()) {
      console.error('Booth not found:', boothId);
      toast.error('Booth not found');
      return false;
    }
    
    const boothData = boothSnap.data() as Booth;
    if (boothData.products && boothData.products.some(p => p.name === product.name)) {
      toast.error('Product name already exists in this booth. Please choose a different name.');
      return false;
    }
    
    const productData: Product = {
      id: `prod_${Date.now()}`,
      boothId: boothId,
      name: product.name,
      price: product.price,
      image: product.image,
      salesCount: 0
    };
    
    await updateDoc(boothRef, {
      products: arrayUnion(productData)
    });
    
    toast.success('Product added to booth successfully!');
    return true;
  } catch (error) {
    console.error('Error adding product to booth:', error);
    toast.error('Failed to add product to booth');
    return false;
  }
};

export const removeProductFromBooth = async (boothId: string, productId: string): Promise<boolean> => {
  try {
    const boothRef = doc(firestore, 'booths', boothId);
    
    const boothSnap = await getDoc(boothRef);
    if (!boothSnap.exists()) {
      console.error('Booth not found:', boothId);
      toast.error('Booth not found');
      return false;
    }
    
    const boothData = boothSnap.data() as Booth;
    if (!boothData.products || !boothData.products.some(p => p.id === productId)) {
      toast.error('Product not found in this booth');
      return false;
    }
    
    await updateDoc(boothRef, {
      products: arrayRemove({ id: productId })
    });
    
    toast.success('Product removed from booth successfully!');
    return true;
  } catch (error) {
    console.error('Error removing product from booth:', error);
    toast.error('Failed to remove product from booth');
    return false;
  }
};

export const getUserBooths = async (userId: string): Promise<Booth[]> => {
  try {
    const boothsRef = collection(firestore, 'booths');
    const q = query(boothsRef, where('managers', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    
    const booths: Booth[] = [];
    querySnapshot.forEach((doc) => {
      booths.push({
        id: doc.id,
        ...doc.data()
      } as Booth);
    });
    
    return booths;
  } catch (error) {
    console.error('Error fetching user booths:', error);
    toast.error('Failed to fetch user booths');
    return [];
  }
};

export const getLeaderboard = async (): Promise<{ boothId: string; boothName: string; earnings: number }[]> => {
  try {
    const boothsRef = collection(firestore, 'booths');
    const querySnapshot = await getDocs(boothsRef);
    
    const leaderboardData: { boothId: string; boothName: string; earnings: number }[] = [];
    
    querySnapshot.forEach((doc) => {
      const boothData = doc.data();
      leaderboardData.push({
        boothId: doc.id,
        boothName: boothData.name,
        earnings: boothData.totalEarnings || 0
      });
    });
    
    leaderboardData.sort((a, b) => b.earnings - a.earnings);
    
    return leaderboardData;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    toast.error('Failed to fetch leaderboard data');
    return [];
  }
};
