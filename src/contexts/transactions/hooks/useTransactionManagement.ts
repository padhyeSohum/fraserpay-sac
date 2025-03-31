
import { useState, useCallback, useEffect } from 'react';
import { Transaction, TransactionStats, DateRange, Booth } from '@/types';
import { useAuth } from '@/contexts/auth';
import { 
  getLeaderboard as getLeaderboardService,
} from '../boothService';
import { fetchAllTransactions } from '../transactionService';
import { toast } from 'sonner';
import { getVersionedStorageItem, setVersionedStorageItem } from '@/utils/storageManager';

export interface UseTransactionManagementReturn {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  loadBoothTransactions: (boothId: string) => Transaction[];
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
        // Check if we have cached transactions first
        const cachedTransactions = getVersionedStorageItem<Transaction[]>('transactions', []);
        const lastFetchTime = getVersionedStorageItem<number>('lastTransactionsFetch', 0);
        const now = Date.now();
        
        // Balance data needs to be fresh, so use a shorter cache time (45 seconds)
        // This ensures balances are updated relatively quickly without excessive reads
        const cacheTime = 45 * 1000; // 45 seconds, reduced from 2 minutes for more responsive balances
        
        // Use cache if it exists and is less than 45 seconds old
        if (cachedTransactions.length > 0 && now - lastFetchTime < cacheTime) {
          console.log('Using cached transactions:', cachedTransactions.length);
          setTransactions(cachedTransactions);
          
          if (user && cachedTransactions.length > 0) {
            const userTxs = cachedTransactions.filter(t => t.buyerId === user.id);
            console.log('User transactions from cache:', userTxs.length);
            setRecentTransactions(userTxs.slice(0, 5));
          }
          return;
        }
        
        // Otherwise fetch from backend
        const allTransactions = await fetchAllTransactions();
        console.log('Fetched transactions:', allTransactions.length);
        setTransactions(allTransactions);
        
        // Cache the transactions with updated timeout
        setVersionedStorageItem('transactions', allTransactions, cacheTime);
        setVersionedStorageItem('lastTransactionsFetch', now);
        
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
    
    // Set up a polling interval for critical data (user balance)
    // Polling at 15 seconds provides a good balance between freshness and Firebase reads
    const intervalId = setInterval(fetchTransactionsData, 15000); // 15 seconds instead of 30
    
    return () => clearInterval(intervalId);
  }, [user, isAuthenticated]);

  const loadBoothTransactions = (boothId: string) => {
    return transactions.filter(t => t.boothId === boothId);
  };

  const loadUserFundsTransactions = () => {
    if (!user) return [];
    return transactions.filter(t => t.type === 'fund' && t.buyerId === user.id);
  };

  const loadUserTransactions = (userId: string) => {
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
      // Check if we have cached leaderboard
      const cachedLeaderboard = getVersionedStorageItem<{ boothId: string; boothName: string; earnings: number; }[]>('leaderboard', []);
      const lastLeaderboardFetch = getVersionedStorageItem<number>('lastLeaderboardFetch', 0);
      const now = Date.now();
      
      // Use cache if it's less than 3 minutes old (reduced from 5 minutes)
      // This makes booth earnings more up-to-date
      if (cachedLeaderboard.length > 0 && now - lastLeaderboardFetch < 3 * 60 * 1000) {
        return cachedLeaderboard;
      }
      
      // Otherwise fetch fresh data
      const leaderboard = await getLeaderboardService();
      
      // Cache the result
      setVersionedStorageItem('leaderboard', leaderboard, 3 * 60 * 1000);
      setVersionedStorageItem('lastLeaderboardFetch', now);
      
      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Failed to fetch leaderboard data');
      
      // Return cached data on error if available
      return getVersionedStorageItem<{ boothId: string; boothName: string; earnings: number; }[]>('leaderboard', []);
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
    getLeaderboard
  };
};
