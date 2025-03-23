
import { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { CartItem, Transaction } from '@/types';
import { toast } from 'sonner';
import { processPurchase, addFunds } from '../transactionService';

export interface UsePaymentProcessingReturn {
  processPayment: (boothId: string, cart: CartItem[], getBoothById: (id: string) => any, updateTransactions: (tx: Transaction) => void) => Promise<Transaction | null>;
  processPurchase: (
    boothId: string,
    buyerId: string,
    buyerName: string,
    sellerId: string,
    sellerName: string,
    cartItems: CartItem[],
    boothName: string
  ) => Promise<{ success: boolean, transaction?: Transaction }>;
  addFunds: (userId: string, amount: number, sacMemberId: string) => Promise<{ success: boolean, updatedBalance?: number }>;
  isLoading: boolean;
}

export const usePaymentProcessing = (): UsePaymentProcessingReturn => {
  const { user, updateUserData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const processPayment = async (
    boothId: string, 
    cart: CartItem[], 
    getBoothById: (id: string) => any,
    updateTransactions: (tx: Transaction) => void
  ) => {
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
      const booth = getBoothById(boothId);
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
          updateTransactions(result.transaction);
        }
        
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
  
  const addFundsImpl = async (userId: string, amount: number, sacMemberId: string): Promise<{ success: boolean, updatedBalance?: number }> => {
    if (!user) {
      toast.error('You must be logged in to add funds');
      return { success: false };
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
            balance: result.updatedBalance / 100
          });
        }
        
        toast.success(`Successfully added $${amount.toFixed(2)} to account`);
        return { success: true, updatedBalance: result.updatedBalance };
      } else {
        toast.error('Failed to add funds');
        return { success: false };
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    processPayment,
    processPurchase,
    addFunds: addFundsImpl,
    isLoading
  };
};
