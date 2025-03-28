
import { Transaction, CartItem, User, PaymentMethod } from '@/types';
import { firestore } from '@/integrations/firebase/client';
import { collection, doc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { transformFirebaseTransaction } from '@/utils/firebase';

export const fetchAllTransactions = async (): Promise<Transaction[]> => {
  try {
    console.log('Fetching all transactions from Firebase');
    const transactionsRef = collection(firestore, 'transactions');
    const q = query(transactionsRef, orderBy('created_at', 'desc'));
    const transactionsSnapshot = await getDocs(q);
    
    if (transactionsSnapshot.empty) {
      return [];
    }
    
    const transactions: Transaction[] = [];
    
    for (const transactionDoc of transactionsSnapshot.docs) {
      const transactionData = transactionDoc.data();
      transactionData.id = transactionDoc.id;
      
      // Fetch transaction products
      const transactionProductsRef = collection(firestore, 'transaction_products');
      const q = query(transactionProductsRef, where('transaction_id', '==', transactionDoc.id));
      const transactionProductsSnapshot = await getDocs(q);
      
      const transactionProducts = transactionProductsSnapshot.docs.map(doc => {
        const productData = doc.data();
        productData.id = doc.id;
        return productData;
      });
      
      // Transform to our Transaction type
      transactions.push(transformFirebaseTransaction(transactionData, transactionProducts));
    }
    
    console.log('Transactions data received:', transactions.length, 'records');
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast.error('Failed to load transactions');
    return [];
  }
};

export const loadUserTransactions = (transactions: Transaction[], userId: string): Transaction[] => {
  return transactions.filter(t => t.buyerId === userId);
};

export const addFunds = async (
  userId: string, 
  amount: number, 
  sacMemberId: string
): Promise<{ success: boolean, transaction?: Transaction, updatedBalance?: number }> => {
  try {
    console.log("Starting addFunds process:", { amount, userId, sacMemberId });
    
    // Fetch the current user data to get their existing balance
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error("User not found with ID:", userId);
      toast.error('User not found');
      return { success: false };
    }
    
    const userData = userSnap.data();
    console.log("User data fetched:", userData);
    
    // Convert dollars to cents for storage in Firestore
    const amountInCents = Math.round(amount * 100);
    
    // Calculate the new balance
    const currentBalance = userData.tickets || 0;
    const newBalance = currentBalance + amountInCents;
    console.log("Balance calculation:", { 
      currentBalance, 
      amountToAdd: amountInCents, 
      newBalance,
      studentNumber: userData.student_number
    });
    
    // Update the user's balance
    await updateDoc(userRef, {
      tickets: newBalance
    });
    
    console.log("User balance updated to:", newBalance);
    
    // Now create the transaction record
    const transactionsRef = collection(firestore, 'transactions');
    const transactionData = {
      student_id: userId,
      student_name: userData.name,
      amount: amountInCents,
      type: amount >= 0 ? 'fund' : 'refund',
      sac_member: sacMemberId,
      created_at: new Date().toISOString()
    };
    
    const transactionRef = await addDoc(transactionsRef, transactionData);
    
    console.log("Transaction record created with ID:", transactionRef.id);
    
    // Verify the update was successful by fetching the user again
    const updatedUserSnap = await getDoc(userRef);
    const updatedUserData = updatedUserSnap.data();
    
    if (updatedUserData.tickets !== newBalance) {
      console.error("Balance mismatch after update!", {
        expected: newBalance,
        actual: updatedUserData.tickets
      });
      
      // Try one more time to ensure the balance is correct
      console.log("Trying one more time to update balance");
      await updateDoc(userRef, {
        tickets: newBalance
      });
    }
    
    // Add the new transaction to the local state
    const newTransaction: Transaction = {
      id: transactionRef.id,
      timestamp: new Date().getTime(),
      buyerId: userId,
      buyerName: userData.name,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'fund' : 'refund',
      paymentMethod: 'cash',
      sacMemberId,
      sacMemberName: undefined
    };
    
    toast.success(`${amount >= 0 ? 'Added' : 'Refunded'} $${Math.abs(amount).toFixed(2)} ${amount >= 0 ? 'to' : 'from'} ${userData.name}'s account`);
    console.log("Funds processed successfully:", newTransaction);
    
    return { 
      success: true, 
      transaction: newTransaction, 
      updatedBalance: newBalance / 100 // Convert back to dollars for UI
    };
  } catch (error) {
    console.error('Error processing funds:', error);
    toast.error('Failed to process funds: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return { success: false };
  }
};

export const processPurchase = async (
  boothId: string,
  buyerId: string,
  buyerName: string,
  sellerId: string,
  sellerName: string,
  cartItems: CartItem[],
  boothName: string
): Promise<{ success: boolean, transaction?: Transaction }> => {
  if (cartItems.length === 0) {
    toast.error('Cart is empty');
    return { success: false };
  }
  
  try {
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (item.product.price * item.quantity),
      0
    );
    
    const totalAmountInCents = Math.round(totalAmount * 100);
    
    console.log('Processing purchase:', {
      boothId,
      buyerId,
      buyerName,
      totalAmount,
      totalAmountInCents,
      cartItems: cartItems.length
    });
    
    // Fetch current user balance
    const userRef = doc(firestore, 'users', buyerId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('User not found with ID:', buyerId);
      toast.error('User not found');
      return { success: false };
    }
    
    const userData = userSnap.data();
    console.log('User current balance:', (userData.tickets || 0) / 100);
    
    if ((userData.tickets || 0) < totalAmountInCents) {
      console.error('Insufficient balance:', {
        currentBalance: (userData.tickets || 0) / 100,
        requiredAmount: totalAmount
      });
      toast.error('Insufficient balance');
      return { success: false };
    }
    
    const newBalance = (userData.tickets || 0) - totalAmountInCents;
    console.log('Calculated new balance:', newBalance / 100);
    
    // Update the user's balance
    await updateDoc(userRef, {
      tickets: newBalance
    });
    
    console.log('User balance updated to:', newBalance / 100);
    
    // Verify the user balance was updated correctly
    const updatedUserSnap = await getDoc(userRef);
    const updatedUserData = updatedUserSnap.data();
    
    if (updatedUserData.tickets !== newBalance) {
      console.error('Balance verification failed:', {
        expected: newBalance / 100,
        actual: updatedUserData.tickets / 100
      });
      
      // If verification failed, try one more time to update the balance
      console.log('Trying one more time to update balance');
      await updateDoc(userRef, {
        tickets: newBalance
      });
    }
    
    // Now create the transaction record
    const transactionsRef = collection(firestore, 'transactions');
    const transactionData = {
      student_id: buyerId,
      student_name: buyerName,
      booth_id: boothId,
      booth_name: boothName,
      amount: totalAmountInCents,
      type: 'purchase',
      created_at: new Date().toISOString()
    };
    
    const transactionRef = await addDoc(transactionsRef, transactionData);
    console.log('Transaction record created with ID:', transactionRef.id);
    
    // Create transaction products records
    const transactionProductsRef = collection(firestore, 'transaction_products');
    
    for (const item of cartItems) {
      await addDoc(transactionProductsRef, {
        transaction_id: transactionRef.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: Math.round(item.product.price * 100)
      });
    }
    
    console.log('Transaction products recorded:', cartItems.length);
    
    // Finally update booth sales
    const boothRef = doc(firestore, 'booths', boothId);
    const boothSnap = await getDoc(boothRef);
    
    if (boothSnap.exists()) {
      const boothData = boothSnap.data();
      const currentSales = boothData.sales || 0;
      const newSales = currentSales + totalAmountInCents;
      
      await updateDoc(boothRef, {
        sales: newSales
      });
      
      console.log('Booth sales updated:', {
        previousSales: currentSales / 100,
        newSales: newSales / 100
      });
    }
    
    // Do one final verification check of the user's balance
    const finalCheckSnap = await getDoc(userRef);
    const finalCheckData = finalCheckSnap.data();
    
    if (finalCheckData && finalCheckData.tickets !== newBalance) {
      console.error('Final balance check failed:', {
        expected: newBalance / 100,
        actual: finalCheckData.tickets / 100
      });
      // Make one last attempt to ensure the balance is correct
      console.log('Making final attempt to ensure correct balance');
      await updateDoc(userRef, {
        tickets: newBalance
      });
    }
    
    const newTransaction: Transaction = {
      id: transactionRef.id,
      timestamp: new Date().getTime(),
      buyerId,
      buyerName,
      sellerId,
      sellerName,
      boothId,
      boothName,
      products: cartItems.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price
      })),
      amount: totalAmount,
      type: 'purchase'
    };
    
    toast.success('Purchase successful!');
    return { success: true, transaction: newTransaction };
  } catch (error) {
    console.error('Error processing purchase:', error);
    toast.error('Failed to process purchase: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return { success: false };
  }
};

