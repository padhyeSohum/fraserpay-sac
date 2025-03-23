import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { useTransactions } from '@/contexts/transactions';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/utils/format';
import { useNavigate } from 'react-router-dom';
import { Home, Plus, Minus, Search, Printer, Users, LayoutGrid, ChartBar } from 'lucide-react';
import { encodeUserData, generateQRCode } from '@/utils/qrCode';
import { supabase } from '@/integrations/supabase/client';
import { transformUserData } from '@/contexts/auth/authUtils';

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
    getBoothById
  } = useTransactions();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [foundStudent, setFoundStudent] = useState<any | null>(null);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [isCreateBoothOpen, setIsCreateBoothOpen] = useState(false);
  const [boothName, setBoothName] = useState('');
  const [boothDescription, setBoothDescription] = useState('');
  const [isBoothLoading, setIsBoothLoading] = useState(false);
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooths: 0,
    totalTransactions: 0,
    totalRevenue: 0
  });
  
  useEffect(() => {
    if (user && user.role === 'sac') {
      loadBooths();
      const allTransactions = getSACTransactions();
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      
      const boothLeaderboard = getLeaderboard();
      setLeaderboard(boothLeaderboard);
      
      loadUsers();
      
      calculateStats(allTransactions);
    }
  }, [user]);
  
  const calculateStats = (allTransactions: any[]) => {
    const totalRevenue = allTransactions.reduce((sum, t) => sum + t.amount, 0);
    
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
          transaction.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (transaction.boothName && transaction.boothName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
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

  const handleAddFunds = async () => {
    if (!studentId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid student ID and amount');
      return;
    }
    
    const amountValue = parseFloat(amount);
    
    if (!user) {
      toast.error('You must be logged in to add funds');
      return;
    }
    
    try {
      const result = await addFunds(studentId, amountValue, user.id);
      
      if (result.success) {
        setIsAddFundsOpen(false);
        setStudentId('');
        setAmount('');
        toast.success(`Successfully added $${amountValue.toFixed(2)} to account`);
        
        const allTransactions = getSACTransactions();
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
        calculateStats(allTransactions);
        
        if (foundStudent && foundStudent.id === studentId) {
          setFoundStudent({
            ...foundStudent, 
            balance: (result.updatedBalance || foundStudent.balance)
          });
        }
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
    }
  };
  
  const handleRefundFunds = async () => {
    if (!studentId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid student ID and amount');
      return;
    }
    
    const amountValue = parseFloat(amount);
    
    if (!user) {
      toast.error('You must be logged in to refund funds');
      return;
    }
    
    try {
      const result = await addFunds(studentId, -amountValue, user.id);
      
      if (result.success) {
        setIsRefundOpen(false);
        setStudentId('');
        setAmount('');
        toast.success(`Successfully refunded $${amountValue.toFixed(2)} from account`);
        
        const allTransactions = getSACTransactions();
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
        calculateStats(allTransactions);
        
        if (foundStudent && foundStudent.id === studentId) {
          setFoundStudent({
            ...foundStudent, 
            balance: (result.updatedBalance || foundStudent.balance)
          });
        }
      }
    } catch (error) {
      console.error('Error refunding funds:', error);
      toast.error('Failed to refund funds');
    }
  };
  
  const handleStudentSearch = async () => {
    if (!studentSearchTerm.trim()) {
      toast.error('Please enter a student ID or name to search');
      return;
    }
    
    setIsSearching(true);
    
    try {
      let { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .or(`student_number.ilike.%${studentSearchTerm}%,name.ilike.%${studentSearchTerm}%,email.ilike.%${studentSearchTerm}%`)
        .limit(1);
      
      if (error) {
        console.error('Error searching for student:', error);
        toast.error('Error searching for student');
        setIsSearching(false);
        return;
      }
      
      if (userData && userData.length > 0) {
        const student = userData[0];
        
        setFoundStudent({
          id: student.id,
          name: student.name,
          studentNumber: student.student_number,
          email: student.email,
          balance: student.tickets / 100,
          qrCode: student.qr_code
        });
        
        setIsStudentDetailOpen(true);
        
        if (student.qr_code || student.id) {
          const userData = student.qr_code || encodeUserData(student.id);
          const qrUrl = generateQRCode(userData);
          setQrCodeUrl(qrUrl);
        }
      } else {
        toast.error('No student found with that ID, name, or email');
      }
    } catch (error) {
      console.error('Error in student search:', error);
      toast.error('Failed to search for student');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleCreateBooth = async () => {
    if (!boothName.trim()) {
      toast.error('Please enter a booth name');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to create a booth');
      return;
    }
    
    setIsBoothLoading(true);
    
    try {
      const boothId = await createBooth(boothName, boothDescription, user.id);
      
      if (boothId) {
        setIsCreateBoothOpen(false);
        setBoothName('');
        setBoothDescription('');
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
              ${decodeURIComponent(qrCodeUrl.split(',')[1])}
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
              ${(stats.totalRevenue / 100).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Student Search</CardTitle>
          <CardDescription>
            Find a student to view their details or manage their account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by student ID, name, or email..."
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStudentSearch()}
              />
            </div>
            <Button onClick={handleStudentSearch} disabled={isSearching}>
              {isSearching ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end gap-2 mb-6">
        <Dialog open={isCreateBoothOpen} onOpenChange={setIsCreateBoothOpen}>
          <DialogTrigger asChild>
            <Button>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Create Booth
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Booth</DialogTitle>
              <DialogDescription>
                Create a new booth for the Fraser Pay system.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="boothName" className="text-right">
                  Booth Name
                </Label>
                <Input
                  id="boothName"
                  value={boothName}
                  onChange={(e) => setBoothName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="boothDescription" className="text-right">
                  Description
                </Label>
                <Input
                  id="boothDescription"
                  value={boothDescription}
                  onChange={(e) => setBoothDescription(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateBoothOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBooth} disabled={isBoothLoading}>
                {isBoothLoading ? 'Creating...' : 'Create Booth'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
          <DialogTrigger asChild>
            <Button>Add Funds to Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Funds to Student Account</DialogTitle>
              <DialogDescription>
                Enter the student ID and amount to add funds to their account.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="studentId" className="text-right">
                  Student ID
                </Label>
                <Input
                  id="studentId"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="col-span-3"
                  readOnly={!!foundStudent}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount ($)
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddFundsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddFunds}>Add Funds</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Dialog open={isStudentDetailOpen} onOpenChange={setIsStudentDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              View and manage student account
            </DialogDescription>
          </DialogHeader>
          
          {foundStudent && (
            <div className="py-4">
              <div className="flex flex-col items-center mb-4">
                {qrCodeUrl && (
                  <div 
                    className="w-48 h-48 bg-white p-2 rounded-lg shadow-sm mb-2"
                    dangerouslySetInnerHTML={{ __html: decodeURIComponent(qrCodeUrl.split(',')[1]) }}
                  />
                )}
                <p className="text-sm text-muted-foreground">Student QR Code</p>
              </div>
              
              <div className="grid gap-3">
                <div className="grid grid-cols-3 items-center gap-2">
                  <Label className="text-right font-medium">Name:</Label>
                  <span className="col-span-2">{foundStudent.name}</span>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-2">
                  <Label className="text-right font-medium">Student ID:</Label>
                  <span className="col-span-2">{foundStudent.studentNumber || foundStudent.id}</span>
                </div>
                
                <div className="grid grid-cols-3 items-center gap-2">
                  <Label className="text-right font-medium">Balance:</Label>
                  <span className="col-span-2 font-semibold">${foundStudent.balance?.toFixed(2) || '0.00'}</span>
                </div>
                
                {foundStudent.email && (
                  <div className="grid grid-cols-3 items-center gap-2">
                    <Label className="text-right font-medium">Email:</Label>
                    <span className="col-span-2">{foundStudent.email}</span>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center gap-2 mt-6">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrintQRCode}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print QR
                </Button>
                
                <Button 
                  size="sm"
                  onClick={() => {
                    setStudentId(foundStudent.id);
                    setIsStudentDetailOpen(false);
                    setIsAddFundsOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
                
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => {
                    setStudentId(foundStudent.id);
                    setIsStudentDetailOpen(false);
                    setIsRefundOpen(true);
                  }}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Refund
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRefundOpen} onOpenChange={setIsRefundOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Funds from Student Account</DialogTitle>
            <DialogDescription>
              Enter the amount to refund from the student's account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="refundStudentId" className="text-right">
                Student ID
              </Label>
              <Input
                id="refundStudentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="col-span-3"
                readOnly={!!foundStudent}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="refundAmount" className="text-right">
                Amount ($)
              </Label>
              <Input
                id="refundAmount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRefundFunds}>Refund Funds</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue="transactions">
        <TabsList className="mb-6">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="leaderboard">Booth Leaderboard</TabsTrigger>
          <TabsTrigger value="booths">Manage Booths</TabsTrigger>
          <TabsTrigger value="users">Manage Users</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>
                View all transactions in the system
              </CardDescription>
              <div className="mt-4">
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Booth</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No transactions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {formatDate(new Date(transaction.timestamp))}
                        </TableCell>
                        <TableCell>{transaction.buyerName}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'purchase'
                                ? 'bg-blue-100 text-blue-800'
                                : transaction.type === 'fund'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {transaction.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transaction.boothName || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(transaction.amount / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Booth Leaderboard</CardTitle>
              <CardDescription>
                Booths ranked by total earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Booth Name</TableHead>
                    <TableHead className="text-right">Total Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No booths found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboard.map((booth, index) => (
                      <TableRow key={booth.boothId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{booth.boothName}</TableCell>
                        <TableCell className="text-right">
                          ${(booth.earnings / 100).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="booths">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Booths</CardTitle>
                <CardDescription>
                  View and manage all booths in the system
                </CardDescription>
              </div>
              <Button onClick={() => setIsCreateBoothOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Booth
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booths.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No booths found
                      </TableCell>
                    </TableRow>
                  ) : (
                    booths.map((booth) => (
                      <TableRow key={booth.id}>
                        <TableCell>{booth.name}</TableCell>
                        <TableCell>{booth.description || 'No description'}</TableCell>
                        <TableCell>
                          {booth.createdAt ? formatDate(new Date(booth.createdAt)) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => navigate(`/booth/${booth.id}`)}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Manage Users</CardTitle>
              <CardDescription>
                View and manage all users in the system
              </CardDescription>
              <div className="mt-4">
                <Input
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isUserLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.student_number || 'N/A'}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'sac'
                                ? 'bg-purple-100 text-purple-800'
                                : user.role === 'booth'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell>
                          ${(user.tickets / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setFoundStudent({
                                  id: user.id,
                                  name: user.name,
                                  studentNumber: user.student_number,
                                  email: user.email,
                                  balance: user.tickets / 100,
                                  qrCode: user.qr_code
                                });
                                
                                if (user.qr_code || user.id) {
                                  const userData = user.qr_code || encodeUserData(user.id);
                                  const qrUrl = generateQRCode(userData);
                                  setQrCodeUrl(qrUrl);
                                }
                                
                                setIsStudentDetailOpen(true);
                              }}
                            >
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistics">
          <Card>
            <CardHeader>
              <CardTitle>System Statistics</CardTitle>
              <CardDescription>
                Overview of system performance and metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transaction Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Transactions:</span>
                        <span className="font-medium">{stats.totalTransactions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Revenue:</span>
                        <span className="font-medium">${(stats.totalRevenue / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Transaction:</span>
                        <span className="font-medium">
                          {stats.totalTransactions > 0
                            ? `$${((stats.totalRevenue / stats.totalTransactions) / 100).toFixed(2)}`
                            : '$0.00'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Users:</span>
                        <span className="font-medium">{stats.totalUsers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Booths:</span>
                        <span className="font-medium">{stats.totalBooths}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transactions per User:</span>
                        <span className="font-medium">
                          {stats.totalUsers > 0
                            ? (stats.totalTransactions / stats.totalUsers).toFixed(2)
                            : '0'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SACDashboard;

