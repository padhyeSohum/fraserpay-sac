
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
  deleteDoc,
  orderBy
} from 'firebase/firestore';
import { toast } from 'sonner';
import { fetchAllTransactions } from './transactionService';

export interface TransactionContextProps {
  createBooth: (name: string, description: string, managerId: string, pinCode: string) => Promise<string>;
  getBoothById: (boothId: string) => Booth | undefined;
  fetchBoothById: (boothId: string) => Promise<Booth | null>; // New direct fetch method
  getBoothsByUserId: (userId: string) => Booth[];
  joinBooth: (pinCode: string, userId: string) => Promise<boolean>;
  fetchAllBooths: () => Promise<Booth[]>;
  deleteBooth: (boothId: string) => Promise<boolean>;
  booths: Booth[];
  
  addProductToBooth: (boothId: string, product: Partial<Product>) => Promise<boolean>;
  deleteProduct: (boothId: string, productId: string) => Promise<boolean>;
  updateProduct: (boothId: string, productId: string, updates: Partial<Product>) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
  
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
  refreshTransactions: () => Promise<Transaction[]>;
  
  deleteUser: (userId: string) => Promise<boolean>;
  
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  updateQuantity: (productId: string, quantity: number) => void;
  
  processPurchase: (boothId: string, buyerId: string, buyerName: string, sellerId: string, sellerName: string, cartItems: CartItem[], boothName: string) => Promise<boolean>;
  
  recentTransactions: Transaction[];
  
  removeBoothFromUser: (userId: string, boothId: string) => Promise<boolean>;
}

