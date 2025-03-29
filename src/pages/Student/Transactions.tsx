
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Transactions = () => {
  const { user } = useAuth();
  const { loadUserTransactions, refreshTransactions } = useTransactions();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    const loadTransactionsData = async () => {
      if (!isMounted) return;
      setIsLoading(true);
      setError(null);
      
      try {
        if (!user) {
          console.log('No user found, skipping transaction loading');
          setTransactions([]);
          return;
        }
        
        // Safely check if refreshTransactions exists and is a function
        if (typeof refreshTransactions === 'function') {
          try {
            await refreshTransactions();
          } catch (refreshError) {
            console.error('Error refreshing transactions:', refreshError);
            // Continue with loading available transactions even if refresh fails
          }
        }
        
        // Load the user transactions
        const userTransactions = loadUserTransactions ? loadUserTransactions(user.id) : [];
        
        if (isMounted) {
          console.log(`Loaded ${userTransactions?.length || 0} transactions for user ${user.id}`);
          setTransactions(userTransactions || []);
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
        if (isMounted) {
          setError('Failed to load transactions. Please try again later.');
          toast.error('Failed to load transactions');
          setTransactions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadTransactionsData();
    
    // Set up polling to refresh transaction data
    const intervalId = setInterval(() => {
      if (!isMounted || !user) return;
      
      // Use a simpler update method for polling to avoid loading indicators
      try {
        const userTransactions = loadUserTransactions ? loadUserTransactions(user.id) : [];
        if (userTransactions && isMounted) {
          setTransactions(userTransactions);
        }
      } catch (error) {
        console.error('Error in transaction polling:', error);
      }
    }, 15000); // Refresh every 15 seconds
    
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [user, loadUserTransactions, refreshTransactions]);
  
  return (
    <Layout title="Transaction History" showBack>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p>Loading transactions...</p>
            </CardContent>
          </Card>
        ) : transactions && transactions.length > 0 ? (
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
