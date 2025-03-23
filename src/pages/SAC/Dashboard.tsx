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
import { Home, Plus, Minus, Search, Printer, Users, LayoutGrid, ChartBar, Scan, ShoppingCart, Trash } from 'lucide-react';
import { encodeUserData, generateQRCode } from '@/utils/qrCode';
import { supabase } from '@/integrations/supabase/client';
import { transformUserData } from '@/contexts/auth/authUtils';
import { findUserByStudentNumber } from '@/contexts/transactions/boothService';

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
    addProductToBooth
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
  const [customPin, setCustomPin] = useState('');
  const [isBoothLoading, setIsBoothLoading] = useState(false);
  
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  
  // New state for adding products to a new booth
  const [initialProducts, setInitialProducts] = useState<Array<{name: string, price: string}>>([]);
  
  // New state for booth transactions
  const [isBoothTransactionOpen, setIsBoothTransactionOpen] = useState(false);
  const [selectedBooth, setSelectedBooth] = useState<string>('');
  const [transactionStudentNumber, setTransactionStudentNumber] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  
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
    try {
      await loadBooths();
      
      const allTransactions = getSACTransactions();
      console.log('SAC Dashboard: Loaded transactions', allTransactions.length);
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      
      const boothLeaderboard = getLeaderboard();
      console.log('SAC Dashboard: Loaded leaderboard', boothLeaderboard.length);
      setLeaderboard(boothLeaderboard);
      
      await loadUsers();
      
      calculateStats(allTransactions);
    } catch (error) {
      console.error('Error loading SAC dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };
  
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
  
  const addProductField = () => {
    setInitialProducts([...initialProducts, { name: '', price: '' }]);
  };
  
  const updateProductField = (index: number, field: 'name' | 'price', value: string) => {
    const updatedProducts = [...initialProducts];
    updatedProducts[index][field] = value;
    setInitialProducts(updatedProducts);
  };
  
  const removeProductField = (index: number) => {
    const updatedProducts = [...initialProducts];
    updatedProducts.splice(index, 1);
    setInitialProducts(updatedProducts);
  };
  
  const handleCreateBooth = async () => {
    if (!boothName.trim()) {
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
      // Create the booth with optional custom PIN
      const boothId = await createBooth(boothName, boothDescription, user.id, customPin);
      
      if (boothId) {
        // Add all products to the booth
        const productPromises = initialProducts
          .filter(p => p.name.trim() && p.price.trim() && !isNaN(parseFloat(p.price)))
          .map(p => addProductToBooth(boothId, {
            name: p.name,
            price: parseFloat(p.price)
          }));
        
        if (productPromises.length > 0) {
          await Promise.all(productPromises);
        }
        
        // Reset form fields
        setIsCreateBoothOpen(false);
        setBoothName('');
        setBoothDescription('');
        setCustomPin('');
        setInitialProducts([]);
        
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
  
  const handleSearchStudentForTransaction = async () => {
    if (!transactionStudentNumber) {
      toast.error('Please enter a student number');
      return;
    }
    
    try {
      const student = await findUserByStudentNumber(transactionStudentNumber);
      
      if (student) {
        setFoundStudent(student);
        toast.success(`Found student: ${student.name}`);
      } else {
        toast.error('No student found with that number');
      }
    } catch (error) {
      console.error('Error finding student:', error);
      toast.error('Failed to find student');
    }
  };
  
  const handleBoothTransaction = async () => {
    if (!selectedBooth) {
      toast.error('Please select a booth');
      return;
    }
    
    if (!foundStudent) {
      toast.error('Please find a student first');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Please add products to cart');
      return;
    }
    
    const booth = getBoothById(selectedBooth);
    if (!booth) {
      toast.error('Selected booth not found');
      return;
    }
    
    setIsProcessingTransaction(true);
    
    try {
      const transaction = await processPurchase(
        booth.id,
        foundStudent.id,
        foundStudent.name,
        user?.id || '',
        user?.name || '',
        cart,
        booth.name
      );
      
      if (transaction.success) {
        clearCart();
        setIsBoothTransactionOpen(false);
        setSelectedBooth('');
        setTransactionStudentNumber('');
        setFoundStudent(null);
        
        toast.success('Transaction completed successfully');
        
        // Refresh transactions
        const allTransactions = getSACTransactions();
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
        calculateStats(allTransactions);
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Failed to process transaction');
    } finally {
      setIsProcessingTransaction(false);
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
              ${stats.totalRevenue.toFixed(2)}
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
        <Dialog open={isBoothTransactionOpen} onOpenChange={setIsBoothTransactionOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Booth Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Make Transaction for Booth</DialogTitle>
              <DialogDescription>
                Process a transaction on behalf of a booth
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Booth</Label>
                  <Select value={selectedBooth} onValueChange={setSelectedBooth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a booth" />
                    </SelectTrigger>
                    <SelectContent>
                      {booths.map(booth => (
                        <SelectItem key={booth.id} value={booth.id}>
                          {booth.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Find Student</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter student number..."
                      value={transactionStudentNumber}
                      onChange={(e) => setTransactionStudentNumber(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={handleSearchStudentForTransaction}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {foundStudent && (
                <div className="bg-muted p-3 rounded-md">
                  <div className="font-medium">Student: {foundStudent.name}</div>
                  <div className="text-sm">Balance: ${foundStudent.balance.toFixed(2)}</div>
                </div>
              )}
              
              {selectedBooth && getBoothById(selectedBooth) && (
                <div>
                  <Label className="mb-2 block">Products</Label>
                  <div className="border rounded-md divide-y">
                    {getBoothById(selectedBooth)?.products.map((product) => (
                      <div key={product.id} className="flex justify-between items-center p-3">
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">${product.price.toFixed(2)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const cartItem = cart.find(item => item.productId === product.id);
                              if (cartItem) {
                                decrementQuantity(product.id);
                              }
                            }}
                            disabled={!cart.some(item => item.productId === product.id)}
                          >
                            -
                          </Button>
                          <span>
                            {cart.find(item => item.productId === product.id)?.quantity || 0}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const cartItem = cart.find(item => item.productId === product.id);
                              if (cartItem) {
                                incrementQuantity(product.id);
                              } else {
                                addToCart(product);
                              }
                            }}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {cart.length > 0 && (
                <div>
                  <Label className="mb-2 block">Cart</Label>
                  <div className="border rounded-md divide-y">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex justify-between items-center p-3">
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.quantity} × ${item.product.price.toFixed(2)} = ${(item.quantity * item.product.price).toFixed(2)}
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="p-3 bg-muted font-medium">
                      Total: ${cart.reduce((sum, item) => sum + (item.quantity * item.product.price), 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                clearCart();
                setIsBoothTransactionOpen(false);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleBoothTransaction} 
                disabled={isProcessingTransaction || !selectedBooth || !foundStudent || cart.length === 0}
              >
                {isProcessingTransaction ? 'Processing...' : 'Process Transaction'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isCreateBoothOpen} onOpenChange={setIsCreateBoothOpen}>
          <DialogTrigger asChild>
            <Button>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Create Booth
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customPin" className="text-right">
                  Custom PIN (6 digits)
                </Label>
                <Input
                  id="customPin"
                  type="text"
                  maxLength={6}
                  pattern="[0-9]*"
                  value={customPin}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    setCustomPin(value);
                  }}
                  className="col-span-3"
                  placeholder="Leave empty for random PIN"
                />
              </div>
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Products
                </Label>
                <div className="col-span-3 space-y-3">
                  {initialProducts.map((product, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder="Product name"
                        value={product.name}
                        onChange={(e) => updateProductField(index, 'name', e.target.value)}
                        className="flex-1"
                      />
                      <div className="relative w-24">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-muted-foreground">$</span>
                        </div>
                        <Input
                          placeholder="0.00"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={product.price}
                          onChange={(e) => updateProductField(index, 'price', e.target.value)}
                          className="pl-7"
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => removeProductField(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={addProductField}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Product
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCreateBoothOpen(false);
                setBoothName('');
                setBoothDescription('');
                setCustomPin('');
                setInitialProducts([]);
              }}>
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
