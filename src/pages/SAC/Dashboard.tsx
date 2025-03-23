
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

const Dashboard = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    totalBooths: 0,
    totalTransactions: 0
  });
  
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  
  useEffect(() => {
    loadUsers();
  }, []);
  
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
              onUserSelected={handleUserSelected}
            />
          </div>
          <div className="space-y-6">
            <BoothLeaderboard />
            <TransactionsTable />
          </div>
        </div>
        
        <CreateBoothDialog />
        
        <StudentDetailDialog 
          student={foundStudent}
          qrCodeUrl={qrCodeUrl}
          isOpen={isStudentDetailOpen}
          onOpenChange={setIsStudentDetailOpen}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
