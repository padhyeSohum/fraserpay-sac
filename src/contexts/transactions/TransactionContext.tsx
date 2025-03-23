
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { transformDatabaseBooth, transformDatabaseTransaction, transformDatabaseProduct } from '@/utils/supabase';
import { Booth, Product, Transaction, TransactionStats, CartItem, DateRange } from '@/types';
import { toast } from 'sonner';
import { 
  loadUserTransactions,
  fetchAllTransactions,
  addFunds,
  processPurchase
} from './transactionService';
import {
  fetchAllBooths,
  getBoothById,
  getBoothsByUserId,
  createBooth,
  addProductToBooth,
  removeProductFromBooth,
  getLeaderboard
} from './boothService';
import { TransactionContextType } from './types';

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserData } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Initialize booths on component mount
  useEffect(() => {
    if (user) {
      loadBooths();
    }
  }, [user]);

  // Booths management
  const loadBooths = async () => {
    setIsLoading(true);
    
    try {
      const fetchedBooths = await fetchAllBooths();
      setBooths(fetchedBooths);
    } catch (error) {
      console.error('Unexpected error loading booths:', error);
      toast.error('Failed to load booths');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadStudentBooths = () => {
    if (!user || !user.booths || user.booths.length === 0) {
      return [];
    }
    
    const studentBooths = booths.filter(booth => 
      user.booths?.includes(booth.id)
    );
    
    return studentBooths;
  };
  
  const getBoothByIdImpl = (id: string) => {
    return booths.find(booth => booth.id === id);
  };
  
  const getBoothsByUserIdImpl = (userId: string) => {
    return booths.filter(booth => booth.managers.includes(userId));
  };

  const fetchAllBoothsImpl = async () => {
    return await fetchAllBooths();
  };
  
  // Product management
  const loadBoothProducts = (boothId: string) => {
    const booth = getBoothByIdImpl(boothId);
    return booth ? booth.products : [];
  };
  
  // Transaction management
  const loadBoothTransactions = (boothId: string) => {
    const booth = getBoothByIdImpl(boothId);
    return booth ? booth.transactions : [];
  };

  const loadUserFundsTransactions = () => {
    // Filter transactions for fund-type transactions belonging to the current user
    return transactions.filter(t => t.type === 'fund' && t.buyerId === user?.id);
  };

  const loadUserTransactionsImpl = (userId: string) => {
    // Filter transactions for the specific user
    return transactions.filter(t => t.buyerId === userId);
  };

  const getSACTransactions = () => {
    // Return all transactions for SAC dashboard
    return transactions;
  };

  const getTransactionStats = (boothId: string, dateRange: DateRange): TransactionStats => {
    // Basic implementation of transaction stats
    const boothTransactions = transactions.filter(t => 
      t.boothId === boothId && 
      t.type === 'purchase' &&
      (!dateRange.startDate || new Date(t.timestamp) >= dateRange.startDate) &&
      (!dateRange.endDate || new Date(t.timestamp) <= dateRange.endDate)
    );
    
    // Calculate daily sales
    const dailySales: {[key: string]: number} = {};
    boothTransactions.forEach(t => {
      const date = new Date(t.timestamp).toISOString().split('T')[0];
      dailySales[date] = (dailySales[date] || 0) + t.amount;
    });
    
    // Calculate top products
    const productCount: {[key: string]: {count: number, name: string}} = {};
    boothTransactions.forEach(t => {
      t.products?.forEach(p => {
        if (!productCount[p.productId]) {
          productCount[p.productId] = {count: 0, name: p.productName};
        }
        productCount[p.productId].count += p.quantity;
      });
    });
    
    const topProducts = Object.entries(productCount)
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate total sales
    const totalSales = boothTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      dailySales,
      topProducts,
      totalSales
    };
  };

  const getLeaderboardImpl = () => {
    return getLeaderboard(booths);
  };
  
  // Cart management
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      // Check if product already exists in cart
      const existingItem = prevCart.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Update quantity if product already exists
        return prevCart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new product to cart
        return [...prevCart, { productId: product.id, product, quantity: 1 }];
      }
    });
    
    toast.success(`Added ${product.name} to cart`);
  };
  
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };
  
  const clearCart = () => {
    setCart([]);
  };
  
  const incrementQuantity = (productId: string) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      )
    );
  };
  
  const decrementQuantity = (productId: string) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.productId === productId && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      )
    );
  };
  
  // Payment processing
  const processPayment = async (boothId: string) => {
    if (!user) {
      toast.error('You must be logged in to make a purchase');
      return null;
    }
    
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return null;
    }
    
    setIsLoading(true);
    
    try {
      const booth = getBoothByIdImpl(boothId);
      if (!booth) {
        toast.error('Booth not found');
        return null;
      }

      const result = await processPurchase(
        boothId,
        user.id,
        user.name,
        booth.managers[0], // Using first manager as seller
        'Booth Manager', // Generic name
        cart,
        booth.name
      );
      
      if (result.success && result.transaction) {
        // Update user balance after successful payment
        if (user) {
          // Recalculating new balance
          const totalAmount = cart.reduce(
            (sum, item) => sum + (item.product.price * item.quantity),
            0
          );
          const newBalance = user.balance - totalAmount;
          
          updateUserData({
            ...user,
            balance: newBalance
          });
        }
        
        // Update transactions list
        if (result.transaction) {
          setTransactions(prev => [result.transaction, ...prev]);
        }
        
        clearCart();
        toast.success('Purchase successful!');
        return result.transaction;
      } else {
        toast.error(result.success === false ? 'Failed to process payment' : 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('An unexpected error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const addFundsImpl = async (userId: string, amount: number, sacMemberId: string): Promise<number> => {
    if (!user) {
      toast.error('You must be logged in to add funds');
      return 0;
    }
    
    setIsLoading(true);
    
    try {
      const result = await addFunds(
        amount,
        userId,
        'cash', // Default to cash
        sacMemberId,
        'SAC Member' // Generic name
      );
      
      if (result.success && result.updatedBalance !== undefined) {
        // Update user balance if adding funds to self
        if (userId === user.id) {
          updateUserData({
            ...user,
            balance: result.updatedBalance
          });
        }
        
        // Update transactions list
        if (result.transaction) {
          setTransactions(prev => [result.transaction, ...prev]);
        }
        
        toast.success(`Successfully added $${amount.toFixed(2)} to account`);
        return result.updatedBalance;
      } else {
        toast.error('Failed to add funds');
        return 0;
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all transactions on mount
  useEffect(() => {
    if (user) {
      const fetchTransactionsData = async () => {
        const allTransactions = await fetchAllTransactions();
        setTransactions(allTransactions);
        
        // Set recent transactions
        if (user && allTransactions.length > 0) {
          const userTxs = allTransactions.filter(t => t.buyerId === user.id);
          setRecentTransactions(userTxs.slice(0, 5)); // Most recent 5 transactions
        }
      };
      
      fetchTransactionsData();
    }
  }, [user]);

  return (
    <TransactionContext.Provider
      value={{
        // Booth management
        booths,
        getBoothById: getBoothByIdImpl,
        loadBooths,
        loadStudentBooths,
        getBoothsByUserId: getBoothsByUserIdImpl,
        fetchAllBooths: fetchAllBoothsImpl,
        createBooth,
        
        // Product management
        loadBoothProducts,
        addProductToBooth,
        removeProductFromBooth,
        
        // Transaction management
        loadBoothTransactions,
        loadUserFundsTransactions,
        loadUserTransactions: loadUserTransactionsImpl,
        getSACTransactions,
        getTransactionStats,
        getLeaderboard: getLeaderboardImpl,
        recentTransactions,
        
        // Cart management
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        incrementQuantity,
        decrementQuantity,
        
        // Payment processing
        processPayment,
        processPurchase,
        addFunds: addFundsImpl,
        
        // Loading states
        isLoading
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
