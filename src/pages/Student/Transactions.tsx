
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import { DateRange } from '@/types';
import DateRangeFilter from '@/components/DataRangeFilter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

const StudentTransactions = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>({});
  const [activeTab, setActiveTab] = useState('all');
  
  // Get transactions from localStorage
  const getTransactions = () => {
    try {
      const transactionsStr = localStorage.getItem('transactions');
      const allTransactions = transactionsStr ? JSON.parse(transactionsStr) : [];
      
      // Filter transactions for the current user
      return allTransactions.filter((transaction: any) => 
        transaction.buyerId === user?.id
      );
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  };
  
  const transactions = getTransactions();
  
  // Apply date range filter if dates are set
  const filteredTransactions = transactions.filter((transaction: any) => {
    const transactionDate = new Date(transaction.timestamp);
    
    // Filter by date range if set
    if (dateRange.startDate && dateRange.endDate) {
      return (
        transactionDate >= dateRange.startDate &&
        transactionDate <= dateRange.endDate
      );
    }
    
    return true;
  });
  
  // Filter by transaction type
  const typeFilteredTransactions = filteredTransactions.filter((transaction: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'purchases') return transaction.type === 'purchase';
    if (activeTab === 'funds') return transaction.type === 'fund';
    return true;
  });
  
  // Sort transactions by timestamp (newest first)
  const sortedTransactions = [...typeFilteredTransactions].sort(
    (a, b) => b.timestamp - a.timestamp
  );
  
  return (
    <Layout title="Transaction History">
      <div className="container px-4 py-6 mx-auto max-w-3xl">
        <div className="mb-6">
          <DateRangeFilter onChange={setDateRange} />
        </div>
        
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="funds">Funds Added</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <Card className="border-none shadow-none">
              <div className="space-y-1">
                {sortedTransactions.length > 0 ? (
                  sortedTransactions.map((transaction: any) => (
                    <TransactionItem 
                      key={transaction.id} 
                      transaction={transaction}
                      showSupport={true} 
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default StudentTransactions;
