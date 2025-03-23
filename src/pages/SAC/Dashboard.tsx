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

const SACDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    getSACTransactions, 
    getLeaderboard, 
    processPayment, 
    addFunds, 
    booths, 
    loadBooths 
  } = useTransactions();
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [amount, setAmount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    if (user && user.role === 'sac') {
      loadBooths();
      const allTransactions = getSACTransactions();
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      
      const boothLeaderboard = getLeaderboard();
      setLeaderboard(boothLeaderboard);
    }
  }, [user]);
  
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
      const newBalance = await addFunds(studentId, amountValue, user.id);
      
      if (newBalance > 0) {
        setIsAddFundsOpen(false);
        setStudentId('');
        setAmount('');
        toast.success(`Successfully added $${amountValue.toFixed(2)} to account`);
        
        // Refresh transactions
        const allTransactions = getSACTransactions();
        setTransactions(allTransactions);
        setFilteredTransactions(allTransactions);
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
    }
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
      <h1 className="text-3xl font-bold mb-6">SAC Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Transactions</CardTitle>
            <CardDescription>All transactions in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Booths</CardTitle>
            <CardDescription>Active booths in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{booths.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>All funds processed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">
              {formatCurrency(
                transactions.reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end mb-6">
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
      
      <Tabs defaultValue="transactions">
        <TabsList className="mb-6">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="leaderboard">Booth Leaderboard</TabsTrigger>
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
                          {formatCurrency(transaction.amount)}
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
                          {formatCurrency(booth.earnings)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SACDashboard;
