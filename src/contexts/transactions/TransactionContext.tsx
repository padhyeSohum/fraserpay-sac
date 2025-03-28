
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useMemo
} from 'react';
import { 
  Booth, 
  Product, 
  Transaction,
  CartItem,
  User,
  PaymentMethod
} from '@/types';

import { useAuth } from '@/contexts/auth';
import { useProductManagement } from './hooks/useProductManagement';
import { useBoothManagement } from './hooks/useBoothManagement';
import { useTransactionManagement } from './hooks/useTransactionManagement';
import { useTransactionUpdates } from './hooks/useTransactionUpdates';
import { useCart } from './hooks/useCart';
import { usePayment } from './hooks/usePayment';
import { useTransaction } from './hooks/useTransaction';
import { 
  firestore, 
  storage 
} from '@/integrations/firebase/client';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { toast } from 'sonner';

// Extended context type with all needed properties
export interface TransactionContextProps {
  // Booth management
  createBooth: (name: string, description: string, managerId: string, pinCode: string) => Promise<string>;
  getBoothById: (boothId: string) => Booth | undefined;
  getBoothsByUserId: (userId: string) => Booth[];
  joinBooth: (pinCode: string, userId: string) => Promise<boolean>;
  fetchAllBooths: () => Promise<Booth[]>;
  deleteBooth: (boothId: string) => Promise<boolean>;
  booths: Booth[];
  
  // Product management
  addProductToBooth: (boothId: string, product: Partial<Product>) => Promise<boolean>;
  deleteProduct: (boothId: string, productId: string) => Promise<boolean>;
  updateProduct: (boothId: string, productId: string, updates: Partial<Product>) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
  
  // Transaction management
  recordTransaction: (buyerId: string, buyerName: string, products: { productId: string; productName: string; quantity: number; price: number; }[], amount: number, paymentMethod: PaymentMethod, boothId?: string, boothName?: string) => Promise<boolean>;
  addFunds: (studentId: string, amount: number, sacMemberId: string) => Promise<{ success: boolean; message: string }>;
  getTransactionsByDate: (dateRange: {startDate?: Date; endDate?: Date}, boothId?: string) => Promise<Transaction[]>;
  getTransactionsByBooth: (boothId: string) => Promise<Transaction[]>;
  getStudentTransactions: (studentId: string) => Promise<Transaction[]>;
  getBoothTransactions: (boothId: string) => Promise<Transaction[]>;
  getLeaderboard: () => Promise<{ boothId: string; boothName: string; earnings: number; }[]>;
  findUserByStudentNumber: (studentNumber: string) => Promise<User | null>;
  getBoothProducts: (boothId: string) => Promise<Product[]>;
  getUserBooths: (userId: string) => Promise<any[]>;
  loadUserTransactions: (userId: string) => Transaction[];
  loadBoothTransactions: (boothId: string) => Transaction[];
  
  // User management
  deleteUser: (userId: string) => Promise<boolean>;
  
  // Cart management
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  updateQuantity: (productId: string, quantity: number) => void;
  
  // Purchase processing
  processPurchase: (boothId: string, buyerId: string, buyerName: string, sellerId: string, sellerName: string, cartItems: CartItem[], boothName: string) => Promise<boolean>;
  
  // Recent transactions
  recentTransactions: Transaction[];
}

const defaultContext: TransactionContextProps = {
  // Default values for all properties
  createBooth: async () => "",
  getBoothById: () => undefined,
  getBoothsByUserId: () => [],
  joinBooth: async () => false,
  fetchAllBooths: async () => [],
  deleteBooth: async () => false,
  booths: [],
  
  addProductToBooth: async () => false,
  deleteProduct: async () => false,
  updateProduct: async () => false,
  removeProductFromBooth: async () => false,
  
  recordTransaction: async () => false,
  addFunds: async () => ({ success: false, message: "" }),
  getTransactionsByDate: async () => [],
  getTransactionsByBooth: async () => [],
  getStudentTransactions: async () => [],
  getBoothTransactions: async () => [],
  getLeaderboard: async () => [],
  findUserByStudentNumber: async () => null,
  getBoothProducts: async () => [],
  getUserBooths: async () => [],
  loadUserTransactions: () => [],
  loadBoothTransactions: () => [],
  
  deleteUser: async () => false,
  
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  updateQuantity: () => {},
  
  processPurchase: async () => false,
  
  recentTransactions: []
};

const TransactionContext = createContext<TransactionContextProps>(defaultContext);

