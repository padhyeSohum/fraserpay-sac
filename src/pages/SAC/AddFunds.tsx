
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

const AddFunds = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser } = useAuth();

  // Get users from local storage
  const getUsers = () => {
    try {
      const usersStr = localStorage.getItem('users');
      return usersStr ? JSON.parse(usersStr) : [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const users = getUsers();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      toast.error('Please select a user and enter a valid amount');
      return;
    }

    setIsLoading(true);

    // Find the selected user
    const targetUser = users.find((u: any) => u.id === selectedUser);
    if (!targetUser) {
      toast.error('User not found');
      setIsLoading(false);
      return;
    }

    try {
      // Update user balance
      const updatedUsers = users.map((u: any) => {
        if (u.id === selectedUser) {
          return {
            ...u,
            balance: u.balance + parseFloat(amount)
          };
        }
        return u;
      });

      // Create a transaction record
      const newTransaction = {
        id: uuidv4(),
        timestamp: Date.now(),
        buyerId: targetUser.id,
        buyerName: targetUser.name,
        studentNumber: targetUser.studentNumber,
        amount: parseFloat(amount),
        type: 'fund',
        sacMemberId: currentUser?.id,
        sacMemberName: currentUser?.name
      };

      // Get existing transactions
      const transactionsStr = localStorage.getItem('transactions');
      const transactions = transactionsStr ? JSON.parse(transactionsStr) : [];
      
      // Save updated data
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      localStorage.setItem('transactions', JSON.stringify([...transactions, newTransaction]));

      toast.success(`Successfully added $${amount} to ${targetUser.name}'s account`);
      setSelectedUser('');
      setAmount('');
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('An error occurred while adding funds');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Add Funds">
      <div className="container px-4 py-6 mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">Add Funds to Student Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="user" className="text-sm font-medium">Select Student</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u: any) => u.role === 'student')
                      .map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.studentNumber})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">Amount (CAD)</label>
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

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Add Funds"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AddFunds;
