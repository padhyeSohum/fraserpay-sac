
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { Transaction, TransactionStats, DateRange } from '@/types';
import { 
  loadUserTransactions, 
  fetchAllTransactions 
} from '../transactionService';
import { getLeaderboard } from '../boothService';

export interface UseTransactionManagementReturn {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  loadBoothTransactions: (boothId: string, booths: Array<any>) => Transaction[];
  loadUserFundsTransactions: () => Transaction[];
  loadUserTransactions: (userId: string) => Transaction[];
  getSACTransactions: () => Transaction[];
  getTransactionStats: (boothId: string, dateRange: DateRange) => TransactionStats;
  getLeaderboard: () => { boothId: string; boothName: string; earnings: number }[];
}

export const useTransactionManagement = (booths: Array<any>): UseTransactionManagementReturn => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  // Load transactions on mount
  useEffect(() => {
    if (user) {
      const fetchTransactionsData = async () => {
        const allTransactions = await fetchAllTransactions();
        setTransactions(allTransactions);
        
        // Set recent transactions
        if (user && allTransactions.length > 0) {
          const userTxs = allTransactions.filter(t => t.buyerId === user.id);
          setRecentTransactions(userTxs.slice(0, 5)); // Most recent 5 transactions
        }
      };
      
      fetchTransactionsData();
    }
  }, [user]);

  const loadBoothTransactions = (boothId: string, booths: Array<any>) => {
    const booth = booths.find(b => b.id === boothId);
    return booth ? booth.transactions : [];
  };

  const loadUserFundsTransactions = () => {
    // Filter transactions for fund-type transactions belonging to the current user
    return transactions.filter(t => t.type === 'fund' && t.buyerId === user?.id);
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
    return getLeaderboard(booths);
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
