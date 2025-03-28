import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  useMemo
} from 'react';
import { toast } from 'sonner';
import { auth } from '@/integrations/firebase/client';
import { 
  User, 
  Booth, 
  Product, 
  CartItem, 
  Transaction, 
  PaymentMethod,
  DateRange
} from '@/types';
import { useAuth } from '@/contexts/auth';
import { useCart } from './hooks/useCart';
import { usePayment } from './hooks/usePayment';
import { useTransaction } from './hooks/useTransaction';
import { useBoothManagement } from './hooks/useBoothManagement';
import { useTransactionManagement } from './hooks/useTransactionManagement';
import { useCartManagement } from './hooks/useCartManagement';

// Importing deleteUser from boothService
import { 
  createBooth as createBoothService, 
  addProductToBooth as addProductToBoothService,
  removeProductFromBooth as removeProductFromBoothService,
  getUserBooths,
  deleteUser as deleteUserService,
  deleteBooth as deleteBoothService
} from './boothService';

interface TransactionContextProps {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  total: number;
  totalItems: number;
  processPayment: (paymentMethod: PaymentMethod) => Promise<boolean>;
  recordTransaction: (
    buyerId: string,
    buyerName: string,
    products: {
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }[],
    amount: number,
    paymentMethod: PaymentMethod,
    boothId?: string,
    boothName?: string
  ) => Promise<boolean>;
  addFunds: (studentId: string, amount: number, sacMemberId: string) => Promise<{ success: boolean; message: string }>;
  getTransactionsByDate: (dateRange: DateRange, boothId?: string) => Promise<Transaction[]>;
  getTransactionsByBooth: (boothId: string) => Promise<Transaction[]>;
  getStudentTransactions: (studentId: string) => Promise<Transaction[]>;
  getBoothTransactions: (boothId: string) => Promise<Transaction[]>;
  getLeaderboard: () => Promise<{ boothId: string; boothName: string; earnings: number; }[]>;
  findUserByStudentNumber: (studentNumber: string) => Promise<User | null>;
  getBoothProducts: (boothId: string) => Promise<Product[]>;
  getUserBooths: (userId: string) => Promise<Booth[]>;
  booths: Booth[];
  getBoothById: (id: string) => Booth | undefined;
  loadBooths: () => Promise<Booth[]>;
  loadStudentBooths: (userId?: string) => Promise<Booth[]>;
  getBoothsByUserId: (userId: string) => Booth[];
  fetchAllBooths: () => Promise<Booth[]>;
  createBooth: (name: string, description: string, managerId: string, pin: string) => Promise<string | null>;
  deleteBooth: (boothId: string) => Promise<boolean>;
  addProductToBooth: (boothId: string, product: { name: string; price: number; image?: string | undefined; }) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
  isBoothLoading: boolean;
  // Additional properties for the errors
  loadBoothTransactions: (boothId: string) => Transaction[];
  processPurchase: (
    boothId: string,
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string,
    cartItems: CartItem[],
    boothName: string
  ) => Promise<{ success: boolean, transaction?: Transaction }>;
  recentTransactions: Transaction[];
  loadUserTransactions: (userId: string) => Transaction[];
}

interface TransactionProviderProps {
  children: React.ReactNode;
}

const TransactionContext = createContext<TransactionContextProps | undefined>(undefined);

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    clearCart, 
    increaseQuantity, 
    decreaseQuantity, 
    total, 
    totalItems 
  } = useCart();
  const { processPayment } = usePayment(cart, total, clearCart);
  const { 
    recordTransaction,
    addFunds,
    getTransactionsByDate,
    getTransactionsByBooth,
    getStudentTransactions,
    getBoothTransactions,
    getLeaderboard,
    findUserByStudentNumber,
    getBoothProducts,
    getUserBooths: getUserBoothsService
  } = useTransaction();
  
  const { 
    booths, 
    getBoothById, 
    loadBooths, 
    loadStudentBooths,
    getBoothsByUserId,
    fetchAllBooths,
    createBooth,
    deleteBooth,
    isLoading: isBoothLoading 
  } = useBoothManagement();

  // Get the transaction management functions
  const {
    transactions,
    recentTransactions,
    loadBoothTransactions,
    loadUserTransactions
  } = useTransactionManagement(booths);

  const addProductToBooth = async (
    boothId: string, 
    product: { name: string; price: number; image?: string }
  ): Promise<boolean> => {
    try {
      return await addProductToBoothService(boothId, product);
    } catch (error) {
      console.error('Error adding product to booth:', error);
      toast.error('Failed to add product to booth');
      return false;
    }
  };

  const removeProductFromBooth = async (boothId: string, productId: string): Promise<boolean> => {
    try {
      return await removeProductFromBoothService(boothId, productId);
    } catch (error) {
      console.error('Error removing product from booth:', error);
      toast.error('Failed to remove product from booth');
      return false;
    }
  };

  // Add deleteUser function
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      return await deleteUserService(userId);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
      return false;
    }
  };
  
  const getUserBooths = async (userId: string): Promise<Booth[]> => {
    try {
      return await getUserBoothsService(userId);
    } catch (error) {
      console.error('Error fetching user booths:', error);
      toast.error('Failed to fetch user booths');
      return [];
    }
  };

  // Add processPurchase implementation
  const processPurchase = async (
    boothId: string,
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string,
    cartItems: CartItem[],
    boothName: string
  ): Promise<{ success: boolean, transaction?: Transaction }> => {
    try {
      // Simulate processing a purchase
      console.log('Processing purchase:', {
        boothId,
        buyerId,
        buyerName,
        sellerId,
        sellerName,
        cartItems,
        boothName
      });
      
      // In a real app, this would process a purchase and update databases
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0
      );
      
      // Create a dummy transaction for the UI
      const newTransaction: Transaction = {
        id: `trans_${Date.now()}`,
        timestamp: Date.now(),
        buyerId,
        buyerName,
        sellerId,
        sellerName,
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
      
      return { success: true, transaction: newTransaction };
    } catch (error) {
      console.error('Error processing purchase:', error);
      return { success: false };
    }
  };
  
  const value = {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    total,
    totalItems,
    processPayment,
    recordTransaction,
    addFunds,
    getTransactionsByDate,
    getTransactionsByBooth,
    getStudentTransactions,
    getBoothTransactions,
    getLeaderboard,
    findUserByStudentNumber,
    getBoothProducts,
    getUserBooths,
    booths,
    getBoothById,
    loadBooths,
    loadStudentBooths,
    getBoothsByUserId,
    fetchAllBooths,
    createBooth,
    deleteBooth,
    addProductToBooth,
    removeProductFromBooth,
    deleteUser,
    isBoothLoading,
    // Add missing properties to fix errors
    loadBoothTransactions,
    processPurchase,
    recentTransactions,
    loadUserTransactions
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = (): TransactionContextProps => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
