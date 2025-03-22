
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Transaction, User, Booth, Product, CartItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TransactionContextType {
  transactions: Transaction[];
  booths: Booth[];
  loadUserTransactions: (userId: string) => Transaction[];
  loadBoothTransactions: (boothId: string) => Transaction[];
  addFunds: (amount: number, userId: string, paymentMethod: 'cash' | 'card', sacMemberId: string, sacMemberName: string) => Promise<boolean>;
  processPayment: (
    buyerId: string,
    buyerName: string,
    boothId: string,
    boothName: string,
    sellerId: string, 
    sellerName: string,
    cartItems: CartItem[]
  ) => Promise<boolean>;
  getLeaderboard: () => { boothId: string, boothName: string, earnings: number }[];
  getUserFavoriteProducts: (userId: string) => { productId: string, productName: string, count: number }[];
  createBooth: (name: string, description: string, pin: string, creatorId: string) => Promise<string>;
  getBoothById: (boothId: string) => Booth | undefined;
  getBoothsByUserId: (userId: string) => Booth[];
  addProductToBooth: (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => Promise<boolean>;
  updateProductInBooth: (boothId: string, productId: string, productUpdates: Partial<Product>) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
  recentTransactions: Transaction[];
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const { user } = useAuth();

  // Load initial data from localStorage
  useEffect(() => {
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (error) {
        console.error('Failed to parse stored transactions:', error);
      }
    } else {
      // Create empty transactions array if none exists
      localStorage.setItem('transactions', JSON.stringify([]));
    }

    const storedBooths = localStorage.getItem('booths');
    if (storedBooths) {
      try {
        setBooths(JSON.parse(storedBooths));
      } catch (error) {
        console.error('Failed to parse stored booths:', error);
      }
    } else {
      // Initialize with some demo booths
      const initialBooths: Booth[] = [
        {
          id: '1',
          name: 'Computer Club',
          description: 'Tech support and gadgets',
          pin: '111111',
          products: [
            { id: '101', name: 'Pizza Slice', price: 3.50, boothId: '1', salesCount: 0 },
            { id: '102', name: 'Hot Dog', price: 4.00, boothId: '1', salesCount: 0 },
            { id: '103', name: 'Soda', price: 2.00, boothId: '1', salesCount: 0 },
            { id: '104', name: 'Chips', price: 1.50, boothId: '1', salesCount: 0 }
          ],
          managers: [],
          totalEarnings: 0,
          transactions: []
        },
        {
          id: '2',
          name: 'Grade 12 Council',
          description: 'Senior year fundraising',
          pin: '222222',
          products: [
            { id: '201', name: 'Cookies', price: 3.00, boothId: '2', salesCount: 0 },
            { id: '202', name: 'Brownies', price: 3.00, boothId: '2', salesCount: 0 },
            { id: '203', name: 'Iced Coffee', price: 4.00, boothId: '2', salesCount: 0 },
            { id: '204', name: 'Bubble Tea', price: 5.00, boothId: '2', salesCount: 0 },
            { id: '205', name: 'Samosa', price: 2.00, boothId: '2', salesCount: 0 },
            { id: '206', name: 'Pizza Slice', price: 4.00, boothId: '2', salesCount: 0 }
          ],
          managers: [],
          totalEarnings: 0,
          transactions: []
        }
      ];
      localStorage.setItem('booths', JSON.stringify(initialBooths));
      setBooths(initialBooths);
    }
  }, []);

  // Update localStorage whenever transactions change
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    
    // Update recent transactions
    const recent = [...transactions].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
    setRecentTransactions(recent);
  }, [transactions]);

  // Update localStorage whenever booths change
  useEffect(() => {
    localStorage.setItem('booths', JSON.stringify(booths));
  }, [booths]);

  const loadUserTransactions = (userId: string) => {
    return transactions.filter(t => t.buyerId === userId || t.sellerId === userId);
  };

  const loadBoothTransactions = (boothId: string) => {
    return transactions.filter(t => t.boothId === boothId);
  };

  const addFunds = async (amount: number, userId: string, paymentMethod: 'cash' | 'card', sacMemberId: string, sacMemberName: string) => {
    try {
      // Create transaction record
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        buyerId: userId,
        buyerName: '', // Will update with actual name
        amount,
        type: 'fund',
        paymentMethod,
        sacMemberId,
        sacMemberName
      };

      // Get user to update balance and get name
      const usersStr = localStorage.getItem('users');
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        throw new Error('User not found');
      }
      
      // Update transaction with buyer name
      newTransaction.buyerName = users[userIndex].name;
      
      // Update user balance
      users[userIndex].balance += amount;
      localStorage.setItem('users', JSON.stringify(users));
      
      // Add transaction to records
      setTransactions(prev => [...prev, newTransaction]);
      
      // Update current user if it's the same
      if (user && user.id === userId) {
        // In a real app, you would refresh the user from the server
        // For demo, we'll update the local user object
      }
      
      toast.success(`Added $${amount.toFixed(2)} to account`);
      return true;
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add funds');
      console.error(error);
      return false;
    }
  };

  const processPayment = async (
    buyerId: string,
    buyerName: string,
    boothId: string,
    boothName: string,
    sellerId: string,
    sellerName: string,
    cartItems: CartItem[]
  ) => {
    try {
      // Calculate total amount
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      
      // Get user to check balance
      const usersStr = localStorage.getItem('users');
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      const buyer = users.find(u => u.id === buyerId);
      if (!buyer) {
        throw new Error('Buyer not found');
      }
      
      if (buyer.balance < totalAmount) {
        throw new Error('Insufficient balance');
      }
      
      // Create transaction record
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        buyerId,
        buyerName,
        sellerId,
        sellerName,
        boothId,
        boothName,
        products: cartItems.map(item => ({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        amount: totalAmount,
        type: 'purchase'
      };
      
      // Update buyer balance
      const buyerIndex = users.findIndex(u => u.id === buyerId);
      users[buyerIndex].balance -= totalAmount;
      
      // Add products to favorite if not already there
      if (!users[buyerIndex].favoriteProducts) {
        users[buyerIndex].favoriteProducts = [];
      }
      
      cartItems.forEach(item => {
        if (!users[buyerIndex].favoriteProducts!.includes(item.productId)) {
          users[buyerIndex].favoriteProducts!.push(item.productId);
        }
      });
      
      localStorage.setItem('users', JSON.stringify(users));
      
      // Update booth earnings and product sales counts
      const updatedBooths = [...booths];
      const boothIndex = updatedBooths.findIndex(b => b.id === boothId);
      
      if (boothIndex !== -1) {
        updatedBooths[boothIndex].totalEarnings += totalAmount;
        
        // Update product sales counts
        cartItems.forEach(item => {
          const productIndex = updatedBooths[boothIndex].products.findIndex(p => p.id === item.productId);
          if (productIndex !== -1) {
            const currentSalesCount = updatedBooths[boothIndex].products[productIndex].salesCount || 0;
            updatedBooths[boothIndex].products[productIndex].salesCount = currentSalesCount + item.quantity;
          }
        });
        
        setBooths(updatedBooths);
      }
      
      // Add transaction to records
      setTransactions(prev => [...prev, newTransaction]);
      
      toast.success('Purchase successful');
      return true;
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment failed');
      console.error(error);
      return false;
    }
  };

  const getLeaderboard = () => {
    return booths.map(booth => ({
      boothId: booth.id,
      boothName: booth.name,
      earnings: booth.totalEarnings
    })).sort((a, b) => b.earnings - a.earnings);
  };

  const getUserFavoriteProducts = (userId: string) => {
    // Get user
    const usersStr = localStorage.getItem('users');
    const users: User[] = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find(u => u.id === userId);
    if (!user || !user.favoriteProducts || user.favoriteProducts.length === 0) {
      return [];
    }
    
    // Count product purchases
    const productCounts: Record<string, number> = {};
    
    transactions
      .filter(t => t.buyerId === userId && t.type === 'purchase' && t.products)
      .forEach(transaction => {
        transaction.products?.forEach(product => {
          if (productCounts[product.productId]) {
            productCounts[product.productId] += product.quantity;
          } else {
            productCounts[product.productId] = product.quantity;
          }
        });
      });
    
    // Get product names and sort by count
    const favoriteProducts = Object.entries(productCounts)
      .map(([productId, count]) => {
        // Find product name by searching all booths
        let productName = 'Unknown Product';
        
        for (const booth of booths) {
          const product = booth.products.find(p => p.id === productId);
          if (product) {
            productName = product.name;
            break;
          }
        }
        
        return { productId, productName, count };
      })
      .sort((a, b) => b.count - a.count);
    
    return favoriteProducts;
  };

  const createBooth = async (name: string, description: string, pin: string, creatorId: string) => {
    try {
      // Create new booth
      const newBooth: Booth = {
        id: Date.now().toString(),
        name,
        description,
        pin,
        products: [],
        managers: [creatorId],
        totalEarnings: 0,
        transactions: []
      };
      
      // Add booth to state and localStorage
      setBooths(prev => [...prev, newBooth]);
      
      // Add booth to user's booths
      const usersStr = localStorage.getItem('users');
      const users: User[] = usersStr ? JSON.parse(usersStr) : [];
      
      const userIndex = users.findIndex(u => u.id === creatorId);
      if (userIndex !== -1) {
        users[userIndex].booths = [...(users[userIndex].booths || []), newBooth.id];
        localStorage.setItem('users', JSON.stringify(users));
      }
      
      toast.success(`Created booth: ${name}`);
      return newBooth.id;
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create booth');
      console.error(error);
      return '';
    }
  };

  const getBoothById = (boothId: string) => {
    return booths.find(booth => booth.id === boothId);
  };

  const getBoothsByUserId = (userId: string) => {
    return booths.filter(booth => booth.managers.includes(userId));
  };

  const addProductToBooth = async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => {
    try {
      const updatedBooths = [...booths];
      const boothIndex = updatedBooths.findIndex(b => b.id === boothId);
      
      if (boothIndex === -1) {
        throw new Error('Booth not found');
      }
      
      const newProduct: Product = {
        id: Date.now().toString(),
        ...product,
        boothId,
        salesCount: 0
      };
      
      updatedBooths[boothIndex].products.push(newProduct);
      setBooths(updatedBooths);
      
      toast.success(`Added product: ${product.name}`);
      return true;
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add product');
      console.error(error);
      return false;
    }
  };

  const updateProductInBooth = async (boothId: string, productId: string, productUpdates: Partial<Product>) => {
    try {
      const updatedBooths = [...booths];
      const boothIndex = updatedBooths.findIndex(b => b.id === boothId);
      
      if (boothIndex === -1) {
        throw new Error('Booth not found');
      }
      
      const productIndex = updatedBooths[boothIndex].products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) {
        throw new Error('Product not found');
      }
      
      updatedBooths[boothIndex].products[productIndex] = {
        ...updatedBooths[boothIndex].products[productIndex],
        ...productUpdates
      };
      
      setBooths(updatedBooths);
      
      toast.success(`Updated product: ${updatedBooths[boothIndex].products[productIndex].name}`);
      return true;
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
      console.error(error);
      return false;
    }
  };

  const removeProductFromBooth = async (boothId: string, productId: string) => {
    try {
      const updatedBooths = [...booths];
      const boothIndex = updatedBooths.findIndex(b => b.id === boothId);
      
      if (boothIndex === -1) {
        throw new Error('Booth not found');
      }
      
      const productIndex = updatedBooths[boothIndex].products.findIndex(p => p.id === productId);
      
      if (productIndex === -1) {
        throw new Error('Product not found');
      }
      
      const productName = updatedBooths[boothIndex].products[productIndex].name;
      updatedBooths[boothIndex].products.splice(productIndex, 1);
      
      setBooths(updatedBooths);
      
      toast.success(`Removed product: ${productName}`);
      return true;
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove product');
      console.error(error);
      return false;
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        booths,
        loadUserTransactions,
        loadBoothTransactions,
        addFunds,
        processPayment,
        getLeaderboard,
        getUserFavoriteProducts,
        createBooth,
        getBoothById,
        getBoothsByUserId,
        addProductToBooth,
        updateProductInBooth,
        removeProductFromBooth,
        recentTransactions
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
