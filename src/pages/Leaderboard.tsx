import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/contexts/transactions';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Award, Medal } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
const Leaderboard = () => {
  const {
    getLeaderboard
  } = useTransactions();
  const [leaderboardData, setLeaderboardData] = useState<{
    boothId: string;
    boothName: string;
    earnings: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);
        const data = await getLeaderboard();
        setLeaderboardData(data);
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        toast.error('Failed to load leaderboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboardData();
  }, [getLeaderboard]);
  const getIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-8 w-8 text-amber-500" />;
      case 1:
        return <Award className="h-8 w-8 text-slate-400" />;
      case 2:
        return <Medal className="h-8 w-8 text-amber-700" />;
      default:
        return null;
    }
  };
  const handleBackClick = () => {
    navigate('/dashboard');
  };
  return <Layout title="Leaderboard" showBack onBackClick={handleBackClick}>
      <div className="container mx-auto max-w-4xl py-4">
        <Card className="border shadow-sm">
          <CardHeader className="bg-card-header pb-2">
            <CardTitle className="text-2xl font-bold text-center">Booth Leaderboard</CardTitle>
            <CardDescription className="text-center">Top performing booths by earnings. Refreshed every 15 mins.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? <div className="flex justify-center p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div> : leaderboardData.length === 0 ? <p className="text-center text-muted-foreground py-8">The leaderboard is not active yet! Check back after day 1 of Charity Week :) </p> : <div className="space-y-4">
                {leaderboardData.map((booth, index) => <div key={booth.boothId}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8">
                          {getIcon(index)}
                          {index > 2 && <span className="font-semibold text-muted-foreground">{index + 1}</span>}
                        </div>
                        <div>
                          <h3 className="font-medium">{booth.boothName}</h3>
                        </div>
                      </div>
                      {/* Removed dollar amount display */}
                    </div>
                    {index < leaderboardData.length - 1 && <Separator className="mt-4" />}
                  </div>)}
              </div>}
          </CardContent>
        </Card>
      </div>
    </Layout>;
};
export default Leaderboard;