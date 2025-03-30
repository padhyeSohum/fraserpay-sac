
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import Layout from '@/components/Layout';
import StatCards from './components/StatCards';
import StudentSearch from './components/StudentSearch';
import BoothsList from './components/BoothsList';
import BoothLeaderboard from './components/BoothLeaderboard';
import TransactionsTable from './components/TransactionsTable';
import CreateBoothDialog from './components/CreateBoothDialog';
import FundsDialog from './components/FundsDialog';
import BulkImportDialog from './components/BulkImportDialog';
import TeacherBoothLink from './components/TeacherBoothLink';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Upload, Users } from 'lucide-react';

const SACDashboard: React.FC = () => {
  const { user } = useAuth();
  const { booths, recentTransactions, fetchAllBooths } = useTransactions();
  const [isLoadingBooths, setIsLoadingBooths] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingBooths(true);
      await fetchAllBooths();
      setIsLoadingBooths(false);
    };
    
    loadData();
  }, [fetchAllBooths]);
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  return (
    <Layout
      title="SAC Dashboard"
      showLogout={true}
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <h1 className="text-3xl font-bold">SAC Dashboard</h1>
          
          <div className="flex flex-wrap gap-2">
            <FundsDialog />
            <BulkImportDialog />
            <CreateBoothDialog />
            <TeacherBoothLink />
          </div>
        </div>
        
        <StatCards />
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <Tabs defaultValue="students">
              <TabsList>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="students" className="mt-4">
                <StudentSearch />
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-4">
                <TransactionsTable transactions={recentTransactions.slice(0, 10)} isLoading={false} />
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <BoothsList booths={booths} isLoading={isLoadingBooths} />
            <BoothLeaderboard />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SACDashboard;
