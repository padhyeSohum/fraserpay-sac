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
        amount: t.amount / 100,
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
    
    // Create a transaction record first to ensure it's created even if the balance update fails
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
      return { success: false };
    }
    
    console.log("Transaction record created:", transactionData);
    
    // Now update the user's balance in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ tickets: newBalance })
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating user balance:", updateError);
      toast.error('Failed to update balance');
      return { success: false };
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
    
    // Verify the update was successful by fetching the user again
    const { data: updatedUser, error: verifyError } = await supabase
      .from('users')
      .select('tickets, name')
      .eq('id', userId)
      .single();
      
    if (verifyError) {
      console.error("Error verifying balance update:", verifyError);
      toast.error('Balance updated but verification failed');
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
        toast.error('Balance may not have updated correctly');
      }
    }
    
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
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tickets')
      .eq('id', buyerId)
      .single();
    
    if (userError) {
      throw userError;
    }
    
    if (userData.tickets < totalAmountInCents) {
      toast.error('Insufficient balance');
      return { success: false };
    }
    
    const newBalance = userData.tickets - totalAmountInCents;
    
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ tickets: newBalance })
      .eq('id', buyerId);
    
    if (updateUserError) {
      throw updateUserError;
    }
    
    const { data: boothData, error: boothError } = await supabase
      .from('booths')
      .select('sales')
      .eq('id', boothId)
      .single();
    
    if (boothError) {
      throw boothError;
    }
    
    const newSales = (boothData.sales || 0) + totalAmountInCents;
    
    const { error: updateBoothError } = await supabase
      .from('booths')
      .update({ sales: newSales })
      .eq('id', boothId);
    
    if (updateBoothError) {
      throw updateBoothError;
    }
    
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
      throw transactionError;
    }
    
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
      throw productsError;
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
    
    return { success: true, transaction: newTransaction };
  } catch (error) {
    console.error('Error processing purchase:', error);
    toast.error('Failed to process purchase: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return { success: false };
  }
};
