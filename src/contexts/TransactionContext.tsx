import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Booth, Product, CartItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface TransactionContextType {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  loadUserTransactions: (userId: string) => Transaction[];
  loadBoothTransactions: (boothId: string) => Transaction[];
  addFunds: (amount: number, studentId: string, paymentMethod: 'cash' | 'card', sacMemberId: string, sacMemberName: string) => Promise<boolean>;
  processPurchase: (boothId: string, buyerId: string, buyerName: string, sellerId: string, sellerName: string, cartItems: CartItem[], boothName: string) => Promise<boolean>;
  getBoothById: (boothId: string) => Booth | undefined;
  getBoothsByUserId: (userId: string) => Booth[];
  createBooth: (name: string, description: string, pin: string, userId: string) => Promise<string | null>;
  addProductToBooth: (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
  getLeaderboard: () => { boothId: string; boothName: string; earnings: number }[];
  fetchAllTransactions: () => Promise<void>;
  fetchAllBooths: () => Promise<void>;
}

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
      ]).finally(() => setIsLoading(false));
    }
  }, [user]);

  const fetchAllTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_products(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
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

        setTransactions(formattedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    }
  };

  const fetchAllBooths = async () => {
    try {
      const { data: boothsData, error: boothsError } = await supabase
        .from('booths')
        .select('*');

      if (boothsError) {
        throw boothsError;
      }

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');

      if (productsError) {
        throw productsError;
      }

      if (boothsData) {
        const formattedBooths: Booth[] = boothsData.map(b => {
          const boothProducts = productsData?.filter(p => p.booth_id === b.id) || [];
          
          return {
            id: b.id,
            name: b.name,
            description: b.description || '',
            pin: b.pin,
            products: boothProducts.map(p => ({
              id: p.id,
              name: p.name,
              price: p.price / 100,
              boothId: p.booth_id,
              salesCount: 0
            })),
            managers: b.members || [],
            totalEarnings: b.sales / 100,
            transactions: []
          };
        });

        setBooths(formattedBooths);
      }
    } catch (error) {
      console.error('Error fetching booths:', error);
      toast.error('Failed to load booths');
    }
  };

  const loadUserTransactions = (userId: string) => {
    return transactions.filter(t => t.buyerId === userId);
  };

  const loadBoothTransactions = (boothId: string) => {
    return transactions.filter(t => t.boothId === boothId);
  };

  const addFunds = async (
    amount: number, 
    studentId: string, 
    paymentMethod: 'cash' | 'card',
    sacMemberId: string,
    sacMemberName: string
  ) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tickets, name')
        .eq('id', studentId)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      const amountInCents = Math.round(amount * 100);
      const newBalance = (userData.tickets || 0) + amountInCents;
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ tickets: newBalance })
        .eq('id', studentId);
      
      if (updateError) {
        throw updateError;
      }
      
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          student_id: studentId,
          student_name: userData.name,
          amount: amountInCents,
          type: 'fund',
          sac_member: sacMemberName
        })
        .select()
        .single();
      
      if (transactionError) {
        throw transactionError;
      }
      
      const newTransaction: Transaction = {
        id: transactionData.id,
        timestamp: new Date(transactionData.created_at).getTime(),
        buyerId: studentId,
        buyerName: userData.name,
        amount: amount,
        type: 'fund',
        paymentMethod,
        sacMemberId,
        sacMemberName
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      
      return true;
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
      return false;
    }
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
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return false;
    }
    
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
      return false;
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
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    setBooths(prev => 
      prev.map(booth => {
        if (booth.id === boothId) {
          return {
            ...booth,
            totalEarnings: booth.totalEarnings + totalAmount,
            transactions: [newTransaction, ...(booth.transactions || [])]
          };
        }
        return booth;
      })
    );
    
    return true;
  };

  const getBoothById = (boothId: string) => {
    return booths.find(b => b.id === boothId);
  };

  const getBoothsByUserId = (userId: string) => {
    return booths.filter(booth => booth.managers.includes(userId));
  };

  const createBooth = async (name: string, description: string, pin: string, userId: string) => {
    try {
      console.log("Creating booth:", { name, description, pin, userId });
      
      // Insert the new booth
      const { data, error } = await supabase
        .from('booths')
        .insert({
          name,
          description,
          pin,
          members: [userId],
          sales: 0
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating booth:", error);
        throw error;
      }
      
      if (!data) {
        console.error("No data returned from booth creation");
        throw new Error("Failed to create booth");
      }
      
      console.log("Booth created:", data);
      
      // Update user's booth access
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('booth_access')
        .eq('id', userId)
        .single();
      
      if (userError) {
        console.error("Error fetching user booth access:", userError);
        throw userError;
      }
      
      const updatedBoothAccess = [...(userData.booth_access || []), data.id];
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ booth_access: updatedBoothAccess })
        .eq('id', userId);
      
      if (updateError) {
        console.error("Error updating user booth access:", updateError);
        throw updateError;
      }
      
      // Add the new booth to local state
      const newBooth: Booth = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        pin: data.pin,
        products: [],
        managers: [userId],
        totalEarnings: 0,
        transactions: []
      };
      
      setBooths(prev => [...prev, newBooth]);
      console.log("Booth added to local state:", newBooth);
      
      return data.id;
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth');
      return null;
    }
  };

  const addProductToBooth = async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => {
    try {
      const priceInCents = Math.round(product.price * 100);
      
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: product.name,
          price: priceInCents,
          booth_id: boothId,
          image: product.image
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      const newProduct: Product = {
        id: data.id,
        name: data.name,
        price: data.price / 100,
        boothId: data.booth_id,
        image: data.image,
        salesCount: 0
      };
      
      setBooths(prev => 
        prev.map(booth => {
          if (booth.id === boothId) {
            return {
              ...booth,
              products: [...booth.products, newProduct]
            };
          }
          return booth;
        })
      );
      
      return true;
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
      return false;
    }
  };

  const removeProductFromBooth = async (boothId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('booth_id', boothId);
      
      if (error) {
        throw error;
      }
      
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
      
      return true;
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Failed to remove product');
      return false;
    }
  };

  const getLeaderboard = () => {
    const boothEarnings = booths.map(booth => ({
      boothId: booth.id,
      boothName: booth.name,
      earnings: booth.totalEarnings
    }));
    
    return boothEarnings.sort((a, b) => b.earnings - a.earnings);
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
