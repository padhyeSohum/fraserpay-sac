
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import BoothCard from '@/components/BoothCard';
import { QrCode, ListOrdered, Settings, Plus, X } from 'lucide-react';
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
  const [lastBoothJoinedTime, setLastBoothJoinedTime] = useState<number>(0);
  const [displayPointsModal, setDisplayPointsModal] = useState(false);
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
      // Always refresh user data if we've recently joined a booth
      const shouldForceRefresh = now - lastBoothJoinedTime < 10000;
      
      if (now - lastUserDataFetch < 30000 && !shouldForceRefresh) {
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
    //   const {
    //     data: freshUserData,
    //     error: userError
    //   } = await supabase.from('users').select('tickets, booth_access').eq('id', user.id).single();
    //   if (userError) {
    //     console.error("Error refreshing user data:", userError);
    //     return;
    //   }
    //   if (freshUserData && user) {
    //     console.log("Dashboard - refreshed user data:", freshUserData);
    //     const newBalance = freshUserData.tickets / 100;
    //     const newBooths = freshUserData.booth_access || [];
    //     if (newBalance !== user.balance || JSON.stringify(newBooths) !== JSON.stringify(user.booths)) {
    //       console.log("Updating user data with new booths:", newBooths);
    //       updateUserData({
    //         ...user,
    //         balance: newBalance,
    //         booths: newBooths
    //       });
    //     }
    //     setVersionedStorageItem('lastUserDataFetch', now);
    //   }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [user, updateUserData, lastBoothJoinedTime]);
  const refreshUserBooths = useCallback(async () => {
    if (!user) return;
    try {
    //   console.log("Dashboard: Refreshing user booths for user", user.id);
      const booths = await fetchAllBooths();
      const userInitiatives = booths.filter(booth => booth.managers.includes(user.id) || user.booths && user.booths.includes(booth.id));
    //   console.log("Dashboard: Refreshed user booths, found", userInitiatives.length, "initiatives for user", user.id);
      setUserBooths(userInitiatives);
    } catch (error) {
      console.error("Error refreshing user booths:", error);
      setUserBooths([]);
    }
  }, [user, fetchAllBooths]);
  const fetchDataWithRetry = useCallback(async () => {
    if (!user || dataInitialized) return;
    try {
      setIsLoading(true);
      setLoadError(null);
      await refreshUserData();
      try {
        await refreshUserBooths();
      } catch (error) {
        console.error("Error loading user booths:", error);
        setUserBooths([]);
        toast.error("Failed to load your initiatives");
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

  // Effect to handle when user.booths changes
  useEffect(() => {
    if (user && user.booths) {
      console.log("Dashboard: User booths changed, refreshing...", user.booths);
      refreshUserBooths();
    }
  }, [user?.booths, refreshUserBooths]);

  // Improved effect to handle localStorage boothJoined event
  useEffect(() => {
    // Handle storage events from other tabs or from this tab
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'boothJoined') {
        console.log('Detected booth joined event, refreshing booths');
        
        try {
          // Try to parse the JSON data with timestamp
          const eventData = event.newValue ? JSON.parse(event.newValue) : null;
          if (eventData && eventData.timestamp) {
            setLastBoothJoinedTime(eventData.timestamp);
            // Force immediate refresh
            refreshUserData();
            refreshUserBooths();
          }
        } catch (err) {
          // Fall back to old behavior if parsing fails
          refreshUserBooths();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    // Check for recently joined initiative on component mount
    const checkForRecentJoin = () => {
      try {
        const boothJoinedData = localStorage.getItem('boothJoined');
        if (boothJoinedData) {
          try {
            // Try to parse as JSON first (new format)
            const eventData = JSON.parse(boothJoinedData);
            if (eventData && eventData.timestamp && Date.now() - eventData.timestamp < 10000) {
              console.log('Found recent initiative join, refreshing initiatives');
              setLastBoothJoinedTime(eventData.timestamp);
              refreshUserData();
              refreshUserBooths();
            }
          } catch (err) {
            // Fall back to old format (timestamp as string)
            const joinTime = parseInt(boothJoinedData);
            if (!isNaN(joinTime) && Date.now() - joinTime < 10000) {
              console.log('Found recent initiative join, refreshing initiatives');
              setLastBoothJoinedTime(joinTime);
              refreshUserData();
              refreshUserBooths();
            }
          }
        }
      } catch (err) {
        console.error('Error checking for recent joins:', err);
      }
    };
    
    checkForRecentJoin();
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUserBooths, refreshUserData]);
  
  useEffect(() => {
    if (user && loadUserTransactions) {
      const userTxs = loadUserTransactions(user.id);
      setUserTransactions(userTxs.slice(0, 3));
    }
  }, [recentTransactions, user, loadUserTransactions]);
  const handleHideBooth = (boothId: string) => {
    setHiddenBooths(prev => [...prev, boothId]);
    toast.success("Initiative hidden from dashboard");
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
  return <Layout logo={logo} showLogout showAddButton onAddClick={handleJoinBooth}>
      <div className="space-y-6">
        <div className="balance-card rounded-xl overflow-hidden">
          <div className="flex flex-col">
            <span className="text-white/80 mb-1">Your Balance</span>
            <span className="text-3xl font-bold">${user.balance.toFixed(2)}</span>
            <span className="text-xl font-normal flex flex-row place-items-center gap-4">
                {user.points} points 
                <button className="bg-[#885dd1] hover:bg-[#9e7bdb] rounded-full text-sm transition-all w-5 h-5 duration-200" onClick={() => setDisplayPointsModal(true)}>
                    ?
                </button>
            </span>
            <div
                className={`fixed z-10 inset-0 flex justify-center items-center p-2 ${displayPointsModal ? "pointer-events-auto" : "pointer-events-none"}`}
            >
                <div
                    className={`absolute inset-0 bg-black/80 transition-opacity duration-500 ease-in-out ${displayPointsModal ? "opacity-100" : "opacity-0"}`}
                />
                <div
                    className={`relative bg-white rounded-xl text-black p-4 w-full max-w-md transition-all duration-500 ease-in-out
                                ${displayPointsModal
                                ? "opacity-100 scale-100 translate-y-0"
                                : "opacity-0 scale-95 translate-y-4"}`}
                >
                    <div className="flex justify-between items-center">
                        <div className="font-semibold">What are FraserPoints?</div>
                        <button
                            className="hover:text-red-500 transition-all duration-200"
                            onClick={() => setDisplayPointsModal(false)}
                        >
                            <X />
                        </button>
                    </div>
                    <div className="text-sm mt-2">
                        Any time you get involved with SAC, you get FraserPoints. Volunteering, participating in Spirit Week, 
                        and making purchases at events all help you earn more points!
                    </div>
                    <div className="text-sm"></div>
                    <div className="text-sm">
                        You can redeem these points at SAC events for awesome prizes!
                    </div>
                </div>
                </div>
            
            <p className="mt-4 text-sm text-white/80">Visit the SAC table to add funds to your account</p>
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
              <span>Join Initiative</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {isLoading ? <Card>
                <CardContent className="p-6 text-center">
                  <p>Loading initiatives... this page may take up to a minute to load on PDSB wifi.</p>
                </CardContent>
              </Card> : visibleBooths.length > 0 ? visibleBooths.map(booth => <BoothCard key={booth.id} booth={booth} earnings={booth.totalEarnings} onClick={() => handleBoothCardClick(booth.id)} onRemove={handleHideBooth} />) : <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>You don't have access to any initiatives yet</p>
                  <Button variant="link" onClick={handleJoinBooth} className="mt-2">
                    Join an initiative with PIN
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