const defaultContext: TransactionContextProps = {
  createBooth: async () => "",
  getBoothById: () => undefined,
  fetchBoothById: async () => null,
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
  refreshTransactions: async () => [],
  
  deleteUser: async () => false,
  
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  updateQuantity: () => {},
  
  processPurchase: async () => false,
  
  recentTransactions: [],
  
  removeBoothFromUser: async () => false,
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
  
  const productManagement = useProductManagement();
  const boothManagement = useBoothManagement();
  const transactionManagement = useTransactionManagement(booths);
  const transactionUpdates = useTransactionUpdates();
  const cartManagement = useCart();
  const paymentProcessing = usePayment();
  const transactionHook = useTransaction();
  
  useEffect(() => {
    const initializeData = async () => {
      if (isInitialized) return;
      
      try {
        const fetchedBooths = await boothManagement.fetchAllBooths();
        console.log("Loaded booths:", fetchedBooths.length);
        setBooths(fetchedBooths);
        
        // Also fetch transactions
        const transactions = await fetchAllTransactions();
        setRecentTransactions(transactions);
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing transaction context:", error);
      }
    };
    
    initializeData();
  }, [isInitialized, boothManagement]);
  
  const refreshTransactions = async (): Promise<Transaction[]> => {
    try {
      const transactions = await fetchAllTransactions();
      setRecentTransactions(transactions);
      return transactions;
    } catch (error) {
      console.error("Error refreshing transactions:", error);
      return [];
    }
  };
  
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
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.product.price * item.quantity), 
        0
      );
      
      if (cartItems.length === 0 || totalAmount <= 0) {
        toast.error("No valid products in cart");
        return false;
      }
      
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
      
      const transactionsRef = collection(firestore, 'transactions');
      await addDoc(transactionsRef, transactionData);
      
      const userRef = doc(firestore, 'users', buyerId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentTickets = userData.tickets || 0;
        const amountInTickets = Math.round(totalAmount * 100);
        
        if (currentTickets < amountInTickets) {
          toast.error('User has insufficient balance');
          return false;
        }
        
        await updateDoc(userRef, {
          tickets: currentTickets - amountInTickets,
          updated_at: serverTimestamp()
        });
        
        const boothRef = doc(firestore, 'booths', boothId);
        const boothSnap = await getDoc(boothRef);
        
        if (boothSnap.exists()) {
          const boothData = boothSnap.data();
          const currentSales = boothData.sales || 0;
          const newSales = currentSales + amountInTickets;
          
          await updateDoc(boothRef, {
            sales: newSales,
            updated_at: serverTimestamp()
          });
          
          console.log('Booth sales updated in TransactionContext:', {
            previousSales: currentSales / 100,
            newSales: newSales / 100
          });
        }
        
        cartManagement.clearCart();
        
        await boothManagement.fetchAllBooths().then(updatedBooths => {
          console.log('Booths refreshed after transaction:', updatedBooths.length);
          setBooths(updatedBooths);
        });
        
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
  
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        toast.error('User not found');
        return false;
      }
      
      await deleteDoc(userRef);
      toast.success('User deleted successfully');
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      return false;
    }
  };
  
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
  
  const joinBooth = async (pinCode: string, userId: string): Promise<boolean> => {
    if (!pinCode || !userId) {
      toast.error('Missing pin code or user ID');
      return false;
    }
    
    try {
      console.log(`Attempting to join booth with PIN: ${pinCode} for user: ${userId}`);
      const boothsCollection = collection(firestore, 'booths');
      const q = query(boothsCollection, where('pin', '==', pinCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('No booth found with the provided PIN');
        toast.error('Invalid PIN code');
        return false;
      }
      
      const boothId = querySnapshot.docs[0].id;
      const boothData = querySnapshot.docs[0].data();
      console.log(`Found booth: ${boothId}, ${boothData.name}`);
      
      // Check if user already has access
      if (boothData.managers && boothData.managers.includes(userId)) {
        console.log('User already has access to this booth');
        toast.info('You already have access to this booth');
        return true;
      }
      
      const boothRef = doc(firestore, 'booths', boothId);
      await updateDoc(boothRef, {
        managers: arrayUnion(userId),
        updated_at: serverTimestamp()
      });
      
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        booth_access: arrayUnion(boothId),
        updated_at: serverTimestamp()
      });
      
      // Update local state
      const updatedBooths = await boothManagement.fetchAllBooths();
      setBooths(updatedBooths);
      
      toast.success(`Successfully joined ${boothData.name}`);
      return true;
    } catch (error) {
      console.error('Error joining booth:', error);
      toast.error('Failed to join booth. Please try again.');
      return false;
    }
  };
  
  const contextValue = useMemo(() => ({
    createBooth: boothManagement.createBooth,
    getBoothById: boothManagement.getBoothById,
    fetchBoothById: boothManagement.fetchBoothById,
    getBoothsByUserId: boothManagement.getBoothsByUserId,
    joinBooth,
    fetchAllBooths: boothManagement.fetchAllBooths,
    deleteBooth: boothManagement.deleteBooth,
    booths,
    
    addProductToBooth: productManagement.addProductToBooth,
    removeProductFromBooth: productManagement.removeProductFromBooth,
    deleteProduct: async (boothId: string, productId: string) => {
      return productManagement.removeProductFromBooth(boothId, productId);
    },
    updateProduct: async (boothId: string, productId: string, updates: Partial<Product>) => {
      console.warn('updateProduct is not implemented');
      return false;
    },
    
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
    
    loadUserTransactions,
    loadBoothTransactions,
    refreshTransactions,
    
    deleteUser,
    
    cart: cartManagement.cart,
    addToCart: cartManagement.addToCart,
    removeFromCart: cartManagement.removeFromCart,
    clearCart: cartManagement.clearCart,
    updateQuantity: cartManagement.updateQuantity,
    
    processPurchase,
    
    recentTransactions,
    
    removeBoothFromUser: boothManagement.removeBoothFromUser,
  }), [
    booths, 
    recentTransactions,
    boothManagement, 
    productManagement, 
    transactionHook,
    cartManagement,
    refreshTransactions,
    joinBooth,
    loadUserTransactions,
    loadBoothTransactions,
    deleteUser,
    processPurchase
  ]);
  
  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};
