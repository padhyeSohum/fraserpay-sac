import { Transaction, CartItem, User, PaymentMethod } from '@/types';
import { firestore } from '@/integrations/firebase/client';
import { collection, doc, getDoc, getDocs, query, where, orderBy, addDoc, updateDoc, increment, serverTimestamp, limit } from 'firebase/firestore';
import { toast } from 'sonner';
import { transformFirebaseTransaction } from '@/utils/firebase';
import { getVersionedStorageItem, setVersionedStorageItem } from '@/utils/storageManager';
import { backend } from '@/utils/backend';

export const fetchAllTransactions = async (forceRefresh = false): Promise<Transaction[]> => {
  try {
    // console.log('Fetching all transactions from Firebase');
    
    // Check if we have cached data first
    const cachedTransactions = getVersionedStorageItem<Transaction[]>('allTransactions', []);
    const lastFetchTime = getVersionedStorageItem<number>('lastTransactionsFetch', 0);
    const now = Date.now();
    const cacheStaleTime = 1 * 60 * 1000; // Reduced to 1 minute for more frequent updates
    
    // Use cache if it's fresh enough
    if (!forceRefresh && cachedTransactions.length > 0 && now - lastFetchTime < cacheStaleTime) {
    //   console.log('Using cached transactions:', cachedTransactions.length, 'records');
      return cachedTransactions;
    }
    
    // Otherwise fetch from Firebase - limit to 100 most recent transactions
    const transactionsRef = collection(firestore, 'transactions');
    const q = query(transactionsRef, orderBy('created_at', 'desc'), limit(100));
    const transactionsSnapshot = await getDocs(q);
    
    if (transactionsSnapshot.empty) {
      console.log('No transactions found in Firebase');
      return [];
    }
    
    const transactions: Transaction[] = [];
    
    // Get all transaction documents first
    const transactionDocs = transactionsSnapshot.docs;
    
    // Then prepare one query for all transaction products
    const allTransactionIds = transactionDocs.map(doc => doc.id);
    const transactionProductsRef = collection(firestore, 'transaction_products');
    
    // Batch transaction product fetching to reduce reads
    // Firebase has a limit of 10 'in' clauses per query
    const batchSize = 10;
    const productsByTransactionId: Record<string, any[]> = {};
    
    for (let i = 0; i < allTransactionIds.length; i += batchSize) {
      const batchIds = allTransactionIds.slice(i, i + batchSize);
      if (batchIds.length > 0) {
        const batchQuery = query(
          transactionProductsRef, 
          where('transaction_id', 'in', batchIds)
        );
        const productsSnapshot = await getDocs(batchQuery);
        
        productsSnapshot.docs.forEach(doc => {
          const productData = doc.data();
          productData.id = doc.id;
          
          if (!productsByTransactionId[productData.transaction_id]) {
            productsByTransactionId[productData.transaction_id] = [];
          }
          
          productsByTransactionId[productData.transaction_id].push(productData);
        });
      }
    }
    
    // Now map through transaction docs and add their products
    for (const transactionDoc of transactionDocs) {
      const transactionData = transactionDoc.data();
      transactionData.id = transactionDoc.id;
      
      // Get transaction products from our batched results
      const transactionProducts = productsByTransactionId[transactionDoc.id] || [];
      
      // Transform to our Transaction type and ensure valid timestamp
      const transformedTransaction = transformFirebaseTransaction(transactionData, transactionProducts);
      
      // Ensure timestamp is valid (use current time if missing or invalid)
      if (!transformedTransaction.timestamp || isNaN(transformedTransaction.timestamp)) {
        transformedTransaction.timestamp = Date.now();
        console.log(`Fixed invalid timestamp for transaction: ${transformedTransaction.id}`);
      }
      
      transactions.push(transformedTransaction);
    }
    
    // Cache the result
    setVersionedStorageItem('allTransactions', transactions, cacheStaleTime);
    setVersionedStorageItem('lastTransactionsFetch', now);
    
    // console.log('Transactions data received:', transactions.length, 'records');
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast.error('Failed to load transactions');
    
    // Return cached data on error if available
    return getVersionedStorageItem<Transaction[]>('allTransactions', []);
  }
};

export const loadUserTransactions = (transactions: Transaction[], userId: string): Transaction[] => {
  return transactions.filter(t => t.buyerId === userId);
};

