
import React, { useState, useEffect } from 'react';
import { useTransactions } from '@/contexts/transactions';
import { useAuth } from '@/contexts/auth';
import Layout from '@/components/Layout';
import StatCards from './components/StatCards';
import TransactionsTable from './components/TransactionsTable';
import { toast } from 'sonner';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';

// Define the StatsData type for use in the component and other files
export interface StatsData {
  totalUsers: number;
  totalBooths: number;
  totalTransactions: number;
  totalRevenue: number;
  totalTickets: number;
}

const Dashboard = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTransactionLoading, setIsTransactionLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalBooths: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    totalTickets: 0
  });
  
  const { user } = useAuth();
  const { booths, fetchAllBooths } = useTransactions();
  
  // Load transactions when component mounts
  useEffect(() => {
    loadTransactions();
    loadStats();
  }, []);
  
  // Function to load transactions
  const loadTransactions = async () => {
    setIsTransactionLoading(true);
    try {
      const transactionsRef = collection(firestore, 'transactions');
      const q = query(transactionsRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const txs = querySnapshot.docs.map(doc => {
        const txData = doc.data();
        txData.id = doc.id;
        return txData;
      });
      
      console.log('SAC Dashboard: Loaded transactions from Firebase', txs.length);
      setTransactions(txs);
      
      // Calculate total revenue from funds added, not all transactions
      const fundTransactions = txs.filter(tx => tx.type === 'fund');
      const totalFunds = fundTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      // Calculate total revenue from booth sales
      const boothTransactions = txs.filter(tx => tx.type === 'purchase');
      const boothRevenue = boothTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalTransactions: txs.length,
        totalRevenue: boothRevenue / 100,
        totalTickets: totalFunds / 100
      }));
    } catch (error) {
      console.error('Error loading transactions from Firebase:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setIsTransactionLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      // Load user stats
      const usersRef = collection(firestore, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const userCount = usersSnapshot.size;
      
      // Load booth stats - we can use the booths from context
      await fetchAllBooths();
      
      setStats(prev => ({
        ...prev,
        totalUsers: userCount,
        totalBooths: booths.length
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  return (
    <Layout title="SAC Dashboard" fullWidth>
      <div className="space-y-6">
        <StatCards stats={stats} isLoading={isTransactionLoading} />
        
        <TransactionsTable 
          transactions={transactions}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isTransactionLoading}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
