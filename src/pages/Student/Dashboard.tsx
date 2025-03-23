
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import BoothCard from '@/components/BoothCard';
import { QrCode, ListOrdered, Settings, Plus } from 'lucide-react';
import { BentoDemo } from '@/components/dashboard/BentoDemo';

const Dashboard = () => {
  const { user } = useAuth();
  const { recentTransactions, loadUserTransactions, getBoothsByUserId, fetchAllBooths } = useTransactions();
  const navigate = useNavigate();
  
  const [userTransactions, setUserTransactions] = useState<typeof recentTransactions>([]);
  const [userBooths, setUserBooths] = useState<ReturnType<typeof getBoothsByUserId>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'classic' | 'bento'>('bento');

  useEffect(() => {
    async function loadData() {
      if (user) {
        try {
          // Refresh data
          await fetchAllBooths();
          // Load user's transactions
          const transactions = loadUserTransactions(user.id);
          setUserTransactions(transactions.slice(0, 3)); // Show only 3 most recent
          
          // Load user's booths
          const booths = getBoothsByUserId(user.id);
          setUserBooths(booths);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    loadData();
  }, [user, loadUserTransactions, getBoothsByUserId, fetchAllBooths]);

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

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'classic' ? 'bento' : 'classic');
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
    return <div>Loading...</div>;
  }

  return (
    <Layout logo={logo} showLogout showAddButton onAddClick={handleJoinBooth}>
      <div className="mb-6 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleViewMode}
          className="text-xs"
        >
          Switch to {viewMode === 'classic' ? 'Bento' : 'Classic'} View
        </Button>
      </div>

      {viewMode === 'bento' ? (
        <div className="space-y-6">
          {/* Bento Grid View */}
          <BentoDemo />
          
          {/* User's Booths Section */}
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
          
          {/* Recent Transactions */}
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
      ) : (
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="balance-card rounded-xl overflow-hidden">
            <div className="flex flex-col">
              <span className="text-white/80 mb-1">Your Balance</span>
              <span className="text-3xl font-bold">${user.balance.toFixed(2)}</span>
              
              <p className="mt-4 text-sm text-white/80">
                Visit the SAC booth to add funds to your account
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
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
          
          {/* User's Booths Section */}
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
          
          {/* Recent Transactions */}
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
      )}
    </Layout>
  );
};

export default Dashboard;
