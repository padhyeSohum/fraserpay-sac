
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
}

const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Total Transactions</CardTitle>
          <CardDescription>All transactions in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{stats.totalTransactions}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Booths</CardTitle>
          <CardDescription>Active booths in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{stats.totalBooths}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
          <CardDescription>Registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">{stats.totalUsers}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Total Revenue</CardTitle>
          <CardDescription>All funds processed</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">
            ${stats.totalRevenue.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;
