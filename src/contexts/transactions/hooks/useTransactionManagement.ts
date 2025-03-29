
import { useState, useCallback, useEffect } from 'react';
import { Transaction, TransactionStats, DateRange, Booth } from '@/types';
import { useAuth } from '@/contexts/auth';
import { 
  getLeaderboard as getLeaderboardService,
} from '../boothService';
import { fetchAllTransactions } from '../transactionService';
import { toast } from 'sonner';
import { firestore } from '@/integrations/firebase/client';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { transformFirebaseTransaction } from '@/utils/firebase';

export interface UseTransactionManagementReturn {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  loadBoothTransactions: (boothId: string) => Transaction[];
  loadUserFundsTransactions: () => Transaction[];
  loadUserTransactions: (userId: string) => Transaction[];
  getSACTransactions: () => Transaction[];
  getTransactionStats: (boothId: string, dateRange: DateRange) => TransactionStats;
  getLeaderboard: () => Promise<{ boothId: string; boothName: string; earnings: number }[]>;
  refreshTransactions: () => Promise<void>;
}

export const useTransactionManagement = (booths: Booth[]): UseTransactionManagementReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const { user, isAuthenticated } = useAuth();

  const fetchTransactionsData = async () => {
    if (!isAuthenticated) return;
    
    console.log('Initializing transaction data fetch');
    try {
      const allTransactions = await fetchAllTransactions();
      console.log('Fetched transactions:', allTransactions.length);
      setTransactions(allTransactions);
      
      if (user && allTransactions.length > 0) {
        const userTxs = allTransactions.filter(t => t.buyerId === user.id);
        console.log('User transactions:', userTxs.length);
        setRecentTransactions(userTxs.slice(0, 5));
      }
    } catch (error) {
      console.error('Error in fetchTransactionsData:', error);
    }
  };

  useEffect(() => {
    fetchTransactionsData();
  }, [user, isAuthenticated]);

  const refreshTransactions = async () => {
    await fetchTransactionsData();
  };

  const loadBoothTransactions = useCallback((boothId: string) => {
    return transactions.filter(t => t.boothId === boothId);
  }, [transactions]);

  const loadUserFundsTransactions = useCallback(() => {
    if (!user) return [];
    return transactions.filter(t => t.type === 'fund' && t.buyerId === user.id);
  }, [transactions, user]);

  const loadUserTransactions = useCallback((userId: string) => {
    return transactions.filter(t => t.buyerId === userId);
  }, [transactions]);

  const getSACTransactions = useCallback(() => {
    return transactions;
  }, [transactions]);

  const getTransactionStats = useCallback((boothId: string, dateRange: DateRange): TransactionStats => {
    const boothTransactions = transactions.filter(t => 
      t.boothId === boothId && 
      t.type === 'purchase' &&
      (!dateRange.startDate || new Date(t.timestamp) >= dateRange.startDate) &&
      (!dateRange.endDate || new Date(t.timestamp) <= dateRange.endDate)
    );
    
    const dailySales: {[key: string]: number} = {};
    boothTransactions.forEach(t => {
      const date = new Date(t.timestamp).toISOString().split('T')[0];
      dailySales[date] = (dailySales[date] || 0) + t.amount;
    });
    
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
    
    const totalSales = boothTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      dailySales,
      topProducts,
      totalSales
    };
  }, [transactions]);

  const getLeaderboard = useCallback(async () => {
    try {
      return await getLeaderboardService();
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to fetch leaderboard data');
      return [];
    }
  }, []);

  return {
    transactions,
    recentTransactions,
    loadBoothTransactions,
    loadUserFundsTransactions,
    loadUserTransactions,
    getSACTransactions,
    getTransactionStats,
    getLeaderboard,
    refreshTransactions
  };
};