export const fetchBoothTransactions = async (boothId: string): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(firestore, 'transactions');
    const q = query(transactionsRef, where('booth_id', '==', boothId));
    const snap = await getDocs(q);

    const transactions: Transaction[] = snap.docs.map(docSnap => {
      const data = { id: docSnap.id, ...docSnap.data() };
      const tx = transformFirebaseTransaction(data);
      if (!tx.timestamp || isNaN(tx.timestamp)) tx.timestamp = Date.now();
      return tx;
    });

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching booth transactions:', error);
    return [];
  }
};

export const fetchUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(firestore, 'transactions');

    // Query by student_id (used by fund/refund/purchase flows)
    const byStudentId = query(transactionsRef, where('student_id', '==', userId));
    // Query by buyer_id (used by TransactionContext processPurchase)
    const byBuyerId = query(transactionsRef, where('buyer_id', '==', userId));

    const [studentSnap, buyerSnap] = await Promise.all([
      getDocs(byStudentId),
      getDocs(byBuyerId),
    ]);

    const seenIds = new Set<string>();
    const transactions: Transaction[] = [];

    for (const docSnap of [...studentSnap.docs, ...buyerSnap.docs]) {
      if (seenIds.has(docSnap.id)) continue;
      seenIds.add(docSnap.id);
      const data = { id: docSnap.id, ...docSnap.data() };
      const tx = transformFirebaseTransaction(data);
      if (!tx.timestamp || isNaN(tx.timestamp)) tx.timestamp = Date.now();
      transactions.push(tx);
    }

    return transactions.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return [];
  }
};

export const addFunds = async (
  userId: string, 
  amount: number, 
  sacMemberId: string
): Promise<{ success: boolean, transaction?: Transaction, updatedBalance?: number }> => {
  try {
    const result = await backend.adjustFunds(userId, amount);

    const newTransaction: Transaction = {
      id: result.transactionId,
      timestamp: new Date().getTime(),
      buyerId: userId,
      buyerName: result.studentName,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'fund' : 'refund',
      paymentMethod: 'cash',
      sacMemberId,
      sacMemberName: undefined
    };
    
    toast.success(`${amount >= 0 ? 'Added' : 'Refunded'} $${Math.abs(amount).toFixed(2)} ${amount >= 0 ? 'to' : 'from'} ${result.studentName}'s account`);
    
    return { 
      success: true, 
      transaction: newTransaction, 
      updatedBalance: result.updatedBalance
    };
  } catch (error) {
    console.error('Error processing funds:', error);
    toast.error('Failed to process funds: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return { success: false };
  }
};

export const addPoints = async (
    userId: string,
    amount: number,
    sacMemberId: string,
    reason: string
): Promise<{ success: boolean, transaction?: Transaction, updatedPoints?: number }> => {
    try {
        const result = await backend.adjustPoints(userId, amount, reason);

        // Add the new points transaction to the local state
        const newPointsTransaction: Transaction = {
            id: result.transactionId,
            timestamp: new Date().getTime(),
            buyerId: userId,
            buyerName: result.studentName,
            amount: amount,
            type: amount >= 0 ? 'addPoints' : 'redeemPoints',
            sacMemberId,
        };

        toast.success(`${amount >= 0 ? 'Added' : 'Redeemed'} ${Math.abs(amount)} points ${amount >= 0 ? 'to' : 'from'} ${result.studentName}'s account`);

        return {
            success: true,
            transaction: newPointsTransaction,
            updatedPoints: result.updatedPoints
        };
    } catch (error) {
        console.error('Error processing points:', error);
        toast.error('Failed to process points: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
    const normalizedSellerId = sellerId.trim();
    const normalizedSellerName = sellerName.trim();

    if (!normalizedSellerId || !normalizedSellerName) {
      toast.error('Seller ID and seller name are required to complete a booth sale');
      return { success: false };
    }

    const totalAmountInCents = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const totalAmount = parseFloat((totalAmountInCents/100).toFixed(2));

    const result = await backend.processPurchase(boothId, buyerId, normalizedSellerName, cartItems);
    
    const newTransaction: Transaction = {
      id: result.transactionId,
      timestamp: new Date().getTime(),
      buyerId,
      buyerName,
      sellerId: normalizedSellerId,
      sellerName: normalizedSellerName,
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
