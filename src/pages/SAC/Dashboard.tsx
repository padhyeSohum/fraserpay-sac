
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { encodeUserData, generateQRCode } from '@/utils/qrCode';
import StatCards from './components/StatCards';
import UsersTable from './components/UsersTable';
import StudentSearch from './components/StudentSearch';
import TransactionsTable from './components/TransactionsTable';
import BoothLeaderboard from './components/BoothLeaderboard';
import CreateBoothDialog from './components/CreateBoothDialog';
import StudentDetailDialog from './components/StudentDetailDialog';
import FundsDialog from './components/FundsDialog';
import BoothTransactionDialog from './components/BoothTransactionDialog';

export interface StatsData {
  totalUsers: number;
  totalTickets: number;
  totalBooths: number;
  totalTransactions: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isBoothDialogOpen, setIsBoothDialogOpen] = useState(false);
  const [isBoothLoading, setIsBoothLoading] = useState(false);
  
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalTickets: 0,
    totalBooths: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });
  
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  
  useEffect(() => {
    loadUsers();
    loadTransactions();
    loadBoothLeaderboard();
  }, []);
  
  useEffect(() => {
    if (userSearchTerm) {
      const filtered = usersList.filter(user => 
        user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
        user.student_number?.toLowerCase().includes(userSearchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(usersList);
    }
  }, [userSearchTerm, usersList]);
  
  const loadUsers = async () => {
    setIsUserLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        console.log('SAC Dashboard: Loaded users', data.length);
        setUsersList(data);
        setFilteredUsers(data);
        
        setStats(prev => ({
          ...prev,
          totalUsers: data.length
        }));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
      setUsersList([]);
      setFilteredUsers([]);
    } finally {
      setIsUserLoading(false);
    }
  };
  
  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      if (data) {
        console.log('SAC Dashboard: Loaded transactions', data.length);
        setTransactions(data);
        
        setStats(prev => ({
          ...prev,
          totalTransactions: data.length
        }));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    }
  };
  
  const loadBoothLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('booths')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        // Simulate leaderboard data since we don't have real sales data
        const leaderboardData = data.map(booth => ({
          ...booth,
          sales: Math.floor(Math.random() * 50),
          revenue: Math.random() * 1000
        })).sort((a, b) => b.revenue - a.revenue);
        
        setLeaderboard(leaderboardData);
        
        setStats(prev => ({
          ...prev,
          totalBooths: data.length,
          totalRevenue: leaderboardData.reduce((sum, booth) => sum + booth.revenue, 0)
        }));
      }
    } catch (error) {
      console.error('Error loading booths:', error);
      toast.error('Failed to load booths');
      setLeaderboard([]);
    }
  };
  
  const handleStudentFound = async (student: any, qrUrl: string) => {
    // Get the latest user data to ensure we have the current balance
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', student.id)
        .single();
      
      if (!error && userData) {
        // Update with the latest data from Supabase
        setFoundStudent({
          ...student,
          balance: userData.tickets / 100
        });
      } else {
        setFoundStudent(student);
      }
    } catch (error) {
      console.error('Error fetching latest user data:', error);
      setFoundStudent(student);
    }
    
    setQrCodeUrl(qrUrl);
    setIsStudentDetailOpen(true);
  };
  
  const handleUserSelected = async (user: any) => {
    // Get the latest user data to ensure we have the current balance
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && userData) {
        // Use the latest data from Supabase
        user = userData;
      }
    } catch (error) {
      console.error('Error fetching latest user data:', error);
    }
    
    const student = {
      id: user.id,
      name: user.name,
      studentNumber: user.student_number,
      email: user.email,
      balance: user.tickets / 100,
      qrCode: user.qr_code
    };
    
    setFoundStudent(student);
    
    if (user.qr_code || user.id) {
      const userData = user.qr_code || encodeUserData(user.id);
      const qrUrl = generateQRCode(userData);
      setQrCodeUrl(qrUrl);
    }
    
    setIsStudentDetailOpen(true);
  };
  
  const handleCreateBooth = async (boothData: { name: string; description: string; }) => {
    setIsBoothLoading(true);
    try {
      const { data, error } = await supabase
        .from('booths')
        .insert([
          { 
            name: boothData.name,
            description: boothData.description,
            members: [user?.id || ''],  // Changed from 'managers' to 'members' to match Supabase schema
            pin: Math.floor(100000 + Math.random() * 900000).toString(), // Generate a random PIN
            sales: 0
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Booth created successfully');
      loadBoothLeaderboard(); // Refresh booth data
      
      // Return void as expected by the component props
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth');
      throw error;
    } finally {
      setIsBoothLoading(false);
    }
  };
  
  const handleAddFunds = (studentId: string) => {
    // This would be implemented with a dialog to add funds
    toast.info('Add funds functionality would open a dialog');
  };
  
  const handleRefund = (studentId: string) => {
    // This would be implemented with a dialog to process refunds
    toast.info('Refund functionality would open a dialog');
  };
  
  const handlePrintQRCode = () => {
    // This would implement printing functionality
    toast.info('Print QR code functionality');
  };
  
  return (
    <Layout title="SAC Dashboard">
      <div className="space-y-6">
        <StatCards stats={stats} />
        
        <StudentSearch onStudentFound={handleStudentFound} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <UsersTable 
              users={filteredUsers} 
              isLoading={isUserLoading} 
              searchTerm={userSearchTerm}
              onSearchChange={setUserSearchTerm}
              onUserSelect={handleUserSelected}
            />
          </div>
          <div className="space-y-6">
            <BoothLeaderboard leaderboard={leaderboard} />
            <TransactionsTable 
              transactions={transactions} 
              searchTerm={transactionSearchTerm}
              onSearchChange={setTransactionSearchTerm}
            />
          </div>
        </div>
        
        <CreateBoothDialog 
          isOpen={isBoothDialogOpen}
          onOpenChange={setIsBoothDialogOpen}
          onCreateBooth={handleCreateBooth}
          isLoading={isBoothLoading}
        />
        
        <StudentDetailDialog 
          student={foundStudent}
          qrCodeUrl={qrCodeUrl}
          isOpen={isStudentDetailOpen}
          onOpenChange={setIsStudentDetailOpen}
          onAddFunds={handleAddFunds}
          onRefund={handleRefund}
          onPrintQRCode={handlePrintQRCode}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
