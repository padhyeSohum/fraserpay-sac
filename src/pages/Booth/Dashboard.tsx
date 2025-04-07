
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const BoothDashboard = () => {
  const { boothId } = useParams<{ boothId: string; }>();
  const { user } = useAuth();
  const { getBoothById, loadBoothTransactions } = useTransactions();
  const navigate = useNavigate();
  
  const [booth, setBooth] = useState<ReturnType<typeof getBoothById>>(undefined);
  const [transactions, setTransactions] = useState<ReturnType<typeof loadBoothTransactions>>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  useEffect(() => {
    if (boothId) {
      const boothData = getBoothById(boothId);
      setBooth(boothData);
      if (boothData) {
        const boothTransactions = loadBoothTransactions(boothId);
        console.log('Loaded booth transactions:', boothTransactions);
        setTransactions(boothTransactions);
      }
    }
  }, [boothId, getBoothById, loadBoothTransactions]);
  
  // Remove role-based restriction, just check if booth exists
  useEffect(() => {
    if (!booth) {
      console.log("Booth not found or user doesn't have access");
      // We'll handle this in the render method below
    }
  }, [booth]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'sell') {
      navigate(`/booth/${boothId}/sell`);
    } else if (value === 'transactions') {
      navigate(`/booth/${boothId}/transactions`);
    } else if (value === 'settings') {
      navigate(`/booth/${boothId}/settings`);
    }
  };
  
  if (!booth) {
    return (
      <Layout title="Initiative not found" showBack>
        <div className="text-center py-10">
          <p className="text-muted-foreground">The initiative you're looking for could not be found</p>
          <Button variant="link" onClick={() => navigate('/dashboard')} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={booth.name} subtitle="Initiative Management" showBack>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard" className="tab-button">Dashboard</TabsTrigger>
          <TabsTrigger value="sell" className="tab-button">Sell</TabsTrigger>
          <TabsTrigger value="transactions" className="tab-button">History</TabsTrigger>
          <TabsTrigger value="settings" className="tab-button">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="animate-fade-in mt-6">
          <div className="space-y-6">
            {/* Total Sales Card */}
            <Card className="border-none shadow-md bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-white/80">Total Sales</h3>
                <p className="text-3xl font-bold">${booth.totalEarnings.toFixed(2)}</p>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="justify-between h-auto py-4 px-4 bg-white shadow-sm border-border/50" onClick={() => navigate(`/booth/${boothId}/sell`)}>
                <span className="font-medium">Process a Sale</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
            
            {/* Recent Transactions */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/booth/${boothId}/transactions`)} className="gap-1">
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              {transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 3).map(transaction => (
                    <TransactionItem 
                      key={transaction.id} 
                      transaction={transaction} 
                      showSupport 
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
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default BoothDashboard;
