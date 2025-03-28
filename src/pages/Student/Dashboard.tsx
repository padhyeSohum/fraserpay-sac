
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import TransactionItem from '@/components/TransactionItem';
import BoothCard from '@/components/BoothCard';
import { QrCode, ListOrdered } from 'lucide-react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { firestore } from '@/integrations/firebase/client';
import { toast } from 'sonner';
import QRCodeScanner from '@/components/QRCodeScanner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { booths, getBoothById, recentTransactions } = useTransactions();
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [recentBooths, setRecentBooths] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  
  // Fetch user transactions from Firebase
  const fetchUserTransactions = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const txRef = collection(firestore, 'transactions');
      const q = query(
        txRef,
        where('buyerId', '==', user.id),
        orderBy('timestamp', 'desc'),
        limit(5)
      );
      
      const querySnapshot = await getDocs(q);
      const txs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserTransactions(txs);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load your recent transactions');
    }
  }, [user?.id]);
  
  // Get recently visited booths
  const fetchRecentBooths = useCallback(async () => {
    if (!user?.id || !booths || booths.length === 0) return;
    
    try {
      // First try to get booths from recent transactions
      const boothIds = recentTransactions
        .filter(tx => tx.buyerId === user.id)
        .map(tx => tx.boothId)
        .filter((id, index, self) => self.indexOf(id) === index && id !== undefined)
        .slice(0, 3);
      
      if (boothIds.length > 0) {
        const recentBoothsData = boothIds
          .map(id => id && booths.find(b => b.id === id))
          .filter(Boolean);
        
        if (recentBoothsData.length > 0) {
          setRecentBooths(recentBoothsData);
          return;
        }
      }
      
      // Fallback: Just show some booths
      setRecentBooths(booths.slice(0, 3));
    } catch (error) {
      console.error('Error getting recent booths:', error);
    }
  }, [booths, recentTransactions, user?.id]);
  
  useEffect(() => {
    fetchUserTransactions();
  }, [fetchUserTransactions]);
  
  useEffect(() => {
    fetchRecentBooths();
  }, [fetchRecentBooths]);
  
  const handleScanQR = () => {
    setIsScanning(true);
  };
  
  const handleQRScanComplete = (decodedText: string) => {
    setIsScanning(false);
    
    try {
      // Check if it's a valid booth code
      if (decodedText.startsWith('booth:')) {
        const boothId = decodedText.replace('booth:', '');
        navigate(`/booth/${boothId}`);
      } else {
        toast.error('Invalid QR code');
      }
    } catch (error) {
      console.error('Error handling QR code:', error);
      toast.error('Failed to process QR code');
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-4">
        {/* Balance Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Your Balance</h2>
                <p className="text-3xl font-bold mt-2">${user?.balance?.toFixed(2) || '0.00'}</p>
              </div>
              <Button 
                onClick={handleScanQR}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {isScanning && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-4">
              <QRCodeScanner onScan={handleQRScanComplete} onClose={() => setIsScanning(false)} />
            </div>
          </div>
        )}
        
        {/* Recent Transactions */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
            <Button
              variant="outline"
              onClick={() => navigate('/transactions')}
              className="text-sm"
            >
              <ListOrdered className="mr-2 h-4 w-4" />
              View All
            </Button>
          </div>
          
          <div className="space-y-3">
            {userTransactions.length > 0 ? (
              userTransactions.map((tx) => (
                <TransactionItem 
                  key={tx.id} 
                  transaction={tx} 
                  showBooth={true} 
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Your purchases will appear here</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Booths Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Booths</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBooths.map((booth) => (
              <BoothCard
                key={booth.id}
                booth={booth}
                onClick={() => navigate(`/booth/${booth.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
