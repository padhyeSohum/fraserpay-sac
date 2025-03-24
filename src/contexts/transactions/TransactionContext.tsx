
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth';
import { Booth, Product, Transaction, CartItem, DateRange, TransactionStats } from '@/types';
import { TransactionContextType } from './types';
import { useBoothManagement } from './hooks/useBoothManagement';
import { useProductManagement } from './hooks/useProductManagement';
import { useTransactionManagement } from './hooks/useTransactionManagement';
import { useCartManagement } from './hooks/useCartManagement';
import { usePaymentProcessing } from './hooks/usePaymentProcessing';
import { 
  fetchAllBooths, 
  getBoothById, 
  getBoothsByUserId, 
  createBooth,
  findUserByStudentNumber,
} from './boothService';

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const isMounted = useRef(true);

  // Use our custom hooks for each feature area
  const boothManagement = useBoothManagement();
  const productManagement = useProductManagement();
  const cartManagement = useCartManagement();
  const transactionManagement = useTransactionManagement(boothManagement.booths);
  const paymentProcessing = usePaymentProcessing();

  // Initialize data on mount
  useEffect(() => {
    isMounted.current = true;
    
    const initializeData = async () => {
      try {
        await boothManagement.fetchAllBooths();
      } catch (error) {
        console.error('Failed to initialize transaction data:', error);
      } finally {
        if (isMounted.current) {
          setIsInitialized(true);
        }
      }
    };

    initializeData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Function to update transactions list when a new transaction is created
  const updateTransactions = (transaction: Transaction) => {
    // We don't need state here as the useTransactionManagement hook manages its own state
  };

  const contextValue: TransactionContextType = {
    // Booth management
    booths: boothManagement.booths,
    getBoothById: boothManagement.getBoothById,
    loadBooths: boothManagement.loadBooths,
    loadStudentBooths: boothManagement.loadStudentBooths,
    getBoothsByUserId: boothManagement.getBoothsByUserId,
    fetchAllBooths: boothManagement.fetchAllBooths,
    createBooth: boothManagement.createBooth,
    
    // Product management
    loadBoothProducts: (boothId) => productManagement.loadBoothProducts(boothId, boothManagement.booths),
    addProductToBooth: productManagement.addProductToBooth,
    removeProductFromBooth: productManagement.removeProductFromBooth,
    
    // Transaction management
    loadBoothTransactions: (boothId) => transactionManagement.loadBoothTransactions(boothId, boothManagement.booths),
    loadUserFundsTransactions: transactionManagement.loadUserFundsTransactions,
    loadUserTransactions: transactionManagement.loadUserTransactions,
    getSACTransactions: transactionManagement.getSACTransactions,
    getTransactionStats: transactionManagement.getTransactionStats,
    getLeaderboard: transactionManagement.getLeaderboard,
    recentTransactions: transactionManagement.recentTransactions,
    
    // Cart management
    cart: cartManagement.cart,
    addToCart: cartManagement.addToCart,
    removeFromCart: cartManagement.removeFromCart,
    clearCart: cartManagement.clearCart,
    incrementQuantity: cartManagement.incrementQuantity,
    decrementQuantity: cartManagement.decrementQuantity,
    
    // Payment processing
    processPayment: (boothId) => paymentProcessing.processPayment(
      boothId, 
      cartManagement.cart, 
      boothManagement.getBoothById,
      updateTransactions
    ),
    processPurchase: paymentProcessing.processPurchase,
    addFunds: paymentProcessing.addFunds,
    
    // Loading states
    isLoading: boothManagement.isLoading || paymentProcessing.isLoading || !isInitialized,
    findUserByStudentNumber
  };

  // Render a loading state if not initialized yet
  if (!isInitialized) {
    console.log('TransactionContext is still initializing...');
  }

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
