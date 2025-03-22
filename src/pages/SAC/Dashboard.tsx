
import React, { useState } from 'react';
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

const SACDashboard = () => {
  const { user } = useAuth();
  const { transactions, addFunds } = useTransactions();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('add-tickets');
  const [studentNumber, setStudentNumber] = useState('');
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is SAC member
  React.useEffect(() => {
    if (user && user.role !== 'sac') {
      toast.error('You do not have access to this page');
      navigate('/dashboard');
    }
  }, [user, navigate]);

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
    } else {
      toast.error('Student not found');
      setFoundUser(null);
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
        
        toast.success(`Added $${parseFloat(amount).toFixed(2)} to ${foundUser.name}'s account`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to add funds');
    } finally {
      setIsLoading(false);
    }
  };

  // Get recent transactions
  const recentTransactions = [...transactions]
    .filter(t => t.type === 'fund')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return (
    <Layout 
      title="SAC Admin" 
      subtitle="Ticket Management" 
      showBack 
      showLogout
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="add-tickets" className="tab-button">Add Tickets</TabsTrigger>
          <TabsTrigger value="transactions" className="tab-button">Transactions</TabsTrigger>
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
            <h2 className="text-lg font-semibold">Recent Ticket Purchases</h2>
            
            {recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
              </div>
            )}
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
