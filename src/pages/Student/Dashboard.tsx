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
import { getVersionedStorageItem, setVersionedStorageItem } from '@/utils/storageManager';
const Dashboard = () => {
  const {
    user,
    updateUserData
  } = useAuth();
  const {
    recentTransactions,
    loadUserTransactions,
    getBoothsByUserId,
    fetchAllBooths
  } = useTransactions();
  const navigate = useNavigate();
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userBooths, setUserBooths] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hiddenBooths, setHiddenBooths] = useState<string[]>([]);
  const MAX_RETRIES = 3;
  useEffect(() => {
    const storedHiddenBooths = localStorage.getItem('hiddenBooths');
    if (storedHiddenBooths) {
      setHiddenBooths(JSON.parse(storedHiddenBooths));
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('hiddenBooths', JSON.stringify(hiddenBooths));
  }, [hiddenBooths]);
  const refreshUserData = useCallback(async () => {
    if (!user) return;
    try {
      const now = Date.now();
      const lastUserDataFetch = getVersionedStorageItem<number>('lastUserDataFetch', 0);
      if (now - lastUserDataFetch < 30000) {
        const isBalanceOnlyUpdate = now - lastUserDataFetch > 5000;
        if (isBalanceOnlyUpdate) {
          const {
            data: balanceData,
            error: balanceError
          } = await supabase.from('users').select('tickets').eq('id', user.id).single();
          if (balanceError) {
            console.error("Error refreshing user balance:", balanceError);
            return;
          }
          if (balanceData && user && balanceData.tickets / 100 !== user.balance) {
            console.log("Dashboard - refreshed user balance:", balanceData.tickets / 100);
            updateUserData({
              ...user,
              balance: balanceData.tickets / 100
            });
          }
          return;
        }
        return;
      }
      const {
        data: freshUserData,
        error: userError
      } = await supabase.from('users').select('tickets, booth_access').eq('id', user.id).single();
      if (userError) {
        console.error("Error refreshing user data:", userError);
        return;
      }
      if (freshUserData && user) {
        console.log("Dashboard - refreshed user data:", freshUserData);
        const newBalance = freshUserData.tickets / 100;
        const newBooths = freshUserData.booth_access || [];
        if (newBalance !== user.balance || JSON.stringify(newBooths) !== JSON.stringify(user.booths)) {
          console.log("Updating user data with new booths:", newBooths);
          updateUserData({
            ...user,
            balance: newBalance,
            booths: newBooths
          });
        }
        setVersionedStorageItem('lastUserDataFetch', now);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [user, updateUserData]);
  const refreshUserBooths = useCallback(() => {
    if (!user) return;
    try {
      fetchAllBooths().then(() => {
        const booths = getBoothsByUserId ? getBoothsByUserId(user.id) : [];
        console.log("Dashboard: Refreshed user booths, found", booths.length, "booths for user", user.id);
        setUserBooths(booths);
      });
    } catch (error) {
      console.error("Error refreshing user booths:", error);
      setUserBooths([]);
    }
  }, [user, getBoothsByUserId, fetchAllBooths]);
  const fetchDataWithRetry = useCallback(async () => {
    if (!user || dataInitialized) return;
    try {
      setIsLoading(true);
      setLoadError(null);
      await refreshUserData();
      try {
        refreshUserBooths();
      } catch (error) {
        console.error("Error loading user booths:", error);
        setUserBooths([]);
        toast.error("Failed to load your booths");
      }
      try {
        const userTxs = loadUserTransactions ? loadUserTransactions(user.id) : [];
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
  }, [user, dataInitialized, refreshUserData, retryCount, refreshUserBooths, loadUserTransactions, MAX_RETRIES]);
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
    refreshUserData();
    refreshUserBooths();
    const intervalId = setInterval(() => {
      refreshUserData();
      refreshUserBooths();
    }, 5000);
    return () => clearInterval(intervalId);
  }, [refreshUserData, refreshUserBooths]);
  useEffect(() => {
    const handleTransactionUpdate = () => {
      refreshUserBooths();
    };
    const transactionCheckId = setInterval(handleTransactionUpdate, 5000);
    return () => {
      clearInterval(transactionCheckId);
    };
  }, [refreshUserBooths, recentTransactions]);
  useEffect(() => {
    if (user && user.booths) {
      console.log("Dashboard: User booths changed, refreshing...", user.booths);
      refreshUserBooths();
    }
  }, [user?.booths, refreshUserBooths]);
  useEffect(() => {
    if (user && loadUserTransactions) {
      const userTxs = loadUserTransactions(user.id);
      setUserTransactions(userTxs.slice(0, 3));
    }
  }, [recentTransactions, user, loadUserTransactions]);
  const handleHideBooth = (boothId: string) => {
    setHiddenBooths(prev => [...prev, boothId]);
    toast.success("Booth hidden from dashboard");
  };
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
  const logo = <div className="flex items-center mb-2">
      <div>
        <h1 className="text-xl font-bold">FraserPay</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</p>
      </div>
    </div>;
  if (!user) {
    return <Layout title="Loading...">
        <div className="flex items-center justify-center min-h-[70vh]">
          <p>Loading user data...</p>
        </div>
      </Layout>;
  }
  const visibleBooths = userBooths.filter(booth => !hiddenBooths.includes(booth.id));
  useEffect(() => {
    if (user) {
      const pollingInterval = setInterval(() => {
        refreshUserBooths();
      }, 2000);
      return () => clearInterval(pollingInterval);
    }
  }, [user, refreshUserBooths]);
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'boothJoined') {
        console.log('Detected booth joined event, refreshing booths');
        refreshUserBooths();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUserBooths]);
  return <Layout logo={logo} showLogout showAddButton onAddClick={handleJoinBooth}>
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
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white/80 hover:bg-white" onClick={handleViewQRCode}>
            <QrCode className="h-6 w-6 mb-1" />
            <span className="text-xs">QR Code</span>
          </Button>
          
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white/80 hover:bg-white" onClick={handleViewLeaderboard}>
            <ListOrdered className="h-6 w-6 mb-1" />
            <span className="text-xs">Leaderboard</span>
          </Button>
          
          <Button variant="outline" className="flex flex-col items-center justify-center h-20 bg-white/80 hover:bg-white" onClick={handleViewSettings}>
            <Settings className="h-6 w-6 mb-1" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Your initiatives</h2>
            <Button variant="ghost" size="sm" onClick={handleJoinBooth} className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Join Booth</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {isLoading ? <Card>
                <CardContent className="p-6 text-center">
                  <p>Loading booths... this page may take up to a minute to load on PDSB wifi.</p>
                </CardContent>
              </Card> : visibleBooths.length > 0 ? visibleBooths.map(booth => <BoothCard key={booth.id} booth={booth} earnings={booth.totalEarnings} onClick={() => handleBoothCardClick(booth.id)} onRemove={handleHideBooth} />) : <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>You don't have access to any booths yet</p>
                  <Button variant="link" onClick={handleJoinBooth} className="mt-2">
                    Join a booth with PIN
                  </Button>
                </CardContent>
              </Card>}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Your Recent Purchases</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>Refresh</Button>
          </div>
          
          {isLoading ? <Card>
              <CardContent className="p-6 text-center">
                <p>Loading transactions...</p>
              </CardContent>
            </Card> : userTransactions.length > 0 ? <div className="space-y-3">
              {userTransactions.map(transaction => <TransactionItem key={transaction.id} transaction={transaction} showBooth={true} />)}
            </div> : <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>No transactions yet</p>
              </CardContent>
            </Card>}
        </div>
      </div>
    </Layout>;
};
export default Dashboard;