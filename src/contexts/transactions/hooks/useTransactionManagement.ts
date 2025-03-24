
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { Transaction, TransactionStats, DateRange, Booth } from '@/types';
import { 
  loadUserTransactions, 
  fetchAllTransactions 
} from '../transactionService';
import { getLeaderboard } from '../boothService';

export interface UseTransactionManagementReturn {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  loadBoothTransactions: (boothId: string, booths: Booth[]) => Transaction[];
  loadUserFundsTransactions: () => Transaction[];
  loadUserTransactions: (userId: string) => Transaction[];
  getSACTransactions: () => Transaction[];
  getTransactionStats: (boothId: string, dateRange: DateRange) => TransactionStats;
  getLeaderboard: () => { boothId: string; boothName: string; earnings: number }[];
}

export const useTransactionManagement = (booths: Booth[]): UseTransactionManagementReturn => {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Load transactions on mount
  useEffect(() => {
    const fetchTransactionsData = async () => {
      if (!isAuthenticated) return;
      
      console.log('Initializing transaction data fetch');
      try {
        const allTransactions = await fetchAllTransactions();
        console.log('Fetched transactions:', allTransactions.length);
        setTransactions(allTransactions);
        
        // Set recent transactions
        if (user && allTransactions.length > 0) {
          const userTxs = allTransactions.filter(t => t.buyerId === user.id);
          console.log('User transactions:', userTxs.length);
          setRecentTransactions(userTxs.slice(0, 5)); // Most recent 5 transactions
        }
      } catch (error) {
        console.error('Error in fetchTransactionsData:', error);
      }
    };
    
    fetchTransactionsData();
  }, [user, isAuthenticated]);

  const loadBoothTransactions = (boothId: string, booths: Booth[]) => {
    // Filter transactions for the specific booth
    return transactions.filter(t => t.boothId === boothId);
  };

  const loadUserFundsTransactions = () => {
    if (!user) return [];
    // Filter transactions for fund-type transactions belonging to the current user
    return transactions.filter(t => t.type === 'fund' && t.buyerId === user.id);
  };

  const loadUserTransactionsImpl = (userId: string) => {
    // Filter transactions for the specific user
    return transactions.filter(t => t.buyerId === userId);
  };

  const getSACTransactions = () => {
    // Return all transactions for SAC dashboard
    return transactions;
  };

  const getTransactionStats = (boothId: string, dateRange: DateRange): TransactionStats => {
    // Basic implementation of transaction stats
    const boothTransactions = transactions.filter(t => 
      t.boothId === boothId && 
      t.type === 'purchase' &&
      (!dateRange.startDate || new Date(t.timestamp) >= dateRange.startDate) &&
      (!dateRange.endDate || new Date(t.timestamp) <= dateRange.endDate)
    );
    
    // Calculate daily sales
    const dailySales: {[key: string]: number} = {};
    boothTransactions.forEach(t => {
      const date = new Date(t.timestamp).toISOString().split('T')[0];
      dailySales[date] = (dailySales[date] || 0) + t.amount;
    });
    
    // Calculate top products
    const productCount: {[key: string]: {count: number, name: string}} = {};
    boothTransactions.forEach(t => {
      t.products?.forEach(p => {
        if (!productCount[p.productId]) {
          productCount[p.productId] = {count: 0, name: p.productName};
        }
        productCount[p.productId].count += p.quantity;
      });
    });
    
    const topProducts = Object.entries(productCount)
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate total sales
    const totalSales = boothTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      dailySales,
      topProducts,
      totalSales
    };
  };
  
  const getLeaderboardImpl = () => {
    // Calculate booth earnings from transactions
    const boothEarnings: {[key: string]: {name: string, earnings: number}} = {};
    
    transactions.forEach(t => {
      if (t.boothId && t.type === 'purchase') {
        if (!boothEarnings[t.boothId]) {
          boothEarnings[t.boothId] = {
            name: t.boothName || 'Unknown Booth',
            earnings: 0
          };
        }
        boothEarnings[t.boothId].earnings += t.amount;
      }
    });
    
    return Object.entries(boothEarnings)
      .map(([boothId, data]) => ({
        boothId,
        boothName: data.name,
        earnings: data.earnings
      }))
      .sort((a, b) => b.earnings - a.earnings);
  };

  return {
    transactions,
    recentTransactions,
    loadBoothTransactions,
    loadUserFundsTransactions,
    loadUserTransactions: loadUserTransactionsImpl,
    getSACTransactions,
    getTransactionStats,
    getLeaderboard: getLeaderboardImpl
  };
};
