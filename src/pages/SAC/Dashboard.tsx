
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import StatCards from './components/StatCards';
import UsersTable from './components/UsersTable';
import StudentSearch from './components/StudentSearch';
import TransactionsTable from './components/TransactionsTable';
import BoothLeaderboard from './components/BoothLeaderboard';
import CreateBoothDialog from './components/CreateBoothDialog';
import StudentDetailDialog from './components/StudentDetailDialog';
import FundsDialog from './components/FundsDialog';
import BoothTransactionDialog from './components/BoothTransactionDialog';
import { useTransactions } from '@/contexts/transactions';
import { generateQRCode, encodeUserData } from '@/utils/qrCode';

export interface StatsData {
  totalUsers: number;
  totalTickets: number;
  totalBooths: number;
  totalTransactions: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { addFunds, booths, fetchAllBooths, getBoothById } = useTransactions();
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionSearchTerm, setTransactionSearchTerm] = useState('');
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isBoothLoading, setIsBoothLoading] = useState(false);
  const [isBoothDialogOpen, setIsBoothDialogOpen] = useState(false);
  
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalTickets: 0,
    totalBooths: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [dataInitialized, setDataInitialized] = useState(false);
  
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  
  const [isFundsDialogOpen, setIsFundsDialogOpen] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  
  const [isBoothTransactionOpen, setIsBoothTransactionOpen] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const initializeData = async () => {
      if (dataInitialized) return;
      
      setIsLoading(true);
      
      try {
        await Promise.all([
          loadUsers(),
          loadTransactions(),
          loadBoothLeaderboard()
        ]);
        
        if (isMounted) {
          setDataInitialized(true);
        }
      } catch (error) {
        console.error("Error initializing dashboard:", error);
        if (isMounted) {
          toast.error("There was an error loading data");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeData();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  useEffect(() => {
    if (userSearchTerm) {
      const filtered = usersList.filter(user => 
        (user.name?.toLowerCase() || "").includes(userSearchTerm.toLowerCase()) || 
        (user.email?.toLowerCase() || "").includes(userSearchTerm.toLowerCase()) || 
        (user.student_number?.toLowerCase() || "").includes(userSearchTerm.toLowerCase())
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
        
        // Calculate total tickets (in cents)
        const totalTickets = data.reduce((sum, user) => sum + (user.tickets || 0), 0);
        
        setStats(prev => ({
          ...prev,
          totalUsers: data.length,
          totalTickets: totalTickets
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
    setIsTransactionLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        console.log('SAC Dashboard: Loaded transactions', data.length);
        setTransactions(data);
        
        // Calculate total revenue from transactions (in cents)
        const totalAmount = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        
        setStats(prev => ({
          ...prev,
          totalTransactions: data.length,
          totalRevenue: totalAmount / 100 // Convert cents to dollars
        }));
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setIsTransactionLoading(false);
    }
  };
  
  const loadBoothLeaderboard = async () => {
    setIsBoothLoading(true);
    try {
      // Use context's fetchAllBooths to ensure consistency
      await fetchAllBooths();
      
      if (booths && booths.length > 0) {
        console.log('SAC Dashboard: Loaded booths', booths.length);
        
        // Sort booths by earnings
        const sortedBooths = [...booths].sort((a, b) => b.totalEarnings - a.totalEarnings);
        setLeaderboard(sortedBooths);
        
        setStats(prev => ({
          ...prev,
          totalBooths: booths.length
        }));
      }
    } catch (error) {
      console.error('Error loading booths:', error);
      toast.error('Failed to load booths');
      setLeaderboard([]);
    } finally {
      setIsBoothLoading(false);
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
    
    // Generate QR code URL
    if (user.qr_code) {
      setQrCodeUrl(generateQRCode(user.qr_code));
    } else if (user.id) {
      const userData = encodeUserData(user.id);
      setQrCodeUrl(generateQRCode(userData));
      
      // Update the user's QR code if needed
      try {
        await supabase
          .from('users')
          .update({ qr_code: userData })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating QR code:', error);
      }
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
            members: [user?.id || ''],
            pin: Math.floor(100000 + Math.random() * 900000).toString(),
            sales: 0
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Booth created successfully');
      await loadBoothLeaderboard();
      
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth');
      throw error;
    } finally {
      setIsBoothLoading(false);
    }
  };
  
  const handleAddFunds = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsFundsDialogOpen(true);
  };
  
  const handleRefund = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsRefundDialogOpen(true);
  };
  
  const handleProcessAddFunds = async (studentId: string, amount: number) => {
    if (!user) {
      toast.error('You must be logged in to add funds');
      return;
    }
    
    try {
      // Convert dollars to cents for the backend
      const amountInCents = Math.round(amount * 100);
      
      const result = await addFunds(studentId, amount, user.id);
      
      if (result.success) {
        toast.success(`Successfully added $${amount.toFixed(2)} to account`);
        
        // Refresh the student data to show updated balance
        const { data: updatedUserData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', studentId)
          .single();
        
        if (!error && updatedUserData && foundStudent) {
          setFoundStudent({
            ...foundStudent,
            balance: updatedUserData.tickets / 100
          });
        }
        
        // Refresh transactions
        loadTransactions();
      } else {
        toast.error('Failed to add funds');
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
    } finally {
      setIsFundsDialogOpen(false);
    }
  };
  
  const handleProcessRefund = async (studentId: string, amount: number) => {
    if (!user) {
      toast.error('You must be logged in to process refunds');
      return;
    }
    
    try {
      // Negate the amount for refund (negative amount = refund)
      const negativeAmount = -amount;
      
      const result = await addFunds(studentId, negativeAmount, user.id);
      
      if (result.success) {
        toast.success(`Successfully refunded $${amount.toFixed(2)}`);
        
        // Refresh the student data to show updated balance
        const { data: updatedUserData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', studentId)
          .single();
        
        if (!error && updatedUserData && foundStudent) {
          setFoundStudent({
            ...foundStudent,
            balance: updatedUserData.tickets / 100
          });
        }
        
        // Refresh transactions
        loadTransactions();
      } else {
        toast.error('Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setIsRefundDialogOpen(false);
    }
  };
  
  const handlePrintQRCode = () => {
    // Implement printing functionality
    // For now, just show a toast
    toast.info('Printing QR code - This would open a print dialog in a production environment');
  };
  
  const handleNewBoothClick = () => {
    setIsBoothDialogOpen(true);
  };
  
  const handleBoothTransactionClick = () => {
    setIsBoothTransactionOpen(true);
  };
  
  return (
    <Layout title="SAC Dashboard">
      <div className="space-y-6">
        <StatCards 
          stats={stats} 
          isLoading={isLoading}
        />
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Button
            className="flex-1"
            onClick={handleNewBoothClick}
          >
            Create New Booth
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            onClick={handleBoothTransactionClick}
          >
            Process Booth Transaction
          </Button>
        </div>
        
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
            <BoothLeaderboard 
              leaderboard={leaderboard} 
              isLoading={isBoothLoading}
            />
            <TransactionsTable 
              transactions={transactions} 
              isLoading={isTransactionLoading}
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
        
        {foundStudent && (
          <StudentDetailDialog 
            student={foundStudent}
            qrCodeUrl={qrCodeUrl}
            isOpen={isStudentDetailOpen}
            onOpenChange={setIsStudentDetailOpen}
            onAddFunds={handleAddFunds}
            onRefund={handleRefund}
            onPrintQRCode={handlePrintQRCode}
          />
        )}
        
        <FundsDialog
          isOpen={isFundsDialogOpen}
          onOpenChange={setIsFundsDialogOpen}
          title="Add Funds"
          description="Add funds to student account"
          confirmLabel="Add Funds"
          studentId={selectedStudentId}
          onSubmit={handleProcessAddFunds}
          readOnlyId={true}
        />
        
        <FundsDialog
          isOpen={isRefundDialogOpen}
          onOpenChange={setIsRefundDialogOpen}
          title="Process Refund"
          description="Refund funds from student account"
          confirmLabel="Process Refund"
          confirmVariant="destructive"
          studentId={selectedStudentId}
          onSubmit={handleProcessRefund}
          readOnlyId={true}
        />
        
        <BoothTransactionDialog
          isOpen={isBoothTransactionOpen}
          onOpenChange={setIsBoothTransactionOpen}
          booths={booths}
          getBoothById={getBoothById}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
