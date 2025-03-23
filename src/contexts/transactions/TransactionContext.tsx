
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { transformDatabaseBooth, transformDatabaseTransaction, transformDatabaseProduct } from '@/utils/supabase';
import { Booth, Product, Transaction, TransactionStats, CartItem, DateRange } from '@/types';
import seedBooths from '@/utils/seedData';
import { toast } from 'sonner';
import { 
  loadUserFundsTransactions,
  getSACTransactions,
  getTransactionStats,
  processPayment,
  addFunds
} from './transactionService';
import {
  loadBooths,
  loadStudentBooths,
  getBoothById,
  loadBoothProducts,
  loadBoothTransactions
} from './boothService';

// Only retain necessary context types
type TransactionContextType = {
  // Booth management
  booths: Booth[];
  getBoothById: (id: string) => Booth | undefined;
  loadBooths: () => void;
  loadStudentBooths: () => Booth[];
  
  // Product management
  loadBoothProducts: (boothId: string) => Product[];
  
  // Transaction management
  loadBoothTransactions: (boothId: string) => Transaction[];
  loadUserFundsTransactions: () => Transaction[];
  getSACTransactions: () => Transaction[];
  getTransactionStats: (boothId: string, dateRange: DateRange) => TransactionStats;
  
  // Cart management
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  
  // Payment processing
  processPayment: (boothId: string) => Promise<Transaction | null>;
  addFunds: (userId: string, amount: number, sacMemberId: string) => Promise<number>;
  
  // Loading states
  isLoading: boolean;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, updateUserData } = useAuth();
  const [booths, setBooths] = useState<Booth[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Initialize bootsh on component mount
  useEffect(() => {
    if (user) {
      loadBooths();
    }
  }, [user]);

  // Booths management
  const loadBoothsImpl = async () => {
    setIsLoading(true);
    
    try {
      // Get booths from Supabase
      const { data: boothsData, error } = await supabase
        .from('booths')
        .select('*');
      
      if (error) {
        console.error('Error loading booths:', error);
        toast.error('Failed to load booths');
        return;
      }
      
      // Get products for each booth
      const boothsWithProducts: Booth[] = await Promise.all(
        boothsData.map(async (booth) => {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('booth_id', booth.id);
          
          if (productsError) {
            console.error(`Error loading products for booth ${booth.id}:`, productsError);
            return transformDatabaseBooth(booth);
          }
          
          return transformDatabaseBooth(booth, productsData || []);
        })
      );
      
      setBooths(boothsWithProducts);
      
    } catch (error) {
      console.error('Unexpected error loading booths:', error);
      toast.error('Failed to load booths');
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadStudentBoothsImpl = () => {
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
  
  // Product management
  const loadBoothProductsImpl = (boothId: string) => {
    const booth = getBoothByIdImpl(boothId);
    return booth ? booth.products : [];
  };
  
  // Transaction management
  const loadBoothTransactionsImpl = (boothId: string) => {
    const booth = getBoothByIdImpl(boothId);
    return booth ? booth.transactions : [];
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
  const processPaymentImpl = async (boothId: string) => {
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
      const result = await processPayment(user, cart, boothId);
      
      if (result.transaction) {
        // Update user balance after successful payment
        if (user) {
          updateUserData({
            ...user,
            balance: result.newBalance
          });
        }
        
        clearCart();
        toast.success('Purchase successful!');
        return result.transaction;
      } else {
        toast.error(result.error || 'Failed to process payment');
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
  
  const addFundsImpl = async (userId: string, amount: number, sacMemberId: string) => {
    if (!user) {
      toast.error('You must be logged in to add funds');
      return 0;
    }
    
    setIsLoading(true);
    
    try {
      const newBalance = await addFunds(userId, amount, sacMemberId);
      
      // Update user balance if adding funds to self
      if (userId === user.id) {
        updateUserData({
          ...user,
          balance: newBalance
        });
      }
      
      toast.success(`Successfully added $${amount.toFixed(2)} to account`);
      return newBalance;
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        // Booth management
        booths,
        getBoothById: getBoothByIdImpl,
        loadBooths: loadBoothsImpl,
        loadStudentBooths: loadStudentBoothsImpl,
        
        // Product management
        loadBoothProducts: loadBoothProductsImpl,
        
        // Transaction management
        loadBoothTransactions: loadBoothTransactionsImpl,
        loadUserFundsTransactions,
        getSACTransactions,
        getTransactionStats,
        
        // Cart management
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        incrementQuantity,
        decrementQuantity,
        
        // Payment processing
        processPayment: processPaymentImpl,
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
