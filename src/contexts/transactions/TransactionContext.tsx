
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Booth, Product, CartItem } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createSampleBooths } from '@/utils/seedData';
import { TransactionContextType } from './types';
import * as BoothService from './boothService';
import * as TransactionService from './transactionService';

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchAllTransactions(),
        fetchAllBooths()
      ]).then(() => {
        createSampleBooths().catch(error => {
          console.error('Failed to create sample booths:', error);
        });
      }).finally(() => setIsLoading(false));
    }
  }, [user]);

  const fetchAllTransactions = async () => {
    const fetchedTransactions = await TransactionService.fetchAllTransactions();
    setTransactions(fetchedTransactions);
  };

  const fetchAllBooths = async () => {
    const fetchedBooths = await BoothService.fetchAllBooths();
    setBooths(fetchedBooths);
  };

  const loadUserTransactions = (userId: string) => {
    return TransactionService.loadUserTransactions(transactions, userId);
  };

  const loadBoothTransactions = (boothId: string) => {
    return TransactionService.loadBoothTransactions(transactions, boothId);
  };

  const addFunds = async (
    amount: number, 
    studentId: string, 
    paymentMethod: 'cash' | 'card',
    sacMemberId: string,
    sacMemberName: string
  ) => {
    const result = await TransactionService.addFunds(
      amount, 
      studentId, 
      paymentMethod, 
      sacMemberId, 
      sacMemberName
    );
    
    if (result.success && result.transaction) {
      setTransactions(prev => [result.transaction!, ...prev]);
    }
    
    return result.success;
  };

  const processPurchase = async (
    boothId: string,
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string,
    cartItems: CartItem[],
    boothName: string
  ) => {
    const result = await TransactionService.processPurchase(
      boothId,
      buyerId,
      buyerName,
      sellerId,
      sellerName,
      cartItems,
      boothName
    );
    
    if (result.success && result.transaction) {
      setTransactions(prev => [result.transaction!, ...prev]);
      
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0
      );
      
      setBooths(prev => 
        prev.map(booth => {
          if (booth.id === boothId) {
            return {
              ...booth,
              totalEarnings: booth.totalEarnings + totalAmount,
              transactions: [result.transaction!, ...(booth.transactions || [])]
            };
          }
          return booth;
        })
      );
    }
    
    return result.success;
  };

  const getBoothById = (boothId: string) => {
    return BoothService.getBoothById(booths, boothId);
  };

  const getBoothsByUserId = (userId: string) => {
    return BoothService.getBoothsByUserId(booths, userId);
  };

  const createBooth = async (name: string, description: string, userId: string) => {
    const boothId = await BoothService.createBooth(name, description, userId);
    
    if (boothId) {
      await fetchAllBooths(); // Refresh booths after creating a new one
    }
    
    return boothId;
  };

  const addProductToBooth = async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => {
    const success = await BoothService.addProductToBooth(boothId, product);
    
    if (success) {
      await fetchAllBooths(); // Refresh booths after adding a product
    }
    
    return success;
  };

  const removeProductFromBooth = async (boothId: string, productId: string) => {
    const success = await BoothService.removeProductFromBooth(boothId, productId);
    
    if (success) {
      setBooths(prev => 
        prev.map(booth => {
          if (booth.id === boothId) {
            return {
              ...booth,
              products: booth.products.filter(product => product.id !== productId)
            };
          }
          return booth;
        })
      );
    }
    
    return success;
  };

  const getLeaderboard = () => {
    return BoothService.getLeaderboard(booths);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        recentTransactions: transactions.slice(0, 10),
        loadUserTransactions,
        loadBoothTransactions,
        addFunds,
        processPurchase,
        getBoothById,
        getBoothsByUserId,
        createBooth,
        addProductToBooth,
        removeProductFromBooth,
        getLeaderboard,
        fetchAllTransactions,
        fetchAllBooths
      }}
    >
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
