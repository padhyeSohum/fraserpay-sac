import { useState, useCallback, useEffect } from 'react';
import { Transaction, TransactionStats, DateRange, Booth } from '@/types';
import { useAuth } from '@/contexts/auth';
import { 
  getLeaderboard as getLeaderboardService,
  getAllTransactions
} from '../boothService';
import { toast } from 'sonner';

export interface UseTransactionManagementReturn {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  loadBoothTransactions: (boothId: string, booths: Booth[]) => Transaction[];
  loadUserFundsTransactions: () => Transaction[];
  loadUserTransactions: (userId: string) => Transaction[];
  getSACTransactions: () => Transaction[];
  getTransactionStats: (boothId: string, dateRange: DateRange) => TransactionStats;
  getLeaderboard: () => Promise<{ boothId: string; boothName: string; earnings: number }[]>;
}

export const useTransactionManagement = (booths: Booth[]): UseTransactionManagementReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchTransactionsData = async () => {
      if (!isAuthenticated) return;
      
      console.log('Initializing transaction data fetch');
      try {
        const allTransactions = await getAllTransactions();
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
    
    fetchTransactionsData();
  }, [user, isAuthenticated]);

  const loadBoothTransactions = (boothId: string, booths: Booth[]) => {
    return transactions.filter(t => t.boothId === boothId);
  };

  const loadUserFundsTransactions = () => {
    if (!user) return [];
    return transactions.filter(t => t.type === 'fund' && t.buyerId === user.id);
  };

  const loadUserTransactionsImpl = (userId: string) => {
    return transactions.filter(t => t.buyerId === userId);
  };

  const getSACTransactions = () => {
    return transactions;
  };

  const getTransactionStats = (boothId: string, dateRange: DateRange): TransactionStats => {
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
  };

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
    loadUserTransactions: loadUserTransactionsImpl,
    getSACTransactions,
    getTransactionStats,
    getLeaderboard
  };
};
