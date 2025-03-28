
import { Booth, Product } from '@/types';
import { firestore } from '@/integrations/firebase/client';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  addDoc, 
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'sonner';
import { transformFirebaseBooth } from '@/utils/firebase';

export const fetchAllBooths = async (): Promise<Booth[]> => {
  try {
    // Get all booths
    const boothsRef = collection(firestore, 'booths');
    const boothsSnapshot = await getDocs(boothsRef);
    
    // Get all products
    const productsRef = collection(firestore, 'products');
    const productsSnapshot = await getDocs(productsRef);
    
    const productsData = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (boothsSnapshot.empty) {
      return [];
    }

    const formattedBooths: Booth[] = boothsSnapshot.docs.map(doc => {
      const boothData = {
        id: doc.id,
        ...doc.data()
      };
      
      const boothProducts = productsData.filter(p => p.booth_id === doc.id) || [];
      
      return transformFirebaseBooth(boothData, boothProducts);
    });

    return formattedBooths;
  } catch (error) {
    console.error('Error fetching booths:', error);
    toast.error('Failed to load booths');
    return [];
  }
};

export const getBoothById = (booths: Booth[], boothId: string): Booth | undefined => {
  return booths.find(b => b.id === boothId);
};

export const getBoothsByUserId = (booths: Booth[], userId: string): Booth[] => {
  return booths.filter(booth => booth.managers.includes(userId));
};

export const createBooth = async (
  name: string, 
  description: string, 
  userId: string,
  customPin?: string
): Promise<string | null> => {
  try {
    console.log("Creating booth:", { name, description, userId, customPin });
    
    // Generate a random PIN if one was not provided
    const pin = customPin || Math.floor(100000 + Math.random() * 900000).toString();
    
    // Ensure userId is valid before proceeding
    if (!userId) {
      console.error("Invalid userId for booth creation");
      throw new Error("User ID is required to create a booth");
    }
    
    // Create the booth in Firestore with the user as a member
    const boothRef = await addDoc(collection(firestore, 'booths'), {
      name,
      description,
      pin,
      members: [userId],
      sales: 0,
      created_at: serverTimestamp()
    });
    
    console.log("Booth created successfully with ID:", boothRef.id);
    
    // Get the user's current booth_access array
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error("User not found");
      // Continue even if this fails, as the booth was created successfully
    } else {
      const userData = userDoc.data();
      // Create a new array with the existing booths plus the new one
      const updatedBoothAccess = [...(userData.booth_access || []), boothRef.id];
      
      // Update the user's booth_access array
      await updateDoc(userRef, { booth_access: updatedBoothAccess });
      
      console.log("Updated user booth access successfully:", updatedBoothAccess);
    }
    
    toast.success(`Booth "${name}" created successfully!`);
    
    return boothRef.id;
  } catch (error) {
    console.error('Error creating booth:', error);
    toast.error('Failed to create booth: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return null;
  }
};

export const addProductToBooth = async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>): Promise<boolean> => {
  try {
    const priceInCents = Math.round(product.price * 100);
    
    await addDoc(collection(firestore, 'products'), {
      name: product.name,
      price: priceInCents,
      booth_id: boothId,
      image: product.image,
      created_at: serverTimestamp()
    });
    
    toast.success(`Added product: ${product.name}`);
    
    return true;
  } catch (error) {
    console.error('Error adding product:', error);
    toast.error('Failed to add product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return false;
  }
};

export const removeProductFromBooth = async (boothId: string, productId: string): Promise<boolean> => {
  try {
    // Find the product that belongs to the specified booth
    const productsRef = collection(firestore, 'products');
    const q = query(
      productsRef, 
      where('id', '==', productId), 
      where('booth_id', '==', boothId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Product not found or does not belong to this booth');
    }
    
    // Delete the product
    const productDoc = querySnapshot.docs[0];
    await updateDoc(doc(firestore, 'products', productDoc.id), {
      deleted: true,
      deleted_at: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error removing product:', error);
    toast.error('Failed to remove product');
    return false;
  }
};

export const getLeaderboard = (booths: Booth[]) => {
  const boothEarnings = booths.map(booth => ({
    boothId: booth.id,
    boothName: booth.name,
    earnings: booth.totalEarnings
  }));
  
  return boothEarnings.sort((a, b) => b.earnings - a.earnings);
};

export const findUserByStudentNumber = async (studentNumber: string): Promise<{ id: string; name: string; balance: number } | null> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('student_number', '==', studentNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userData = querySnapshot.docs[0].data();
    
    return {
      id: querySnapshot.docs[0].id,
      name: userData.name,
      balance: userData.tickets / 100 // Convert from cents to dollars
    };
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};
