
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const Transactions = () => {
  const { user } = useAuth();
  const { loadUserTransactions, refreshTransactions } = useTransactions();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadTransactionsData = async () => {
      setIsLoading(true);
      
      try {
        if (!user) return;
        
        // Refresh transactions from Firebase first if available
        if (refreshTransactions) {
          await refreshTransactions();
        }
        
        // Load the user transactions
        const userTransactions = loadUserTransactions(user.id);
        console.log(`Loaded ${userTransactions.length} transactions for user ${user.id}`);
        
        setTransactions(userTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
        toast.error('Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTransactionsData();
    
    // Set up polling to refresh transaction data
    const intervalId = setInterval(() => {
      if (user) {
        // Use a simpler update method for polling to avoid loading indicators
        try {
          const userTransactions = loadUserTransactions(user.id);
          setTransactions(userTransactions);
        } catch (error) {
          console.error('Error in transaction polling:', error);
        }
      }
    }, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [user, loadUserTransactions, refreshTransactions]);
  
  return (
    <Layout title="Transaction History" showBack>
      <div className="space-y-6">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p>Loading transactions...</p>
            </CardContent>
          </Card>
        ) : transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map(transaction => (
              <TransactionItem 
                key={transaction.id} 
                transaction={transaction} 
                showBooth 
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <p>No transactions yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Transactions;
