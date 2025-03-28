
import { User, Booth, Product, Transaction } from '@/types';
import { firestore } from '@/integrations/firebase/client';
import { collection, doc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { transformFirebaseBooth, transformFirebaseProduct, transformFirebaseTransaction } from '@/utils/firebase';

export const findUserByStudentNumber = async (studentNumber: string): Promise<User | null> => {
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
      studentNumber: userData.student_number,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      balance: (userData.tickets || 0) / 100,
      favoriteProducts: [],
      booths: userData.booth_access || []
    };
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

export const addProductToBooth = async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>): Promise<boolean> => {
  try {
    // Create a new product document in Firestore
    const productsRef = collection(firestore, 'products');
    const priceInCents = Math.round(product.price * 100); // Store price in cents in Firestore
    
    await addDoc(productsRef, {
      name: product.name,
      price: priceInCents,
      booth_id: boothId,
      image: product.image,
      created_at: new Date().toISOString()
    });
    
    console.log(`Added product ${product.name} to booth ${boothId}`);
    return true;
  } catch (error) {
    console.error('Error adding product to booth:', error);
    return false;
  }
};

// Implementing fetchAllBooths to use Firebase
export const fetchAllBooths = async (): Promise<Booth[]> => {
  try {
    console.log('Fetching all booths from Firebase');
    const boothsRef = collection(firestore, 'booths');
    const boothsSnapshot = await getDocs(boothsRef);
    
    if (boothsSnapshot.empty) {
      console.log('No booths found');
      return [];
    }
    
    const booths: Booth[] = [];
    
    for (const boothDoc of boothsSnapshot.docs) {
      const boothData = boothDoc.data();
      boothData.id = boothDoc.id;
      
      // Fetch products for this booth
      const productsRef = collection(firestore, 'products');
      const q = query(productsRef, where('booth_id', '==', boothDoc.id));
      const productsSnapshot = await getDocs(q);
      
      const products = productsSnapshot.docs.map(doc => {
        const productData = doc.data();
        productData.id = doc.id;
        return transformFirebaseProduct(productData);
      });
      
      // Transform to our Booth type
      booths.push({
        id: boothDoc.id,
        name: boothData.name,
        description: boothData.description || '',
        pin: boothData.pin,
        managers: boothData.members || [],
        products: products,
        totalEarnings: (boothData.sales || 0) / 100, // Convert from cents to dollars
        transactions: []
      });
    }
    
    return booths;
  } catch (error) {
    console.error('Error fetching booths:', error);
    toast.error('Failed to load booths');
    return [];
  }
};

// Implementing getBoothById to use Firebase
export const getBoothById = async (id: string): Promise<Booth | null> => {
  try {
    const boothRef = doc(firestore, 'booths', id);
    const boothSnap = await getDoc(boothRef);
    
    if (!boothSnap.exists()) {
      console.error('No booth found with ID:', id);
      return null;
    }
    
    const boothData = boothSnap.data();
    
    // Fetch products for this booth
    const productsRef = collection(firestore, 'products');
    const q = query(productsRef, where('booth_id', '==', id));
    const productsSnapshot = await getDocs(q);
    
    const products = productsSnapshot.docs.map(doc => {
      const productData = doc.data();
      productData.id = doc.id;
      return transformFirebaseProduct(productData);
    });
    
    // Transform to our Booth type
    return {
      id: boothSnap.id,
      name: boothData.name,
      description: boothData.description || '',
      pin: boothData.pin,
      managers: boothData.members || [],
      products: products,
      totalEarnings: (boothData.sales || 0) / 100, // Convert from cents to dollars
      transactions: []
    };
  } catch (error) {
    console.error('Error fetching booth by ID:', error);
    return null;
  }
};

