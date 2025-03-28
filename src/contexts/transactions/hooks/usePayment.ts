
import { useState } from 'react';
import { toast } from 'sonner';
import { firestore } from '@/integrations/firebase/client';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  collection,
  serverTimestamp
} from 'firebase/firestore';

export const usePayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processPayment = async (
    userId: string, 
    amount: number, 
    description: string
  ) => {
    if (isProcessing) return false;
    
    setIsProcessing(true);
    
    try {
      // Get current user balance
      const userRef = doc(firestore, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        toast.error('User not found');
        return false;
      }
      
      const userData = userSnap.data();
      const currentBalance = userData.tickets || 0;
      const amountInCents = Math.round(amount * 100);
      
      // Check if user has enough balance
      if (currentBalance < amountInCents) {
        toast.error('Insufficient balance');
        return false;
      }
      
      // Update user balance
      await updateDoc(userRef, {
        tickets: currentBalance - amountInCents,
        updated_at: serverTimestamp()
      });
      
      // Record transaction
      await addDoc(collection(firestore, 'transactions'), {
        user_id: userId,
        amount: -amount,
        description,
        created_at: serverTimestamp(),
        type: 'payment'
      });
      
      toast.success(`Payment of $${amount.toFixed(2)} processed successfully`);
      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment processing failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return { processPayment, isProcessing };
};
