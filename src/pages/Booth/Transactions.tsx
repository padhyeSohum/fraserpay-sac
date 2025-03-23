import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/transactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import { toast } from 'sonner';

const BoothTransactions = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const { user } = useAuth();
  const { getBoothById, loadBoothTransactions } = useTransactions();
  const navigate = useNavigate();
  
  const [booth, setBooth] = useState<ReturnType<typeof getBoothById>>(undefined);
  const [transactions, setTransactions] = useState<ReturnType<typeof loadBoothTransactions>>([]);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    if (boothId) {
      const boothData = getBoothById(boothId);
      setBooth(boothData);
      
      if (boothData) {
        const boothTransactions = loadBoothTransactions(boothId);
        setTransactions(boothTransactions);
      }
    }
  }, [boothId, getBoothById, loadBoothTransactions]);

  useEffect(() => {
    // Check if user has access to this booth
    if (user && booth && !booth.managers.includes(user.id)) {
      toast.error("You don't have access to this booth");
      navigate('/dashboard');
    }
  }, [user, booth, navigate]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'dashboard') {
      navigate(`/booth/${boothId}`);
    } else if (value === 'sell') {
      navigate(`/booth/${boothId}/sell`);
    } else if (value === 'settings') {
      navigate(`/booth/${boothId}/settings`);
    }
  };

  if (!booth) {
    return (
      <Layout title="Booth not found" showBack>
        <div className="text-center py-10">
          <p className="text-muted-foreground">The booth you're looking for could not be found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={booth.name} 
      subtitle="Booth Management" 
      showBack
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="dashboard" className="tab-button">Dashboard</TabsTrigger>
          <TabsTrigger value="sell" className="tab-button">Sell</TabsTrigger>
          <TabsTrigger value="transactions" className="tab-button">History</TabsTrigger>
          <TabsTrigger value="settings" className="tab-button">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions" className="animate-fade-in mt-6">
          <div className="space-y-6">
            <div className="text-muted-foreground text-sm mb-2">
              Showing all transactions for this booth
            </div>
            
            {transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <TransactionItem 
                    key={transaction.id} 
                    transaction={transaction}
                    showSupport
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default BoothTransactions;
