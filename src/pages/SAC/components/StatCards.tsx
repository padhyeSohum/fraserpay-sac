
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';

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

  // Format currency properly with two decimal places
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Transactions</CardTitle>
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
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Booths</CardTitle>
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
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Users</CardTitle>
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
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Revenue</CardTitle>
          <CardDescription>All funds processed</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded"></div>
          ) : (
            <p className="text-3xl font-bold">
              ${formatCurrency(safeStats.totalRevenue)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;
