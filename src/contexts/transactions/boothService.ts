
import { User, Booth, Product, Transaction } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { transformDatabaseBooth, transformDatabaseProduct } from '@/utils/supabase';

export const findUserByStudentNumber = async (studentNumber: string): Promise<User | null> => {
  try {
    // Simulate fetching user data from a database
    // Replace this with your actual data fetching logic
    const mockUsers: User[] = [
      {
        id: '1',
        studentNumber: '12345',
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'student',
        balance: 100,
        favoriteProducts: [],
        booths: []
      },
      {
        id: '2',
        studentNumber: '67890',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'student',
        balance: 50,
        favoriteProducts: [],
        booths: []
      },
    ];

    const user = mockUsers.find(u => u.studentNumber === studentNumber) || null;
    return user;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
};

export const addProductToBooth = async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>): Promise<boolean> => {
  try {
    // Simulate adding a product to a booth in a database
    // Replace this with your actual data updating logic
    console.log(`Adding product ${product.name} to booth ${boothId}`);
    return true;
  } catch (error) {
    console.error('Error adding product to booth:', error);
    return false;
  }
};

// Implementing the missing function for fetchAllBooths
export const fetchAllBooths = async (): Promise<Booth[]> => {
  try {
    console.log('Fetching all booths from Supabase');
    const { data, error } = await supabase
      .from('booths')
      .select('*');
    
    if (error) {
      console.error('Error fetching booths:', error);
      toast.error('Failed to load booths');
      return [];
    }
    
    if (!data) return [];
    
    // Map Supabase data to our Booth type
    return data.map(booth => ({
      id: booth.id,
      name: booth.name,
      description: booth.description,
      pin: booth.pin,
      managers: booth.members || [],
      products: [],
      totalEarnings: booth.sales ? booth.sales / 100 : 0,
      transactions: []
    }));
  } catch (error) {
    console.error('Error in fetchAllBooths:', error);
    toast.error('Failed to fetch booths');
    return [];
  }
};

// Implementing the missing function for getBoothById
export const getBoothById = async (id: string): Promise<Booth | null> => {
  try {
    const { data, error } = await supabase
      .from('booths')
      .select('*, products(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching booth by ID:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Map Supabase data to our Booth type
    const products = data.products ? data.products.map((product: any) => ({
      id: product.id,
      name: product.name,
      price: product.price / 100,
      boothId: product.booth_id,
      image: product.image,
      salesCount: 0
    })) : [];
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      pin: data.pin,
      products,
      managers: data.members || [],
      totalEarnings: data.sales ? data.sales / 100 : 0,
      transactions: []
    };
  } catch (error) {
    console.error('Error in getBoothById:', error);
    return null;
  }
};

// Implementing the missing function for getBoothsByUserId
export const getBoothsByUserId = async (userId: string): Promise<Booth[]> => {
  try {
    const { data, error } = await supabase
      .from('booths')
      .select('*')
      .contains('members', [userId]);
    
    if (error) {
      console.error('Error fetching booths by user ID:', error);
      return [];
    }
    
    if (!data) return [];
    
    // Map Supabase data to our Booth type
    return data.map(booth => ({
      id: booth.id,
      name: booth.name,
      description: booth.description || '',
      pin: booth.pin,
      managers: booth.members || [],
      products: [],
      totalEarnings: booth.sales ? booth.sales / 100 : 0,
      transactions: []
    }));
  } catch (error) {
    console.error('Error in getBoothsByUserId:', error);
    return [];
  }
};

// Implementing the missing function for createBooth
export const createBooth = async (name: string, description: string, userId: string, customPin?: string): Promise<string | null> => {
  try {
    // Generate a PIN if not provided
    const pin = customPin || Math.floor(1000 + Math.random() * 9000).toString();
    
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
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth');
      return null;
    }
    
    console.log('Booth created:', data);
    return data.id;
  } catch (error) {
    console.error('Error in createBooth:', error);
    toast.error('Failed to create booth');
    return null;
  }
};

// Implementing the missing function for getAllTransactions
export const getAllTransactions = async (): Promise<Transaction[]> => {
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
      toast.error('Failed to load transactions');
      return [];
    }

    if (!data) return [];

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
  } catch (error) {
    console.error('Error fetching transactions:', error);
    toast.error('Failed to load transactions');
    return [];
  }
};

// Implementing the missing function for getLeaderboard
export const getLeaderboard = async (): Promise<{ boothId: string; boothName: string; earnings: number }[]> => {
  try {
    const { data, error } = await supabase
      .from('booths')
      .select('id, name, sales')
      .order('sales', { ascending: false });
    
    if (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to fetch leaderboard data');
      return [];
    }
    
    return (data || []).map(booth => ({
      boothId: booth.id,
      boothName: booth.name,
      earnings: (booth.sales || 0) / 100 // Convert cents to dollars
    }));
  } catch (error) {
    console.error('Error in getLeaderboard:', error);
    toast.error('Failed to fetch leaderboard data');
    return [];
  }
};

// Implementing the missing function for removeProductFromBooth
export const removeProductFromBooth = async (boothId: string, productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('booth_id', boothId);
    
    if (error) {
      console.error('Error removing product:', error);
      toast.error('Failed to remove product');
      return false;
    }
    
    console.log(`Product ${productId} removed from booth ${boothId}`);
    return true;
  } catch (error) {
    console.error('Error removing product:', error);
    return false;
  }
};
