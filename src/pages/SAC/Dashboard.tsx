import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { UserPlus, Upload } from 'lucide-react';
import StatCards from './components/StatCards';
import UsersTable from './components/UsersTable';
import StudentSearch from './components/StudentSearch';
import TransactionsTable from './components/TransactionsTable';
import BoothLeaderboard from './components/BoothLeaderboard';
import BoothsList from './components/BoothsList';
import CreateBoothDialog from './components/CreateBoothDialog';
import StudentDetailDialog from './components/StudentDetailDialog';
import FundsDialog from './components/FundsDialog';
import BoothTransactionDialog from './components/BoothTransactionDialog';
import AddUserDialog from './components/AddUserDialog';
import BulkImportDialog from './components/BulkImportDialog';
import { useTransactions } from '@/contexts/transactions';
import { generateQRCode, encodeUserData } from '@/utils/qrCode';
import { formatCurrency } from '@/utils/format';
import { firestore } from '@/integrations/firebase/client';
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { transformFirebaseUser } from '@/utils/firebase';

export interface StatsData {
  totalUsers: number;
  totalTickets: number;
  totalBooths: number;
  totalTransactions: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { 
    addFunds, 
    booths, 
    fetchAllBooths, 
    getBoothById, 
    createBooth: createBoothFromContext,
    addProductToBooth: addProductToBoothFromContext 
  } = useTransactions();
  
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
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  
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
    const initializeListeners = async () => {
      const pollInterval = setInterval(() => {
        if (dataInitialized) {
          loadUsers();
          loadTransactions();
          loadBoothLeaderboard();
        }
      }, 30000);
      
      return () => clearInterval(pollInterval);
    };
    
