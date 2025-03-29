
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const BoothTransactions = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const { user } = useAuth();
  const { getBoothById, loadBoothTransactions } = useTransactions();
  const navigate = useNavigate();
  
  const [booth, setBooth] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('transactions');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (boothId) {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        const boothData = getBoothById(boothId);
        setBooth(boothData || null);
        
        if (boothData) {
          const boothTransactions = loadBoothTransactions(boothId);
          setTransactions(boothTransactions);
        }
      } catch (error) {
        console.error('Error loading booth data:', error);
        setLoadError('Failed to load booth data');
      } finally {
        setIsLoading(false);
      }
    }
  }, [boothId, getBoothById, loadBoothTransactions]);

  useEffect(() => {
    // Only check access after loading is complete
    if (!isLoading && user && booth && !booth.managers.includes(user.id)) {
      toast.error("You don't have access to this booth");
      navigate('/dashboard');
    }
  }, [user, booth, navigate, isLoading]);

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

  if (isLoading) {
    return (
      <Layout title="Loading..." showBack>
        <div className="text-center py-10">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </Layout>
    );
  }

  if (loadError) {
    return (
      <Layout title="Error" showBack>
        <div className="text-center py-10">
          <p className="text-destructive">{loadError}</p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4"
          >
            Return to Dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  if (!booth) {
    return (
      <Layout title="Booth not found" showBack>
        <div className="text-center py-10">
          <p className="text-muted-foreground">The booth you're looking for could not be found</p>
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="mt-4"
          >
            Return to Dashboard
          </Button>
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
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>No transactions yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default BoothTransactions;
