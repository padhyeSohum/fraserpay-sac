
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
import { useTransaction } from '@/contexts/transactions/hooks/useTransaction';
import { triggerEmailProcessing } from '@/utils/emailProcessor';

interface FundsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  studentId: string;
  onSubmit: (studentId: string, amount: number) => Promise<void>;
  readOnlyId?: boolean;
}

const FundsDialog: React.FC<FundsDialogProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = 'default',
  studentId,
  onSubmit,
  readOnlyId = false
}) => {
  const [localStudentId, setLocalStudentId] = useState(studentId);
  const [studentNumber, setStudentNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const { findUserByStudentNumber } = useTransaction();

  useEffect(() => {
    setLocalStudentId(studentId);
    if (!isOpen) {
      setStudentNumber('');
      setAmount('');
      setFoundStudent(null);
    }
  }, [studentId, isOpen]);

  const handleFindByStudentNumber = async () => {
    if (!studentNumber.trim()) {
      toast.error('Please enter a student number');
      return;
    }

    setIsSearching(true);
    
    try {
      const user = await findUserByStudentNumber(studentNumber);
      
      if (user) {
        setLocalStudentId(user.id);
        setFoundStudent({
          name: user.name,
          balance: user.balance
        });
        toast.success(`Found student: ${user.name}`);
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

  const handleSubmit = async () => {
    if (localStudentId && amount) {
      try {
        await onSubmit(localStudentId, parseFloat(amount));
        
        try {
          console.log('Processing email notifications after funds transaction');
          // Explicitly trigger email processing after a transaction
          await triggerEmailProcessing();
        } catch (emailError) {
          console.error('Error processing email notifications:', emailError);
        }
        
        setAmount('');
        
        if (!readOnlyId) {
          setStudentNumber('');
          setFoundStudent(null);
          setLocalStudentId('');
        }
        
        // Close the dialog after successful submission
        onOpenChange(false);
      } catch (error) {
        console.error('Error submitting transaction:', error);
        toast.error('Failed to process transaction');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {!readOnlyId && (
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
                  <p><strong>Current Balance:</strong> ${foundStudent.balance.toFixed(2)}</p>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="studentId" className="text-right">
              Student ID
            </Label>
            <Input
              id="studentId"
              value={localStudentId}
              onChange={(e) => setLocalStudentId(e.target.value)}
              className="col-span-3"
              readOnly={readOnlyId || foundStudent !== null}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant={confirmVariant} 
            onClick={handleSubmit}
            disabled={!localStudentId || !amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FundsDialog;
