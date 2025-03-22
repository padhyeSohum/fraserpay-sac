
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import BoothCard from '@/components/BoothCard';
import { QrCode, ListOrdered, Settings, Plus } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { recentTransactions, loadUserTransactions, getBoothsByUserId } = useTransactions();
  const navigate = useNavigate();
  
  const [userTransactions, setUserTransactions] = useState<typeof recentTransactions>([]);
  const [userBooths, setUserBooths] = useState<ReturnType<typeof getBoothsByUserId>>([]);

  useEffect(() => {
    if (user) {
      // Load user's transactions
      const transactions = loadUserTransactions(user.id);
      setUserTransactions(transactions.slice(0, 3)); // Show only 3 most recent
      
      // Load user's booths
      const booths = getBoothsByUserId(user.id);
      setUserBooths(booths);
    }
  }, [user, loadUserTransactions, getBoothsByUserId]);

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
      <div className="w-10 h-10 rounded-full bg-brand-100 mr-3">
        <div className="w-full h-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-brand-600"
          >
            <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" x2="12.01" y1="17" y2="17" />
          </svg>
        </div>
      </div>
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
      <div className="space-y-6 animate-fade-in">
        {/* Balance Card */}
        <div className="balance-card rounded-xl overflow-hidden">
          <div className="flex flex-col">
            <span className="text-white/80 mb-1">Your Balance</span>
            <span className="text-3xl font-bold">${user.balance.toFixed(2)}</span>
            
            <Button 
              variant="secondary" 
              size="sm" 
              className="mt-4 bg-white/20 hover:bg-white/30 text-white"
              onClick={() => navigate('/add-funds')}
            >
              Add Funds
            </Button>
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
        {userBooths.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Your Booths</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {userBooths.map(booth => (
                <BoothCard
                  key={booth.id}
                  booth={booth}
                  userRole="manager"
                  earnings={booth.totalEarnings}
                  onClick={() => handleBoothCardClick(booth.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Transactions */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>
              View All
            </Button>
          </div>
          
          {userTransactions.length > 0 ? (
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
