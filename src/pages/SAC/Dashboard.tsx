
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import TransactionItem from '@/components/TransactionItem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { generateQRCode } from '@/utils/qrCode';
import { Search, Printer, Trash2, Edit, Plus, UserPlus, Building, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole, Booth, Product, CartItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import ProductItem from '@/components/ProductItem';

const SACDashboard = () => {
  const { user } = useAuth();
  const { transactions, addFunds, getLeaderboard, processPurchase, getBoothById } = useTransactions();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('add-tickets');
  const [studentNumber, setStudentNumber] = useState('');
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isLoading, setIsLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  
  const [stats, setStats] = useState({
    totalSold: 0,
    totalRedeemed: 0
  });
  
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const [users, setUsers] = useState<User[]>([]);
  const [booths, setBooths] = useState<Booth[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [boothSearchQuery, setBoothSearchQuery] = useState('');
  
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserNumber, setNewUserNumber] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('student');
  const [newUserPassword, setNewUserPassword] = useState('');
  
  const [newBoothOpen, setNewBoothOpen] = useState(false);
  const [newBoothName, setNewBoothName] = useState('');
  const [newBoothDescription, setNewBoothDescription] = useState('');
  const [newBoothPin, setNewBoothPin] = useState('');

  // For booth transactions
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [transactionStudentNumber, setTransactionStudentNumber] = useState('');
  const [transactionStudent, setTransactionStudent] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);

  const handleBackButtonClick = () => {
    navigate('/dashboard');
  };

  useEffect(() => {
    if (user && user.role !== 'sac') {
      toast.error('You do not have access to this page');
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    const totalSold = transactions
      .filter(t => t.type === 'fund')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalRedeemed = transactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);
      
    setStats({
      totalSold,
      totalRedeemed
    });
  }, [transactions]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      
      const appUsers: User[] = data.map(dbUser => ({
        id: dbUser.id,
        studentNumber: dbUser.student_number,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role as UserRole,
        balance: dbUser.tickets / 100,
        favoriteProducts: [],
        booths: dbUser.booth_access || []
      }));
      
      setUsers(appUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchBooths = async () => {
    try {
      setIsLoading(true);
      const { data: boothsData, error: boothsError } = await supabase
        .from('booths')
        .select('*');
      
      if (boothsError) throw boothsError;
      
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*');
      
      if (productsError) throw productsError;
      
      const appBooths: Booth[] = boothsData.map(dbBooth => {
        const boothProducts = productsData
          .filter(p => p.booth_id === dbBooth.id)
          .map(p => ({
            id: p.id,
            name: p.name,
            price: p.price / 100,
            boothId: p.booth_id,
            image: p.image,
            salesCount: 0
          }));
          
        return {
          id: dbBooth.id,
          name: dbBooth.name,
          description: dbBooth.description || '',
          pin: dbBooth.pin,
          products: boothProducts,
          managers: dbBooth.members || [],
          totalEarnings: (dbBooth.sales || 0) / 100,
          transactions: []
        };
      });
      
      setBooths(appBooths);
    } catch (error) {
      console.error('Error fetching booths:', error);
      toast.error('Failed to load booths');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'manage-users') {
      fetchUsers();
    } else if (activeTab === 'manage-booths') {
      fetchBooths();
    }
  }, [activeTab]);

  const handleAddToCart = (product: Product) => {
    // Check if product is already in cart
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Increment quantity
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      // Add new item to cart
      setCart([...cart, { productId: product.id, product, quantity: 1 }]);
    }
  };

  const handleDecrement = (productId: string) => {
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem && existingItem.quantity > 1) {
      // Decrement quantity
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      ));
    } else {
      // Remove item from cart
      setCart(cart.filter(item => item.productId !== productId));
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedBooth || !transactionStudent || !user) {
      toast.error('Missing booth or student information');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    
    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    if (transactionStudent.balance < total) {
      toast.error('Student has insufficient balance');
      return;
    }
    
    try {
      setIsLoading(true);
      const success = await processPurchase(
        selectedBooth.id,
        transactionStudent.id,
        transactionStudent.name,
        user.id,
        user.name,
        cart,
        selectedBooth.name
      );
      
      if (success) {
        // Clear form
        setCart([]);
        setTransactionStudent(null);
        setTransactionStudentNumber('');
        setTransactionOpen(false);
        
        toast.success(`Purchase of $${total.toFixed(2)} completed successfully`);
        
        // Refresh booths data
        fetchBooths();
      }
    } catch (error) {
      console.error('Error processing purchase:', error);
      toast.error('Failed to process purchase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindTransactionStudent = async () => {
    if (!transactionStudentNumber) {
      toast.error('Please enter a student number');
      return;
    }
    
    setIsSearchingStudent(true);
    
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('student_number', transactionStudentNumber)
        .single();
      
      if (error || !data) {
        // Fall back to local storage
        const usersStr = localStorage.getItem('users');
        const users = usersStr ? JSON.parse(usersStr) : [];
        const foundUser = users.find((u: any) => u.studentNumber === transactionStudentNumber);
        
        if (foundUser) {
          setTransactionStudent({
            id: foundUser.id,
            name: foundUser.name,
            studentNumber: foundUser.studentNumber,
            email: foundUser.email,
            role: foundUser.role,
            balance: foundUser.balance,
            favoriteProducts: [],
            booths: foundUser.booths || []
          });
        } else {
          toast.error('Student not found');
          setTransactionStudent(null);
        }
      } else {
        // Convert Supabase data to app format
        setTransactionStudent({
          id: data.id,
          name: data.name,
          studentNumber: data.student_number,
          email: data.email,
          role: data.role as UserRole,
          balance: data.tickets / 100,
          favoriteProducts: [],
          booths: data.booth_access || []
        });
      }
    } catch (error) {
      console.error('Error finding student:', error);
      toast.error('Error looking up student');
    } finally {
      setIsSearchingStudent(false);
    }
  };

  const openTransactionDialog = (booth: Booth) => {
    setSelectedBooth(booth);
    setTransactionOpen(true);
    setTransactionStudent(null);
    setTransactionStudentNumber('');
    setCart([]);
  };

  const createUser = async () => {
    if (!newUserName || !newUserEmail || !newUserNumber || !newUserPassword) {
      toast.error('All fields are required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id')
        .or(`student_number.eq.${newUserNumber},email.eq.${newUserEmail}`);
      
      if (checkError) {
        throw new Error('Error checking existing users');
      }
      
      if (existingUsers && existingUsers.length > 0) {
        throw new Error('Student number or email already registered');
      }
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            student_number: newUserNumber,
            name: newUserName
          },
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (authError || !authData.user) {
        throw authError || new Error('Failed to create account');
      }
      
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          name: newUserName,
          email: newUserEmail,
          student_number: newUserNumber,
          role: newUserRole,
          tickets: 0,
          qr_code: `USER:${authData.user.id}`
        });
      
      if (profileError) {
        throw profileError;
      }
      
      setNewUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserNumber('');
      setNewUserPassword('');
      setNewUserRole('student');
      
      toast.success('User created successfully');
      
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast.success('User role updated successfully');
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        )
      );
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteUser = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Error deleting user from auth:', authError);
      }
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);
        
      if (error) throw error;
      
      toast.success('User deleted successfully');
      
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createBooth = async () => {
    if (!newBoothName || !newBoothPin) {
      toast.error('Booth name and PIN are required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      let finalPin = newBoothPin;
      if (!finalPin) {
        finalPin = Math.floor(100000 + Math.random() * 900000).toString();
      } else if (finalPin.length !== 6 || !/^\d+$/.test(finalPin)) {
        toast.error('PIN must be exactly 6 digits');
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('booths')
        .insert({
          name: newBoothName,
          description: newBoothDescription || '',
          pin: finalPin,
          members: [],
          sales: 0
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating booth:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Failed to create booth - no data returned');
      }
      
      setNewBoothOpen(false);
      setNewBoothName('');
      setNewBoothDescription('');
      setNewBoothPin('');
      
      toast.success('Booth created successfully');
      
      const newBooth: Booth = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        pin: data.pin,
        products: [],
        managers: data.members || [],
        totalEarnings: 0,
        transactions: []
      };
      
      setBooths(prevBooths => [...prevBooths, newBooth]);
    } catch (error) {
      console.error('Error creating booth:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create booth');
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteBooth = async (boothId: string) => {
    try {
      setIsLoading(true);
      
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .eq('booth_id', boothId);
      
      if (productsError) {
        console.error('Error deleting booth products:', productsError);
      }
      
      const { error } = await supabase
        .from('booths')
        .delete()
        .eq('id', boothId);
        
      if (error) throw error;
      
      toast.success('Booth deleted successfully');
      
      setBooths(prevBooths => prevBooths.filter(b => b.id !== boothId));
    } catch (error) {
      console.error('Error deleting booth:', error);
      toast.error('Failed to delete booth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchUser = async () => {
    if (!studentNumber) {
      toast.error('Please enter a student number');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('student_number', studentNumber)
        .single();
      
      if (error) {
        toast.error('Student not found');
        setFoundUser(null);
        setQrCodeUrl('');
        return;
      }
      
      const user: User = {
        id: data.id,
        studentNumber: data.student_number,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        balance: data.tickets / 100,
        favoriteProducts: [],
        booths: data.booth_access || []
      };
      
      setFoundUser(user);
      
      const qrData = `USER:${user.id}`;
      const qrUrl = generateQRCode(qrData);
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error('Error searching for user:', error);
      toast.error('Error searching for student');
      setFoundUser(null);
      setQrCodeUrl('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!foundUser) {
      toast.error('Please find a student first');
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await addFunds(
        parseFloat(amount),
        foundUser.id,
        paymentMethod,
        user?.id || 'unknown',
        user?.name || 'SAC Member'
      );
      
      if (success) {
        setStudentNumber('');
        setFoundUser(null);
        setAmount('');
        setQrCodeUrl('');
        
        toast.success(`Added $${parseFloat(amount).toFixed(2)} to ${foundUser.name}'s account`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to add funds');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePrintQRCode = () => {
    if (!qrCodeUrl) {
      toast.error('No QR code to print');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Student QR Code</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; }
              .container { max-width: 400px; margin: 0 auto; padding: 20px; }
              img { width: 300px; height: 300px; }
              h2 { margin-bottom: 5px; }
              p { margin-top: 5px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>${foundUser?.name || 'Student'}</h2>
              <p>${foundUser?.studentNumber || ''}</p>
              <img src="${qrCodeUrl}" alt="Student QR Code" />
              <p>Balance: $${foundUser?.balance.toFixed(2) || '0.00'}</p>
              <p>Fraser High School Charity Week</p>
            </div>
            <script>
              window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      toast.error('Unable to open print window. Check your popup blocker settings.');
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = searchQuery === '' || 
      t.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.boothName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sellerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = transactionType === 'all' || t.type === transactionType;
    
    let matchesDate = true;
    const transactionDate = new Date(t.timestamp);
    const today = new Date();
    
    if (dateFilter === 'today') {
      const isToday = transactionDate.toDateString() === today.toDateString();
      matchesDate = isToday;
    } else if (dateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      matchesDate = transactionDate.toDateString() === yesterday.toDateString();
    } else if (dateFilter === 'thisWeek') {
      const startOfWeek = new Date();
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      matchesDate = transactionDate >= startOfWeek;
    }
    
    return matchesSearch && matchesType && matchesDate;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const filteredUsers = users.filter(u => 
    userSearchQuery === '' || 
    u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.studentNumber.toLowerCase().includes(userSearchQuery.toLowerCase())
  );
  
  const filteredBooths = booths.filter(b => 
    boothSearchQuery === '' || 
    b.name.toLowerCase().includes(boothSearchQuery.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(boothSearchQuery.toLowerCase()))
  );

  const leaderboard = getLeaderboard();

  // Calculate cart total
  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <Layout 
      title="SAC Admin" 
      subtitle="Ticket Management" 
      showBack 
      showLogout
      onBackClick={handleBackButtonClick}
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="add-tickets" className="tab-button">Add Tickets</TabsTrigger>
          <TabsTrigger value="transactions" className="tab-button">Transactions</TabsTrigger>
          <TabsTrigger value="stats" className="tab-button">Statistics</TabsTrigger>
          <TabsTrigger value="manage-users" className="tab-button">Users</TabsTrigger>
          <TabsTrigger value="manage-booths" className="tab-button">Booths</TabsTrigger>
          <TabsTrigger value="settings" className="tab-button">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="add-tickets" className="animate-fade-in mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Add Tickets</CardTitle>
                <CardDescription>
                  Enter student number to add tickets to their account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="studentNumber">Student Number</Label>
                    <Input
                      id="studentNumber"
                      placeholder="Enter student number"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleSearchUser}>Search</Button>
                  </div>
                </div>
                
                {foundUser && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Name:</span>
                      <span>{foundUser.name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Student Number:</span>
                      <span>{foundUser.studentNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Current Balance:</span>
                      <span className="font-semibold">${foundUser.balance.toFixed(2)}</span>
                    </div>
                    
                    {qrCodeUrl && (
                      <div className="mt-4 text-center">
                        <img src={qrCodeUrl} alt="Student QR Code" className="mx-auto h-40 w-40" />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={handlePrintQRCode}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print QR Code
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                
                {foundUser && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount to Add (CAD)</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-muted-foreground">$</span>
                        </div>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-7"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Label>Payment Method</Label>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(value) => setPaymentMethod(value as 'cash' | 'card')}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash" className="cursor-pointer flex-1">Cash</Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-md p-3">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="cursor-pointer flex-1">Card</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  disabled={!foundUser || !amount || isLoading}
                  onClick={handleAddFunds}
                >
                  {isLoading ? "Processing..." : "Add Funds"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="transactions" className="animate-fade-in mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Transactions</CardTitle>
                <CardDescription>
                  Find transactions by student name, booth, or date
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-col sm:flex-row">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or booth..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  
                  <Select
                    value={transactionType}
                    onValueChange={setTransactionType}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Transaction Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="fund">Ticket Purchases</SelectItem>
                      <SelectItem value="purchase">Booth Sales</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={dateFilter}
                    onValueChange={setDateFilter}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Date Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="yesterday">Yesterday</SelectItem>
                      <SelectItem value="thisWeek">This Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <h2 className="text-lg font-semibold">Transactions ({filteredTransactions.length})</h2>
            
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions found matching your criteria</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="stats" className="animate-fade-in mt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Tickets Sold</CardTitle>
                  <CardDescription>Amount collected from students</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${stats.totalSold.toFixed(2)}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Tickets Redeemed</CardTitle>
                  <CardDescription>Amount spent at booths</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">${stats.totalRedeemed.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
                <CardDescription>Top performing booths</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((booth, index) => (
                      <div key={booth.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center">
                          <span className="font-bold text-lg w-8">{index + 1}.</span>
                          <div>
                            <h3 className="font-medium">{booth.name}</h3>
                            <p className="text-sm text-muted-foreground">{booth.products?.length || 0} products</p>
                          </div>
                        </div>
                        <p className="font-semibold">${booth.totalEarnings.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No booth sales recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="manage-users" className="animate-fade-in mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Manage Users</h2>
              
              <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    New User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system. Users can be students, booth managers, or SAC members.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newName">Full Name</Label>
                      <Input
                        id="newName"
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newEmail">Email</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        placeholder="john.doe@example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newStudentNumber">Student Number</Label>
                      <Input
                        id="newStudentNumber"
                        value={newUserNumber}
                        onChange={(e) => setNewUserNumber(e.target.value)}
                        placeholder="123456"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newUserPassword}
                        onChange={(e) => setNewUserPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newRole">Role</Label>
                      <Select 
                        value={newUserRole} 
                        onValueChange={(value) => setNewUserRole(value as UserRole)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="booth">Booth Manager</SelectItem>
                          <SelectItem value="sac">SAC Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setNewUserOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={createUser}
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating..." : "Create User"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>User Directory</CardTitle>
                <CardDescription>View and manage all users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Loading users...</p>
                  </div>
                ) : filteredUsers.length > 0 ? (
                  <div className="space-y-3">
                    {filteredUsers.map((user) => (
                      <Card key={user.id} className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between">
                          <div>
                            <h3 className="font-medium">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-sm">Student #: {user.studentNumber}</p>
                            <div className="flex items-center mt-1">
                              <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                {user.role === 'student' ? 'Student' : 
                                 user.role === 'booth' ? 'Booth Manager' : 
                                 user.role === 'sac' ? 'SAC Member' : user.role}
                              </span>
                              <span className="ml-2 text-sm">${user.balance.toFixed(2)} balance</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                            <Select 
                              defaultValue={user.role}
                              onValueChange={(value) => updateUserRole(user.id, value as UserRole)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Change role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="booth">Booth Manager</SelectItem>
                                <SelectItem value="sac">SAC Member</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button 
                              variant="destructive" 
                              size="icon"
                              onClick={() => deleteUser(user.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No users found matching your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="manage-booths" className="animate-fade-in mt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Manage Booths</h2>
              
              <Dialog open={newBoothOpen} onOpenChange={setNewBoothOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Building className="h-4 w-4 mr-2" />
                    New Booth
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Booth</DialogTitle>
                    <DialogDescription>
                      Add a new booth to the system. Booths can have multiple products and managers.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="newBoothName">Booth Name</Label>
                      <Input
                        id="newBoothName"
                        value={newBoothName}
                        onChange={(e) => setNewBoothName(e.target.value)}
                        placeholder="Club Name or Activity"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newBoothDescription">Description (Optional)</Label>
                      <Textarea
                        id="newBoothDescription"
                        value={newBoothDescription}
                        onChange={(e) => setNewBoothDescription(e.target.value)}
                        placeholder="Describe what this booth offers"
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newBoothPin">
                        PIN Code (6 digits) <span className="text-muted-foreground text-xs">Optional, random if empty</span>
                      </Label>
                      <Input
                        id="newBoothPin"
                        value={newBoothPin}
                        onChange={(e) => setNewBoothPin(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setNewBoothOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={createBooth}
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating..." : "Create Booth"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Booth Directory</CardTitle>
                <CardDescription>View and manage all booths</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search booths..."
                      value={boothSearchQuery}
                      onChange={(e) => setBoothSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="text-center py-8">
                    <p>Loading booths...</p>
                  </div>
                ) : filteredBooths.length > 0 ? (
                  <div className="space-y-4">
                    {filteredBooths.map((booth) => (
                      <Card key={booth.id} className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between">
                          <div>
                            <h3 className="font-medium">{booth.name}</h3>
                            {booth.description && (
                              <p className="text-sm text-muted-foreground">{booth.description}</p>
                            )}
                            <div className="flex items-center mt-1 flex-wrap gap-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                PIN: {booth.pin}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                {booth.products.length} Products
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-muted">
                                ${booth.totalEarnings.toFixed(2)} Revenue
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openTransactionDialog(booth)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Process Sale
                            </Button>
                            
                            <Button 
                              variant="destructive" 
                              size="icon"
                              onClick={() => deleteBooth(booth.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {booth.products.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-medium mb-2">Products</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {booth.products.map(product => (
                                <div key={product.id} className="border rounded-md p-2 text-sm">
                                  <span className="font-medium">{product.name}</span>
                                  <span className="block text-muted-foreground">${product.price.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No booths found matching your search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="animate-fade-in mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Settings panel is under development
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <Dialog open={transactionOpen} onOpenChange={setTransactionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Sale for {selectedBooth?.name}</DialogTitle>
            <DialogDescription>
              Select products and enter student information to process a sale
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/2 space-y-4">
                <div>
                  <Label>Find Student</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      placeholder="Enter student number"
                      value={transactionStudentNumber}
                      onChange={(e) => setTransactionStudentNumber(e.target.value)}
                    />
                    <Button 
                      onClick={handleFindTransactionStudent}
                      disabled={isSearchingStudent}
                    >
                      {isSearchingStudent ? "Searching..." : "Find"}
                    </Button>
                  </div>
                </div>
                
                {transactionStudent && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Name:</span>
                      <span>{transactionStudent.name}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Student Number:</span>
                      <span>{transactionStudent.studentNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Current Balance:</span>
                      <span className={`font-semibold ${transactionStudent.balance < cartTotal ? 'text-destructive' : ''}`}>
                        ${transactionStudent.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-lg mb-2">Cart</h3>
                  {cart.length > 0 ? (
                    <div className="space-y-2">
                      {cart.map(item => (
                        <div key={item.productId} className="flex justify-between p-2 border rounded-md">
                          <div>
                            <span className="font-medium">{item.product.name}</span>
                            <span className="block text-sm text-muted-foreground">
                              ${item.product.price.toFixed(2)} × {item.quantity}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDecrement(item.productId)}
                            >
                              -
                            </Button>
                            <span>{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleAddToCart(item.product)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-between font-semibold p-2 mt-4">
                        <span>Total:</span>
                        <span>${cartTotal.toFixed(2)}</span>
                      </div>
                      
                      <Button 
                        className="w-full mt-2"
                        disabled={!transactionStudent || cart.length === 0 || isLoading || transactionStudent.balance < cartTotal}
                        onClick={handleConfirmPurchase}
                      >
                        {isLoading ? "Processing..." : "Complete Purchase"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground border rounded-md">
                      <p>No items in cart</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="w-full sm:w-1/2">
                <h3 className="font-medium text-lg mb-2">Available Products</h3>
                {selectedBooth?.products && selectedBooth.products.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                    {selectedBooth.products.map(product => (
                      <div 
                        key={product.id} 
                        className="flex justify-between p-3 border rounded-md cursor-pointer hover:bg-muted/50"
                        onClick={() => handleAddToCart(product)}
                      >
                        <div>
                          <span className="font-medium">{product.name}</span>
                          <span className="block text-sm text-muted-foreground">${product.price.toFixed(2)}</span>
                        </div>
                        <Button size="sm" variant="ghost">Add</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-md">
                    <p>No products available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default SACDashboard;
