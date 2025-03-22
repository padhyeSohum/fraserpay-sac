
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
import { DataRangeFilter } from '@/components/DataRangeFilter';
import { generateQRCode } from '@/utils/qrCode';
import { Search, Printer } from 'lucide-react';

const SACDashboard = () => {
  const { user } = useAuth();
  const { transactions, addFunds, getLeaderboard } = useTransactions();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('add-tickets');
  const [studentNumber, setStudentNumber] = useState('');
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isLoading, setIsLoading] = useState(false);
  
  // Transaction search state
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  
  // Stats
  const [stats, setStats] = useState({
    totalSold: 0,
    totalRedeemed: 0
  });
  
  // QR Code printing
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  // Check if user is SAC member
  useEffect(() => {
    if (user && user.role !== 'sac') {
      toast.error('You do not have access to this page');
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  // Calculate stats
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

  const handleSearchUser = () => {
    if (!studentNumber) {
      toast.error('Please enter a student number');
      return;
    }
    
    // Look up user in localStorage
    const usersStr = localStorage.getItem('users');
    const users = usersStr ? JSON.parse(usersStr) : [];
    
    const user = users.find((u: any) => u.studentNumber === studentNumber);
    
    if (user) {
      setFoundUser(user);
      
      // Generate QR code for printing
      const qrData = `USER:${user.id}`;
      const qrUrl = generateQRCode(qrData);
      setQrCodeUrl(qrUrl);
    } else {
      toast.error('Student not found');
      setFoundUser(null);
      setQrCodeUrl('');
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
        // Reset form
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
    
    // Create a printable window with the QR code
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

  // Filter transactions based on search criteria
  const filteredTransactions = transactions.filter(t => {
    // Filter by search query (student name, number, or booth name)
    const matchesSearch = searchQuery === '' || 
      t.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.boothName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.sellerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by transaction type
    const matchesType = transactionType === 'all' || t.type === transactionType;
    
    // Filter by date
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
      // Get start of week (Monday)
      const startOfWeek = new Date();
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      matchesDate = transactionDate >= startOfWeek;
    }
    
    return matchesSearch && matchesType && matchesDate;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const leaderboard = getLeaderboard();

  return (
    <Layout 
      title="SAC Admin" 
      subtitle="Ticket Management" 
      showBack 
      showLogout
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="add-tickets" className="tab-button">Add Tickets</TabsTrigger>
          <TabsTrigger value="transactions" className="tab-button">Transactions</TabsTrigger>
          <TabsTrigger value="stats" className="tab-button">Statistics</TabsTrigger>
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
                  <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((item, index) => (
                      <div key={item.boothId} className="flex items-center justify-between p-3 border-b border-border/30 last:border-0">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center mr-3 text-brand-700 font-semibold">
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.boothName}</span>
                        </div>
                        <span className="font-semibold">${item.earnings.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No booth data available</p>
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
                <CardTitle>SAC Admin Settings</CardTitle>
                <CardDescription>Manage SAC-specific settings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Settings functionality will be added in a future update.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default SACDashboard;
