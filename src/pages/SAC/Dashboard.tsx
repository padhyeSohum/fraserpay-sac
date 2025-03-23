import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { encodeUserData, generateQRCode } from '@/utils/qrCode';
import { supabase } from '@/integrations/supabase/client';

// Import our new components
import StatCards from './components/StatCards';
import StudentSearch from './components/StudentSearch';
import TransactionsTable from './components/TransactionsTable';
import UsersTable from './components/UsersTable';
import BoothLeaderboard from './components/BoothLeaderboard';
import CreateBoothDialog from './components/CreateBoothDialog';
import BoothTransactionDialog from './components/BoothTransactionDialog';
import StudentDetailDialog from './components/StudentDetailDialog';
import FundsDialog from './components/FundsDialog';

const SACDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    getSACTransactions, 
    getLeaderboard, 
    addFunds, 
    booths, 
    loadBooths,
    fetchAllBooths,
    createBooth,
    getBoothById,
    processPurchase,
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    incrementQuantity,
    decrementQuantity,
    addProductToBooth,
    findUserByStudentNumber
  } = useTransactions();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  
  const [isCreateBoothOpen, setIsCreateBoothOpen] = useState(false);
  const [isBoothLoading, setIsBoothLoading] = useState(false);
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  
  const [isBoothTransactionOpen, setIsBoothTransactionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooths: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });
  
  useEffect(() => {
    if (user && user.role === 'sac') {
      console.log('SAC Dashboard: Initializing data');
      loadData();
    }
  }, [user]);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      await loadBooths();
      
      let allTransactions = [];
      try {
        allTransactions = getSACTransactions() || [];
        console.log('SAC Dashboard: Loaded transactions', allTransactions.length);
      } catch (error) {
        console.error('Error loading transactions:', error);
        allTransactions = [];
      }
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      
      let boothLeaderboard = [];
      try {
        boothLeaderboard = getLeaderboard() || [];
        console.log('SAC Dashboard: Loaded leaderboard', boothLeaderboard.length);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        boothLeaderboard = [];
      }
      setLeaderboard(boothLeaderboard);
      
      await loadUsers();
      
      calculateStats(allTransactions);
    } catch (error) {
      console.error('Error loading SAC dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateStats = (allTransactions: any[]) => {
    const totalRevenue = allTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    setStats({
      totalUsers: usersList.length,
      totalBooths: booths.length,
      totalTransactions: allTransactions.length,
      totalRevenue
    });
  };
  
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
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter(
        transaction => 
          (transaction.buyerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (transaction.boothName && transaction.boothName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (transaction.id && transaction.id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredTransactions(filtered);
    }
  }, [searchTerm, transactions]);
  
  useEffect(() => {
    if (userSearchTerm.trim() === '') {
      setFilteredUsers(usersList);
    } else {
      const filtered = usersList.filter(
        user => 
          (user.name && user.name.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
          (user.email && user.email.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
          (user.student_number && user.student_number.toLowerCase().includes(userSearchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [userSearchTerm, usersList]);
  
  const handleHomeClick = () => {
    navigate('/dashboard');
  };

  const handleAddFunds = async (studentId: string, amount: number) => {
    if (!user) {
      toast.error('You must be logged in to add funds');
      return;
    }
    
    try {
      const result = await addFunds(studentId, amount, user.id);
      
      if (result.success) {
        setIsAddFundsOpen(false);
        setStudentId('');
        toast.success(`Successfully added $${amount.toFixed(2)} to account`);
        
        const allTransactions = getSACTransactions();
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
        calculateStats(allTransactions);
        
        if (foundStudent && foundStudent.id === studentId) {
          const { data: updatedUser } = await supabase
            .from('users')
            .select('tickets')
            .eq('id', studentId)
            .single();
            
          if (updatedUser) {
            setFoundStudent({
              ...foundStudent, 
              balance: updatedUser.tickets / 100
            });
          } else {
            setFoundStudent({
              ...foundStudent, 
              balance: (result.updatedBalance || foundStudent.balance)
            });
          }
        }
        
        await loadUsers();
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
    }
  };
  
  const handleRefundFunds = async (studentId: string, amount: number) => {
    if (!user) {
      toast.error('You must be logged in to refund funds');
      return;
    }
    
    try {
      const result = await addFunds(studentId, -amount, user.id);
      
      if (result.success) {
        setIsRefundOpen(false);
        setStudentId('');
        toast.success(`Successfully refunded $${amount.toFixed(2)} from account`);
        
        const allTransactions = getSACTransactions();
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
        calculateStats(allTransactions);
        
        if (foundStudent && foundStudent.id === studentId) {
          const { data: updatedUser } = await supabase
            .from('users')
            .select('tickets')
            .eq('id', studentId)
            .single();
            
          if (updatedUser) {
            setFoundStudent({
              ...foundStudent, 
              balance: updatedUser.tickets / 100
            });
          } else {
            setFoundStudent({
              ...foundStudent, 
              balance: (result.updatedBalance || foundStudent.balance)
            });
          }
        }
        
        await loadUsers();
      }
    } catch (error) {
      console.error('Error refunding funds:', error);
      toast.error('Failed to refund funds');
    }
  };
  
  const handleStudentFound = (student: any, qrUrl: string) => {
    setFoundStudent(student);
    setQrCodeUrl(qrUrl);
    setIsStudentDetailOpen(true);
  };
  
  const handleCreateBooth = async (
    name: string, 
    description: string, 
    customPin: string, 
    products: Array<{name: string, price: string}>
  ) => {
    if (!name.trim()) {
      toast.error('Please enter a booth name');
      return;
    }
    
    if (customPin && (customPin.length !== 6 || !/^\d+$/.test(customPin))) {
      toast.error('PIN must be a 6-digit number');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to create a booth');
      return;
    }
    
    setIsBoothLoading(true);
    
    try {
      const boothId = await createBooth(name, description, user.id, customPin);
      
      if (boothId) {
        const productPromises = products
          .filter(p => p.name.trim() && p.price.trim() && !isNaN(parseFloat(p.price)))
          .map(p => addProductToBooth(boothId, {
            name: p.name,
            price: parseFloat(p.price)
          }));
        
        if (productPromises.length > 0) {
          await Promise.all(productPromises);
        }
        
        setIsCreateBoothOpen(false);
        
        toast.success('Booth created successfully');
        
        await loadBooths();
        
        setStats(prev => ({
          ...prev,
          totalBooths: booths.length + 1
        }));
      }
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth');
    } finally {
      setIsBoothLoading(false);
    }
  };
  
  const handlePrintQRCode = () => {
    if (!qrCodeUrl) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print the QR code');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            body { 
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .container {
              text-align: center;
            }
            .qr-code {
              width: 400px;
              height: 400px;
              margin: 20px auto;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 5px;
            }
            p {
              margin: 5px 0;
              font-size: 16px;
            }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${foundStudent.name}</h1>
            <p>Student ID: ${foundStudent.studentNumber || 'N/A'}</p>
            <p>Balance: $${foundStudent.balance?.toFixed(2) || '0.00'}</p>
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="QR Code" style="width: 100%; height: 100%;" />
            </div>
            <button onclick="window.print(); setTimeout(() => window.close(), 500);">
              Print QR Code
            </button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  const handleUserSelected = (user: any) => {
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
  
  if (!user || user.role !== 'sac') {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">SAC Dashboard</h1>
        </div>
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center">
            <p className="text-muted-foreground mb-2">Loading dashboard data...</p>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">SAC Dashboard</h1>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleHomeClick}
          title="Home"
        >
          <Home className="h-5 w-5" />
        </Button>
      </div>
      
      <StatCards stats={stats} />
      
      <StudentSearch onStudentFound={handleStudentFound} />
      
      <div className="flex justify-end gap-2 mb-6">
        <BoothTransactionDialog 
          isOpen={isBoothTransactionOpen}
          onOpenChange={setIsBoothTransactionOpen}
          booths={booths}
          getBoothById={getBoothById}
          cart={cart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          incrementQuantity={incrementQuantity}
          decrementQuantity={decrementQuantity}
          findUserByStudentNumber={findUserByStudentNumber}
          processPurchase={processPurchase}
          userId={user?.id}
          userName={user?.name}
        />
        
        <CreateBoothDialog
          isOpen={isCreateBoothOpen}
          onOpenChange={setIsCreateBoothOpen}
          onCreateBooth={handleCreateBooth}
          isLoading={isBoothLoading}
        />
        
        <Button
          onClick={() => {
            setStudentId('');
            setIsAddFundsOpen(true);
          }}
        >
          Add Funds to Student
        </Button>
      </div>
      
      <StudentDetailDialog
        isOpen={isStudentDetailOpen}
        onOpenChange={setIsStudentDetailOpen}
        student={foundStudent}
        qrCodeUrl={qrCodeUrl}
        onAddFunds={(id) => {
          setStudentId(id);
          setIsAddFundsOpen(true);
        }}
        onRefund={(id) => {
          setStudentId(id);
          setIsRefundOpen(true);
        }}
        onPrintQRCode={handlePrintQRCode}
      />
      
      <FundsDialog
        isOpen={isAddFundsOpen}
        onOpenChange={setIsAddFundsOpen}
        title="Add Funds to Student Account"
        description="Enter the student ID and amount to add funds to their account."
        confirmLabel="Add Funds"
        studentId={studentId}
        onSubmit={handleAddFunds}
        readOnlyId={!!foundStudent}
      />
      
      <FundsDialog
        isOpen={isRefundOpen}
        onOpenChange={setIsRefundOpen}
        title="Refund Student Account"
        description="Enter the student ID and amount to refund from their account."
        confirmLabel="Refund"
        confirmVariant="destructive"
        studentId={studentId}
        onSubmit={handleRefundFunds}
        readOnlyId={!!foundStudent}
      />
      
      <Tabs defaultValue="transactions" className="mb-6">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <TransactionsTable 
                transactions={filteredTransactions}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <UsersTable 
                users={filteredUsers}
                isLoading={isUserLoading}
                searchTerm={userSearchTerm}
                onSearchChange={setUserSearchTerm}
                onUserSelect={handleUserSelected}
              />
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
      
      <BoothLeaderboard leaderboard={leaderboard} />
    </div>
  );
};

export default SACDashboard;