    initializeListeners();
  }, [dataInitialized]);
  
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
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const users = querySnapshot.docs.map(doc => {
        const userData = doc.data();
        userData.id = doc.id;
        return userData;
      });
      
      console.log('SAC Dashboard: Loaded users from Firebase', users.length);
      setUsersList(users);
      setFilteredUsers(users);
      
      const totalTickets = users.reduce((sum, user) => sum + (user.tickets || 0), 0) / 100;
      
      setStats(prev => ({
        ...prev,
        totalUsers: users.length,
        totalTickets: totalTickets
      }));
    } catch (error) {
      console.error('Error loading users from Firebase:', error);
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
      const transactionsRef = collection(firestore, 'transactions');
      const q = query(transactionsRef, orderBy('created_at', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const txs = querySnapshot.docs.map(doc => {
        const txData = doc.data();
        txData.id = doc.id;
        return txData;
      });
      
      console.log('SAC Dashboard: Loaded transactions from Firebase', txs.length);
      setTransactions(txs);
      
      const totalAmount = txs.reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalTransactions: txs.length,
        totalRevenue: totalAmount / 100
      }));
    } catch (error) {
      console.error('Error loading transactions from Firebase:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setIsTransactionLoading(false);
    }
  };
  
  const loadBoothLeaderboard = async () => {
    setIsBoothLoading(true);
    try {
      await fetchAllBooths();
      
      if (booths && booths.length > 0) {
        console.log('SAC Dashboard: Loaded booths', booths.length);
        
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
    try {
      const userRef = doc(firestore, 'users', student.id);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setFoundStudent({
          ...student,
          balance: (userData.tickets || 0) / 100
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
    try {
      const userRef = doc(firestore, 'users', user.id);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        user = userSnap.data();
        user.id = userSnap.id;
      }
    } catch (error) {
      console.error('Error fetching latest user data:', error);
    }
    
    const student = {
      id: user.id,
      name: user.name,
      studentNumber: user.student_number,
      email: user.email,
      balance: (user.tickets || 0) / 100,
      qrCode: user.qr_code
    };
    
    setFoundStudent(student);
    
    if (user.qr_code) {
      setQrCodeUrl(generateQRCode(user.qr_code));
    } else if (user.id) {
      const userData = encodeUserData(user.id);
      setQrCodeUrl(generateQRCode(userData));
      
      try {
        await updateDoc(doc(firestore, 'users', user.id), { 
          qr_code: userData 
        });
      } catch (error) {
        console.error('Error updating QR code:', error);
      }
    }
    
    setIsStudentDetailOpen(true);
  };
  
  const handleCreateBooth = async (boothData: { 
    name: string; 
    description: string; 
    pin: string;
    products: { name: string; price: number; image?: string }[];
  }) => {
    setIsBoothLoading(true);
    
    try {
      if (!user) {
        throw new Error("You must be logged in to create a booth");
      }
      
      console.log("Creating booth with data:", {
        name: boothData.name,
        description: boothData.description,
        pin: boothData.pin,
        products: boothData.products
      });
      
      const boothId = await createBoothFromContext(
        boothData.name,
        boothData.description || '',
        user.id,
        boothData.pin
      );
      
      if (!boothId) {
        throw new Error("Failed to create booth");
      }
      
      console.log("Booth created successfully with ID:", boothId);
      
      if (boothData.products && boothData.products.length > 0) {
        console.log("Adding products to booth:", boothData.products);
        
        for (const product of boothData.products) {
          await addProductToBoothFromContext(boothId, product);
        }
      }
      
      await loadBoothLeaderboard();
      
      toast.success('Booth created successfully');
      
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error('Failed to create booth: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
      const result = await addFunds(studentId, amount, user.id);
      
      if (result.success) {
        toast.success(`Successfully added $${amount.toFixed(2)} to account`);
        
        const userRef = doc(firestore, 'users', studentId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && foundStudent) {
          const userData = userSnap.data();
          setFoundStudent({
            ...foundStudent,
            balance: (userData.tickets || 0) / 100
          });
        }
        
        await loadUsers();
        await loadTransactions();
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
      const negativeAmount = -amount;
      
      const result = await addFunds(studentId, negativeAmount, user.id);
      
      if (result.success) {
        toast.success(`Successfully refunded $${amount.toFixed(2)}`);
        
        const userRef = doc(firestore, 'users', studentId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && foundStudent) {
          const userData = userSnap.data();
          setFoundStudent({
            ...foundStudent,
            balance: (userData.tickets || 0) / 100
          });
        }
        
        await loadUsers();
        await loadTransactions();
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
    if (!foundStudent || !foundStudent.qrCode) {
      toast.error('No QR code available to print');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Unable to open print window. Please check your popup blocker settings.');
      return;
    }

    const studentInfo = foundStudent.name || 'Student';
    const studentId = foundStudent.studentNumber || '';
    const qrCodeValue = foundStudent.qrCode || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${studentInfo}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            max-width: 400px;
          }
          .student-info {
            margin-bottom: 20px;
          }
          .qr-code {
            margin: 20px 0;
            display: flex;
            justify-content: center;
          }
          h1 {
            margin-bottom: 5px;
          }
          @media print {
            body {
              padding: 0;
            }
            button {
              display: none;
            }
          }
        </style>
        <script src="https://unpkg.com/qrcode.react@4.2.0/dist/qrcode.react.js"></script>
        <script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
      </head>
      <body>
        <div class="container">
          <div class="student-info">
            <h1>${studentInfo}</h1>
            ${studentId ? `<p>Student ID: ${studentId}</p>` : ''}
            <p>Balance: $${typeof foundStudent.balance === 'number' ? foundStudent.balance.toFixed(2) : '0.00'}</p>
          </div>
          <div class="qr-code">
            ${qrCodeValue ? 
              `<div id="qrcode"></div>` : 
              `<p>No QR code available</p>`
            }
          </div>
          <button onclick="window.print(); window.close();">Print QR Code</button>
        </div>
        <script>
          if (document.getElementById('qrcode') && "${qrCodeValue}") {
            var qrElement = React.createElement(QRCode.QRCodeSVG, {
              value: "${qrCodeValue}",
              size: 300,
              level: "M"
            });
            ReactDOM.render(qrElement, document.getElementById('qrcode'));
            
            setTimeout(() => {
              window.print();
            }, 1000);
          }
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    toast.success('QR code sent to printer');
  };
  
  const handleNewBoothClick = () => {
    setIsBoothDialogOpen(true);
  };
  
  const handleBoothTransactionClick = () => {
    setIsBoothTransactionOpen(true);
  };

  const handleAddUserClick = () => {
    setIsAddUserDialogOpen(true);
  };

  const handleUserAdded = () => {
    loadUsers();
  };
  
  const handleBulkImportClick = () => {
    setIsBulkImportOpen(true);
  };
  
  return (
    <Layout 
      title="SAC Dashboard" 
      showBack={true}
    >
      <div className="w-full space-y-6">
        <StatCards 
          stats={stats} 
          isLoading={isLoading}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
          <Button
            onClick={handleNewBoothClick}
            size="lg"
            className="w-full"
          >
            Create New Booth
          </Button>
          <Button
            variant="outline"
            onClick={handleBoothTransactionClick}
            size="lg"
            className="w-full"
          >
            Process Booth Transaction
          </Button>
          <Button
            onClick={handleAddUserClick}
            size="lg"
            className="w-full"
            variant="secondary"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
          <Button
            onClick={handleBulkImportClick}
            size="lg"
            className="w-full"
            variant="default"
          >
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
        </div>
        
        <StudentSearch onStudentFound={handleStudentFound} />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <UsersTable 
              users={filteredUsers} 
              isLoading={isUserLoading} 
              searchTerm={userSearchTerm}
              onSearchChange={setUserSearchTerm}
              onUserSelect={handleUserSelected}
            />
            
            <BoothsList
              booths={booths}
              isLoading={isBoothLoading}
            />
          </div>
          
          <div className="lg:col-span-5 space-y-6">
            <BoothLeaderboard 
              leaderboard={leaderboard} 
              isLoading={isBoothLoading}
            />
          </div>
        </div>
        
        <TransactionsTable 
          transactions={transactions} 
          searchTerm={transactionSearchTerm}
          onSearchChange={setTransactionSearchTerm}
          isLoading={isTransactionLoading}
        />
        
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

        <AddUserDialog
          isOpen={isAddUserDialogOpen}
          onOpenChange={setIsAddUserDialogOpen}
          onUserAdded={handleUserAdded}
        />
        
        <BulkImportDialog
          isOpen={isBulkImportOpen}
          onOpenChange={setIsBulkImportOpen}
        />
      </div>
    </Layout>
  );
};

export default Dashboard;
