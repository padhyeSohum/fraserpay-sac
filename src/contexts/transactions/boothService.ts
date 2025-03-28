
import { firestore } from '@/integrations/firebase/client';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Booth, Product, Transaction } from '@/types';
import { 
  transformFirebaseBooth, 
  transformFirebaseProduct, 
  transformFirebaseTransaction 
} from '@/utils/firebase';
import { toast } from 'sonner';

// Fetches all booths from Firestore
export const fetchAllBooths = async (): Promise<Booth[]> => {
  try {
    console.log("Fetching all booths...");
    const boothsRef = collection(firestore, 'booths');
    const boothsSnapshot = await getDocs(boothsRef);
    
    const booths: Booth[] = [];
    
    // Process each booth
    for (const boothDoc of boothsSnapshot.docs) {
      const boothId = boothDoc.id;
      
      // Fetch products for this booth
      const productsRef = collection(firestore, 'products');
      const productsQuery = query(productsRef, where('booth_id', '==', boothId));
      const productsSnapshot = await getDocs(productsQuery);
      
      const boothWithProducts = transformFirebaseBooth(
        { id: boothId, ...boothDoc.data() },
        productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
      
      booths.push(boothWithProducts);
    }
    
    console.log(`Fetched ${booths.length} booths`);
    return booths;
  } catch (error) {
    console.error("Error fetching booths:", error);
    return [];
  }
};

// Get a specific booth by ID
export const getBoothById = async (boothId: string): Promise<Booth | null> => {
  try {
    const boothRef = doc(firestore, 'booths', boothId);
    const boothSnap = await getDoc(boothRef);
    
    if (!boothSnap.exists()) {
      return null;
    }
    
    // Fetch products for this booth
    const productsRef = collection(firestore, 'products');
    const productsQuery = query(productsRef, where('booth_id', '==', boothId));
    const productsSnapshot = await getDocs(productsQuery);
    
    const booth = transformFirebaseBooth(
      { id: boothId, ...boothSnap.data() },
      productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    );
    
    return booth;
  } catch (error) {
    console.error("Error fetching booth by ID:", error);
    toast.error('Could not load booth details');
    return null;
  }
};

// Get booths by user ID (booths user is a manager of)
export const getBoothsByUserId = async (userId: string): Promise<Booth[]> => {
  try {
    const boothsRef = collection(firestore, 'booths');
    const boothsQuery = query(boothsRef, where('members', 'array-contains', userId));
    const boothsSnapshot = await getDocs(boothsQuery);
    
    const booths: Booth[] = [];
    
    // Process each booth
    for (const boothDoc of boothsSnapshot.docs) {
      const boothId = boothDoc.id;
      
      // Fetch products for this booth
      const productsRef = collection(firestore, 'products');
      const productsQuery = query(productsRef, where('booth_id', '==', boothId));
      const productsSnapshot = await getDocs(productsQuery);
      
      const boothWithProducts = transformFirebaseBooth(
        { id: boothId, ...boothDoc.data() },
        productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      );
      
      booths.push(boothWithProducts);
    }
    
    return booths;
  } catch (error) {
    console.error("Error fetching booths by user ID:", error);
    toast.error('Could not load your booths');
    return [];
  }
};

// Create a new booth
export const createBooth = async (
  name: string, 
  description: string, 
  userId: string,
  customPin?: string
): Promise<string | null> => {
  try {
    // Generate a random 6-digit PIN if not provided
    const pin = customPin || Math.floor(100000 + Math.random() * 900000).toString();
    
    // Create booth document
    const boothsRef = collection(firestore, 'booths');
    const newBoothRef = await addDoc(boothsRef, {
      name,
      description,
      pin,
      members: [userId],
      sales: 0,
      created_at: serverTimestamp()
    });
    
    // Update the document with its ID (for easier access)
    await updateDoc(newBoothRef, {
      id: newBoothRef.id
    });
    
    // Update user's booth access if needed
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const userBooths = userData.booth_access || [];
      
      if (!userBooths.includes(newBoothRef.id)) {
        await updateDoc(userRef, {
          booth_access: [...userBooths, newBoothRef.id]
        });
      }
    }
    
    toast.success('Booth created successfully!');
    return newBoothRef.id;
  } catch (error) {
    console.error("Error creating booth:", error);
    toast.error('Failed to create booth');
    return null;
  }
};

// Add a product to a booth
export const addProductToBooth = async (
  boothId: string,
  product: Omit<Product, 'id' | 'boothId' | 'salesCount'>
): Promise<boolean> => {
  try {
    const productsRef = collection(firestore, 'products');
    
    // Convert price to cents for storage
    const priceInCents = Math.round(product.price * 100);
    
    // Create the product
    const newProductRef = await addDoc(productsRef, {
      name: product.name,
      price: priceInCents,
      booth_id: boothId,
      image: product.image || '',
      created_at: serverTimestamp()
    });
    
    // Update with its own ID
    await updateDoc(newProductRef, {
      id: newProductRef.id
    });
    
    toast.success('Product added successfully!');
    return true;
  } catch (error) {
    console.error("Error adding product:", error);
    toast.error('Failed to add product');
    return false;
  }
};

// Find a user by student number
export const findUserByStudentNumber = async (studentNumber: string): Promise<any> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('student_number', '==', studentNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      toast.error('Student not found');
      return null;
    }
    
    const userData = querySnapshot.docs[0].data();
    const userId = querySnapshot.docs[0].id;
    
    return {
      id: userId,
      ...userData,
      balance: userData.tickets ? userData.tickets / 100 : 0 // Convert cents to dollars
    };
  } catch (error) {
    console.error("Error finding user:", error);
    toast.error('Failed to find student');
    return null;
  }
};
