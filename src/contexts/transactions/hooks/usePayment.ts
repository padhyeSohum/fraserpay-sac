
import { useState } from 'react';
import { CartItem, PaymentMethod } from '@/types';
import { toast } from 'sonner';

export interface UsePaymentReturn {
  processPayment: (paymentMethod: PaymentMethod) => Promise<boolean>;
  isProcessing: boolean;
}

export const usePayment = (
  cart: CartItem[], 
  total: number, 
  clearCart: () => void
): UsePaymentReturn => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = async (paymentMethod: PaymentMethod): Promise<boolean> => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return false;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success
      toast.success(`Payment of $${total.toFixed(2)} processed successfully`);
      clearCart();
      return true;
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Payment processing failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processPayment,
    isProcessing
  };
};
