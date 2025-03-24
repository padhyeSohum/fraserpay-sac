
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
  const { recentTransactions, loadUserTransactions, getBoothsByUserId, fetchAllBooths, refreshUserBooths } = useTransactions();
  const navigate = useNavigate();
  
  const [userTransactions, setUserTransactions] = useState<typeof recentTransactions>([]);
  const [userBooths, setUserBooths] = useState<ReturnType<typeof getBoothsByUserId>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);

  // Enhanced refreshUserData with better error handling
  const refreshUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      console.log("Dashboard - refreshing user data for user:", user.id);
      const { data: freshUserData, error: userError } = await supabase
        .from('users')
        .select('tickets, booth_access')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error("Error fetching user data:", userError);
        return false;
      }
      
      if (freshUserData) {
        console.log("Dashboard - refreshed user data:", freshUserData);
        
        // Update the user context with the fresh data
        updateUserData({
          ...user,
          balance: freshUserData.tickets / 100,
          booths: freshUserData.booth_access || []
        });
        
        // If booth access has changed, refresh booth data
        if (JSON.stringify(user.booths) !== JSON.stringify(freshUserData.booth_access)) {
          console.log("Booth access changed, refreshing booths");
          await refreshUserBooths();
          const booths = getBoothsByUserId(user.id);
          setUserBooths(booths);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return false;
    }
  }, [user, updateUserData, getBoothsByUserId, refreshUserBooths]);

  // Initial data loading effect with improved error handling
  useEffect(() => {
    let isMounted = true;
    
    async function loadData() {
      if (!user || dataInitialized) return;
      
      console.log("Dashboard - loading initial data for user:", user.name);
      
      try {
        setIsLoading(true);
        
        // Refresh user data first
        await refreshUserData();
        
        if (!isMounted) return;
        
        // Load booths data
        console.log("Dashboard - fetching all booths");
        const allBooths = await fetchAllBooths();
        
        if (!isMounted) return;
        
        console.log("Dashboard - fetched booths:", allBooths.length);
        
        // Load transactions data
        console.log("Dashboard - loading user transactions");
        const transactions = loadUserTransactions(user.id);
        if (isMounted) {
          console.log("Dashboard - loaded transactions:", transactions.length);
          setUserTransactions(transactions.slice(0, 3));
        }
        
        // Load user's booths
        console.log("Dashboard - loading user booths");
        const booths = getBoothsByUserId(user.id);
        if (isMounted) {
          console.log("Dashboard - loaded user booths:", booths.length);
          setUserBooths(booths);
          setDataInitialized(true);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (isMounted) {
          toast.error('Error loading dashboard data. Please try refreshing the page.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user, dataInitialized, loadUserTransactions, getBoothsByUserId, fetchAllBooths, refreshUserData]);

  // Real-time subscription effect
  useEffect(() => {
    if (!user) return;
    
    console.log("Dashboard - setting up real-time subscriptions");
    
    // Subscribe to booth changes
    const boothsChannel = supabase
      .channel('public:booths')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'booths' }, 
        async (payload) => {
          console.log('Booths table changed:', payload);
          await refreshUserBooths();
          const booths = getBoothsByUserId(user.id);
          setUserBooths(booths);
        }
      )
      .subscribe();

    // Subscribe to user changes
    const userChannel = supabase
      .channel('public:users')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, 
        async (payload) => {
          console.log('User updated:', payload);
          await refreshUserData();
        }
      )
      .subscribe();
      
    return () => {
      console.log("Dashboard - cleaning up subscriptions");
      supabase.removeChannel(boothsChannel);
      supabase.removeChannel(userChannel);
    };
  }, [user, refreshUserData, getBoothsByUserId, refreshUserBooths]);

  // Periodic refresh effect
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (user) {
        console.log("Dashboard - periodic refresh");
        refreshUserData();
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [refreshUserData, user]);

  // Ensure booth list is up to date whenever the user changes
  useEffect(() => {
    if (user && dataInitialized) {
      console.log("Dashboard - updating booth list after user change");
      const booths = getBoothsByUserId(user.id);
      setUserBooths(booths);
    }
  }, [user, dataInitialized, getBoothsByUserId]);

  // Navigation handlers
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

  // If no user is present, show a minimal loading state
  if (!user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-96">
          <p>Loading your dashboard...</p>
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
