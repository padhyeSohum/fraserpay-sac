import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import BoothCard from '@/components/BoothCard';
import { QrCode, ListOrdered, Settings, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, updateUserData } = useAuth();
  const transactions = useTransactions();
  const navigate = useNavigate();
  
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userBooths, setUserBooths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data: freshUserData, error: userError } = await supabase
        .from('users')
        .select('tickets, booth_access')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error("Error refreshing user data:", userError);
        return;
      }
      
      if (freshUserData && user) {
        console.log("Dashboard - refreshed user data:", freshUserData);
        
        const newBalance = freshUserData.tickets / 100;
        const newBooths = freshUserData.booth_access || [];
        
        if (newBalance !== user.balance || 
            JSON.stringify(newBooths) !== JSON.stringify(user.booths)) {
          console.log("Updating user data with new booths:", newBooths);
          updateUserData({
            ...user,
            balance: newBalance,
            booths: newBooths
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [user, updateUserData]);

  const refreshUserBooths = useCallback(() => {
    if (!user) return;
    try {
      // Get latest booths for this user
      const booths = transactions.getBoothsByUserId ? transactions.getBoothsByUserId(user.id) : [];
      console.log("Dashboard: Refreshed user booths, found", booths.length, "booths for user", user.id);
      console.log("User booth IDs:", user.booths);
      console.log("All booth IDs with managers:", booths.map(b => ({ id: b.id, managers: b.managers })));
      setUserBooths(booths);
    } catch (error) {
      console.error("Error refreshing user booths:", error);
      setUserBooths([]);
    }
  }, [user, transactions]);

  const fetchDataWithRetry = useCallback(async () => {
    if (!user || dataInitialized) return;
    
    try {
      setIsLoading(true);
      setLoadError(null);
      
      await refreshUserData();
      
      // Fetch booths with retry logic
      let boothsData;
      try {
        console.log("Dashboard: Fetching all booths...");
        boothsData = transactions.fetchAllBooths ? await transactions.fetchAllBooths() : [];
        console.log("Dashboard: Fetched all booths, count:", boothsData?.length);
        if (!boothsData) {
          throw new Error("Failed to fetch booths");
        }
      } catch (error) {
        console.error("Error fetching booths:", error);
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          toast.error(`Failed to load booths. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return;
        } else {
          setLoadError("Failed to load booths after multiple attempts");
          toast.error("Failed to load booths after multiple attempts. Please refresh the page.");
        }
      }
      
      // Get user booths with error handling
      try {
        refreshUserBooths();
      } catch (error) {
        console.error("Error loading user booths:", error);
        setUserBooths([]);
        toast.error("Failed to load your booths");
      }
      
      // Load transactions with error handling
      try {
        const userTxs = transactions.loadUserTransactions ? 
          transactions.loadUserTransactions(user.id) : 
          [];
        setUserTransactions(userTxs.slice(0, 3));
      } catch (error) {
        console.error("Error loading transactions:", error);
        setUserTransactions([]);
        toast.error("Failed to load transactions");
      }
      
      setDataInitialized(true);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      if (retryCount < MAX_RETRIES) {
        setRetryCount(prev => prev + 1);
        toast.error(`Failed to load data. Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
      } else {
        setLoadError("Failed to load data after multiple attempts");
        toast.error("Failed to load data after multiple attempts. Please refresh the page.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, dataInitialized, refreshUserData, retryCount, refreshUserBooths, transactions, MAX_RETRIES]);

  useEffect(() => {
    let isMounted = true;
    
    if (isMounted && !dataInitialized && retryCount < MAX_RETRIES) {
      fetchDataWithRetry();
    }
    
    return () => {
      isMounted = false;
    };
  }, [fetchDataWithRetry, dataInitialized, retryCount, MAX_RETRIES]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshUserData();
      refreshUserBooths();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [refreshUserData, refreshUserBooths]);

  useEffect(() => {
    if (user && user.booths) {
      console.log("Dashboard: User booths changed, refreshing...", user.booths);
      refreshUserBooths();
    }
  }, [user?.booths, refreshUserBooths]);

  const handleViewQRCode = () => {
    navigate('/qr-code');
  };

  const handleViewLeaderboard = () => {
    navigate('/leaderboard');
  };

  const handleViewSettings = () => {
    navigate('/settings');
  };

  const handleJoinBooth = () => {
    navigate('/booth/join');
  };

  const handleBoothCardClick = (boothId: string) => {
    navigate(`/booth/${boothId}`);
  };

  const logo = (
    <div className="flex items-center mb-2">
      <div>
        <h1 className="text-xl font-bold">FraserPay</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</p>
      </div>
    </div>
  );

  if (!user) {
    return (
      <Layout title="Loading...">
        <div className="flex items-center justify-center min-h-[70vh]">
          <p>Loading user data...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout logo={logo} showLogout showAddButton onAddClick={handleJoinBooth}>
      <div className="space-y-6">
        <div className="balance-card rounded-xl overflow-hidden">
          <div className="flex flex-col">
            <span className="text-white/80 mb-1">Your Balance</span>
            <span className="text-3xl font-bold">${user.balance.toFixed(2)}</span>
            
            <p className="mt-4 text-sm text-white/80">
              Visit the SAC booth to add funds to your account
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 bg-white/80 hover:bg-white"
            onClick={handleViewQRCode}
          >
            <QrCode className="h-6 w-6 mb-1" />
            <span className="text-xs">QR Code</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 bg-white/80 hover:bg-white"
            onClick={handleViewLeaderboard}
          >
            <ListOrdered className="h-6 w-6 mb-1" />
            <span className="text-xs">Leaderboard</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 bg-white/80 hover:bg-white"
            onClick={handleViewSettings}
          >
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Your Booths</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleJoinBooth}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Join Booth</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {isLoading ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p>Loading booths...</p>
                </CardContent>
              </Card>
            ) : userBooths.length > 0 ? (
              userBooths.map(booth => (
                <BoothCard
                  key={booth.id}
                  booth={booth}
                  userRole="manager"
                  earnings={booth.totalEarnings}
                  onClick={() => handleBoothCardClick(booth.id)}
                />
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>You don't have access to any booths yet</p>
                  <Button 
                    variant="link" 
                    onClick={handleJoinBooth}
                    className="mt-2"
                  >
                    Join a booth with PIN
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>
              View All
            </Button>
          </div>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Loading transactions...</p>
              </CardContent>
            </Card>
          ) : userTransactions.length > 0 ? (
            <div className="space-y-3">
              {userTransactions.map(transaction => (
                <TransactionItem key={transaction.id} transaction={transaction} />
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
    </Layout>
  );
};

export default Dashboard;
