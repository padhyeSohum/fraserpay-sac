
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useTransactions } from '@/contexts/transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const Leaderboard = () => {
  const { getLeaderboard } = useTransactions();
  const navigate = useNavigate();
  
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setIsLoading(true);
      try {
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
    
    // Refresh leaderboard data every 30 seconds
    const interval = setInterval(fetchLeaderboardData, 30000);
    return () => clearInterval(interval);
  }, [getLeaderboard]);
  
  return (
    <Layout title="Leaderboard" showBack>
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-500" />
              <CardTitle>Booth Leaderboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between py-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-1/5" />
                  </div>
                ))}
              </div>
            ) : leaderboardData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Booth</TableHead>
                    <TableHead className="text-right">Total Sales</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((booth, index) => (
                    <TableRow key={booth.boothId} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>{booth.boothName}</TableCell>
                      <TableCell className="text-right">${booth.earnings.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No booths to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaderboard;
