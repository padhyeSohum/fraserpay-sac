
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import TransactionItem from '@/components/TransactionItem';
import { PlusCircle, Users, CreditCard, DollarSign, BarChart3, User, Edit } from 'lucide-react';

const SACDashboard = () => {
  const { user } = useAuth();
  const { transactions, fetchAllTransactions } = useTransactions();
  const [recentTransactions, setRecentTransactions] = useState<typeof transactions>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function loadData() {
      await fetchAllTransactions();
    }
    
    loadData();
  }, [fetchAllTransactions]);
  
  useEffect(() => {
    if (transactions.length > 0) {
      // Filter fund transactions only
      const fundTransactions = transactions.filter(t => t.type === 'fund');
      setRecentTransactions(fundTransactions.slice(0, 5));
    }
  }, [transactions]);
  
  const handleAddFunds = () => {
    navigate('/sac/add-funds');
  };
  
  const handleAdjustBalance = () => {
    navigate('/sac/adjust-balance');
  };
  
  return (
    <Layout 
      title="SAC Dashboard" 
      subtitle={`Welcome, ${user?.name?.split(' ')[0] || 'User'}!`}
      showLogout
    >
      <div className="space-y-6">
        <div className="stats-grid grid grid-cols-2 gap-4">
          <Card className="bg-white/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <h3 className="text-2xl font-bold">254</h3>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>
          
          <Card className="bg-white/80">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Funds Added</p>
                <h3 className="text-2xl font-bold">$3,582.50</h3>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            className="h-20 justify-start px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            onClick={handleAddFunds}
          >
            <PlusCircle className="h-6 w-6 mr-2 text-white" />
            <div className="text-left">
              <div className="font-bold text-lg">Add Funds</div>
              <div className="text-xs text-blue-100">Add money to student accounts</div>
            </div>
          </Button>
          
          <Button 
            className="h-20 justify-start px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            onClick={handleAdjustBalance}
          >
            <Edit className="h-6 w-6 mr-2 text-white" />
            <div className="text-left">
              <div className="font-bold text-lg">Adjust Balance</div>
              <div className="text-xs text-purple-100">Manually modify a student's balance</div>
            </div>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Fund Transactions</CardTitle>
            <CardDescription>Most recent funds added to student accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map(transaction => (
                  <TransactionItem 
                    key={transaction.id} 
                    transaction={transaction} 
                    showSupport
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No recent transactions found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SACDashboard;
