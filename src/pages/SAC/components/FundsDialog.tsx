
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FundsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  studentId: string;
  onSubmit: (studentId: string, amount: number, reason?: string) => Promise<void>;
  readOnlyId?: boolean;
}

// Add cooldown tracking
const lastTransactionTimes: Record<string, number> = {};
const COOLDOWN_PERIOD = 10000; // 10 seconds in milliseconds
const MAX_ADD_AMOUNT = 50; // Maximum $50 add limit
const COPRESIDENT_PIN = "1234"; // Secure PIN for override (in production, this would be stored securely)

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
  const [reason, setReason] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundStudent, setFoundStudent] = useState<any>(null);
  const [pinCode, setPinCode] = useState('');
  const [needsOverride, setNeedsOverride] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [overrideReason, setOverrideReason] = useState<string | null>(null);
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    setLocalStudentId(studentId);
    // Reset student info when dialog opens/closes
    if (!isOpen) {
      setStudentNumber('');
      setAmount('');
      setReason('');
      setFoundStudent(null);
      setPinCode('');
      setShowPinInput(false);
      setNeedsOverride(false);
      setOverrideReason(null);
    }
  }, [studentId, isOpen]);

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
        setLocalStudentId(data.id);
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

  const checkRestrictions = (): boolean => {
    const numAmount = parseFloat(amount);
    const isAddingFunds = numAmount > 0;
    const isRefund = numAmount < 0;
    
    // Check if user is adding funds to themselves (not permitted)
    if (isAddingFunds && foundStudent?.isSelfTransaction) {
      setOverrideReason("Users cannot add funds to their own accounts");
      setNeedsOverride(true);
      return false;
    }
    
    // Check max amount restriction ($50)
    if (isAddingFunds && numAmount > MAX_ADD_AMOUNT && !showPinInput) {
      setOverrideReason(`Cannot add more than $${MAX_ADD_AMOUNT} in a single transaction`);
      setNeedsOverride(true);
      return false;
    }
    
    // Check cooldown period
    const lastTransactionTime = lastTransactionTimes[localStudentId] || 0;
    const currentTime = Date.now();
    const timeSinceLastTransaction = currentTime - lastTransactionTime;
    
    if (isAddingFunds && timeSinceLastTransaction < COOLDOWN_PERIOD && !showPinInput) {
      const remainingSeconds = Math.ceil((COOLDOWN_PERIOD - timeSinceLastTransaction) / 1000);
      setOverrideReason(`Please wait ${remainingSeconds} seconds before adding funds to this user again`);
      setNeedsOverride(true);
      return false;
    }
    
    // Always require PIN verification for refunds
    if (isRefund && !showPinInput) {
      setOverrideReason("Copresident PIN required to process refunds");
      setNeedsOverride(true);
      return false;
    }
    
    // Check reason requirement for refunds
    if (isRefund && !reason.trim() && !showPinInput) {
      setOverrideReason("A reason is required for processing refunds");
      setNeedsOverride(true);
      return false;
    }
    
    return true;
  };

  const handlePinSubmit = () => {
    if (pinCode === COPRESIDENT_PIN) {
      setShowPinInput(true);
      setNeedsOverride(false);
      toast.success("PIN accepted. Override enabled.");
    } else {
      toast.error("Invalid PIN. Please try again or contact a copresident.");
    }
  };

  const handleSubmit = async () => {
    if (needsOverride) {
      setShowPinInput(true);
      return;
    }
    
    if (localStudentId && amount) {
      try {
        const amountNum = parseFloat(amount);
        
        // If not in override mode, check restrictions
        if (!showPinInput && !checkRestrictions()) {
          return;
        }

        // Record transaction time for cooldown
        lastTransactionTimes[localStudentId] = Date.now();
        
        // Pass reason only if it's a refund or if a reason was provided
        const isRefund = amountNum < 0;
        const reasonToUse = isRefund ? reason : (reason.trim() ? reason : undefined);
        await onSubmit(localStudentId, amountNum, reasonToUse);
        
        // Clear form fields after successful submission
        setAmount('');
        setReason('');
        
        // If this was a new student search (not pre-filled), reset the student info
        if (!readOnlyId) {
          setStudentNumber('');
          setFoundStudent(null);
          setLocalStudentId('');
        }
        
        // Reset override state
        setPinCode('');
        setShowPinInput(false);
        
      } catch (error) {
        console.error('Error submitting transaction:', error);
      }
    }
  };

  const renderRestrictionOverride = () => {
    if (!needsOverride) return null;
    
    return (
      <div className="space-y-4 my-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {overrideReason}
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="pinCode" className="text-right">
            Copresident PIN
          </Label>
          <div className="col-span-3 flex gap-2">
            <Input
              id="pinCode"
              type="password"
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
              placeholder="Enter override PIN"
              className="flex-1"
            />
            <Button 
              onClick={handlePinSubmit}
              disabled={!pinCode}
              className="shrink-0"
            >
              Override
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderPinNotification = () => {
    if (!showPinInput) return null;
    
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <Info className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-600">
          Override active: restrictions have been bypassed
        </AlertDescription>
      </Alert>
    );
  };

  // Check if the current operation is a refund based on the amount
  const isRefund = parseFloat(amount) < 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {renderPinNotification()}
        
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
          
          {/* Add reason field - required for refunds */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right">
              Reason
              {isRefund && !showPinInput && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isRefund ? "Required for refunds" : "Optional for deposits"}
              className="col-span-3 min-h-[80px]"
            />
          </div>
          
          {renderRestrictionOverride()}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant={confirmVariant} 
            onClick={handleSubmit}
            disabled={
              !localStudentId || 
              !amount || 
              isNaN(parseFloat(amount)) || 
              parseFloat(amount) === 0 ||
              (isRefund && !reason.trim() && !showPinInput)
            }
          >
            {needsOverride ? "Enter Override PIN" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FundsDialog;
