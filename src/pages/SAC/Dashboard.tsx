
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useTransactions } from '@/contexts/TransactionContext';
import TransactionItem from '@/components/TransactionItem';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, CreditCard, DollarSign, BarChart3, ArrowUp, ArrowDown, QrCode, Search, Store, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { generateQRCode, encodeUserData } from '@/utils/qrCode';

const SACDashboard = () => {
  const { user } = useAuth();
  const { transactions, fetchAllTransactions, getLeaderboard } = useTransactions();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('student-search');
  const [searchStudentNumber, setSearchStudentNumber] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<any | null>(null);
  const [studentTransactions, setStudentTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [isDeduction, setIsDeduction] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalStudents: 0,
    totalFundsAdded: 0,
    totalSpent: 0,
    totalTransactions: 0
  });
  const [boothStats, setBoothStats] = useState<any[]>([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    async function loadData() {
      await fetchAllTransactions();
      calculateStatistics();
    }
    
    loadData();
  }, [fetchAllTransactions]);
  
  useEffect(() => {
    if (transactions.length > 0) {
      // Most recent transactions first
      const sortedTransactions = [...transactions].sort((a, b) => b.timestamp - a.timestamp);
      
      // Set recent fund transactions
      const fundTransactions = sortedTransactions.filter(t => t.type === 'fund' || t.type === 'refund');
      setRecentTransactions(fundTransactions.slice(0, 10));
      
      // Calculate booth statistics
      const leaderboard = getLeaderboard();
      setBoothStats(leaderboard.map(booth => ({
        name: booth.boothName,
        earnings: booth.earnings
      })));
    }
  }, [transactions, getLeaderboard]);
  
  const calculateStatistics = () => {
    try {
      // Get users from localStorage
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      
      // Calculate total students
      const studentCount = users.filter((u: any) => u.role === 'student').length;
      
      // Calculate total funds added
      const fundsAdded = transactions
        .filter(t => t.type === 'fund')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate total spent
      const totalSpent = transactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0);
      
      setStatistics({
        totalStudents: studentCount,
        totalFundsAdded: fundsAdded,
        totalSpent: totalSpent,
        totalTransactions: transactions.length
      });
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  };
  
  const handleStudentSearch = () => {
    if (!searchStudentNumber.trim()) {
      toast.error('Please enter a student number');
      return;
    }
    
    try {
      // Get users from localStorage
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      
      // Fix: Improve student number matching by standardizing format
      const searchValue = searchStudentNumber.trim();
      
      const foundStudent = users.find((u: any) => {
        // Convert to string and trim to ensure consistent comparison
        const userStudentNumber = u.studentNumber ? String(u.studentNumber).trim() : '';
        return userStudentNumber === searchValue;
      });
      
      if (foundStudent) {
        setSearchedStudent(foundStudent);
        
        // Get student transactions
        const studentTxs = transactions.filter(t => t.buyerId === foundStudent.id);
        const sortedTxs = [...studentTxs].sort((a, b) => b.timestamp - a.timestamp);
        setStudentTransactions(sortedTxs.slice(0, 10));
        
        toast.success(`Found student: ${foundStudent.name}`);
      } else {
        setSearchedStudent(null);
        setStudentTransactions([]);
        toast.error('Student not found');
      }
    } catch (error) {
      console.error('Error searching for student:', error);
      toast.error('Error searching for student');
    }
  };
  
  const handleAdjustBalance = async () => {
    if (!searchedStudent) {
      toast.error('Please search for a student first');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Verify security code if needed
    if (isDeduction && verificationCode !== '090207') {
      toast.error('Invalid security code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get users from localStorage
      const usersStr = localStorage.getItem('users');
      const users = usersStr ? JSON.parse(usersStr) : [];
      
      // Find student again to make sure we have the latest data
      const studentIndex = users.findIndex((u: any) => u.id === searchedStudent.id);
      
      if (studentIndex === -1) {
        throw new Error('Student not found');
      }
      
      const student = users[studentIndex];
      const adjustmentAmount = parseFloat(amount);
      
      // Calculate new balance
      const newBalance = isDeduction 
        ? student.balance - adjustmentAmount 
        : student.balance + adjustmentAmount;
      
      if (isDeduction && newBalance < 0) {
        toast.error(`Insufficient funds in ${student.name}'s account`);
        setIsLoading(false);
        return;
      }
      
      // Update user balance
      users[studentIndex].balance = newBalance;
      localStorage.setItem('users', JSON.stringify(users));
      
      // Create transaction record
      const now = Date.now();
      const transactionId = `tx-${now}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newTransaction = {
        id: transactionId,
        timestamp: now,
        buyerId: student.id,
        buyerName: student.name,
        studentNumber: student.studentNumber,
        amount: adjustmentAmount,
        type: isDeduction ? 'refund' : 'fund',
        sacMemberId: user?.id,
        sacMemberName: user?.name
      };
      
      // Get existing transactions
      const transactionsStr = localStorage.getItem('transactions');
      const allTransactions = transactionsStr ? JSON.parse(transactionsStr) : [];
      
      // Add new transaction
      localStorage.setItem('transactions', JSON.stringify([newTransaction, ...allTransactions]));
      
      // Update UI
      setSearchedStudent({...student, balance: newBalance});
      
      // Re-fetch transactions to update the dashboard
      await fetchAllTransactions();
      
      // Update student transactions list
      const updatedStudentTxs = [newTransaction, ...studentTransactions];
      setStudentTransactions(updatedStudentTxs.slice(0, 10));
      
      // Show success message
      toast.success(`Successfully ${isDeduction ? 'deducted' : 'added'} $${amount} ${isDeduction ? 'from' : 'to'} ${student.name}'s account`);
      
      // Reset form
      setAmount('');
      setVerificationCode('');
      
      // Recalculate statistics
      calculateStatistics();
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('An error occurred while adjusting balance');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePrintQRCode = () => {
    if (!searchedStudent) {
      toast.error('Please search for a student first');
      return;
    }
    
    try {
      const qrData = encodeUserData(searchedStudent.id);
      const qrCodeDataUrl = generateQRCode(qrData);
      
      // Open a new window/tab with the QR code
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code: ${searchedStudent.name}</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; }
                img { max-width: 100%; height: auto; }
                .print-button { 
                  background: #4F46E5; 
                  color: white; 
                  border: none; 
                  padding: 10px 20px; 
                  border-radius: 4px;
                  margin-top: 20px;
                  cursor: pointer;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Student QR Code</h1>
                <h2>${searchedStudent.name}</h2>
                <p>Student #: ${searchedStudent.studentNumber}</p>
                <div id="qrcode">
                  <img src="${qrCodeDataUrl}" alt="QR Code">
                </div>
                <p>Balance: $${searchedStudent.balance?.toFixed(2) || '0.00'}</p>
                <button class="print-button" onclick="window.print()">Print QR Code</button>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        toast.error('Failed to open print window. Please check your pop-up blocker');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const navigateToBooth = (boothId: string) => {
    navigate(`/booth/settings?id=${boothId}`);
  };
  
  const navigateToUsers = () => {
    navigate('/sac/users');
  };
  
  return (
    <Layout 
      title="SAC Dashboard" 
      subtitle={`Welcome, ${user?.name?.split(' ')[0] || 'User'}!`}
      showLogout
    >
      <div className="space-y-6">
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5 mb-4">
            <TabsTrigger value="student-search">Student Management</TabsTrigger>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="booths" onClick={() => navigate('/sac/booths')}>
              <Store className="h-4 w-4 mr-2" />
              Booths
            </TabsTrigger>
            <TabsTrigger value="users" onClick={() => navigate('/sac/users')}>
              <UserCog className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>
          
          {/* Student Search & Management Tab */}
          <TabsContent value="student-search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2" />
                  Student Search
                </CardTitle>
                <CardDescription>Search for a student by student number</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <Input
                    placeholder="Enter student number"
                    value={searchStudentNumber}
                    onChange={(e) => setSearchStudentNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleStudentSearch}>Search</Button>
                </div>
                
                {searchedStudent && (
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-xl">{searchedStudent.name}</h3>
                      <div className="text-sm text-muted-foreground">Student #: {searchedStudent.studentNumber}</div>
                      <div className="mt-2 text-lg font-medium">
                        Current Balance: <span className="text-green-600">${searchedStudent.balance?.toFixed(2) || '0.00'}</span>
                      </div>
                      <Button variant="outline" size="sm" className="mt-2" onClick={handlePrintQRCode}>
                        <QrCode className="h-4 w-4 mr-2" />
                        Print QR Code
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold">Adjust Balance</h3>
                      
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="operation">Operation</Label>
                        <div className="flex space-x-2">
                          <Button
                            type="button" 
                            variant={!isDeduction ? "secondary" : "outline"}
                            onClick={() => setIsDeduction(false)}
                            className="flex-1"
                          >
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Add Funds
                          </Button>
                          <Button
                            type="button"
                            variant={isDeduction ? "secondary" : "outline"}
                            onClick={() => setIsDeduction(true)}
                            className="flex-1"
                          >
                            <ArrowDown className="h-4 w-4 mr-2" />
                            Deduct Funds
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Label htmlFor="amount">Amount (CAD)</Label>
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
                      
                      {isDeduction && (
                        <div className="flex flex-col space-y-2">
                          <Label htmlFor="verification">Security Code</Label>
                          <Input
                            id="verification"
                            type="password"
                            placeholder="Enter security code"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">Security code required for deductions</p>
                        </div>
                      )}
                      
                      <Button
                        onClick={handleAdjustBalance}
                        disabled={isLoading || !amount || parseFloat(amount) <= 0}
                        className="w-full"
                      >
                        {isLoading ? "Processing..." : isDeduction ? "Deduct Funds" : "Add Funds"}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-3">Recent Transactions</h3>
                      {studentTransactions.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {studentTransactions.map(transaction => (
                            <TransactionItem 
                              key={transaction.id} 
                              transaction={transaction}
                              showSupport
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <p>No transactions found for this student</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Fund Transactions</CardTitle>
                <CardDescription>Most recent funds added to student accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {recentTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransactions.map(transaction => (
                      <TransactionItem 
                        key={transaction.id} 
                        transaction={transaction}
                        showSupport
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No recent transactions found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Card className="bg-white/80">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <h3 className="text-2xl font-bold">{statistics.totalStudents}</h3>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </CardContent>
              </Card>
              
              <Card className="bg-white/80">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Funds Added</p>
                    <h3 className="text-2xl font-bold">${statistics.totalFundsAdded.toFixed(2)}</h3>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </CardContent>
              </Card>
              
              <Card className="bg-white/80">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Spent at Booths</p>
                    <h3 className="text-2xl font-bold">${statistics.totalSpent.toFixed(2)}</h3>
                  </div>
                  <CreditCard className="h-8 w-8 text-purple-500" />
                </CardContent>
              </Card>
              
              <Card className="bg-white/80">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <h3 className="text-2xl font-bold">{statistics.totalTransactions}</h3>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Booth Performance</CardTitle>
                <CardDescription>Revenue by booth</CardDescription>
              </CardHeader>
              <CardContent>
                {boothStats.length > 0 ? (
                  <div className="space-y-2">
                    {boothStats
                      .sort((a, b) => b.earnings - a.earnings)
                      .map((booth, index) => (
                        <div 
                          key={booth.name} 
                          className={`p-3 rounded-md flex justify-between items-center ${
                            index === 0 ? 'bg-amber-100' :
                            index === 1 ? 'bg-gray-100' :
                            index === 2 ? 'bg-amber-50' : 'bg-white border'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold
                              ${index === 0 ? 'bg-amber-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-400 text-amber-900' : 'bg-gray-200'
                              }`}
                            >
                              {index + 1}
                            </div>
                            <span className="font-medium">{booth.name}</span>
                          </div>
                          <span className="font-semibold">${booth.earnings.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>No booth data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SACDashboard;
