
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/contexts/TransactionContext';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';

const Leaderboard = () => {
  const { getLeaderboard } = useTransactions();
  const navigate = useNavigate();
  
  const leaderboard = getLeaderboard();

  return (
    <Layout title="Leaderboard" showBack>
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Charity Week Leaderboard</h1>
          <p className="text-muted-foreground">
            Current standings of all booths
          </p>
        </div>
        
        <div className="space-y-4">
          {leaderboard.map((entry, index) => (
            <Card 
              key={entry.boothId}
              className={`overflow-hidden border-none shadow-md ${
                index === 0 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-white' 
                  : index === 1 
                    ? 'bg-gradient-to-r from-gray-300 to-gray-200' 
                    : index === 2 
                      ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white' 
                      : 'bg-white'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mr-3 ${
                      index === 0 
                        ? 'bg-yellow-300 text-yellow-800' 
                        : index === 1 
                          ? 'bg-gray-100 text-gray-800' 
                          : index === 2 
                            ? 'bg-amber-500 text-amber-900' 
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {index + 1}
                  </div>
                  
                  <div>
                    <div className={`font-semibold ${index < 3 ? 'text-white' : ''}`}>
                      {entry.boothName}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No booths have made sales yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
