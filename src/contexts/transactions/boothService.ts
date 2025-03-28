
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
  orderBy 
} from 'firebase/firestore';
import { toast } from 'sonner';
import { Booth, Product } from '@/types';
import { transformFirebaseBooth, transformFirebaseProduct } from '@/utils/firebase';

// Get a list of all booths
export const getBooths = async (): Promise<Booth[]> => {
  try {
    const boothsRef = collection(firestore, 'booths');
    const q = query(boothsRef, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const booths: Booth[] = [];
    
    for (const boothDoc of querySnapshot.docs) {
      const boothData = boothDoc.data();
      boothData.id = boothDoc.id;
      
      // Fetch booth products
      const productsRef = collection(firestore, 'products');
      const productsQuery = query(productsRef, where('booth_id', '==', boothDoc.id));
      const productsSnapshot = await getDocs(productsQuery);
      
      const products = productsSnapshot.docs.map(doc => {
        const productData = doc.data();
        productData.id = doc.id;
        return productData;
      });
      
      booths.push(transformFirebaseBooth(boothData, products));
    }
    
    return booths;
  } catch (error) {
    console.error('Error fetching booths:', error);
    toast.error('Failed to fetch booths');
    return [];
  }
};

// Get a specific booth by ID
export const getBooth = async (boothId: string): Promise<Booth | null> => {
  try {
    const boothRef = doc(firestore, 'booths', boothId);
    const boothSnapshot = await getDoc(boothRef);
    
    if (!boothSnapshot.exists()) {
      console.warn('Booth not found:', boothId);
      return null;
    }
    
    const boothData = boothSnapshot.data();
    boothData.id = boothSnapshot.id;
    
    // Fetch booth products
    const productsRef = collection(firestore, 'products');
    const q = query(productsRef, where('booth_id', '==', boothId));
    const productsSnapshot = await getDocs(q);
    
    const products = productsSnapshot.docs.map(doc => {
      const productData = doc.data();
      productData.id = doc.id;
      return productData;
    });
    
    return transformFirebaseBooth(boothData, products);
  } catch (error) {
    console.error('Error fetching booth:', error);
    toast.error('Failed to fetch booth details');
    return null;
  }
};

// Create a new booth
export const createBooth = async (
  name: string, 
  description: string, 
  managerId: string,
  pin: string
): Promise<string | null> => {
  try {
    const boothData = {
      name,
      description,
      members: [managerId],
      pin,
      sales: 0,
      created_at: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(firestore, 'booths'), boothData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating booth:', error);
    toast.error('Failed to create booth');
    return null;
  }
};

// Add a product to a booth
export const addProductToBooth = async (
  boothId: string, 
  product: { name: string; price: number; image?: string }
): Promise<boolean> => {
  try {
    // Verify booth exists
    const boothRef = doc(firestore, 'booths', boothId);
    const boothSnap = await getDoc(boothRef);
    
    if (!boothSnap.exists()) {
      console.error('Booth not found when adding product');
      toast.error('Booth not found');
      return false;
    }
    
    // Create product in Firestore
    const productData = {
      name: product.name,
      price: Math.round(product.price * 100), // Convert to cents for storage
      booth_id: boothId,
      image: product.image || '',
      created_at: new Date().toISOString()
    };
    
    await addDoc(collection(firestore, 'products'), productData);
    toast.success('Product added successfully');
    return true;
  } catch (error) {
    console.error('Error adding product to booth:', error);
    toast.error('Failed to add product');
    return false;
  }
};

// Remove a product from a booth
export const removeProductFromBooth = async (boothId: string, productId: string): Promise<boolean> => {
  try {
    // Verify the product exists and belongs to the booth
    const productRef = doc(firestore, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.error('Product not found when removing');
      toast.error('Product not found');
      return false;
    }
    
    const productData = productSnap.data();
    if (productData.booth_id !== boothId) {
      console.error('Product does not belong to this booth');
      toast.error('Product does not belong to this booth');
      return false;
    }
    
    // Delete the product
    await deleteDoc(productRef);
    toast.success('Product removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing product from booth:', error);
    toast.error('Failed to remove product');
    return false;
  }
};

// Get the leaderboard of booths by earnings
export const getLeaderboard = async (): Promise<{ boothId: string; boothName: string; earnings: number }[]> => {
  try {
    const boothsRef = collection(firestore, 'booths');
    const q = query(boothsRef, orderBy('sales', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const leaderboard = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        boothId: doc.id,
        boothName: data.name,
        earnings: (data.sales || 0) / 100 // Convert cents to dollars
      };
    });
    
    return leaderboard;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    toast.error('Failed to fetch leaderboard data');
    return [];
  }
};

// Find a user by student number
export const findUserByStudentNumber = async (studentNumber: string) => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('student_number', '==', studentNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const userData = querySnapshot.docs[0].data();
    userData.id = querySnapshot.docs[0].id;
    
    return {
      id: userData.id,
      name: userData.name,
      studentNumber: userData.student_number,
      tickets: userData.tickets || 0
    };
  } catch (error) {
    console.error('Error finding user by student number:', error);
    return null;
  }
};

// Get a specific booth's products
export const getBoothProducts = async (boothId: string): Promise<Product[]> => {
  try {
    const productsRef = collection(firestore, 'products');
    const q = query(productsRef, where('booth_id', '==', boothId));
    const querySnapshot = await getDocs(q);
    
    const products = querySnapshot.docs.map(doc => {
      const productData = doc.data();
      productData.id = doc.id;
      return transformFirebaseProduct(productData);
    });
    
    return products;
  } catch (error) {
    console.error('Error fetching booth products:', error);
    toast.error('Failed to fetch booth products');
    return [];
  }
};

// Get booths managed by a user
export const getUserBooths = async (userId: string): Promise<Booth[]> => {
  try {
    const boothsRef = collection(firestore, 'booths');
    const q = query(boothsRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    
    const booths: Booth[] = [];
    
    for (const boothDoc of querySnapshot.docs) {
      const boothData = boothDoc.data();
      boothData.id = boothDoc.id;
      
      // Fetch booth products
      const productsRef = collection(firestore, 'products');
      const productsQuery = query(productsRef, where('booth_id', '==', boothDoc.id));
      const productsSnapshot = await getDocs(productsQuery);
      
      const products = productsSnapshot.docs.map(doc => {
        const productData = doc.data();
        productData.id = doc.id;
        return productData;
      });
      
      booths.push(transformFirebaseBooth(boothData, products));
    }
    
    return booths;
  } catch (error) {
    console.error('Error fetching user booths:', error);
    toast.error('Failed to fetch user booths');
    return [];
  }
};
