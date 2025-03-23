
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';

interface StatsData {
  totalUsers: number;
  totalBooths: number;
  totalTransactions: number;
  totalRevenue: number;
}

interface StatCardsProps {
  stats: StatsData;
  isLoading?: boolean;
}

const StatCards: React.FC<StatCardsProps> = ({ 
  stats, 
  isLoading = false 
}) => {
  // Use default values if stats are undefined
  const safeStats = {
    totalUsers: stats?.totalUsers || 0,
    totalBooths: stats?.totalBooths || 0,
    totalTransactions: stats?.totalTransactions || 0,
    totalRevenue: stats?.totalRevenue || 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Total Transactions</CardTitle>
          <CardDescription>All transactions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold">{safeStats.totalTransactions}</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Total Booths</CardTitle>
          <CardDescription>Active booths in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold">{safeStats.totalBooths}</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Total Users</CardTitle>
          <CardDescription>Registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold">{safeStats.totalUsers}</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Total Revenue</CardTitle>
          <CardDescription>All funds processed</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold">
              ${safeStats.totalRevenue.toFixed(2)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;