export const useTransactions = (): TransactionContextProps => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
};

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Hook compositions for different functionalities
  const productManagement = useProductManagement();
  const boothManagement = useBoothManagement();
  const transactionManagement = useTransactionManagement();
  const transactionUpdates = useTransactionUpdates();
  const cartManagement = useCart();
  const paymentProcessing = usePayment();
  const transactionHook = useTransaction();
  
  // Initialization
  useEffect(() => {
    const initializeData = async () => {
      if (isInitialized) return;
      
      try {
        const fetchedBooths = await boothManagement.fetchAllBooths();
        console.log("Loaded booths:", fetchedBooths.length);
        setBooths(fetchedBooths);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing transaction context:", error);
      }
    };
    
    initializeData();
  }, [isInitialized, boothManagement]);
  
  // Process a purchase transaction
  const processPurchase = async (
    boothId: string,
    buyerId: string,
    buyerName: string,
    sellerId: string, 
    sellerName: string,
    cartItems: CartItem[],
    boothName: string
  ): Promise<boolean> => {
    try {
      // Calculate total amount
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 
        0
      );
      
      // No products or invalid amount
      if (cartItems.length === 0 || totalAmount <= 0) {
        toast.error("No valid products in cart");
        return false;
      }
      
      // Create transaction in Firestore
      const transactionData = {
        booth_id: boothId,
        booth_name: boothName,
        buyer_id: buyerId,
        buyer_name: buyerName,
        seller_id: sellerId,
        seller_name: sellerName,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        boothId,
        boothName,
        amount: totalAmount,
        type: 'purchase',
        paymentMethod: 'cash',
        products: cartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        }))
      };
      
      // Add to transactions collection
      const transactionsRef = collection(firestore, 'transactions');
      await addDoc(transactionsRef, transactionData);
      
      // Update user tickets (deduct from balance)
      const userRef = doc(firestore, 'users', buyerId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentTickets = userData.tickets || 0;
        const amountInTickets = Math.round(totalAmount * 100); // Convert to cents
        
        if (currentTickets < amountInTickets) {
          toast.error('User has insufficient balance');
          return false;
        }
        
        // Update user balance
        await updateDoc(userRef, {
          tickets: currentTickets - amountInTickets,
          updated_at: serverTimestamp()
        });
        
        // Update booth earnings
        await updateDoc(doc(firestore, 'booths', boothId), {
          total_earnings: (booths.find(b => b.id === boothId)?.totalEarnings || 0) + totalAmount,
          updated_at: serverTimestamp()
        });
        
        // Clear cart after successful transaction
        cartManagement.clearCart();
        
        // Refresh data
        await boothManagement.fetchAllBooths().then(setBooths);
        
        toast.success(`Purchase complete: $${totalAmount.toFixed(2)}`);
        return true;
      } else {
        toast.error('User not found');
        return false;
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase');
      return false;
    }
  };
  
  // Delete a user
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      // Get user data first to check if it exists
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        toast.error('User not found');
        return false;
      }
      
      // Delete the user document
      await deleteDoc(userRef);
      toast.success('User deleted successfully');
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      return false;
    }
  };
  
  // Load user transactions
  const loadUserTransactions = (userId: string): Transaction[] => {
    if (!recentTransactions || !userId) return [];
    
    return recentTransactions.filter(tx => 
      tx.buyerId === userId || tx.sellerId === userId
    ).sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });
  };
  
  // Load booth transactions
  const loadBoothTransactions = (boothId: string): Transaction[] => {
    if (!recentTransactions || !boothId) return [];
    
    return recentTransactions.filter(tx => 
      tx.boothId === boothId
    ).sort((a, b) => {
      const dateA = new Date(a.timestamp || 0);
      const dateB = new Date(b.timestamp || 0);
      return dateB.getTime() - dateA.getTime();
    });
  };
  
  // Implementing joinBooth function since it's missing from the useBoothManagement hook
  const joinBooth = async (pinCode: string, userId: string): Promise<boolean> => {
    // Implementing a stub for joinBooth since it's not in useBoothManagement
    try {
      const boothsCollection = collection(firestore, 'booths');
      const q = query(boothsCollection, where('pin', '==', pinCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error('Invalid PIN code');
        return false;
      }
      
      const boothId = querySnapshot.docs[0].id;
      const boothRef = doc(firestore, 'booths', boothId);
      
      // Add user to booth managers
      await updateDoc(boothRef, {
        managers: arrayUnion(userId)
      });
      
      // Add booth to user's booth_access array
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        booth_access: arrayUnion(boothId)
      });
      
      // Refresh booths
      await boothManagement.fetchAllBooths().then(setBooths);
      
      toast.success('Successfully joined booth');
      return true;
    } catch (error) {
      console.error('Error joining booth:', error);
      toast.error('Failed to join booth');
      return false;
    }
  };
  
  const contextValue = useMemo(() => ({
    // Booth management
    createBooth: boothManagement.createBooth,
    getBoothById: boothManagement.getBoothById,
    getBoothsByUserId: boothManagement.getBoothsByUserId,
    joinBooth,
    fetchAllBooths: boothManagement.fetchAllBooths,
    deleteBooth: boothManagement.deleteBooth,
    booths,
    
    // Product management
    addProductToBooth: productManagement.addProductToBooth,
    removeProductFromBooth: productManagement.removeProductFromBooth,
    // Add these methods to match the interface
    deleteProduct: async (boothId: string, productId: string) => {
      return productManagement.removeProductFromBooth(boothId, productId);
    },
    updateProduct: async (boothId: string, productId: string, updates: Partial<Product>) => {
      // Add a stub for updateProduct since it's not available in useProductManagement
      console.warn('updateProduct is not implemented');
      return false;
    },
    
    // Transaction hooks
    recordTransaction: transactionHook.recordTransaction,
    addFunds: transactionHook.addFunds,
    getTransactionsByDate: transactionHook.getTransactionsByDate,
    getTransactionsByBooth: transactionHook.getTransactionsByBooth,
    getStudentTransactions: transactionHook.getStudentTransactions,
    getBoothTransactions: transactionHook.getBoothTransactions,
    getLeaderboard: transactionHook.getLeaderboard,
    findUserByStudentNumber: transactionHook.findUserByStudentNumber,
    getBoothProducts: transactionHook.getBoothProducts,
    getUserBooths: transactionHook.getUserBooths,
    
    // Custom implementations
    loadUserTransactions,
    loadBoothTransactions,
    
    // User management
    deleteUser,
    
    // Cart management
    ...cartManagement,
    
    // Purchase processing
    processPurchase,
    
    // Recent transactions
    recentTransactions
  }), [
    booths, 
    recentTransactions,
    boothManagement, 
    productManagement, 
    transactionHook,
    cartManagement
  ]);
  
  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};
