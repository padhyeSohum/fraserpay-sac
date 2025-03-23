
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/utils/api';
import { QueryObserverResult, RefetchOptions } from '@tanstack/react-query';

interface FundsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  student: any;
  refetchStudents: (options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>;
}

const FundsDialog: React.FC<FundsDialogProps> = ({
  isOpen,
  onOpenChange,
  student,
  refetchStudents
}) => {
  const [studentId, setStudentId] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);

  // Sync studentId with local state when it changes
  useEffect(() => {
    if (student) {
      setStudentId(student.id || '');
      setFoundStudent(student);
    } else {
      setStudentId('');
    }
    
    // Reset student info when dialog opens/closes
    if (!isOpen) {
      setStudentNumber('');
      setAmount('');
      setFoundStudent(null);
    }
  }, [student, isOpen]);

  const handleFindByStudentNumber = async () => {
    if (!studentNumber.trim()) {
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
        console.error('Error finding student:', error);
        toast.error('Error finding student');
        return;
      }
      
      if (data) {
        setStudentId(data.id);
        setFoundStudent({
          name: data.name,
          balance: data.tickets / 100
        });
        toast.success(`Found student: ${data.name}`);
      } else {
        toast.error('No student found with that student number');
      }
    } catch (error) {
      console.error('Error finding student:', error);
      toast.error('Error finding student');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFunds = async () => {
    if (!studentId || !amount) {
      toast.error('Student ID and amount are required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.post(`/students/${studentId}/funds`, { 
        amount: parseFloat(amount) 
      });
      
      toast.success('Funds added successfully!');
      await refetchStudents();
      onOpenChange(false);
      
      // Reset form
      setAmount('');
      setStudentNumber('');
      setFoundStudent(null);
    } catch (error) {
      console.error('Error adding funds:', error);
      toast.error('Failed to add funds');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
          <DialogDescription>
            Add funds to a student's account.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!student && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="studentNumber" className="text-right">
                  Student Number
                </Label>
                <div className="col-span-3 flex gap-2">
                  <Input
                    id="studentNumber"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    placeholder="Enter student number"
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleFindByStudentNumber}
                    disabled={isSearching || !studentNumber.trim()}
                    className="shrink-0"
                  >
                    {isSearching ? 'Searching...' : 'Find'}
                  </Button>
                </div>
              </div>

              {foundStudent && (
                <div className="px-4 py-2 rounded-md bg-muted/50">
                  <p><strong>Name:</strong> {foundStudent.name}</p>
                  <p><strong>Current Balance:</strong> ${foundStudent.balance?.toFixed(2) || '0.00'}</p>
                </div>
              )}
            </>
          )}

          {(student || foundStudent) && (
            <div className="px-4 py-2 rounded-md bg-muted/50">
              <p><strong>Name:</strong> {student?.name || foundStudent?.name}</p>
              <p><strong>Current Balance:</strong> ${(student?.balance || foundStudent?.balance || 0).toFixed(2)}</p>
            </div>
          )}
          
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddFunds}
            disabled={!studentId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isSubmitting}
          >
            {isSubmitting ? 'Adding Funds...' : 'Add Funds'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FundsDialog;
