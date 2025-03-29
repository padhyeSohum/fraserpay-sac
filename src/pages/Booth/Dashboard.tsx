
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import { ArrowRight, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Booth } from '@/types';
import { firestore } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

const BoothDashboard = () => {
  const { boothId } = useParams<{ boothId: string }>();
  const { user } = useAuth();
  const { getBoothById, loadBoothTransactions, fetchAllBooths } = useTransactions();
  const navigate = useNavigate();
  
  const [booth, setBooth] = useState<Booth | null | undefined>(undefined);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced booth loading with fallback to direct Firestore fetch
  const loadBoothData = useCallback(async () => {
    if (!boothId) {
      setLoadError('Booth ID is missing');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    
    try {
      console.log(`Loading booth data for ID: ${boothId}`);
      // First try to get booth from context
      let boothData = getBoothById(boothId);
      
      // If booth not found in context, try direct Firestore fetch
      if (!boothData) {
        console.log("Booth not found in context, trying direct Firestore fetch");
        try {
          const boothRef = doc(firestore, 'booths', boothId);
          const boothSnap = await getDoc(boothRef);
          
          if (boothSnap.exists()) {
            boothData = {
              id: boothSnap.id,
              ...boothSnap.data()
            } as Booth;
            console.log("Booth fetched directly from Firestore:", boothData);
          } else {
            console.log("Booth not found in Firestore either");
            setLoadError('Booth not found');
          }
        } catch (firestoreError) {
          console.error('Error fetching booth from Firestore:', firestoreError);
          setLoadError('Failed to load booth data from database');
        }
      }
      
      setBooth(boothData || null);
      
      if (boothData) {
        try {
          // Try to load transactions for this booth
          const boothTransactions = loadBoothTransactions ? loadBoothTransactions(boothId) : [];
          setTransactions(boothTransactions);
        } catch (txError) {
          console.error('Error loading booth transactions:', txError);
          // Don't fail the whole page for transaction loading errors
          setTransactions([]);
        }
      }
    } catch (error) {
      console.error('Error in loadBoothData:', error);
      setLoadError('Failed to load booth data');
    } finally {
      setIsLoading(false);
    }
  }, [boothId, getBoothById, loadBoothTransactions]);

  useEffect(() => {
    loadBoothData();
    
    // Refresh booth data from context
    fetchAllBooths?.().catch(err => {
      console.error("Error fetching all booths:", err);
    });
  }, [boothId, loadBoothData, fetchAllBooths]);

  // Handle retry attempt
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    loadBoothData();
    fetchAllBooths?.().catch(err => {
      console.error("Error retrying booth fetch:", err);
    });
  };

  useEffect(() => {
    // Only check access after loading is complete and we have both user and booth data
    if (!isLoading && user && booth && booth.managers && 
        Array.isArray(booth.managers) && !booth.managers.includes(user.id)) {
      toast.error("You don't have access to this booth");
      navigate('/dashboard');
    }
  }, [user, booth, navigate, isLoading]);

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

  if (isLoading) {
    return (
      <Layout title="Loading..." showBack>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin mb-4">
            <RefreshCw className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading booth information...</p>
        </div>
      </Layout>
    );
  }

  if (loadError) {
    return (
      <Layout title="Error" showBack>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-destructive mb-6">{loadError}</p>
            <p className="text-sm text-muted-foreground mb-6">
              The booth you're trying to access might not exist or you may not have permission to view it.
            </p>
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!booth) {
    return (
      <Layout title="Booth not found" showBack>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2">Booth not found</h2>
            <p className="text-muted-foreground mb-6">
              The booth you're looking for could not be found or may have been deleted.
            </p>
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      title={booth.name || 'Booth Dashboard'} 
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
        
        <TabsContent value="dashboard" className="animate-fade-in mt-6">
          <div className="space-y-6">
            {/* Total Sales Card */}
            <Card className="border-none shadow-md bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-white/80">Total Sales</h3>
                <p className="text-3xl font-bold">${((booth.totalEarnings || 0) / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline"
                className="justify-between h-auto py-4 px-4 bg-white shadow-sm border-border/50"
                onClick={() => navigate(`/booth/${boothId}/sell`)}
              >
                <span className="font-medium">Process a Sale</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
              
              <Button 
                variant="outline"
                className="justify-between h-auto py-4 px-4 bg-white shadow-sm border-border/50"
                onClick={() => navigate(`/booth/${boothId}/settings`)}
              >
                <span className="font-medium">Manage Booth</span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
            
            {/* Recent Transactions */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Recent Transactions</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/booth/${boothId}/transactions`)}
                  className="gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              {transactions && transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.slice(0, 3).map((transaction) => (
                    <TransactionItem 
                      key={transaction.id || `tx-${Math.random()}`} 
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