// Implementing getBoothsByUserId to use Firebase
export const getBoothsByUserId = async (userId: string): Promise<Booth[]> => {
  try {
    const boothsRef = collection(firestore, 'booths');
    const q = query(boothsRef, where('members', 'array-contains', userId));
    const boothsSnapshot = await getDocs(q);
    
    if (boothsSnapshot.empty) {
      return [];
    }
    
    const booths: Booth[] = [];
    
    for (const boothDoc of boothsSnapshot.docs) {
      const boothData = boothDoc.data();
      
      // Fetch products for this booth
      const productsRef = collection(firestore, 'products');
      const q = query(productsRef, where('booth_id', '==', boothDoc.id));
      const productsSnapshot = await getDocs(q);
      
      const products = productsSnapshot.docs.map(doc => {
        const productData = doc.data();
        productData.id = doc.id;
        return transformFirebaseProduct(productData);
      });
      
      // Transform to our Booth type
      booths.push({
        id: boothDoc.id,
        name: boothData.name,
        description: boothData.description || '',
        pin: boothData.pin,
        managers: boothData.members || [],
        products: products,
        totalEarnings: (boothData.sales || 0) / 100, // Convert from cents to dollars
        transactions: []
      });
    }
    
    return booths;
  } catch (error) {
    console.error('Error fetching booths by user ID:', error);
    return [];
  }
};

// Implementing createBooth to use Firebase
export const createBooth = async (name: string, description: string, userId: string, customPin?: string): Promise<string | null> => {
  try {
    // Generate a PIN if not provided
    const pin = customPin || Math.floor(1000 + Math.random() * 9000).toString();
    
    // Create new booth document in Firestore
    const boothsRef = collection(firestore, 'booths');
    const newBoothRef = await addDoc(boothsRef, {
      name,
      description,
      pin,
      members: [userId],
      sales: 0,
      created_at: new Date().toISOString()
    });
    
    console.log('Booth created with ID:', newBoothRef.id);
    return newBoothRef.id;
  } catch (error) {
    console.error('Error creating booth:', error);
    toast.error('Failed to create booth');
    return null;
  }
};

// Implementing getAllTransactions to use Firebase
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    console.log('Fetching all transactions from Firebase');
    const transactionsRef = collection(firestore, 'transactions');
    const q = query(transactionsRef, orderBy('created_at', 'desc'));
    const transactionsSnapshot = await getDocs(q);
    
    if (transactionsSnapshot.empty) {
      return [];
    }
    
    const transactions: Transaction[] = [];
    
    for (const transactionDoc of transactionsSnapshot.docs) {
      const transactionData = transactionDoc.data();
      transactionData.id = transactionDoc.id;
      
      // Fetch transaction products
      const transactionProductsRef = collection(firestore, 'transaction_products');
      const q = query(transactionProductsRef, where('transaction_id', '==', transactionDoc.id));
      const transactionProductsSnapshot = await getDocs(q);
      
      const transactionProducts = transactionProductsSnapshot.docs.map(doc => {
        const productData = doc.data();
        productData.id = doc.id;
        return productData;
      });
      
      // Transform to our Transaction type
      transactions.push(transformFirebaseTransaction(transactionData, transactionProducts));
    }
    
    console.log('Transactions data received:', transactions.length, 'records');
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast.error('Failed to load transactions');
    return [];
  }
};

// Implementing getLeaderboard to use Firebase
export const getLeaderboard = async (): Promise<{ boothId: string; boothName: string; earnings: number }[]> => {
  try {
    const boothsRef = collection(firestore, 'booths');
    const boothsSnapshot = await getDocs(boothsRef);
    
    if (boothsSnapshot.empty) {
      return [];
    }
    
    const leaderboardData = boothsSnapshot.docs.map(doc => {
      const boothData = doc.data();
      return {
        boothId: doc.id,
        boothName: boothData.name,
        earnings: (boothData.sales || 0) / 100 // Convert from cents to dollars
      };
    });
    
    // Sort by earnings in descending order
    return leaderboardData.sort((a, b) => b.earnings - a.earnings);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    toast.error('Failed to fetch leaderboard data');
    return [];
  }
};

// Implementing removeProductFromBooth to use Firebase
export const removeProductFromBooth = async (boothId: string, productId: string): Promise<boolean> => {
  try {
    const productRef = doc(firestore, 'products', productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.error('Product not found:', productId);
      return false;
    }
    
    const productData = productSnap.data();
    
    // Verify this product belongs to the specified booth
    if (productData.booth_id !== boothId) {
      console.error('Product does not belong to booth:', boothId);
      return false;
    }
    
    // Delete the product
    await deleteDoc(productRef);
    
    console.log(`Product ${productId} removed from booth ${boothId}`);
    return true;
  } catch (error) {
    console.error('Error removing product:', error);
    return false;
  }
};

