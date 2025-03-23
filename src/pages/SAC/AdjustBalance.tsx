
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from '@/contexts/TransactionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { toast } from 'sonner';
import { UserCheck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

const AdjustBalance = () => {
  const [studentNumber, setStudentNumber] = useState('');
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const { adjustUserBalance } = useTransactions();
  const navigate = useNavigate();
  
  const handleSearchUser = async () => {
    if (!studentNumber) {
      toast.error('Please enter a student number');
      return;
    }
    
    setIsSearching(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('student_number', studentNumber)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setSearchedUser({
          id: data.id,
          name: data.name,
          studentNumber: data.student_number,
          email: data.email,
          role: data.role,
          balance: data.tickets / 100,
          booths: data.booth_access || []
        });
      }
    } catch (error) {
      console.error('Error searching user:', error);
      toast.error('Student not found');
      setSearchedUser(null);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleAdjustBalance = async () => {
    if (!searchedUser) {
      toast.error('Please search for a student first');
      return;
    }
    
    if (!newBalance) {
      toast.error('Please enter a new balance');
      return;
    }
    
    if (!verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }
    
    const balanceAmount = parseFloat(newBalance);
    
    if (isNaN(balanceAmount) || balanceAmount < 0) {
      toast.error('Please enter a valid balance amount');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const success = await adjustUserBalance(
        searchedUser.id,
        balanceAmount,
        verificationCode
      );
      
      if (success) {
        toast.success('Balance adjusted successfully');
        navigate('/sac/dashboard');
      }
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast.error('Failed to adjust balance');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Layout title="Adjust Student Balance" showBack>
      <div className="w-full max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Adjust Student Balance</CardTitle>
            <CardDescription>
              Manually adjust a student's account balance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-number">Student Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="student-number"
                  type="text"
                  placeholder="Enter student number"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                />
                <Button 
                  onClick={handleSearchUser} 
                  disabled={isSearching || !studentNumber}
                  className="shrink-0"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
            </div>
            
            {searchedUser && (
              <div className="bg-muted p-3 rounded-md">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Student Found</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {searchedUser.name}</p>
                  <p><span className="text-muted-foreground">ID:</span> {searchedUser.studentNumber}</p>
                  <p><span className="text-muted-foreground">Current Balance:</span> ${searchedUser.balance.toFixed(2)}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="new-balance">New Balance (CAD)</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-muted-foreground">$</span>
                </div>
                <Input
                  id="new-balance"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="pl-7"
                  disabled={!searchedUser}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="password"
                placeholder="Enter verification code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                disabled={!searchedUser}
              />
              <p className="text-xs text-muted-foreground">
                Admin verification required to adjust balance
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-md text-sm mt-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>Warning: This will permanently modify the student's balance. This action cannot be undone.</p>
            </div>
            
            <Button
              onClick={handleAdjustBalance}
              disabled={isProcessing || !searchedUser || !newBalance || !verificationCode}
              className="w-full mt-4"
            >
              {isProcessing ? 'Processing...' : 'Adjust Balance'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdjustBalance;
