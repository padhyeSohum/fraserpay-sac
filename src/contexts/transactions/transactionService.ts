
import { Transaction, CartItem, User, PaymentMethod } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchAllTransactions = async (): Promise<Transaction[]> => {
  try {
    console.log('Fetching all transactions from Supabase');
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        transaction_products(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    if (data) {
      console.log('Transactions data received:', data.length, 'records');
      const formattedTransactions: Transaction[] = data.map(t => ({
        id: t.id,
        timestamp: new Date(t.created_at).getTime(),
        buyerId: t.student_id,
        buyerName: t.student_name,
        sellerId: t.booth_id || undefined,
        sellerName: undefined,
        boothId: t.booth_id || undefined,
        boothName: t.booth_name || undefined,
        products: t.transaction_products?.map(p => ({
          productId: p.product_id,
          productName: p.product_name,
          quantity: p.quantity,
          price: p.price / 100
        })) || [],
        amount: t.amount / 100,  // Convert cents to dollars
        type: t.type as 'purchase' | 'fund' | 'refund',
        paymentMethod: t.type === 'fund' ? 'cash' : undefined,
        sacMemberId: t.sac_member || undefined,
        sacMemberName: undefined
      }));

      return formattedTransactions;
    }
    return [];
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tickets, name, student_number')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error("Error fetching user:", userError);
      toast.error('User not found');
      return { success: false };
    }
    
    console.log("User data fetched:", userData);
    
    // Convert dollars to cents for storage in database
    const amountInCents = Math.round(amount * 100);
    
    // Calculate the new balance
    const newBalance = (userData.tickets || 0) + amountInCents;
    console.log("Balance calculation:", { 
      currentBalance: userData.tickets || 0, 
      amountToAdd: amountInCents, 
      newBalance,
      studentNumber: userData.student_number
    });
    
    // Start a transaction to ensure atomicity of the operations
    // First, update the user's balance in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ tickets: newBalance })
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating user balance:", updateError);
      toast.error('Failed to update balance');
      return { success: false };
    }
    
    console.log("User balance updated to:", newBalance);
    
    // Now create the transaction record
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        student_id: userId,
        student_name: userData.name,
        amount: amountInCents,
        type: amount >= 0 ? 'fund' : 'refund',
        sac_member: sacMemberId
      })
      .select()
      .single();
    
    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      toast.error('Failed to record transaction');
      
      // If transaction recording fails, we should still return success since the balance was updated
      // but log this issue for reconciliation
      console.warn("Balance updated but transaction recording failed:", {
        userId,
        amount,
        newBalance
      });
      
      return { 
        success: true, 
        updatedBalance: newBalance / 100 // Convert back to dollars for UI
      };
    }
    
    console.log("Transaction record created:", transactionData);
    
    // Verify the update was successful by fetching the user again
    const { data: updatedUser, error: verifyError } = await supabase
      .from('users')
      .select('tickets, name')
      .eq('id', userId)
      .single();
      
    if (verifyError) {
      console.error("Error verifying balance update:", verifyError);
      console.warn('Balance updated but verification failed');
    } else {
      console.log("Balance update verified:", {
        previousBalance: userData.tickets || 0,
        newBalance: updatedUser.tickets,
        expectedBalance: newBalance
      });
      
      if (updatedUser.tickets !== newBalance) {
        console.error("Balance mismatch after update!", {
          expected: newBalance,
          actual: updatedUser.tickets
        });
      }
    }
    
    // Add the new transaction to the local state
    const newTransaction: Transaction = {
      id: transactionData.id,
      timestamp: new Date(transactionData.created_at).getTime(),
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
      updatedBalance: updatedUser ? updatedUser.tickets / 100 : newBalance / 100 // Convert back to dollars for UI
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tickets')
      .eq('id', buyerId)
      .single();
    
    if (userError) {
      console.error('Error fetching user balance:', userError);
      toast.error('Could not verify user balance');
      return { success: false };
    }
    
    console.log('User current balance:', userData.tickets / 100);
    
    if (userData.tickets < totalAmountInCents) {
      console.error('Insufficient balance:', {
        currentBalance: userData.tickets / 100,
        requiredAmount: totalAmount
      });
      toast.error('Insufficient balance');
      return { success: false };
    }
    
    const newBalance = userData.tickets - totalAmountInCents;
    
    // Update user balance first
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ tickets: newBalance })
      .eq('id', buyerId);
    
    if (updateUserError) {
      console.error('Error updating user balance:', updateUserError);
      toast.error('Failed to update user balance');
      return { success: false };
    }
    
    console.log('User balance updated to:', newBalance / 100);
    
    // Update booth sales
    const { data: boothData, error: boothError } = await supabase
      .from('booths')
      .select('sales')
      .eq('id', boothId)
      .single();
    
    if (boothError) {
      console.error('Error fetching booth sales:', boothError);
      // Continue anyway as this is not critical to the user experience
    }
    
    const currentSales = boothData?.sales || 0;
    const newSales = currentSales + totalAmountInCents;
    
    const { error: updateBoothError } = await supabase
      .from('booths')
      .update({ sales: newSales })
      .eq('id', boothId);
    
    if (updateBoothError) {
      console.error('Error updating booth sales:', updateBoothError);
      // Continue anyway as this is not critical to the user experience
    } else {
      console.log('Booth sales updated:', {
        previousSales: currentSales / 100,
        newSales: newSales / 100
      });
    }
    
    // Create transaction record
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        student_id: buyerId,
        student_name: buyerName,
        booth_id: boothId,
        booth_name: boothName,
        amount: totalAmountInCents,
        type: 'purchase'
      })
      .select()
      .single();
    
    if (transactionError) {
      console.error('Error creating transaction record:', transactionError);
      toast.error('Failed to record transaction');
      
      // If transaction recording fails but balance was updated, we should return success
      // but log this issue for reconciliation
      console.warn("Balance updated but transaction recording failed:", {
        buyerId,
        amount: totalAmount,
        newBalance: newBalance / 100
      });
      
      return { success: true };
    }
    
    console.log('Transaction record created:', transactionData);
    
    // Create transaction products records
    const transactionProducts = cartItems.map(item => ({
      transaction_id: transactionData.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      price: Math.round(item.product.price * 100)
    }));
    
    const { error: productsError } = await supabase
      .from('transaction_products')
      .insert(transactionProducts);
    
    if (productsError) {
      console.error('Error creating transaction products records:', productsError);
      // Continue anyway as the main transaction record was created
    } else {
      console.log('Transaction products recorded:', transactionProducts.length);
    }
    
    // Verify the balance update by fetching the user again
    const { data: verifiedUser, error: verifyError } = await supabase
      .from('users')
      .select('tickets')
      .eq('id', buyerId)
      .single();
    
    if (verifyError) {
      console.error('Error verifying balance update:', verifyError);
    } else if (verifiedUser.tickets !== newBalance) {
      console.error('Balance verification failed:', {
        expected: newBalance / 100,
        actual: verifiedUser.tickets / 100
      });
    } else {
      console.log('Balance verification successful:', verifiedUser.tickets / 100);
    }
    
    const newTransaction: Transaction = {
      id: transactionData.id,
      timestamp: new Date(transactionData.created_at).getTime(),
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
