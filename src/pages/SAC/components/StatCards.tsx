
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsData } from '../Dashboard';
import { Users, Building, CreditCard, DollarSign } from 'lucide-react';

interface StatCardsProps {
  stats: StatsData;
  isLoading?: boolean;
}

const StatCards: React.FC<StatCardsProps> = ({ stats, isLoading = false }) => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Users className="h-5 w-5 text-blue-500" />}
        title="Total Students"
        value={stats.totalUsers}
        isLoading={isLoading}
      />
      <StatCard
        icon={<Building className="h-5 w-5 text-green-500" />}
        title="Total Booths"
        value={stats.totalBooths}
        isLoading={isLoading}
      />
      <StatCard
        icon={<CreditCard className="h-5 w-5 text-purple-500" />}
        title="Total Funds Added"
        value={`$${stats.totalTickets.toFixed(2)}`}
        isLoading={isLoading}
      />
      <StatCard
        icon={<DollarSign className="h-5 w-5 text-brand-500" />}
        title="Total Sales"
        value={`$${stats.totalRevenue.toFixed(2)}`}
        isLoading={isLoading}
      />
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, isLoading = false }) => {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="bg-primary-50 p-2 rounded-md">{icon}</div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <h3 className="text-2xl font-semibold mt-1">{value}</h3>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCards;
