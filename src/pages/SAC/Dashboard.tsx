import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth';

const SACDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Layout
      title="SAC Dashboard"
      subtitle="Manage your student activities"
      showBack={true}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user?.name || 'Admin'}</CardTitle>
            <CardDescription>Student Activity Council Dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the SAC administration dashboard where you can manage booths, transactions, and other school activities.</p>
          </CardContent>
        </Card>

        {/* Additional SAC-specific dashboard content can be added here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Booth Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Manage booths and vendors for school events.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Transaction Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View and manage all transactions across booths.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SACDashboard;
