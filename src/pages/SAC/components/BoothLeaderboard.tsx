
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

interface LeaderboardItem {
  id: string;
  name: string;
  totalRevenue: number;
  totalTransactions: number;
}

interface BoothLeaderboardProps {
  leaderboard: LeaderboardItem[];
}

const BoothLeaderboard: React.FC<BoothLeaderboardProps> = ({ leaderboard }) => {
  // Early return with a message if leaderboard is empty
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <>
        <h2 className="text-2xl font-bold mb-4">Booth Leaderboard</h2>
        <Card className="p-6">
          <p className="text-center text-muted-foreground">No booths data available</p>
        </Card>
      </>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold mb-4">Booth Leaderboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaderboard.map((booth, index) => (
          <Card key={booth.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{booth.name}</CardTitle>
                  <CardDescription>
                    Ranking {index + 1}
                  </CardDescription>
                </div>
                <div className="bg-primary/10 text-primary font-medium px-2 py-1 rounded text-sm">
                  ${(booth.totalRevenue || 0).toFixed(2)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Orders</span>
                  <span>{booth.totalTransactions || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Average Order</span>
                  <span>
                    ${(booth.totalTransactions > 0 
                      ? (booth.totalRevenue / booth.totalTransactions) 
                      : 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default BoothLeaderboard;
