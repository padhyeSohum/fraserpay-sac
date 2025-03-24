import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';
import { ArrowRight, Plus, Receipt } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import { Link } from 'react-router-dom';
import { withRetry } from '@/utils/supabaseHelpers';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user } = useAuth();
  const { getTransactionsByUser, getLeaderboardData } = useTransactions();
  const [transactions, setTransactions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch transactions with retry logic
        const transactionData = await withRetry(
          async () => getTransactionsByUser(user?.id || ''),
          {
            maxRetries: 3,
            retryDelay: 1000,
            onRetry: (attempt, max) => {
              console.log(`Retrying transaction fetch (${attempt}/${max})...`);
            },
            onFail: (error) => {
              console.error('Failed to fetch transactions:', error);
              toast.error('Could not load your transactions. Please try again later.');
            }
          }
        );

        if (transactionData) {
          setTransactions(transactionData.slice(0, 5)); // Get latest 5 transactions
        } else {
          toast.error('No transaction data found');
        }

        // Fetch leaderboard with retry logic
        const leaderboardData = await withRetry(
          async () => getLeaderboardData(),
          {
            maxRetries: 3,
            retryDelay: 1000,
            onRetry: (attempt, max) => {
              console.log(`Retrying leaderboard fetch (${attempt}/${max})...`);
            },
            onFail: (error) => {
              console.error('Failed to fetch leaderboard:', error);
              toast.error('Could not load leaderboard data. Please try again later.');
            }
          }
        );

        if (leaderboardData) {
          setLeaderboard(leaderboardData.slice(0, 5)); // Get top 5
        } else {
          toast.error('No leaderboard data found');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Something went wrong while loading your dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchUserData();
    } else {
      toast.error('User information not available');
      setIsLoading(false);
    }
  }, [user, getTransactionsByUser, getLeaderboardData]);

  return (
    <Layout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name}!</CardTitle>
            <CardDescription>Here's a summary of your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground">Current Balance</p>
                <h2 className="text-2xl font-semibold">{formatCurrency(user?.balance)}</h2>
              </div>
            </div>
            <Button asChild>
              <Link to="/qr-code" className="w-full">
                Generate QR Code <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your last 5 transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p>Loading transactions...</p>
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                  </div>
                ))
              ) : (
                <p>No recent transactions</p>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="link" size="sm">
                <Link to="/transactions">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard</CardTitle>
              <CardDescription>Top 5 students with the highest balance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <p>Loading leaderboard...</p>
              ) : leaderboard.length > 0 ? (
                leaderboard.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">Student Number: {student.studentNumber}</p>
                    </div>
                    <p className="font-medium">{formatCurrency(student.balance)}</p>
                  </div>
                ))
              ) : (
                <p>Leaderboard data not available</p>
              )}
            </CardContent>
            <CardFooter>
              <Button asChild variant="link" size="sm">
                <Link to="/leaderboard">
                  View Full Leaderboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
